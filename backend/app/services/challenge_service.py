"""챌린지 비즈니스 로직 서비스 모듈."""

import hashlib

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException
from app.models.challenge import Challenge
from app.models.submission import Submission
from app.schemas.challenge import ChallengeCreate, ChallengeUpdate


def hash_flag(flag: str) -> str:
    """플래그를 SHA-256으로 해싱한다.

    Args:
        flag: 평문 플래그 문자열.

    Returns:
        SHA-256 해시 문자열.
    """
    return hashlib.sha256(flag.encode()).hexdigest()


async def create_challenge(
    db: AsyncSession, data: ChallengeCreate, author_id: int
) -> Challenge:
    """새 챌린지를 생성한다.

    Args:
        db: DB 세션.
        data: 챌린지 생성 데이터.
        author_id: 출제자 ID.

    Returns:
        생성된 Challenge 객체.
    """
    challenge = Challenge(
        title=data.title,
        description=data.description,
        category=data.category.value,
        difficulty=data.difficulty,
        points=data.points,
        max_points=data.max_points,
        min_points=data.min_points,
        decay=data.decay,
        flag_hash=hash_flag(data.flag),
        flag_type=data.flag_type.value,
        is_dynamic=data.is_dynamic,
        docker_image=data.docker_image,
        files=data.files,
        hints=[h.model_dump() for h in data.hints] if data.hints else None,
        tags=data.tags,
        author_id=author_id,
        is_active=data.is_active,
    )
    db.add(challenge)
    await db.flush()
    await db.refresh(challenge)
    return challenge


async def update_challenge(
    db: AsyncSession, challenge_id: int, data: ChallengeUpdate
) -> Challenge:
    """챌린지를 수정한다.

    Args:
        db: DB 세션.
        challenge_id: 수정할 챌린지 ID.
        data: 수정 데이터.

    Returns:
        수정된 Challenge 객체.

    Raises:
        NotFoundException: 챌린지가 존재하지 않을 때.
    """
    challenge = await get_challenge_by_id(db, challenge_id)
    update_data = data.model_dump(exclude_unset=True)

    if "flag" in update_data:
        update_data["flag_hash"] = hash_flag(update_data.pop("flag"))
    if "category" in update_data:
        update_data["category"] = update_data["category"].value
    if "flag_type" in update_data and update_data["flag_type"] is not None:
        update_data["flag_type"] = update_data["flag_type"].value
    if "hints" in update_data and update_data["hints"] is not None:
        update_data["hints"] = [h.model_dump() for h in data.hints]

    for key, value in update_data.items():
        setattr(challenge, key, value)

    await db.flush()
    await db.refresh(challenge)
    return challenge


async def delete_challenge(db: AsyncSession, challenge_id: int) -> None:
    """챌린지를 삭제한다.

    Args:
        db: DB 세션.
        challenge_id: 삭제할 챌린지 ID.

    Raises:
        NotFoundException: 챌린지가 존재하지 않을 때.
    """
    challenge = await get_challenge_by_id(db, challenge_id)
    await db.delete(challenge)
    await db.flush()


async def get_challenge_by_id(db: AsyncSession, challenge_id: int) -> Challenge:
    """ID로 챌린지를 조회한다.

    Args:
        db: DB 세션.
        challenge_id: 챌린지 ID.

    Returns:
        Challenge 객체.

    Raises:
        NotFoundException: 챌린지가 존재하지 않을 때.
    """
    result = await db.execute(
        select(Challenge).where(Challenge.id == challenge_id)
    )
    challenge = result.scalar_one_or_none()
    if challenge is None:
        raise NotFoundException("챌린지를 찾을 수 없습니다.")
    return challenge


async def list_challenges(
    db: AsyncSession,
    *,
    category: str | None = None,
    difficulty: int | None = None,
    search: str | None = None,
    cursor: int | None = None,
    limit: int = 20,
    active_only: bool = True,
    user_id: int | None = None,
) -> tuple[list[Challenge], int | None, int]:
    """챌린지 목록을 커서 기반으로 조회한다.

    Args:
        db: DB 세션.
        category: 카테고리 필터.
        difficulty: 난이도 필터.
        search: 검색어 (제목, 태그).
        cursor: 커서 (마지막 조회된 챌린지 ID).
        limit: 페이지당 개수.
        active_only: 활성 챌린지만 조회할지 여부.
        user_id: 풀이 여부 확인용 유저 ID.

    Returns:
        (챌린지 목록, 다음 커서, 전체 개수) 튜플.
    """
    query = select(Challenge)
    count_query = select(func.count(Challenge.id))

    if active_only:
        query = query.where(Challenge.is_active.is_(True))
        count_query = count_query.where(Challenge.is_active.is_(True))

    # 공개 목록에서는 승인된 챌린지만 표시
    query = query.where(Challenge.review_status == "approved")
    count_query = count_query.where(Challenge.review_status == "approved")
    if category:
        query = query.where(Challenge.category == category)
        count_query = count_query.where(Challenge.category == category)
    if difficulty:
        query = query.where(Challenge.difficulty == difficulty)
        count_query = count_query.where(Challenge.difficulty == difficulty)
    if search:
        pattern = f"%{search}%"
        query = query.where(Challenge.title.ilike(pattern))
        count_query = count_query.where(Challenge.title.ilike(pattern))
    if cursor:
        query = query.where(Challenge.id > cursor)

    query = query.order_by(Challenge.id.asc()).limit(limit + 1)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(query)
    challenges = list(result.scalars().all())

    next_cursor = None
    if len(challenges) > limit:
        challenges = challenges[:limit]
        next_cursor = challenges[-1].id

    return challenges, next_cursor, total


async def get_solved_challenge_ids(
    db: AsyncSession, user_id: int
) -> set[int]:
    """유저가 풀이한 챌린지 ID 목록을 반환한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.

    Returns:
        풀이 완료된 챌린지 ID set.
    """
    result = await db.execute(
        select(Submission.challenge_id)
        .where(Submission.user_id == user_id, Submission.is_correct.is_(True))
        .distinct()
    )
    return set(result.scalars().all())


async def verify_flag(
    db: AsyncSession, challenge_id: int, submitted_flag: str
) -> bool:
    """제출된 플래그가 정답인지 검증한다.

    Args:
        db: DB 세션.
        challenge_id: 챌린지 ID.
        submitted_flag: 제출된 플래그.

    Returns:
        정답 여부.
    """
    challenge = await get_challenge_by_id(db, challenge_id)
    return challenge.flag_hash == hash_flag(submitted_flag)


async def check_already_solved(
    db: AsyncSession, user_id: int, challenge_id: int
) -> bool:
    """이미 풀이한 챌린지인지 확인한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.
        challenge_id: 챌린지 ID.

    Returns:
        이미 풀이했으면 True.
    """
    result = await db.execute(
        select(Submission.id).where(
            Submission.user_id == user_id,
            Submission.challenge_id == challenge_id,
            Submission.is_correct.is_(True),
        )
    )
    return result.scalar_one_or_none() is not None


def calculate_dynamic_points(
    max_points: int, min_points: int, decay: float, solve_count: int
) -> int:
    """동적 점수를 계산한다.

    Args:
        max_points: 최대 점수.
        min_points: 최소 점수.
        decay: 감소 계수.
        solve_count: 현재 풀이자 수.

    Returns:
        계산된 점수.
    """
    return max(min_points, int(max_points - decay * solve_count))
