"""
Star Note API - FastAPI Application Entry Point
네트워크 그래프 기반 지식관리 노트 앱의 메인 API 서버
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.services.mongo_service import check_connection, close_connection


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
