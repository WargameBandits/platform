"""보안 관련 유틸리티 모듈.

비밀번호 해싱, JWT 토큰 생성/검증 기능을 제공한다.
"""

from datetime import UTC, datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from app.config import get_settings

settings = get_settings()

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """비밀번호를 bcrypt로 해싱한다.

    Args:
        password: 평문 비밀번호.

    Returns:
        해싱된 비밀번호 문자열.
    """
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """평문 비밀번호와 해시를 비교 검증한다.

    Args:
        plain_password: 평문 비밀번호.
        hashed_password: 해싱된 비밀번호.

    Returns:
        비밀번호 일치 여부.
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """JWT access 토큰을 생성한다.

    Args:
        data: 토큰에 포함할 데이터.
        expires_delta: 만료 시간. None이면 설정값 사용.

    Returns:
        인코딩된 JWT 문자열.
    """
    to_encode = data.copy()
    expire = datetime.now(UTC) + (
        expires_delta
        or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """JWT refresh 토큰을 생성한다.

    Args:
        data: 토큰에 포함할 데이터.

    Returns:
        인코딩된 JWT 문자열.
    """
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    """JWT 토큰을 디코딩한다.

    Args:
        token: JWT 토큰 문자열.

    Returns:
        디코딩된 페이로드 딕셔너리. 실패 시 None.
    """
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
