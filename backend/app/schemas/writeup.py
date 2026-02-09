"""Write-up Pydantic 스키마 모듈."""

from datetime import datetime

from pydantic import BaseModel, Field


class WriteupCreate(BaseModel):
    """Write-up 생성 요청 스키마."""

    challenge_id: int
    content: str = Field(..., min_length=10)
    is_public: bool = True


class WriteupUpdate(BaseModel):
    """Write-up 수정 요청 스키마."""

    content: str | None = Field(default=None, min_length=10)
    is_public: bool | None = None


class WriteupResponse(BaseModel):
    """Write-up 응답 스키마."""

    id: int
    user_id: int
    username: str
    challenge_id: int
    challenge_title: str
    content: str
    is_public: bool
    upvotes: int
    created_at: datetime
    updated_at: datetime


class WriteupListResponse(BaseModel):
    """Write-up 목록 응답 스키마."""

    items: list[WriteupResponse]
    total: int
