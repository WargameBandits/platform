# Web 문제 템플릿 Dockerfile
# Python + Flask 기반 (ARM64/AMD64 모두 지원)
# 의도적으로 취약한 웹 애플리케이션 서빙

FROM python:3.11-slim

ARG DEBIAN_FRONTEND=noninteractive

# 챌린지 유저 생성
RUN useradd -m -d /home/ctf -s /bin/sh ctf

# 의존성 설치
COPY src/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt && rm /tmp/requirements.txt

# 애플리케이션 복사
COPY src/app.py /home/ctf/app.py

# 플래그 배치
COPY flag.txt /flag.txt
RUN chmod 444 /flag.txt

WORKDIR /home/ctf

EXPOSE 5000

# gunicorn으로 Flask 앱 서빙 (ctf 유저로 실행)
USER ctf
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "30", "app:app"]
