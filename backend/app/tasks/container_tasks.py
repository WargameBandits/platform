"""컨테이너 관련 Celery 비동기 태스크."""

import logging

from app.tasks import run_async, task_decorator

logger = logging.getLogger(__name__)


@task_decorator("app.tasks.container_tasks.cleanup_expired_containers")
def cleanup_expired_containers() -> dict:
    """만료된 Docker 인스턴스를 정리하는 주기적 태스크.

    Celery는 동기 환경이므로 run_async로 비동기 함수를 실행한다.

    Returns:
        정리 결과 딕셔너리.
    """
    count = run_async(_cleanup())
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
