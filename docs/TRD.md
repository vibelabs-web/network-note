# Technical Requirements Document (TRD)
## Star Note - 기술 요구사항 문서

**버전:** 1.0  
**작성일:** 2024-12-25  
**목적:** 개발 및 배포 환경 구축을 위한 기술 명세

---

## 1. 시스템 아키텍처

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────┐
│              Docker Compose Network              │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Frontend │  │ Backend  │  │ MongoDB │     │
│  │ :5174    │  │ :8000    │  │ :27017  │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │              │           │
│       └─────────────┼──────────────┘           │
│                     │                          │
│  ┌──────────┐  ┌───▼────┐  ┌──────────┐     │
│  │ ChromaDB │  │ Ollama │  │ Embedding│     │
│  │ (Volume) │  │ :11434 │  │ Service  │     │
│  └──────────┘  └────────┘  └──────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 1.2 서비스 구성

| 서비스 | 포트 | 기술 스택 | 용도 |
|--------|------|-----------|------|
| Frontend | 5174 | React + Vite | 사용자 인터페이스 |
| Backend | 8000 | FastAPI | REST API 서버 |
| MongoDB | 27017 | MongoDB | 메모 데이터 저장 |
| ChromaDB | - | ChromaDB | 벡터 임베딩 저장 |
| Ollama | 11434 | Ollama | LLM 실행 |

---

## 2. 개발 환경

### 2.1 필수 도구

- **OrbStack**: Docker Desktop 대체, MacOS용 경량 컨테이너 런타임
- **Docker Compose**: 멀티 컨테이너 애플리케이션 오케스트레이션
- **Git**: 버전 관리

### 2.2 시스템 요구사항

- **OS**: macOS (OrbStack 사용)
- **RAM**: 최소 8GB (LLM 포함 시 12GB 권장)
- **Disk**: 최소 20GB 여유 공간
- **CPU**: 멀티코어 권장 (LLM 추론용)

---

## 3. Docker Compose 구성

### 3.1 프로젝트 구조

```
star-note/
├── docker-compose.yml          # 메인 컴포즈 파일
├── docker-compose.prod.yml     # 프로덕션 오버라이드
├── .env.example                # 환경 변수 템플릿
├── .env                        # 로컬 환경 변수 (gitignore)
├── backend/
│   ├── Dockerfile
│   ├── Dockerfile.prod         # 프로덕션 빌드
│   ├── requirements.txt
│   └── app/
├── frontend/
│   ├── Dockerfile
│   ├── Dockerfile.prod         # 프로덕션 빌드
│   ├── package.json
│   └── src/
└── volumes/
    ├── mongodb/                # MongoDB 데이터
    ├── chromadb/               # ChromaDB 데이터
    └── ollama/                 # Ollama 모델 캐시
```

### 3.2 docker-compose.yml

```yaml
version: '3.8'

services:
  # MongoDB 서비스
  mongodb:
    image: mongo:7.0
    container_name: star-note-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD:-changeme}
    networks:
      - star-note-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  # ChromaDB 서비스 (로컬 파일 기반)
  chromadb:
    image: chromadb/chroma:latest
    container_name: star-note-chromadb
    restart: unless-stopped
    volumes:
      - chromadb_data:/chroma/chroma
    environment:
      - IS_PERSISTENT=TRUE
      - PERSIST_DIRECTORY=/chroma/chroma
      - ANONYMIZED_TELEMETRY=FALSE
    networks:
      - star-note-network
    # ChromaDB는 내부 네트워크에서만 접근

  # Ollama 서비스
  ollama:
    image: ollama/ollama:latest
    container_name: star-note-ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    networks:
      - star-note-network
    deploy:
      resources:
        reservations:
          memory: 4G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend 서비스
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: star-note-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - ./backend/app:/app/app
      - ./backend/requirements.txt:/app/requirements.txt
    environment:
      - MONGODB_URL=mongodb://${MONGO_ROOT_USERNAME:-admin}:${MONGO_ROOT_PASSWORD:-changeme}@mongodb:27017
      - MONGODB_DB_NAME=${MONGODB_DB_NAME:-star_note}
      - CHROMA_DB_URL=http://chromadb:8000
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_MODEL=${OLLAMA_MODEL:-llama3.2:3b}
      - EMBEDDING_MODEL=${EMBEDDING_MODEL:-all-MiniLM-L6-v2}
      - API_HOST=0.0.0.0
      - API_PORT=8000
      - CORS_ORIGINS=http://localhost:5174
      - ENV=${ENV:-development}
    depends_on:
      mongodb:
        condition: service_healthy
      chromadb:
        condition: service_started
      ollama:
        condition: service_healthy
    networks:
      - star-note-network
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # Frontend 서비스
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: star-note-frontend
    restart: unless-stopped
    ports:
      - "5174:5174"
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
      - ./frontend/package.json:/app/package.json
      - ./frontend/vite.config.ts:/app/vite.config.ts
    environment:
      - VITE_API_URL=http://localhost:8000
      - NODE_ENV=development
    depends_on:
      - backend
    networks:
      - star-note-network
    command: npm run dev -- --host 0.0.0.0 --port 5174

volumes:
  mongodb_data:
    driver: local
  mongodb_config:
    driver: local
  chromadb_data:
    driver: local
  ollama_data:
    driver: local

networks:
  star-note-network:
    driver: bridge
```

### 3.3 docker-compose.prod.yml (프로덕션 오버라이드)

```yaml
version: '3.8'

services:
  backend:
    build:
      dockerfile: Dockerfile.prod
    environment:
      - ENV=production
      - CORS_ORIGINS=${PROD_CORS_ORIGINS}
    volumes: []  # 프로덕션에서는 볼륨 마운트 제거
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000

  frontend:
    build:
      dockerfile: Dockerfile.prod
    environment:
      - VITE_API_URL=${PROD_API_URL}
      - NODE_ENV=production
    volumes: []  # 프로덕션에서는 볼륨 마운트 제거
    command: npm run preview -- --host 0.0.0.0 --port 5174
```

---

## 4. Dockerfile 명세

### 4.1 Backend Dockerfile (개발)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY ./app /app/app

# 포트 노출
EXPOSE 8000

# 개발 모드 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### 4.2 Backend Dockerfile.prod (프로덕션)

```dockerfile
FROM python:3.11-slim as builder

WORKDIR /app

# 빌드 의존성
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim

WORKDIR /app

# 런타임 의존성만 복사
COPY --from=builder /root/.local /root/.local
COPY ./app /app/app

ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 4.3 Frontend Dockerfile (개발)

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 패키지 파일 복사 및 설치
COPY package.json package-lock.json* ./
RUN npm install

# 소스 코드 복사
COPY . .

EXPOSE 5174

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]
```

### 4.4 Frontend Dockerfile.prod (프로덕션)

```dockerfile
FROM node:20-alpine as builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5174

CMD ["nginx", "-g", "daemon off;"]
```

---

## 5. 환경 변수

### 5.1 .env.example

```env
# MongoDB 설정
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=changeme
MONGODB_DB_NAME=star_note

# ChromaDB 설정 (내부 네트워크)
CHROMA_DB_URL=http://chromadb:8000

# Ollama 설정
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:3b

# Embedding 모델
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Backend 설정
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5174

# Frontend 설정
VITE_API_URL=http://localhost:8000

# 환경
ENV=development

# 프로덕션 설정 (배포 시 사용)
PROD_API_URL=https://api.yourdomain.com
PROD_CORS_ORIGINS=https://yourdomain.com
```

### 5.2 환경별 설정

**개발 환경:**
- 볼륨 마운트로 핫 리로드
- 디버그 모드 활성화
- 상세 로깅

**프로덕션 환경:**
- 최적화된 빌드
- 환경 변수로 설정 주입
- 보안 강화

---

## 6. 네트워크 구성

### 6.1 네트워크 토폴로지

```
star-note-network (bridge)
│
├── frontend (5174) ──┐
│                     │
├── backend (8000) ───┼─── 외부 접근 가능
│                     │
├── ollama (11434) ───┘
│
├── mongodb (27017) ──── 내부 네트워크만
│
└── chromadb ─────────── 내부 네트워크만
```

### 6.2 포트 매핑

| 서비스 | 컨테이너 포트 | 호스트 포트 | 접근 범위 |
|--------|--------------|------------|----------|
| Frontend | 5174 | 5174 | 외부 |
| Backend | 8000 | 8000 | 외부 (개발) |
| MongoDB | 27017 | 27017 | 외부 (개발만) |
| Ollama | 11434 | 11434 | 외부 |
| ChromaDB | 8000 | - | 내부만 |

---

## 7. 볼륨 관리

### 7.1 데이터 영속성

```yaml
volumes:
  mongodb_data:      # MongoDB 데이터 파일
  mongodb_config:    # MongoDB 설정 파일
  chromadb_data:     # ChromaDB 벡터 데이터
  ollama_data:       # Ollama 모델 캐시 (큼!)
```

### 7.2 백업 전략

**로컬 개발:**
- 볼륨은 OrbStack이 관리
- 필요 시 `docker volume inspect`로 위치 확인

**프로덕션:**
- 정기적 볼륨 백업 스크립트
- MongoDB: `mongodump`
- ChromaDB: 볼륨 전체 백업
- Ollama: 모델은 재다운로드 가능

---

## 8. 배포 전략

### 8.1 배포 플랫폼 비교

| 플랫폼 | 가격 | 특징 | 추천도 |
|--------|------|------|--------|
| **Railway** | $5/월 + 사용량 | Docker 지원, 자동 배포, 간편 | ⭐⭐⭐⭐⭐ |
| **Fly.io** | 무료 티어 + 사용량 | 전세계 엣지 배포, 빠름 | ⭐⭐⭐⭐ |
| **Hetzner VPS** | €4.15/월 | 가장 저렴, 완전한 제어 | ⭐⭐⭐⭐⭐ |
| **DigitalOcean** | $6/월 | 안정적, 문서화 잘됨 | ⭐⭐⭐⭐ |
| **Render** | 무료 티어 (제한적) | 간단하지만 제한적 | ⭐⭐⭐ |

### 8.2 추천: Railway 또는 Hetzner

**Railway (추천 - 간편함)**
- 장점:
  - Docker Compose 직접 지원
  - GitHub 연동 자동 배포
  - 환경 변수 관리 편리
  - 로그/모니터링 내장
- 단점:
  - 사용량 기반 추가 비용
  - 월 $5 기본 + 트래픽

**Hetzner (추천 - 저렴함)**
- 장점:
  - 가장 저렴 (€4.15/월 ≈ $4.5)
  - 완전한 제어권
  - 좋은 성능
  - 무제한 트래픽
- 단점:
  - 직접 서버 관리 필요
  - 초기 설정 복잡

### 8.3 Railway 배포 가이드

**1. Railway 프로젝트 생성**
```bash
# Railway CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 초기화
railway init
```

**2. docker-compose.yml 배포**
```bash
# Railway는 docker-compose.yml 직접 지원
railway up
```

**3. 환경 변수 설정**
- Railway 대시보드에서 환경 변수 설정
- `.env.example` 참고

**4. 도메인 설정**
- Railway가 자동으로 도메인 제공
- 커스텀 도메인 연결 가능

### 8.4 Hetzner VPS 배포 가이드

**1. 서버 생성**
- Hetzner Cloud에서 CX11 (2GB RAM) 선택
- Ubuntu 22.04 LTS
- 위치: 독일/핀란드 (가장 저렴)

**2. 서버 설정**
```bash
# SSH 접속
ssh root@your-server-ip

# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose 설치
apt-get update
apt-get install docker-compose-plugin

# Git 설치
apt-get install git
```

**3. 프로젝트 배포**
```bash
# 프로젝트 클론
git clone https://github.com/yourusername/star-note.git
cd star-note

# 환경 변수 설정
cp .env.example .env
nano .env  # 프로덕션 값으로 수정

# 프로덕션 모드로 실행
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**4. 방화벽 설정**
```bash
# UFW 설정
ufw allow 22/tcp   # SSH
ufw allow 5174/tcp # Frontend
ufw allow 8000/tcp # Backend (또는 Nginx 리버스 프록시)
ufw enable
```

**5. Nginx 리버스 프록시 (선택사항)**
```nginx
# /etc/nginx/sites-available/star-note
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 9. 보안 고려사항

### 9.1 개발 환경
- MongoDB 기본 인증 설정
- Ollama는 내부 네트워크만 접근
- 환경 변수로 민감 정보 관리

### 9.2 프로덕션 환경
- **HTTPS 필수**: Let's Encrypt SSL 인증서
- **MongoDB 인증 강화**: 복잡한 비밀번호
- **방화벽**: 필요한 포트만 개방
- **리버스 프록시**: Nginx로 보안 헤더 추가
- **정기 업데이트**: 컨테이너 이미지 업데이트

### 9.3 보안 헤더 (Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

---

## 10. 모니터링 및 로깅

### 10.1 로깅 전략

**Backend:**
- FastAPI 기본 로깅
- 구조화된 JSON 로그 (프로덕션)
- 로그 레벨: DEBUG (개발), INFO (프로덕션)

**Frontend:**
- 콘솔 로그 (개발)
- 에러 트래킹 (Sentry 선택사항)

### 10.2 헬스체크

**Backend Health Check:**
```python
# GET /health
{
  "status": "healthy",
  "mongodb": "connected",
  "chromadb": "connected",
  "ollama": "available"
}
```

**Docker Health Checks:**
- 각 서비스에 healthcheck 정의
- depends_on에서 조건부 시작

### 10.3 모니터링 도구 (선택사항)

- **Prometheus + Grafana**: 메트릭 수집
- **Loki**: 로그 집계
- **Uptime Kuma**: 서비스 상태 모니터링

---

## 11. 성능 최적화

### 11.1 컨테이너 최적화
- 멀티스테이지 빌드로 이미지 크기 감소
- .dockerignore로 불필요한 파일 제외
- 레이어 캐싱 활용

### 11.2 리소스 제한
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
    reservations:
      cpus: '1'
      memory: 2G
```

### 11.3 캐싱 전략
- Redis 추가 (선택사항)
- 프론트엔드 정적 자산 캐싱
- API 응답 캐싱

---

## 12. 개발 워크플로우

### 12.1 로컬 개발 시작

```bash
# 환경 변수 설정
cp .env.example .env

# Ollama 모델 다운로드 (최초 1회)
docker compose exec ollama ollama pull llama3.2:3b

# 서비스 시작
docker compose up -d

# 로그 확인
docker compose logs -f

# 서비스 중지
docker compose down

# 볼륨까지 삭제 (주의!)
docker compose down -v
```

### 12.2 개발 명령어

```bash
# 특정 서비스 재시작
docker compose restart backend

# 특정 서비스 로그
docker compose logs -f backend

# 컨테이너 쉘 접속
docker compose exec backend bash
docker compose exec frontend sh

# MongoDB 접속
docker compose exec mongodb mongosh -u admin -p changeme
```

### 12.3 프로덕션 배포

```bash
# 프로덕션 빌드 및 실행
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 업데이트 배포
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

---

## 13. 트러블슈팅

### 13.1 일반적인 문제

**포트 충돌:**
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :5174
lsof -i :8000

# 프로세스 종료
kill -9 <PID>
```

**볼륨 권한 문제:**
```bash
# 볼륨 권한 수정
sudo chown -R $USER:$USER volumes/
```

**Ollama 메모리 부족:**
- docker-compose.yml에서 메모리 제한 조정
- 더 작은 모델 사용 (phi-3-mini 등)

### 13.2 로그 확인

```bash
# 전체 로그
docker compose logs

# 특정 서비스 로그
docker compose logs backend
docker compose logs frontend

# 실시간 로그
docker compose logs -f
```

---

## 14. 백업 및 복구

### 14.1 백업 스크립트

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# MongoDB 백업
docker compose exec -T mongodb mongodump --archive > $BACKUP_DIR/mongodb.archive

# ChromaDB 백업
docker compose run --rm -v star-note_chromadb_data:/data -v $(pwd)/$BACKUP_DIR:/backup \
  alpine tar czf /backup/chromadb.tar.gz -C /data .

# 환경 변수 백업
cp .env $BACKUP_DIR/.env

echo "Backup completed: $BACKUP_DIR"
```

### 14.2 복구 스크립트

```bash
#!/bin/bash
# restore.sh <backup_directory>

BACKUP_DIR=$1

# MongoDB 복구
docker compose exec -T mongodb mongorestore --archive < $BACKUP_DIR/mongodb.archive

# ChromaDB 복구
docker compose run --rm -v star-note_chromadb_data:/data -v $(pwd)/$BACKUP_DIR:/backup \
  alpine tar xzf /backup/chromadb.tar.gz -C /data

echo "Restore completed from: $BACKUP_DIR"
```

---

## 15. 확장성 고려사항

### 15.1 수평 확장
- Backend: 여러 인스턴스 실행 가능
- Frontend: 정적 파일이므로 CDN 배포 가능
- MongoDB: Replica Set 구성 가능 (고급)

### 15.2 리소스 스케일링
- Ollama: GPU 지원 서버로 업그레이드 가능
- MongoDB: 더 큰 인스턴스로 업그레이드
- 전체: 더 큰 VPS로 마이그레이션

---

## 부록

### A. 유용한 명령어

```bash
# 전체 재빌드
docker compose build --no-cache

# 특정 서비스만 재빌드
docker compose build backend

# 볼륨 크기 확인
docker system df -v

# 사용하지 않는 리소스 정리
docker system prune -a --volumes
```

### B. 참고 자료
- OrbStack: https://orbstack.dev
- Docker Compose: https://docs.docker.com/compose/
- Railway: https://railway.app
- Hetzner Cloud: https://www.hetzner.com/cloud

---

**문서 관리**
- 이 TRD는 기술 스택 변경 시 업데이트됩니다.
- 배포 플랫폼 변경 시 관련 섹션을 수정합니다.

