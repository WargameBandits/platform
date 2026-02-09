"""챌린지 Pydantic 스키마 모듈."""

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class CategoryEnum(StrEnum):
    """챌린지 카테고리."""

    PWN = "pwn"
    REVERSING = "reversing"
    CRYPTO = "crypto"
    WEB = "web"
    FORENSICS = "forensics"
    MISC = "misc"


class FlagTypeEnum(StrEnum):
    """플래그 타입."""

    STATIC = "static"
    REGEX = "regex"
    DYNAMIC = "dynamic"


class HintSchema(BaseModel):
    """힌트 스키마."""

    cost: int
    content: str


# === 관리자용 스키마 ===


class ChallengeCreate(BaseModel):
    """챌린지 생성 요청 스키마."""

    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    category: CategoryEnum
    difficulty: int = Field(..., ge=1, le=5)
    points: int = Field(default=100, ge=0)
    max_points: int = Field(default=500, ge=0)
    min_points: int = Field(default=50, ge=0)
    decay: float = Field(default=10.0, ge=0)
    flag: str = Field(..., min_length=1)
    flag_type: FlagTypeEnum = FlagTypeEnum.STATIC
    is_dynamic: bool = False
    docker_image: str | None = None
    files: list[str] | None = None
    hints: list[HintSchema] | None = None
    tags: list[str] | None = None
    is_active: bool = True


class ChallengeUpdate(BaseModel):
    """챌린지 수정 요청 스키마."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1)
    category: CategoryEnum | None = None
    difficulty: int | None = Field(default=None, ge=1, le=5)
    points: int | None = Field(default=None, ge=0)
    max_points: int | None = Field(default=None, ge=0)
    min_points: int | None = Field(default=None, ge=0)
    decay: float | None = Field(default=None, ge=0)
    flag: str | None = Field(default=None, min_length=1)
    flag_type: FlagTypeEnum | None = None
    is_dynamic: bool | None = None
    docker_image: str | None = None
    files: list[str] | None = None
    hints: list[HintSchema] | None = None
    tags: list[str] | None = None
    is_active: bool | None = None


# === 응답 스키마 ===


class ChallengeResponse(BaseModel):
    """챌린지 응답 스키마 (일반 유저용)."""

    id: int
    title: str
    description: str
    category: str
    difficulty: int
    points: int
    is_dynamic: bool
    files: list[str] | None = None
    hints: list[HintSchema] | None = None
    tags: list[str] | None = None
    solve_count: int
    is_active: bool
    author_id: int | None = None
    created_at: datetime
    is_solved: bool = False

    model_config = {"from_attributes": True}


class ChallengeAdminResponse(ChallengeResponse):
    """챌린지 응답 스키마 (관리자용, 추가 필드 포함)."""

    flag_hash: str
    flag_type: str
    docker_image: str | None = None
    max_points: int
    min_points: int
    decay: float
    updated_at: datetime


class ChallengeListResponse(BaseModel):
    """챌린지 목록 응답 스키마 (커서 기반 페이지네이션)."""

    items: list[ChallengeResponse]
    next_cursor: int | None = None
    total: int


# === 커뮤니티 출제 스키마 ===


class CommunitySubmitCreate(BaseModel):
    """커뮤니티 챌린지 제출 요청 스키마."""

    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    category: CategoryEnum
    difficulty: int = Field(..., ge=1, le=5)
    flag: str = Field(..., min_length=1)
    flag_type: FlagTypeEnum = FlagTypeEnum.STATIC
    is_dynamic: bool = False
    docker_image: str | None = None
    files: list[str] | None = None
    hints: list[HintSchema] | None = None
    tags: list[str] | None = None


class CommunitySubmitUpdate(BaseModel):
    """커뮤니티 챌린지 수정 요청 스키마."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1)
    category: CategoryEnum | None = None
    difficulty: int | None = Field(default=None, ge=1, le=5)
    flag: str | None = Field(default=None, min_length=1)
    flag_type: FlagTypeEnum | None = None
    is_dynamic: bool | None = None
    docker_image: str | None = None
    files: list[str] | None = None
    hints: list[HintSchema] | None = None
    tags: list[str] | None = None


class ReviewAction(BaseModel):
    """심사 액션 스키마."""

    action: str = Field(..., pattern="^(approve|reject)$")
    comment: str | None = None


class CommunitySubmissionResponse(ChallengeResponse):
    """커뮤니티 챌린지 제출 응답 (심사 상태 포함)."""

    source: str
    review_status: str
    review_comment: str | None = None
    reviewed_at: datetime | None = None
