"""
Suggestion Pydantic Schemas.
연결 제안 요청/응답을 위한 스키마 정의.
"""

from typing import Optional

from pydantic import BaseModel, Field


class SuggestionItem(BaseModel):
    """개별 연결 제안 항목."""

    memo_id: str = Field(..., alias="memoId", description="제안된 메모 ID")
    title: str = Field(..., description="제안된 메모 제목")
    zettel_id: str = Field(..., alias="zettelId", description="제안된 메모 Zettel ID")
    similarity: float = Field(..., ge=0.0, le=1.0, description="하이브리드 점수 (0.0 ~ 1.0)")
    reason: str = Field("벡터 유사도 기반 제안", description="제안 이유 (LLM 생성)")
    content_preview: Optional[str] = Field(None, alias="contentPreview", description="내용 미리보기")
    llm_score: Optional[float] = Field(None, alias="llmScore", ge=0.0, le=1.0, description="LLM 평가 점수")
    vector_similarity: Optional[float] = Field(None, alias="vectorSimilarity", ge=0.0, le=1.0, description="벡터 유사도")

    class Config:
        populate_by_name = True


class SuggestionListResponse(BaseModel):
    """연결 제안 목록 응답."""

    suggestions: list[SuggestionItem] = Field(..., description="제안 목록")
    source_memo_id: str = Field(..., alias="sourceMemoId", description="제안을 요청한 메모 ID")
    threshold: float = Field(..., description="적용된 유사도 임계값")
    total: int = Field(..., description="제안 수")

    class Config:
        populate_by_name = True


class SuggestionApproveRequest(BaseModel):
    """제안 승인 요청 스키마."""

    source_id: str = Field(..., alias="sourceId", description="제안을 받은 메모 ID")
    target_id: str = Field(..., alias="targetId", description="제안된 메모 ID")

    class Config:
        populate_by_name = True


class SuggestionRejectRequest(BaseModel):
    """제안 거부 요청 스키마."""

    source_id: str = Field(..., alias="sourceId", description="제안을 받은 메모 ID")
    target_id: str = Field(..., alias="targetId", description="거부할 메모 ID")
    reason: Optional[str] = Field(None, description="거부 이유 (선택)")

    class Config:
        populate_by_name = True


class SuggestionActionResponse(BaseModel):
    """제안 승인/거부 응답 스키마."""

    message: str = Field(..., description="결과 메시지")
    source_id: str = Field(..., alias="sourceId", description="제안을 받은 메모 ID")
    target_id: str = Field(..., alias="targetId", description="제안된 메모 ID")
    action: str = Field(..., description="수행된 액션 (approved/rejected)")
    success: bool = Field(..., description="성공 여부")

    class Config:
        populate_by_name = True


class BatchSuggestionRequest(BaseModel):
    """배치 제안 생성 요청."""

    memo_ids: Optional[list[str]] = Field(
        None,
        alias="memoIds",
        description="제안을 생성할 메모 ID 목록 (없으면 전체)"
    )
    limit: int = Field(10, ge=1, le=20, description="메모당 제안 개수")
    threshold: float = Field(0.5, ge=0.0, le=1.0, description="유사도 임계값")

    class Config:
        populate_by_name = True


class BatchSuggestionResult(BaseModel):
    """배치 제안 결과 항목."""

    memo_id: str = Field(..., alias="memoId", description="메모 ID")
    suggestion_count: int = Field(..., alias="suggestionCount", description="생성된 제안 수")
    error: Optional[str] = Field(None, description="오류 메시지 (있는 경우)")

    class Config:
        populate_by_name = True


class BatchSuggestionResponse(BaseModel):
    """배치 제안 생성 응답."""

    results: list[BatchSuggestionResult] = Field(..., description="결과 목록")
    total_memos: int = Field(..., alias="totalMemos", description="처리된 메모 수")
    total_suggestions: int = Field(..., alias="totalSuggestions", description="총 생성된 제안 수")

    class Config:
        populate_by_name = True
