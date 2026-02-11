"""데이터베이스 연결 및 세션 관리 모듈.

async SQLAlchemy 엔진과 세션 팩토리를 제공한다.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.async_database_url,
    echo=not settings.is_production,
    pool_pre_ping=True,
    pool_size=5 if settings.is_production else 10,
    max_overflow=10 if settings.is_production else 20,
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
