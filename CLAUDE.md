# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Star Note** is a Zettelkasten-based knowledge management app that visualizes notes as stars in a network graph. Notes are connected through explicit mentions (`@mention`) and AI-suggested semantic connections using vector similarity (ChromaDB) and LLM evaluation (Ollama).

## Tech Stack

### Backend (Python)
- **Framework**: FastAPI (Python 3.11+)
- **Database**: MongoDB (port 27017) for note data
- **Vector DB**: ChromaDB for embeddings
- **LLM**: Ollama (port 11434) with Llama 3.2 3B
- **Embedding**: all-MiniLM-L6-v2 (Sentence Transformers)
- **Package Manager**: Poetry

### Frontend (TypeScript)
- **Framework**: React 18 + TypeScript + Vite
- **Graph Visualization**: D3.js (force-directed layout)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Package Manager**: pnpm

### Infrastructure
- **Container Runtime**: OrbStack (Docker on macOS)
- **Orchestration**: Docker Compose

## Development Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f
docker compose logs -f backend   # specific service

# Restart a service
docker compose restart backend

# Stop services
docker compose down
docker compose down -v           # remove volumes too

# Download LLM model (first time only)
docker compose exec ollama ollama pull llama3.2:3b

# Access MongoDB shell
docker compose exec mongodb mongosh -u admin -p changeme

# Container shell access
docker compose exec backend bash
docker compose exec frontend sh
```

## Service Ports

| Service   | Port  | Access    |
|-----------|-------|-----------|
| Frontend  | 5174  | External  |
| Backend   | 8000  | External  |
| MongoDB   | 27017 | Internal  |
| Ollama    | 11434 | External  |
| ChromaDB  | -     | Internal  |

## Architecture

```
Frontend (React) ─────> Backend (FastAPI) ─────> MongoDB
                              │
                              ├─────> ChromaDB (embeddings)
                              └─────> Ollama (LLM suggestions)
```

### Backend Structure
```
backend/app/
├── main.py          # FastAPI app entry
├── config.py        # Environment config
├── api/             # Route handlers
├── models/          # Database models
├── schemas/         # Pydantic schemas
├── services/        # Business logic
│   ├── mongo_service.py
│   ├── vector_service.py
│   ├── embedding_service.py
│   └── llm_service.py
└── utils/
    ├── zettel_id.py      # ID generation (YYYY-MM-DD-XXX)
    └── mention_parser.py  # @mention extraction
```

### Frontend Structure
```
frontend/src/
├── api/          # API client functions
├── components/   # React components
├── pages/        # Route pages
├── stores/       # Zustand stores
├── hooks/        # Custom hooks
├── types/        # TypeScript types
└── utils/        # Utilities
```

## Data Model

### Memo (MongoDB)
- `_id`: ObjectId
- `zettelId`: string (format: `YYYY-MM-DD-XXX`)
- `title`: string (max 200 chars)
- `content`: string (Markdown)
- `connections`: array of `{ targetId, type, strength, createdAt }`
- `mentions`: string[] (parsed @mentions)
- `tags`: string[]
- `connectionCount`: int (auto-calculated)
- `createdAt`, `updatedAt`: DateTime

### Connection Types
- `explicit`: User-created via @mention
- `suggested`: AI-generated via vector similarity + LLM

## Key API Endpoints

- `GET/POST /api/memos` - List/Create memos
- `GET/PUT/DELETE /api/memos/{id}` - Memo CRUD
- `GET /api/memos/{id}/suggestions` - AI connection suggestions
- `POST /api/connections` - Create explicit connection
- `GET /api/graph` - Graph visualization data

## Star Rating System (Graph Visualization)

Nodes sized by connection count:
- Level 0: 0 connections (dim, small)
- Level 1: 1-2 connections
- Level 2: 3-5 connections
- Level 3: 6-10 connections
- Level 4: 10+ connections (hub, bright, large)

## Environment Variables

Key variables in `.env`:
- `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`
- `MONGODB_DB_NAME` (default: star_note)
- `OLLAMA_MODEL` (default: llama3.2:3b)
- `EMBEDDING_MODEL` (default: all-MiniLM-L6-v2)
- `VITE_API_URL` (default: http://localhost:8000)

## Development Notes

- All documentation is in Korean
- Mention syntax: `@메모명` or `[[메모명]]` (Obsidian-style planned)
- Embedding generation runs in background (non-blocking)
- LLM suggestions are async with optional hybrid scoring (vector + LLM)
- Graph uses D3.js force-directed layout with drag/zoom/pan

## Project Skills (.claude/skills/)

이 프로젝트에는 다음 스킬 문서가 포함되어 있습니다:

| Skill | 파일 | 용도 |
|-------|------|------|
| **Backend** | `backend.md` | FastAPI, MongoDB, Pydantic 패턴 |
| **Frontend** | `frontend.md` | React, TypeScript, D3.js, Zustand 패턴 |
| **Docker** | `docker.md` | Docker Compose 명령어 및 서비스 관리 |
| **Database** | `database.md` | MongoDB 스키마, 쿼리, ChromaDB 사용법 |
| **AI Integration** | `ai-integration.md` | 임베딩, 벡터 검색, Ollama LLM 통합 |

### 스킬 활용 가이드

**Backend 작업 시**: `backend.md` 참조
- API 라우트 작성, Pydantic 스키마, MongoDB 서비스 패턴

**Frontend 작업 시**: `frontend.md` 참조
- React 컴포넌트, Zustand 스토어, D3.js 그래프 패턴

**인프라 작업 시**: `docker.md` 참조
- 서비스 시작/중지, 로그 확인, 디버깅 명령어

**데이터베이스 작업 시**: `database.md` 참조
- MongoDB 스키마, 인덱스, 쿼리 최적화

**AI 기능 작업 시**: `ai-integration.md` 참조
- 임베딩 생성, 벡터 검색, LLM 프롬프트 설계

## Implementation Progress

### [x] Task 1.1: 프로젝트 루트 구조 및 Docker Compose 설정 (완료)

**구현 내용:**
- Docker Compose로 5개 서비스 정의 (MongoDB, ChromaDB, Ollama, Backend, Frontend)
- 헬스체크 설정으로 서비스 의존성 관리
- 개발 환경용 볼륨 마운트 (hot-reload 지원)
- `.env.example` 환경 변수 템플릿 제공

**생성된 핵심 파일:**
- `docker-compose.yml` - 전체 서비스 오케스트레이션
- `backend/Dockerfile` - Python 3.11 + FastAPI
- `frontend/Dockerfile` - Node 20 + Vite
- `backend/app/main.py` - FastAPI 기본 앱 (`/health` 엔드포인트)
- `frontend/src/App.tsx` - React 기본 컴포넌트

### [x] Task 1.2: Backend 기본 구조 및 FastAPI 설정 (완료)

**구현 내용:**
- Backend 디렉토리 구조 생성 (models, schemas, api, services, utils)
- `config.py`: Pydantic Settings 기반 환경 변수 관리 (MongoDB, ChromaDB, Ollama 설정)
- `mongo_service.py`: MongoDB 클라이언트 싱글톤 패턴, 연결 상태 확인 함수
- `main.py`: FastAPI lifespan 관리, CORS 미들웨어, 헬스체크 엔드포인트

**생성된 핵심 파일:**
- `backend/app/config.py` - 환경 변수 설정 (Settings 클래스)
- `backend/app/services/mongo_service.py` - MongoDB 연결 서비스
- `backend/app/main.py` - `/health`, `/health/db` 엔드포인트

**API 엔드포인트:**
- `GET /health` → `{"status": "healthy"}`
- `GET /health/db` → `{"status": "healthy", "database": "connected"}`

### [x] Task 1.3: Frontend 기본 구조 및 React 설정 (완료)

**구현 내용:**
- Frontend 디렉토리 구조 생성 (components, pages, hooks, stores, utils, types, api)
- Tailwind CSS 설정 (Design System 색상 및 타이포그래피 적용)
- React Router 기반 라우팅 설정 (홈, 메모 목록, 메모 상세, 그래프, 404)
- 레이아웃 컴포넌트 (Layout, Header, Sidebar)
- Axios 기반 API 클라이언트 설정
- pnpm 패키지 매니저 사용

**생성된 핵심 파일:**
- `frontend/src/App.tsx` - React Router 설정
- `frontend/src/components/Layout/` - Layout, Header, Sidebar 컴포넌트
- `frontend/src/pages/` - HomePage, MemoListPage, MemoDetailPage, GraphPage, NotFoundPage
- `frontend/src/api/client.ts` - Axios 인스턴스 및 인터셉터
- `frontend/src/types/index.ts` - TypeScript 타입 정의
- `frontend/tailwind.config.js` - Tailwind CSS 설정

**라우트:**
- `/` - 홈 (대시보드)
- `/memos` - 메모 목록
- `/memos/:id` - 메모 상세/편집
- `/graph` - 그래프 뷰
- `/*` - 404 페이지
