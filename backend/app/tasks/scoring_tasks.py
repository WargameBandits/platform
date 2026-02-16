"""스코어링 관련 Celery 비동기 태스크.

동적 점수 재계산 및 전체 유저 점수 일괄 갱신을 담당한다.
"""

import logging

from app.tasks import run_async, task_decorator

logger = logging.getLogger(__name__)


@task_decorator("app.tasks.scoring_tasks.recalculate_dynamic_scores")
def recalculate_dynamic_scores() -> dict:
    """모든 챌린지의 동적 점수를 재계산하는 주기적 태스크.

    공식: points = max(min_points, max_points - decay * solve_count)

    Returns:
        업데이트된 챌린지 수.
    """
    count = run_async(_recalculate_challenges())
    return {"updated": count}


async def _recalculate_challenges() -> int:
    """동적 점수 재계산 비동기 래퍼."""
    from sqlalchemy import select

    from app.database import async_session_factory
    from app.models.challenge import Challenge

    async with async_session_factory() as db:
        try:
            result = await db.execute(
                select(Challenge).where(Challenge.is_active.is_(True))
            )
            challenges = list(result.scalars().all())

            updated = 0
            for challenge in challenges:
                new_points = max(
                    challenge.min_points,
                    challenge.max_points - int(challenge.decay * challenge.solve_count),
                )
                if challenge.points != new_points:
                    challenge.points = new_points
                    updated += 1

            await db.commit()
            logger.info("동적 점수 재계산 완료: %d건 업데이트", updated)
            return updated
        except Exception:
            await db.rollback()
            logger.exception("동적 점수 재계산 중 오류 발생")
            return 0


@task_decorator("app.tasks.scoring_tasks.recalculate_all_user_scores")
def recalculate_all_user_scores() -> dict:
    """모든 유저의 총 점수를 Submission 기반으로 재계산한다.

    점수 정합성 유지를 위한 태스크.

    Returns:
        재계산된 유저 수.
    """
    count = run_async(_recalculate_users())
    return {"recalculated": count}


async def _recalculate_users() -> int:
    """유저 점수 재계산 비동기 래퍼."""
    from sqlalchemy import select, func

    from app.database import async_session_factory
    from app.models.challenge import Challenge
    from app.models.submission import Submission
    from app.models.user import User

    async with async_session_factory() as db:
        try:
            # 유저별 맞은 제출의 점수 합산
            score_subq = (
                select(
                    Submission.user_id,
                    func.coalesce(func.sum(Challenge.points), 0).label("total"),
                    func.count(Submission.id).label("solved"),
                )
                .join(Challenge, Submission.challenge_id == Challenge.id)
                .where(Submission.is_correct.is_(True))
                .group_by(Submission.user_id)
                .subquery()
            )

            result = await db.execute(select(User))
            users = list(result.scalars().all())

            scores_result = await db.execute(
                select(score_subq.c.user_id, score_subq.c.total, score_subq.c.solved)
            )
            score_map = {
                row.user_id: (row.total, row.solved)
                for row in scores_result.all()
            }

            updated = 0
            for user in users:
                total, solved = score_map.get(user.id, (0, 0))
                if user.total_score != total or user.solved_count != solved:
                    user.total_score = total
                    user.solved_count = solved
                    updated += 1

            await db.commit()
            logger.info("유저 점수 재계산 완료: %d건 업데이트", updated)
            return updated
        except Exception:
            await db.rollback()
            logger.exception("유저 점수 재계산 중 오류 발생")
            return 0
