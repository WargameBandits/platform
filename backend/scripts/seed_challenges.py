"""챌린지 시드 스크립트.

모든 카테고리의 테스트 챌린지를 DB에 등록한다.
이미 같은 제목의 챌린지가 있으면 건너뛴다.
플래그는 각 챌린지 디렉토리의 flag.txt에서 읽어온다.

실행: python -m scripts.seed_challenges
"""

import asyncio
import hashlib
import os

from sqlalchemy import select

from app.database import async_session_factory
from app.models.challenge import Challenge
from app.models.user import User
from app.core.security import hash_password

CHALLENGES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "challenges")


def read_flag(challenge_dir: str) -> str:
    """챌린지 디렉토리의 flag.txt에서 플래그를 읽는다."""
    flag_path = os.path.join(CHALLENGES_DIR, challenge_dir, "flag.txt")
    if not os.path.exists(flag_path):
        raise FileNotFoundError(f"flag.txt not found: {flag_path}")
    return open(flag_path, "r").read().strip()


def hash_flag(flag: str) -> str:
    """플래그를 SHA-256으로 해싱한다."""
    return hashlib.sha256(flag.encode()).hexdigest()


CHALLENGES = [
    # === Pwn ===
    {
        "title": "Basic Buffer Overflow",
        "description": (
            "간단한 스택 버퍼 오버플로우 문제입니다.\n\n"
            "`nc wargamebandit.is-a.dev {port}` 로 접속하세요.\n\n"
            "바이너리를 다운로드하여 분석해보세요."
        ),
        "category": "pwn",
        "difficulty": 1,
        "points": 100,
        "max_points": 300,
        "min_points": 50,
        "decay": 10.0,
        "flag_dir": "pwn/example_bof",
        "flag_type": "static",
        "is_dynamic": True,
        "docker_image": "challenges/pwn/example_bof",
        "docker_port": 9001,
        "files": ["basic_bof"],
        "hints": [
            {"cost": 50, "content": "gets() 함수의 취약점을 생각해보세요."},
            {"cost": 100, "content": "return address를 win() 함수로 덮어쓰세요."},
        ],
        "tags": ["stack", "bof", "beginner"],
    },
    {
        "title": "Format String Fun",
        "description": (
            "포맷 스트링 취약점을 이용하여 플래그를 읽어보세요.\n\n"
            "`nc wargamebandit.is-a.dev {port}` 로 접속하세요.\n\n"
            "**Hint:** `printf`에 사용자 입력을 직접 넣으면 어떤 일이 일어날까요?"
        ),
        "category": "pwn",
        "difficulty": 2,
        "points": 100,
        "max_points": 400,
        "min_points": 50,
        "decay": 8.0,
        "flag_dir": "pwn/format_string",
        "flag_type": "static",
        "is_dynamic": True,
        "docker_image": "challenges/pwn/format_string",
        "docker_port": 9001,
        "files": ["format_string"],
        "hints": [
            {"cost": 30, "content": "스택에 있는 값을 출력해보세요. %x나 %p를 사용할 수 있습니다."},
            {"cost": 70, "content": "플래그는 스택 어딘가에 로드되어 있습니다. %s를 적절한 위치에 사용하세요."},
        ],
        "tags": ["format-string", "stack", "leak"],
    },
    # === Reversing ===
    {
        "title": "Baby Reversing",
        "description": (
            "간단한 패스워드 체크 프로그램입니다.\n"
            "올바른 패스워드를 찾아 플래그를 획득하세요.\n\n"
            "바이너리를 다운로드하여 분석해보세요.\n\n"
            "```\n$ ./baby_rev\nEnter password: ???\n```"
        ),
        "category": "reversing",
        "difficulty": 1,
        "points": 100,
        "max_points": 300,
        "min_points": 50,
        "decay": 10.0,
        "flag_dir": "reversing/baby_rev",
        "flag_type": "static",
        "is_dynamic": False,
        "files": ["baby_rev"],
        "hints": [
            {"cost": 30, "content": "strings 명령어로 바이너리 안의 문자열을 확인해보세요."},
            {"cost": 70, "content": "XOR 연산으로 각 글자를 비교하고 있습니다. 키는 0x42입니다."},
        ],
        "tags": ["xor", "strings", "beginner"],
    },
    # === Crypto ===
    {
        "title": "XOR Me",
        "description": (
            "단일 바이트 XOR로 암호화된 플래그를 복호화하세요.\n\n"
            "`encrypted.bin` 파일을 다운로드하여 분석해보세요.\n"
            "키는 1바이트(0x00~0xFF)입니다.\n\n"
            "```python\nwith open('encrypted.bin', 'rb') as f:\n"
            "    data = f.read()\n# data를 복호화하면 플래그가 나옵니다.\n```"
        ),
        "category": "crypto",
        "difficulty": 1,
        "points": 100,
        "max_points": 300,
        "min_points": 50,
        "decay": 10.0,
        "flag_dir": "crypto/xor_cipher",
        "flag_type": "static",
        "is_dynamic": False,
        "files": ["encrypted.bin", "encrypt.py"],
        "hints": [
            {"cost": 30, "content": "플래그가 BNDT{로 시작한다는 걸 알고 있으니, 첫 바이트와 'B'를 XOR하면 키를 알 수 있습니다."},
            {"cost": 50, "content": "키는 0x13입니다."},
        ],
        "tags": ["xor", "single-byte", "beginner"],
    },
    {
        "title": "Baby RSA",
        "description": (
            "아주 작은 RSA 키로 암호화된 메시지를 복호화하세요.\n\n"
            "```\nn = 323\ne = 65537\nc = 245\n```\n\n"
            "`n`이 충분히 작아서 소인수분해가 가능합니다.\n"
            "`p`와 `q`를 구하고, `d`를 계산하여 복호화하세요.\n\n"
            "플래그 형식: 복호화한 평문 `m`을 `BNDT{m}` 형식으로 제출하세요.\n"
            "예시: 평문이 42이면 `BNDT{42}`"
        ),
        "category": "crypto",
        "difficulty": 2,
        "points": 100,
        "max_points": 500,
        "min_points": 50,
        "decay": 8.0,
        "flag_dir": "crypto/baby_rsa",
        "flag_type": "static",
        "is_dynamic": False,
        "files": ["rsa_challenge.py"],
        "hints": [
            {"cost": 30, "content": "n = 323 = 17 × 19 입니다."},
            {"cost": 70, "content": "phi = (17-1) × (19-1) = 288, d = pow(65537, -1, 288)"},
        ],
        "tags": ["rsa", "factorization", "small-key"],
    },
    # === Web ===
    {
        "title": "Baby SQLi",
        "description": (
            "이 로그인 페이지에는 SQL Injection 취약점이 있습니다.\n\n"
            "`http://wargamebandit.is-a.dev:{port}` 로 접속하세요.\n\n"
            "관리자 계정으로 로그인하면 플래그를 획득할 수 있습니다."
        ),
        "category": "web",
        "difficulty": 1,
        "points": 100,
        "max_points": 300,
        "min_points": 50,
        "decay": 10.0,
        "flag_dir": "web/baby_sqli",
        "flag_type": "static",
        "is_dynamic": True,
        "docker_image": "challenges/web/baby_sqli",
        "docker_port": 5000,
        "hints": [
            {"cost": 30, "content": "' OR 1=1 -- 를 시도해보세요."},
            {"cost": 70, "content": "username에 admin' -- 를 입력하세요."},
        ],
        "tags": ["sqli", "login-bypass", "beginner"],
    },
    {
        "title": "Cookie Monster",
        "description": (
            "쿠키를 조작하여 관리자 권한을 획득하세요!\n\n"
            "`http://wargamebandit.is-a.dev:{port}` 로 접속하세요.\n\n"
            "일반 유저로 로그인한 뒤, 관리자 페이지(`/admin`)에 접근하면 플래그를 얻을 수 있습니다.\n\n"
            "**계정 정보:**\n- ID: `guest`\n- PW: `guest123`"
        ),
        "category": "web",
        "difficulty": 2,
        "points": 100,
        "max_points": 400,
        "min_points": 50,
        "decay": 8.0,
        "flag_dir": "web/cookie_monster",
        "flag_type": "static",
        "is_dynamic": True,
        "docker_image": "challenges/web/cookie_monster",
        "docker_port": 5000,
        "hints": [
            {"cost": 30, "content": "로그인 후 쿠키를 확인해보세요. role 값이 있지 않나요?"},
            {"cost": 70, "content": "쿠키의 role 값을 'admin'으로 변경하고 /admin에 접속하세요."},
        ],
        "tags": ["cookie", "authentication", "manipulation"],
    },
    # === Forensics ===
    {
        "title": "Hidden in Plain Sight",
        "description": (
            "이 텍스트 파일에 숨겨진 메시지를 찾으세요.\n\n"
            "겉보기에는 평범한 텍스트 파일이지만, 눈에 보이지 않는 무언가가 숨어있습니다.\n\n"
            "`message.txt`를 다운로드하여 분석해보세요.\n\n"
            "> Tip: 항상 눈에 보이는 것만이 전부는 아닙니다."
        ),
        "category": "forensics",
        "difficulty": 1,
        "points": 100,
        "max_points": 300,
        "min_points": 50,
        "decay": 10.0,
        "flag_dir": "forensics/hidden_message",
        "flag_type": "static",
        "is_dynamic": False,
        "files": ["message.txt"],
        "hints": [
            {"cost": 30, "content": "hexdump나 xxd 명령어로 파일의 실제 바이트를 확인해보세요."},
            {"cost": 70, "content": "파일 끝에 NULL 바이트 이후에 숨겨진 데이터가 있습니다."},
        ],
        "tags": ["hex", "hidden-data", "beginner"],
    },
    # === Misc ===
    {
        "title": "Base Madness",
        "description": (
            "누군가가 플래그를 여러 겹의 인코딩으로 감추었습니다.\n\n"
            "`encoded.txt` 파일을 다운로드하고, 하나씩 디코딩하여 원래 플래그를 찾으세요.\n\n"
            "사용된 인코딩은 모두 기본적인 것들입니다:\n"
            "- Base64\n- Hex\n- 또 다른 Base64...\n\n"
            "양파 껍질을 벗기듯이, 레이어를 하나씩 벗겨보세요."
        ),
        "category": "misc",
        "difficulty": 1,
        "points": 100,
        "max_points": 200,
        "min_points": 50,
        "decay": 12.0,
        "flag_dir": "misc/base_madness",
        "flag_type": "static",
        "is_dynamic": False,
        "files": ["encoded.txt", "encode.py"],
        "hints": [
            {"cost": 20, "content": "첫 번째 레이어는 Base64입니다."},
            {"cost": 50, "content": "Base64 → Hex → Base64 → 원문 순서입니다. 역순으로 디코딩하세요."},
        ],
        "tags": ["encoding", "base64", "hex", "beginner"],
    },
]


async def ensure_admin_user(session) -> int:
    """admin 유저가 없으면 생성한다."""
    result = await session.execute(
        select(User).where(User.username == "admin")
    )
    admin = result.scalar_one_or_none()
    if admin:
        return admin.id

    admin = User(
        username="admin",
        email="admin@wargamebandit.is-a.dev",
        password_hash=hash_password("admin1234!"),
        role="admin",
    )
    session.add(admin)
    await session.flush()
    print(f"  [+] admin 유저 생성됨 (id={admin.id})")
    return admin.id


async def seed():
    """챌린지를 DB에 등록한다."""
    print("=== 챌린지 시드 시작 ===\n")

    async with async_session_factory() as session:
        admin_id = await ensure_admin_user(session)
        created = 0
        skipped = 0

        for data in CHALLENGES:
            # 중복 체크
            result = await session.execute(
                select(Challenge).where(Challenge.title == data["title"])
            )
            if result.scalar_one_or_none():
                print(f"  [=] 이미 존재: {data['title']}")
                skipped += 1
                continue

            flag = read_flag(data["flag_dir"])
            challenge = Challenge(
                title=data["title"],
                description=data["description"],
                category=data["category"],
                difficulty=data["difficulty"],
                points=data["points"],
                max_points=data["max_points"],
                min_points=data["min_points"],
                decay=data["decay"],
                flag_hash=hash_flag(flag),
                flag_type=data.get("flag_type", "static"),
                is_dynamic=data.get("is_dynamic", False),
                docker_image=data.get("docker_image"),
                docker_port=data.get("docker_port", 9001),
                files=data.get("files"),
                hints=data.get("hints"),
                tags=data.get("tags"),
                author_id=admin_id,
                source="official",
                review_status="approved",
                is_active=True,
            )
            session.add(challenge)
            created += 1
            print(f"  [+] 등록: [{data['category'].upper()}] {data['title']}")

        await session.commit()

    print(f"\n=== 완료: {created}개 등록, {skipped}개 건너뜀 ===")


if __name__ == "__main__":
    asyncio.run(seed())
