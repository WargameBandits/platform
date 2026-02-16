"""애플리케이션 환경 설정 모듈.

pydantic-settings 기반으로 .env 파일에서 설정값을 로드한다.
"""

import json
from functools import lru_cache
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """애플리케이션 전역 설정."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Domain
    DOMAIN: str = "localhost"
    ENVIRONMENT: str = "development"

    # Backend
    SECRET_KEY: str = "change-me-to-random-string"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    POSTGRES_USER: str = "wargame"
    POSTGRES_PASSWORD: str = "change-me"
    POSTGRES_DB: str = "wargame"
    DATABASE_URL: str = "postgresql+asyncpg://wargame:change-me@db:5432/wargame"

    # Redis (None이면 Celery 비활성화 — Render 배포 시)
    REDIS_URL: str | None = None

    # Feature Flags (Oracle Cloud에서 True로 설정)
    CELERY_ENABLED: bool = False
    DOCKER_ENABLED: bool = False

    # Docker Instance
    CONTAINER_PORT_RANGE_START: int = 30000
    CONTAINER_PORT_RANGE_END: int = 39999
    CONTAINER_TIMEOUT_SECONDS: int = 1800
    CONTAINER_MAX_PER_USER: int = 3
    CONTAINER_CPU_LIMIT: float = 0.5
    CONTAINER_MEM_LIMIT: str = "128m"

    # CORS
    CORS_ORIGINS: str = '["http://localhost:3000","http://localhost:80"]'

    @field_validator("CONTAINER_PORT_RANGE_END")
    @classmethod
    def validate_port_range(cls, v: int, info) -> int:
        """포트 범위가 유효한지 검증한다."""
        start = info.data.get("CONTAINER_PORT_RANGE_START", 30000)
        if start >= v:
            raise ValueError("CONTAINER_PORT_RANGE_END는 START보다 커야 합니다.")
        if not (1024 <= start <= 65535) or not (1024 <= v <= 65535):
            raise ValueError("포트 범위는 1024~65535 이내여야 합니다.")
        return v

    @field_validator("JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    @classmethod
    def validate_jwt_access(cls, v: int) -> int:
        """JWT access 토큰 만료 시간이 양수인지 검증한다."""
        if v <= 0:
            raise ValueError("JWT_ACCESS_TOKEN_EXPIRE_MINUTES는 양수여야 합니다.")
        return v

    @field_validator("JWT_REFRESH_TOKEN_EXPIRE_DAYS")
    @classmethod
    def validate_jwt_refresh(cls, v: int) -> int:
        """JWT refresh 토큰 만료 시간이 양수인지 검증한다."""
        if v <= 0:
            raise ValueError("JWT_REFRESH_TOKEN_EXPIRE_DAYS는 양수여야 합니다.")
        return v

    @field_validator("CONTAINER_CPU_LIMIT")
    @classmethod
    def validate_cpu_limit(cls, v: float) -> float:
        """CPU 제한이 유효한 범위인지 검증한다."""
        if not (0 < v <= 4):
            raise ValueError("CONTAINER_CPU_LIMIT는 0 초과 4 이하여야 합니다.")
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS 허용 오리진 목록을 리스트로 반환한다."""
        return json.loads(self.CORS_ORIGINS)

    @property
    def async_database_url(self) -> str:
        """asyncpg용 DATABASE_URL을 반환한다.

        Neon/Render는 postgres:// 형식을 제공하지만 asyncpg는
        postgresql+asyncpg:// 형식이 필요하다.
        asyncpg가 지원하지 않는 쿼리 파라미터(sslmode, channel_binding 등)도 제거한다.
        """
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

        # asyncpg 미지원 파라미터 제거 (SSL은 connect_args로 처리)
        _unsupported = {"sslmode", "channel_binding"}
        parsed = urlparse(url)
        if parsed.query:
            params = parse_qs(parsed.query)
            filtered = {k: v for k, v in params.items() if k not in _unsupported}
            url = urlunparse(parsed._replace(query=urlencode(filtered, doseq=True)))
        return url

    @property
    def is_production(self) -> bool:
        """프로덕션 환경 여부를 반환한다."""
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    """설정 싱글턴 인스턴스를 반환한다."""
    return Settings()
