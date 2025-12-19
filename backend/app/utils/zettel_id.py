"""
Zettel ID Generation Utility.
제텔카스텐 ID 생성 및 관리 유틸리티.

형식: YYYY-MM-DD-XXX
예시: 2024-12-25-001, 2024-12-25-002
"""

from datetime import date
from typing import Optional

from pymongo.database import Database


def generate_zettel_id(db: Database, target_date: Optional[date] = None) -> str:
    """
    새로운 Zettel ID를 생성합니다.

    형식: YYYY-MM-DD-XXX
    - YYYY: 4자리 연도
    - MM: 2자리 월 (01-12)
    - DD: 2자리 일 (01-31)
    - XXX: 해당 날짜의 순번 (001부터 시작)

    Args:
        db: MongoDB 데이터베이스 인스턴스
        target_date: 대상 날짜 (기본값: 오늘)

    Returns:
        생성된 Zettel ID (예: "2024-12-25-001")
    """
    if target_date is None:
        target_date = date.today()

    date_prefix = target_date.isoformat()  # YYYY-MM-DD

    # 해당 날짜의 마지막 메모 조회
    last_memo = db.memos.find_one(
        {"zettel_id": {"$regex": f"^{date_prefix}"}},
        sort=[("zettel_id", -1)],
    )

    if last_memo:
        # 마지막 순번 추출 및 증가
        last_seq = int(last_memo["zettel_id"].split("-")[-1])
        new_seq = last_seq + 1
    else:
        # 해당 날짜의 첫 번째 메모
        new_seq = 1

    return f"{date_prefix}-{new_seq:03d}"


def parse_zettel_id(zettel_id: str) -> tuple[date, int]:
    """
    Zettel ID를 파싱하여 날짜와 순번을 반환합니다.

    Args:
        zettel_id: Zettel ID (예: "2024-12-25-001")

    Returns:
        (날짜, 순번) 튜플

    Raises:
        ValueError: 잘못된 형식의 Zettel ID
    """
    try:
        parts = zettel_id.rsplit("-", 1)
        if len(parts) != 2:
            raise ValueError(f"Invalid Zettel ID format: {zettel_id}")

        date_str = parts[0]
        seq = int(parts[1])

        year, month, day = map(int, date_str.split("-"))
        parsed_date = date(year, month, day)

        return parsed_date, seq
    except Exception as e:
        raise ValueError(f"Invalid Zettel ID format: {zettel_id}") from e


def validate_zettel_id(zettel_id: str) -> bool:
    """
    Zettel ID 형식이 유효한지 검증합니다.

    Args:
        zettel_id: 검증할 Zettel ID

    Returns:
        유효하면 True, 아니면 False
    """
    try:
        parse_zettel_id(zettel_id)
        return True
    except ValueError:
        return False


async def is_zettel_id_unique(db: Database, zettel_id: str) -> bool:
    """
    Zettel ID가 데이터베이스에서 고유한지 확인합니다.

    Args:
        db: MongoDB 데이터베이스 인스턴스
        zettel_id: 확인할 Zettel ID

    Returns:
        고유하면 True, 중복이면 False
    """
    existing = db.memos.find_one({"zettel_id": zettel_id})
    return existing is None
