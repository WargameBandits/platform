#!/usr/bin/env python3
"""Baby RSA - 챌린지 파일.

아주 작은 RSA 키로 암호화된 메시지입니다.
n을 소인수분해하여 복호화하세요.
"""

# RSA 파라미터
n = 323       # p * q (너무 작아서 소인수분해 가능!)
e = 65537     # 공개 지수
c = 245       # 암호문 = pow(m, e, n)

# 복호화 후 평문 m을 BNDT{m} 형식으로 제출하세요.
# 예: 평문이 42이면 BNDT{42}

print(f"n = {n}")
print(f"e = {e}")
print(f"c = {c}")
print()
print("Decrypt the ciphertext to find the plaintext m.")
print("Submit as BNDT{m}")
