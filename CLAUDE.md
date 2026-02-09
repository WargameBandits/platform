# 워게임 유괴단 - Claude Code 초기 프롬프트

## 프로젝트에 투입하기 전에 읽어야 할 CLAUDE.md 내용

아래 내용을 CLAUDE.md에 넣어서 프로젝트 루트에 배치하세요.

---

```markdown
# 워게임 유괴단 (Wargame Bandits)

## 프로젝트 개요
전체 CTF 카테고리(Pwn, Reversing, Crypto, Web, Forensics, Misc)를 지원하는 **상시 운영형 워게임 플랫폼**.
일반적인 CTFd 클론이 아니라, 한국형 워게임 사이트(pwnable.kr, dreamhack, webhacking.kr 등)를 벤치마킹한 **상시 학습 + 랭킹 시스템**이다.

## 도메인 및 인프라

### 도메인 구조
- **메인 도메인**: `wargamebandit.is-a.dev` (무료, is-a.dev 서비스 이용)
- **SSL**: Let's Encrypt (Certbot 자동 갱신)

```
wargamebandit.is-a.dev                          → React SPA (프론트엔드)
wargamebandit.is-a.dev/api/v1/*                 → FastAPI 백엔드 API
wargamebandit.is-a.dev/ws/terminal/{instance_id} → WebSocket (웹 터미널)
wargamebandit.is-a.dev/files/*                  → 챌린지 첨부파일 (static)
```

동적 인스턴스(Pwn/Web 문제)는 같은 서버의 높은 포트로 노출:
```
wargamebandit.is-a.dev:30000~39999             → 유저별 Docker 컨테이너 (nc 접속)
```

### 유저 접속 흐름 예시
| 행위 | 접속 주소 |
|------|----------|
| 사이트 접속 | `https://wargamebandit.is-a.dev` |
| API 호출 | `https://wargamebandit.is-a.dev/api/v1/challenges` |
| 플래그 제출 | `POST https://wargamebandit.is-a.dev/api/v1/submissions` |
| Pwn 문제 nc 접속 | `nc wargamebandit.is-a.dev 31337` |
| 웹 터미널 | `wss://wargamebandit.is-a.dev/ws/terminal/{instance_id}` |
| 파일 다운로드 | `https://wargamebandit.is-a.dev/files/{challenge_id}/basic_bof` |

### 호스팅 (완전 무료)
- **서버**: Oracle Cloud Free Tier (ARM Ampere A1 — 4 OCPU, 24GB RAM, 평생 무료)
- **OS**: Ubuntu 22.04 LTS (ARM64)
- **트래픽**: 월 10TB 아웃바운드 (소규모~중규모 플랫폼 충분)
- **도메인**: is-a.dev (GitHub PR로 무료 등록, Cloudflare DNS 기반)
- **SSL**: Let's Encrypt + Certbot (자동 갱신)
- **비용**: 0원

### is-a.dev 등록 방법 (참고)
1. https://github.com/is-a-dev/register 포크
2. `domains/wargamebandit.json` 파일 생성:
```json
{
  "owner": {
    "username": "<github-username>",
    "email": "<email>"
  },
  "record": {
    "A": ["<oracle-cloud-public-ip>"]
  }
}
```
3. PR 제출 → 승인 후 DNS 자동 설정

## 핵심 차별점
- 상시 운영 워게임 (Jeopardy 대회형이 아님)
- 카테고리별 독립 랭킹 + 종합 랭킹
- Pwn/Rev 문제를 위한 Docker 기반 동적 인스턴스 할당
- Write-up 공유 및 커뮤니티 기능
- 난이도별 단계적 학습 경로 제공

## 기술 스택

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.0 (async)
- **Database**: PostgreSQL 16
- **Cache/Session**: Redis
- **Task Queue**: Celery + Redis (Docker 인스턴스 관리, 비동기 작업)
- **Container Orchestration**: Docker SDK for Python
- **Auth**: JWT (access + refresh token)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **State**: Zustand
- **UI**: Tailwind CSS + shadcn/ui
- **Terminal**: xterm.js (Pwn 문제용 웹 터미널)
- **Code Highlighting**: Monaco Editor 또는 Prism.js (Write-up용)

### Infrastructure
- Oracle Cloud Free Tier (ARM64 Ubuntu 22.04)
- Docker Compose (개발 + 프로덕션)
- Nginx (리버스 프록시 + SSL termination)
- Let's Encrypt + Certbot (HTTPS)
- nsjail 또는 redpwn/jail (Pwn 문제 격리)

## 프로젝트 구조

```
wargame-bandits/
├── CLAUDE.md
├── docker-compose.yml              # 개발용
├── docker-compose.prod.yml         # 프로덕션용 (SSL, 도메인 설정)
├── .env.example
│
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI 앱 엔트리포인트
│   │   ├── config.py                # 환경 설정 (도메인, DB, Redis 등)
│   │   ├── database.py              # DB 연결 및 세션 관리
│   │   │
│   │   ├── models/                  # SQLAlchemy 모델
│   │   │   ├── user.py
│   │   │   ├── challenge.py
│   │   │   ├── submission.py
│   │   │   ├── category.py
│   │   │   ├── writeup.py
│   │   │   └── container_instance.py
│   │   │
│   │   ├── schemas/                 # Pydantic 스키마
│   │   │   ├── user.py
│   │   │   ├── challenge.py
│   │   │   ├── submission.py
│   │   │   └── writeup.py
│   │   │
│   │   ├── api/                     # API 라우터
│   │   │   ├── v1/
│   │   │   │   ├── auth.py          # 회원가입/로그인/토큰
│   │   │   │   ├── users.py         # 프로필, 랭킹
│   │   │   │   ├── challenges.py    # 문제 목록, 상세, 플래그 제출
│   │   │   │   ├── containers.py    # 동적 인스턴스 생성/삭제
│   │   │   │   ├── scoreboards.py   # 랭킹보드
│   │   │   │   ├── writeups.py      # Write-up CRUD
│   │   │   │   └── admin.py         # 관리자 (문제 출제, 유저 관리)
│   │   │   └── deps.py              # 의존성 (인증, DB 세션)
│   │   │
│   │   ├── services/                # 비즈니스 로직
│   │   │   ├── auth_service.py
│   │   │   ├── challenge_service.py
│   │   │   ├── scoring_service.py
│   │   │   ├── container_service.py # Docker 인스턴스 관리 핵심
│   │   │   └── writeup_service.py
│   │   │
│   │   ├── core/                    # 공통 유틸
│   │   │   ├── security.py          # 비밀번호 해싱, JWT
│   │   │   ├── permissions.py       # RBAC
│   │   │   └── exceptions.py        # 커스텀 예외
│   │   │
│   │   └── tasks/                   # Celery 비동기 태스크
│   │       ├── container_tasks.py   # 인스턴스 생성/정리/타임아웃
│   │       └── scoring_tasks.py     # 점수 재계산
│   │
│   ├── challenges/                  # 챌린지 파일 저장소
│   │   ├── pwn/
│   │   │   └── example_bof/
│   │   │       ├── Dockerfile
│   │   │       ├── challenge.yaml   # 메타데이터
│   │   │       ├── flag.txt
│   │   │       └── src/
│   │   ├── reversing/
│   │   ├── crypto/
│   │   ├── web/
│   │   ├── forensics/
│   │   └── misc/
│   │
│   ├── alembic/                     # DB 마이그레이션
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Challenges.tsx       # 카테고리별 문제 목록
│   │   │   ├── ChallengeDetail.tsx  # 문제 상세 + 플래그 제출
│   │   │   ├── Scoreboard.tsx       # 랭킹보드
│   │   │   ├── Profile.tsx          # 유저 프로필 + 풀이 현황
│   │   │   ├── Writeups.tsx         # Write-up 목록
│   │   │   └── Admin/               # 관리자 패널
│   │   │       ├── Dashboard.tsx
│   │   │       ├── ChallengeEditor.tsx
│   │   │       └── UserManagement.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── challenge/
│   │   │   │   ├── ChallengeCard.tsx
│   │   │   │   ├── FlagSubmitForm.tsx
│   │   │   │   ├── CategoryFilter.tsx
│   │   │   │   └── DifficultyBadge.tsx
│   │   │   ├── terminal/
│   │   │   │   └── WebTerminal.tsx   # xterm.js 웹 터미널
│   │   │   ├── scoreboard/
│   │   │   │   ├── RankingTable.tsx
│   │   │   │   └── ScoreGraph.tsx
│   │   │   └── common/
│   │   │       ├── MarkdownRenderer.tsx
│   │   │       └── CodeBlock.tsx
│   │   │
│   │   ├── hooks/
│   │   ├── stores/                  # Zustand stores
│   │   ├── services/                # API 호출
│   │   │   └── api.ts               # axios 인스턴스 (baseURL: /api/v1)
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── Dockerfile
│
├── nginx/
│   ├── nginx.dev.conf               # 개발용 (HTTP, localhost)
│   └── nginx.prod.conf              # 프로덕션용 (HTTPS, wargamebandit.is-a.dev)
│
└── certbot/                          # Let's Encrypt 인증서 (프로덕션)
    ├── conf/
    └── www/
```

## 환경 설정 (.env.example)

```env
# === Domain ===
DOMAIN=wargamebandit.is-a.dev
ENVIRONMENT=development  # development | production

# === Backend ===
SECRET_KEY=change-me-to-random-string
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# === Database ===
POSTGRES_USER=wargame
POSTGRES_PASSWORD=change-me
POSTGRES_DB=wargame
DATABASE_URL=postgresql+asyncpg://wargame:change-me@db:5432/wargame

# === Redis ===
REDIS_URL=redis://redis:6379/0

# === Docker Instance ===
CONTAINER_PORT_RANGE_START=30000
CONTAINER_PORT_RANGE_END=39999
CONTAINER_TIMEOUT_SECONDS=1800
CONTAINER_MAX_PER_USER=3
CONTAINER_CPU_LIMIT=0.5
CONTAINER_MEM_LIMIT=128m

# === CORS ===
CORS_ORIGINS=["https://wargamebandit.is-a.dev","http://localhost:3000"]

# === Certbot (production only) ===
CERTBOT_EMAIL=your-email@example.com
```

## Nginx 설정

### 개발용 (nginx.dev.conf)
```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name localhost;

    # API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket (웹 터미널)
    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # 챌린지 파일 다운로드
    location /files/ {
        alias /var/www/challenge-files/;
        autoindex off;
    }

    # Frontend (SPA)
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Vite HMR WebSocket (개발용)
    location /hmr {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 프로덕션용 (nginx.prod.conf)
```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name wargamebandit.is-a.dev;

    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # HTTP → HTTPS 리다이렉트
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name wargamebandit.is-a.dev;

    ssl_certificate /etc/letsencrypt/live/wargamebandit.is-a.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wargamebandit.is-a.dev/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # WebSocket (웹 터미널)
    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # 챌린지 파일 다운로드
    location /files/ {
        alias /var/www/challenge-files/;
        autoindex off;
        add_header Cache-Control "public, max-age=86400";
    }

    # Frontend (빌드된 정적 파일)
    location / {
        root /var/www/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;

        # 정적 파일 캐싱
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}

# Rate limiting zone 정의 (http 블록에 추가 필요)
# limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
```

## 데이터 모델 핵심 설계

### User
- id, username, email, password_hash
- role (user | admin | challenge_author)
- solved_count, total_score
- created_at, last_login

### Challenge
- id, title, description (Markdown)
- category (pwn | reversing | crypto | web | forensics | misc)
- difficulty (1-5 또는 baby | easy | medium | hard | insane)
- points (정적 또는 동적 점수)
- flag (해시 저장), flag_type (static | regex | dynamic)
- is_dynamic (Docker 인스턴스 필요 여부)
- docker_image (동적 문제용)
- files (첨부파일 목록)
- author_id
- solve_count, is_active

### Submission
- id, user_id, challenge_id
- submitted_flag, is_correct
- submitted_at

### ContainerInstance
- id, user_id, challenge_id
- container_id (Docker container ID)
- port_mapping
- created_at, expires_at
- status (running | stopped | expired)

### Writeup
- id, user_id, challenge_id
- content (Markdown)
- is_public
- upvotes

## 스코어링 시스템

동적 점수제 (Dynamic Scoring) 구현:
- 초기 점수 = max_points (예: 500)
- 풀이자 수가 늘어나면 점수 감소 (최소 min_points까지)
- 공식: `points = max(min_points, max_points - decay * solve_count)`
- 카테고리별 개별 랭킹 + 종합 랭킹

## Docker 인스턴스 관리 규칙

1. 유저가 동적 문제의 "Start Instance" 클릭 → 해당 유저 전용 Docker 컨테이너 생성
2. 컨테이너당 리소스 제한: CPU 0.5코어, RAM 128MB, 타임아웃 30분
3. 유저당 동시 실행 가능 인스턴스 수: 최대 3개
4. 만료된 인스턴스는 Celery beat로 주기적 정리
5. Pwn 문제: xinetd 또는 socat으로 바이너리 서빙, nsjail로 격리
6. Web 문제: 독립 웹 서버 컨테이너
7. 포트 할당 범위: 30000~39999 (서버 방화벽에서 이 범위만 개방)
8. 접속 정보 형식: `nc wargamebandit.is-a.dev {port}`

## 보안 요구사항

1. **인증**: bcrypt 해싱, JWT 토큰 (access 15분, refresh 7일)
2. **Flag 저장**: SHA-256 해시로 저장, 평문 절대 금지
3. **Rate Limiting**: 플래그 제출 분당 10회 제한 (Nginx + 백엔드 이중 제한)
4. **Input Validation**: 모든 입력값 Pydantic으로 검증
5. **Container Isolation**: 네트워크 격리, capability 최소화, read-only filesystem
6. **Anti-Bruteforce**: 연속 틀린 제출 시 쿨다운 적용
7. **SQL Injection 방지**: ORM 사용 필수, raw query 금지
8. **XSS 방지**: Write-up 마크다운 렌더링 시 sanitize 필수
9. **HTTPS 강제**: 프로덕션에서 HTTP → HTTPS 리다이렉트 필수
10. **보안 헤더**: X-Frame-Options, X-Content-Type-Options, HSTS, CSP 설정

## 코딩 컨벤션

### Python (Backend)
- Python 3.11+, 타입 힌팅 필수
- async/await 패턴 사용 (FastAPI + SQLAlchemy async)
- 함수는 한 가지 역할만, 30줄 이내
- docstring 필수 (Google style)
- 변수명: snake_case, 클래스명: PascalCase
- import 순서: stdlib → 서드파티 → 로컬

### TypeScript (Frontend)
- 함수형 컴포넌트 + Hooks only
- Props 인터페이스 명시적 정의
- 컴포넌트 파일 하나에 하나의 컴포넌트
- API 호출은 services/ 디렉토리에 분리
- API baseURL은 상대경로 `/api/v1` 사용 (Nginx가 프록시)

### Git
- Conventional Commits: feat:, fix:, docs:, refactor:, test:, chore:
- 브랜치 전략: main → develop → feature/xxx

## 개발 순서 (Phase)

### Phase 1: 기반 구축
1. 프로젝트 스캐폴딩 (디렉토리 구조 생성)
2. Docker Compose 설정 (PostgreSQL, Redis, Backend, Frontend, Nginx)
3. FastAPI 앱 초기화 + DB 연결 + Alembic 마이그레이션 설정
4. 데이터 모델 정의 (User, Challenge, Submission)
5. 인증 시스템 (회원가입, 로그인, JWT)
6. React 프로젝트 초기화 + 라우팅 + 레이아웃

### Phase 2: 핵심 기능
7. 챌린지 CRUD API (관리자용 출제 기능)
8. 챌린지 목록/상세 페이지 (카테고리 필터, 난이도 필터)
9. 플래그 제출 시스템 (검증, 점수 반영, 중복 제출 방지)
10. 스코어보드 (종합 + 카테고리별 랭킹)
11. 유저 프로필 (풀이 현황, 카테고리별 레이더 차트)

### Phase 3: 동적 인스턴스
12. Docker SDK 통합 (컨테이너 생성/삭제/상태 관리)
13. Pwn 문제 템플릿 (xinetd/socat + nsjail Dockerfile)
14. Web 문제 템플릿
15. 인스턴스 타임아웃 및 자동 정리 (Celery beat)
16. 웹 터미널 연동 (xterm.js + WebSocket)

### Phase 4: 커뮤니티 + 고도화
17. Write-up 시스템 (Markdown 에디터, 솔브한 문제만 작성 가능)
18. 문제 첨부파일 업로드/다운로드
19. 관리자 대시보드 (통계, 유저 관리, 문제 관리)
20. 알림 시스템 (신규 문제, First Blood 등)

### Phase 5: 프로덕션 배포
21. docker-compose.prod.yml 완성 (프로덕션 최적화)
22. Certbot SSL 인증서 발급 및 자동 갱신 설정
23. Oracle Cloud Free Tier 서버 세팅 (방화벽, Docker 설치)
24. is-a.dev 도메인 등록 (GitHub PR)
25. CI/CD 파이프라인 (GitHub Actions → 서버 배포)

## 챌린지 메타데이터 형식 (challenge.yaml)

```yaml
title: "Basic Buffer Overflow"
category: pwn
difficulty: 1
points: 100
description: |
  간단한 스택 버퍼 오버플로우 문제입니다.
  `nc wargamebandit.is-a.dev {port}` 로 접속하세요.
flag: "BNDT{b4s1c_b0f_3xpl01t}"
flag_type: static
is_dynamic: true
docker:
  image: "challenges/pwn/basic_bof"
  build_context: "./src"
  port: 9001
  timeout: 1800  # 30분
  memory_limit: "128m"
  cpu_limit: 0.5
files:
  - "basic_bof"       # 바이너리
  - "libc.so.6"       # libc (선택)
hints:
  - cost: 50
    content: "gets() 함수의 취약점을 생각해보세요."
  - cost: 100
    content: "return address를 win() 함수로 덮어쓰세요."
tags: ["stack", "bof", "beginner"]
author: "admin"
```

## 중요 제약사항

- SQLite 사용 금지 → PostgreSQL만 사용
- 동기 코드 금지 → 모든 DB/외부 호출은 async
- env 파일에 시크릿 하드코딩 금지 → .env.example만 커밋
- Docker socket mount 시 보안 주의 → 제한된 API만 사용
- 프론트엔드에서 직접 Docker API 호출 금지 → 반드시 백엔드 경유
- 프론트엔드 API 호출 시 도메인 하드코딩 금지 → 상대경로 `/api/v1` 사용
- 프로덕션에서 debug 모드 금지
- Oracle Cloud ARM64 아키텍처 호환 Docker 이미지 사용 필수 (amd64 전용 이미지 주의)
```

---

## Claude Code 첫 대화용 프롬프트

Claude Code를 실행한 뒤 아래 프롬프트를 첫 번째 메시지로 입력하세요:

```
CLAUDE.md를 먼저 읽고 프로젝트의 전체 맥락을 파악해줘.

이 프로젝트는 "워게임 유괴단(Wargame Bandits)"이라는 이름의 상시 운영형 CTF 워게임 플랫폼이야.
pwnable.kr, dreamhack.io, webhacking.kr 같은 사이트를 벤치마킹한 한국형 워게임 사이트를 만들 거야.
도메인은 wargamebandit.is-a.dev이고, Oracle Cloud Free Tier에 배포할 예정이야.

지금부터 Phase 1을 시작할 건데, 아래 순서대로 진행해줘:

1. CLAUDE.md에 정의된 프로젝트 디렉토리 구조를 그대로 생성해줘.
2. docker-compose.yml (개발용)을 만들어줘:
   - PostgreSQL 16 (포트 5432, DB명: wargame, 유저: wargame, 비밀번호: .env 참조)
   - Redis 7 (포트 6379)
   - Backend (FastAPI, 포트 8000, hot reload)
   - Frontend (React Vite, 포트 3000, hot reload)
   - Nginx (포트 80, nginx.dev.conf 사용)
3. .env.example 파일을 CLAUDE.md 정의대로 생성
4. Nginx 설정 파일 2개 생성 (nginx.dev.conf, nginx.prod.conf) — CLAUDE.md에 있는 설정 그대로
5. Backend 초기화:
   - FastAPI 앱 (app/main.py) + CORS 설정 (CORS_ORIGINS는 config에서 로드)
   - config.py (pydantic-settings 기반, DOMAIN 환경변수 포함)
   - database.py (async SQLAlchemy + sessionmaker)
   - Alembic 설정
   - requirements.txt
   - Dockerfile (Python 3.11-slim 기반)
6. Frontend 초기화:
   - Vite + React + TypeScript 프로젝트
   - Tailwind CSS + shadcn/ui 설정
   - React Router 기본 라우팅 (Home, Login, Register, Challenges, Scoreboard, Profile)
   - API service (axios, baseURL: "/api/v1")
   - 기본 레이아웃 컴포넌트 (Navbar, Footer)
   - Dockerfile
7. certbot/ 디렉토리 구조 생성 (빈 디렉토리, 프로덕션 배포 시 사용)

각 파일을 만들 때 CLAUDE.md의 코딩 컨벤션과 보안 요구사항을 반드시 따라줘.
모든 코드에 타입 힌팅과 docstring을 포함하고, 에러 핸들링도 꼼꼼하게 해줘.
완료되면 docker-compose up --build로 전체 스택이 뜨는지 확인할 수 있게 해줘.
```

---

## 이후 Phase별 프롬프트

### Phase 2 시작 프롬프트
```
Phase 2를 시작하자. CLAUDE.md를 다시 확인하고 Phase 2 항목들을 순서대로 구현해줘.

먼저 7번 - 챌린지 CRUD API부터 시작해.
- Challenge 모델을 CLAUDE.md의 데이터 모델 설계대로 구현
- Alembic 마이그레이션 생성 및 적용
- 관리자 전용 CRUD 엔드포인트 (POST/GET/PUT/DELETE /api/v1/admin/challenges)
- 일반 유저용 조회 엔드포인트 (GET /api/v1/challenges, GET /api/v1/challenges/{id})
- 카테고리/난이도/검색 필터링
- 페이지네이션 (cursor 기반)
- challenge.yaml 파일로 일괄 등록하는 import 기능

그 다음 8번 - 프론트엔드 챌린지 페이지:
- Challenges 목록 페이지 (카드 형태, 카테고리별 탭, 난이도 필터)
- ChallengeDetail 페이지 (설명, 파일 다운로드, 플래그 제출 폼)
- 풀이 여부에 따른 시각적 구분 (solved 체크마크)
```

### Phase 3 시작 프롬프트
```
Phase 3 - 동적 인스턴스 시스템을 구현하자. 이게 이 프로젝트의 핵심이야.

CLAUDE.md의 Docker 인스턴스 관리 규칙과 보안 요구사항을 철저히 따라줘.
접속 정보는 반드시 "nc wargamebandit.is-a.dev {port}" 형식으로 유저에게 보여줘야 해.

12번부터 시작:
- container_service.py: Docker SDK를 사용한 컨테이너 라이프사이클 관리
  - create_instance(user_id, challenge_id) → 컨테이너 생성, 30000~39999 포트 매핑, 접속 정보 반환
  - stop_instance(instance_id) → 컨테이너 중지 및 제거
  - get_instance_status(instance_id) → 상태 조회
  - cleanup_expired() → 만료된 인스턴스 일괄 정리
- API 엔드포인트: POST/DELETE/GET /api/v1/containers
- Celery beat task로 5분마다 만료 인스턴스 정리

13번 - Pwn 문제 템플릿 Dockerfile:
- ubuntu 22.04 기반 (ARM64 호환 주의)
- socat + xinetd로 바이너리 서빙
- nsjail로 프로세스 격리
- read-only filesystem, 네트워크 격리
- 예제 문제 하나 만들어서 테스트

16번 - 웹 터미널:
- xterm.js + WebSocket으로 Docker 컨테이너에 attach
- 백엔드에서 WebSocket 핸들러 구현 (인증된 유저만 자기 인스턴스에 접근)
- WebSocket URL: wss://wargamebandit.is-a.dev/ws/terminal/{instance_id}
```

### Phase 5 배포 프롬프트
```
Phase 5 - 프로덕션 배포를 진행하자.

1. docker-compose.prod.yml 완성:
   - Frontend는 빌드된 정적 파일을 Nginx에서 직접 서빙
   - Backend는 gunicorn + uvicorn worker로 실행
   - Certbot 컨테이너 추가 (SSL 인증서 발급/갱신)
   - 모든 서비스에 restart: unless-stopped 설정
   - 볼륨으로 인증서, DB 데이터, 챌린지 파일 영속화

2. Oracle Cloud 서버 초기 세팅 스크립트 (setup-server.sh):
   - Docker + Docker Compose 설치 (ARM64)
   - iptables 방화벽 설정 (80, 443, 30000-39999 포트 개방)
   - swap 파일 설정 (4GB)
   - 프로젝트 클론 및 .env 생성 가이드

3. SSL 인증서 발급 스크립트 (init-letsencrypt.sh):
   - wargamebandit.is-a.dev용 Let's Encrypt 인증서 발급
   - Certbot + Nginx 연동
   - cron으로 자동 갱신 설정

4. GitHub Actions CI/CD (.github/workflows/deploy.yml):
   - main 브랜치 push 시 자동 배포
   - SSH로 Oracle Cloud 서버에 접속
   - git pull → docker-compose -f docker-compose.prod.yml up --build -d
```
