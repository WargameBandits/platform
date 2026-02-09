"""알림 서비스 모듈.

알림 생성, 조회, 읽음 처리를 담당한다.
"""

import logging

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification

logger = logging.getLogger(__name__)


async def create_notification(
    db: AsyncSession,
    user_id: int,
    type: str,
    title: str,
    message: str,
    challenge_id: int | None = None,
) -> Notification:
    """알림을 생성한다.

    Args:
        db: DB 세션.
        user_id: 대상 유저 ID.
        type: 알림 타입.
        title: 제목.
        message: 내용.
        challenge_id: 관련 챌린지 ID (선택).

    Returns:
        생성된 Notification 객체.
    """
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        challenge_id=challenge_id,
    )
    db.add(notif)
    await db.flush()
    return notif


async def notify_first_blood(
    db: AsyncSession,
    user_id: int,
    challenge_title: str,
    challenge_id: int,
) -> Notification:
    """First Blood 알림을 생성한다.

    Args:
        db: DB 세션.
        user_id: 최초 풀이자 ID.
        challenge_title: 챌린지 제목.
        challenge_id: 챌린지 ID.

    Returns:
        생성된 Notification 객체.
    """
    return await create_notification(
        db,
        user_id=user_id,
        type="first_blood",
        title="First Blood!",
        message=f"'{challenge_title}' 문제의 최초 풀이자가 되었습니다!",
        challenge_id=challenge_id,
    )


async def notify_review_result(
    db: AsyncSession,
    user_id: int,
    challenge_title: str,
    challenge_id: int,
    approved: bool,
) -> Notification:
    """출제 심사 결과 알림을 생성한다.

    Args:
        db: DB 세션.
        user_id: 출제자 ID.
        challenge_title: 챌린지 제목.
        challenge_id: 챌린지 ID.
        approved: 승인 여부.

    Returns:
        생성된 Notification 객체.
    """
    if approved:
        title = "출제 승인"
        message = f"'{challenge_title}' 문제가 승인되어 공개되었습니다!"
    else:
        title = "출제 반려"
        message = f"'{challenge_title}' 문제가 반려되었습니다. 사유를 확인해주세요."

    return await create_notification(
        db,
        user_id=user_id,
        type="review_result",
        title=title,
        message=message,
        challenge_id=challenge_id,
    )


async def notify_admins_new_submission(
    db: AsyncSession,
    challenge_title: str,
    challenge_id: int,
    author_name: str,
) -> None:
    """관리자들에게 새 심사 요청 알림을 보낸다.

    Args:
        db: DB 세션.
        challenge_title: 챌린지 제목.
        challenge_id: 챌린지 ID.
        author_name: 출제자 닉네임.
    """
    from app.core.permissions import AUTHOR_ROLES
    from app.models.user import User

    result = await db.execute(
        select(User.id).where(User.role.in_(AUTHOR_ROLES))
    )
    admin_ids = result.scalars().all()

    for admin_id in admin_ids:
        await create_notification(
            db,
            user_id=admin_id,
            type="review_request",
            title="새 심사 요청",
            message=f"{author_name}님이 '{challenge_title}' 문제를 제출했습니다.",
            challenge_id=challenge_id,
        )


async def get_user_notifications(
    db: AsyncSession,
    user_id: int,
    limit: int = 20,
    unread_only: bool = False,
) -> tuple[list[Notification], int]:
    """유저의 알림 목록과 미읽음 수를 반환한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.
        limit: 최대 결과 수.
        unread_only: 미읽음만 조회 여부.

    Returns:
        (알림 리스트, 미읽음 수) 튜플.
    """
    stmt = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))
    stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)

    result = await db.execute(stmt)
    notifications = list(result.scalars().all())

    unread_result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
    )
    unread_count = unread_result.scalar() or 0

    return notifications, unread_count


async def mark_as_read(
    db: AsyncSession,
    notification_id: int,
    user_id: int,
) -> None:
    """알림을 읽음 처리한다.

    Args:
        db: DB 세션.
        notification_id: 알림 ID.
        user_id: 유저 ID.
    """
    await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(is_read=True)
    )
    await db.flush()


async def mark_all_as_read(db: AsyncSession, user_id: int) -> None:
    """유저의 모든 알림을 읽음 처리한다.

    Args:
        db: DB 세션.
        user_id: 유저 ID.
    """
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    await db.flush()
