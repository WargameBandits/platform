"""알림 API 라우터."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session
from app.schemas.notification import NotificationListResponse, NotificationResponse
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    limit: int = Query(20, ge=1, le=50),
    unread_only: bool = Query(False),
) -> NotificationListResponse:
    """내 알림 목록을 조회한다."""
    notifications, unread_count = await notification_service.get_user_notifications(
        db, user_id, limit=limit, unread_only=unread_only
    )
    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in notifications],
        unread_count=unread_count,
    )


@router.put("/{notification_id}/read", status_code=204)
async def mark_notification_read(
    notification_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """알림을 읽음 처리한다."""
    await notification_service.mark_as_read(db, notification_id, user_id)


@router.put("/read-all", status_code=204)
async def mark_all_notifications_read(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """모든 알림을 읽음 처리한다."""
    await notification_service.mark_all_as_read(db, user_id)
