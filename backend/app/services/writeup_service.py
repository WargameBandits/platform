"""Write-up 서비스 모듈.

Write-up CRUD, 솔브 확인, HTML sanitize 로직을 처리한다.
"""

import re

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.models.writeup import Writeup
from app.services.challenge_service import check_already_solved, get_challenge_by_id


def sanitize_content(content: str) -> str:
    """Write-up 콘텐츠에서 위험한 HTML 태그를 제거한다.

    Args:
        content: 원본 콘텐츠.

    Returns:
        sanitize된 콘텐츠.
    """
    content = re.sub(r"<script[^>]*>.*?</script>", "", content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r"on\w+\s*=", "", content, flags=re.IGNORECASE)
    content = re.sub(r"javascript:", "", content, flags=re.IGNORECASE)
    return content


async def create_writeup(
    db: AsyncSession,
    user_id: int,
    challenge_id: int,
    content: str,
    is_public: bool = True,
) -> Writeup:
    """Write-up을 생성한다 (풀이한 문제만).

    Args:
        db: DB 세션.
        user_id: 작성자 ID.
        challenge_id: 챌린지 ID.
        content: Write-up 본문 (Markdown).
        is_public: 공개 여부.

    Returns:
        생성된 Writeup 객체.
    """
    # 풀이한 문제인지 확인
    solved = await check_already_solved(db, user_id, challenge_id)
    if not solved:
        raise BadRequestException("풀이한 문제에만 Write-up을 작성할 수 있습니다.")

    # 중복 Write-up 확인
    existing = await db.execute(
        select(Writeup).where(
            Writeup.user_id == user_id,
            Writeup.challenge_id == challenge_id,
        )
    )
    if existing.scalar_one_or_none():
        raise BadRequestException("이미 이 문제에 대한 Write-up이 존재합니다.")

    # 챌린지 존재 확인
    await get_challenge_by_id(db, challenge_id)

    writeup = Writeup(
        user_id=user_id,
        challenge_id=challenge_id,
        content=sanitize_content(content),
        is_public=is_public,
    )
    db.add(writeup)
    await db.flush()
    return writeup


async def update_writeup(
    db: AsyncSession,
    writeup_id: int,
    user_id: int,
    content: str | None = None,
    is_public: bool | None = None,
) -> Writeup:
    """Write-up을 수정한다.

    Args:
        db: DB 세션.
        writeup_id: Write-up ID.
        user_id: 수정 요청자 ID.
        content: 수정할 본문.
        is_public: 수정할 공개 여부.

    Returns:
        수정된 Writeup 객체.
    """
    result = await db.execute(select(Writeup).where(Writeup.id == writeup_id))
    writeup = result.scalar_one_or_none()
    if not writeup:
        raise NotFoundException("Write-up을 찾을 수 없습니다.")
    if writeup.user_id != user_id:
        raise ForbiddenException("본인의 Write-up만 수정할 수 있습니다.")

    if content is not None:
        writeup.content = sanitize_content(content)
    if is_public is not None:
        writeup.is_public = is_public

    await db.flush()
    return writeup


async def delete_writeup(
    db: AsyncSession,
    writeup_id: int,
    user_id: int,
) -> None:
    """Write-up을 삭제한다.

    Args:
        db: DB 세션.
        writeup_id: Write-up ID.
        user_id: 삭제 요청자 ID.
    """
    result = await db.execute(select(Writeup).where(Writeup.id == writeup_id))
    writeup = result.scalar_one_or_none()
    if not writeup:
        raise NotFoundException("Write-up을 찾을 수 없습니다.")
    if writeup.user_id != user_id:
        raise ForbiddenException("본인의 Write-up만 삭제할 수 있습니다.")

    await db.delete(writeup)
    await db.flush()


async def get_writeup(db: AsyncSession, writeup_id: int) -> Writeup:
    """Write-up을 ID로 조회한다.

    Args:
        db: DB 세션.
        writeup_id: Write-up ID.

    Returns:
        Writeup 객체.
    """
    result = await db.execute(select(Writeup).where(Writeup.id == writeup_id))
    writeup = result.scalar_one_or_none()
    if not writeup:
        raise NotFoundException("Write-up을 찾을 수 없습니다.")
    return writeup


async def list_writeups(
    db: AsyncSession,
    challenge_id: int | None = None,
    sort: str = "newest",
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Writeup], int]:
    """Write-up 목록을 조회한다.

    Args:
        db: DB 세션.
        challenge_id: 챌린지 필터.
        sort: 정렬 기준 (newest, oldest, most_upvoted).
        limit: 페이지당 개수.
        offset: 오프셋.

    Returns:
        (Write-up 목록, 전체 개수) 튜플.
    """
    query = select(Writeup).where(Writeup.is_public.is_(True))
    count_query = select(func.count(Writeup.id)).where(Writeup.is_public.is_(True))

    if challenge_id:
        query = query.where(Writeup.challenge_id == challenge_id)
        count_query = count_query.where(Writeup.challenge_id == challenge_id)

    if sort == "most_upvoted":
        query = query.order_by(Writeup.upvotes.desc(), Writeup.created_at.desc())
    elif sort == "oldest":
        query = query.order_by(Writeup.created_at.asc())
    else:
        query = query.order_by(Writeup.created_at.desc())

    query = query.offset(offset).limit(limit)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(query)
    writeups = list(result.scalars().all())

    return writeups, total


async def upvote_writeup(
    db: AsyncSession,
    writeup_id: int,
) -> Writeup:
    """Write-up에 추천을 한다.

    Args:
        db: DB 세션.
        writeup_id: Write-up ID.

    Returns:
        업데이트된 Writeup 객체.
    """
    result = await db.execute(select(Writeup).where(Writeup.id == writeup_id))
    writeup = result.scalar_one_or_none()
    if not writeup:
        raise NotFoundException("Write-up을 찾을 수 없습니다.")

    writeup.upvotes += 1
    await db.flush()
    return writeup
