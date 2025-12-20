"""
Connection Pydantic Schemas.
연결 생성/삭제 및 응답을 위한 스키마 정의.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ConnectionCreateRequest(BaseModel):
    """연결 생성 요청 스키마."""

    source_id: str = Field(..., description="연결 출발 메모 ID")
    target_id: str = Field(..., description="연결 도착 메모 ID")
    type: Literal["explicit", "suggested"] = Field(
        "explicit", description="연결 타입"
    )
    strength: float = Field(
        1.0, ge=0.0, le=1.0, description="연결 강도 (0.0 ~ 1.0)"
    )
    reason: Optional[str] = Field(None, description="연결 이유")


class ConnectionDeleteRequest(BaseModel):
    """연결 삭제 요청 스키마."""

    source_id: str = Field(..., description="연결 출발 메모 ID")
    target_id: str = Field(..., description="연결 도착 메모 ID")


class ConnectionInfo(BaseModel):
    """연결 정보 스키마 (연결된 메모 정보 포함)."""

    target_id: str = Field(..., description="연결 대상 메모 ID")
    target_title: Optional[str] = Field(None, description="연결 대상 메모 제목")
    target_zettel_id: Optional[str] = Field(None, description="연결 대상 Zettel ID")
    type: Literal["explicit", "suggested"] = Field(..., description="연결 타입")
    strength: float = Field(..., description="연결 강도")
    reason: Optional[str] = Field(None, description="연결 이유")
    created_at: datetime = Field(..., description="연결 생성 시간")


class ConnectionListResponse(BaseModel):
    """연결 목록 응답 스키마."""

    memo_id: str = Field(..., description="메모 ID")
    connections: list[ConnectionInfo] = Field(..., description="연결 목록")
    total: int = Field(..., description="전체 연결 수")


class MemoNameSearchResult(BaseModel):
    """메모명 검색 결과 스키마."""

    id: str = Field(..., description="메모 ID")
    title: str = Field(..., description="메모 제목")
    zettel_id: str = Field(..., description="Zettel ID")


class MemoNameSearchResponse(BaseModel):
    """메모명 검색 응답 스키마."""

    results: list[MemoNameSearchResult] = Field(..., description="검색 결과")
    total: int = Field(..., description="검색 결과 수")
