"""관리자 전용 API 라우터 패키지.

챌린지 CRUD, 통계, 유저 관리, 파일 업로드, 심사 기능을 서브 모듈로 분리한다.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session
from app.core.exceptions import ForbiddenException
from app.core.permissions import AUTHOR_ROLES
from app.models.user import User

from .challenges import router as challenges_router
from .files import router as files_router
from .reviews import router as reviews_router
from .stats import router as stats_router
from .users import router as users_router

router = APIRouter(prefix="/admin", tags=["admin"])

router.include_router(challenges_router)
router.include_router(stats_router)
router.include_router(users_router)
router.include_router(files_router)
router.include_router(reviews_router)


async def require_author(
    db: AsyncSession, user_id: int
) -> User:
    """출제 권한이 있는 유저인지 확인한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.

    Returns:
        User 객체.

    Raises:
        ForbiddenException: 권한이 없을 때.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or user.role not in AUTHOR_ROLES:
        raise ForbiddenException("관리자 또는 출제자 권한이 필요합니다.")
    return user
