"""python -m scripts 로 실행 시 seed_challenges를 실행한다."""

from scripts.seed_challenges import seed
import asyncio

asyncio.run(seed())
