#!/usr/bin/env python3
"""Hidden in Plain Sight - 파일 생성 스크립트.

평범한 텍스트 뒤에 NULL 바이트 패딩 + 숨겨진 플래그를 삽입한다.
"""

import os

# Read flag from flag.txt (not committed to repo)
flag_path = os.path.join(os.path.dirname(__file__), "flag.txt")
FLAG = open(flag_path, "r").read().strip().encode()

visible_text = b"""=== WARGAME BANDITS ===

Welcome to the Wargame Bandits platform!

This is a practice file for forensics challenges.
Can you find the hidden message?

Sometimes the most important things are invisible to the eye.
Look deeper, and you shall find what you seek.

=== END OF FILE ===
"""

output_path = os.path.join(os.path.dirname(__file__), "files", "message.txt")

with open(output_path, "wb") as f:
    f.write(visible_text)
    # NULL 바이트 패딩 (텍스트 에디터에서는 여기서 끝나는 것처럼 보임)
    f.write(b"\x00" * 256)
    # 숨겨진 플래그
    f.write(b"SECRET: ")
    f.write(FLAG)
    f.write(b"\n")

print(f"Generated {output_path}")
print(f"Visible size: {len(visible_text)} bytes")
print(f"Total size: {len(visible_text) + 256 + 8 + len(FLAG) + 1} bytes")
