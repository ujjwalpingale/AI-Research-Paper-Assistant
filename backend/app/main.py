from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.utils.helpers import ensure_directories, metadata_store
from app.services.vector_service import vector_service
from app.schemas.request_models import HealthResponse
from app.routes import upload, chat, summary, comparison

ensure_directories()

app = FastAPI(
    title="AI Research Paper Assistant API",
    description="RAG-powered backend for academic paper processing, vector search, Q&A, structured summarization, and multi-paper comparison using Google Gemini.",
    version="1.0.0"
)

# CORS configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(upload.router)
app.include_router(chat.router)
app.include_router(summary.router)
app.include_router(comparison.router)

@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Check health and readiness of the backend services."""
    has_gemini = bool(settings.GEMINI_API_KEY.strip())
    vdb_ready = vector_service.is_ready()
    docs = metadata_store.get_all_documents()

    return HealthResponse(
        status="healthy" if (vdb_ready) else "degraded",
        gemini_configured=has_gemini,
        total_documents=len(docs),
        vector_db_ready=vdb_ready,
        embedding_model=settings.GEMINI_EMBEDDING_MODEL,
        chat_model=settings.GEMINI_CHAT_MODEL
    )

@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "AI Research Paper Assistant API",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }
