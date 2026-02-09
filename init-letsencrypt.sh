#!/bin/bash
# ============================================================
# 워게임 유괴단 - Let's Encrypt SSL 인증서 발급 스크립트
# wargamebandit.is-a.dev용 인증서를 발급하고 Nginx와 연동
# ============================================================

set -euo pipefail

DOMAIN="wargamebandit.is-a.dev"
EMAIL="${CERTBOT_EMAIL:-}"
STAGING="${STAGING:-0}"  # 1로 설정하면 staging 서버 사용 (테스트용)
COMPOSE_FILE="docker-compose.prod.yml"

# .env에서 CERTBOT_EMAIL 읽기
if [ -z "$EMAIL" ] && [ -f .env ]; then
    EMAIL=$(grep -E "^CERTBOT_EMAIL=" .env | cut -d= -f2 | tr -d '"' | tr -d "'")
fi

if [ -z "$EMAIL" ]; then
    echo "ERROR: CERTBOT_EMAIL이 설정되지 않았습니다."
    echo ".env 파일에 CERTBOT_EMAIL=your@email.com 을 설정하세요."
    exit 1
fi

echo "=== SSL 인증서 발급 ==="
echo "도메인: $DOMAIN"
echo "이메일: $EMAIL"
echo ""

# ── 1. 기존 인증서 확인 ──
CERT_PATH="./certbot/conf/live/$DOMAIN"
if [ -d "$CERT_PATH" ]; then
    echo "기존 인증서가 발견되었습니다."
    read -p "새로 발급하시겠습니까? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "취소합니다."
        exit 0
    fi
fi

# ── 2. 임시 자체서명 인증서 생성 (Nginx가 시작할 수 있도록) ──
echo "[1/4] 임시 인증서 생성..."
mkdir -p "./certbot/conf/live/$DOMAIN"
if [ ! -f "./certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout "./certbot/conf/live/$DOMAIN/privkey.pem" \
        -out "./certbot/conf/live/$DOMAIN/fullchain.pem" \
        -subj "/CN=$DOMAIN" 2>/dev/null
    echo "임시 자체서명 인증서 생성 완료"
fi

# ── 3. Nginx 시작 ──
echo "[2/4] Nginx 시작..."
docker compose -f "$COMPOSE_FILE" up -d nginx
sleep 5

# ── 4. 임시 인증서 삭제 ──
echo "[3/4] 임시 인증서 삭제..."
rm -rf "./certbot/conf/live/$DOMAIN"
rm -rf "./certbot/conf/archive/$DOMAIN"
rm -f "./certbot/conf/renewal/$DOMAIN.conf"

# ── 5. Let's Encrypt 인증서 발급 ──
echo "[4/4] Let's Encrypt 인증서 발급..."
STAGING_FLAG=""
if [ "$STAGING" = "1" ]; then
    STAGING_FLAG="--staging"
    echo "(staging 모드)"
fi

docker compose -f "$COMPOSE_FILE" run --rm certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    $STAGING_FLAG

# ── 6. Nginx 재시작 ──
echo "Nginx 재시작..."
docker compose -f "$COMPOSE_FILE" exec nginx nginx -s reload

echo ""
echo "=== SSL 인증서 발급 완료! ==="
echo ""
echo "인증서 경로: /etc/letsencrypt/live/$DOMAIN/"
echo "자동 갱신: certbot 컨테이너가 12시간마다 갱신을 확인합니다."
echo ""
echo "전체 서비스 시작:"
echo "  docker compose -f $COMPOSE_FILE up -d --build"
