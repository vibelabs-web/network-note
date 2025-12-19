"""
Memo MongoDB Model.
MongoDB 문서 구조 정의 및 관련 유틸리티 함수.
"""

from datetime import datetime
from typing import Any, Literal, Optional, TypedDict

from bson import ObjectId


class ConnectionDict(TypedDict, total=False):
    """연결 문서 타입 정의."""

    target_id: ObjectId
    type: Literal["explicit", "suggested"]
    strength: float
    reason: Optional[str]
    created_at: datetime
    approved_at: Optional[datetime]


class MemoDocument(TypedDict, total=False):
    """메모 MongoDB 문서 타입 정의."""

    _id: ObjectId
    zettel_id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    connections: list[ConnectionDict]
    mentions: list[str]
    tags: list[str]
    connection_count: int
    is_favorite: bool
    is_archived: bool


def create_memo_document(
    zettel_id: str,
    title: str,
    content: str,
    tags: Optional[list[str]] = None,
) -> dict[str, Any]:
    """
    새 메모 문서를 생성합니다.

    Args:
        zettel_id: 제텔카스텐 ID
        title: 메모 제목
        content: 메모 내용
        tags: 태그 목록

    Returns:
        MongoDB에 저장할 메모 문서
    """
    now = datetime.utcnow()
    return {
        "zettel_id": zettel_id,
        "title": title,
        "content": content,
        "created_at": now,
        "updated_at": now,
        "connections": [],
        "mentions": [],
        "tags": tags or [],
        "connection_count": 0,
        "is_favorite": False,
        "is_archived": False,
    }


def create_connection_document(
    target_id: ObjectId,
    connection_type: Literal["explicit", "suggested"],
    strength: float = 1.0,
    reason: Optional[str] = None,
) -> ConnectionDict:
    """
    새 연결 문서를 생성합니다.

    Args:
        target_id: 연결 대상 메모 ObjectId
        connection_type: 연결 타입 (explicit/suggested)
        strength: 연결 강도 (0.0~1.0)
        reason: 연결 이유

    Returns:
        연결 서브문서
    """
    return {
        "target_id": target_id,
        "type": connection_type,
        "strength": strength,
        "reason": reason,
        "created_at": datetime.utcnow(),
        "approved_at": None,
    }


def memo_document_to_response(doc: dict[str, Any]) -> dict[str, Any]:
    """
    MongoDB 문서를 API 응답 형식으로 변환합니다.

    Args:
        doc: MongoDB 문서

    Returns:
        API 응답 형식의 딕셔너리
    """
    connections = []
    for conn in doc.get("connections", []):
        connections.append({
            "target_id": str(conn["target_id"]),
            "type": conn["type"],
            "strength": conn["strength"],
            "reason": conn.get("reason"),
            "created_at": conn["created_at"],
            "approved_at": conn.get("approved_at"),
        })

    return {
        "id": str(doc["_id"]),
        "zettel_id": doc["zettel_id"],
        "title": doc["title"],
        "content": doc["content"],
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
        "connections": connections,
        "mentions": doc.get("mentions", []),
        "tags": doc.get("tags", []),
        "connection_count": doc.get("connection_count", 0),
        "is_favorite": doc.get("is_favorite", False),
        "is_archived": doc.get("is_archived", False),
    }
