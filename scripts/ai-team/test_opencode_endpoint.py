#!/usr/bin/env python3
"""
Test opencode.ai endpoints to find the correct one
"""
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

API_KEY = os.environ.get("OPENCODE_API_KEY_1")

if not API_KEY:
    print("❌ No OPENCODE_API_KEY_1 found in .env")
    exit(1)

print("🔍 Testing opencode.ai endpoints...\n")

# Test different base URLs and models
tests = [
    {
        "name": "Standard API v1",
        "base_url": "https://api.opencode.ai/v1",
        "models": ["grok-code", "x-ai/grok-code-fast-1", "gpt-5-nano"]
    },
    {
        "name": "Zen API endpoint",
        "base_url": "https://opencode.ai/zen/v1/chat/completions",
        "models": ["grok-code", "grok-beta", "gpt-5-nano"]
    },
    {
        "name": "Direct Zen API",
        "base_url": "https://opencode.ai/zen/v1",
        "models": ["grok-code", "gpt-5-nano"]
    }
]

for test in tests:
    print(f"📍 {test['name']}")
    print(f"   URL: {test['base_url']}")
    print()

    for model in test['models']:
        try:
            client = OpenAI(
                api_key=API_KEY,
                base_url=test['base_url']
            )

            print(f"  Testing {model}...", end=" ")

            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=10
            )

            # Check if response is valid
            if isinstance(response, str):
                print(f"✗ Error: {response[:50]}")
            elif hasattr(response, 'choices'):
                content = response.choices[0].message.content
                print(f"✓ WORKS! Response: {content[:40]}...")
            else:
                print(f"? Unexpected response type: {type(response)}")

        except Exception as e:
            error_msg = str(e)
            if "not found" in error_msg.lower():
                print(f"✗ Model not found")
            else:
                print(f"✗ {error_msg[:60]}...")

    print()

print("\n💡 Check https://opencode.ai/docs or your account dashboard for correct endpoint/models")
