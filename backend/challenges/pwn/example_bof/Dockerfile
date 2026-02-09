# Pwn 문제 템플릿 Dockerfile
# Ubuntu 22.04 기반 (ARM64/AMD64 모두 지원)
# socat으로 바이너리 서빙, 프로세스 격리

FROM ubuntu:22.04

ARG DEBIAN_FRONTEND=noninteractive

# 시스템 패키지 설치
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        socat \
        gcc \
        libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# 챌린지 유저 생성 (권한 최소화)
RUN useradd -m -d /home/ctf -s /bin/sh ctf

# 소스 복사 및 컴파일
COPY src/basic_bof.c /tmp/basic_bof.c
RUN gcc -o /home/ctf/basic_bof /tmp/basic_bof.c \
        -fno-stack-protector -no-pie -z execstack \
    && rm /tmp/basic_bof.c \
    && chmod 755 /home/ctf/basic_bof

# 플래그 배치 (root 소유, ctf 유저 읽기 가능)
COPY flag.txt /flag.txt
RUN chmod 444 /flag.txt

# 컴파일러 제거 (불필요한 도구 최소화)
RUN apt-get purge -y gcc && apt-get autoremove -y

WORKDIR /home/ctf

EXPOSE 9001

# socat으로 바이너리를 TCP 서비스로 제공
# fork: 연결마다 새 프로세스, su=ctf: ctf 유저로 실행
CMD ["socat", \
     "TCP-LISTEN:9001,reuseaddr,fork", \
     "EXEC:/home/ctf/basic_bof,pty,stderr,setsid,sigint,sane,su=ctf"]
