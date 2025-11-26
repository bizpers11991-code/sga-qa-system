#!/usr/bin/env python3
"""
SGA QA System - Project Management Module Orchestrator
This script coordinates the AI team to implement the project management evolution.

Usage:
    python orchestrate_project_management.py --phase <1|2|3|4|5>
    python orchestrate_project_management.py --task <TASK_ID>
    python orchestrate_project_management.py --all

Workers:
    - Gemini 2.5 Pro: Architecture, forms, Copilot
    - Qwen 2.5 Coder: TypeScript types, API routes
    - DeepSeek V3: Business logic, scheduling algorithms
    - Grok #1: SharePoint, Teams integration
    - Grok #2: UI components
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent.parent
TASKS_DIR = PROJECT_ROOT / "ai_team_output" / "project_management" / "tasks"
OUTPUT_DIR = PROJECT_ROOT / "ai_team_output" / "project_management" / "deliverables"
LOGS_DIR = PROJECT_ROOT / "ai_team_output" / "project_management" / "logs"

# Worker assignments
WORKERS = {
    "gemini": {
        "name": "Gemini 2.5 Pro",
        "env_key": "GOOGLE_API_KEY",
        "model": "gemini-2.5-pro-exp-03-25",
        "strengths": ["architecture", "forms", "copilot", "complex logic"]
    },
    "qwen": {
        "name": "Qwen 2.5 Coder 32B",
        "env_key": "OPENROUTER_API_KEY_1",
        "model": "qwen/qwen-2.5-coder-32b-instruct",
        "strengths": ["typescript", "types", "api routes"]
    },
    "deepseek": {
        "name": "DeepSeek V3",
        "env_key": "OPENROUTER_API_KEY_2",
        "model": "deepseek/deepseek-coder",
        "strengths": ["business logic", "algorithms", "scheduling"]
    },
    "grok1": {
        "name": "Grok Code Fast #1",
        "env_key": "OPENCODE_API_KEY_1",
        "model": "x-ai/grok-code-fast-1",
        "strengths": ["sharepoint", "teams", "m365"]
    },
    "grok2": {
        "name": "Grok Code Fast #2",
        "env_key": "OPENCODE_API_KEY_2",
        "model": "x-ai/grok-code-fast-1",
        "strengths": ["ui", "react", "components"]
    }
}

# Phase definitions
PHASES = {
    1: {
        "name": "Data Model & API Foundation",
        "tasks": ["PM_TYPES_001", "PM_API_001", "PM_API_002", "PM_API_003", "PM_API_004"],
        "estimated_hours": 24,
        "dependencies": []
    },
    2: {
        "name": "UI Components",
        "tasks": ["PM_UI_001", "PM_UI_002", "PM_UI_003", "PM_UI_004"],
        "estimated_hours": 32,
        "dependencies": [1]
    },
    3: {
        "name": "Cross-Division & Scheduling",
        "tasks": ["PM_SCHEDULER_001", "PM_M365_001"],
        "estimated_hours": 18,
        "dependencies": [1, 2]
    },
    4: {
        "name": "Copilot & AI Features",
        "tasks": ["PM_COPILOT_001"],
        "estimated_hours": 10,
        "dependencies": [1, 2, 3]
    },
    5: {
        "name": "Testing & Deployment",
        "tasks": [],  # Manual testing phase
        "estimated_hours": 16,
        "dependencies": [1, 2, 3, 4]
    }
}


def load_task(task_id: str) -> dict:
    """Load a task definition from JSON file."""
    task_file = TASKS_DIR / f"{task_id}.json"
    if not task_file.exists():
        raise FileNotFoundError(f"Task file not found: {task_file}")
    
    with open(task_file, 'r') as f:
        return json.load(f)


def list_all_tasks() -> list:
    """List all available task files."""
    tasks = []
    for task_file in TASKS_DIR.glob("*.json"):
        with open(task_file, 'r') as f:
            task = json.load(f)
            tasks.append({
                "id": task["task_id"],
                "title": task["title"],
                "assigned_to": task["assigned_to"],
                "phase": task["phase"],
                "priority": task["priority"],
                "hours": task["estimated_hours"]
            })
    return sorted(tasks, key=lambda x: (x["phase"], x["priority"]))


def create_delegation_prompt(task: dict, worker: str) -> str:
    """Create a detailed prompt for the AI worker."""
    worker_info = WORKERS.get(worker, {})
    
    prompt = f"""# Task Delegation: {task['title']}

## Task ID: {task['task_id']}
## Assigned To: {worker_info.get('name', worker)}
## Priority: {task['priority']}
## Estimated Hours: {task['estimated_hours']}

## Description
{task['description']}

## Context
{json.dumps(task.get('context', {}), indent=2)}

## Requirements
{chr(10).join(f"- {req}" for req in task.get('requirements', []))}

## Deliverables
{chr(10).join(f"- {d['file']}: {d['description']}" for d in task.get('deliverables', []))}

## Specifications
{json.dumps(task.get('ui_specifications', task.get('api_specifications', {})), indent=2)}

## Success Criteria
{chr(10).join(f"- {c}" for c in task.get('success_criteria', []))}

## Constraints
{chr(10).join(f"- {c}" for c in task.get('constraints', []))}

---

Please implement this task following the specifications above. 
Provide complete, production-ready code for each deliverable.
Include proper TypeScript types, error handling, and documentation.
Follow the existing code patterns in the SGA QA System codebase.
"""
    return prompt


def sanitize_for_free_model(prompt: str) -> str:
    """Remove any sensitive data before sending to free models."""
    # This is a placeholder - in production, implement proper PII removal
    sensitive_patterns = [
        # Add patterns to remove
    ]
    sanitized = prompt
    for pattern in sensitive_patterns:
        sanitized = sanitized.replace(pattern, "[REDACTED]")
    return sanitized


def save_task_output(task_id: str, worker: str, output: str):
    """Save the output from a worker."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = OUTPUT_DIR / f"{task_id}_{worker}_{timestamp}.md"
    
    with open(output_file, 'w') as f:
        f.write(f"# Task Output: {task_id}\n")
        f.write(f"## Worker: {worker}\n")
        f.write(f"## Timestamp: {timestamp}\n\n")
        f.write(output)
    
    print(f"✓ Output saved to: {output_file}")
    return output_file


def log_execution(task_id: str, worker: str, status: str, details: str = ""):
    """Log task execution."""
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "task_id": task_id,
        "worker": worker,
        "status": status,
        "details": details
    }
    
    log_file = LOGS_DIR / "execution_log.jsonl"
    with open(log_file, 'a') as f:
        f.write(json.dumps(log_entry) + "\n")


def show_status():
    """Show current project status."""
    print("\n" + "="*60)
    print("🏗️  SGA QA System - Project Management Module Status")
    print("="*60)
    
    tasks = list_all_tasks()
    total_hours = sum(t["hours"] for t in tasks)
    
    print(f"\n📋 Total Tasks: {len(tasks)}")
    print(f"⏱️  Estimated Total Hours: {total_hours}")
    
    print("\n📊 Tasks by Phase:")
    for phase_num, phase_info in PHASES.items():
        phase_tasks = [t for t in tasks if t["phase"] == phase_num]
        phase_hours = sum(t["hours"] for t in phase_tasks)
        print(f"  Phase {phase_num} ({phase_info['name']}): {len(phase_tasks)} tasks, {phase_hours}h")
    
    print("\n👥 Tasks by Worker:")
    for worker_id, worker_info in WORKERS.items():
        worker_tasks = [t for t in tasks if t["assigned_to"] == worker_id]
        worker_hours = sum(t["hours"] for t in worker_tasks)
        print(f"  {worker_info['name']}: {len(worker_tasks)} tasks, {worker_hours}h")
    
    print("\n📝 All Tasks:")
    for task in tasks:
        print(f"  [{task['priority']}] {task['id']} - {task['title']}")
        print(f"       Phase {task['phase']} | {task['assigned_to']} | {task['hours']}h")


def main():
    parser = argparse.ArgumentParser(description='Project Management Module Orchestrator')
    parser.add_argument('--phase', type=int, help='Run all tasks in a phase')
    parser.add_argument('--task', type=str, help='Run a specific task')
    parser.add_argument('--list', action='store_true', help='List all tasks')
    parser.add_argument('--status', action='store_true', help='Show project status')
    parser.add_argument('--prompt', type=str, help='Generate delegation prompt for task')
    
    args = parser.parse_args()
    
    if args.status or args.list:
        show_status()
        return
    
    if args.prompt:
        task = load_task(args.prompt)
        prompt = create_delegation_prompt(task, task['assigned_to'])
        print(prompt)
        return
    
    if args.task:
        task = load_task(args.task)
        print(f"\n🎯 Task: {task['task_id']}")
        print(f"📝 Title: {task['title']}")
        print(f"👤 Assigned to: {WORKERS[task['assigned_to']]['name']}")
        print(f"\nTo execute this task, use the delegation prompt:")
        print(f"  python {sys.argv[0]} --prompt {args.task}")
        return
    
    if args.phase:
        phase_info = PHASES.get(args.phase)
        if not phase_info:
            print(f"Invalid phase: {args.phase}")
            return
        
        print(f"\n🚀 Phase {args.phase}: {phase_info['name']}")
        print(f"📋 Tasks: {len(phase_info['tasks'])}")
        print(f"⏱️  Estimated Hours: {phase_info['estimated_hours']}")
        print("\nTasks in this phase:")
        for task_id in phase_info['tasks']:
            task = load_task(task_id)
            print(f"  - {task_id}: {task['title']} ({task['assigned_to']})")
        return
    
    # Default: show status
    show_status()


if __name__ == "__main__":
    main()
