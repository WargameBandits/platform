FROM python:3.11-slim

RUN useradd -m -s /bin/sh ctf

COPY src/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt && rm /tmp/requirements.txt

COPY src/app.py /home/ctf/app.py
COPY flag.txt /flag.txt
RUN chmod 444 /flag.txt

USER ctf
WORKDIR /home/ctf

EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "30", "app:app"]
