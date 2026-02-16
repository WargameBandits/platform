"""Redis 기반 슬라이딩 윈도우 Rate Limiter.

시간 윈도우 내 요청 횟수를 Redis Sorted Set으로 추적하여
제한을 초과하면 RateLimitException을 발생시킨다.
"""

import time

from redis.asyncio import Redis

from app.core.exceptions import RateLimitException


async def check_rate_limit(
    redis: Redis,
    key: str,
    max_requests: int,
    window_seconds: int,
) -> None:
    """슬라이딩 윈도우 방식으로 요청 빈도를 검사한다.

    Redis Sorted Set에 타임스탬프를 score로 저장하고,
    윈도우 밖의 오래된 항목을 제거한 뒤 현재 항목 수를 센다.

    Args:
        redis: Redis 비동기 클라이언트.
        key: Rate limit 키 (e.g., "flag_submit:{user_id}").
        max_requests: 윈도우 내 최대 요청 수.
        window_seconds: 윈도우 크기 (초).

    Raises:
        RateLimitException: 제한을 초과했을 때.
    """
    now = time.time()
    window_start = now - window_seconds

    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, window_start)
    pipe.zadd(key, {str(now): now})
    pipe.zcard(key)
    pipe.expire(key, window_seconds)
    results = await pipe.execute()

    count = results[2]
    if count > max_requests:
        raise RateLimitException(
            "요청 빈도 제한을 초과했습니다. 잠시 후 다시 시도해주세요."
        )
