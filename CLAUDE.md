# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Star Note** is a Zettelkasten-based knowledge management app that visualizes notes as stars in a network graph. Notes are connected through explicit mentions (`@mention`) and AI-suggested semantic connections using vector similarity (ChromaDB) and LLM evaluation (Ollama).

## Tech Stack

### Backend (Python)
- **Framework**: FastAPI (Python 3.11+)
- **Database**: MongoDB (port 27017) for note data
- **Vector DB**: ChromaDB for embeddings
- **LLM**: Ollama (port 11434) with EXAONE 3.5 2.4B (한국어 최적화)
- **Embedding**: paraphrase-multilingual-MiniLM-L12-v2 (다국어 지원, 384차원)
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
docker compose exec ollama ollama pull exaone3.5:2.4b

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
| Backend   | 8001  | External  |
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
- `OLLAMA_MODEL` (default: exaone3.5:2.4b)
- `EMBEDDING_MODEL` (default: paraphrase-multilingual-MiniLM-L12-v2)
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

### [x] Task 2.1: MongoDB 스키마 설계 및 구현 (완료)

**구현 내용:**
- Pydantic 스키마 정의 (MemoCreate, MemoUpdate, MemoResponse, ConnectionResponse)
- MongoDB 모델 정의 (MemoDocument, ConnectionDict)
- Zettel ID 생성 유틸리티 (YYYY-MM-DD-XXX 형식)
- MongoDB 인덱스 8개 자동 생성 (애플리케이션 시작 시)

**생성된 핵심 파일:**
- `backend/app/schemas/memo.py` - Pydantic 스키마 (검증 규칙 포함)
- `backend/app/models/memo.py` - MongoDB 문서 구조 및 변환 함수
- `backend/app/utils/zettel_id.py` - Zettel ID 생성/파싱/검증
- `backend/app/services/mongo_service.py` - 인덱스 생성 함수 추가

**MongoDB 인덱스:**
- `idx_zettel_id` (unique) - 중복 방지
- `idx_text_search` - 전문 검색 (제목 가중치 10)
- `idx_tags` - 태그 필터링
- `idx_created_at` - 최신순 정렬
- `idx_updated_at` - 수정순 정렬
- `idx_connection_count` - 연결순 정렬
- `idx_tags_created_at` - 복합 인덱스
- `idx_connections_target_id` - 연결 조회

### [x] Task 2.2: 메모 CRUD API 구현 (완료)

**구현 내용:**
- 메모 CRUD API 5개 엔드포인트 구현
- 커스텀 예외 클래스 및 전역 에러 핸들러 구현
- 페이지네이션, 정렬, 태그 필터, 텍스트 검색 지원
- 메모 삭제 시 연결된 다른 메모의 connections 배열 자동 정리

**생성된 핵심 파일:**
- `backend/app/api/memos.py` - 메모 CRUD API 라우터
- `backend/app/exceptions.py` - 커스텀 예외 클래스

**API 엔드포인트:**
- `POST /api/memos` - 메모 생성 (Zettel ID 자동 생성)
- `GET /api/memos` - 메모 목록 조회 (페이지네이션, 정렬, 필터, 검색)
- `GET /api/memos/{memo_id}` - 메모 상세 조회 (연결 메모 정보 포함)
- `PUT /api/memos/{memo_id}` - 메모 수정 (updated_at 자동 업데이트)
- `DELETE /api/memos/{memo_id}` - 메모 삭제 (연결 자동 정리)

**쿼리 파라미터 (GET /api/memos):**
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 개수 (기본값: 20, 최대: 100)
- `sort`: 정렬 기준 (created_at, updated_at, connection_count, title)
- `order`: 정렬 방향 (asc, desc)
- `tag`: 태그 필터
- `search`: 텍스트 검색 (제목, 내용)

**에러 응답 형식:**
```json
{
  "error": true,
  "message": "에러 메시지",
  "detail": { ... }
}
```

### [x] Task 2.3: Frontend 메모 CRUD UI 구현 (완료)

**구현 내용:**
- API 클라이언트 함수 (getMemos, getMemo, createMemo, updateMemo, deleteMemo)
- Zustand 스토어 (useMemoStore) - 메모 목록, 상태, 필터, CRUD 액션 관리
- 공통 UI 컴포넌트 (Loading, Empty, ErrorMessage, Pagination, ConfirmDialog, Tag)
- MemoCard 컴포넌트 - 메모 카드 표시 (제목, 미리보기, 태그, 연결 수)
- MemoListSidebar 컴포넌트 - 검색, 태그 필터, 정렬 기능
- MemoListPage - 메모 목록, 페이지네이션, 필터링
- MemoDetailPage - 분할 뷰 에디터/미리보기, 자동 저장, 삭제 확인
- MarkdownPreview 컴포넌트 - react-markdown + remark-gfm
- HomePage 업데이트 - 최근 메모, 통계 표시

**생성된 핵심 파일:**
- `frontend/src/api/memos.ts` - API 클라이언트 함수
- `frontend/src/stores/memoStore.ts` - Zustand 상태 관리
- `frontend/src/components/common/` - Loading, Empty, ErrorMessage, Pagination, ConfirmDialog, Tag
- `frontend/src/components/MemoCard.tsx` - 메모 카드 컴포넌트
- `frontend/src/components/MemoListSidebar.tsx` - 사이드바 (검색, 필터, 정렬)
- `frontend/src/components/MarkdownPreview.tsx` - 마크다운 렌더링
- `frontend/src/pages/MemoListPage.tsx` - 메모 목록 페이지 (리팩토링)
- `frontend/src/pages/MemoDetailPage.tsx` - 메모 상세/편집 페이지 (리팩토링)
- `frontend/src/pages/HomePage.tsx` - 홈 페이지 (업데이트)

**주요 기능:**
- 메모 목록: 카드 그리드 뷰, 페이지네이션, 검색, 태그 필터, 정렬
- 메모 편집: 분할 뷰 (마크다운 에디터 + 실시간 미리보기)
- 자동 저장: 2초 디바운싱으로 변경사항 자동 저장
- 삭제 확인: ConfirmDialog 모달로 삭제 확인
- 에러 처리: 로딩 상태, 에러 메시지, 재시도 버튼

### [x] Task 3.1: 멘션 파싱 및 연결 생성 API (완료)

**구현 내용:**
- 멘션 파싱 유틸리티 (`@메모명` 패턴 추출)
- 연결 생성/삭제 API (양방향 연결 자동 생성)
- 메모 저장 시 자동 멘션 처리 및 연결 생성
- 메모명 검색 API (자동완성용)
- 연결 목록 조회 API

**생성된 핵심 파일:**
- `backend/app/utils/mention_parser.py` - 멘션 파싱 유틸리티 (extract_mentions, get_mention_diff)
- `backend/app/api/connections.py` - 연결 CRUD API 라우터
- `backend/app/schemas/connection.py` - 연결 관련 Pydantic 스키마

**API 엔드포인트:**
- `POST /api/connections` - 연결 생성 (양방향)
- `DELETE /api/connections` - 연결 삭제 (양방향)
- `GET /api/connections/{memo_id}` - 메모의 연결 목록 조회
- `GET /api/memos/search/names?q=검색어` - 멘션 자동완성용 메모명 검색

**주요 기능:**
- 멘션 패턴: `@메모명` (한글, 영문, 숫자, 하이픈, 언더스코어 지원)
- 메모 생성/수정 시 내용에서 멘션 자동 추출
- 멘션된 메모와 양방향 연결 자동 생성
- 멘션 삭제 시 해당 연결도 자동 삭제
- 중복 연결 방지

### [x] Task 3.2: Frontend 멘션 기능 구현 (완료)

**구현 내용:**
- 멘션 파서 유틸리티 (Frontend)
- 멘션 자동완성 컴포넌트 (드롭다운 UI)
- 에디터에서 @ 입력 감지 및 자동완성 통합
- 마크다운 렌더러에서 멘션을 클릭 가능한 링크로 변환
- 키보드 네비게이션 (화살표, Enter, Escape)

**생성된 핵심 파일:**
- `frontend/src/utils/mentionParser.ts` - 멘션 파싱 (extractMentions, getCurrentMention, insertMention)
- `frontend/src/components/MentionAutocomplete/` - 자동완성 드롭다운 컴포넌트
- `frontend/src/api/connections.ts` - 연결 API 클라이언트
- `frontend/src/api/memos.ts` - searchMemoNames 함수 추가

**주요 기능:**
- `@` 또는 `[[` 입력 시 자동완성 드롭다운 표시
- 메모명 검색 (300ms 디바운싱)
- 키보드 탐색: ↑↓ 이동, Enter 선택, Esc 닫기
- 멘션 선택 시 `@메모제목 ` 또는 `[[메모제목]] ` 형식으로 삽입
- 마크다운 미리보기에서 멘션 클릭 시 해당 메모로 이동
- 메모 목록 기반 멘션-ID 매핑
- `@멘션`과 `[[멘션]]` (Obsidian/Notion 스타일) 두 가지 형식 지원

### [x] Task 4.1: ChromaDB 설정 및 임베딩 서비스 구현 (완료)

**구현 내용:**
- ChromaDB 클라이언트 설정 (싱글톤 패턴)
- Sentence Transformers 임베딩 모델 (paraphrase-multilingual-MiniLM-L12-v2, 384차원, 다국어 지원)
- 메모 생성/수정/삭제 시 임베딩 자동 처리 (백그라운드)
- 유사도 검색 함수 구현 (코사인 유사도)
- 헬스체크 엔드포인트 추가

**생성된 핵심 파일:**
- `backend/app/services/vector_service.py` - ChromaDB 클라이언트 및 CRUD
- `backend/app/services/embedding_service.py` - 임베딩 모델 및 변환 함수
- `backend/requirements.txt` - chromadb, sentence-transformers 추가

**API 엔드포인트 (헬스체크):**
- `GET /health/vector` - ChromaDB 연결 상태
- `GET /health/embedding` - 임베딩 모델 로드 상태
- `GET /health/all` - MongoDB, ChromaDB, 임베딩 모델 전체 상태

**주요 기능:**
- 메모 생성 시 `BackgroundTasks`로 임베딩 비동기 저장
- 메모 수정 시 제목/내용 변경되면 임베딩 재생성
- 메모 삭제 시 ChromaDB에서도 임베딩 삭제
- 유사도 검색: 쿼리 벡터로 유사 메모 검색 (상위 N개)
- 메타데이터 저장: 제목, Zettel ID, 내용 미리보기 (500자)

### [x] Task 4.2: 벡터 기반 연결 제안 API 구현 (완료)

**구현 내용:**
- 연결 제안 API (`GET /api/memos/{memo_id}/suggestions`)
- 제안 승인/거부 API (`POST /api/suggestions/approve`, `POST /api/suggestions/reject`)
- 배치 제안 생성 함수 (10개 이하 동기 처리, 초과 시 백그라운드)
- 거부된 제안 재표시 방지 (rejection_history 저장)
- 이미 연결된 메모 제외 로직

**생성된 핵심 파일:**
- `backend/app/api/suggestions.py` - 제안 API 라우터
- `backend/app/schemas/suggestion.py` - 제안 관련 Pydantic 스키마
- `backend/app/services/vector_service.py` - get_embedding, get_embeddings_batch 함수 추가

**API 엔드포인트:**
- `GET /api/memos/{memo_id}/suggestions` - 특정 메모에 대한 연결 제안
- `GET /api/suggestions/for/{memo_id}` - 제안 조회 (대체 경로)
- `POST /api/suggestions/approve` - 제안 승인 (양방향 연결 생성)
- `POST /api/suggestions/reject` - 제안 거부 (거부 기록 저장)
- `POST /api/suggestions/batch` - 배치 제안 생성

**쿼리 파라미터 (GET /api/memos/{memo_id}/suggestions):**
- `limit`: 제안 개수 (기본값: 10, 최대: 20)
- `threshold`: 유사도 임계값 (기본값: 0.5, 범위: 0.0~1.0)

**주요 기능:**
- 벡터 유사도 기반 메모 연결 제안
- 유사도 임계값 필터링
- 이미 연결된 메모 자동 제외
- 거부된 제안 자동 제외 (rejection_history)
- 승인 시 explicit 타입 양방향 연결 생성
- 배치 처리로 전체 메모 제안 일괄 생성

### [x] Task 4.3: Frontend 연결 제안 UI 구현 (완료)

**구현 내용:**
- 제안 API 클라이언트 함수 (getSuggestions, approveSuggestion, rejectSuggestion)
- SuggestionCard 컴포넌트: 개별 제안 카드 UI (유사도 시각화, 승인/거부 버튼)
- SuggestionList 컴포넌트: 제안 목록 관리 (로딩, 에러, 빈 상태 처리)
- MemoDetailPage에 제안 섹션 통합 (메타데이터 패널 하단)
- 연결 생성 시 메모 및 제안 목록 자동 새로고침

**생성된 핵심 파일:**
- `frontend/src/api/suggestions.ts` - 제안 API 클라이언트
- `frontend/src/types/index.ts` - SuggestionItem, SuggestionListResponse 타입 추가
- `frontend/src/components/SuggestionCard/` - 제안 카드 컴포넌트
- `frontend/src/components/SuggestionList/` - 제안 목록 컴포넌트
- `frontend/src/pages/MemoDetailPage.tsx` - 제안 섹션 통합

**UI 기능:**
- 유사도 프로그레스 바 (색상으로 수준 표시: 높음/중간/낮음)
- 내용 미리보기 토글
- 승인/거부 버튼 (로딩 상태 표시)
- 스켈레톤 로딩 UI
- 빈 상태 안내 메시지
- 새로고침 버튼

### [x] Task 5.1: Ollama 통합 및 LLM 서비스 구현 (완료)

**구현 내용:**
- Ollama API 클라이언트 설정 (httpx 비동기 클라이언트)
- LLM 연결 평가 프롬프트 설계 (한국어, JSON 응답 형식)
- 단일/배치 연결 평가 함수 구현
- 하이브리드 스코어링 시스템 (벡터 40% + LLM 60%)
- EXAONE 3.5 호환 응답 파싱 (thought 태그 처리)
- Ollama 헬스체크 엔드포인트 추가

**생성된 핵심 파일:**
- `backend/app/services/llm_service.py` - LLM 평가 서비스
- `backend/app/main.py` - `/health/llm`, `/health/all` 엔드포인트 추가

**주요 함수:**
- `evaluate_connection(title_a, content_a, title_b, content_b)` - 두 메모 간 연결 평가
- `batch_evaluate_connections(source_memo, candidates)` - 배치 연결 평가
- `parse_llm_response(response_text)` - LLM 응답 JSON 파싱
- `check_ollama_health()` - Ollama 서비스 상태 확인

**API 엔드포인트:**
- `GET /health/llm` - Ollama 연결 및 모델 로드 상태
- `GET /health/all` - 전체 서비스 상태 (MongoDB, ChromaDB, Embedding, LLM)

**하이브리드 RAG 구조:**
1. ChromaDB 벡터 검색으로 후보 메모 선정 (limit * 3개)
2. 벡터 유사도 임계값으로 1차 필터링
3. LLM으로 top 10~20개 후보만 평가 (효율성)
4. 하이브리드 점수 = 벡터 유사도(40%) + LLM 점수(60%)
5. `connected=true`인 결과만 최종 제안
