"""WebSocket 웹 터미널 핸들러.

인증된 유저가 자기 Docker 인스턴스에 xterm.js를 통해 접속할 수 있게 한다.
Docker exec을 통해 컨테이너 내부 셸에 연결하며,
WebSocket을 통해 stdin/stdout을 양방향으로 중계한다.
"""

import asyncio
import logging

from docker.errors import APIError, NotFound
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.docker import get_docker_client
from app.core.security import decode_token
from app.database import async_session_factory
from app.models.container_instance import ContainerInstance

logger = logging.getLogger(__name__)

router = APIRouter()


async def _authenticate(token: str) -> int | None:
    """WebSocket 토큰에서 유저 ID를 추출한다.

    Args:
        token: JWT access 토큰.

    Returns:
        유저 ID 또는 인증 실패 시 None.
    """
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    return int(user_id) if user_id else None


async def _verify_instance_ownership(
    instance_id: int, user_id: int
) -> ContainerInstance | None:
    """인스턴스 소유권을 확인한다.

    Args:
        instance_id: 인스턴스 ID.
        user_id: 유저 ID.

    Returns:
        ContainerInstance 또는 권한 없으면 None.
    """
    async with async_session_factory() as db:
        result = await db.execute(
            select(ContainerInstance).where(
                ContainerInstance.id == instance_id,
                ContainerInstance.user_id == user_id,
                ContainerInstance.status == "running",
            )
        )
        return result.scalar_one_or_none()


@router.websocket("/ws/terminal/{instance_id}")
async def websocket_terminal(
    websocket: WebSocket,
    instance_id: int,
    token: str = Query(...),
) -> None:
    """WebSocket을 통해 Docker 컨테이너 터미널에 연결한다.

    클라이언트는 `wss://domain/ws/terminal/{instance_id}?token=<jwt>` 로 접속한다.
    """
    # 인증
    user_id = await _authenticate(token)
    if user_id is None:
        await websocket.close(code=4001, reason="인증 실패")
        return

    # 인스턴스 소유권 확인
    instance = await _verify_instance_ownership(instance_id, user_id)
    if instance is None:
        await websocket.close(code=4003, reason="인스턴스 접근 권한 없음")
        return

    await websocket.accept()

    # Docker exec 세션 생성
    client = get_docker_client()
    try:
        container = client.containers.get(instance.container_id)
    except (NotFound, APIError):
        await websocket.send_text("\r\n[ERROR] 컨테이너를 찾을 수 없습니다.\r\n")
        await websocket.close(code=4004)
        return

    try:
        exec_id = client.api.exec_create(
            container.id,
            cmd="/bin/sh",
            stdin=True,
            stdout=True,
            stderr=True,
            tty=True,
        )
        sock = client.api.exec_start(
            exec_id["Id"], socket=True, tty=True
        )
        # docker SDK의 socket wrapper에서 실제 소켓을 추출
        raw_sock = sock._sock  # noqa: SLF001
    except (APIError, AttributeError) as e:
        logger.error("Docker exec 실패: %s", e)
        await websocket.send_text("\r\n[ERROR] 터미널 연결 실패\r\n")
        await websocket.close(code=4005)
        return

    # 양방향 데이터 중계
    async def _read_from_container() -> None:
        """컨테이너 stdout → WebSocket 으로 전송."""
        loop = asyncio.get_event_loop()
        try:
            while True:
                data = await loop.run_in_executor(None, raw_sock.recv, 4096)
                if not data:
                    break
                await websocket.send_bytes(data)
        except (WebSocketDisconnect, OSError):
            pass

    async def _write_to_container() -> None:
        """WebSocket → 컨테이너 stdin 으로 전송."""
        try:
            while True:
                data = await websocket.receive_bytes()
                raw_sock.sendall(data)
        except (WebSocketDisconnect, OSError):
            pass

    try:
        done, pending = await asyncio.wait(
            [
                asyncio.create_task(_read_from_container()),
                asyncio.create_task(_write_to_container()),
            ],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
    finally:
        try:
            raw_sock.close()
        except OSError:
            pass
        try:
            await websocket.close()
        except Exception:
            pass
        logger.info("터미널 세션 종료: user=%d, instance=%d", user_id, instance_id)
