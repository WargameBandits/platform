"""데이터베이스 연결 및 세션 관리 모듈.

async SQLAlchemy 엔진과 세션 팩토리를 제공한다.
"""

import ssl as _ssl
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# Neon PostgreSQL 등 외부 관리형 DB는 SSL 필수
_connect_args: dict = {}
_is_managed_db = "neon.tech" in settings.async_database_url or settings.is_production
if _is_managed_db:
    _connect_args["ssl"] = _ssl.create_default_context()

# Neon Pooler(PgBouncer) 사용 시 prepared statement 비활성화
_connect_args.setdefault("statement_cache_size", 0) if "pooler" in settings.async_database_url else None

engine = create_async_engine(
    settings.async_database_url,
    echo=not settings.is_production,
    pool_pre_ping=True,
    pool_size=3 if _is_managed_db else 10,
    max_overflow=5 if _is_managed_db else 20,
    connect_args=_connect_args,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """모든 SQLAlchemy 모델의 기본 클래스."""

    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """비동기 DB 세션을 제공하는 의존성 함수.

    Yields:
        AsyncSession: 데이터베이스 세션.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
