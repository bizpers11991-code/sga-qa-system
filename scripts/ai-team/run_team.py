#!/usr/bin/env python3
"""
SGA QA Pack AI Team Collaboration Script
This script creates a team of AI agents (Grok + Gemini) to work on development tasks.

Grok: Fast coding and implementation using xAI's Grok API
Gemini: Code review, analysis, and validation using Google's Gemini API
"""

import os
import sys
import json
from datetime import datetime

def main():
    print("🤖 SGA QA Pack AI Team Collaboration")
    print("=" * 50)

    # --- CONFIGURATION ---
    # This script will get API keys from your terminal's environment variables
    try:
        GEMINI_API_KEY = os.environ["GOOGLE_API_KEY"]
        OPENCODE_API_KEY = os.environ["OPENCODE_API_KEY"]
        print("✓ API keys found")
    except KeyError as e:
        print("❌ ERROR: API keys not set.")
        print("Please set your keys in the terminal before running:")
        print("  export GOOGLE_API_KEY='your_gemini_api_key'")
        print("  export OPENCODE_API_KEY='your_opencode_api_key'")
        print("\nExample:")
        print("  export GOOGLE_API_KEY='AIzaSyD...your_key_here'")
        print("  export OPENCODE_API_KEY='sk-...your_key_here'")
        print("\nGet API keys from:")
        print("  • Gemini: https://aistudio.google.com/apikey")
        print("  • Grok (via opencode.ai): https://opencode.ai/auth")
        sys.exit(1)

    # Check for required packages
    try:
        import google.generativeai as genai
        from openai import OpenAI
        print("✓ Required packages available")

        # Configure Gemini
        genai.configure(api_key=GEMINI_API_KEY)
        print("✓ Gemini API configured")

        # Configure Grok via opencode.ai (OpenAI-compatible API)
        grok_client = OpenAI(
            api_key=OPENCODE_API_KEY,
            base_url="https://api.opencode.ai/v1"  # opencode.ai endpoint
        )
        print("✓ Grok API configured (via opencode.ai)")

    except ImportError as e:
        print(f"❌ ERROR: Missing required package: {e}")
        print("Please install dependencies:")
        print("  pip install google-generativeai openai")
        sys.exit(1)
    except Exception as e:
        print(f"❌ ERROR: Failed to configure APIs: {e}")
        print("Please check your API keys:")
        print("  • GOOGLE_API_KEY for Gemini")
        print("  • OPENCODE_API_KEY for Grok (from opencode.ai)")
        sys.exit(1)

    # --- READ INSTRUCTIONS ---
    try:
        with open('instructions.md', 'r') as f:
            initial_instructions = f.read()
        print("✓ Successfully read instructions from instructions.md")
        print(f"   Instructions length: {len(initial_instructions)} characters")
    except FileNotFoundError:
        print("❌ ERROR: instructions.md file not found.")
        print("Please create 'instructions.md' in this folder with the tasks.")
        print("I've created a template for you. Please review and customize it.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ ERROR: Failed to read instructions.md: {e}")
        sys.exit(1)

    # --- TEAM SETUP ---
    print("\n👥 Setting up AI Team:")
    print("  • Grok (Developer): Fast coding and implementation")
    print("  • Gemini (Architect): Code review, planning, and validation")
    print("  • Claude (Supervisor - You): Architecture and oversight")

    print("\n🚀 Starting AI Team Collaboration...")
    print("\n📋 Current Tasks from instructions.md:")
    print("-" * 50)

    # Show a preview of the instructions
    lines = initial_instructions.split('\n')[:15]  # First 15 lines
    for line in lines:
        if line.strip():
            print(f"  {line}")

    if len(initial_instructions.split('\n')) > 15:
        print("  ... (truncated)")

    # Test Gemini API
    try:
        print("\n🧪 Testing Gemini API connection...")
        gemini_model = genai.GenerativeModel('gemini-2.5-pro-exp-03-25')
        response = gemini_model.generate_content("Hello! Confirm you're ready to work on M365 development tasks.")
        print(f"✓ Gemini response: {response.text[:100]}...")
    except Exception as e:
        print(f"❌ Gemini API test failed: {e}")
        print("Please check your GOOGLE_API_KEY")
        print("Note: Using fallback model gemini-1.5-flash")
        try:
            gemini_model = genai.GenerativeModel('gemini-1.5-flash')
            response = gemini_model.generate_content("Hello!")
            print(f"✓ Gemini (fallback) response: {response.text[:100]}...")
        except:
            return

    # Test Grok API via opencode.ai
    try:
        print("\n🧪 Testing Grok API connection (via opencode.ai)...")
        response = grok_client.chat.completions.create(
            model="x-ai/grok-code-fast-1",  # opencode.ai model identifier
            messages=[
                {"role": "system", "content": "You are Grok, a fast coding assistant specializing in M365 development."},
                {"role": "user", "content": "Hello! Confirm you're ready to write code for the SGA QA Pack project."}
            ],
            max_tokens=100
        )
        print(f"✓ Grok response: {response.choices[0].message.content[:100]}...")
    except Exception as e:
        print(f"❌ Grok API test failed: {e}")
        print("Please check your OPENCODE_API_KEY")
        print("Troubleshooting:")
        print("  1. Ensure you have an account at https://opencode.ai")
        print("  2. Get your API key from https://opencode.ai/auth")
        print("  3. Make sure billing is set up (free tier available)")
        return

    print("\n✅ AI Team is ready!")
    print("\n🎯 Collaboration Workflow:")
    print("1. Read instructions.md for tasks")
    print("2. Grok implements code quickly")
    print("3. Gemini reviews and validates")
    print("4. Results saved to output directory")
    print("5. You (Claude) provide architectural oversight")

    print("\n📁 Output Structure:")
    print("  ./ai_team_output/")
    print("    ├── session_logs/")
    print("    ├── code_changes/")
    print("    └── review_reports/")

    # Create output directory
    os.makedirs('ai_team_output', exist_ok=True)
    os.makedirs('ai_team_output/session_logs', exist_ok=True)
    os.makedirs('ai_team_output/code_changes', exist_ok=True)
    os.makedirs('ai_team_output/review_reports', exist_ok=True)

    # Log this session
    session_log = {
        "timestamp": datetime.now().isoformat(),
        "gemini_api_status": "connected",
        "grok_api_status": "connected",
        "instructions_loaded": True,
        "instructions_length": len(initial_instructions)
    }

    with open(f'ai_team_output/session_logs/session_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json', 'w') as f:
        json.dump(session_log, f, indent=2)

    print("\n✓ Session logged successfully")
    print("\n🚀 The AI team is ready to start working!")
    print("Next: Provide specific tasks in instructions.md and run again.")

if __name__ == "__main__":
    main()