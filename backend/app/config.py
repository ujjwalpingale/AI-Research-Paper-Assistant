from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    GEMINI_API_KEY: str = Field(default="", env="GEMINI_API_KEY")
    GEMINI_EMBEDDING_MODEL: str = Field(default="gemini-embedding-001", env="GEMINI_EMBEDDING_MODEL")
    GEMINI_CHAT_MODEL: str = Field(default="gemini-2.5-flash", env="GEMINI_CHAT_MODEL")
    
    CHROMA_DB_PATH: str = Field(default="./storage/chroma_db", env="CHROMA_DB_PATH")
    UPLOAD_DIR: str = Field(default="./storage/uploads", env="UPLOAD_DIR")
    METADATA_DIR: str = Field(default="./storage/metadata", env="METADATA_DIR")
    
    FRONTEND_URL: str = Field(default="http://localhost:5173", env="FRONTEND_URL")
    BACKEND_PORT: int = Field(default=8000, env="BACKEND_PORT")
    
    CHUNK_SIZE: int = Field(default=1000, env="CHUNK_SIZE")
    CHUNK_OVERLAP: int = Field(default=200, env="CHUNK_OVERLAP")
    TOP_K_RESULTS: int = Field(default=5, env="TOP_K_RESULTS")
    MAX_UPLOAD_SIZE_MB: int = Field(default=30, env="MAX_UPLOAD_SIZE_MB")

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def chroma_db_absolute_path(self) -> Path:
        p = Path(self.CHROMA_DB_PATH)
        return p if p.is_absolute() else (BASE_DIR / p).resolve()

    @property
    def upload_absolute_path(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        return p if p.is_absolute() else (BASE_DIR / p).resolve()

    @property
    def metadata_absolute_path(self) -> Path:
        p = Path(self.METADATA_DIR)
        return p if p.is_absolute() else (BASE_DIR / p).resolve()

settings = Settings()
