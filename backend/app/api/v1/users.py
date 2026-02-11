"""유저 API 라우터.

프로필 조회 및 대시보드 엔드포인트를 제공한다.
"""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session
from app.core.exceptions import NotFoundException
from app.schemas.dashboard import (
    DashboardResponse,
    HeatmapResponse,
    UserStatsResponse,
)
from app.schemas.user import UserPublicResponse, UserResponse
from app.services import auth_service
from app.services import dashboard_service

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


@router.get("/me/stats", response_model=UserStatsResponse)
async def get_my_stats(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserStatsResponse:
    """현재 유저의 통계를 조회한다."""
    stats = await dashboard_service.get_user_stats(db, user_id)
    return UserStatsResponse(**stats)


@router.get("/me/heatmap", response_model=HeatmapResponse)
async def get_my_heatmap(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    year: int = Query(default_factory=lambda: datetime.now(UTC).year),
) -> HeatmapResponse:
    """현재 유저의 활동 히트맵을 조회한다."""
    heatmap = await dashboard_service.get_activity_heatmap(
        db, user_id, year
    )
    return HeatmapResponse(**heatmap)


@router.get("/me/dashboard", response_model=DashboardResponse)
async def get_my_dashboard(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> DashboardResponse:
    """현재 유저의 대시보드 데이터를 통합 조회한다."""
    year = datetime.now(UTC).year

    stats = await dashboard_service.get_user_stats(db, user_id)
    heatmap = await dashboard_service.get_activity_heatmap(
        db, user_id, year
    )
    recent = await dashboard_service.get_recent_activity(db, user_id)
    recommended = await dashboard_service.get_recommended_challenges(
        db, user_id
    )

    return DashboardResponse(
        stats=UserStatsResponse(**stats),
        heatmap=HeatmapResponse(**heatmap),
        recent_activity=recent,
        recommended=recommended,
    )


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
