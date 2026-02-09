"""유저 API 라우터.

프로필 조회 엔드포인트를 제공한다.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session
from app.core.exceptions import NotFoundException
from app.schemas.user import UserPublicResponse, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserResponse:
    """현재 로그인한 유저의 프로필을 조회한다."""
    user = await auth_service.get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("유저를 찾을 수 없습니다.")
    return UserResponse.model_validate(user)


@router.get("/{user_id}", response_model=UserPublicResponse)
async def get_user_profile(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserPublicResponse:
    """특정 유저의 공개 프로필을 조회한다."""
    user = await auth_service.get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("유저를 찾을 수 없습니다.")
    return UserPublicResponse.model_validate(user)
