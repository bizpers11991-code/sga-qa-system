#!/usr/bin/env python3
"""
Test both opencode.ai accounts with correct endpoint
"""
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

KEY1 = os.environ.get("OPENCODE_API_KEY_1")
KEY2 = os.environ.get("OPENCODE_API_KEY_2")

BASE_URL = "https://opencode.ai/zen/v1"
MODEL = "grok-code"

print("=" * 60)
print("🧪 Testing Both opencode.ai Accounts")
print("=" * 60)

if KEY1:
    print("\n✓ Account 1 key found")
    try:
        client1 = OpenAI(api_key=KEY1, base_url=BASE_URL)
        response = client1.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": "Say 'Account 1 ready!'"}],
            max_tokens=20
        )
        print(f"✅ Account 1 WORKS: {response.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Account 1 FAILED: {e}")
else:
    print("\n❌ No Account 1 key")

if KEY2:
    print("\n✓ Account 2 key found")
    try:
        client2 = OpenAI(api_key=KEY2, base_url=BASE_URL)
        response = client2.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": "Say 'Account 2 ready!'"}],
            max_tokens=20
        )
        print(f"✅ Account 2 WORKS: {response.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Account 2 FAILED: {e}")
else:
    print("\n❌ No Account 2 key")

print("\n" + "=" * 60)
print("Correct Configuration:")
print(f"  Base URL: {BASE_URL}")
print(f"  Model: {MODEL}")
print("=" * 60)
