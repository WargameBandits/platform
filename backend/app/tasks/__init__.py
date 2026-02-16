"""Celery 태스크 공통 유틸리티.

태스크 데코레이터 등 공유 함수를 제공한다.
"""

import asyncio
from typing import Any, Callable, Coroutine

from app.celery_app import celery_app

_loop: asyncio.AbstractEventLoop | None = None


def run_async(coro: Coroutine) -> Any:
    """Celery 워커 내에서 비동기 코루틴을 실행한다.

    워커당 하나의 이벤트 루프를 재사용하여 asyncio.run()이
    매번 새 루프를 생성하는 오버헤드를 제거한다.

    Args:
        coro: 실행할 코루틴 객체.

    Returns:
        코루틴의 반환값.
    """
    global _loop
    if _loop is None or _loop.is_closed():
        _loop = asyncio.new_event_loop()
    return _loop.run_until_complete(coro)


def task_decorator(name: str) -> Callable:
    """celery_app이 None이면 no-op 데코레이터를 반환한다.

    재시도 로직(exponential backoff, 최대 3회)을 포함한다.

    Args:
        name: Celery 태스크 이름.

    Returns:
        Celery task 데코레이터 또는 no-op 데코레이터.
    """
    if celery_app is not None:
        return celery_app.task(
            name=name,
            autoretry_for=(Exception,),
            retry_backoff=True,
            max_retries=3,
        )
    return lambda f: f
