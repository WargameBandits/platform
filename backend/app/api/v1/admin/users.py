"""관리자 유저 관리 라우터."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session
from app.core.exceptions import ForbiddenException, NotFoundException
from app.core.permissions import UserRole
from app.models.user import User

router = APIRouter()


@router.get("/users")
async def list_users(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
    search: str | None = Query(None, max_length=100),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> dict:
    """유저 목록을 조회한다."""
    from . import require_author

    await require_author(db, user_id)

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
    from . import require_author

    admin = await require_author(db, user_id)
    if admin.role != UserRole.ADMIN:
        raise ForbiddenException("관리자만 역할을 변경할 수 있습니다.")

    result = await db.execute(select(User).where(User.id == target_user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise NotFoundException("유저를 찾을 수 없습니다.")

    target.role = role
    await db.commit()
    return {"id": target.id, "username": target.username, "role": target.role}
