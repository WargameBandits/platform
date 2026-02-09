#!/bin/bash
# ============================================================
# 워게임 유괴단 - Oracle Cloud Free Tier 서버 초기 세팅 스크립트
# OS: Ubuntu 22.04 LTS (ARM64)
# ============================================================

set -euo pipefail

echo "=== 워게임 유괴단 서버 초기 세팅 ==="
echo ""

# ── 1. 시스템 업데이트 ──
echo "[1/6] 시스템 업데이트..."
sudo apt-get update && sudo apt-get upgrade -y

# ── 2. Docker 설치 (ARM64) ──
echo "[2/6] Docker 설치..."
if ! command -v docker &> /dev/null; then
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # 현재 유저를 docker 그룹에 추가
    sudo usermod -aG docker "$USER"
    echo "Docker 설치 완료. 재로그인 후 docker 명령어 사용 가능"
else
    echo "Docker 이미 설치됨: $(docker --version)"
fi

# ── 3. Swap 파일 설정 (4GB) ──
echo "[3/6] Swap 파일 설정..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap 4GB 설정 완료"
else
    echo "Swap 이미 설정됨"
fi

# ── 4. iptables 방화벽 설정 ──
echo "[4/6] 방화벽 설정..."
# Oracle Cloud는 기본적으로 iptables를 사용
# SSH (22), HTTP (80), HTTPS (443), Docker 인스턴스 포트 (30000-39999)
sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 30000:39999 -j ACCEPT

# iptables 영구 저장
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save
echo "방화벽 규칙 저장 완료 (80, 443, 30000-39999 개방)"

# Oracle Cloud Security List 안내
echo ""
echo "=================================================================="
echo "  Oracle Cloud에는 방화벽이 2겹입니다:"
echo ""
echo "    인터넷 → [OCI Security List] → [서버 iptables] → 서비스"
echo ""
echo "  위에서 iptables(서버 쪽)는 자동으로 열었습니다."
echo "  하지만 OCI Security List(클라우드 쪽)도 열어야 트래픽이 통과합니다."
echo ""
echo "  Oracle Cloud Console (https://cloud.oracle.com)에서:"
echo "    Networking → Virtual Cloud Networks → (VCN 선택)"
echo "    → Subnets → (서브넷 선택) → Security Lists → Default"
echo "    → Add Ingress Rules:"
echo ""
echo "    Source CIDR: 0.0.0.0/0  |  Protocol: TCP  |  Dest Port: 80"
echo "    Source CIDR: 0.0.0.0/0  |  Protocol: TCP  |  Dest Port: 443"
echo "    Source CIDR: 0.0.0.0/0  |  Protocol: TCP  |  Dest Port: 30000-39999"
echo "=================================================================="
echo ""

# ── 5. 필수 디렉토리 생성 ──
echo "[5/6] 디렉토리 생성..."
sudo mkdir -p /var/www/challenge-files
sudo chown "$USER:$USER" /var/www/challenge-files

# ── 6. 다음 단계 안내 ──
echo "[6/6] 다음 단계 안내..."
echo ""
echo "=== 서버 세팅 완료! ==="
echo ""
echo "로컬 PC에서 프로젝트를 서버로 전송하세요:"
echo "   rsync -avz --exclude node_modules --exclude .git --exclude __pycache__ \\"
echo "     ~/projects/wargame-bandits/ ubuntu@<서버IP>:~/wargame-bandits/"
echo ""
echo "서버에서 실행:"
echo "   cd ~/wargame-bandits"
echo "   chmod +x init-letsencrypt.sh && ./init-letsencrypt.sh"
echo "   docker compose -f docker-compose.prod.yml up -d --build"
echo "   docker compose -f docker-compose.prod.yml exec backend alembic upgrade head"
echo "   docker compose -f docker-compose.prod.yml exec backend python -m scripts.seed_challenges"
