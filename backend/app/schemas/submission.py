"""제출 Pydantic 스키마 모듈."""

from datetime import datetime

from pydantic import BaseModel, Field


class FlagSubmit(BaseModel):
    """플래그 제출 요청 스키마."""

    flag: str = Field(..., min_length=1, max_length=500)


class SubmissionResponse(BaseModel):
    """제출 응답 스키마."""

    id: int
    user_id: int
    challenge_id: int
    is_correct: bool
    submitted_at: datetime

    model_config = {"from_attributes": True}


class SubmissionResult(BaseModel):
    """플래그 제출 결과 스키마."""

    is_correct: bool
    message: str
    points_earned: int = 0
