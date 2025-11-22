#!/usr/bin/env python3
"""
SGA QA System - Single Task Runner
Run individual tasks for the AI team
Usage: python run_task.py <task_name> [--worker <worker>]
"""

import os
import sys
import argparse
from datetime import datetime
from dotenv import load_dotenv

# Load .env from project root
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(project_root, '.env'))

def get_worker(worker_name: str):
    """Get the appropriate AI worker"""

    if worker_name == "gemini":
        import google.generativeai as genai
        api_key = os.getenv("GOOGLE_API_KEY")
        genai.configure(api_key=api_key)
        return ("gemini", genai.GenerativeModel("gemini-2.0-flash"))

    elif worker_name in ["grok1", "grok2"]:
        from openai import OpenAI
        key_num = "1" if worker_name == "grok1" else "2"
        api_key = os.getenv(f"OPENCODE_API_KEY_{key_num}")
        client = OpenAI(api_key=api_key, base_url="https://api.opencode.ai/v1")
        return ("grok", client)

    elif worker_name == "qwen":
        from openai import OpenAI
        api_key = os.getenv("OPENROUTER_API_KEY_1")
        client = OpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
        return ("qwen", client)

    elif worker_name == "deepseek":
        from openai import OpenAI
        api_key = os.getenv("OPENROUTER_API_KEY_2")
        client = OpenAI(api_key=api_key, base_url="https://openrouter.ai/api/v1")
        return ("deepseek", client)

    else:
        raise ValueError(f"Unknown worker: {worker_name}")


def execute_prompt(worker_name: str, prompt: str, system_prompt: str = None) -> str:
    """Execute a prompt with the specified worker"""

    worker_type, client = get_worker(worker_name)

    if worker_type == "gemini":
        response = client.generate_content(prompt)
        return response.text

    elif worker_type == "grok":
        response = client.chat.completions.create(
            model="x-ai/grok-code-fast-1",
            messages=[
                {"role": "system", "content": system_prompt or "You are an expert developer."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4096
        )
        # Handle different response formats
        if isinstance(response, str):
            return response
        elif hasattr(response, 'choices'):
            return response.choices[0].message.content
        else:
            return str(response)

    elif worker_type == "qwen":
        response = client.chat.completions.create(
            model="qwen/qwen-2.5-coder-32b-instruct",
            messages=[
                {"role": "system", "content": system_prompt or "You are an expert TypeScript/React developer."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4096
        )
        return response.choices[0].message.content

    elif worker_type == "deepseek":
        response = client.chat.completions.create(
            model="deepseek/deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt or "You are an expert software architect."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4096
        )
        return response.choices[0].message.content


# Pre-defined tasks
TASKS = {
    "gap_analysis": {
        "worker": "gemini",
        "system": "You are an expert software architect analyzing a codebase.",
        "prompt": """Analyze the SGA QA System project and identify gaps for commercial deployment.

The project is a Quality Assurance system for an asphalt/construction company with:
- 4 divisions: Asphalt, Profiling, Spray, Grooving
- Job scheduling and assignment to foremen
- QA Pack forms filled by foremen in the field
- PDF generation with company branding
- SharePoint/M365 integration

Current status: Basic features working (auth, job creation, basic forms)

Missing features needed:
1. Client tier system (Tier 1/2/3 with different site visit schedules)
2. Master calendar with Teams integration
3. Scope report system for site visits
4. Complete QA forms matching original app
5. PDF export with proper headers/footers/watermarks
6. Copilot AI project manager

Please provide a prioritized list of what needs to be built, with complexity estimates."""
    },

    "client_tiers": {
        "worker": "qwen",
        "system": "You are an expert TypeScript/React developer.",
        "prompt": """Create a Client Tier System for the SGA QA application.

Requirements:
- Tier 1 clients: 3 site visits (14 days, 7 days, 3 days before project)
- Tier 2 clients: 2 site visits (7 days, 3 days before)
- Tier 3 clients: 1 site visit (within 72 hours)

Create:
1. TypeScript types/interfaces for the tier system
2. A React component for selecting/displaying client tier
3. Utility functions for calculating site visit dates
4. Integration with job creation workflow

Use modern React patterns (hooks, TypeScript) and Tailwind CSS for styling.
Make it production-ready with proper error handling."""
    },

    "pdf_system": {
        "worker": "qwen",
        "system": "You are an expert React developer specializing in PDF generation.",
        "prompt": """Create a PDF generation system for the SGA QA application.

Requirements:
- Header: Company logo (top-left), document title (center)
- Margins: 0.3 inch top/bottom, 1.8 inch left/right
- Footer (3 columns):
  - Left: Document ID and version
  - Center: "Printed copies are uncontrolled documents"
  - Right: Page X of Y
- Watermark: Light "SGA" watermark on each page
- Professional, minimal styling

Use @react-pdf/renderer library.

Create:
1. SgaPdfDocument component (main wrapper)
2. SgaPdfHeader component
3. SgaPdfFooter component
4. Utility for adding watermark
5. Example usage with a QA report

Make it reusable for different report types."""
    },

    "master_calendar": {
        "worker": "qwen",
        "system": "You are an expert React developer.",
        "prompt": """Create a Master Calendar component for the SGA QA application.

Requirements:
1. Week/Month/Day view modes
2. Filter by division (Asphalt, Profiling, Spray, Grooving)
3. Filter by crew
4. Filter by assigned engineer/admin
5. Color coding by job status (scheduled, in-progress, completed)
6. Click to view job details
7. Drag-and-drop for rescheduling (optional)

Use react-big-calendar or similar.
Use TypeScript and Tailwind CSS.
Include types for calendar events and filters.

The calendar should be ready to integrate with Microsoft Graph API for Teams calendar sync."""
    },

    "scope_report": {
        "worker": "grok2",
        "system": "You are an expert React/TypeScript developer building enterprise forms.",
        "prompt": """Create a Scope Report Form for site visits in the SGA QA application.

This form is filled out by engineers/supervisors when they visit a job site before work begins.

Fields needed:
- Job Reference (linked from scheduling system)
- Visit Date & Time
- Site Conditions (dropdown + notes)
- Access Requirements (checklist)
- Safety Hazards Identified (multi-select + notes)
- Resource Requirements (materials, equipment, personnel)
- Photos (upload capability, max 10)
- Recommendations (text area)
- Additional Notes
- Digital Signature

Include:
1. Form validation using react-hook-form + zod
2. Photo upload with preview
3. Signature capture component
4. Save as draft functionality
5. Submit handler that could POST to an API

Use TypeScript and Tailwind CSS."""
    },

    "teams_integration": {
        "worker": "grok1",
        "system": "You are an expert Microsoft 365 developer.",
        "prompt": """Create Teams Calendar integration for the SGA QA application.

Requirements:
1. Create calendar events in a shared Teams calendar
2. Bidirectional sync (read events from Teams, write new ones)
3. Support for:
   - Job scheduled events
   - Site visit reminders
   - Submission deadlines
4. Proper authentication using MSAL

Create:
1. TeamsCalendarService class
2. Functions for CRUD operations on calendar events
3. Webhook handler for receiving calendar updates
4. Types for calendar events

Use Microsoft Graph API.
Include error handling and retry logic.
Add JSDoc comments for all public methods."""
    }
}


def main():
    parser = argparse.ArgumentParser(description="Run AI team tasks")
    parser.add_argument("task", choices=list(TASKS.keys()) + ["list", "test"], help="Task to run")
    parser.add_argument("--worker", help="Override default worker")
    parser.add_argument("--output", help="Output file path")
    args = parser.parse_args()

    if args.task == "list":
        print("Available tasks:")
        for name, info in TASKS.items():
            print(f"  {name} (worker: {info['worker']})")
        return

    if args.task == "test":
        print("Testing all API connections...")
        for worker in ["gemini", "grok1", "grok2", "qwen", "deepseek"]:
            try:
                result = execute_prompt(worker, "Say 'API working' in 3 words or less.", "Be brief.")
                print(f"  [OK] {worker}: {result[:50]}...")
            except Exception as e:
                print(f"  [FAIL] {worker}: {e}")
        return

    task_info = TASKS[args.task]
    worker = args.worker or task_info["worker"]

    print(f"Running task: {args.task}")
    print(f"Worker: {worker}")
    print("-" * 50)

    try:
        result = execute_prompt(worker, task_info["prompt"], task_info["system"])

        # Save output
        output_dir = os.path.join(project_root, "ai_team_output", "sprint4", "code")
        os.makedirs(output_dir, exist_ok=True)

        output_file = args.output or os.path.join(output_dir, f"{args.task}_{datetime.now().strftime('%H%M%S')}.md")

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"# Task: {args.task}\n\n")
            f.write(f"**Worker:** {worker}\n")
            f.write(f"**Generated:** {datetime.now().isoformat()}\n\n")
            f.write("---\n\n")
            f.write(result)

        print(f"\n[OK] Output saved to: {output_file}")
        print("\n" + "=" * 50)
        print("RESULT PREVIEW:")
        print("=" * 50)
        print(result[:2000] + ("..." if len(result) > 2000 else ""))

    except Exception as e:
        print(f"\n[FAIL] Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
