"""관리자 대시보드 통계 라우터."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session
from app.services import admin_service

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """관리자 대시보드 통계를 반환한다."""
    from . import require_author

    await require_author(db, user_id)
    return await admin_service.get_dashboard_stats(db)
