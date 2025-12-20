"""
Job Service - 비동기 작업 상태 관리 및 LLM 평가 캐싱.
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Optional

from app.services.mongo_service import get_database

# 인메모리 작업 상태 저장소 (TTL: 1시간)
_job_store: dict[str, dict] = {}

# LLM 평가 캐시 TTL (24시간)
CACHE_TTL_HOURS = 24


def generate_job_id() -> str:
    """고유한 작업 ID 생성."""
    return f"job_{uuid.uuid4().hex[:12]}"


def create_job(
    memo_id: str,
    candidate_count: int,
    job_type: str = "refine",
) -> dict:
    """
    새 작업을 생성합니다.

    Args:
        memo_id: 대상 메모 ID
        candidate_count: 평가할 후보 수
        job_type: 작업 유형

    Returns:
        작업 정보 딕셔너리
    """
    job_id = generate_job_id()
    now = datetime.utcnow()

    job = {
        "job_id": job_id,
        "memo_id": memo_id,
        "job_type": job_type,
        "status": "pending",  # pending, processing, completed, failed
        "progress": 0,
        "candidate_count": candidate_count,
        "result": None,
        "error": None,
        "created_at": now.isoformat(),
        "completed_at": None,
        "expires_at": (now + timedelta(hours=1)).isoformat(),
    }

    _job_store[job_id] = job
    return job


def get_job(job_id: str) -> Optional[dict]:
    """작업 정보를 조회합니다."""
    job = _job_store.get(job_id)

    if job:
        # 만료 체크
        expires_at = datetime.fromisoformat(job["expires_at"])
        if datetime.utcnow() > expires_at:
            del _job_store[job_id]
            return None

    return job


def update_job(
    job_id: str,
    status: Optional[str] = None,
    progress: Optional[int] = None,
    result: Optional[dict] = None,
    error: Optional[str] = None,
) -> Optional[dict]:
    """작업 상태를 업데이트합니다."""
    job = _job_store.get(job_id)
    if not job:
        return None

    if status:
        job["status"] = status
    if progress is not None:
        job["progress"] = progress
    if result is not None:
        job["result"] = result
    if error is not None:
        job["error"] = error

    if status in ("completed", "failed"):
        job["completed_at"] = datetime.utcnow().isoformat()

    return job


def cleanup_expired_jobs() -> int:
    """만료된 작업을 정리합니다."""
    now = datetime.utcnow()
    expired_ids = []

    for job_id, job in _job_store.items():
        expires_at = datetime.fromisoformat(job["expires_at"])
        if now > expires_at:
            expired_ids.append(job_id)

    for job_id in expired_ids:
        del _job_store[job_id]

    return len(expired_ids)


# ============================================
# LLM 평가 결과 캐시 (MongoDB)
# ============================================

def get_cached_evaluation(source_id: str, target_id: str) -> Optional[dict]:
    """
    캐시된 LLM 평가 결과를 조회합니다.

    Args:
        source_id: 소스 메모 ID
        target_id: 타겟 메모 ID

    Returns:
        캐시된 평가 결과 또는 None
    """
    db = get_database()

    # 캐시 키는 양방향으로 정렬하여 동일하게 만듦
    cache_key = "_".join(sorted([source_id, target_id]))

    cache_entry = db.llm_evaluation_cache.find_one({"cache_key": cache_key})

    if cache_entry:
        # TTL 체크
        evaluated_at = cache_entry.get("evaluated_at")
        if evaluated_at:
            expires_at = evaluated_at + timedelta(hours=CACHE_TTL_HOURS)
            if datetime.utcnow() > expires_at:
                # 만료됨 - 삭제하고 None 반환
                db.llm_evaluation_cache.delete_one({"cache_key": cache_key})
                return None

        return {
            "score": cache_entry.get("score", 0.0),
            "reason": cache_entry.get("reason", ""),
            "connected": cache_entry.get("connected", False),
            "cached": True,
        }

    return None


def save_evaluation_cache(
    source_id: str,
    target_id: str,
    score: float,
    reason: str,
    connected: bool,
) -> bool:
    """
    LLM 평가 결과를 캐시에 저장합니다.

    Args:
        source_id: 소스 메모 ID
        target_id: 타겟 메모 ID
        score: LLM 평가 점수
        reason: 연결 이유
        connected: 연결 추천 여부

    Returns:
        저장 성공 여부
    """
    db = get_database()

    # 캐시 키는 양방향으로 정렬
    cache_key = "_".join(sorted([source_id, target_id]))

    cache_entry = {
        "cache_key": cache_key,
        "source_id": source_id,
        "target_id": target_id,
        "score": score,
        "reason": reason,
        "connected": connected,
        "evaluated_at": datetime.utcnow(),
    }

    try:
        db.llm_evaluation_cache.update_one(
            {"cache_key": cache_key},
            {"$set": cache_entry},
            upsert=True,
        )
        return True
    except Exception:
        return False


def clear_evaluation_cache(memo_id: Optional[str] = None) -> int:
    """
    LLM 평가 캐시를 삭제합니다.

    Args:
        memo_id: 특정 메모의 캐시만 삭제 (None이면 전체 삭제)

    Returns:
        삭제된 캐시 수
    """
    db = get_database()

    if memo_id:
        result = db.llm_evaluation_cache.delete_many({
            "$or": [
                {"source_id": memo_id},
                {"target_id": memo_id},
            ]
        })
    else:
        result = db.llm_evaluation_cache.delete_many({})

    return result.deleted_count


def get_cache_stats() -> dict:
    """캐시 통계를 조회합니다."""
    db = get_database()

    total_count = db.llm_evaluation_cache.count_documents({})

    # 만료되지 않은 캐시 수
    cutoff = datetime.utcnow() - timedelta(hours=CACHE_TTL_HOURS)
    valid_count = db.llm_evaluation_cache.count_documents({
        "evaluated_at": {"$gte": cutoff}
    })

    return {
        "total_entries": total_count,
        "valid_entries": valid_count,
        "expired_entries": total_count - valid_count,
        "ttl_hours": CACHE_TTL_HOURS,
    }


def ensure_cache_indexes() -> dict:
    """캐시 컬렉션 인덱스를 생성합니다."""
    db = get_database()

    indexes = []

    # 캐시 키 유니크 인덱스
    indexes.append(db.llm_evaluation_cache.create_index(
        "cache_key",
        unique=True,
        name="idx_cache_key",
    ))

    # 소스/타겟 ID 인덱스
    indexes.append(db.llm_evaluation_cache.create_index(
        "source_id",
        name="idx_source_id",
    ))
    indexes.append(db.llm_evaluation_cache.create_index(
        "target_id",
        name="idx_target_id",
    ))

    # TTL 인덱스 (자동 만료)
    indexes.append(db.llm_evaluation_cache.create_index(
        "evaluated_at",
        expireAfterSeconds=CACHE_TTL_HOURS * 3600,
        name="idx_ttl",
    ))

    return {"indexes_created": len(indexes)}
