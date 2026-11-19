from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.request_models import (
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    ChatHistoryMessage
)
from app.services.rag_service import rag_service
from app.utils.helpers import metadata_store

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
def chat_with_papers(request: ChatRequest):
    """
    Query indexed research papers using RAG.
    Optionally pass paper_ids to scope retrieval to specific documents.
    """
    try:
        response = rag_service.answer_question(
            question=request.question,
            paper_ids=request.paper_ids,
            session_id=request.session_id or "default"
        )
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")

@router.get("/history", response_model=ChatHistoryResponse)
def get_history(session_id: str = Query(default="default")):
    """Retrieve chat conversation history for a given session."""
    raw_history = metadata_store.get_chat_history(session_id)
    messages = []
    for m in raw_history:
        messages.append(ChatHistoryMessage(
            role=m.get("role", "user"),
            content=m.get("content", ""),
            sources=m.get("sources"),
            timestamp=m.get("timestamp", "")
        ))
    return ChatHistoryResponse(
        session_id=session_id,
        messages=messages
    )

@router.delete("/history")
def clear_history(session_id: str = Query(default="default")):
    """Clear conversation history for a session."""
    metadata_store.clear_chat_history(session_id)
    return {"message": f"Chat history for session '{session_id}' cleared."}
