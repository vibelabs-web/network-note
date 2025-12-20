"""
Memo API Routes.
메모 CRUD API 엔드포인트 정의.
"""

import math
from datetime import datetime
from typing import Literal, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError

from app.exceptions import (
    DatabaseException,
    DuplicateZettelIdException,
    MemoNotFoundException,
)
from app.models.memo import (
    create_memo_document,
    memo_document_to_response,
)
from app.schemas.memo import (
    MemoCreate,
    MemoListResponse,
    MemoResponse,
    MemoUpdate,
)
from app.schemas.connection import (
    MemoNameSearchResult,
    MemoNameSearchResponse,
)
from app.schemas.suggestion import SuggestionListResponse
from app.services.mongo_service import get_database
from app.services.embedding_service import create_memo_embedding
from app.services.vector_service import add_embedding, delete_embedding
from app.utils.zettel_id import generate_zettel_id
from app.utils.mention_parser import extract_mentions
from app.models.memo import create_connection_document

router = APIRouter(prefix="/api/memos", tags=["memos"])


def save_embedding_background(
    doc_id: str,
    title: str,
    content: str,
    zettel_id: str,
) -> None:
    """
    백그라운드에서 임베딩을 생성하고 ChromaDB에 저장합니다.

    Args:
        doc_id: 메모 ID (문자열)
        title: 메모 제목
        content: 메모 내용
        zettel_id: Zettel ID
    """
    try:
        # 임베딩 생성
        embedding = create_memo_embedding(title, content)

        # ChromaDB에 저장 (내용은 검색 결과 표시용으로 일부만 저장)
        metadata = {
            "title": title,
            "zettel_id": zettel_id,
            "content_preview": content[:500] if content else "",
        }
        add_embedding(doc_id, embedding, metadata)
        print(f"Embedding saved for memo: {doc_id}")
    except Exception as e:
        # 임베딩 실패해도 메모 저장은 성공 상태 유지
        print(f"Failed to save embedding for memo {doc_id}: {e}")


def validate_object_id(memo_id: str) -> ObjectId:
    """ObjectId 유효성 검증."""
    try:
        return ObjectId(memo_id)
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail=f"잘못된 메모 ID 형식입니다: {memo_id}",
        )


@router.get("/search/names", response_model=MemoNameSearchResponse)
async def search_memo_names(
    q: str = Query(..., min_length=1, description="검색어"),
    limit: int = Query(10, ge=1, le=20, description="최대 결과 수"),
) -> MemoNameSearchResponse:
    """
    멘션 자동완성을 위한 메모명 검색.

    제목 또는 Zettel ID로 검색합니다.

    - **q**: 검색어 (필수)
    - **limit**: 최대 결과 수 (기본값: 10, 최대: 20)
    """
    db = get_database()

    import re
    escaped_q = re.escape(q)

    # 제목 또는 Zettel ID로 검색 (대소문자 무시)
    query = {
        "$or": [
            {"title": {"$regex": escaped_q, "$options": "i"}},
            {"zettel_id": {"$regex": escaped_q, "$options": "i"}},
        ]
    }

    cursor = db.memos.find(
        query,
        {"_id": 1, "title": 1, "zettel_id": 1}
    ).limit(limit)

    results = [
        MemoNameSearchResult(
            id=str(doc["_id"]),
            title=doc["title"],
            zettel_id=doc["zettel_id"],
        )
        for doc in cursor
    ]

    return MemoNameSearchResponse(
        results=results,
        total=len(results),
    )


def process_mentions(
    db,
    source_id: ObjectId,
    content: str,
    old_mentions: list[str],
) -> list[str]:
    """
    멘션을 처리하고 자동 연결을 생성/삭제합니다.

    Args:
        db: 데이터베이스
        source_id: 소스 메모 ID
        content: 메모 내용
        old_mentions: 이전 멘션 목록

    Returns:
        새 멘션 목록
    """
    import re

    # 새 멘션 추출
    new_mentions = extract_mentions(content)

    # 변경된 멘션 확인
    old_set = set(old_mentions)
    new_set = set(new_mentions)

    added = new_set - old_set
    removed = old_set - new_set

    # 추가된 멘션에 대해 연결 생성
    for mention in added:
        # 제목으로 메모 찾기
        escaped_mention = re.escape(mention)
        target = db.memos.find_one(
            {
                "$or": [
                    {"title": {"$regex": f"^{escaped_mention}$", "$options": "i"}},
                    {"zettel_id": mention},
                ],
                "_id": {"$ne": source_id},
            },
            {"_id": 1},
        )

        if target:
            target_oid = target["_id"]

            # 이미 연결이 있는지 확인
            existing = db.memos.find_one({
                "_id": source_id,
                "connections.target_id": target_oid,
            })

            if not existing:
                # 양방향 연결 생성
                conn = create_connection_document(
                    target_id=target_oid,
                    connection_type="explicit",
                    strength=1.0,
                    reason=f"@{mention} 멘션",
                )
                db.memos.update_one(
                    {"_id": source_id},
                    {
                        "$push": {"connections": conn},
                        "$inc": {"connection_count": 1},
                    },
                )

                reverse_conn = create_connection_document(
                    target_id=source_id,
                    connection_type="explicit",
                    strength=1.0,
                    reason=f"@{mention} 멘션 (역방향)",
                )
                db.memos.update_one(
                    {"_id": target_oid},
                    {
                        "$push": {"connections": reverse_conn},
                        "$inc": {"connection_count": 1},
                    },
                )

    # 삭제된 멘션에 대해 연결 삭제 (멘션 기반 연결만)
    for mention in removed:
        escaped_mention = re.escape(mention)
        target = db.memos.find_one(
            {
                "$or": [
                    {"title": {"$regex": f"^{escaped_mention}$", "$options": "i"}},
                    {"zettel_id": mention},
                ],
            },
            {"_id": 1},
        )

        if target:
            target_oid = target["_id"]

            # 멘션 기반 연결 삭제
            db.memos.update_one(
                {"_id": source_id},
                {
                    "$pull": {"connections": {"target_id": target_oid, "reason": {"$regex": "멘션"}}},
                    "$inc": {"connection_count": -1},
                },
            )
            db.memos.update_one(
                {"_id": target_oid},
                {
                    "$pull": {"connections": {"target_id": source_id, "reason": {"$regex": "멘션"}}},
                    "$inc": {"connection_count": -1},
                },
            )

    return new_mentions


@router.post("", response_model=MemoResponse, status_code=201)
async def create_memo(
    memo_data: MemoCreate,
    background_tasks: BackgroundTasks,
) -> MemoResponse:
    """
    새 메모를 생성합니다.

    - **title**: 메모 제목 (1~200자, 필수)
    - **content**: 메모 내용 (마크다운 형식)
    - **tags**: 태그 목록

    내용에 @멘션이 있으면 자동으로 해당 메모와 연결됩니다.
    임베딩은 백그라운드에서 생성됩니다.
    """
    db = get_database()

    # Zettel ID 자동 생성
    zettel_id = generate_zettel_id(db)

    # 멘션 추출
    mentions = extract_mentions(memo_data.content)

    # 메모 문서 생성
    memo_doc = create_memo_document(
        zettel_id=zettel_id,
        title=memo_data.title,
        content=memo_data.content,
        tags=memo_data.tags,
    )
    memo_doc["mentions"] = mentions

    try:
        result = db.memos.insert_one(memo_doc)
        memo_doc["_id"] = result.inserted_id

        # 멘션 기반 연결 생성
        if mentions:
            process_mentions(db, result.inserted_id, memo_data.content, [])

        # 백그라운드에서 임베딩 생성 및 저장
        background_tasks.add_task(
            save_embedding_background,
            str(result.inserted_id),
            memo_data.title,
            memo_data.content,
            zettel_id,
        )

    except DuplicateKeyError:
        raise DuplicateZettelIdException(zettel_id)
    except Exception as e:
        raise DatabaseException(f"메모 생성 실패: {str(e)}")

    # 최신 문서 다시 조회 (연결 정보 포함)
    updated_doc = db.memos.find_one({"_id": result.inserted_id})
    return MemoResponse(**memo_document_to_response(updated_doc))


@router.get("", response_model=MemoListResponse)
async def list_memos(
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(20, ge=1, le=100, description="페이지당 개수"),
    sort: Literal["created_at", "updated_at", "connection_count", "title"] = Query(
        "created_at", description="정렬 기준"
    ),
    order: Literal["asc", "desc"] = Query("desc", description="정렬 방향"),
    tag: Optional[str] = Query(None, description="태그 필터"),
    search: Optional[str] = Query(None, description="검색어 (제목, 내용)"),
) -> MemoListResponse:
    """
    메모 목록을 조회합니다.

    - **page**: 페이지 번호 (기본값: 1)
    - **limit**: 페이지당 개수 (기본값: 20, 최대: 100)
    - **sort**: 정렬 기준 (created_at, updated_at, connection_count, title)
    - **order**: 정렬 방향 (asc, desc)
    - **tag**: 특정 태그가 포함된 메모만 필터링
    - **search**: 제목 또는 내용에서 검색
    """
    db = get_database()

    # 쿼리 조건 구성
    query: dict = {}

    # 태그 필터
    if tag:
        query["tags"] = tag.strip().lower()

    # 텍스트 검색
    if search:
        query["$text"] = {"$search": search}

    # 정렬 설정
    sort_direction = DESCENDING if order == "desc" else ASCENDING
    sort_field = sort

    # 전체 개수 조회
    total = db.memos.count_documents(query)

    # 페이지네이션 계산
    skip = (page - 1) * limit
    total_pages = math.ceil(total / limit) if total > 0 else 1

    # 메모 조회
    cursor = db.memos.find(query).sort(sort_field, sort_direction).skip(skip).limit(limit)

    items = [MemoResponse(**memo_document_to_response(doc)) for doc in cursor]

    return MemoListResponse(
        items=items,
        total=total,
        page=page,
        page_size=limit,
        total_pages=total_pages,
    )


@router.get("/{memo_id}", response_model=MemoResponse)
async def get_memo(memo_id: str) -> MemoResponse:
    """
    특정 메모를 조회합니다.

    - **memo_id**: 메모 ID (ObjectId 문자열)
    """
    db = get_database()
    oid = validate_object_id(memo_id)

    memo = db.memos.find_one({"_id": oid})
    if not memo:
        raise MemoNotFoundException(memo_id)

    response = memo_document_to_response(memo)

    # 연결된 메모의 기본 정보 추가 (제목, Zettel ID)
    if memo.get("connections"):
        connected_ids = [conn["target_id"] for conn in memo["connections"]]
        connected_memos = list(
            db.memos.find(
                {"_id": {"$in": connected_ids}},
                {"_id": 1, "zettel_id": 1, "title": 1},
            )
        )

        # 연결 정보에 메모 제목 추가
        connected_map = {str(m["_id"]): m for m in connected_memos}
        for conn in response["connections"]:
            if conn["target_id"] in connected_map:
                connected = connected_map[conn["target_id"]]
                conn["target_title"] = connected.get("title", "")
                conn["target_zettel_id"] = connected.get("zettel_id", "")

    return MemoResponse(**response)


@router.put("/{memo_id}", response_model=MemoResponse)
async def update_memo(
    memo_id: str,
    memo_data: MemoUpdate,
    background_tasks: BackgroundTasks,
) -> MemoResponse:
    """
    메모를 수정합니다.

    - **memo_id**: 메모 ID (ObjectId 문자열)
    - **title**: 새 제목 (선택적)
    - **content**: 새 내용 (선택적)
    - **tags**: 새 태그 목록 (선택적)

    내용이 변경되면 멘션이 자동으로 처리되고 연결이 업데이트됩니다.
    제목/내용이 변경되면 임베딩이 백그라운드에서 재생성됩니다.
    """
    db = get_database()
    oid = validate_object_id(memo_id)

    # 기존 메모 확인
    existing = db.memos.find_one({"_id": oid})
    if not existing:
        raise MemoNotFoundException(memo_id)

    # 업데이트할 필드만 추출
    update_data = memo_data.model_dump(exclude_unset=True)
    if not update_data:
        # 변경 사항 없으면 기존 메모 반환
        return MemoResponse(**memo_document_to_response(existing))

    # content가 변경되면 멘션 처리
    old_mentions = existing.get("mentions", [])
    if "content" in update_data:
        new_mentions = process_mentions(
            db, oid, update_data["content"], old_mentions
        )
        update_data["mentions"] = new_mentions

    # updated_at 자동 업데이트
    update_data["updated_at"] = datetime.utcnow()

    try:
        result = db.memos.update_one({"_id": oid}, {"$set": update_data})
        if result.modified_count == 0 and not update_data:
            raise DatabaseException("메모 수정 실패")

        # 제목 또는 내용이 변경되면 임베딩 재생성
        if "title" in update_data or "content" in update_data:
            new_title = update_data.get("title", existing["title"])
            new_content = update_data.get("content", existing["content"])
            background_tasks.add_task(
                save_embedding_background,
                memo_id,
                new_title,
                new_content,
                existing["zettel_id"],
            )

    except Exception as e:
        raise DatabaseException(f"메모 수정 실패: {str(e)}")

    # 수정된 메모 조회
    updated_memo = db.memos.find_one({"_id": oid})
    return MemoResponse(**memo_document_to_response(updated_memo))


@router.delete("/{memo_id}")
async def delete_memo(
    memo_id: str,
    background_tasks: BackgroundTasks,
) -> dict:
    """
    메모를 삭제합니다.

    - **memo_id**: 메모 ID (ObjectId 문자열)

    연결된 다른 메모의 connections 배열에서도 해당 연결이 제거됩니다.
    ChromaDB에서도 임베딩이 삭제됩니다.
    """
    db = get_database()
    oid = validate_object_id(memo_id)

    # 기존 메모 확인
    existing = db.memos.find_one({"_id": oid})
    if not existing:
        raise MemoNotFoundException(memo_id)

    zettel_id = existing.get("zettel_id", "")

    try:
        # 1. 다른 메모에서 이 메모를 참조하는 연결 제거
        db.memos.update_many(
            {"connections.target_id": oid},
            {
                "$pull": {"connections": {"target_id": oid}},
                "$inc": {"connection_count": -1},
            },
        )

        # 2. 메모 삭제
        result = db.memos.delete_one({"_id": oid})
        if result.deleted_count == 0:
            raise DatabaseException("메모 삭제 실패")

        # 3. ChromaDB에서 임베딩 삭제 (백그라운드)
        background_tasks.add_task(delete_embedding, memo_id)

    except Exception as e:
        raise DatabaseException(f"메모 삭제 실패: {str(e)}")

    return {
        "message": "메모가 삭제되었습니다.",
        "deleted_id": memo_id,
        "deleted_zettel_id": zettel_id,
    }


@router.get("/{memo_id}/suggestions", response_model=SuggestionListResponse)
async def get_memo_suggestions(
    memo_id: str,
    limit: int = Query(10, ge=1, le=20, description="제안 개수"),
    threshold: float = Query(0.5, ge=0.0, le=1.0, description="유사도 임계값"),
) -> SuggestionListResponse:
    """
    특정 메모에 대한 연결 제안을 가져옵니다.

    벡터 유사도 기반으로 연결할 만한 메모를 추천합니다.

    - **memo_id**: 제안을 받을 메모 ID
    - **limit**: 제안 개수 (기본값: 10, 최대: 20)
    - **threshold**: 유사도 임계값 (기본값: 0.5)
    """
    # 순환 import 방지를 위해 내부에서 import
    from app.api.suggestions import get_memo_suggestions as _get_memo_suggestions
    return await _get_memo_suggestions(memo_id, limit, threshold)
