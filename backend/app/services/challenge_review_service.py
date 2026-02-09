"""커뮤니티 챌린지 심사 서비스 모듈.

유저 출제, 심사, 승인/반려 로직을 처리한다.
"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.models.challenge import Challenge
from app.models.user import User
from app.services.challenge_service import hash_flag


async def submit_challenge(
    db: AsyncSession,
    user_id: int,
    title: str,
    description: str,
    category: str,
    difficulty: int,
    flag: str,
    flag_type: str = "static",
    is_dynamic: bool = False,
    docker_image: str | None = None,
    files: list[str] | None = None,
    hints: list | None = None,
    tags: list[str] | None = None,
) -> Challenge:
    """커뮤니티 챌린지를 제출한다.

    Args:
        db: DB 세션.
        user_id: 제출자 ID.
        기타: 챌린지 필드.

    Returns:
        생성된 Challenge 객체 (review_status=pending).
    """
    challenge = Challenge(
        title=title,
        description=description,
        category=category,
        difficulty=difficulty,
        flag_hash=hash_flag(flag),
        flag_type=flag_type,
        is_dynamic=is_dynamic,
        docker_image=docker_image,
        files=files,
        hints=[h if isinstance(h, dict) else h.model_dump() for h in (hints or [])],
        tags=tags,
        author_id=user_id,
        source="community",
        review_status="pending",
        is_active=False,
        points=100,
        max_points=500,
        min_points=50,
        decay=10.0,
    )
    db.add(challenge)
    await db.flush()
    return challenge


async def update_submission(
    db: AsyncSession,
    challenge_id: int,
    user_id: int,
    **kwargs,
) -> Challenge:
    """제출한 챌린지를 수정한다 (pending 상태에서만).

    Args:
        db: DB 세션.
        challenge_id: 챌린지 ID.
        user_id: 제출자 ID.

    Returns:
        수정된 Challenge 객체.
    """
    result = await db.execute(
        select(Challenge).where(Challenge.id == challenge_id)
    )
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise NotFoundException("챌린지를 찾을 수 없습니다.")
    if challenge.author_id != user_id:
        raise ForbiddenException("본인의 출제만 수정할 수 있습니다.")
    if challenge.review_status not in ("draft", "pending", "rejected"):
        raise BadRequestException("승인된 챌린지는 수정할 수 없습니다.")

    for key, value in kwargs.items():
        if value is not None:
            if key == "flag":
                setattr(challenge, "flag_hash", hash_flag(value))
            elif key == "hints":
                setattr(
                    challenge,
                    "hints",
                    [h if isinstance(h, dict) else h.model_dump() for h in value],
                )
            else:
                setattr(challenge, key, value)

    challenge.review_status = "pending"
    await db.flush()
    return challenge


async def delete_submission(
    db: AsyncSession,
    challenge_id: int,
    user_id: int,
) -> None:
    """제출한 챌린지를 삭제한다 (approved 전에만).

    Args:
        db: DB 세션.
        challenge_id: 챌린지 ID.
        user_id: 제출자 ID.
    """
    result = await db.execute(
        select(Challenge).where(Challenge.id == challenge_id)
    )
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise NotFoundException("챌린지를 찾을 수 없습니다.")
    if challenge.author_id != user_id:
        raise ForbiddenException("본인의 출제만 삭제할 수 있습니다.")
    if challenge.review_status == "approved":
        raise BadRequestException("승인된 챌린지는 삭제할 수 없습니다.")

    await db.delete(challenge)
    await db.flush()


async def get_my_submissions(
    db: AsyncSession,
    user_id: int,
) -> list[Challenge]:
    """내 출제 목록을 조회한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.

    Returns:
        Challenge 목록.
    """
    result = await db.execute(
        select(Challenge)
        .where(Challenge.author_id == user_id, Challenge.source == "community")
        .order_by(Challenge.created_at.desc())
    )
    return list(result.scalars().all())


async def list_pending(db: AsyncSession) -> list[Challenge]:
    """심사 대기 중인 챌린지를 조회한다.

    Args:
        db: DB 세션.

    Returns:
        pending 상태의 Challenge 목록.
    """
    result = await db.execute(
        select(Challenge)
        .where(Challenge.review_status == "pending")
        .order_by(Challenge.created_at.asc())
    )
    return list(result.scalars().all())


async def review_challenge(
    db: AsyncSession,
    challenge_id: int,
    reviewer_id: int,
    action: str,
    comment: str | None = None,
) -> Challenge:
    """챌린지를 심사한다 (승인/반려).

    Args:
        db: DB 세션.
        challenge_id: 챌린지 ID.
        reviewer_id: 심사자 ID.
        action: "approve" 또는 "reject".
        comment: 심사 코멘트.

    Returns:
        심사된 Challenge 객체.
    """
    result = await db.execute(
        select(Challenge).where(Challenge.id == challenge_id)
    )
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise NotFoundException("챌린지를 찾을 수 없습니다.")
    if challenge.review_status != "pending":
        raise BadRequestException("심사 대기 상태가 아닙니다.")

    challenge.reviewer_id = reviewer_id
    challenge.review_comment = comment
    challenge.reviewed_at = datetime.now(UTC)

    if action == "approve":
        challenge.review_status = "approved"
        challenge.is_active = True

        # 출제자의 authored_count 증가
        if challenge.author_id:
            user_result = await db.execute(
                select(User).where(User.id == challenge.author_id)
            )
            user = user_result.scalar_one_or_none()
            if user:
                user.authored_count += 1
    else:
        challenge.review_status = "rejected"

    await db.flush()
    return challenge
