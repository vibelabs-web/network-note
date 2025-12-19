"""
MongoDB connection service.
MongoDB 클라이언트 관리 및 데이터베이스 연결을 담당합니다.
"""

from pymongo import ASCENDING, DESCENDING, MongoClient, TEXT
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from app.config import get_settings

# Global client instance
_client: MongoClient | None = None


def get_client() -> MongoClient:
    """
    Get or create MongoDB client instance.
    싱글톤 패턴으로 클라이언트 인스턴스를 관리합니다.
    """
    global _client
    if _client is None:
        settings = get_settings()
        _client = MongoClient(
            settings.mongodb_url,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
    return _client


def get_database() -> Database:
    """
    Get the Star Note database instance.
    """
    settings = get_settings()
    client = get_client()
    return client[settings.mongodb_db_name]


def check_connection() -> dict:
    """
    Check MongoDB connection status.

    Returns:
        dict: Connection status with 'connected' boolean and optional 'error' message.
    """
    try:
        client = get_client()
        # ping 명령으로 연결 상태 확인
        client.admin.command("ping")
        return {"connected": True}
    except ConnectionFailure as e:
        return {"connected": False, "error": f"Connection failed: {str(e)}"}
    except ServerSelectionTimeoutError as e:
        return {"connected": False, "error": f"Server selection timeout: {str(e)}"}
    except Exception as e:
        return {"connected": False, "error": f"Unexpected error: {str(e)}"}


def close_connection() -> None:
    """
    Close MongoDB connection.
    애플리케이션 종료 시 호출됩니다.
    """
    global _client
    if _client is not None:
        _client.close()
        _client = None


def create_indexes() -> dict:
    """
    memos 컬렉션에 필요한 인덱스를 생성합니다.
    애플리케이션 시작 시 호출됩니다.

    Returns:
        dict: 생성된 인덱스 목록
    """
    db = get_database()
    memos = db.memos
    created_indexes = []

    # 1. zettel_id 유니크 인덱스 (중복 방지)
    memos.create_index(
        [("zettel_id", ASCENDING)],
        unique=True,
        name="idx_zettel_id",
    )
    created_indexes.append("idx_zettel_id")

    # 2. 텍스트 인덱스 (전문 검색) - 제목에 가중치
    memos.create_index(
        [("title", TEXT), ("content", TEXT)],
        weights={"title": 10, "content": 1},
        default_language="none",
        name="idx_text_search",
    )
    created_indexes.append("idx_text_search")

    # 3. 태그 다중 키 인덱스 (태그 필터링)
    memos.create_index(
        [("tags", ASCENDING)],
        name="idx_tags",
    )
    created_indexes.append("idx_tags")

    # 4. 생성일 내림차순 인덱스 (최신순 정렬)
    memos.create_index(
        [("created_at", DESCENDING)],
        name="idx_created_at",
    )
    created_indexes.append("idx_created_at")

    # 5. 수정일 내림차순 인덱스 (최근 수정순)
    memos.create_index(
        [("updated_at", DESCENDING)],
        name="idx_updated_at",
    )
    created_indexes.append("idx_updated_at")

    # 6. 연결 수 내림차순 인덱스 (연결순 정렬)
    memos.create_index(
        [("connection_count", DESCENDING)],
        name="idx_connection_count",
    )
    created_indexes.append("idx_connection_count")

    # 7. 복합 인덱스 (태그 + 생성일)
    memos.create_index(
        [("tags", ASCENDING), ("created_at", DESCENDING)],
        name="idx_tags_created_at",
    )
    created_indexes.append("idx_tags_created_at")

    # 8. 연결 대상 ID 인덱스 (양방향 연결 조회)
    memos.create_index(
        [("connections.target_id", ASCENDING)],
        name="idx_connections_target_id",
    )
    created_indexes.append("idx_connections_target_id")

    return {"created_indexes": created_indexes, "count": len(created_indexes)}
