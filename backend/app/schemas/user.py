"""유저 관련 Pydantic 스키마."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """회원가입 요청 스키마."""

    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    """로그인 요청 스키마."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT 토큰 응답 스키마."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """토큰 갱신 요청 스키마."""

    refresh_token: str


class UserResponse(BaseModel):
    """유저 정보 응답 스키마."""

    id: int
    username: str
    email: str
    role: str
    solved_count: int
    total_score: int
    created_at: datetime
    last_login: datetime | None = None

    model_config = {"from_attributes": True}


class UserPublicResponse(BaseModel):
    """유저 공개 정보 응답 스키마 (다른 유저 프로필 조회용)."""

    id: int
    username: str
    role: str
    solved_count: int
    total_score: int
    created_at: datetime

    model_config = {"from_attributes": True}
