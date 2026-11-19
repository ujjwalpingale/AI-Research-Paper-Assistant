import time
import hashlib
from typing import List, Optional
import numpy as np
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.config import settings

class EmbeddingService:
    def __init__(self):
        self._embeddings_client: Optional[GoogleGenerativeAIEmbeddings] = None
        self._active_model_name: Optional[str] = None

    def has_api_key(self) -> bool:
        key = settings.GEMINI_API_KEY.strip()
        return bool(key and key != "your_gemini_api_key_here" and len(key) > 10)

    def _get_model_name(self) -> str:
        model = settings.GEMINI_EMBEDDING_MODEL.strip()
        if model.lower() in ["gemini-embedding-001", "embedding-001"]:
            return "models/embedding-001"
        if not model.startswith("models/"):
            return f"models/{model}"
        return model

    def _get_client(self) -> GoogleGenerativeAIEmbeddings:
        if not self.has_api_key():
            raise ValueError("GEMINI_API_KEY is not configured in backend/.env")

        model_name = self._get_model_name()
        if self._embeddings_client is None or self._active_model_name != model_name:
            self._embeddings_client = GoogleGenerativeAIEmbeddings(
                model=model_name,
                google_api_key=settings.GEMINI_API_KEY.strip()
            )
            self._active_model_name = model_name

        return self._embeddings_client

    def _generate_fallback_vector(self, text: str, dim: int = 768) -> List[float]:
        """Deterministic 768-dim normalized embedding when GEMINI_API_KEY is not set."""
        vec = np.zeros(dim, dtype=np.float32)
        words = text.lower().split()
        for i, word in enumerate(words):
            h = int(hashlib.sha256(word.encode()).hexdigest(), 16)
            idx = h % dim
            vec[idx] += 1.0 / (1.0 + (i * 0.005))
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def embed_documents(self, texts: List[str], batch_size: int = 50) -> List[List[float]]:
        """Embed a list of text strings in batches."""
        if not texts:
            return []

        if not self.has_api_key():
            # Graceful local fallback during development/testing
            return [self._generate_fallback_vector(t) for t in texts]

        client = self._get_client()
        all_embeddings: List[List[float]] = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            try:
                batch_embeddings = client.embed_documents(batch)
                all_embeddings.extend(batch_embeddings)
            except Exception as e:
                err_msg = str(e).lower()
                if "not found" in err_msg or "unsupported" in err_msg:
                    print(f"Retrying embeddings with models/text-embedding-004 fallback due to: {e}")
                    fallback_client = GoogleGenerativeAIEmbeddings(
                        model="models/text-embedding-004",
                        google_api_key=settings.GEMINI_API_KEY.strip()
                    )
                    self._embeddings_client = fallback_client
                    self._active_model_name = "models/text-embedding-004"
                    batch_embeddings = fallback_client.embed_documents(batch)
                    all_embeddings.extend(batch_embeddings)
                else:
                    raise e
            
            if i + batch_size < len(texts):
                time.sleep(0.2)

        return all_embeddings

    def embed_query(self, query: str) -> List[float]:
        """Embed a single query string."""
        if not query.strip():
            raise ValueError("Query string cannot be empty")
        
        if not self.has_api_key():
            return self._generate_fallback_vector(query)

        client = self._get_client()
        try:
            return client.embed_query(query)
        except Exception as e:
            err_msg = str(e).lower()
            if "not found" in err_msg or "unsupported" in err_msg:
                fallback_client = GoogleGenerativeAIEmbeddings(
                    model="models/text-embedding-004",
                    google_api_key=settings.GEMINI_API_KEY.strip()
                )
                self._embeddings_client = fallback_client
                self._active_model_name = "models/text-embedding-004"
                return fallback_client.embed_query(query)
            raise e

embedding_service = EmbeddingService()
