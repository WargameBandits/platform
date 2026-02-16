"""관리자 챌린지 파일 업로드/삭제 라우터."""

from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session
from app.schemas.challenge import ChallengeUpdate
from app.services import challenge_service, file_service

router = APIRouter()


@router.post("/challenges/{challenge_id}/files", status_code=201)
async def upload_challenge_files(
    challenge_id: int,
    files: list[UploadFile],
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """챌린지에 파일을 업로드한다 (최대 50MB/파일)."""
    from . import require_author

    await require_author(db, user_id)
    await challenge_service.get_challenge_by_id(db, challenge_id)
    results = await file_service.upload_multiple_files(challenge_id, files)
    # DB의 files 필드도 업데이트
    existing = await file_service.list_files(challenge_id)
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
    from . import require_author

    await require_author(db, user_id)
    await file_service.delete_file(challenge_id, filename)
    # DB files 필드 업데이트
    remaining = await file_service.list_files(challenge_id)
    await challenge_service.update_challenge(
        db, challenge_id, ChallengeUpdate(files=remaining if remaining else None)
    )
