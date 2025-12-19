# AI Integration Skill

ChromaDB 벡터 검색 및 Ollama LLM 통합을 위한 스킬입니다.

## 사용 시점
- 임베딩 생성 로직 구현 시
- 벡터 유사도 검색 구현 시
- LLM 연결 제안 로직 구현 시
- 프롬프트 엔지니어링 시

## 임베딩 서비스

### Sentence Transformers 설정
```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

def generate_embedding(text: str) -> list[float]:
    """텍스트를 384차원 벡터로 변환"""
    return model.encode(text).tolist()

def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """배치 임베딩 생성"""
    return model.encode(texts).tolist()
```

### 임베딩 저장 (백그라운드)
```python
from fastapi import BackgroundTasks

@router.post("/api/memos")
async def create_memo(memo: MemoCreate, background_tasks: BackgroundTasks):
    # 메모 저장
    result = await save_memo(memo)

    # 임베딩은 백그라운드에서 처리
    background_tasks.add_task(generate_and_store_embedding, result.id)

    return result
```

## 벡터 검색 (ChromaDB)

### 유사 메모 검색
```python
import chromadb

client = chromadb.HttpClient(host="chromadb", port=8000)
collection = client.get_collection("memos")

def find_similar_memos(memo_id: str, n_results: int = 10) -> list[dict]:
    # 현재 메모의 임베딩 가져오기
    current = collection.get(ids=[memo_id], include=["embeddings"])

    # 유사 메모 검색
    results = collection.query(
        query_embeddings=current["embeddings"],
        n_results=n_results + 1,  # 자기 자신 제외
        include=["metadatas", "distances"]
    )

    # 자기 자신 제외 및 유사도 계산
    suggestions = []
    for i, id in enumerate(results["ids"][0]):
        if id != memo_id:
            suggestions.append({
                "memoId": id,
                "title": results["metadatas"][0][i]["title"],
                "similarity": 1 - results["distances"][0][i]  # 코사인 거리 -> 유사도
            })

    return suggestions[:n_results]
```

## LLM 서비스 (Ollama)

### Ollama 클라이언트
```python
import httpx

OLLAMA_URL = "http://ollama:11434"

async def generate_response(prompt: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": "llama3.2:3b",
                "prompt": prompt,
                "stream": False
            },
            timeout=30.0
        )
        return response.json()["response"]
```

### 연결 평가 프롬프트
```python
EVALUATION_PROMPT = """
두 메모 사이의 의미적 연결을 평가해주세요.

## 메모 A
제목: {title_a}
내용: {content_a}

## 메모 B
제목: {title_b}
내용: {content_b}

## 평가 기준
- 두 메모가 의미적으로 관련이 있는지
- 연결 강도 (0.0 ~ 1.0)
- 연결 이유

JSON 형식으로 응답해주세요:
{{"connected": true/false, "strength": 0.0-1.0, "reason": "연결 이유"}}
"""

async def evaluate_connection(memo_a: dict, memo_b: dict) -> dict:
    prompt = EVALUATION_PROMPT.format(
        title_a=memo_a["title"],
        content_a=memo_a["content"][:500],
        title_b=memo_b["title"],
        content_b=memo_b["content"][:500]
    )

    response = await generate_response(prompt)

    # JSON 파싱
    import json
    try:
        return json.loads(response)
    except:
        return {"connected": False, "strength": 0, "reason": "파싱 실패"}
```

## 하이브리드 제안 시스템

### 2단계 제안 로직
```python
async def get_hybrid_suggestions(memo_id: str, use_llm: bool = False) -> list[dict]:
    # 1단계: 벡터 검색으로 후보 필터링
    candidates = find_similar_memos(memo_id, n_results=20)

    if not use_llm:
        return candidates[:10]

    # 2단계: LLM으로 상위 후보 재평가
    memo = await get_memo(memo_id)
    top_candidates = candidates[:5]

    refined = []
    for candidate in top_candidates:
        candidate_memo = await get_memo(candidate["memoId"])
        evaluation = await evaluate_connection(memo, candidate_memo)

        if evaluation["connected"]:
            refined.append({
                **candidate,
                "llmStrength": evaluation["strength"],
                "reason": evaluation["reason"],
                "hybridScore": (candidate["similarity"] + evaluation["strength"]) / 2
            })

    return sorted(refined, key=lambda x: x["hybridScore"], reverse=True)
```

## 성능 고려사항

- 임베딩 생성: 백그라운드 처리 (UI 블로킹 방지)
- 벡터 검색: < 500ms 목표
- LLM 평가: < 5초 (비동기 처리)
- 배치 처리로 성능 최적화

## 명령어

```bash
# Ollama 상태 확인
curl http://localhost:11434/api/tags

# 모델 테스트
docker compose exec ollama ollama run llama3.2:3b "테스트"

# ChromaDB 상태 확인 (내부 네트워크)
docker compose exec backend curl http://chromadb:8000/api/v1/heartbeat
```
