"""대시보드 서비스 모듈.

유저 대시보드 데이터 조회 로직을 처리한다.
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, case, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.challenge import Challenge
from app.models.submission import Submission
from app.models.user import User


async def get_user_rank(db: AsyncSession, user_id: int) -> int:
    """유저의 전체 랭킹을 조회한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.

    Returns:
        유저의 순위 (1부터 시작).
    """
    user_result = await db.execute(
        select(User.total_score).where(User.id == user_id)
    )
    user_score = user_result.scalar_one_or_none()
    if user_score is None:
        return 0

    count_result = await db.execute(
        select(func.count(User.id)).where(User.total_score > user_score)
    )
    higher_count = count_result.scalar_one()
    return higher_count + 1


async def get_main_category(
    db: AsyncSession, user_id: int
) -> str | None:
    """유저가 가장 많이 푼 카테고리를 조회한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.

    Returns:
        가장 많이 푼 카테고리 문자열 또는 None.
    """
    result = await db.execute(
        select(Challenge.category, func.count(Submission.id).label("cnt"))
        .select_from(Submission)
        .join(Challenge, Submission.challenge_id == Challenge.id)
        .where(
            Submission.user_id == user_id,
            Submission.is_correct.is_(True),
        )
        .group_by(Challenge.category)
        .order_by(func.count(Submission.id).desc())
        .limit(1)
    )
    row = result.first()
    return row.category if row else None


async def get_streak_days(db: AsyncSession, user_id: int) -> int:
    """유저의 연속 풀이 일수를 계산한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.

    Returns:
        연속 풀이 일수.
    """
    result = await db.execute(
        select(
            func.date(Submission.submitted_at).label("solve_date")
        )
        .where(
            Submission.user_id == user_id,
            Submission.is_correct.is_(True),
        )
        .group_by(func.date(Submission.submitted_at))
        .order_by(func.date(Submission.submitted_at).desc())
    )
    dates = [row.solve_date for row in result.all()]

    if not dates:
        return 0

    today = datetime.now(UTC).date()
    streak = 0

    # 오늘 또는 어제부터 시작하여 연속 일수 계산
    check_date = today
    if dates[0] != today:
        if dates[0] == today - timedelta(days=1):
            check_date = today - timedelta(days=1)
        else:
            return 0

    date_set = set(dates)
    while check_date in date_set:
        streak += 1
        check_date -= timedelta(days=1)

    return streak


async def get_user_stats(
    db: AsyncSession, user_id: int
) -> dict:
    """유저 통계를 조회한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.

    Returns:
        유저 통계 딕셔너리.
    """
    user_result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = user_result.scalar_one_or_none()
    if not user:
        return {
            "rank": 0,
            "total_score": 0,
            "solved_count": 0,
            "main_category": None,
            "streak_days": 0,
        }

    rank = await get_user_rank(db, user_id)
    main_category = await get_main_category(db, user_id)
    streak = await get_streak_days(db, user_id)

    return {
        "rank": rank,
        "total_score": user.total_score,
        "solved_count": user.solved_count,
        "main_category": main_category,
        "streak_days": streak,
    }


async def get_activity_heatmap(
    db: AsyncSession, user_id: int, year: int
) -> dict:
    """유저의 연간 활동 히트맵 데이터를 조회한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.
        year: 조회 연도.

    Returns:
        히트맵 데이터 딕셔너리.
    """
    start_date = datetime(year, 1, 1, tzinfo=UTC)
    end_date = datetime(year, 12, 31, 23, 59, 59, tzinfo=UTC)

    result = await db.execute(
        select(
            func.date(Submission.submitted_at).label("solve_date"),
            func.count(
                distinct(
                    case(
                        (Submission.is_correct.is_(True), Submission.challenge_id),
                    )
                )
            ).label("count"),
        )
        .where(
            Submission.user_id == user_id,
            Submission.is_correct.is_(True),
            Submission.submitted_at >= start_date,
            Submission.submitted_at <= end_date,
        )
        .group_by(func.date(Submission.submitted_at))
        .order_by(func.date(Submission.submitted_at))
    )
    rows = result.all()

    entries = [
        {"date": str(row.solve_date), "count": row.count}
        for row in rows
    ]

    return {"year": year, "entries": entries}


async def get_recent_activity(
    db: AsyncSession, user_id: int, limit: int = 10
) -> list[dict]:
    """유저의 최근 풀이 활동을 조회한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.
        limit: 최대 결과 수.

    Returns:
        최근 풀이 목록.
    """
    result = await db.execute(
        select(
            Submission.challenge_id,
            Challenge.title.label("challenge_title"),
            Challenge.category,
            Challenge.points,
            Submission.submitted_at.label("solved_at"),
        )
        .select_from(Submission)
        .join(Challenge, Submission.challenge_id == Challenge.id)
        .where(
            Submission.user_id == user_id,
            Submission.is_correct.is_(True),
        )
        .order_by(Submission.submitted_at.desc())
        .limit(limit)
    )
    rows = result.all()

    return [
        {
            "challenge_id": row.challenge_id,
            "challenge_title": row.challenge_title,
            "category": row.category,
            "points": row.points,
            "solved_at": row.solved_at,
        }
        for row in rows
    ]


async def get_recommended_challenges(
    db: AsyncSession, user_id: int, limit: int = 3
) -> list[dict]:
    """유저에게 추천할 문제를 조회한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.
        limit: 최대 결과 수.

    Returns:
        추천 문제 목록.
    """
    # 이미 풀은 문제 ID 목록
    solved_result = await db.execute(
        select(Submission.challenge_id)
        .where(
            Submission.user_id == user_id,
            Submission.is_correct.is_(True),
        )
        .distinct()
    )
    solved_ids = {row.challenge_id for row in solved_result.all()}

    # 활성화된 승인된 문제 중 안 푼 문제 조회
    query = (
        select(Challenge)
        .where(
            Challenge.is_active.is_(True),
            Challenge.review_status == "approved",
        )
        .order_by(Challenge.solve_count.desc(), Challenge.created_at.desc())
        .limit(limit + len(solved_ids))
    )
    result = await db.execute(query)
    challenges = result.scalars().all()

    recommended = []
    for c in challenges:
        if c.id not in solved_ids and len(recommended) < limit:
            recommended.append({
                "id": c.id,
                "title": c.title,
                "category": c.category,
                "difficulty": c.difficulty,
                "points": c.points,
            })

    return recommended
