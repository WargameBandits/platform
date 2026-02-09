"""SQLAlchemy 모델 패키지.

모든 모델을 여기서 import하여 Alembic이 자동 감지할 수 있게 한다.
"""

from app.models.user import User
from app.models.challenge import Challenge
from app.models.submission import Submission
from app.models.container_instance import ContainerInstance
from app.models.writeup import Writeup
from app.models.notification import Notification

__all__ = ["User", "Challenge", "Submission", "ContainerInstance", "Writeup", "Notification"]
