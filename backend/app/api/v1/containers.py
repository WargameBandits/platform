"""컨테이너 인스턴스 API 라우터.

동적 문제 Docker 컨테이너의 생성, 조회, 삭제를 제공한다.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_id, get_db_session
from app.schemas.container import ContainerCreate, ContainerResponse
from app.services import container_service

router = APIRouter(prefix="/containers", tags=["containers"])


@router.post("", response_model=ContainerResponse, status_code=201)
async def create_instance(
    data: ContainerCreate,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ContainerResponse:
    """동적 문제의 Docker 인스턴스를 생성한다.

    Pwn: `nc wargamebandit.is-a.dev {port}` 형식으로 반환.
    Web: `http://wargamebandit.is-a.dev:{port}` 형식으로 반환.
    """
    instance = await container_service.create_instance(
        db, user_id, data.challenge_id
    )
    category = instance.challenge.category if instance.challenge else "pwn"
    return ContainerResponse.from_instance(instance, category=category)


@router.get("", response_model=list[ContainerResponse])
async def list_my_instances(
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ContainerResponse]:
    """내 실행 중인 인스턴스 목록을 조회한다."""
    instances = await container_service.get_user_instances(db, user_id)
    return [
        ContainerResponse.from_instance(
            i, category=i.challenge.category if i.challenge else "pwn"
        )
        for i in instances
    ]


@router.get("/{instance_id}", response_model=ContainerResponse)
async def get_instance(
    instance_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> ContainerResponse:
    """인스턴스 상태를 조회한다."""
    instance = await container_service.get_instance_status(
        db, instance_id, user_id
    )
    category = instance.challenge.category if instance.challenge else "pwn"
    return ContainerResponse.from_instance(instance, category=category)


@router.delete("/{instance_id}", status_code=204)
async def stop_instance(
    instance_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> None:
    """인스턴스를 중지하고 제거한다."""
    await container_service.stop_instance(db, instance_id, user_id)
