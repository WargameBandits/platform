#!/usr/bin/env python3
"""Base Madness - 인코딩 스크립트.

플래그를 3겹의 인코딩으로 감싼다: Base64 → Hex → Base64.
디코딩 순서: Base64 → Hex → Base64 → 원문
"""

import base64
import os

# Read flag from flag.txt (not committed to repo)
flag_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "flag.txt")
FLAG = open(flag_path, "r").read().strip().encode()

# Layer 1: Base64
layer1 = base64.b64encode(FLAG)
print(f"Layer 1 (base64): {layer1}")

# Layer 2: Hex encode
layer2 = layer1.hex().encode()
print(f"Layer 2 (hex):    {layer2}")

# Layer 3: Base64 again
layer3 = base64.b64encode(layer2)
print(f"Layer 3 (base64): {layer3}")

output_path = os.path.join(os.path.dirname(__file__), "encoded.txt")
with open(output_path, "w") as f:
    f.write(layer3.decode() + "\n")

print(f"\nGenerated {output_path}")

# Verify decoding
print("\n=== Verification ===")
d1 = base64.b64decode(layer3)
print(f"Decode base64: {d1}")
d2 = bytes.fromhex(d1.decode())
print(f"Decode hex:    {d2}")
d3 = base64.b64decode(d2)
print(f"Decode base64: {d3}")
assert d3 == FLAG
print("OK!")
