#!/usr/bin/env python3
"""
Generate final documentation using AI workers in parallel
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import concurrent.futures

sys.path.insert(0, str(Path(__file__).parent))
from run_task import execute_prompt

PROJECT_ROOT = Path(__file__).parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / "docs"

def generate_deployment_guide():
    """Generate comprehensive deployment guide"""
    prompt = """Create a comprehensive deployment guide for the SGA QA System.

**System Overview:**
- Frontend: React/TypeScript PWA on Vercel Pro
- Backend: Microsoft 365 (SharePoint, Teams, Power Automate)
- Auth: Azure AD
- Users: 500+ across 4 divisions (Asphalt, Profiling, Spray, Grooving)

**Deployment Components:**
1. Vercel PWA deployment
2. SharePoint site setup
3. Power Automate flows
4. Teams integration
5. Copilot deployment

**Create a step-by-step guide with:**
- Prerequisites checklist
- Environment variables setup
- Vercel deployment commands
- SharePoint PowerShell scripts
- Power Automate activation steps
- Teams app installation
- Testing checklist
- Rollback procedures
- Troubleshooting common issues

Format as Markdown with clear sections, code blocks, and checkboxes.
"""

    print("[1/2] Generating Deployment Guide...")
    result = execute_prompt("grok1", prompt, "You are a DevOps expert specializing in Microsoft 365 and Vercel deployments.")

    output_file = OUTPUT_DIR / "DEPLOYMENT_GUIDE.md"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(result)

    print(f"[OK] Deployment Guide saved to: {output_file}")
    return str(output_file)

def generate_user_documentation():
    """Generate user documentation"""
    prompt = """Create user documentation for the SGA QA System.

**User Roles:**
1. Foremen (field workers on iPads)
2. Engineers (office-based)
3. Schedulers/Admins
4. Management

**Features to Document:**
1. Logging in (Azure AD)
2. Viewing assigned jobs
3. Filling out QA forms (all 11 types)
4. Taking photos
5. Submitting reports
6. Viewing calendar
7. Receiving notifications
8. Accessing past reports

**For Each Feature:**
- Purpose and when to use
- Step-by-step instructions with screenshots placeholders [Screenshot: description]
- Tips and best practices
- Common issues and solutions

**Special Sections:**
- Quick Start Guide (1-page)
- Form field descriptions
- Mobile vs Desktop differences
- Offline mode usage
- Getting help

Format as Markdown with clear headings, numbered steps, and visual cues.
"""

    print("[2/2] Generating User Documentation...")
    result = execute_prompt("qwen", prompt, "You are a technical writer specializing in user-friendly documentation for field workers.")

    output_file = OUTPUT_DIR / "USER_GUIDE.md"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(result)

    print(f"[OK] User Guide saved to: {output_file}")
    return str(output_file)

def main():
    print("=" * 60)
    print("SGA QA System - Documentation Generation")
    print("AI Workers: Grok1 (Deployment) + Qwen (User Docs)")
    print("=" * 60)

    # Run both in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future_deployment = executor.submit(generate_deployment_guide)
        future_user_docs = executor.submit(generate_user_documentation)

        deployment_file = future_deployment.result()
        user_file = future_user_docs.result()

    print("\n" + "=" * 60)
    print("Documentation Generation Complete!")
    print("=" * 60)
    print(f"Deployment Guide: {deployment_file}")
    print(f"User Guide: {user_file}")

if __name__ == "__main__":
    main()
