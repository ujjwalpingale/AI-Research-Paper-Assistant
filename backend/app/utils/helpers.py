import json
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.config import settings

def ensure_directories():
    """Ensure all required storage directories exist."""
    settings.chroma_db_absolute_path.mkdir(parents=True, exist_ok=True)
    settings.upload_absolute_path.mkdir(parents=True, exist_ok=True)
    settings.metadata_absolute_path.mkdir(parents=True, exist_ok=True)

def generate_id() -> str:
    """Generate a unique ID."""
    return str(uuid.uuid4())

def get_current_iso_timestamp() -> str:
    """Return ISO formatted current time."""
    return datetime.utcnow().isoformat() + "Z"

def clean_text(text: str) -> str:
    """Clean extracted text from PDF."""
    if not text:
        return ""
    # Normalize unicode spaces
    text = re.sub(r'[\r\f\v]', '\n', text)
    # Replace multiple spaces with a single space
    text = re.sub(r'[ \t]+', ' ', text)
    # Replace more than 2 consecutive newlines with 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to avoid path traversal."""
    cleaned = re.sub(r'[^\w\s\.-]', '_', filename)
    return cleaned.strip()

# --- Persistent Metadata Storage ---

class MetadataStore:
    def __init__(self):
        ensure_directories()
        self.doc_file = settings.metadata_absolute_path / "documents.json"
        self.chat_file = settings.metadata_absolute_path / "chat_history.json"
        self._init_files()

    def _init_files(self):
        if not self.doc_file.exists():
            self.doc_file.write_text("{}", encoding="utf-8")
        if not self.chat_file.exists():
            self.chat_file.write_text("{}", encoding="utf-8")

    def _read_json(self, path: Path) -> Dict[str, Any]:
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return {}

    def _write_json(self, path: Path, data: Dict[str, Any]):
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    # Document operations
    def get_all_documents(self) -> List[Dict[str, Any]]:
        data = self._read_json(self.doc_file)
        # Return sorted by upload_date desc
        return sorted(list(data.values()), key=lambda x: x.get("upload_date", ""), reverse=True)

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        data = self._read_json(self.doc_file)
        return data.get(doc_id)

    def save_document(self, doc: Dict[str, Any]):
        data = self._read_json(self.doc_file)
        data[doc["id"]] = doc
        self._write_json(self.doc_file, data)

    def delete_document(self, doc_id: str) -> bool:
        data = self._read_json(self.doc_file)
        if doc_id in data:
            del data[doc_id]
            self._write_json(self.doc_file, data)
            return True
        return False

    def update_document_summary(self, doc_id: str, summary: Dict[str, Any]):
        data = self._read_json(self.doc_file)
        if doc_id in data:
            data[doc_id]["summary"] = summary
            self._write_json(self.doc_file, data)

    # Chat history operations
    def get_chat_history(self, session_id: str = "default") -> List[Dict[str, Any]]:
        data = self._read_json(self.chat_file)
        return data.get(session_id, [])

    def append_chat_message(self, session_id: str, message: Dict[str, Any]):
        data = self._read_json(self.chat_file)
        if session_id not in data:
            data[session_id] = []
        data[session_id].append(message)
        # Keep last 50 messages per session
        if len(data[session_id]) > 50:
            data[session_id] = data[session_id][-50:]
        self._write_json(self.chat_file, data)

    def clear_chat_history(self, session_id: str = "default"):
        data = self._read_json(self.chat_file)
        if session_id in data:
            data[session_id] = []
            self._write_json(self.chat_file, data)

metadata_store = MetadataStore()
