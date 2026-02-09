"""인증 API 라우터.

회원가입, 로그인, 토큰 갱신 엔드포인트를 제공한다.
"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.user import (
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserResponse:
    """새 유저를 등록한다."""
    user = await auth_service.register(
        db,
        username=data.username,
        email=data.email,
        password=data.password,
    )
    await db.commit()
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> TokenResponse:
    """로그인 후 JWT 토큰을 발급한다."""
    user, access_token, refresh_token = await auth_service.login(
        db,
        email=data.email,
        password=data.password,
    )
    await db.commit()
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    data: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db_session)],
) -> TokenResponse:
    """리프레시 토큰으로 새 토큰 쌍을 발급한다."""
    access_token, refresh_token = await auth_service.refresh_token(
        db,
        token=data.refresh_token,
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )
