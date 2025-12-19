# Backend Development Skill

FastAPI + Python 백엔드 개발을 위한 스킬입니다.

## 사용 시점
- FastAPI 라우트 또는 서비스 코드 작성 시
- MongoDB 스키마 또는 쿼리 작성 시
- Pydantic 모델 정의 시
- ChromaDB/Ollama 통합 작업 시

## 기술 스택
- Python 3.11+
- FastAPI + uvicorn
- MongoDB (pymongo)
- ChromaDB (벡터 DB)
- Ollama (LLM)
- Sentence Transformers (임베딩)

## 디렉토리 구조
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI 앱 진입점
│   ├── config.py         # 환경 설정
│   ├── api/              # 라우트 핸들러
│   │   ├── memos.py
│   │   ├── connections.py
│   │   └── graph.py
│   ├── models/           # DB 모델
│   ├── schemas/          # Pydantic 스키마
│   ├── services/         # 비즈니스 로직
│   │   ├── mongo_service.py
│   │   ├── vector_service.py
│   │   ├── embedding_service.py
│   │   └── llm_service.py
│   └── utils/
│       ├── zettel_id.py
│       └── mention_parser.py
├── Dockerfile
├── Dockerfile.prod
└── requirements.txt
```

## 코딩 컨벤션
- 비동기 함수에는 `async/await` 사용
- Pydantic v2 스타일 사용
- 타입 힌트 필수
- 에러는 FastAPI HTTPException으로 처리
- 환경 변수는 config.py의 Settings 클래스로 관리

## 주요 패턴

### API 라우트
```python
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.memo import MemoCreate, MemoResponse

router = APIRouter(prefix="/api/memos", tags=["memos"])

@router.post("/", response_model=MemoResponse)
async def create_memo(memo: MemoCreate):
    ...
```

### MongoDB 서비스
```python
from pymongo import MongoClient
from app.config import settings

client = MongoClient(settings.MONGODB_URL)
db = client[settings.MONGODB_DB_NAME]
memos_collection = db.memos
```

### Pydantic 스키마
```python
from pydantic import BaseModel, Field
from datetime import datetime

class MemoCreate(BaseModel):
    title: str = Field(..., max_length=200)
    content: str
    tags: list[str] = []
```

## 실행 명령어
```bash
# 개발 서버 (Docker)
docker compose up backend

# 로그 확인
docker compose logs -f backend

# 컨테이너 접속
docker compose exec backend bash

# 테스트
docker compose exec backend pytest
```
