"""
Star Note API - FastAPI Application Entry Point
네트워크 그래프 기반 지식관리 노트 앱의 메인 API 서버
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import memos_router, connections_router, suggestions_router
from app.config import get_settings
from app.exceptions import StarNoteException
from app.services.mongo_service import (
    check_connection,
    close_connection,
    create_indexes,
)
from app.services.vector_service import (
    check_connection as check_chroma_connection,
    close_connection as close_chroma_connection,
    get_collection_count,
)
from app.services.embedding_service import check_model_loaded
from app.services.job_service import ensure_cache_indexes
from app.services.llm_service import check_ollama_health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    시작 시 리소스 초기화, 종료 시 정리 작업을 수행합니다.
    """
    # Startup
    settings = get_settings()
    print(f"Starting Star Note API in {settings.env} mode...")
    print(f"MongoDB: {settings.mongodb_host}:{settings.mongodb_port}/{settings.mongodb_db_name}")

    # MongoDB 인덱스 생성
    try:
        index_result = create_indexes()
        print(f"MongoDB indexes created: {index_result['count']} indexes")
    except Exception as e:
        print(f"Warning: Failed to create indexes: {e}")

    # LLM 평가 캐시 인덱스 생성
    try:
        cache_index_result = ensure_cache_indexes()
        print(f"LLM cache indexes created: {cache_index_result['indexes_created']} indexes")
    except Exception as e:
        print(f"Warning: Failed to create cache indexes: {e}")

    yield

    # Shutdown
    print("Shutting down Star Note API...")
    close_connection()
    close_chroma_connection()


# Create FastAPI application
settings = get_settings()
app = FastAPI(
    title="Star Note API",
    description="네트워크 그래프 기반 지식관리 노트 앱 API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers
@app.exception_handler(StarNoteException)
async def star_note_exception_handler(
    request: Request, exc: StarNoteException
) -> JSONResponse:
    """Star Note 커스텀 예외 핸들러."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "detail": exc.detail,
        },
    )


# API Routers
app.include_router(memos_router)
app.include_router(connections_router)
app.include_router(suggestions_router)


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "message": "Star Note API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    서비스 상태 확인용 엔드포인트입니다.
    """
    return {"status": "healthy"}


@app.get("/health/db")
async def health_db():
    """
    Database health check endpoint.
    MongoDB 연결 상태를 확인합니다.
    """
    db_status = check_connection()
    if db_status["connected"]:
        return {
            "status": "healthy",
            "database": "connected",
        }
    else:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": db_status.get("error", "Unknown error"),
        }


@app.get("/health/vector")
async def health_vector():
    """
    Vector database health check endpoint.
    ChromaDB 연결 상태를 확인합니다.
    """
    chroma_status = check_chroma_connection()
    if chroma_status["connected"]:
        return {
            "status": "healthy",
            "chromadb": "connected",
            "collection_count": get_collection_count(),
        }
    else:
        return {
            "status": "unhealthy",
            "chromadb": "disconnected",
            "error": chroma_status.get("error", "Unknown error"),
        }


@app.get("/health/embedding")
async def health_embedding():
    """
    Embedding model health check endpoint.
    임베딩 모델 로드 상태를 확인합니다.
    """
    model_status = check_model_loaded()
    if model_status["loaded"]:
        return {
            "status": "healthy",
            "model": model_status.get("model_name", "unknown"),
            "embedding_dimension": model_status.get("embedding_dimension", 0),
        }
    else:
        return {
            "status": "unhealthy",
            "model": "not loaded",
            "error": model_status.get("error", "Unknown error"),
        }


@app.get("/health/llm")
async def health_llm():
    """
    Ollama LLM 서비스 헬스체크.
    LLM 연결 상태와 모델 로드 여부를 확인합니다.
    """
    llm_status = await check_ollama_health()

    if llm_status["status"] == "healthy":
        return {
            "status": "healthy",
            "model": llm_status.get("model", "unknown"),
            "model_loaded": llm_status.get("model_loaded", False),
            "available_models": llm_status.get("available_models", []),
        }
    else:
        return {
            "status": "unhealthy",
            "error": llm_status.get("error", "Unknown error"),
        }


@app.get("/health/all")
async def health_all():
    """
    전체 서비스 헬스체크.
    MongoDB, ChromaDB, 임베딩 모델, Ollama LLM 상태를 모두 확인합니다.
    """
    db_status = check_connection()
    chroma_status = check_chroma_connection()
    model_status = check_model_loaded()
    llm_status = await check_ollama_health()

    all_healthy = (
        db_status["connected"]
        and chroma_status["connected"]
        and model_status["loaded"]
        and llm_status["status"] == "healthy"
    )

    return {
        "status": "healthy" if all_healthy else "unhealthy",
        "services": {
            "mongodb": "connected" if db_status["connected"] else "disconnected",
            "chromadb": "connected" if chroma_status["connected"] else "disconnected",
            "embedding_model": "loaded" if model_status["loaded"] else "not loaded",
            "ollama_llm": "healthy" if llm_status["status"] == "healthy" else "unhealthy",
        },
        "details": {
            "chromadb_collection_count": get_collection_count() if chroma_status["connected"] else 0,
            "embedding_dimension": model_status.get("embedding_dimension", 0) if model_status["loaded"] else 0,
            "llm_model": llm_status.get("model", "unknown"),
            "llm_model_loaded": llm_status.get("model_loaded", False),
        },
    }
