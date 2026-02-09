"""컨테이너 인스턴스 Pydantic 스키마 모듈."""

from datetime import datetime

from pydantic import BaseModel

from app.config import get_settings

settings = get_settings()


class ContainerCreate(BaseModel):
    """인스턴스 생성 요청 스키마."""

    challenge_id: int


class ContainerResponse(BaseModel):
    """인스턴스 응답 스키마."""

    id: int
    user_id: int
    challenge_id: int
    port: int
    status: str
    connection_info: str
    created_at: datetime
    expires_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_instance(
        cls,
        instance: "ContainerInstance",
        category: str = "pwn",
    ) -> "ContainerResponse":
        """ContainerInstance 모델에서 응답 스키마를 생성한다.

        Args:
            instance: DB 인스턴스 객체.
            category: 챌린지 카테고리 (web이면 HTTP URL, 그 외 nc).

        Returns:
            ContainerResponse 객체.
        """
        if category == "web":
            conn_info = f"http://{settings.DOMAIN}:{instance.port}"
        else:
            conn_info = f"nc {settings.DOMAIN} {instance.port}"

        return cls(
            id=instance.id,
            user_id=instance.user_id,
            challenge_id=instance.challenge_id,
            port=instance.port,
            status=instance.status,
            connection_info=conn_info,
            created_at=instance.created_at,
            expires_at=instance.expires_at,
        )
