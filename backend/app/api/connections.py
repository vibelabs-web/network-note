"""
Connection API Routes.
메모 연결 생성/삭제 API 엔드포인트 정의.
"""

from datetime import datetime

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException

from app.exceptions import DatabaseException, MemoNotFoundException
from app.models.memo import create_connection_document
from app.schemas.connection import (
    ConnectionCreateRequest,
    ConnectionDeleteRequest,
    ConnectionInfo,
    ConnectionListResponse,
)
from app.services.mongo_service import get_database

router = APIRouter(prefix="/api/connections", tags=["connections"])


def validate_object_id(id_str: str, field_name: str = "ID") -> ObjectId:
    """ObjectId 유효성 검증."""
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(
            status_code=400,
            detail=f"잘못된 {field_name} 형식입니다: {id_str}",
        )


@router.post("", status_code=201)
async def create_connection(data: ConnectionCreateRequest) -> dict:
    """
    두 메모 간의 연결을 생성합니다.

    양방향 연결이 자동으로 생성됩니다:
    - source → target
    - target → source

    중복 연결은 무시됩니다.

    - **source_id**: 연결 출발 메모 ID
    - **target_id**: 연결 도착 메모 ID
    - **type**: 연결 타입 (explicit/suggested)
    - **strength**: 연결 강도 (0.0~1.0)
    - **reason**: 연결 이유 (선택)
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
        return {
            "message": "이미 연결이 존재합니다.",
            "source_id": data.source_id,
            "target_id": data.target_id,
            "created": False,
        }

    # 연결 문서 생성
    forward_conn = create_connection_document(
        target_id=target_oid,
        connection_type=data.type,
        strength=data.strength,
        reason=data.reason,
    )

    backward_conn = create_connection_document(
        target_id=source_oid,
        connection_type=data.type,
        strength=data.strength,
        reason=data.reason,
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

    return {
        "message": "연결이 생성되었습니다.",
        "source_id": data.source_id,
        "target_id": data.target_id,
        "type": data.type,
        "created": True,
    }


@router.delete("")
async def delete_connection(data: ConnectionDeleteRequest) -> dict:
    """
    두 메모 간의 연결을 삭제합니다.

    양방향 연결이 모두 삭제됩니다:
    - source → target
    - target → source

    - **source_id**: 연결 출발 메모 ID
    - **target_id**: 연결 도착 메모 ID
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

    # 연결 존재 확인
    existing = db.memos.find_one({
        "_id": source_oid,
        "connections.target_id": target_oid,
    })

    if not existing:
        return {
            "message": "연결이 존재하지 않습니다.",
            "source_id": data.source_id,
            "target_id": data.target_id,
            "deleted": False,
        }

    try:
        # 소스 → 타겟 연결 삭제
        db.memos.update_one(
            {"_id": source_oid},
            {
                "$pull": {"connections": {"target_id": target_oid}},
                "$inc": {"connection_count": -1},
                "$set": {"updated_at": datetime.utcnow()},
            },
        )

        # 타겟 → 소스 연결 삭제 (양방향)
        db.memos.update_one(
            {"_id": target_oid},
            {
                "$pull": {"connections": {"target_id": source_oid}},
                "$inc": {"connection_count": -1},
                "$set": {"updated_at": datetime.utcnow()},
            },
        )
    except Exception as e:
        raise DatabaseException(f"연결 삭제 실패: {str(e)}")

    return {
        "message": "연결이 삭제되었습니다.",
        "source_id": data.source_id,
        "target_id": data.target_id,
        "deleted": True,
    }


@router.get("/{memo_id}", response_model=ConnectionListResponse)
async def get_memo_connections(memo_id: str) -> ConnectionListResponse:
    """
    특정 메모의 모든 연결을 조회합니다.

    - **memo_id**: 메모 ID (ObjectId 문자열)

    연결된 메모의 제목과 Zettel ID가 포함됩니다.
    """
    db = get_database()
    oid = validate_object_id(memo_id, "memo_id")

    # 메모 조회
    memo = db.memos.find_one({"_id": oid})
    if not memo:
        raise MemoNotFoundException(memo_id)

    connections = memo.get("connections", [])

    if not connections:
        return ConnectionListResponse(
            memo_id=memo_id,
            connections=[],
            total=0,
        )

    # 연결된 메모 정보 조회
    target_ids = [conn["target_id"] for conn in connections]
    target_memos = list(db.memos.find(
        {"_id": {"$in": target_ids}},
        {"_id": 1, "title": 1, "zettel_id": 1},
    ))
    target_map = {str(m["_id"]): m for m in target_memos}

    # 연결 정보 구성
    connection_infos = []
    for conn in connections:
        target_id_str = str(conn["target_id"])
        target_memo = target_map.get(target_id_str, {})

        connection_infos.append(ConnectionInfo(
            target_id=target_id_str,
            target_title=target_memo.get("title"),
            target_zettel_id=target_memo.get("zettel_id"),
            type=conn["type"],
            strength=conn["strength"],
            reason=conn.get("reason"),
            created_at=conn["created_at"],
        ))

    return ConnectionListResponse(
        memo_id=memo_id,
        connections=connection_infos,
        total=len(connection_infos),
    )
