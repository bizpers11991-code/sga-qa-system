#!/usr/bin/env python3
"""
Quick API Connection Test
Tests each API individually to diagnose issues
"""

import os
import sys

# Try to load .env
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✓ Loaded .env file\n")
except:
    print("⚠️  No .env file or python-dotenv not installed\n")

print("=" * 60)
print("API CONNECTION DIAGNOSTICS")
print("=" * 60)

# Test 1: Check API keys
print("\n1️⃣ Checking API Keys...")
print("-" * 60)

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
OPENCODE_KEY_1 = os.environ.get("OPENCODE_API_KEY_1") or os.environ.get("OPENCODE_API_KEY")
OPENCODE_KEY_2 = os.environ.get("OPENCODE_API_KEY_2")
OPENCODE_KEY_3 = os.environ.get("OPENCODE_API_KEY_3")
OPENROUTER_KEY_1 = os.environ.get("OPENROUTER_API_KEY_1") or os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_KEY_2 = os.environ.get("OPENROUTER_API_KEY_2")

if GOOGLE_API_KEY:
    print(f"✓ GOOGLE_API_KEY: {GOOGLE_API_KEY[:20]}...")
else:
    print("✗ GOOGLE_API_KEY: Not found")

if OPENCODE_KEY_1:
    print(f"✓ OPENCODE_API_KEY_1: {OPENCODE_KEY_1[:20]}...")
else:
    print("✗ OPENCODE_API_KEY_1: Not found")

if OPENCODE_KEY_2:
    print(f"✓ OPENCODE_API_KEY_2: {OPENCODE_KEY_2[:20]}...")
else:
    print("⚠ OPENCODE_API_KEY_2: Not found (optional)")

if OPENCODE_KEY_3:
    print(f"✓ OPENCODE_API_KEY_3: {OPENCODE_KEY_3[:20]}...")
else:
    print("⚠ OPENCODE_API_KEY_3: Not found (optional)")

if OPENROUTER_KEY_1:
    print(f"✓ OPENROUTER_API_KEY_1: {OPENROUTER_KEY_1[:20]}... (Qwen 2.5 Coder)")
else:
    print("⚠ OPENROUTER_API_KEY_1: Not found (optional)")

if OPENROUTER_KEY_2:
    print(f"✓ OPENROUTER_API_KEY_2: {OPENROUTER_KEY_2[:20]}... (DeepSeek Coder)")
else:
    print("⚠ OPENROUTER_API_KEY_2: Not found (optional)")

# Test 2: Test Gemini
print("\n2️⃣ Testing Gemini API...")
print("-" * 60)

if GOOGLE_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)

        # Try different models (updated to use 'models/' prefix)
        models_to_try = [
            'models/gemini-2.5-flash',
            'models/gemini-2.5-pro',
            'models/gemini-2.0-flash'
        ]

        for model_name in models_to_try:
            try:
                print(f"\nTrying {model_name}...")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content("Say 'Hello'")
                print(f"✓ {model_name} works!")
                print(f"  Response: {response.text[:60]}...")
                break
            except Exception as e:
                print(f"✗ {model_name} failed: {e}")
                continue

    except Exception as e:
        print(f"✗ Gemini test failed: {e}")
else:
    print("⊘ Skipped - No API key")

# Test 3: Test opencode.ai Account 1
print("\n3️⃣ Testing opencode.ai Account 1 (Grok)...")
print("-" * 60)

if OPENCODE_KEY_1:
    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=OPENCODE_KEY_1,
            base_url="https://opencode.ai/zen/v1"
        )

        print("Sending test request...")
        response = client.chat.completions.create(
            model="grok-code",
            messages=[
                {"role": "user", "content": "Say 'Hello'"}
            ],
            max_tokens=50
        )

        print(f"✓ Connection successful!")
        print(f"  Response type: {type(response)}")
        print(f"  Has 'choices': {hasattr(response, 'choices')}")

        if hasattr(response, 'choices'):
            print(f"  Response: {response.choices[0].message.content[:60]}...")
        else:
            print(f"  Raw response: {str(response)[:200]}...")

    except Exception as e:
        print(f"✗ opencode.ai Account 1 test failed:")
        print(f"  Error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("⊘ Skipped - No API key")

# Test 4: Test opencode.ai Account 2
print("\n4️⃣ Testing opencode.ai Account 2 (Grok)...")
print("-" * 60)

if OPENCODE_KEY_2:
    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=OPENCODE_KEY_2,
            base_url="https://opencode.ai/zen/v1"
        )

        print("Sending test request...")
        response = client.chat.completions.create(
            model="grok-code",
            messages=[
                {"role": "user", "content": "Say 'Hello'"}
            ],
            max_tokens=50
        )

        print(f"✓ Connection successful!")
        print(f"  Response type: {type(response)}")

        if hasattr(response, 'choices'):
            print(f"  Response: {response.choices[0].message.content[:60]}...")
        else:
            print(f"  Raw response: {str(response)[:200]}...")

    except Exception as e:
        print(f"✗ opencode.ai Account 2 test failed: {e}")
else:
    print("⊘ Skipped - No API key")

# Test 5: Test opencode.ai Account 3 (GPT-5 Nano)
print("\n5️⃣ Testing opencode.ai Account 3 (GPT-5 Nano)...")
print("-" * 60)

if OPENCODE_KEY_3:
    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=OPENCODE_KEY_3,
            base_url="https://opencode.ai/zen/v1"
        )

        print("Sending test request to gpt-5-nano...")
        response = client.chat.completions.create(
            model="gpt-5-nano",
            messages=[
                {"role": "user", "content": "Say 'Hello'"}
            ],
            max_tokens=50
        )

        print(f"✓ Connection successful!")
        print(f"  Response type: {type(response)}")

        if hasattr(response, 'choices'):
            print(f"  Response: {response.choices[0].message.content[:60]}...")
        else:
            print(f"  Raw response: {str(response)[:200]}...")

    except Exception as e:
        print(f"✗ opencode.ai Account 3 test failed: {e}")
else:
    print("⊘ Skipped - No API key")

# Test 6: Test OpenRouter Account 1 (Qwen 2.5 Coder)
print("\n6️⃣ Testing OpenRouter Account 1 (Qwen 2.5 Coder)...")
print("-" * 60)

if OPENROUTER_KEY_1:
    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=OPENROUTER_KEY_1,
            base_url="https://openrouter.ai/api/v1"
        )

        print("Testing qwen/qwen-2.5-coder-32b-instruct (FREE)...")
        response = client.chat.completions.create(
            model="qwen/qwen-2.5-coder-32b-instruct",
            messages=[
                {"role": "user", "content": "Say 'Ready for code generation'"}
            ],
            max_tokens=50
        )

        if hasattr(response, 'choices') and len(response.choices) > 0:
            print(f"✓ Qwen 2.5 Coder works!")
            print(f"  Response: {response.choices[0].message.content[:60]}...")
        else:
            print(f"✗ Unexpected format: {type(response)}")

    except Exception as e:
        print(f"✗ OpenRouter Account 1 test failed: {e}")
else:
    print("⊘ Skipped - No API key")

# Test 7: Test OpenRouter Account 2 (DeepSeek Coder)
print("\n7️⃣ Testing OpenRouter Account 2 (DeepSeek Coder)...")
print("-" * 60)

if OPENROUTER_KEY_2:
    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=OPENROUTER_KEY_2,
            base_url="https://openrouter.ai/api/v1"
        )

        print("Testing deepseek/deepseek-coder (FREE)...")
        response = client.chat.completions.create(
            model="deepseek/deepseek-coder",
            messages=[
                {"role": "user", "content": "Say 'Ready for code review'"}
            ],
            max_tokens=50
        )

        if hasattr(response, 'choices') and len(response.choices) > 0:
            print(f"✓ DeepSeek Coder works!")
            print(f"  Response: {response.choices[0].message.content[:60]}...")
        else:
            print(f"✗ Unexpected format: {type(response)}")

    except Exception as e:
        print(f"✗ OpenRouter Account 2 test failed: {e}")
else:
    print("⊘ Skipped - No API key")

# Summary
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)

working = []
if GOOGLE_API_KEY:
    working.append("Gemini")
if OPENCODE_KEY_1:
    working.append("opencode.ai-1")
if OPENCODE_KEY_2:
    working.append("opencode.ai-2")
if OPENCODE_KEY_3:
    working.append("opencode.ai-3")
if OPENROUTER_KEY_1:
    working.append("OpenRouter-1 (Qwen)")
if OPENROUTER_KEY_2:
    working.append("OpenRouter-2 (DeepSeek)")

if working:
    print(f"✓ Working APIs: {', '.join(working)}")
else:
    print("✗ No APIs configured")

print("\n💡 Next Steps:")
if not GOOGLE_API_KEY:
    print("  - Get Gemini API key: https://aistudio.google.com/apikey")
if not OPENCODE_KEY_1:
    print("  - Get opencode.ai Account 1 key: https://opencode.ai/auth")
if not OPENCODE_KEY_2:
    print("  - Get opencode.ai Account 2 key: https://opencode.ai/auth (2nd account)")
if not OPENCODE_KEY_3:
    print("  - Get opencode.ai Account 3 key: https://opencode.ai/auth (3rd account for GPT-5 Nano)")
if not OPENROUTER_KEY_1:
    print("  - Get OpenRouter Account 1 key: https://openrouter.ai/keys (Qwen 2.5 Coder - FREE!)")
if not OPENROUTER_KEY_2:
    print("  - Get OpenRouter Account 2 key: https://openrouter.ai/keys (DeepSeek Coder - FREE!)")

print("\n" + "=" * 60)
