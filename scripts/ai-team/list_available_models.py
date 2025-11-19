#!/usr/bin/env python3
"""
List ALL Available Models
This script queries APIs to show what models you can actually use
"""

import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except:
    pass

print("=" * 70)
print("DISCOVERING AVAILABLE MODELS")
print("=" * 70)

# =============================================================================
# 1. GEMINI MODELS
# =============================================================================
print("\n1️⃣ GEMINI MODELS")
print("-" * 70)

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

if GOOGLE_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)

        print("Fetching available Gemini models...\n")

        # List all available models
        models = genai.list_models()

        print("✓ Available Gemini models:\n")
        for model in models:
            # Check if it supports generateContent
            if 'generateContent' in model.supported_generation_methods:
                print(f"  ✓ {model.name}")
                print(f"    Display: {model.display_name}")
                print(f"    Methods: {', '.join(model.supported_generation_methods)}")
                print()

    except Exception as e:
        print(f"✗ Error listing Gemini models: {e}")
        import traceback
        traceback.print_exc()
else:
    print("⊘ No GOOGLE_API_KEY found")

# =============================================================================
# 2. OPENCODE.AI MODELS
# =============================================================================
print("\n2️⃣ OPENCODE.AI MODELS")
print("-" * 70)

OPENCODE_KEY = os.environ.get("OPENCODE_API_KEY_1") or os.environ.get("OPENCODE_API_KEY")

if OPENCODE_KEY:
    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=OPENCODE_KEY,
            base_url="https://api.opencode.ai/v1"
        )

        print("Fetching available opencode.ai models...\n")

        # Try to list models
        try:
            models = client.models.list()
            print("✓ Available opencode.ai models:\n")

            for model in models.data:
                print(f"  ✓ {model.id}")
                if hasattr(model, 'owned_by'):
                    print(f"    Owner: {model.owned_by}")
                print()

        except Exception as e:
            print(f"⚠️  Could not list models via API: {e}")
            print("\nTrying manual model discovery...\n")

            # Common model names to try
            test_models = [
                # OpenAI style
                "gpt-4-turbo-preview",
                "gpt-4",
                "gpt-3.5-turbo",

                # Anthropic style
                "claude-3-opus",
                "claude-3-sonnet",

                # xAI style
                "grok-beta",

                # Meta style
                "llama-3-70b",
                "llama-2-70b",

                # Google style
                "gemini-pro",

                # Mistral style
                "mistral-large",
                "mixtral-8x7b",
            ]

            print("Testing common model names...\n")
            working_models = []

            for model_name in test_models:
                try:
                    response = client.chat.completions.create(
                        model=model_name,
                        messages=[{"role": "user", "content": "Hi"}],
                        max_tokens=5
                    )

                    if not isinstance(response, str) or "not found" not in response.lower():
                        print(f"  ✓ {model_name} - WORKS!")
                        working_models.append(model_name)
                except Exception as e:
                    if "not found" not in str(e).lower():
                        print(f"  ? {model_name} - {str(e)[:50]}...")

            if working_models:
                print(f"\n✓ Found {len(working_models)} working models!")
            else:
                print("\n✗ No working models found with common names")

    except Exception as e:
        print(f"✗ Error with opencode.ai: {e}")
        import traceback
        traceback.print_exc()
else:
    print("⊘ No OPENCODE_API_KEY found")

# =============================================================================
# RECOMMENDATIONS
# =============================================================================
print("\n" + "=" * 70)
print("RECOMMENDATIONS")
print("=" * 70)

print("\n📚 Check these documentation pages:")
print("  • Gemini: https://ai.google.dev/models/gemini")
print("  • opencode.ai: https://opencode.ai/docs/models")
print("  • OpenRouter (similar): https://openrouter.ai/models")

print("\n💡 Next steps:")
print("  1. Check the opencode.ai dashboard for your available models")
print("  2. Look for model names in your opencode.ai account settings")
print("  3. Try the OpenRouter format if opencode.ai uses that")

print("\n" + "=" * 70)
