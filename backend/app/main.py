"""FastAPI 애플리케이션 엔트리포인트.

CORS, 라우터, 이벤트 핸들러 등 앱 전역 설정을 관리한다.
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.community import router as community_router
from app.api.v1.challenges import router as challenges_router
from app.api.v1.containers import router as containers_router
from app.api.v1.scoreboards import router as scoreboards_router
from app.api.v1.users import router as users_router
from app.api.v1.websocket_terminal import router as ws_router
from app.api.v1.writeups import router as writeups_router
from app.api.v1.notifications import router as notifications_router
from app.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """앱 시작/종료 시 실행되는 라이프사이클 핸들러.

    Args:
        app: FastAPI 앱 인스턴스.
    """
    # 시작 시
    yield
    # 종료 시


app = FastAPI(
    title="워게임 유괴단 API",
    description="상시 운영형 CTF 워게임 플랫폼 API",
    version="0.1.0",
    docs_url="/api/v1/docs" if not settings.is_production else None,
    redoc_url="/api/v1/redoc" if not settings.is_production else None,
    openapi_url="/api/v1/openapi.json" if not settings.is_production else None,
    lifespan=lifespan,
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(challenges_router, prefix="/api/v1")
app.include_router(containers_router, prefix="/api/v1")
app.include_router(scoreboards_router, prefix="/api/v1")
app.include_router(community_router, prefix="/api/v1")
app.include_router(writeups_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")

# WebSocket 라우터 (prefix 없이 — /ws/terminal/{instance_id})
app.include_router(ws_router)


@app.get("/api/v1/health")
async def health_check() -> dict[str, str]:
    """헬스 체크 엔드포인트.

    Returns:
        서비스 상태 정보.
    """
    return {"status": "ok", "service": "wargame-bandits"}
