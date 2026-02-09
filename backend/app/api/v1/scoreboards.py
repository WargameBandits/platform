"""스코어보드 API 라우터.

종합 및 카테고리별 랭킹 조회 엔드포인트를 제공한다.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.services import scoring_service

router = APIRouter(prefix="/scoreboards", tags=["scoreboards"])


class ScoreboardEntry(BaseModel):
    """스코어보드 항목 스키마."""

    rank: int
    user_id: int
    username: str
    solved_count: int
    total_score: int


class ScoreboardResponse(BaseModel):
    """스코어보드 응답 스키마."""

    category: str | None = None
    entries: list[ScoreboardEntry]


@router.get("", response_model=ScoreboardResponse)
async def get_scoreboard(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    category: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
) -> ScoreboardResponse:
    """종합 또는 카테고리별 스코어보드를 조회한다."""
    entries = await scoring_service.get_scoreboard(
        db, category=category, limit=limit
    )
    return ScoreboardResponse(
        category=category,
        entries=[ScoreboardEntry(**e) for e in entries],
    )
