"""
MongoDB connection service.
MongoDB 클라이언트 관리 및 데이터베이스 연결을 담당합니다.
"""

from pymongo import MongoClient
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
