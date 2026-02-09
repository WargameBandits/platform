"""RBAC 권한 관리 모듈.

역할 기반 접근 제어를 위한 유틸리티를 제공한다.
"""

from enum import StrEnum


class UserRole(StrEnum):
    """사용자 역할 열거형."""

    USER = "user"
    ADMIN = "admin"
    CHALLENGE_AUTHOR = "challenge_author"


ADMIN_ROLES = {UserRole.ADMIN}
AUTHOR_ROLES = {UserRole.ADMIN, UserRole.CHALLENGE_AUTHOR}
