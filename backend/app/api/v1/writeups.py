"""Write-up API 라우터.

Write-up CRUD 및 추천 엔드포인트를 제공한다.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session
from app.schemas.writeup import (
    WriteupCreate,
    WriteupListResponse,
    WriteupResponse,
    WriteupUpdate,
)
from app.services import writeup_service

router = APIRouter(prefix="/writeups", tags=["writeups"])


def _to_response(writeup) -> WriteupResponse:
    """Writeup 모델을 응답 스키마로 변환한다."""
    return WriteupResponse(
        id=writeup.id,
        user_id=writeup.user_id,
        username=writeup.user.username if writeup.user else "Unknown",
        challenge_id=writeup.challenge_id,
        challenge_title=writeup.challenge.title if writeup.challenge else "Unknown",
        content=writeup.content,
        is_public=writeup.is_public,
        upvotes=writeup.upvotes,
        created_at=writeup.created_at,
        updated_at=writeup.updated_at,
    )


@router.post("", response_model=WriteupResponse, status_code=201)
async def create_writeup(
    data: WriteupCreate,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WriteupResponse:
    """Write-up을 생성한다 (풀이한 문제만)."""
    writeup = await writeup_service.create_writeup(
        db,
        user_id=user_id,
        challenge_id=data.challenge_id,
        content=data.content,
        is_public=data.is_public,
    )
    await db.commit()
    await db.refresh(writeup)
    return _to_response(writeup)


@router.get("", response_model=WriteupListResponse)
async def list_writeups(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    challenge_id: int | None = Query(default=None),
    sort: str = Query(default="newest", pattern="^(newest|oldest|most_upvoted)$"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> WriteupListResponse:
    """Write-up 목록을 조회한다."""
    writeups, total = await writeup_service.list_writeups(
        db, challenge_id=challenge_id, sort=sort, limit=limit, offset=offset
    )
    return WriteupListResponse(
        items=[_to_response(w) for w in writeups],
        total=total,
    )


@router.get("/{writeup_id}", response_model=WriteupResponse)
async def get_writeup(
    writeup_id: int,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WriteupResponse:
    """Write-up을 조회한다."""
    writeup = await writeup_service.get_writeup(db, writeup_id)
    return _to_response(writeup)


@router.put("/{writeup_id}", response_model=WriteupResponse)
async def update_writeup(
    writeup_id: int,
    data: WriteupUpdate,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WriteupResponse:
    """Write-up을 수정한다."""
    writeup = await writeup_service.update_writeup(
        db,
        writeup_id=writeup_id,
        user_id=user_id,
        content=data.content,
        is_public=data.is_public,
    )
    await db.commit()
    await db.refresh(writeup)
    return _to_response(writeup)


@router.delete("/{writeup_id}", status_code=204)
async def delete_writeup(
    writeup_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """Write-up을 삭제한다."""
    await writeup_service.delete_writeup(db, writeup_id, user_id)
    await db.commit()


@router.post("/{writeup_id}/upvote", response_model=WriteupResponse)
async def upvote_writeup(
    writeup_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> WriteupResponse:
    """Write-up을 추천한다."""
    writeup = await writeup_service.upvote_writeup(db, writeup_id)
    await db.commit()
    await db.refresh(writeup)
    return _to_response(writeup)
