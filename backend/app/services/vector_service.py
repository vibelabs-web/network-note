"""
ChromaDB Vector Service.
벡터 데이터베이스(ChromaDB) 연결 및 관리를 담당합니다.
"""

from typing import Optional

import chromadb
from chromadb.config import Settings

from app.config import get_settings

# Global client instance
_client: Optional[chromadb.HttpClient] = None
_collection: Optional[chromadb.Collection] = None

# Collection name
COLLECTION_NAME = "memos"


def get_chroma_client() -> chromadb.HttpClient:
    """
    Get or create ChromaDB client instance.
    싱글톤 패턴으로 클라이언트 인스턴스를 관리합니다.
    """
    global _client
    if _client is None:
        settings = get_settings()
        _client = chromadb.HttpClient(
            host=settings.chroma_db_host,
            port=settings.chroma_db_port,
            settings=Settings(
                anonymized_telemetry=False,
            ),
        )
    return _client


def get_collection() -> chromadb.Collection:
    """
    Get or create the memos collection.
    컬렉션이 없으면 생성하고, 있으면 가져옵니다.
    """
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={
                "description": "Star Note 메모 임베딩 컬렉션",
                "hnsw:space": "cosine",  # 코사인 유사도 사용
            },
        )
    return _collection


def check_connection() -> dict:
    """
    Check ChromaDB connection status.

    Returns:
        dict: Connection status with 'connected' boolean and optional 'error' message.
    """
    try:
        client = get_chroma_client()
        # heartbeat로 연결 상태 확인
        heartbeat = client.heartbeat()
        return {
            "connected": True,
            "heartbeat": heartbeat,
        }
    except Exception as e:
        return {
            "connected": False,
            "error": f"ChromaDB connection failed: {str(e)}",
        }


def close_connection() -> None:
    """
    Close ChromaDB connection.
    애플리케이션 종료 시 호출됩니다.
    """
    global _client, _collection
    _client = None
    _collection = None


def add_embedding(
    doc_id: str,
    embedding: list[float],
    metadata: dict,
) -> None:
    """
    임베딩을 ChromaDB에 저장합니다.

    Args:
        doc_id: 문서 ID (MongoDB ObjectId 문자열)
        embedding: 임베딩 벡터 (384차원)
        metadata: 메타데이터 (title, zettel_id, content 등)
    """
    collection = get_collection()

    # 기존에 있으면 업데이트, 없으면 추가
    collection.upsert(
        ids=[doc_id],
        embeddings=[embedding],
        metadatas=[metadata],
    )


def delete_embedding(doc_id: str) -> None:
    """
    ChromaDB에서 임베딩을 삭제합니다.

    Args:
        doc_id: 문서 ID (MongoDB ObjectId 문자열)
    """
    collection = get_collection()

    try:
        collection.delete(ids=[doc_id])
    except Exception:
        # 존재하지 않는 ID 삭제 시 에러 무시
        pass


def search_similar(
    query_embedding: list[float],
    n_results: int = 10,
    exclude_ids: Optional[list[str]] = None,
) -> list[dict]:
    """
    유사한 메모를 검색합니다.

    Args:
        query_embedding: 쿼리 임베딩 벡터
        n_results: 반환할 결과 수
        exclude_ids: 제외할 문서 ID 목록

    Returns:
        유사한 문서 목록 (id, distance, metadata 포함)
    """
    collection = get_collection()

    # ChromaDB는 where_document로 ID 필터링이 안 되므로
    # 더 많은 결과를 가져온 후 필터링
    fetch_n = n_results + len(exclude_ids) if exclude_ids else n_results

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(fetch_n, 100),  # 최대 100개
        include=["distances", "metadatas"],
    )

    # 결과 변환
    similar_docs = []

    if results["ids"] and results["ids"][0]:
        for i, doc_id in enumerate(results["ids"][0]):
            # 제외할 ID 스킵
            if exclude_ids and doc_id in exclude_ids:
                continue

            # 코사인 거리를 유사도로 변환 (1 - distance)
            distance = results["distances"][0][i] if results["distances"] else 0
            similarity = 1 - distance

            similar_docs.append({
                "id": doc_id,
                "similarity": similarity,
                "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
            })

            # 원하는 결과 수에 도달하면 중단
            if len(similar_docs) >= n_results:
                break

    return similar_docs


def get_collection_count() -> int:
    """
    컬렉션의 문서 수를 반환합니다.
    """
    try:
        collection = get_collection()
        return collection.count()
    except Exception:
        return 0
