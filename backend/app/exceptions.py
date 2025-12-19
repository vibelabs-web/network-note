"""
Custom Exception Classes.
API 에러 처리를 위한 커스텀 예외 클래스 정의.
"""

from typing import Any, Optional


class StarNoteException(Exception):
    """Star Note 기본 예외 클래스."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        detail: Optional[Any] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)


class MemoNotFoundException(StarNoteException):
    """메모를 찾을 수 없을 때 발생하는 예외."""

    def __init__(self, memo_id: str):
        super().__init__(
            message=f"메모를 찾을 수 없습니다: {memo_id}",
            status_code=404,
            detail={"memo_id": memo_id},
        )


class DuplicateZettelIdException(StarNoteException):
    """중복된 Zettel ID가 존재할 때 발생하는 예외."""

    def __init__(self, zettel_id: str):
        super().__init__(
            message=f"이미 존재하는 Zettel ID입니다: {zettel_id}",
            status_code=409,
            detail={"zettel_id": zettel_id},
        )


class ValidationException(StarNoteException):
    """유효성 검증 실패 시 발생하는 예외."""

    def __init__(self, message: str, detail: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=400,
            detail=detail,
        )


class DatabaseException(StarNoteException):
    """데이터베이스 작업 실패 시 발생하는 예외."""

    def __init__(self, message: str = "데이터베이스 오류가 발생했습니다."):
        super().__init__(
            message=message,
            status_code=500,
        )
