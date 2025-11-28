#!/usr/bin/env python3
"""
Quick test script to check which AI providers are configured and working.
Run this to verify your setup before using the enhanced orchestrator.
"""

import os
import sys
import time
from dotenv import load_dotenv

load_dotenv()

def test_gemini():
    """Test Google Gemini API"""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return False, "GOOGLE_API_KEY not set"
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content("Say 'OK' if you can hear me")
        return True, f"Response: {response.text[:50]}..."
    except Exception as e:
        return False, str(e)

def test_groq():
    """Test Groq API"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return False, "GROQ_API_KEY not set"
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "Say 'OK'"}],
            max_tokens=10
        )
        return True, f"Response: {response.choices[0].message.content}"
    except Exception as e:
        return False, str(e)

def test_cerebras():
    """Test Cerebras API"""
    api_key = os.getenv("CEREBRAS_API_KEY")
    if not api_key:
        return False, "CEREBRAS_API_KEY not set"
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url="https://api.cerebras.ai/v1")
        response = client.chat.completions.create(
            model="llama-3.1-8b",
            messages=[{"role": "user", "content": "Say 'OK'"}],
            max_tokens=10
        )
        return True, f"Response: {response.choices[0].message.content}"
    except Exception as e:
        return False, str(e)

def test_openrouter():
    """Test OpenRouter API"""
    api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENROUTER_API_KEY_1")
    if not api_key:
        return False, "OPENROUTER_API_KEY not set"
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
        response = client.chat.completions.create(
            model="meta-llama/llama-3.2-3b-instruct:free",
            messages=[{"role": "user", "content": "Say 'OK'"}],
            max_tokens=10
        )
        return True, f"Response: {response.choices[0].message.content}"
    except Exception as e:
        return False, str(e)

def test_together():
    """Test Together.ai API"""
    api_key = os.getenv("TOGETHER_API_KEY")
    if not api_key:
        return False, "TOGETHER_API_KEY not set"
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url="https://api.together.xyz/v1")
        response = client.chat.completions.create(
            model="meta-llama/Llama-3.2-3B-Instruct-Turbo",
            messages=[{"role": "user", "content": "Say 'OK'"}],
            max_tokens=10
        )
        return True, f"Response: {response.choices[0].message.content}"
    except Exception as e:
        return False, str(e)

def test_opencode():
    """Test OpenCode (Grok) API"""
    api_key = os.getenv("OPENCODE_API_KEY") or os.getenv("OPENCODE_API_KEY_1")
    if not api_key:
        return False, "OPENCODE_API_KEY not set"
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key, base_url="https://api.opencode.ai/v1")
        response = client.chat.completions.create(
            model="x-ai/grok-code-fast-1",
            messages=[{"role": "user", "content": "Say 'OK'"}],
            max_tokens=10
        )
        return True, f"Response: {response.choices[0].message.content}"
    except Exception as e:
        return False, str(e)


def main():
    print("=" * 60)
    print("🧪 SGA AI Team - Provider Test")
    print("=" * 60)
    print()
    
    providers = [
        ("Google Gemini", test_gemini, "https://aistudio.google.com/apikey"),
        ("Groq", test_groq, "https://console.groq.com"),
        ("Cerebras", test_cerebras, "https://cloud.cerebras.ai"),
        ("OpenRouter", test_openrouter, "https://openrouter.ai/keys"),
        ("Together.ai", test_together, "https://together.ai"),
        ("OpenCode (Grok)", test_opencode, "https://opencode.ai/auth"),
    ]
    
    results = []
    
    for name, test_func, url in providers:
        print(f"Testing {name}...", end=" ", flush=True)
        start = time.time()
        success, message = test_func()
        elapsed = time.time() - start
        
        if success:
            print(f"✅ ({elapsed:.2f}s)")
            results.append((name, True, elapsed))
        else:
            print(f"❌")
            print(f"   Error: {message}")
            print(f"   Get key: {url}")
            results.append((name, False, 0))
        print()
    
    # Summary
    print("=" * 60)
    print("📊 Summary")
    print("=" * 60)
    
    working = [r for r in results if r[1]]
    not_working = [r for r in results if not r[1]]
    
    if working:
        print(f"\n✅ Working providers ({len(working)}):")
        for name, _, elapsed in working:
            print(f"   • {name} ({elapsed:.2f}s)")
    
    if not_working:
        print(f"\n❌ Not configured ({len(not_working)}):")
        for name, _, _ in not_working:
            print(f"   • {name}")
    
    print()
    
    if len(working) >= 2:
        print("🎉 You have enough providers for robust AI task execution!")
    elif len(working) == 1:
        print("⚠️  Only one provider working. Consider adding more for redundancy.")
    else:
        print("❌ No providers working. Please configure at least one API key.")
        print("   Fastest to set up: Groq (https://console.groq.com)")


if __name__ == "__main__":
    main()
