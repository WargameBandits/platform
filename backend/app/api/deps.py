"""API 의존성 모듈.

인증, DB 세션, Redis 등 공통 의존성을 정의한다.
"""

from collections.abc import AsyncGenerator

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_token
from app.database import get_db

security_scheme = HTTPBearer()
optional_security_scheme = HTTPBearer(auto_error=False)

_redis_client: Redis | None = None


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> int:
    """JWT 토큰에서 현재 유저 ID를 추출한다.

    Args:
        credentials: HTTP Bearer 토큰.

    Returns:
        유저 ID (int).

    Raises:
        UnauthorizedException: 토큰이 유효하지 않을 때.
    """
    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise UnauthorizedException("유효하지 않은 토큰입니다.")
    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("토큰에 유저 정보가 없습니다.")
    return int(user_id)


async def get_optional_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        optional_security_scheme
    ),
) -> int | None:
    """JWT 토큰에서 유저 ID를 추출한다 (비로그인 허용).

    Args:
        credentials: HTTP Bearer 토큰 (없을 수 있음).

    Returns:
        유저 ID 또는 None.
    """
    if credentials is None:
        return None
    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    return int(user_id)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """DB 세션 의존성 래퍼.

    Yields:
        AsyncSession: 데이터베이스 세션.
    """
    async for session in get_db():
        yield session


async def get_redis() -> AsyncGenerator[Redis, None]:
    """Redis 비동기 클라이언트를 제공하는 의존성 함수.

    싱글턴 패턴으로 연결을 재사용한다.
    REDIS_URL이 설정되지 않으면 None을 반환한다.

    Yields:
        Redis 비동기 클라이언트 또는 None.
    """
    global _redis_client
    settings = get_settings()
    if not settings.REDIS_URL:
        yield None  # type: ignore[arg-type]
        return
    if _redis_client is None:
        _redis_client = Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
        )
    yield _redis_client
