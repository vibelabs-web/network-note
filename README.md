# Star Note

네트워크 그래프 기반 지식관리 노트 앱

## 소개

Star Note는 제텔카스텐(Zettelkasten) 방법론을 기반으로 한 개인 지식관리 도구입니다. 메모를 별(Star)로 표현하고, 메모 간의 연결을 통해 지식 네트워크를 형성합니다.

### 주요 기능

- **마크다운 기반 메모 작성**: 실시간 미리보기 지원
- **멘션 시스템**: `@메모명`으로 다른 메모 참조 및 양방향 연결
- **AI 기반 연결 제안**: 벡터 유사도 + LLM 분석으로 관련 메모 자동 제안
- **네트워크 그래프 시각화**: D3.js 기반 Force-directed layout
- **별 등급 시스템**: 연결 수에 따른 메모 중요도 시각화

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | FastAPI, Python 3.11+ |
| Frontend | React 18, TypeScript, Vite |
| Database | MongoDB |
| Vector DB | ChromaDB |
| LLM | Ollama (Llama 3.2 3B) |
| Graph | D3.js |
| Styling | Tailwind CSS |
| State | Zustand |

## 시작하기

### 사전 요구사항

- [OrbStack](https://orbstack.dev) 또는 Docker Desktop
- Git

### 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/yourusername/star-note.git
cd star-note
```

2. **환경 변수 설정**
```bash
cp .env.example .env
# 필요시 .env 파일 수정
```

3. **서비스 시작**
```bash
docker compose up -d
```

4. **Ollama 모델 다운로드** (최초 1회)
```bash
docker compose exec ollama ollama pull llama3.2:3b
```

5. **접속**
- Frontend: http://localhost:5174
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

### 서비스 관리

```bash
# 로그 확인
docker compose logs -f

# 특정 서비스 로그
docker compose logs -f backend

# 서비스 재시작
docker compose restart backend

# 서비스 중지
docker compose down

# 볼륨 포함 삭제 (데이터 삭제됨!)
docker compose down -v
```

## 프로젝트 구조

```
star-note/
├── backend/          # FastAPI 백엔드
│   ├── app/          # 애플리케이션 코드
│   └── Dockerfile
├── frontend/         # React 프론트엔드
│   ├── src/          # 소스 코드
│   └── Dockerfile
├── docs/             # 프로젝트 문서
├── volumes/          # Docker 볼륨 데이터
├── docker-compose.yml
├── .env.example
└── README.md
```

## 서비스 포트

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Frontend | 5174 | React 개발 서버 |
| Backend | 8000 | FastAPI 서버 |
| MongoDB | 27017 | 데이터베이스 |
| Ollama | 11434 | LLM 서버 |
| ChromaDB | - | 내부 네트워크만 |

## 문서

- [PRD (제품 요구사항)](docs/PRD.md)
- [TRD (기술 요구사항)](docs/TRD.md)
- [TASKS (개발 태스크)](docs/TASKS.md)
- [FLOWCHART (서비스 플로우)](docs/FLOWCHART.md)

## 라이선스

MIT License
