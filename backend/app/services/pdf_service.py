import os
from pathlib import Path
from typing import List, Dict, Any, Tuple
import pymupdf as fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import settings
from app.utils.helpers import clean_text

class PDFService:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def extract_text_by_pages(self, file_path: Path) -> Tuple[List[Dict[str, Any]], str, int]:
        """
        Extract text page-by-page using PyMuPDF.
        Returns:
            pages_data: list of dicts with {"page_number": int, "text": str}
            inferred_title: str
            total_pages: int
        """
        if not file_path.exists():
            raise FileNotFoundError(f"PDF file not found at {file_path}")

        pages_data = []
        doc = fitz.open(file_path)
        total_pages = len(doc)
        
        if total_pages == 0:
            doc.close()
            raise ValueError("The PDF document contains 0 pages.")

        # Attempt to get title from PDF metadata
        meta = doc.metadata or {}
        inferred_title = meta.get("title", "").strip()

        first_page_text = ""

        for page_idx in range(total_pages):
            page = doc.load_page(page_idx)
            raw_text = page.get_text("text")
            cleaned = clean_text(raw_text)
            
            if page_idx == 0:
                first_page_text = cleaned

            pages_data.append({
                "page_number": page_idx + 1,
                "text": cleaned
            })

        doc.close()

        # If metadata title is empty, infer from first lines of first page
        if not inferred_title and first_page_text:
            lines = [l.strip() for l in first_page_text.split("\n") if len(l.strip()) > 3]
            if lines:
                # First non-trivial line often contains the title
                inferred_title = lines[0][:150]
        
        if not inferred_title:
            inferred_title = file_path.stem.replace("_", " ").title()

        return pages_data, inferred_title, total_pages

    def process_and_chunk(
        self,
        document_id: str,
        filename: str,
        file_path: Path
    ) -> Tuple[List[Dict[str, Any]], str, int]:
        """
        Extracts, cleans, and chunks the PDF.
        Returns:
            chunks: List of dicts with {"text": str, "metadata": Dict}
            title: str
            total_pages: int
        """
        pages_data, title, total_pages = self.extract_text_by_pages(file_path)

        all_text = "".join(p["text"] for p in pages_data)
        if not all_text.strip():
            raise ValueError(
                "No readable text could be extracted from this PDF. "
                "It may be a scanned image or empty. OCR is required for scanned documents."
            )

        chunks: List[Dict[str, Any]] = []
        chunk_counter = 0

        for page_info in pages_data:
            page_text = page_info["text"]
            page_num = page_info["page_number"]
            
            if not page_text:
                continue

            page_splits = self.text_splitter.split_text(page_text)
            for split_text in page_splits:
                if len(split_text.strip()) < 15:  # skip tiny noisy chunks
                    continue
                
                chunk_counter += 1
                chunk_id = f"{document_id}_p{page_num}_c{chunk_counter}"
                chunks.append({
                    "id": chunk_id,
                    "text": split_text,
                    "metadata": {
                        "document_id": document_id,
                        "filename": filename,
                        "title": title,
                        "page_number": page_num,
                        "chunk_index": chunk_counter
                    }
                })

        # Fallback if per-page chunking produced 0 chunks due to filter
        if not chunks and all_text.strip():
            raw_splits = self.text_splitter.split_text(all_text)
            for i, split_text in enumerate(raw_splits):
                chunk_id = f"{document_id}_c{i+1}"
                chunks.append({
                    "id": chunk_id,
                    "text": split_text,
                    "metadata": {
                        "document_id": document_id,
                        "filename": filename,
                        "title": title,
                        "page_number": 1,
                        "chunk_index": i + 1
                    }
                })

        return chunks, title, total_pages

pdf_service = PDFService()
