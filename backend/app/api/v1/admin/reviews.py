"""관리자 커뮤니티 챌린지 심사 라우터."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session
from app.schemas.challenge import CommunitySubmissionResponse, ReviewAction
from app.services import challenge_review_service, notification_service

router = APIRouter()


@router.get("/reviews/pending", response_model=list[CommunitySubmissionResponse])
async def list_pending_reviews(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[CommunitySubmissionResponse]:
    """심사 대기 중인 커뮤니티 챌린지를 조회한다."""
    from . import require_author

    await require_author(db, user_id)
    challenges = await challenge_review_service.list_pending(db)
    return [CommunitySubmissionResponse.model_validate(c) for c in challenges]


@router.post(
    "/reviews/{challenge_id}",
    response_model=CommunitySubmissionResponse,
)
async def review_challenge(
    challenge_id: int,
    data: ReviewAction,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> CommunitySubmissionResponse:
    """커뮤니티 챌린지를 심사한다 (승인/반려)."""
    from . import require_author

    await require_author(db, user_id)
    challenge = await challenge_review_service.review_challenge(
        db,
        challenge_id=challenge_id,
        reviewer_id=user_id,
        action=data.action,
        comment=data.comment,
    )
    # 출제자에게 심사 결과 알림
    if challenge.author_id:
        await notification_service.notify_review_result(
            db,
            user_id=challenge.author_id,
            challenge_title=challenge.title,
            challenge_id=challenge.id,
            approved=(data.action == "approve"),
        )
    await db.commit()
    return CommunitySubmissionResponse.model_validate(challenge)
