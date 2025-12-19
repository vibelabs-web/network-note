# Database Design - 데이터베이스 설계서

## Star Note - 데이터베이스 아키텍처

**버전:** 1.0
**작성일:** 2024-12-25
**목적:** MongoDB 및 ChromaDB 스키마 설계 및 데이터 모델 정의

---

## 목차

1. [데이터베이스 개요](#1-데이터베이스-개요)
2. [MongoDB 스키마](#2-mongodb-스키마)
3. [ChromaDB 스키마](#3-chromadb-스키마)
4. [인덱스 전략](#4-인덱스-전략)
5. [데이터 관계](#5-데이터-관계)
6. [쿼리 패턴](#6-쿼리-패턴)
7. [데이터 마이그레이션](#7-데이터-마이그레이션)

---

## 1. 데이터베이스 개요

### 1.1 데이터베이스 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Star Note Database Layer                  │
├─────────────────────────────┬───────────────────────────────┤
│         MongoDB             │           ChromaDB            │
│     (Document Store)        │        (Vector Store)         │
├─────────────────────────────┼───────────────────────────────┤
│ • 메모 데이터               │ • 임베딩 벡터                  │
│ • 연결 관계                 │ • 유사도 검색                  │
│ • 메타데이터                │ • 메타데이터 (검색용)          │
│ • 사용자 설정               │                               │
└─────────────────────────────┴───────────────────────────────┘
```

### 1.2 데이터베이스 선택 이유

| 데이터베이스 | 용도 | 선택 이유 |
|-------------|------|----------|
| **MongoDB** | 메모 저장 | 유연한 스키마, 중첩 문서 지원, 강력한 쿼리 |
| **ChromaDB** | 벡터 검색 | 경량, 로컬 실행, Python 네이티브 지원 |

### 1.3 연결 정보

```yaml
# MongoDB
Host: mongodb
Port: 27017
Database: star_note
Username: admin
Password: ${MONGO_ROOT_PASSWORD}

# ChromaDB
Host: chromadb
Port: 8000 (내부)
Collection: memos
```

---

## 2. MongoDB 스키마

### 2.1 Memos Collection

메모 문서의 핵심 스키마입니다.

```javascript
// Collection: memos
{
  "_id": ObjectId("..."),           // MongoDB 자동 생성 ID

  // 기본 정보
  "zettelId": "2024-12-25-001",     // 제텔카스텐 고유 ID (YYYY-MM-DD-XXX)
  "title": "메모 제목",             // 제목 (필수, 최대 200자)
  "content": "마크다운 내용...",    // 본문 (마크다운 형식)

  // 시간 정보
  "createdAt": ISODate("2024-12-25T10:00:00Z"),  // 생성 시간
  "updatedAt": ISODate("2024-12-25T12:30:00Z"),  // 수정 시간

  // 연결 정보
  "connections": [
    {
      "targetId": ObjectId("..."),   // 연결 대상 메모 ID
      "type": "explicit",            // "explicit" | "suggested"
      "strength": 0.85,              // 연결 강도 (0.0 ~ 1.0)
      "reason": "멘션으로 연결됨",   // 연결 이유 (선택적)
      "createdAt": ISODate("...")    // 연결 생성 시간
    }
  ],

  // 멘션 정보
  "mentions": ["다른 메모 제목", "또 다른 메모"],  // @멘션된 메모명 목록

  // 태그 정보
  "tags": ["javascript", "react", "프로젝트"],    // 태그 목록 (소문자 저장)

  // 통계 정보 (자동 계산)
  "connectionCount": 5,              // 연결 수 (인덱싱용)

  // 선택적 필드
  "isFavorite": false,               // 즐겨찾기 여부
  "isArchived": false                // 보관 여부
}
```

### 2.2 Connection 서브문서 상세

```javascript
// Connection 서브문서 스키마
{
  "targetId": ObjectId("..."),       // 필수: 연결 대상 메모 ObjectId
  "type": "explicit" | "suggested",  // 필수: 연결 타입
  "strength": Number,                // 필수: 0.0 ~ 1.0
  "reason": String,                  // 선택: 연결 이유 (LLM 생성)
  "createdAt": ISODate,              // 필수: 연결 생성 시간
  "approvedAt": ISODate              // 선택: 제안 승인 시간 (suggested → explicit)
}
```

### 2.3 연결 타입 정의

| 타입 | 설명 | 생성 방법 | strength 기본값 |
|-----|------|----------|----------------|
| `explicit` | 명시적 연결 | 사용자 멘션 또는 수동 생성 | 1.0 |
| `suggested` | AI 제안 연결 | 벡터 유사도 + LLM 평가 | 유사도 점수 |

### 2.4 Settings Collection (선택적)

사용자 설정을 저장하는 컬렉션입니다.

```javascript
// Collection: settings
{
  "_id": ObjectId("..."),
  "key": "theme",                    // 설정 키
  "value": "dark",                   // 설정 값
  "updatedAt": ISODate("...")        // 수정 시간
}
```

### 2.5 Tags Collection (선택적)

태그 메타데이터를 저장합니다.

```javascript
// Collection: tags
{
  "_id": ObjectId("..."),
  "name": "javascript",              // 태그명 (소문자)
  "color": "#F7DF1E",                // 태그 색상 (선택적)
  "memoCount": 15,                   // 해당 태그의 메모 수
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

## 3. ChromaDB 스키마

### 3.1 Memos Collection

벡터 임베딩을 저장하는 컬렉션입니다.

```python
# Collection: memos
{
    "id": "507f1f77bcf86cd799439011",   # MongoDB ObjectId (문자열)

    "embedding": [0.123, -0.456, ...],   # 384차원 벡터 (all-MiniLM-L6-v2)

    "document": "메모 제목\n\n메모 내용...",  # 원본 텍스트 (검색용)

    "metadata": {
        "title": "메모 제목",
        "zettelId": "2024-12-25-001",
        "tags": ["tag1", "tag2"],          # 태그 목록
        "connectionCount": 5,              # 연결 수
        "createdAt": "2024-12-25T10:00:00Z"
    }
}
```

### 3.2 임베딩 모델 사양

| 항목 | 값 |
|-----|-----|
| **모델명** | all-MiniLM-L6-v2 |
| **차원 수** | 384 |
| **최대 토큰** | 256 |
| **언어** | 다국어 지원 (한국어 포함) |
| **용도** | 문장/문단 임베딩 |

### 3.3 임베딩 생성 로직

```python
# 임베딩 대상 텍스트 구성
embedding_text = f"{title}\n\n{content}"

# 텍스트가 너무 길면 앞부분만 사용 (256 토큰 제한)
if len(embedding_text) > 1000:
    embedding_text = embedding_text[:1000]
```

---

## 4. 인덱스 전략

### 4.1 MongoDB 인덱스

```javascript
// 1. zettelId 유니크 인덱스 (중복 방지)
db.memos.createIndex(
  { "zettelId": 1 },
  { unique: true, name: "idx_zettelId" }
)

// 2. 텍스트 인덱스 (전문 검색)
db.memos.createIndex(
  { "title": "text", "content": "text" },
  {
    name: "idx_text_search",
    weights: { title: 10, content: 1 },  // 제목에 가중치
    default_language: "none"              // 언어 분석 비활성화
  }
)

// 3. 태그 다중 키 인덱스 (태그 필터링)
db.memos.createIndex(
  { "tags": 1 },
  { name: "idx_tags" }
)

// 4. 생성일 내림차순 인덱스 (최신순 정렬)
db.memos.createIndex(
  { "createdAt": -1 },
  { name: "idx_createdAt" }
)

// 5. 수정일 내림차순 인덱스 (최근 수정순)
db.memos.createIndex(
  { "updatedAt": -1 },
  { name: "idx_updatedAt" }
)

// 6. 연결 수 내림차순 인덱스 (연결순 정렬)
db.memos.createIndex(
  { "connectionCount": -1 },
  { name: "idx_connectionCount" }
)

// 7. 복합 인덱스 (태그 + 생성일)
db.memos.createIndex(
  { "tags": 1, "createdAt": -1 },
  { name: "idx_tags_createdAt" }
)

// 8. 연결 대상 ID 인덱스 (양방향 연결 조회)
db.memos.createIndex(
  { "connections.targetId": 1 },
  { name: "idx_connections_targetId" }
)
```

### 4.2 인덱스 성능 고려사항

| 인덱스 | 용도 | 예상 쿼리 |
|-------|------|----------|
| `idx_zettelId` | ID로 조회 | 단일 메모 조회 |
| `idx_text_search` | 전문 검색 | 제목/내용 검색 |
| `idx_tags` | 태그 필터링 | 태그별 메모 목록 |
| `idx_createdAt` | 최신순 정렬 | 메모 목록 기본 정렬 |
| `idx_connectionCount` | 연결순 정렬 | 허브 메모 찾기 |

---

## 5. 데이터 관계

### 5.1 ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────────────┐
│                              MEMOS                                   │
├─────────────────────────────────────────────────────────────────────┤
│ _id          : ObjectId (PK)                                        │
│ zettelId     : String (UNIQUE)                                      │
│ title        : String                                               │
│ content      : String                                               │
│ createdAt    : DateTime                                             │
│ updatedAt    : DateTime                                             │
│ tags         : String[]                                             │
│ mentions     : String[]                                             │
│ connectionCount : Integer                                           │
├─────────────────────────────────────────────────────────────────────┤
│                         EMBEDDED: connections[]                      │
│  ├─ targetId   : ObjectId (FK → MEMOS._id)                         │
│  ├─ type       : "explicit" | "suggested"                          │
│  ├─ strength   : Float                                              │
│  ├─ reason     : String                                             │
│  └─ createdAt  : DateTime                                           │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ 1:N (자기 참조)
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CHROMADB: memos                               │
├─────────────────────────────────────────────────────────────────────┤
│ id           : String (MongoDB _id)                                 │
│ embedding    : Float[384]                                           │
│ document     : String                                               │
│ metadata     : { title, zettelId, tags[], connectionCount }        │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 연결 관계 다이어그램

```
       ┌──────────┐                    ┌──────────┐
       │  Memo A  │                    │  Memo B  │
       │          │                    │          │
       │connections:                   │connections:
       │ ├─targetId: B                 │ ├─targetId: A
       │ │ type: explicit              │ │ type: explicit
       │ │ strength: 1.0               │ │ strength: 1.0
       │ │                             │ │
       │ └─targetId: C                 │ └─targetId: D
       │   type: suggested             │   type: suggested
       │   strength: 0.85              │   strength: 0.72
       └──────────┘                    └──────────┘
            │                               │
            │     양방향 연결 (explicit)     │
            └───────────────────────────────┘
```

### 5.3 양방향 연결 규칙

1. **명시적 연결 (explicit)**
   - A → B 연결 생성 시 자동으로 B → A 연결도 생성
   - 양쪽 strength는 동일하게 1.0

2. **제안 연결 (suggested)**
   - 단방향으로 저장 (제안 받은 메모에만)
   - 승인 시 양방향 explicit으로 변환

---

## 6. 쿼리 패턴

### 6.1 메모 CRUD 쿼리

```javascript
// 메모 목록 조회 (페이지네이션 + 정렬)
db.memos.find({})
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit)

// 태그 필터링
db.memos.find({ tags: { $in: ["javascript", "react"] } })
  .sort({ createdAt: -1 })

// 전문 검색
db.memos.find({
  $text: { $search: "검색어" }
})
.sort({ score: { $meta: "textScore" } })

// 연결순 정렬 (허브 메모 찾기)
db.memos.find({})
  .sort({ connectionCount: -1 })
  .limit(10)
```

### 6.2 연결 관련 쿼리

```javascript
// 특정 메모의 연결 목록 조회
db.memos.aggregate([
  { $match: { _id: ObjectId("...") } },
  { $unwind: "$connections" },
  { $lookup: {
      from: "memos",
      localField: "connections.targetId",
      foreignField: "_id",
      as: "connectedMemo"
  }},
  { $unwind: "$connectedMemo" },
  { $project: {
      targetId: "$connections.targetId",
      type: "$connections.type",
      strength: "$connections.strength",
      title: "$connectedMemo.title",
      zettelId: "$connectedMemo.zettelId"
  }}
])

// 양방향 연결 생성 (트랜잭션)
session.withTransaction(() => {
  // 소스 → 타겟 연결
  db.memos.updateOne(
    { _id: sourceId },
    {
      $push: { connections: { targetId, type: "explicit", strength: 1.0, createdAt: new Date() } },
      $inc: { connectionCount: 1 }
    }
  )

  // 타겟 → 소스 연결 (양방향)
  db.memos.updateOne(
    { _id: targetId },
    {
      $push: { connections: { targetId: sourceId, type: "explicit", strength: 1.0, createdAt: new Date() } },
      $inc: { connectionCount: 1 }
    }
  )
})
```

### 6.3 그래프 데이터 쿼리

```javascript
// 전체 그래프 데이터 조회
db.memos.aggregate([
  // 노드 데이터
  { $project: {
      id: { $toString: "$_id" },
      label: "$title",
      zettelId: "$zettelId",
      connections: "$connectionCount",
      tags: "$tags",
      level: {
        $switch: {
          branches: [
            { case: { $eq: ["$connectionCount", 0] }, then: 0 },
            { case: { $lte: ["$connectionCount", 2] }, then: 1 },
            { case: { $lte: ["$connectionCount", 5] }, then: 2 },
            { case: { $lte: ["$connectionCount", 10] }, then: 3 },
          ],
          default: 4
        }
      }
  }}
])

// 엣지 데이터 조회
db.memos.aggregate([
  { $unwind: "$connections" },
  { $project: {
      source: { $toString: "$_id" },
      target: { $toString: "$connections.targetId" },
      type: "$connections.type",
      strength: "$connections.strength"
  }},
  // 중복 제거 (A→B, B→A 중 하나만)
  { $match: {
      $expr: { $lt: ["$source", "$target"] }
  }}
])
```

### 6.4 ChromaDB 쿼리

```python
# 유사 메모 검색
results = collection.query(
    query_embeddings=[memo_embedding],
    n_results=20,
    where={"$and": [
        {"id": {"$ne": current_memo_id}},  # 자신 제외
    ]},
    include=["embeddings", "documents", "metadatas", "distances"]
)

# 태그 기반 필터링 검색
results = collection.query(
    query_embeddings=[memo_embedding],
    n_results=10,
    where={"tags": {"$contains": "javascript"}},
    include=["metadatas", "distances"]
)
```

---

## 7. 데이터 마이그레이션

### 7.1 초기 데이터 설정

```javascript
// 인덱스 생성 스크립트
// backend/scripts/init_db.py 에서 실행

async function initializeDatabase() {
  // 컬렉션 생성
  await db.createCollection("memos")

  // 인덱스 생성
  await db.memos.createIndex({ "zettelId": 1 }, { unique: true })
  await db.memos.createIndex({ "title": "text", "content": "text" })
  await db.memos.createIndex({ "tags": 1 })
  await db.memos.createIndex({ "createdAt": -1 })
  await db.memos.createIndex({ "connectionCount": -1 })

  console.log("Database initialized successfully")
}
```

### 7.2 데이터 마이그레이션 전략

```python
# 마이그레이션 버전 관리
# backend/app/migrations/

"""
migrations/
├── v001_initial_schema.py      # 초기 스키마
├── v002_add_connection_reason.py  # reason 필드 추가
├── v003_add_favorite_field.py  # isFavorite 필드 추가
└── __init__.py
"""

# 마이그레이션 실행
class Migration:
    version = "v001"

    async def up(self, db):
        """마이그레이션 적용"""
        pass

    async def down(self, db):
        """마이그레이션 롤백"""
        pass
```

### 7.3 백업 및 복구

```bash
# MongoDB 백업
docker compose exec mongodb mongodump \
  --uri="mongodb://admin:changeme@localhost:27017" \
  --db=star_note \
  --archive > backup_$(date +%Y%m%d).archive

# MongoDB 복구
docker compose exec mongodb mongorestore \
  --uri="mongodb://admin:changeme@localhost:27017" \
  --archive < backup_20241225.archive

# ChromaDB 백업 (볼륨 전체)
docker run --rm \
  -v star-note_chromadb_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/chromadb_$(date +%Y%m%d).tar.gz -C /data .
```

---

## 부록

### A. 데이터 검증 규칙

| 필드 | 타입 | 필수 | 검증 규칙 |
|-----|------|-----|----------|
| title | String | O | 1~200자, 빈 문자열 불가 |
| content | String | O | 빈 문자열 허용 |
| zettelId | String | O | YYYY-MM-DD-XXX 형식 |
| tags | String[] | X | 각 태그 1~50자, 소문자 저장 |
| connections.type | String | O | "explicit" 또는 "suggested" |
| connections.strength | Float | O | 0.0 ~ 1.0 범위 |

### B. Zettel ID 생성 규칙

```python
def generate_zettel_id() -> str:
    """
    형식: YYYY-MM-DD-XXX
    예시: 2024-12-25-001, 2024-12-25-002

    - YYYY: 4자리 연도
    - MM: 2자리 월 (01-12)
    - DD: 2자리 일 (01-31)
    - XXX: 해당 날짜의 순번 (001부터 시작)
    """
    today = date.today().isoformat()  # 2024-12-25

    # 오늘 생성된 마지막 메모 조회
    last_memo = db.memos.find_one(
        {"zettelId": {"$regex": f"^{today}"}},
        sort=[("zettelId", -1)]
    )

    if last_memo:
        last_seq = int(last_memo["zettelId"].split("-")[-1])
        new_seq = last_seq + 1
    else:
        new_seq = 1

    return f"{today}-{new_seq:03d}"
```

### C. 데이터 정합성 유지

```python
# 연결 수 자동 계산 트리거 (애플리케이션 레벨)
async def update_connection_count(memo_id: ObjectId):
    """메모의 연결 수를 재계산하여 업데이트"""
    memo = await db.memos.find_one({"_id": memo_id})
    if memo:
        count = len(memo.get("connections", []))
        await db.memos.update_one(
            {"_id": memo_id},
            {"$set": {"connectionCount": count}}
        )

# 메모 삭제 시 연결 정리
async def cleanup_connections(deleted_memo_id: ObjectId):
    """삭제된 메모를 참조하는 모든 연결 제거"""
    await db.memos.update_many(
        {"connections.targetId": deleted_memo_id},
        {
            "$pull": {"connections": {"targetId": deleted_memo_id}},
            "$inc": {"connectionCount": -1}
        }
    )
```

---

**문서 관리**
- 스키마 변경 시 이 문서를 업데이트합니다.
- 새로운 인덱스 추가 시 성능 테스트 결과를 기록합니다.
