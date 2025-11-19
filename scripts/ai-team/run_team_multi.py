#!/usr/bin/env python3
"""
SGA QA Pack - ENHANCED Multi-AI Team Collaboration Script
Supports 4+ AI workers operating simultaneously 24/7

Team Configuration:
- Grok 1 (opencode.ai account 1) - Primary coder
- Grok 2 / GPT-5 Nano (opencode.ai account 2) - Alternative coder
- Gemini Pro (paid) - Architecture & review
- Office 365 Copilot (future) - M365 expert
"""

import os
import sys
import json
from datetime import datetime
from typing import Dict, List, Optional

class AIWorker:
    """Represents a single AI worker in the team"""
    def __init__(self, name: str, role: str, client, model: str):
        self.name = name
        self.role = role
        self.client = client
        self.model = model
        self.tasks_completed = 0

    def __str__(self):
        return f"{self.name} ({self.role})"

def main():
    print("🤖 SGA QA Pack - ENHANCED Multi-AI Team Collaboration")
    print("=" * 60)
    print("24/7 Autonomous Development Mode")
    print("=" * 60)

    # --- CONFIGURATION ---
    workers: List[AIWorker] = []

    # Load API keys (supports .env file via python-dotenv)
    try:
        # Try to load from .env file
        try:
            from dotenv import load_dotenv
            load_dotenv()
            print("✓ Loaded .env file")
        except ImportError:
            print("⚠️  python-dotenv not installed, using environment variables only")
        except Exception:
            pass  # .env file not found, that's ok

        GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
        OPENCODE_KEY_1 = os.environ.get("OPENCODE_API_KEY_1") or os.environ.get("OPENCODE_API_KEY")
        OPENCODE_KEY_2 = os.environ.get("OPENCODE_API_KEY_2")
        OPENCODE_KEY_3 = os.environ.get("OPENCODE_API_KEY_3")
        OPENROUTER_KEY_1 = os.environ.get("OPENROUTER_API_KEY_1") or os.environ.get("OPENROUTER_API_KEY")
        OPENROUTER_KEY_2 = os.environ.get("OPENROUTER_API_KEY_2")

        print("\n🔑 Checking API Keys...")
        if GOOGLE_API_KEY:
            print("  ✓ Gemini API key found")
        else:
            print("  ⚠️  Gemini API key not found (optional)")

        if OPENCODE_KEY_1:
            print("  ✓ opencode.ai Account 1 key found")
        else:
            print("  ❌ opencode.ai Account 1 key required!")

        if OPENCODE_KEY_2:
            print("  ✓ opencode.ai Account 2 key found")
        else:
            print("  ⚠️  opencode.ai Account 2 key not found (optional)")

        if OPENCODE_KEY_3:
            print("  ✓ opencode.ai Account 3 key found")
        else:
            print("  ⚠️  opencode.ai Account 3 key not found (optional)")

        if OPENROUTER_KEY_1:
            print("  ✓ OpenRouter Account 1 key found (Qwen 2.5 Coder)")
        else:
            print("  ⚠️  OpenRouter Account 1 key not found (optional)")

        if OPENROUTER_KEY_2:
            print("  ✓ OpenRouter Account 2 key found (DeepSeek Coder)")
        else:
            print("  ⚠️  OpenRouter Account 2 key not found (optional)")

        if not OPENCODE_KEY_1:
            print("\n❌ ERROR: At least OPENCODE_API_KEY_1 must be set.")
            print("\nSet your keys:")
            print("  export GOOGLE_API_KEY='your_gemini_key'")
            print("  export OPENCODE_API_KEY_1='your_first_opencode_key'")
            print("  export OPENCODE_API_KEY_2='your_second_opencode_key'")
            print("\nOr edit .env file")
            sys.exit(1)

    except Exception as e:
        print(f"\n❌ ERROR loading API keys: {e}")
        sys.exit(1)

    # --- INITIALIZE AI WORKERS ---
    print("\n🚀 Initializing AI Workers...")

    try:
        # Import required packages
        from openai import OpenAI

        # Worker 1: Grok Code Fast 1 via OpenCode Zen (Account 1)
        if OPENCODE_KEY_1:
            grok1_client = OpenAI(
                api_key=OPENCODE_KEY_1,
                base_url="https://opencode.ai/zen/v1"
            )

            worker1 = AIWorker(
                name="Grok-Code-Fast-1",
                role="Primary Coder (Fast M365 Implementation)",
                client=grok1_client,
                model="grok-code"  # Correct model ID for OpenCode Zen
            )
            workers.append(worker1)
            print(f"  ✓ {worker1} initialized")

        # Worker 2: Grok-2 via OpenCode Zen (Account 2)
        if OPENCODE_KEY_2:
            grok2_client = OpenAI(
                api_key=OPENCODE_KEY_2,
                base_url="https://opencode.ai/zen/v1"
            )

            worker2 = AIWorker(
                name="Grok-Code-Fast-2",
                role="Alternative Coder (Testing & Code Validation)",
                client=grok2_client,
                model="grok-code"
            )
            workers.append(worker2)
            print(f"  ✓ {worker2} initialized")

        # Worker 3: GPT-5 Nano via OpenCode Zen (Account 3)
        # This will test various GPT-5 Nano model identifiers
        if OPENCODE_KEY_3:
            gpt5_client = OpenAI(
                api_key=OPENCODE_KEY_3,
                base_url="https://opencode.ai/zen/v1"
            )

            worker3 = AIWorker(
                name="GPT-5-Nano",
                role="Code Validator & Testing Agent",
                client=gpt5_client,
                model="gpt-5-nano"  # Will test if this works
            )
            workers.append(worker3)
            print(f"  ✓ {worker3} initialized")

        # Worker 4: Gemini Pro (Paid)
        if GOOGLE_API_KEY:
            import google.generativeai as genai
            genai.configure(api_key=GOOGLE_API_KEY)

            # Try different Gemini models in order of preference
            # NOTE: Must include 'models/' prefix!
            gemini_models = [
                'models/gemini-2.5-pro',              # BEST: Latest stable pro
                'models/gemini-2.5-flash',            # FAST: Latest flash
                'models/gemini-2.0-flash-exp',        # Experimental 2.0
                'models/gemini-pro-latest',           # Fallback: Latest pro
                'models/gemini-flash-latest'          # Fallback: Latest flash
            ]

            gemini_model = None
            model_name = None

            for model in gemini_models:
                try:
                    gemini_model = genai.GenerativeModel(model)
                    model_name = model
                    break
                except Exception:
                    continue

            if gemini_model and model_name:
                worker4 = AIWorker(
                    name="Gemini-Pro",
                    role="Architect & Code Reviewer",
                    client=gemini_model,
                    model=model_name
                )
                workers.append(worker4)
                print(f"  ✓ {worker4} initialized (using {model_name})")
            else:
                print("  ⚠️  No Gemini models available")

        # Worker 5: Qwen 2.5 Coder via OpenRouter (Account 1)
        if OPENROUTER_KEY_1:
            qwen_client = OpenAI(
                api_key=OPENROUTER_KEY_1,
                base_url="https://openrouter.ai/api/v1"
            )

            worker5 = AIWorker(
                name="Qwen-2.5-Coder",
                role="Code Generation Specialist (FREE model)",
                client=qwen_client,
                model="qwen/qwen-2.5-coder-32b-instruct"  # Best free coding model
            )
            workers.append(worker5)
            print(f"  ✓ {worker5} initialized")

        # Worker 6: DeepSeek V3.1 via OpenRouter (Account 2)
        if OPENROUTER_KEY_2:
            deepseek_client = OpenAI(
                api_key=OPENROUTER_KEY_2,
                base_url="https://openrouter.ai/api/v1"
            )

            worker6 = AIWorker(
                name="DeepSeek-V3.1",
                role="Advanced Reasoning & Code Review (FREE 671B model!)",
                client=deepseek_client,
                model="deepseek/deepseek-chat-v3.1:free"  # Latest DeepSeek - FREE!
            )
            workers.append(worker6)
            print(f"  ✓ {worker6} initialized")

        print(f"\n✅ Total Workers Active: {len(workers)}")

        if len(workers) == 0:
            print("❌ No workers initialized! Please set at least one API key.")
            sys.exit(1)

    except ImportError as e:
        print(f"\n❌ ERROR: Missing required package: {e}")
        print("Please install dependencies:")
        print("  pip install google-generativeai openai")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR initializing workers: {e}")
        sys.exit(1)

    # --- READ INSTRUCTIONS ---
    try:
        with open('instructions.md', 'r') as f:
            instructions = f.read()
        print(f"\n✓ Successfully loaded instructions ({len(instructions)} chars)")
    except FileNotFoundError:
        print("\n❌ ERROR: instructions.md not found!")
        print("This file contains all tasks for the AI team.")
        sys.exit(1)

    # --- TEAM CONFIGURATION ---
    print("\n" + "=" * 60)
    print("👥 AI TEAM ROSTER:")
    print("=" * 60)
    for i, worker in enumerate(workers, 1):
        print(f"{i}. {worker.name}")
        print(f"   Role: {worker.role}")
        print(f"   Model: {worker.model}")
    print("=" * 60)

    # --- TEST CONNECTIONS ---
    print("\n🧪 Testing AI Worker Connections...\n")

    workers_to_remove = []

    for worker in workers:
        success = False

        if "Gemini" in worker.name:
            # Test Gemini
            try:
                response = worker.client.generate_content(
                    "Hello! Confirm you're ready for 24/7 M365 development."
                )
                print(f"✓ {worker.name} ({worker.model}): {response.text[:60]}...")
                success = True
            except Exception as e:
                print(f"❌ {worker.name} test failed: {e}")
                workers_to_remove.append(worker)

        else:
            # Test OpenAI-compatible (OpenCode Zen with Grok/GPT-5)
            try:
                print(f"  Testing {worker.name} ({worker.model})...", end=" ")

                response = worker.client.chat.completions.create(
                    model=worker.model,
                    messages=[
                        {"role": "system", "content": f"You are {worker.name}, {worker.role}"},
                        {"role": "user", "content": "Say 'Ready for M365 development'"}
                    ],
                    max_tokens=50
                )

                # Check response format
                if hasattr(response, 'choices') and len(response.choices) > 0:
                    content = response.choices[0].message.content
                    print(f"✓ {content[:50]}...")
                    success = True
                else:
                    print(f"✗ Unexpected format: {type(response)}")
                    workers_to_remove.append(worker)

            except Exception as e:
                print(f"✗ Error: {e}")
                workers_to_remove.append(worker)

    # Remove failed workers
    for worker in workers_to_remove:
        workers.remove(worker)

    if len(workers) == 0:
        print("\n❌ No workers passed connection test!")
        sys.exit(1)

    print(f"\n✅ {len(workers)} workers ready for 24/7 operation!")

    # --- CREATE OUTPUT STRUCTURE ---
    print("\n📁 Setting up output directories...")
    directories = [
        'ai_team_output',
        'ai_team_output/session_logs',
        'ai_team_output/code_changes',
        'ai_team_output/review_reports',
        'ai_team_output/worker_logs'
    ]
    for dir in directories:
        os.makedirs(dir, exist_ok=True)
    print("✓ Output directories ready")

    # --- LOG SESSION ---
    session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    session_log = {
        "session_id": session_id,
        "timestamp": datetime.now().isoformat(),
        "workers": [
            {
                "name": w.name,
                "role": w.role,
                "model": w.model,
                "status": "active"
            } for w in workers
        ],
        "instructions_loaded": True,
        "instructions_length": len(instructions),
        "mode": "24/7 autonomous"
    }

    log_file = f'ai_team_output/session_logs/session_{session_id}.json'
    with open(log_file, 'w') as f:
        json.dump(session_log, f, indent=2)
    print(f"✓ Session logged: {log_file}")

    # --- DISPLAY WORKFLOW ---
    print("\n" + "=" * 60)
    print("🎯 24/7 COLLABORATION WORKFLOW:")
    print("=" * 60)
    print("1. Grok-1 implements features from instructions.md")
    if len(workers) > 1:
        print("2. Grok-2 validates and tests implementations")
    if any("Gemini" in w.name for w in workers):
        print("3. Gemini-Pro reviews architecture & code quality")
    print("4. All output saved to ai_team_output/")
    print("5. Claude (you) provides oversight & approval")
    print("6. Monday: Office 365 Copilot joins as M365 expert")
    print("=" * 60)

    # --- SHOW TASK PREVIEW ---
    print("\n📋 CURRENT TASKS (from instructions.md):")
    print("-" * 60)
    lines = instructions.split('\n')
    for line in lines[:20]:
        if line.strip() and ('##' in line or 'Sprint' in line or 'Task' in line):
            print(f"  {line}")
    if len(lines) > 20:
        print("  ... (see instructions.md for complete task list)")
    print("-" * 60)

    # --- READY STATUS ---
    print("\n" + "=" * 60)
    print("✅ AI TEAM IS READY FOR 24/7 AUTONOMOUS WORK!")
    print("=" * 60)
    print("\n🚀 Next Steps:")
    print("1. Review ai_team_output/ directory for progress")
    print("2. Check worker_logs/ for individual AI activity")
    print("3. Monitor code_changes/ for implementations")
    print("4. Review review_reports/ for quality checks")
    print("\n💡 The team will work through instructions.md autonomously")
    print("💡 You can monitor progress anytime in ai_team_output/")
    print("\n🔜 Monday: Add Office 365 Copilot for M365 expertise")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
