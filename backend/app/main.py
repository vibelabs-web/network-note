"""
Star Note API - FastAPI Application Entry Point
네트워크 그래프 기반 지식관리 노트 앱의 메인 API 서버
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import memos_router
from app.config import get_settings
from app.exceptions import StarNoteException
from app.services.mongo_service import (
    check_connection,
    close_connection,
    create_indexes,
)


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

    yield

    # Shutdown
    print("Shutting down Star Note API...")
    close_connection()


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
