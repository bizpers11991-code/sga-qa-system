#!/usr/bin/env python3
"""
SGA AI Team - Quick Start Runner
================================
Use this to quickly run AI tasks without the full orchestrator setup.

Examples:
    python quick_task.py "Write a React form component for user login"
    python quick_task.py "Review this code for bugs" --file src/App.tsx
    python quick_task.py "Explain this error" --context "TypeError: undefined is not a function"
"""

import os
import sys
import argparse
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


def get_best_available_provider():
    """Get the best available provider based on configured keys"""
    
    # Priority order: Groq (fastest) -> Gemini (most tokens) -> OpenRouter -> Others
    providers = []
    
    # Check Groq
    if os.getenv("GROQ_API_KEY"):
        providers.append(("groq", "llama-3.3-70b-versatile", "https://api.groq.com/openai/v1"))
    
    # Check Gemini
    if os.getenv("GOOGLE_API_KEY"):
        providers.append(("gemini", "gemini-2.0-flash", None))
    
    # Check Cerebras
    if os.getenv("CEREBRAS_API_KEY"):
        providers.append(("cerebras", "llama-3.3-70b", "https://api.cerebras.ai/v1"))
    
    # Check OpenRouter
    if os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENROUTER_API_KEY_1"):
        providers.append(("openrouter", "deepseek/deepseek-chat-v3-0324:free", "https://openrouter.ai/api/v1"))
    
    # Check OpenCode
    if os.getenv("OPENCODE_API_KEY") or os.getenv("OPENCODE_API_KEY_1"):
        providers.append(("opencode", "x-ai/grok-code-fast-1", "https://api.opencode.ai/v1"))
    
    return providers[0] if providers else None


def run_with_gemini(prompt: str) -> str:
    """Run with Google Gemini"""
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content(prompt)
    return response.text


def run_with_openai_compatible(prompt: str, api_key: str, base_url: str, model: str) -> str:
    """Run with OpenAI-compatible API"""
    from openai import OpenAI
    client = OpenAI(api_key=api_key, base_url=base_url)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are an expert software developer."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=4096,
        temperature=0.7
    )
    return response.choices[0].message.content


def run_task(prompt: str, context: str = None, file_path: str = None) -> str:
    """Run a task with the best available provider"""
    
    # Build full prompt
    full_prompt = prompt
    
    if context:
        full_prompt += f"\n\nContext:\n{context}"
    
    if file_path and os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            file_content = f.read()
        full_prompt += f"\n\nFile ({file_path}):\n```\n{file_content}\n```"
    
    # Get provider
    provider = get_best_available_provider()
    if not provider:
        return "❌ No API keys configured. Please set up at least one provider in .env"
    
    provider_name, model, base_url = provider
    print(f"🤖 Using: {provider_name} ({model})")
    
    # Run
    if provider_name == "gemini":
        return run_with_gemini(full_prompt)
    else:
        api_key_map = {
            "groq": "GROQ_API_KEY",
            "cerebras": "CEREBRAS_API_KEY",
            "openrouter": "OPENROUTER_API_KEY",
            "together": "TOGETHER_API_KEY",
            "opencode": "OPENCODE_API_KEY",
        }
        api_key = os.getenv(api_key_map[provider_name]) or os.getenv(f"{api_key_map[provider_name]}_1")
        return run_with_openai_compatible(full_prompt, api_key, base_url, model)


def main():
    parser = argparse.ArgumentParser(
        description="Quick AI task runner for SGA project",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python quick_task.py "Write a hello world function in Python"
  python quick_task.py "Review this code" --file src/App.tsx
  python quick_task.py "Fix this error" --context "TypeError: Cannot read property 'map' of undefined"
  
Supported providers (in priority order):
  1. Groq (fastest)
  2. Google Gemini
  3. Cerebras
  4. OpenRouter
  5. Together.ai
  6. OpenCode (Grok)
        """
    )
    parser.add_argument("prompt", help="The task or question for the AI")
    parser.add_argument("--file", "-f", help="Path to a file to include as context")
    parser.add_argument("--context", "-c", help="Additional context to include")
    parser.add_argument("--output", "-o", help="Save output to file")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🚀 SGA AI Team - Quick Task")
    print("=" * 60)
    print()
    
    try:
        result = run_task(args.prompt, args.context, args.file)
        
        print("\n" + "=" * 60)
        print("📝 Response:")
        print("=" * 60)
        print(result)
        
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(f"# AI Response\n")
                f.write(f"**Prompt:** {args.prompt}\n")
                f.write(f"**Time:** {datetime.now().isoformat()}\n\n")
                f.write("---\n\n")
                f.write(result)
            print(f"\n✅ Saved to: {args.output}")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
