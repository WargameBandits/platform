"""Docker 컨테이너 인스턴스 관리 서비스.

Docker SDK를 사용하여 동적 문제 컨테이너의 생성, 조회, 삭제, 만료 정리를 담당한다.
"""

import logging
import random
from datetime import UTC, datetime, timedelta

import docker
from docker.errors import APIError, NotFound
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.models.challenge import Challenge
from app.models.container_instance import ContainerInstance

logger = logging.getLogger(__name__)
settings = get_settings()

# Docker 클라이언트 (동기 — Docker SDK는 async 미지원)
_docker_client: docker.DockerClient | None = None


def _get_docker_client() -> docker.DockerClient:
    """Docker 클라이언트 싱글턴을 반환한다.

    Returns:
        DockerClient 인스턴스.
    """
    global _docker_client
    if _docker_client is None:
        _docker_client = docker.from_env()
    return _docker_client


async def _get_used_ports(db: AsyncSession) -> set[int]:
    """현재 사용 중인 포트 목록을 조회한다.

    Args:
        db: DB 세션.

    Returns:
        사용 중인 포트 set.
    """
    result = await db.execute(
        select(ContainerInstance.port).where(
            ContainerInstance.status == "running"
        )
    )
    return set(result.scalars().all())


async def _allocate_port(db: AsyncSession) -> int:
    """사용 가능한 포트를 랜덤으로 할당한다.

    Args:
        db: DB 세션.

    Returns:
        할당된 포트 번호.

    Raises:
        BadRequestException: 사용 가능한 포트가 없을 때.
    """
    used = await _get_used_ports(db)
    available = set(
        range(settings.CONTAINER_PORT_RANGE_START, settings.CONTAINER_PORT_RANGE_END + 1)
    ) - used
    if not available:
        raise BadRequestException("사용 가능한 포트가 없습니다.")
    return random.choice(list(available))


async def _count_user_instances(db: AsyncSession, user_id: int) -> int:
    """유저의 현재 실행 중인 인스턴스 수를 조회한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.

    Returns:
        실행 중인 인스턴스 수.
    """
    from sqlalchemy import func

    result = await db.execute(
        select(func.count(ContainerInstance.id)).where(
            ContainerInstance.user_id == user_id,
            ContainerInstance.status == "running",
        )
    )
    return result.scalar() or 0


async def create_instance(
    db: AsyncSession, user_id: int, challenge_id: int
) -> ContainerInstance:
    """유저 전용 Docker 컨테이너를 생성한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.
        challenge_id: 챌린지 ID.

    Returns:
        생성된 ContainerInstance 객체.

    Raises:
        BadRequestException: 정적 문제이거나, 인스턴스 제한 초과일 때.
        ConflictException: 동일 문제에 이미 실행 중인 인스턴스가 있을 때.
    """
    # 챌린지 조회
    result = await db.execute(
        select(Challenge).where(Challenge.id == challenge_id)
    )
    challenge = result.scalar_one_or_none()
    if challenge is None:
        raise NotFoundException("챌린지를 찾을 수 없습니다.")
    if not challenge.is_dynamic:
        raise BadRequestException("동적 인스턴스가 필요 없는 문제입니다.")
    if not challenge.docker_image:
        raise BadRequestException("Docker 이미지가 설정되지 않은 문제입니다.")

    # 유저당 인스턴스 수 확인
    count = await _count_user_instances(db, user_id)
    if count >= settings.CONTAINER_MAX_PER_USER:
        raise BadRequestException(
            f"동시 실행 가능한 인스턴스 수({settings.CONTAINER_MAX_PER_USER}개)를 초과했습니다."
        )

    # 동일 문제 중복 인스턴스 확인
    existing = await db.execute(
        select(ContainerInstance).where(
            ContainerInstance.user_id == user_id,
            ContainerInstance.challenge_id == challenge_id,
            ContainerInstance.status == "running",
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ConflictException("이 문제에 이미 실행 중인 인스턴스가 있습니다.")

    # 포트 할당
    port = await _allocate_port(db)

    # Docker 컨테이너 생성
    client = _get_docker_client()
    expires_at = datetime.now(UTC) + timedelta(seconds=settings.CONTAINER_TIMEOUT_SECONDS)

    # 카테고리별 tmpfs 설정 (web은 DB 쓰기 허용)
    tmpfs_config = {"/tmp": "size=32m"} if challenge.category == "web" else {"/tmp": "size=16m,noexec"}

    try:
        container = client.containers.run(
            image=challenge.docker_image,
            detach=True,
            auto_remove=False,
            ports={f"{challenge.docker_port}/tcp": ("0.0.0.0", port)},
            mem_limit=settings.CONTAINER_MEM_LIMIT,
            nano_cpus=int(settings.CONTAINER_CPU_LIMIT * 1e9),
            network_mode="bridge",
            read_only=True,
            tmpfs=tmpfs_config,
            cap_drop=["ALL"],
            cap_add=["SETUID", "SETGID"],
            security_opt=["no-new-privileges:true"],
            labels={
                "wargame.user_id": str(user_id),
                "wargame.challenge_id": str(challenge_id),
                "wargame.managed": "true",
            },
            name=f"wg-{user_id}-{challenge_id}-{port}",
        )
    except APIError as e:
        logger.error("Docker 컨테이너 생성 실패: %s", e)
        raise BadRequestException("컨테이너 생성에 실패했습니다.") from e

    # DB 저장
    instance = ContainerInstance(
        user_id=user_id,
        challenge_id=challenge_id,
        container_id=container.id,
        port=port,
        status="running",
        expires_at=expires_at,
    )
    db.add(instance)
    await db.flush()
    await db.refresh(instance)

    logger.info(
        "인스턴스 생성: user=%d, challenge=%d, port=%d, container=%s",
        user_id, challenge_id, port, container.short_id,
    )
    return instance


async def stop_instance(
    db: AsyncSession, instance_id: int, user_id: int | None = None
) -> None:
    """Docker 컨테이너를 중지하고 제거한다.

    Args:
        db: DB 세션.
        instance_id: 인스턴스 ID.
        user_id: 요청한 유저 ID (None이면 권한 검사 생략 — 시스템 정리용).

    Raises:
        NotFoundException: 인스턴스가 없을 때.
        ForbiddenException: 다른 유저의 인스턴스일 때.
    """
    result = await db.execute(
        select(ContainerInstance).where(ContainerInstance.id == instance_id)
    )
    instance = result.scalar_one_or_none()
    if instance is None:
        raise NotFoundException("인스턴스를 찾을 수 없습니다.")

    if user_id is not None and instance.user_id != user_id:
        raise ForbiddenException("본인의 인스턴스만 중지할 수 있습니다.")

    # Docker 컨테이너 중지/제거
    client = _get_docker_client()
    try:
        container = client.containers.get(instance.container_id)
        container.stop(timeout=5)
        container.remove(force=True)
    except NotFound:
        logger.warning("컨테이너가 이미 없음: %s", instance.container_id)
    except APIError as e:
        logger.error("컨테이너 제거 실패: %s", e)

    instance.status = "stopped"
    await db.flush()

    logger.info("인스턴스 중지: id=%d, container=%s", instance_id, instance.container_id)


async def get_instance_status(
    db: AsyncSession, instance_id: int, user_id: int
) -> ContainerInstance:
    """인스턴스 상태를 조회한다.

    Args:
        db: DB 세션.
        instance_id: 인스턴스 ID.
        user_id: 요청한 유저 ID.

    Returns:
        ContainerInstance 객체.

    Raises:
        NotFoundException: 인스턴스가 없을 때.
        ForbiddenException: 다른 유저의 인스턴스일 때.
    """
    result = await db.execute(
        select(ContainerInstance).where(ContainerInstance.id == instance_id)
    )
    instance = result.scalar_one_or_none()
    if instance is None:
        raise NotFoundException("인스턴스를 찾을 수 없습니다.")
    if instance.user_id != user_id:
        raise ForbiddenException("본인의 인스턴스만 조회할 수 있습니다.")

    # Docker 실제 상태와 동기화
    if instance.status == "running":
        client = _get_docker_client()
        try:
            container = client.containers.get(instance.container_id)
            if container.status != "running":
                instance.status = "stopped"
                await db.flush()
        except NotFound:
            instance.status = "stopped"
            await db.flush()

    return instance


async def get_user_instances(
    db: AsyncSession, user_id: int
) -> list[ContainerInstance]:
    """유저의 모든 실행 중인 인스턴스를 조회한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.

    Returns:
        ContainerInstance 리스트.
    """
    result = await db.execute(
        select(ContainerInstance).where(
            ContainerInstance.user_id == user_id,
            ContainerInstance.status == "running",
        )
    )
    return list(result.scalars().all())


async def cleanup_expired(db: AsyncSession) -> int:
    """만료된 모든 인스턴스를 정리한다.

    Args:
        db: DB 세션.

    Returns:
        정리된 인스턴스 수.
    """
    now = datetime.now(UTC)
    result = await db.execute(
        select(ContainerInstance).where(
            ContainerInstance.status == "running",
            ContainerInstance.expires_at < now,
        )
    )
    expired = list(result.scalars().all())

    client = _get_docker_client()
    count = 0

    for instance in expired:
        try:
            container = client.containers.get(instance.container_id)
            container.stop(timeout=5)
            container.remove(force=True)
        except NotFound:
            pass
        except APIError as e:
            logger.error("만료 인스턴스 정리 실패: %s — %s", instance.container_id, e)
            continue

        instance.status = "expired"
        count += 1

    await db.flush()
    logger.info("만료 인스턴스 정리 완료: %d건", count)
    return count
