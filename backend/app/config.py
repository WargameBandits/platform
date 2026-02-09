"""애플리케이션 환경 설정 모듈.

pydantic-settings 기반으로 .env 파일에서 설정값을 로드한다.
"""

import json
from functools import lru_cache

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

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # Docker Instance
    CONTAINER_PORT_RANGE_START: int = 30000
    CONTAINER_PORT_RANGE_END: int = 39999
    CONTAINER_TIMEOUT_SECONDS: int = 1800
    CONTAINER_MAX_PER_USER: int = 3
    CONTAINER_CPU_LIMIT: float = 0.5
    CONTAINER_MEM_LIMIT: str = "128m"

    # CORS
    CORS_ORIGINS: str = '["http://localhost:3000","http://localhost:80"]'

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS 허용 오리진 목록을 리스트로 반환한다."""
        return json.loads(self.CORS_ORIGINS)

    @property
    def is_production(self) -> bool:
        """프로덕션 환경 여부를 반환한다."""
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    """설정 싱글턴 인스턴스를 반환한다."""
    return Settings()
