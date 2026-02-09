"""인증 서비스 모듈.

회원가입, 로그인, 토큰 갱신 비즈니스 로직을 처리한다.
"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    UnauthorizedException,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User


async def register(
    db: AsyncSession,
    username: str,
    email: str,
    password: str,
) -> User:
    """새 유저를 등록한다.

    Args:
        db: DB 세션.
        username: 유저네임.
        email: 이메일.
        password: 평문 비밀번호.

    Returns:
        생성된 User 객체.

    Raises:
        ConflictException: 이미 존재하는 유저네임 또는 이메일.
    """
    result = await db.execute(
        select(User).where((User.username == username) | (User.email == email))
    )
    existing = result.scalar_one_or_none()
    if existing:
        if existing.username == username:
            raise ConflictException("이미 사용 중인 유저네임입니다.")
        raise ConflictException("이미 사용 중인 이메일입니다.")

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
    )
    db.add(user)
    await db.flush()
    return user


async def login(
    db: AsyncSession,
    email: str,
    password: str,
) -> tuple[User, str, str]:
    """로그인 인증을 수행한다.

    Args:
        db: DB 세션.
        email: 이메일.
        password: 평문 비밀번호.

    Returns:
        (User, access_token, refresh_token) 튜플.

    Raises:
        UnauthorizedException: 잘못된 인증 정보.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise UnauthorizedException("이메일 또는 비밀번호가 잘못되었습니다.")

    user.last_login = datetime.now(UTC)
    await db.flush()

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return user, access_token, refresh_token


async def refresh_token(
    db: AsyncSession,
    token: str,
) -> tuple[str, str]:
    """리프레시 토큰으로 새 토큰 쌍을 발급한다.

    Args:
        db: DB 세션.
        token: 리프레시 토큰.

    Returns:
        (new_access_token, new_refresh_token) 튜플.

    Raises:
        UnauthorizedException: 유효하지 않은 리프레시 토큰.
    """
    payload = decode_token(token)
    if payload is None or payload.get("type") != "refresh":
        raise UnauthorizedException("유효하지 않은 리프레시 토큰입니다.")

    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedException("토큰에 유저 정보가 없습니다.")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedException("존재하지 않는 유저입니다.")

    new_access = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})

    return new_access, new_refresh


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """유저 ID로 유저를 조회한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.

    Returns:
        User 객체 또는 None.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
