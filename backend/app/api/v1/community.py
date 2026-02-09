"""커뮤니티 챌린지 API 라우터.

유저 출제 제출, 수정, 삭제, 내 출제 조회 엔드포인트를 제공한다.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session
from app.schemas.challenge import (
    CommunitySubmissionResponse,
    CommunitySubmitCreate,
    CommunitySubmitUpdate,
)
from app.services import challenge_review_service

router = APIRouter(prefix="/challenges/community", tags=["community"])


@router.post("/submit", response_model=CommunitySubmissionResponse, status_code=201)
async def submit_challenge(
    data: CommunitySubmitCreate,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> CommunitySubmissionResponse:
    """커뮤니티 챌린지를 제출한다."""
    challenge = await challenge_review_service.submit_challenge(
        db,
        user_id=user_id,
        title=data.title,
        description=data.description,
        category=data.category.value,
        difficulty=data.difficulty,
        flag=data.flag,
        flag_type=data.flag_type.value,
        is_dynamic=data.is_dynamic,
        docker_image=data.docker_image,
        files=data.files,
        hints=data.hints,
        tags=data.tags,
    )
    await db.commit()
    return CommunitySubmissionResponse.model_validate(challenge)


@router.put("/{challenge_id}", response_model=CommunitySubmissionResponse)
async def update_submission(
    challenge_id: int,
    data: CommunitySubmitUpdate,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> CommunitySubmissionResponse:
    """제출한 챌린지를 수정한다."""
    challenge = await challenge_review_service.update_submission(
        db,
        challenge_id=challenge_id,
        user_id=user_id,
        **data.model_dump(exclude_none=True),
    )
    await db.commit()
    return CommunitySubmissionResponse.model_validate(challenge)


@router.delete("/{challenge_id}", status_code=204)
async def delete_submission(
    challenge_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """제출한 챌린지를 삭제한다."""
    await challenge_review_service.delete_submission(db, challenge_id, user_id)
    await db.commit()


@router.get("/my-submissions", response_model=list[CommunitySubmissionResponse])
async def get_my_submissions(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[CommunitySubmissionResponse]:
    """내 출제 목록을 조회한다."""
    challenges = await challenge_review_service.get_my_submissions(db, user_id)
    return [CommunitySubmissionResponse.model_validate(c) for c in challenges]
