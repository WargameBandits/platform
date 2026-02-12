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

# 챌린지 파일 준비 (바이너리 컴파일 + 데이터 파일 생성)
RUN mkdir -p challenges/pwn/example_bof/files \
    challenges/pwn/format_string/files \
    challenges/reversing/baby_rev/files \
    challenges/forensics/hidden_message/files \
    public_files

# C 바이너리 컴파일
RUN gcc -o challenges/pwn/example_bof/files/basic_bof \
    challenges/pwn/example_bof/src/basic_bof.c \
    -fno-stack-protector -no-pie -z execstack 2>/dev/null || true
RUN gcc -o challenges/pwn/format_string/files/format_string \
    challenges/pwn/format_string/src/format_string.c \
    -fno-stack-protector -no-pie 2>/dev/null || true
RUN gcc -o challenges/reversing/baby_rev/files/baby_rev \
    challenges/reversing/baby_rev/src/baby_rev.c 2>/dev/null || true

# 데이터 파일 생성 (encrypted.bin, encoded.txt, message.txt)
RUN cd challenges/crypto/xor_cipher/files && python encrypt.py || true
RUN python challenges/misc/base_madness/files/encode.py || true
RUN python challenges/forensics/hidden_message/generate.py || true

EXPOSE 8000

CMD ["sh", "-c", "alembic stamp head && python -m scripts.seed_challenges && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
