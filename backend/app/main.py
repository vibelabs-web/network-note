from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="Star Note API",
    description="네트워크 그래프 기반 지식관리 노트 앱 API",
    version="0.1.0"
)

# CORS 설정
origins = os.getenv("CORS_ORIGINS", "http://localhost:5174").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Star Note API", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
