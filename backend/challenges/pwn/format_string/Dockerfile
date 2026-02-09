FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc libc6-dev socat && \
    rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/sh ctf

COPY src/format_string.c /tmp/format_string.c
RUN gcc -o /home/ctf/format_string /tmp/format_string.c \
        -no-pie -fno-stack-protector -z execstack && \
    rm /tmp/format_string.c && \
    chmod 755 /home/ctf/format_string

COPY flag.txt /flag.txt
RUN chmod 444 /flag.txt

USER ctf
WORKDIR /home/ctf

EXPOSE 9001
CMD ["socat", "TCP-LISTEN:9001,reuseaddr,fork", "EXEC:/home/ctf/format_string,pty,stderr,setsid,sigint,sane"]
