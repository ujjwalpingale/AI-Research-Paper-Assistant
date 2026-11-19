from fastapi import APIRouter, HTTPException, Query
from app.schemas.request_models import SummaryResponse
from app.services.summary_service import summary_service
from app.utils.helpers import metadata_store

router = APIRouter(prefix="/api/summary", tags=["Summary"])

@router.post("/{document_id}", response_model=SummaryResponse)
def generate_paper_summary(
    document_id: str,
    force_regenerate: bool = Query(default=False, description="Re-run LLM even if cached")
):
    """
    Generate or retrieve a 10-point structured summary for an academic paper.
    """
    doc = metadata_store.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        summary = summary_service.generate_summary(
            document_id=document_id,
            force_regenerate=force_regenerate
        )
        return SummaryResponse(
            document_id=document_id,
            filename=doc.get("filename", ""),
            summary=summary
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@router.get("/{document_id}", response_model=SummaryResponse)
def get_paper_summary(document_id: str):
    """
    Get existing structured summary for a document.
    """
    doc = metadata_store.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    summary_data = doc.get("summary")
    if not summary_data:
        # Generate on the fly
        try:
            summary = summary_service.generate_summary(document_id=document_id)
            return SummaryResponse(
                document_id=document_id,
                filename=doc.get("filename", ""),
                summary=summary
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

    return SummaryResponse(
        document_id=document_id,
        filename=doc.get("filename", ""),
        summary=summary_data
    )
