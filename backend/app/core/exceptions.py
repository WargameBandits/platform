"""커스텀 예외 모듈.

애플리케이션 전역에서 사용하는 커스텀 예외를 정의한다.
"""

from fastapi import HTTPException, status


class NotFoundException(HTTPException):
    """리소스를 찾을 수 없을 때 발생하는 예외."""

    def __init__(self, detail: str = "리소스를 찾을 수 없습니다.") -> None:
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class UnauthorizedException(HTTPException):
    """인증에 실패했을 때 발생하는 예외."""

    def __init__(self, detail: str = "인증에 실패했습니다.") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(HTTPException):
    """권한이 없을 때 발생하는 예외."""

    def __init__(self, detail: str = "접근 권한이 없습니다.") -> None:
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class BadRequestException(HTTPException):
    """잘못된 요청일 때 발생하는 예외."""

    def __init__(self, detail: str = "잘못된 요청입니다.") -> None:
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class ConflictException(HTTPException):
    """리소스 충돌 시 발생하는 예외."""

    def __init__(self, detail: str = "이미 존재하는 리소스입니다.") -> None:
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class RateLimitException(HTTPException):
    """요청 횟수 초과 시 발생하는 예외."""

    def __init__(self, detail: str = "요청 횟수를 초과했습니다.") -> None:
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail
        )
