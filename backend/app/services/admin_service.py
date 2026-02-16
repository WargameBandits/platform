"""관리자 대시보드 통계 서비스.

대시보드에 필요한 집계 쿼리를 최적화하여 제공한다.
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy import case, func, literal_column, select, union_all
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.challenge import Challenge
from app.models.container_instance import ContainerInstance
from app.models.submission import Submission
from app.models.user import User


async def get_dashboard_stats(db: AsyncSession) -> dict:
    """관리자 대시보드 통계를 반환한다.

    6개의 카운트 쿼리를 UNION ALL로 통합하여 DB 라운드트립을 줄인다.

    Args:
        db: DB 세션.

    Returns:
        통계 딕셔너리.
    """
    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 6개 카운트를 UNION ALL로 단일 쿼리로 통합
    counts_query = union_all(
        select(literal_column("'total_users'").label("key"), func.count(User.id).label("val")),
        select(
            literal_column("'today_signups'"),
            func.count(User.id),
        ).where(User.created_at >= today_start),
        select(
            literal_column("'active_instances'"),
            func.count(ContainerInstance.id),
        ).where(ContainerInstance.status == "running"),
        select(
            literal_column("'today_submissions'"),
            func.count(Submission.id),
        ).where(Submission.submitted_at >= today_start),
        select(
            literal_column("'pending_reviews'"),
            func.count(Challenge.id),
        ).where(Challenge.review_status == "pending"),
        select(
            literal_column("'total_challenges'"),
            func.count(Challenge.id),
        ).where(Challenge.is_active.is_(True)),
    )

    result = await db.execute(counts_query)
    counts = {row[0]: row[1] for row in result.all()}

    # 카테고리별 풀이 분포
    cat_result = await db.execute(
        select(Challenge.category, func.count(Submission.id))
        .join(Submission, Submission.challenge_id == Challenge.id)
        .where(Submission.is_correct.is_(True))
        .group_by(Challenge.category)
    )
    category_distribution = {row[0]: row[1] for row in cat_result.all()}

    # 최근 7일 일별 제출 수 — 단일 쿼리로 처리
    week_ago = today_start - timedelta(days=6)
    daily_result = await db.execute(
        select(
            func.date_trunc("day", Submission.submitted_at).label("day"),
            func.count(Submission.id),
        )
        .where(Submission.submitted_at >= week_ago)
        .group_by("day")
        .order_by("day")
    )
    daily_map = {row[0].strftime("%m/%d"): row[1] for row in daily_result.all()}

    daily_submissions = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        key = day.strftime("%m/%d")
        daily_submissions.append({"date": key, "count": daily_map.get(key, 0)})

    return {
        "total_users": counts.get("total_users", 0),
        "today_signups": counts.get("today_signups", 0),
        "active_instances": counts.get("active_instances", 0),
        "today_submissions": counts.get("today_submissions", 0),
        "pending_reviews": counts.get("pending_reviews", 0),
        "total_challenges": counts.get("total_challenges", 0),
        "category_distribution": category_distribution,
        "daily_submissions": daily_submissions,
    }
