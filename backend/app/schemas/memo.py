"""
Memo Pydantic Schemas.
메모 데이터 검증 및 직렬화를 위한 스키마 정의.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class ConnectionBase(BaseModel):
    """연결 기본 스키마."""

    target_id: str = Field(..., description="연결 대상 메모 ID (ObjectId 문자열)")
    type: Literal["explicit", "suggested"] = Field(
        ..., description="연결 타입: explicit(명시적) 또는 suggested(AI 제안)"
    )
    strength: float = Field(
        ..., ge=0.0, le=1.0, description="연결 강도 (0.0 ~ 1.0)"
    )
    reason: Optional[str] = Field(None, description="연결 이유 (LLM 생성)")


class ConnectionCreate(ConnectionBase):
    """연결 생성 스키마."""

    pass


class ConnectionResponse(ConnectionBase):
    """연결 응답 스키마."""

    created_at: datetime = Field(..., description="연결 생성 시간")
    approved_at: Optional[datetime] = Field(None, description="제안 승인 시간")

    class Config:
        from_attributes = True


class MemoBase(BaseModel):
    """메모 기본 스키마."""

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="메모 제목 (1~200자)",
    )
    content: str = Field(
        "",
        description="메모 내용 (마크다운 형식)",
    )
    tags: list[str] = Field(
        default_factory=list,
        description="태그 목록",
    )

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v: str) -> str:
        """제목이 공백만으로 이루어지면 안 됨."""
        if not v.strip():
            raise ValueError("제목은 공백만으로 이루어질 수 없습니다.")
        return v.strip()

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        """태그 검증 및 정규화."""
        validated_tags = []
        for tag in v:
            tag = tag.strip().lower()
            if tag and len(tag) <= 50:
                validated_tags.append(tag)
        # 중복 제거
        return list(dict.fromkeys(validated_tags))


class MemoCreate(MemoBase):
    """메모 생성 스키마."""

    pass


class MemoUpdate(BaseModel):
    """메모 수정 스키마 (모든 필드 선택적)."""

    title: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="메모 제목",
    )
    content: Optional[str] = Field(
        None,
        description="메모 내용",
    )
    tags: Optional[list[str]] = Field(
        None,
        description="태그 목록",
    )

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v: Optional[str]) -> Optional[str]:
        """제목이 주어지면 공백만으로 이루어지면 안 됨."""
        if v is not None and not v.strip():
            raise ValueError("제목은 공백만으로 이루어질 수 없습니다.")
        return v.strip() if v else v

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        """태그 검증 및 정규화."""
        if v is None:
            return v
        validated_tags = []
        for tag in v:
            tag = tag.strip().lower()
            if tag and len(tag) <= 50:
                validated_tags.append(tag)
        return list(dict.fromkeys(validated_tags))


class MemoResponse(BaseModel):
    """메모 응답 스키마."""

    id: str = Field(..., description="MongoDB ObjectId 문자열")
    zettel_id: str = Field(..., description="제텔카스텐 ID (YYYY-MM-DD-XXX)")
    title: str = Field(..., description="메모 제목")
    content: str = Field(..., description="메모 내용")
    created_at: datetime = Field(..., description="생성 시간")
    updated_at: datetime = Field(..., description="수정 시간")
    connections: list[ConnectionResponse] = Field(
        default_factory=list, description="연결 목록"
    )
    mentions: list[str] = Field(default_factory=list, description="멘션된 메모명 목록")
    tags: list[str] = Field(default_factory=list, description="태그 목록")
    connection_count: int = Field(0, description="연결 수")
    is_favorite: bool = Field(False, description="즐겨찾기 여부")
    is_archived: bool = Field(False, description="보관 여부")

    class Config:
        from_attributes = True


class MemoListResponse(BaseModel):
    """메모 목록 응답 스키마."""

    items: list[MemoResponse] = Field(..., description="메모 목록")
    total: int = Field(..., description="전체 메모 수")
    page: int = Field(..., description="현재 페이지")
    page_size: int = Field(..., description="페이지당 개수")
    total_pages: int = Field(..., description="전체 페이지 수")
