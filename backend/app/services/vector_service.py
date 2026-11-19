from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings
from app.utils.helpers import ensure_directories
from app.services.embedding_service import embedding_service

class VectorService:
    COLLECTION_NAME = "research_papers"

    def __init__(self):
        ensure_directories()
        self._client: Optional[chromadb.ClientAPI] = None
        self._collection = None

    def _get_client(self):
        if self._client is None:
            self._client = chromadb.PersistentClient(
                path=str(settings.chroma_db_absolute_path),
                settings=ChromaSettings(anonymized_telemetry=False)
            )
        return self._client

    def _get_collection(self):
        if self._collection is None:
            client = self._get_client()
            self._collection = client.get_or_create_collection(
                name=self.COLLECTION_NAME,
                metadata={"description": "AI Research Paper Assistant vector storage"}
            )
        return self._collection

    def is_ready(self) -> bool:
        """Check if vector db is accessible."""
        try:
            self._get_collection()
            return True
        except Exception:
            return False

    def add_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Embed and persist chunks into ChromaDB.
        Each chunk is: {"id": str, "text": str, "metadata": dict}
        """
        if not chunks:
            return 0

        collection = self._get_collection()

        ids = [c["id"] for c in chunks]
        texts = [c["text"] for c in chunks]
        metadatas = [c["metadata"] for c in chunks]

        # Generate embeddings
        embeddings = embedding_service.embed_documents(texts)

        # Upsert in batches to ChromaDB (Chroma handles up to 5000 per call safely)
        batch_size = 200
        for i in range(0, len(chunks), batch_size):
            end_idx = i + batch_size
            collection.upsert(
                ids=ids[i:end_idx],
                embeddings=embeddings[i:end_idx],
                documents=texts[i:end_idx],
                metadatas=metadatas[i:end_idx]
            )

        return len(chunks)

    def similarity_search(
        self,
        query: str,
        paper_ids: Optional[List[str]] = None,
        top_k: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Query the vector store.
        If paper_ids is provided, filter strictly to those document IDs.
        """
        collection = self._get_collection()
        k = top_k or settings.TOP_K_RESULTS

        query_embedding = embedding_service.embed_query(query)

        where_filter = None
        if paper_ids:
            # Clean and filter non-empty ids
            valid_ids = [pid.strip() for pid in paper_ids if pid.strip()]
            if len(valid_ids) == 1:
                where_filter = {"document_id": valid_ids[0]}
            elif len(valid_ids) > 1:
                where_filter = {"document_id": {"$in": valid_ids}}

        # Ensure we don't request more than available in the collection
        count = collection.count()
        if count == 0:
            return []
        
        n_results = min(k, count)

        kwargs: Dict[str, Any] = {
            "query_embeddings": [query_embedding],
            "n_results": n_results,
            "include": ["documents", "metadatas", "distances"]
        }
        if where_filter:
            kwargs["where"] = where_filter

        results = collection.query(**kwargs)

        matched_items = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
            dists = results["distances"][0] if "distances" in results else [None] * len(docs)

            for doc_text, meta, dist in zip(docs, metas, dists):
                # Cosine distance or l2 distance depending on Chroma space
                score = None
                if dist is not None:
                    # Normalized similarity approximation: 1 / (1 + dist)
                    score = round(float(1 / (1 + dist)), 4)

                matched_items.append({
                    "text": doc_text,
                    "metadata": meta,
                    "score": score
                })

        return matched_items

    def delete_document_vectors(self, document_id: str) -> bool:
        """Delete all chunk vectors for a given document ID."""
        try:
            collection = self._get_collection()
            collection.delete(where={"document_id": document_id})
            return True
        except Exception as e:
            print(f"Error deleting vectors for document {document_id}: {e}")
            return False

    def get_document_sample_chunks(self, document_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Fetch sample chunks for a document."""
        try:
            collection = self._get_collection()
            results = collection.get(
                where={"document_id": document_id},
                limit=limit,
                include=["documents", "metadatas"]
            )
            samples = []
            if results and "documents" in results:
                for text, meta in zip(results["documents"], results["metadatas"]):
                    samples.append({
                        "text": text,
                        "metadata": meta
                    })
            return samples
        except Exception:
            return []

vector_service = VectorService()
