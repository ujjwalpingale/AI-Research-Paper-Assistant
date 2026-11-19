from fastapi import APIRouter, HTTPException
from app.schemas.request_models import ComparisonRequest, ComparisonResponse
from app.services.comparison_service import comparison_service

router = APIRouter(prefix="/api/compare", tags=["Comparison"])

@router.post("", response_model=ComparisonResponse)
def compare_papers(request: ComparisonRequest):
    """
    Generate an in-depth structured comparison between two research papers.
    """
    try:
        result = comparison_service.compare_papers(
            doc_id_1=request.document_id_1,
            doc_id_2=request.document_id_2
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")
