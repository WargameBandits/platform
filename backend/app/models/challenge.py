"""챌린지 모델 모듈."""

from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Challenge(Base):
    """챌린지 테이블 모델."""

    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )  # pwn | reversing | crypto | web | forensics | misc
    difficulty: Mapped[int] = mapped_column(
        Integer, nullable=False, index=True
    )  # 1-5
    points: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    max_points: Mapped[int] = mapped_column(Integer, nullable=False, default=500)
    min_points: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    decay: Mapped[float] = mapped_column(Float, nullable=False, default=10.0)

    flag_hash: Mapped[str] = mapped_column(
        String(128), nullable=False
    )  # SHA-256 해시
    flag_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="static"
    )  # static | regex | dynamic

    is_dynamic: Mapped[bool] = mapped_column(Boolean, default=False)
    docker_image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    docker_port: Mapped[int] = mapped_column(Integer, default=9001)  # 컨테이너 내부 포트

    files: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    hints: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    tags: Mapped[list | None] = mapped_column(ARRAY(String), nullable=True)

    author_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    solve_count: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    # 커뮤니티 출제 시스템 필드
    source: Mapped[str] = mapped_column(
        String(20), nullable=False, default="official"
    )  # official | community
    review_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="approved"
    )  # draft | pending | approved | rejected
    reviewer_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    review_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    submissions: Mapped[list["Submission"]] = relationship(
        "Submission", back_populates="challenge", lazy="selectin"
    )
