# Database Skill

MongoDB 및 ChromaDB 데이터베이스 작업을 위한 스킬입니다.

## 사용 시점
- MongoDB 스키마 설계 시
- 쿼리 작성 및 최적화 시
- ChromaDB 벡터 작업 시
- 인덱스 설계 시

## MongoDB 스키마

### Memo Collection
```javascript
{
  _id: ObjectId,
  zettelId: "2024-12-25-001",     // 유니크, Zettelkasten ID
  title: "메모 제목",              // 최대 200자
  content: "마크다운 내용...",
  createdAt: ISODate(),
  updatedAt: ISODate(),
  connections: [
    {
      targetId: ObjectId,
      type: "explicit" | "suggested",
      strength: 0.85,              // 0.0 ~ 1.0
      createdAt: ISODate()
    }
  ],
  mentions: ["다른메모", "참조메모"],
  tags: ["태그1", "태그2"],
  connectionCount: 5               // 자동 계산
}
```

### 인덱스 설계
```javascript
// 유니크 인덱스
db.memos.createIndex({ zettelId: 1 }, { unique: true })

// 검색용 텍스트 인덱스
db.memos.createIndex({ title: "text", content: "text" })

// 필터링/정렬용 인덱스
db.memos.createIndex({ tags: 1 })
db.memos.createIndex({ createdAt: -1 })
db.memos.createIndex({ updatedAt: -1 })
db.memos.createIndex({ connectionCount: -1 })
```

## 주요 쿼리 패턴

### 메모 목록 조회 (페이지네이션)
```javascript
db.memos.find({ tags: "태그1" })
  .sort({ createdAt: -1 })
  .skip(20)
  .limit(20)
```

### 텍스트 검색
```javascript
db.memos.find({ $text: { $search: "검색어" } })
```

### 연결 추가 (양방향)
```javascript
// Source 메모에 연결 추가
db.memos.updateOne(
  { _id: sourceId },
  {
    $push: { connections: { targetId, type: "explicit", strength: 1.0, createdAt: new Date() } },
    $inc: { connectionCount: 1 }
  }
)

// Target 메모에 역방향 연결 추가
db.memos.updateOne(
  { _id: targetId },
  {
    $push: { connections: { targetId: sourceId, type: "explicit", strength: 1.0, createdAt: new Date() } },
    $inc: { connectionCount: 1 }
  }
)
```

### 그래프 데이터 조회
```javascript
db.memos.aggregate([
  { $match: { connectionCount: { $gte: 1 } } },
  { $project: {
      id: "$_id",
      label: "$title",
      zettelId: 1,
      connections: { $size: "$connections" },
      tags: 1
  }}
])
```

## ChromaDB 사용

### Collection 구조
```python
collection = client.get_or_create_collection(
    name="memos",
    metadata={"hnsw:space": "cosine"}
)
```

### 임베딩 저장
```python
collection.add(
    ids=[str(memo_id)],
    embeddings=[embedding_vector],
    metadatas=[{"title": title, "zettelId": zettel_id}],
    documents=[content]
)
```

### 유사도 검색
```python
results = collection.query(
    query_embeddings=[query_embedding],
    n_results=10,
    where={"zettelId": {"$ne": current_zettel_id}}
)
```

### 임베딩 업데이트
```python
collection.update(
    ids=[str(memo_id)],
    embeddings=[new_embedding],
    metadatas=[{"title": new_title}]
)
```

## MongoDB Shell 접속
```bash
docker compose exec mongodb mongosh -u admin -p changeme

# DB 선택
use star_note

# 컬렉션 확인
show collections

# 데이터 확인
db.memos.find().limit(5).pretty()

# 인덱스 확인
db.memos.getIndexes()
```

## 백업/복구

### MongoDB 백업
```bash
docker compose exec -T mongodb mongodump --archive > backup.archive
```

### MongoDB 복구
```bash
docker compose exec -T mongodb mongorestore --archive < backup.archive
```
