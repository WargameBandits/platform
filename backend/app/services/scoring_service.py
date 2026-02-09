"""스코어링 서비스 모듈.

유저 점수 업데이트 및 스코어보드 조회 로직을 처리한다.
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.submission import Submission
from app.models.user import User


async def update_user_score_on_solve(
    db: AsyncSession,
    user_id: int,
    points: int,
) -> None:
    """문제 풀이 성공 시 유저의 점수와 풀이 수를 업데이트한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.
        points: 획득 점수.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return

    user.total_score += points
    user.solved_count += 1
    await db.flush()


async def recalculate_user_score(
    db: AsyncSession,
    user_id: int,
) -> int:
    """유저의 총 점수를 Submission 기반으로 재계산한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.

    Returns:
        재계산된 총 점수.
    """
    from app.models.challenge import Challenge

    result = await db.execute(
        select(func.coalesce(func.sum(Challenge.points), 0))
        .select_from(Submission)
        .join(Challenge, Submission.challenge_id == Challenge.id)
        .where(Submission.user_id == user_id, Submission.is_correct.is_(True))
    )
    total = result.scalar_one()

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if user:
        user.total_score = total
        await db.flush()

    return total


async def get_scoreboard(
    db: AsyncSession,
    category: str | None = None,
    limit: int = 100,
) -> list[dict]:
    """스코어보드를 조회한다.

    Args:
        db: DB 세션.
        category: 카테고리 필터 (None이면 종합).
        limit: 최대 결과 수.

    Returns:
        랭킹 목록 (dict list).
    """
    if category:
        from app.models.challenge import Challenge

        stmt = (
            select(
                User.id,
                User.username,
                func.count(Submission.id).label("solved_count"),
                func.coalesce(func.sum(Challenge.points), 0).label("total_score"),
            )
            .select_from(User)
            .join(Submission, Submission.user_id == User.id)
            .join(Challenge, Submission.challenge_id == Challenge.id)
            .where(Submission.is_correct.is_(True), Challenge.category == category)
            .group_by(User.id, User.username)
            .order_by(func.sum(Challenge.points).desc())
            .limit(limit)
        )
    else:
        stmt = (
            select(
                User.id,
                User.username,
                User.solved_count,
                User.total_score,
            )
            .where(User.total_score > 0)
            .order_by(User.total_score.desc(), User.solved_count.desc())
            .limit(limit)
        )

    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            "rank": idx + 1,
            "user_id": row.id,
            "username": row.username,
            "solved_count": row.solved_count,
            "total_score": row.total_score,
        }
        for idx, row in enumerate(rows)
    ]
