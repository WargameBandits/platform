"""관리자 챌린지 CRUD 및 YAML import 라우터."""

from typing import Annotated

import yaml
from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session
from app.schemas.challenge import (
    ChallengeAdminResponse,
    ChallengeCreate,
    ChallengeUpdate,
)
from app.services import challenge_service, file_service

router = APIRouter()


@router.post("/challenges", response_model=ChallengeAdminResponse, status_code=201)
async def create_challenge(
    data: ChallengeCreate,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ChallengeAdminResponse:
    """새 챌린지를 생성한다."""
    from . import require_author

    await require_author(db, user_id)
    challenge = await challenge_service.create_challenge(db, data, user_id)
    return ChallengeAdminResponse.model_validate(challenge)


@router.get("/challenges/{challenge_id}", response_model=ChallengeAdminResponse)
async def get_challenge_admin(
    challenge_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ChallengeAdminResponse:
    """챌린지 상세 정보를 관리자 뷰로 조회한다."""
    from . import require_author

    await require_author(db, user_id)
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
    from . import require_author

    await require_author(db, user_id)
    challenge = await challenge_service.update_challenge(db, challenge_id, data)
    return ChallengeAdminResponse.model_validate(challenge)


@router.delete("/challenges/{challenge_id}", status_code=204)
async def delete_challenge(
    challenge_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """챌린지를 삭제한다."""
    from . import require_author

    await require_author(db, user_id)
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
    from . import require_author

    await require_author(db, user_id)

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

        source_dir = item.get("source_dir")
        docker_image = item.get("docker", {}).get("image") if item.get("docker") else None
        if not source_dir and isinstance(docker_image, str) and docker_image.startswith("challenges/"):
            source_dir = docker_image.removeprefix("challenges/")

        if source_dir and data.files:
            copied_files = await file_service.stage_release_files(
                challenge.id,
                source_dir,
                data.files,
            )
            if copied_files != (data.files or []):
                await challenge_service.update_challenge(
                    db,
                    challenge.id,
                    ChallengeUpdate(files=copied_files if copied_files else None),
                )

        created.append(challenge.id)

    return {"imported": len(created), "challenge_ids": created}
