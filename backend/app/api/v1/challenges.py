"""챌린지 일반 유저 API 라우터.

챌린지 목록 조회, 상세 조회, 플래그 제출 기능을 제공한다.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session, get_optional_user_id
from app.models.submission import Submission
from app.schemas.challenge import (
    ChallengeListResponse,
    ChallengeResponse,
    CategoryEnum,
)
from app.schemas.submission import FlagSubmit, SubmissionResult
from app.services import challenge_service, scoring_service, notification_service

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("", response_model=ChallengeListResponse)
async def list_challenges(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    category: CategoryEnum | None = None,
    difficulty: int | None = Query(default=None, ge=1, le=5),
    search: str | None = Query(default=None, max_length=100),
    cursor: int | None = Query(default=None, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    user_id: int | None = Depends(get_optional_user_id),
) -> ChallengeListResponse:
    """챌린지 목록을 조회한다 (커서 기반 페이지네이션)."""
    challenges, next_cursor, total = await challenge_service.list_challenges(
        db,
        category=category.value if category else None,
        difficulty=difficulty,
        search=search,
        cursor=cursor,
        limit=limit,
        user_id=user_id,
    )

    solved_ids: set[int] = set()
    if user_id:
        solved_ids = await challenge_service.get_solved_challenge_ids(db, user_id)

    items = [
        ChallengeResponse(
            **{
                **ChallengeResponse.model_validate(c).model_dump(),
                "is_solved": c.id in solved_ids,
            }
        )
        for c in challenges
    ]

    return ChallengeListResponse(
        items=items, next_cursor=next_cursor, total=total
    )


@router.get("/{challenge_id}", response_model=ChallengeResponse)
async def get_challenge(
    challenge_id: int,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ChallengeResponse:
    """챌린지 상세 정보를 조회한다."""
    challenge = await challenge_service.get_challenge_by_id(db, challenge_id)
    return ChallengeResponse.model_validate(challenge)


@router.post("/{challenge_id}/submit", response_model=SubmissionResult)
async def submit_flag(
    challenge_id: int,
    data: FlagSubmit,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> SubmissionResult:
    """플래그를 제출한다."""
    # 이미 풀었는지 확인
    already = await challenge_service.check_already_solved(db, user_id, challenge_id)
    if already:
        return SubmissionResult(
            is_correct=True,
            message="이미 풀이한 문제입니다.",
            points_earned=0,
        )

    # 챌린지 존재 확인
    challenge = await challenge_service.get_challenge_by_id(db, challenge_id)

    # 플래그 검증
    is_correct = await challenge_service.verify_flag(db, challenge_id, data.flag)

    # Submission 기록
    submission = Submission(
        user_id=user_id,
        challenge_id=challenge_id,
        submitted_flag=data.flag,
        is_correct=is_correct,
    )
    db.add(submission)

    points_earned = 0
    if is_correct:
        challenge.solve_count += 1
        points_earned = challenge_service.calculate_dynamic_points(
            challenge.max_points,
            challenge.min_points,
            challenge.decay,
            challenge.solve_count,
        )
        challenge.points = points_earned

        # 유저 점수 업데이트
        await scoring_service.update_user_score_on_solve(db, user_id, points_earned)

        # First Blood 알림 (최초 풀이자)
        if challenge.solve_count == 1:
            await notification_service.notify_first_blood(
                db, user_id, challenge.title, challenge.id
            )

    await db.commit()

    return SubmissionResult(
        is_correct=is_correct,
        message="정답입니다!" if is_correct else "틀렸습니다.",
        points_earned=points_earned if is_correct else 0,
    )
