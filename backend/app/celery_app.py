"""Celery 앱 설정 모듈.

Redis를 브로커로 사용하며, 주기적 태스크(beat)를 정의한다.
REDIS_URL이 없으면 Celery를 비활성화한다 (Render 배포 등).
"""

from app.config import get_settings

settings = get_settings()

celery_app = None

if settings.REDIS_URL and settings.CELERY_ENABLED:
    from celery import Celery

    celery_app = Celery(
        "wargame_bandits",
        broker=settings.REDIS_URL,
        backend=settings.REDIS_URL,
    )

    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        beat_schedule={
            "cleanup-expired-containers": {
                "task": "app.tasks.container_tasks.cleanup_expired_containers",
                "schedule": 300.0,  # 5분마다
            },
            "recalculate-dynamic-scores": {
                "task": "app.tasks.scoring_tasks.recalculate_dynamic_scores",
                "schedule": 600.0,  # 10분마다
            },
            "recalculate-all-user-scores": {
                "task": "app.tasks.scoring_tasks.recalculate_all_user_scores",
                "schedule": 3600.0,  # 1시간마다
            },
        },
    )

    celery_app.autodiscover_tasks(["app.tasks"])
