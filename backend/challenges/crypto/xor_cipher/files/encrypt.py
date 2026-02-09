#!/usr/bin/env python3
"""XOR Me - 암호화 스크립트 (출제자용).

단일 바이트 XOR로 플래그를 암호화하여 encrypted.bin을 생성한다.
이 파일은 참가자에게도 제공되어 암호화 방식을 파악할 수 있게 한다.
"""

import os

KEY = 0x13
# Read flag from flag.txt (not committed to repo)
flag_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "flag.txt")
FLAG = open(flag_path, "r").read().strip().encode()


def xor_encrypt(data: bytes, key: int) -> bytes:
    """단일 바이트 XOR 암호화."""
    return bytes(b ^ key for b in data)


if __name__ == "__main__":
    encrypted = xor_encrypt(FLAG, KEY)
    with open("encrypted.bin", "wb") as f:
        f.write(encrypted)
    print(f"Encrypted {len(FLAG)} bytes with key 0x{KEY:02x}")
    print(f"Output: encrypted.bin")
