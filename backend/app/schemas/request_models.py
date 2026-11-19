from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Document Models ---

class StructuredSummary(BaseModel):
    title: str = Field(default="", description="Research title")
    objectives: str = Field(default="", description="Research objectives")
    problem_statement: str = Field(default="", description="Problem statement")
    methodology: str = Field(default="", description="Methodology")
    algorithms_and_technologies: str = Field(default="", description="Technologies or algorithms used")
    dataset_information: str = Field(default="", description="Dataset information")
    key_findings: str = Field(default="", description="Key findings")
    results: str = Field(default="", description="Results")
    limitations: str = Field(default="", description="Limitations")
    future_scope: str = Field(default="", description="Future scope")
    raw_markdown: Optional[str] = Field(default=None, description="Full formatted markdown text")

class DocumentMetadata(BaseModel):
    id: str
    filename: str
    title: str
    file_path: str
    file_size_bytes: int
    total_pages: int
    total_chunks: int
    upload_date: str
    status: str = Field(default="processed", description="uploaded, processing, processed, error")
    summary: Optional[StructuredSummary] = None
    error_message: Optional[str] = None

class DocumentUploadResponse(BaseModel):
    message: str
    documents: List[DocumentMetadata]

class DocumentDetailResponse(BaseModel):
    document: DocumentMetadata
    sample_chunks: List[Dict[str, Any]] = []

# --- Chat Models ---

class SourceCitation(BaseModel):
    document_id: str
    filename: str
    page_number: int
    chunk_index: int
    snippet: str
    score: Optional[float] = None

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question about the research paper(s)")
    paper_ids: Optional[List[str]] = Field(default=None, description="Filter question to specific paper IDs")
    session_id: Optional[str] = Field(default="default", description="Conversation session ID")

class ChatHistoryMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str
    sources: Optional[List[SourceCitation]] = None
    timestamp: str

class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: List[SourceCitation] = []
    session_id: str

class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: List[ChatHistoryMessage]

# --- Summary Models ---

class SummaryResponse(BaseModel):
    document_id: str
    filename: str
    summary: StructuredSummary

# --- Comparison Models ---

class ComparisonRequest(BaseModel):
    document_id_1: str = Field(..., description="First document ID")
    document_id_2: str = Field(..., description="Second document ID")

class ComparisonCategory(BaseModel):
    category: str
    paper_1_detail: str
    paper_2_detail: str
    comparison_analysis: str

class ComparisonResponse(BaseModel):
    paper_1_id: str
    paper_1_title: str
    paper_2_id: str
    paper_2_title: str
    categories: List[ComparisonCategory]
    similarities: List[str]
    differences: List[str]
    advantages_paper_1: List[str]
    advantages_paper_2: List[str]
    limitations_paper_1: List[str]
    limitations_paper_2: List[str]
    comprehensive_report: str

# --- Health Model ---

class HealthResponse(BaseModel):
    status: str
    gemini_configured: bool
    total_documents: int
    vector_db_ready: bool
    embedding_model: str
    chat_model: str
