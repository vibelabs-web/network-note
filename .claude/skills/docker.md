# Docker & Infrastructure Skill

Docker Compose 기반 인프라 관리를 위한 스킬입니다.

## 사용 시점
- Docker Compose 설정 수정 시
- 서비스 시작/중지/재시작 시
- 볼륨 및 네트워크 관리 시
- Dockerfile 수정 시

## 서비스 구성

| 서비스 | 이미지 | 포트 | 역할 |
|--------|--------|------|------|
| frontend | node:20-alpine | 5174 | React UI |
| backend | python:3.11-slim | 8000 | FastAPI |
| mongodb | mongo:7.0 | 27017 | Document DB |
| chromadb | chromadb/chroma | - | Vector DB |
| ollama | ollama/ollama | 11434 | LLM |

## 핵심 명령어

### 서비스 관리
```bash
# 전체 시작
docker compose up -d

# 특정 서비스만 시작
docker compose up -d backend frontend

# 전체 중지
docker compose down

# 볼륨 포함 삭제 (주의!)
docker compose down -v

# 서비스 재시작
docker compose restart backend
```

### 로그 확인
```bash
# 전체 로그
docker compose logs

# 실시간 로그
docker compose logs -f

# 특정 서비스 로그
docker compose logs -f backend
```

### 디버깅
```bash
# 컨테이너 상태 확인
docker compose ps

# 컨테이너 접속
docker compose exec backend bash
docker compose exec frontend sh
docker compose exec mongodb mongosh -u admin -p changeme

# 헬스체크 확인
curl http://localhost:8000/health
```

### 빌드
```bash
# 전체 재빌드
docker compose build --no-cache

# 특정 서비스만 빌드
docker compose build backend

# 빌드 후 시작
docker compose up -d --build
```

### Ollama 모델 관리
```bash
# 모델 다운로드
docker compose exec ollama ollama pull llama3.2:3b

# 모델 목록
docker compose exec ollama ollama list

# 모델 테스트
docker compose exec ollama ollama run llama3.2:3b "Hello"
```

## 네트워크 구조
```
star-note-network (bridge)
├── frontend (5174) ──── 외부 접근
├── backend (8000) ───── 외부 접근
├── ollama (11434) ───── 외부 접근
├── mongodb (27017) ──── 개발 시 외부, 프로덕션은 내부만
└── chromadb ─────────── 내부만
```

## 볼륨
- `mongodb_data`: MongoDB 데이터
- `mongodb_config`: MongoDB 설정
- `chromadb_data`: 벡터 임베딩
- `ollama_data`: LLM 모델 캐시 (용량 큼)

## 환경 변수 (.env)
```env
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=changeme
MONGODB_DB_NAME=star_note
OLLAMA_MODEL=llama3.2:3b
EMBEDDING_MODEL=all-MiniLM-L6-v2
VITE_API_URL=http://localhost:8000
```

## 트러블슈팅

### 포트 충돌
```bash
lsof -i :8000
kill -9 <PID>
```

### 볼륨 권한 문제
```bash
sudo chown -R $USER:$USER volumes/
```

### Ollama 메모리 부족
- docker-compose.yml에서 메모리 제한 조정
- 더 작은 모델 사용 (phi-3-mini)
