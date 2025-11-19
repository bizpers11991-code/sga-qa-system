#!/usr/bin/env python3
"""
Find Available Models on opencode.ai
This script tests different model name formats to find what works
"""

import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except:
    pass

from openai import OpenAI

print("=" * 60)
print("OPENCODE.AI MODEL FINDER")
print("=" * 60)

OPENCODE_KEY = os.environ.get("OPENCODE_API_KEY_1") or os.environ.get("OPENCODE_API_KEY")

if not OPENCODE_KEY:
    print("❌ No OPENCODE_API_KEY found!")
    sys.exit(1)

print(f"\n✓ Using API key: {OPENCODE_KEY[:20]}...\n")

client = OpenAI(
    api_key=OPENCODE_KEY,
    base_url="https://api.opencode.ai/v1"
)

# Possible model name formats based on common patterns
model_names = [
    # Grok variations
    "grok-code-fast-1",
    "x-ai/grok-code-fast-1",
    "xai/grok-code-fast-1",
    "grok-beta",
    "x-ai/grok-beta",
    "grok-2",
    "grok-1",

    # GPT-5 Nano variations
    "gpt-5-nano",
    "openai/gpt-5-nano",
    "gpt5-nano",
    "gpt-5n",

    # Other common formats
    "grok",
    "openai/gpt-4",
    "gpt-4",
    "gpt-3.5-turbo",
]

print("Testing model identifiers...\n")
working_models = []

for model_name in model_names:
    try:
        print(f"Testing: {model_name:30} ", end="", flush=True)

        response = client.chat.completions.create(
            model=model_name,
            messages=[{"role": "user", "content": "Hi"}],
            max_tokens=10
        )

        # Check if we got a valid response
        if isinstance(response, str):
            if "not found" in response.lower() or "error" in response.lower():
                print("✗ Not found")
            else:
                print(f"✓ WORKS! Response: {response[:40]}...")
                working_models.append(model_name)
        elif hasattr(response, 'choices'):
            content = response.choices[0].message.content
            print(f"✓ WORKS! Response: {content[:40]}...")
            working_models.append(model_name)
        else:
            print(f"? Unknown format: {type(response)}")

    except Exception as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            print("✗ Not found")
        else:
            print(f"✗ Error: {error_msg[:30]}...")

print("\n" + "=" * 60)
print("RESULTS")
print("=" * 60)

if working_models:
    print(f"\n✓ Found {len(working_models)} working model(s):\n")
    for model in working_models:
        print(f"  • {model}")

    print("\n💡 Use these in your .env or run_team_multi.py!")
else:
    print("\n❌ No working models found!")
    print("\n💡 Try checking opencode.ai documentation for model names:")
    print("   https://opencode.ai/docs")

print("\n" + "=" * 60)
