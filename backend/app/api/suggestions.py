"""
Suggestion API Routes.
벡터 기반 연결 제안 API 엔드포인트 정의.
LLM 평가를 통한 하이브리드 스코어링 지원.
"""

from datetime import datetime
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query

from app.exceptions import DatabaseException, MemoNotFoundException
from app.models.memo import create_connection_document
from app.schemas.suggestion import (
    BatchSuggestionRequest,
    BatchSuggestionResponse,
    BatchSuggestionResult,
    SuggestionActionResponse,
    SuggestionApproveRequest,
    SuggestionItem,
    SuggestionListResponse,
    SuggestionRejectRequest,
)
from app.services.embedding_service import create_memo_embedding
from app.services.llm_service import batch_evaluate_connections
from app.services.mongo_service import get_database
from app.services.vector_service import get_embedding, search_similar

router = APIRouter(prefix="/api/suggestions", tags=["suggestions"])


def validate_object_id(id_str: str, field_name: str = "ID") -> ObjectId:
    """ObjectId 유효성 검증."""
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail=f"잘못된 {field_name} 형식입니다: {id_str}",
        )


async def get_memo_suggestions(
    memo_id: str,
    limit: int = 10,
    threshold: float = 0.5,
    use_llm: bool = True,
) -> SuggestionListResponse:
    """
    특정 메모에 대한 연결 제안을 가져옵니다.
    벡터 유사도로 후보를 선정하고, LLM으로 연결 가치를 평가합니다.

    - **memo_id**: 제안을 받을 메모 ID
    - **limit**: 제안 개수 (기본값: 10, 최대: 20)
    - **threshold**: 유사도 임계값 (기본값: 0.5)
    - **use_llm**: LLM 평가 사용 여부 (기본값: True)
    """
    db = get_database()
    oid = validate_object_id(memo_id, "memo_id")

    # 메모 조회
    memo = db.memos.find_one({"_id": oid})
    if not memo:
        raise MemoNotFoundException(memo_id)

    # 해당 메모의 임베딩 가져오기
    embedding_data = get_embedding(memo_id)

    if not embedding_data or not embedding_data.get("embedding"):
        # 임베딩이 없으면 새로 생성
        embedding = create_memo_embedding(
            memo.get("title", ""),
            memo.get("content", ""),
        )
    else:
        embedding = embedding_data["embedding"]

    # 이미 연결된 메모 ID 목록
    connections = memo.get("connections", [])
    connected_ids = [str(conn["target_id"]) for conn in connections]

    # 거부된 제안 목록 (rejection_history에서)
    rejected_ids = []
    rejection_history = memo.get("rejection_history", [])
    for rejection in rejection_history:
        rejected_ids.append(str(rejection.get("target_id", "")))

    # 제외할 ID (자기 자신 + 이미 연결 + 거부된 제안)
    exclude_ids = [memo_id] + connected_ids + rejected_ids

    # ChromaDB에서 유사한 메모 검색 (LLM 평가를 위해 더 많이 검색)
    search_limit = limit * 3 if use_llm else limit * 2
    similar_docs = search_similar(
        query_embedding=embedding,
        n_results=search_limit,
        exclude_ids=exclude_ids,
    )

    # 벡터 임계값 필터링
    vector_candidates = [doc for doc in similar_docs if doc["similarity"] >= threshold]

    if not vector_candidates:
        return SuggestionListResponse(
            suggestions=[],
            sourceMemoId=memo_id,
            threshold=threshold,
            total=0,
        )

    # LLM 평가 사용 시 하이브리드 스코어링
    if use_llm and vector_candidates:
        # 후보 메모 상세 정보 조회 (LLM 평가용)
        candidates_for_llm = []
        for doc in vector_candidates[:limit * 2]:  # LLM 평가할 후보 제한
            candidate_oid = ObjectId(doc["id"])
            candidate_memo = db.memos.find_one({"_id": candidate_oid})
            if candidate_memo:
                candidates_for_llm.append({
                    "id": doc["id"],
                    "title": candidate_memo.get("title", ""),
                    "content": candidate_memo.get("content", ""),
                    "zettel_id": candidate_memo.get("zettel_id", ""),
                    "similarity": doc["similarity"],
                })

        # LLM 배치 평가 (Solar Pro 22B 기준 약 20초/건)
        evaluated_results = await batch_evaluate_connections(
            source_memo={
                "title": memo.get("title", ""),
                "content": memo.get("content", ""),
            },
            candidates=candidates_for_llm,
            timeout_per_eval=60.0,
        )

        # 하이브리드 점수 기준 필터링 및 정렬
        suggestions = []
        for result in evaluated_results:
            # LLM이 연결 추천하지 않으면 제외 (단, 에러 시 벡터 기준으로 포함)
            if not result.get("connected") and not result.get("error"):
                continue

            if len(suggestions) >= limit:
                break

            suggestions.append(SuggestionItem(
                memoId=result["id"],
                title=result.get("title", "제목 없음"),
                zettelId=result.get("zettel_id", ""),
                similarity=round(result.get("hybrid_score", result.get("vector_similarity", 0)), 4),
                reason=result.get("reason", "AI 연결 제안"),
                contentPreview=result.get("content_preview", ""),
                llmScore=round(result.get("llm_score", 0), 4),
                vectorSimilarity=round(result.get("vector_similarity", 0), 4),
            ))
    else:
        # LLM 미사용 시 기존 벡터 기반 로직
        suggestions = []
        for doc in vector_candidates:
            if len(suggestions) >= limit:
                break

            metadata = doc.get("metadata", {})
            suggestions.append(SuggestionItem(
                memoId=doc["id"],
                title=metadata.get("title", "제목 없음"),
                zettelId=metadata.get("zettel_id", ""),
                similarity=round(doc["similarity"], 4),
                reason="벡터 유사도 기반 제안",
                contentPreview=metadata.get("content_preview", ""),
            ))

    return SuggestionListResponse(
        suggestions=suggestions,
        sourceMemoId=memo_id,
        threshold=threshold,
        total=len(suggestions),
    )


@router.get("/for/{memo_id}", response_model=SuggestionListResponse)
async def get_suggestions_for_memo(
    memo_id: str,
    limit: int = Query(10, ge=1, le=20, description="제안 개수"),
    threshold: float = Query(0.5, ge=0.0, le=1.0, description="유사도 임계값"),
    use_llm: bool = Query(True, alias="useLlm", description="LLM 평가 사용 여부"),
) -> SuggestionListResponse:
    """
    특정 메모에 대한 연결 제안을 가져옵니다.

    벡터 유사도로 후보를 선정하고, LLM으로 연결 가치를 평가합니다.
    하이브리드 점수 = 벡터 유사도(40%) + LLM 점수(60%)

    - **memo_id**: 제안을 받을 메모 ID
    - **limit**: 제안 개수 (기본값: 10, 최대: 20)
    - **threshold**: 유사도 임계값 (기본값: 0.5)
    - **use_llm**: LLM 평가 사용 여부 (기본값: true)
    """
    return await get_memo_suggestions(memo_id, limit, threshold, use_llm)


@router.post("/approve", response_model=SuggestionActionResponse)
async def approve_suggestion(data: SuggestionApproveRequest) -> SuggestionActionResponse:
    """
    제안된 연결을 승인합니다.

    승인 시 명시적 연결(explicit)로 양방향 연결이 생성됩니다.

    - **source_id**: 제안을 받은 메모 ID
    - **target_id**: 제안된 메모 ID
    """
    db = get_database()

    source_oid = validate_object_id(data.source_id, "source_id")
    target_oid = validate_object_id(data.target_id, "target_id")

    # 자기 자신 연결 방지
    if source_oid == target_oid:
        raise HTTPException(
            status_code=400,
            detail="자기 자신에게 연결할 수 없습니다.",
        )

    # 소스 메모 확인
    source_memo = db.memos.find_one({"_id": source_oid})
    if not source_memo:
        raise MemoNotFoundException(data.source_id)

    # 타겟 메모 확인
    target_memo = db.memos.find_one({"_id": target_oid})
    if not target_memo:
        raise MemoNotFoundException(data.target_id)

    # 중복 연결 확인
    existing_connection = db.memos.find_one({
        "_id": source_oid,
        "connections.target_id": target_oid,
    })

    if existing_connection:
        return SuggestionActionResponse(
            message="이미 연결이 존재합니다.",
            sourceId=data.source_id,
            targetId=data.target_id,
            action="approved",
            success=False,
        )

    # 연결 문서 생성 (explicit 타입으로)
    forward_conn = create_connection_document(
        target_id=target_oid,
        connection_type="explicit",
        strength=1.0,
        reason="AI 제안 승인",
    )

    backward_conn = create_connection_document(
        target_id=source_oid,
        connection_type="explicit",
        strength=1.0,
        reason="AI 제안 승인",
    )

    try:
        # 소스 → 타겟 연결 추가
        db.memos.update_one(
            {"_id": source_oid},
            {
                "$push": {"connections": forward_conn},
                "$inc": {"connection_count": 1},
                "$set": {"updated_at": datetime.utcnow()},
            },
        )

        # 타겟 → 소스 연결 추가 (양방향)
        db.memos.update_one(
            {"_id": target_oid},
            {
                "$push": {"connections": backward_conn},
                "$inc": {"connection_count": 1},
                "$set": {"updated_at": datetime.utcnow()},
            },
        )
    except Exception as e:
        raise DatabaseException(f"연결 생성 실패: {str(e)}")

    return SuggestionActionResponse(
        message="제안이 승인되어 연결이 생성되었습니다.",
        sourceId=data.source_id,
        targetId=data.target_id,
        action="approved",
        success=True,
    )


@router.post("/reject", response_model=SuggestionActionResponse)
async def reject_suggestion(data: SuggestionRejectRequest) -> SuggestionActionResponse:
    """
    제안된 연결을 거부합니다.

    거부 기록은 향후 같은 제안이 다시 표시되지 않도록 저장됩니다.

    - **source_id**: 제안을 받은 메모 ID
    - **target_id**: 거부할 메모 ID
    - **reason**: 거부 이유 (선택)
    """
    db = get_database()

    source_oid = validate_object_id(data.source_id, "source_id")
    target_oid = validate_object_id(data.target_id, "target_id")

    # 소스 메모 확인
    source_memo = db.memos.find_one({"_id": source_oid})
    if not source_memo:
        raise MemoNotFoundException(data.source_id)

    # 타겟 메모 확인
    target_memo = db.memos.find_one({"_id": target_oid})
    if not target_memo:
        raise MemoNotFoundException(data.target_id)

    # 거부 기록 저장
    rejection_record = {
        "target_id": target_oid,
        "reason": data.reason,
        "rejected_at": datetime.utcnow(),
    }

    try:
        # 기존 거부 기록이 있으면 업데이트, 없으면 추가
        result = db.memos.update_one(
            {
                "_id": source_oid,
                "rejection_history.target_id": target_oid,
            },
            {
                "$set": {
                    "rejection_history.$.reason": data.reason,
                    "rejection_history.$.rejected_at": datetime.utcnow(),
                },
            },
        )

        if result.matched_count == 0:
            # 새 거부 기록 추가
            db.memos.update_one(
                {"_id": source_oid},
                {
                    "$push": {"rejection_history": rejection_record},
                },
            )
    except Exception as e:
        raise DatabaseException(f"거부 기록 저장 실패: {str(e)}")

    return SuggestionActionResponse(
        message="제안이 거부되었습니다.",
        sourceId=data.source_id,
        targetId=data.target_id,
        action="rejected",
        success=True,
    )


def generate_suggestions_for_memo(
    memo_id: str,
    limit: int = 10,
    threshold: float = 0.5,
) -> dict:
    """
    특정 메모에 대한 제안을 동기적으로 생성합니다.
    배치 처리용 내부 함수.
    """
    try:
        db = get_database()
        oid = ObjectId(memo_id)

        # 메모 조회
        memo = db.memos.find_one({"_id": oid})
        if not memo:
            return {"memo_id": memo_id, "count": 0, "error": "메모를 찾을 수 없음"}

        # 임베딩 가져오기
        embedding_data = get_embedding(memo_id)
        if not embedding_data or not embedding_data.get("embedding"):
            embedding = create_memo_embedding(
                memo.get("title", ""),
                memo.get("content", ""),
            )
        else:
            embedding = embedding_data["embedding"]

        # 이미 연결된 메모 + 거부된 메모 제외
        connections = memo.get("connections", [])
        connected_ids = [str(conn["target_id"]) for conn in connections]

        rejection_history = memo.get("rejection_history", [])
        rejected_ids = [str(r.get("target_id", "")) for r in rejection_history]

        exclude_ids = [memo_id] + connected_ids + rejected_ids

        # 유사 메모 검색
        similar_docs = search_similar(
            query_embedding=embedding,
            n_results=limit * 2,
            exclude_ids=exclude_ids,
        )

        # 임계값 필터링
        suggestions = [
            doc for doc in similar_docs
            if doc["similarity"] >= threshold
        ][:limit]

        return {
            "memo_id": memo_id,
            "count": len(suggestions),
            "suggestions": suggestions,
        }

    except Exception as e:
        return {"memo_id": memo_id, "count": 0, "error": str(e)}


def batch_generate_suggestions_background(
    memo_ids: Optional[list[str]],
    limit: int,
    threshold: float,
) -> None:
    """
    배치로 제안을 생성하는 백그라운드 함수.
    """
    db = get_database()

    if memo_ids is None:
        # 모든 메모 대상
        cursor = db.memos.find({}, {"_id": 1})
        memo_ids = [str(doc["_id"]) for doc in cursor]

    total_suggestions = 0
    for memo_id in memo_ids:
        result = generate_suggestions_for_memo(memo_id, limit, threshold)
        if "count" in result:
            total_suggestions += result["count"]

    print(f"Batch suggestion generation complete: {len(memo_ids)} memos, {total_suggestions} suggestions")


@router.post("/batch", response_model=BatchSuggestionResponse)
async def batch_generate_suggestions(
    data: BatchSuggestionRequest,
    background_tasks: BackgroundTasks,
) -> BatchSuggestionResponse:
    """
    여러 메모에 대한 제안을 배치로 생성합니다.

    백그라운드에서 처리되며, 즉시 응답을 반환합니다.

    - **memo_ids**: 제안을 생성할 메모 ID 목록 (없으면 전체 메모)
    - **limit**: 메모당 제안 개수
    - **threshold**: 유사도 임계값
    """
    db = get_database()

    memo_ids = data.memo_ids
    if memo_ids is None:
        # 모든 메모 ID 가져오기
        cursor = db.memos.find({}, {"_id": 1})
        memo_ids = [str(doc["_id"]) for doc in cursor]

    # 동기적으로 즉시 결과 계산 (소량일 경우)
    results = []
    total_suggestions = 0

    if len(memo_ids) <= 10:
        # 10개 이하면 동기 처리
        for memo_id in memo_ids:
            result = generate_suggestions_for_memo(memo_id, data.limit, data.threshold)
            results.append(BatchSuggestionResult(
                memoId=memo_id,
                suggestionCount=result.get("count", 0),
                error=result.get("error"),
            ))
            total_suggestions += result.get("count", 0)
    else:
        # 10개 초과면 백그라운드 처리
        background_tasks.add_task(
            batch_generate_suggestions_background,
            memo_ids,
            data.limit,
            data.threshold,
        )

        # 일단 예상 결과 반환
        for memo_id in memo_ids:
            results.append(BatchSuggestionResult(
                memoId=memo_id,
                suggestionCount=0,  # 백그라운드 처리 중
                error=None,
            ))

    return BatchSuggestionResponse(
        results=results,
        totalMemos=len(memo_ids),
        totalSuggestions=total_suggestions,
    )
