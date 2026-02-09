"""관리자 전용 API 라우터.

챌린지 CRUD, YAML import, 통계, 심사 기능을 제공한다.
"""

import hashlib
from datetime import UTC, datetime, timedelta
from typing import Annotated

import yaml
from fastapi import APIRouter, Depends, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session
from app.core.exceptions import ForbiddenException
from app.core.permissions import AUTHOR_ROLES, UserRole
from app.models.challenge import Challenge
from app.models.container_instance import ContainerInstance
from app.models.submission import Submission
from app.models.user import User
from app.schemas.challenge import (
    ChallengeAdminResponse,
    ChallengeCreate,
    ChallengeUpdate,
    CommunitySubmissionResponse,
    ReviewAction,
)
from app.services import challenge_service, challenge_review_service, file_service, notification_service

router = APIRouter(prefix="/admin", tags=["admin"])


async def _require_author(
    db: AsyncSession, user_id: int
) -> User:
    """출제 권한이 있는 유저인지 확인한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.

    Returns:
        User 객체.

    Raises:
        ForbiddenException: 권한이 없을 때.
    """
    from sqlalchemy import select

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or user.role not in AUTHOR_ROLES:
        raise ForbiddenException("관리자 또는 출제자 권한이 필요합니다.")
    return user


@router.post("/challenges", response_model=ChallengeAdminResponse, status_code=201)
async def create_challenge(
    data: ChallengeCreate,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ChallengeAdminResponse:
    """새 챌린지를 생성한다."""
    await _require_author(db, user_id)
    challenge = await challenge_service.create_challenge(db, data, user_id)
    return ChallengeAdminResponse.model_validate(challenge)


@router.get("/challenges/{challenge_id}", response_model=ChallengeAdminResponse)
async def get_challenge_admin(
    challenge_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ChallengeAdminResponse:
    """챌린지 상세 정보를 관리자 뷰로 조회한다."""
    await _require_author(db, user_id)
    challenge = await challenge_service.get_challenge_by_id(db, challenge_id)
    return ChallengeAdminResponse.model_validate(challenge)


@router.put("/challenges/{challenge_id}", response_model=ChallengeAdminResponse)
async def update_challenge(
    challenge_id: int,
    data: ChallengeUpdate,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ChallengeAdminResponse:
    """챌린지를 수정한다."""
    await _require_author(db, user_id)
    challenge = await challenge_service.update_challenge(db, challenge_id, data)
    return ChallengeAdminResponse.model_validate(challenge)


@router.delete("/challenges/{challenge_id}", status_code=204)
async def delete_challenge(
    challenge_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """챌린지를 삭제한다."""
    await _require_author(db, user_id)
    await challenge_service.delete_challenge(db, challenge_id)


@router.post("/challenges/import", status_code=201)
async def import_challenges_yaml(
    file: UploadFile,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """challenge.yaml 파일로 챌린지를 일괄 등록한다.

    YAML 파일에 단일 챌린지 또는 챌린지 리스트를 포함할 수 있다.
    """
    await _require_author(db, user_id)

    content = await file.read()
    parsed = yaml.safe_load(content)

    challenges_data = parsed if isinstance(parsed, list) else [parsed]
    created = []

    for item in challenges_data:
        data = ChallengeCreate(
            title=item["title"],
            description=item.get("description", ""),
            category=item["category"],
            difficulty=item.get("difficulty", 1),
            points=item.get("points", 100),
            max_points=item.get("max_points", 500),
            min_points=item.get("min_points", 50),
            decay=item.get("decay", 10.0),
            flag=item["flag"],
            flag_type=item.get("flag_type", "static"),
            is_dynamic=item.get("is_dynamic", False),
            docker_image=item.get("docker", {}).get("image") if item.get("docker") else None,
            files=item.get("files"),
            hints=item.get("hints"),
            tags=item.get("tags"),
            is_active=item.get("is_active", True),
        )
        challenge = await challenge_service.create_challenge(db, data, user_id)
        created.append(challenge.id)

    return {"imported": len(created), "challenge_ids": created}


# === 대시보드 통계 ===


@router.get("/stats")
async def get_dashboard_stats(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """관리자 대시보드 통계를 반환한다."""
    await _require_author(db, user_id)

    now = datetime.now(UTC)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 총 유저 수
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0

    # 오늘 가입 수
    today_signups = (await db.execute(
        select(func.count(User.id)).where(User.created_at >= today_start)
    )).scalar() or 0

    # 활성 인스턴스
    active_instances = (await db.execute(
        select(func.count(ContainerInstance.id)).where(
            ContainerInstance.status == "running"
        )
    )).scalar() or 0

    # 오늘 제출 수
    today_submissions = (await db.execute(
        select(func.count(Submission.id)).where(
            Submission.submitted_at >= today_start
        )
    )).scalar() or 0

    # 심사 대기 문제 수
    pending_reviews = (await db.execute(
        select(func.count(Challenge.id)).where(
            Challenge.review_status == "pending"
        )
    )).scalar() or 0

    # 총 챌린지 수
    total_challenges = (await db.execute(
        select(func.count(Challenge.id)).where(Challenge.is_active.is_(True))
    )).scalar() or 0

    # 카테고리별 풀이 분포
    cat_dist = (await db.execute(
        select(Challenge.category, func.count(Submission.id))
        .join(Submission, Submission.challenge_id == Challenge.id)
        .where(Submission.is_correct.is_(True))
        .group_by(Challenge.category)
    )).all()
    category_distribution = {row[0]: row[1] for row in cat_dist}

    # 최근 7일 일별 제출 수
    daily_submissions = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_end = day_start + timedelta(days=1)
        count = (await db.execute(
            select(func.count(Submission.id)).where(
                Submission.submitted_at >= day_start,
                Submission.submitted_at < day_end,
            )
        )).scalar() or 0
        daily_submissions.append({
            "date": day_start.strftime("%m/%d"),
            "count": count,
        })

    return {
        "total_users": total_users,
        "today_signups": today_signups,
        "active_instances": active_instances,
        "today_submissions": today_submissions,
        "pending_reviews": pending_reviews,
        "total_challenges": total_challenges,
        "category_distribution": category_distribution,
        "daily_submissions": daily_submissions,
    }


# === 유저 관리 ===


@router.get("/users")
async def list_users(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    search: str | None = Query(None, max_length=100),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> dict:
    """유저 목록을 조회한다."""
    await _require_author(db, user_id)

    stmt = select(User)
    if search:
        stmt = stmt.where(User.username.ilike(f"%{search}%"))
    stmt = stmt.order_by(User.id.desc()).offset(offset).limit(limit)

    result = await db.execute(stmt)
    users = result.scalars().all()

    total = (await db.execute(
        select(func.count(User.id))
    )).scalar() or 0

    return {
        "items": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "role": u.role,
                "total_score": u.total_score,
                "solved_count": u.solved_count,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "last_login": u.last_login.isoformat() if u.last_login else None,
            }
            for u in users
        ],
        "total": total,
    }


@router.put("/users/{target_user_id}/role")
async def update_user_role(
    target_user_id: int,
    role: str = Query(..., pattern="^(user|admin|challenge_author)$"),
    user_id: Annotated[int, Depends(get_current_user_id)] = None,
    db: Annotated[AsyncSession, Depends(get_db_session)] = None,
) -> dict:
    """유저 역할을 변경한다."""
    admin = await _require_author(db, user_id)
    if admin.role != UserRole.ADMIN:
        raise ForbiddenException("관리자만 역할을 변경할 수 있습니다.")

    result = await db.execute(select(User).where(User.id == target_user_id))
    target = result.scalar_one_or_none()
    if not target:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("유저를 찾을 수 없습니다.")

    target.role = role
    await db.commit()
    return {"id": target.id, "username": target.username, "role": target.role}


# === 파일 업로드 ===


@router.post("/challenges/{challenge_id}/files", status_code=201)
async def upload_challenge_files(
    challenge_id: int,
    files: list[UploadFile],
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """챌린지에 파일을 업로드한다 (최대 50MB/파일)."""
    await _require_author(db, user_id)
    await challenge_service.get_challenge_by_id(db, challenge_id)
    results = await file_service.upload_multiple_files(challenge_id, files)
    # DB의 files 필드도 업데이트
    existing = file_service.list_files(challenge_id)
    from app.schemas.challenge import ChallengeUpdate
    await challenge_service.update_challenge(
        db, challenge_id, ChallengeUpdate(files=existing)
    )
    return {"uploaded": len(results), "files": results}


@router.delete("/challenges/{challenge_id}/files/{filename}", status_code=204)
async def delete_challenge_file(
    challenge_id: int,
    filename: str,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """챌린지 파일을 삭제한다."""
    await _require_author(db, user_id)
    file_service.delete_file(challenge_id, filename)
    # DB files 필드 업데이트
    remaining = file_service.list_files(challenge_id)
    from app.schemas.challenge import ChallengeUpdate
    await challenge_service.update_challenge(
        db, challenge_id, ChallengeUpdate(files=remaining if remaining else None)
    )


# === 커뮤니티 챌린지 심사 ===


@router.get("/reviews/pending", response_model=list[CommunitySubmissionResponse])
async def list_pending_reviews(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[CommunitySubmissionResponse]:
    """심사 대기 중인 커뮤니티 챌린지를 조회한다."""
    await _require_author(db, user_id)
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
    await _require_author(db, user_id)
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
