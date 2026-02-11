"""대시보드 스키마 모듈.

유저 대시보드 관련 응답 스키마를 정의한다.
"""

from datetime import datetime

from pydantic import BaseModel


class UserStatsResponse(BaseModel):
    """유저 통계 응답."""

    rank: int
    total_score: int
    solved_count: int
    main_category: str | None
    streak_days: int


class HeatmapEntry(BaseModel):
    """히트맵 항목."""

    date: str
    count: int


class HeatmapResponse(BaseModel):
    """활동 히트맵 응답."""

    year: int
    entries: list[HeatmapEntry]


class RecentSolveResponse(BaseModel):
    """최근 풀이 응답."""

    challenge_id: int
    challenge_title: str
    category: str
    points: int
    solved_at: datetime


class RecommendedChallengeResponse(BaseModel):
    """추천 문제 응답."""

    id: int
    title: str
    category: str
    difficulty: int
    points: int


class DashboardResponse(BaseModel):
    """대시보드 통합 응답."""

    stats: UserStatsResponse
    heatmap: HeatmapResponse
    recent_activity: list[RecentSolveResponse]
    recommended: list[RecommendedChallengeResponse]
