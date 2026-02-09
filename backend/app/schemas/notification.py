"""알림 Pydantic 스키마 모듈."""

from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    """알림 응답 스키마."""

    id: int
    type: str
    title: str
    message: str
    challenge_id: int | None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    """알림 목록 응답 스키마."""

    items: list[NotificationResponse]
    unread_count: int
