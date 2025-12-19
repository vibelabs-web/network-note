"""
Memo API Routes.
메모 CRUD API 엔드포인트 정의.
"""

import math
from datetime import datetime
from typing import Literal, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Query
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
from app.services.mongo_service import get_database
from app.utils.zettel_id import generate_zettel_id

router = APIRouter(prefix="/api/memos", tags=["memos"])


def validate_object_id(memo_id: str) -> ObjectId:
    """ObjectId 유효성 검증."""
    try:
        return ObjectId(memo_id)
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail=f"잘못된 메모 ID 형식입니다: {memo_id}",
        )


@router.post("", response_model=MemoResponse, status_code=201)
async def create_memo(memo_data: MemoCreate) -> MemoResponse:
    """
    새 메모를 생성합니다.

    - **title**: 메모 제목 (1~200자, 필수)
    - **content**: 메모 내용 (마크다운 형식)
    - **tags**: 태그 목록
    """
    db = get_database()

    # Zettel ID 자동 생성
    zettel_id = generate_zettel_id(db)

    # 메모 문서 생성
    memo_doc = create_memo_document(
        zettel_id=zettel_id,
        title=memo_data.title,
        content=memo_data.content,
        tags=memo_data.tags,
    )

    try:
        result = db.memos.insert_one(memo_doc)
        memo_doc["_id"] = result.inserted_id
    except DuplicateKeyError:
        raise DuplicateZettelIdException(zettel_id)
    except Exception as e:
        raise DatabaseException(f"메모 생성 실패: {str(e)}")

    return MemoResponse(**memo_document_to_response(memo_doc))


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
async def update_memo(memo_id: str, memo_data: MemoUpdate) -> MemoResponse:
    """
    메모를 수정합니다.

    - **memo_id**: 메모 ID (ObjectId 문자열)
    - **title**: 새 제목 (선택적)
    - **content**: 새 내용 (선택적)
    - **tags**: 새 태그 목록 (선택적)
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

    # updated_at 자동 업데이트
    update_data["updated_at"] = datetime.utcnow()

    try:
        result = db.memos.update_one({"_id": oid}, {"$set": update_data})
        if result.modified_count == 0 and not update_data:
            raise DatabaseException("메모 수정 실패")
    except Exception as e:
        raise DatabaseException(f"메모 수정 실패: {str(e)}")

    # 수정된 메모 조회
    updated_memo = db.memos.find_one({"_id": oid})
    return MemoResponse(**memo_document_to_response(updated_memo))


@router.delete("/{memo_id}")
async def delete_memo(memo_id: str) -> dict:
    """
    메모를 삭제합니다.

    - **memo_id**: 메모 ID (ObjectId 문자열)

    연결된 다른 메모의 connections 배열에서도 해당 연결이 제거됩니다.
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
    except Exception as e:
        raise DatabaseException(f"메모 삭제 실패: {str(e)}")

    return {
        "message": "메모가 삭제되었습니다.",
        "deleted_id": memo_id,
        "deleted_zettel_id": zettel_id,
    }
