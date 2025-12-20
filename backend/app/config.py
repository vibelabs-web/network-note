"""
Application configuration using Pydantic Settings.
환경 변수를 읽어 설정값을 관리합니다.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Environment
    env: str = "development"

    # MongoDB Configuration
    mongo_root_username: str = "admin"
    mongo_root_password: str = "changeme"
    mongodb_db_name: str = "star_note"
    mongodb_host: str = "mongodb"
    mongodb_port: int = 27017

    # ChromaDB Configuration
    chroma_db_host: str = "chromadb"
    chroma_db_port: int = 8000

    # Ollama Configuration
    ollama_base_url: str = "http://ollama:11434"
    ollama_model: str = "llama3.2:3b"

    # Embedding Model (다국어 지원)
    embedding_model: str = "paraphrase-multilingual-MiniLM-L12-v2"

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5174"

    @property
    def mongodb_url(self) -> str:
        """Construct MongoDB connection URL."""
        return (
            f"mongodb://{self.mongo_root_username}:{self.mongo_root_password}"
            f"@{self.mongodb_host}:{self.mongodb_port}"
        )

    @property
    def chromadb_url(self) -> str:
        """Construct ChromaDB URL."""
        return f"http://{self.chroma_db_host}:{self.chroma_db_port}"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.env == "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses lru_cache to avoid reading env vars on every call.
    """
    return Settings()
