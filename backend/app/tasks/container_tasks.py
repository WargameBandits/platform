"""컨테이너 관련 Celery 비동기 태스크."""

import asyncio
import logging

from app.celery_app import celery_app

logger = logging.getLogger(__name__)


def _task_decorator(name: str):
    """celery_app이 None이면 no-op 데코레이터를 반환한다."""
    if celery_app is not None:
        return celery_app.task(name=name)
    return lambda f: f


@_task_decorator("app.tasks.container_tasks.cleanup_expired_containers")
def cleanup_expired_containers() -> dict:
    """만료된 Docker 인스턴스를 정리하는 주기적 태스크.

    Celery는 동기 환경이므로 asyncio.run으로 비동기 함수를 실행한다.

    Returns:
        정리 결과 딕셔너리.
    """
    count = asyncio.run(_cleanup())
    return {"cleaned": count}


async def _cleanup() -> int:
    """만료 인스턴스 정리 비동기 래퍼."""
    from app.database import async_session_factory
    from app.services import container_service

    async with async_session_factory() as db:
        try:
            count = await container_service.cleanup_expired(db)
            await db.commit()
            return count
        except Exception:
            await db.rollback()
            logger.exception("만료 인스턴스 정리 중 오류 발생")
            return 0
