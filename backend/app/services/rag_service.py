from typing import List, Dict, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.config import settings
from app.services.vector_service import vector_service
from app.utils.helpers import metadata_store, get_current_iso_timestamp
from app.schemas.request_models import SourceCitation, ChatResponse

class RAGService:
    def __init__(self):
        self._llm: Optional[ChatGoogleGenerativeAI] = None
        self._active_model_name: Optional[str] = None

    def _get_llm(self) -> ChatGoogleGenerativeAI:
        api_key = settings.GEMINI_API_KEY.strip()
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY is not configured. Please set your GEMINI_API_KEY in backend/.env"
            )

        model_name = settings.GEMINI_CHAT_MODEL.strip()
        if self._llm is None or self._active_model_name != model_name:
            self._llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=api_key,
                temperature=0.2,
                max_output_tokens=2048,
            )
            self._active_model_name = model_name

        return self._llm

    def answer_question(
        self,
        question: str,
        paper_ids: Optional[List[str]] = None,
        session_id: str = "default"
    ) -> ChatResponse:
        """
        Execute the complete RAG query pipeline:
        1. Query ChromaDB for top relevant chunks (filtered by paper_ids if specified).
        2. Format context with source metadata.
        3. Include conversation history.
        4. Generate grounded response using Gemini Flash.
        5. Return response with verified citations.
        """
        clean_question = question.strip()
        if not clean_question:
            raise ValueError("Question cannot be empty.")

        # 1. Similarity Retrieval
        matched_chunks = vector_service.similarity_search(
            query=clean_question,
            paper_ids=paper_ids,
            top_k=settings.TOP_K_RESULTS
        )

        # Build citations list
        citations: List[SourceCitation] = []
        context_parts: List[str] = []

        for idx, item in enumerate(matched_chunks):
            meta = item.get("metadata", {})
            text = item.get("text", "")
            doc_id = meta.get("document_id", "unknown")
            fname = meta.get("filename", "unknown.pdf")
            page = int(meta.get("page_number", 1))
            chunk_idx = int(meta.get("chunk_index", idx + 1))
            score = item.get("score")

            citations.append(SourceCitation(
                document_id=doc_id,
                filename=fname,
                page_number=page,
                chunk_index=chunk_idx,
                snippet=text[:250].strip() + ("..." if len(text) > 250 else ""),
                score=score
            ))

            context_parts.append(
                f"[Source Document: {fname} | Page: {page}]\n{text}"
            )

        if not matched_chunks:
            no_context_answer = (
                "I could not find any relevant information in the selected research paper(s) "
                "to answer your question. Please ensure the papers are uploaded and indexed, "
                "or try rephrasing your question."
            )
            # Record user message & assistant message
            now = get_current_iso_timestamp()
            metadata_store.append_chat_message(session_id, {
                "role": "user",
                "content": clean_question,
                "timestamp": now
            })
            metadata_store.append_chat_message(session_id, {
                "role": "assistant",
                "content": no_context_answer,
                "sources": [],
                "timestamp": now
            })
            return ChatResponse(
                question=clean_question,
                answer=no_context_answer,
                sources=[],
                session_id=session_id
            )

        context_str = "\n\n---\n\n".join(context_parts)

        # 2. Build conversation history
        history = metadata_store.get_chat_history(session_id)
        # Take the last 6 messages for context
        recent_history = history[-6:] if history else []

        messages = [
            SystemMessage(content=(
                "You are an expert AI Research Assistant specialized in academic literature and scientific papers.\n"
                "Your role is to answer questions strictly grounded in the provided document contexts.\n\n"
                "Rules:\n"
                "1. Base your answer ONLY on the provided context passages below.\n"
                "2. If the answer cannot be determined from the provided context, explicitly state: "
                "'The provided research paper(s) do not contain information regarding this topic.'\n"
                "3. Never hallucinate facts, equations, or citations not present in the text.\n"
                "4. When mentioning findings, methods, or metrics, cite the document name and page number "
                "in parentheses (e.g., [Attention Is All You Need, p. 4]).\n"
                "5. Maintain a clear, academic, and well-structured Markdown response (use headings, bullet points, and bold text where appropriate)."
            ))
        ]

        # Append recent history
        for msg in recent_history:
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("role") == "assistant":
                messages.append(AIMessage(content=msg.get("content", "")))

        # Append current user prompt with context
        user_prompt = (
            f"Context from uploaded research papers:\n\n{context_str}\n\n"
            f"User Question: {clean_question}\n\n"
            f"Please provide an accurate, grounded response based strictly on the above context."
        )
        messages.append(HumanMessage(content=user_prompt))

        # 3. Call LLM (or provide grounded response if GEMINI_API_KEY is not yet added)
        api_key = settings.GEMINI_API_KEY.strip()
        if not api_key or api_key == "your_gemini_api_key_here" or len(api_key) < 10:
            top_snippet = citations[0].snippet if citations else ""
            top_source = f"{citations[0].filename} (Page {citations[0].page_number})" if citations else "the document"
            answer_text = (
                f"### Context Grounded Findings\n\n"
                f"Based on the retrieved passages from **{top_source}**:\n\n"
                f"> \"{top_snippet}\"\n\n"
                f"---\n"
                f"*Note: Please add your `GEMINI_API_KEY` to `backend/.env` to enable full conversational LLM generation via `{settings.GEMINI_CHAT_MODEL}`.*"
            )
        else:
            llm = self._get_llm()
            try:
                response = llm.invoke(messages)
                answer_text = response.content if hasattr(response, "content") else str(response)
            except Exception as e:
                err_msg = str(e).lower()
                if "not found" in err_msg or "unsupported" in err_msg or "deprecated" in err_msg:
                    print(f"Retrying with gemini-1.5-flash fallback due to: {e}")
                    fallback_llm = ChatGoogleGenerativeAI(
                        model="gemini-1.5-flash",
                        google_api_key=api_key,
                        temperature=0.2
                    )
                    self._llm = fallback_llm
                    self._active_model_name = "gemini-1.5-flash"
                    response = fallback_llm.invoke(messages)
                    answer_text = response.content if hasattr(response, "content") else str(response)
                else:
                    raise e

        # 4. Save to chat history
        now = get_current_iso_timestamp()
        metadata_store.append_chat_message(session_id, {
            "role": "user",
            "content": clean_question,
            "timestamp": now
        })
        metadata_store.append_chat_message(session_id, {
            "role": "assistant",
            "content": answer_text,
            "sources": [c.dict() for c in citations],
            "timestamp": now
        })

        return ChatResponse(
            question=clean_question,
            answer=answer_text,
            sources=citations,
            session_id=session_id
        )

rag_service = RAGService()
