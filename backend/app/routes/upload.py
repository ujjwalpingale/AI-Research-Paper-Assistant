import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from app.config import settings
from app.schemas.request_models import (
    DocumentMetadata,
    DocumentUploadResponse,
    DocumentDetailResponse
)
from app.utils.helpers import (
    ensure_directories,
    generate_id,
    get_current_iso_timestamp,
    sanitize_filename,
    metadata_store
)
from app.services.pdf_service import pdf_service
from app.services.vector_service import vector_service

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentUploadResponse)
def upload_documents(
    files: List[UploadFile] = File(..., description="PDF files to upload and index")
):
    """
    Upload one or multiple research papers in PDF format.
    Extracts text, splits into chunks, computes Gemini embeddings,
    and stores vectors in ChromaDB.
    """
    ensure_directories()
    processed_docs: List[DocumentMetadata] = []
    errors: List[str] = []

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            errors.append(f"Skipping '{file.filename}': Only PDF files are allowed.")
            continue

        safe_fname = sanitize_filename(file.filename)
        
        # Check if already indexed with identical name and processed status
        existing_docs = metadata_store.get_all_documents()
        duplicate = next((d for d in existing_docs if d.get("filename") == safe_fname and d.get("status") == "processed"), None)
        if duplicate:
            processed_docs.append(DocumentMetadata(**duplicate))
            continue

        doc_id = generate_id()
        file_save_path = settings.upload_absolute_path / f"{doc_id}_{safe_fname}"

        # Write uploaded file to disk
        try:
            with open(file_save_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            errors.append(f"Failed to save '{file.filename}': {str(e)}")
            continue

        file_size = file_save_path.stat().st_size
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            if file_save_path.exists():
                file_save_path.unlink()
            errors.append(f"File '{file.filename}' exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.")
            continue

        # Extract & chunk
        try:
            chunks, title, total_pages = pdf_service.process_and_chunk(
                document_id=doc_id,
                filename=safe_fname,
                file_path=file_save_path
            )

            # Index into ChromaDB
            vector_service.add_chunks(chunks)

            doc_meta_dict = {
                "id": doc_id,
                "filename": safe_fname,
                "title": title,
                "file_path": str(file_save_path),
                "file_size_bytes": file_size,
                "total_pages": total_pages,
                "total_chunks": len(chunks),
                "upload_date": get_current_iso_timestamp(),
                "status": "processed",
                "summary": None,
                "error_message": None
            }

            metadata_store.save_document(doc_meta_dict)
            processed_docs.append(DocumentMetadata(**doc_meta_dict))

        except Exception as e:
            err_msg = str(e)
            print(f"Error processing {file.filename}: {err_msg}")
            # Save partial error record
            doc_meta_dict = {
                "id": doc_id,
                "filename": safe_fname,
                "title": safe_fname,
                "file_path": str(file_save_path),
                "file_size_bytes": file_size,
                "total_pages": 0,
                "total_chunks": 0,
                "upload_date": get_current_iso_timestamp(),
                "status": "error",
                "summary": None,
                "error_message": err_msg
            }
            metadata_store.save_document(doc_meta_dict)
            errors.append(f"Error processing '{file.filename}': {err_msg}")

    if not processed_docs and errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="; ".join(errors)
        )

    msg = f"Successfully processed {len(processed_docs)} document(s)."
    if errors:
        msg += f" Note: {'; '.join(errors)}"

    return DocumentUploadResponse(
        message=msg,
        documents=processed_docs
    )

@router.get("", response_model=List[DocumentMetadata])
def list_documents():
    """Get all uploaded research papers."""
    docs = metadata_store.get_all_documents()
    return [DocumentMetadata(**d) for d in docs]

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document_details(document_id: str):
    """Get document metadata and sample chunks."""
    doc = metadata_store.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    samples = vector_service.get_document_sample_chunks(document_id, limit=3)
    return DocumentDetailResponse(
        document=DocumentMetadata(**doc),
        sample_chunks=samples
    )

@router.get("/{document_id}/file")
def get_document_file(document_id: str):
    """Download/view the original PDF file."""
    doc = metadata_store.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    path = Path(doc["file_path"])
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=path,
        filename=doc["filename"],
        media_type="application/pdf"
    )

@router.delete("/{document_id}")
def delete_document(document_id: str):
    """Delete a research paper, its local PDF file, and its ChromaDB vectors."""
    doc = metadata_store.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # 1. Delete Chroma vectors
    vector_service.delete_document_vectors(document_id)

    # 2. Delete local PDF file
    file_path = Path(doc.get("file_path", ""))
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            print(f"Warning: could not delete file {file_path}: {e}")

    # 3. Remove metadata entry
    metadata_store.delete_document(document_id)

    return {"message": f"Document '{doc.get('filename')}' and associated vector embeddings successfully deleted."}
