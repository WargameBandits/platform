FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

EXPOSE 8000

CMD ["sh", "-c", "echo '=== Resetting alembic version ===' && alembic stamp base && echo '=== Running alembic upgrade ===' && alembic upgrade head && echo '=== Alembic current ===' && alembic current && echo '=== Starting uvicorn ===' && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
