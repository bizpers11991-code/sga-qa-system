#!/usr/bin/env python3
"""
SGA QA System - AI Team Orchestrator
Claude Code delegates tasks to AI workers (Grok, Qwen, DeepSeek, Gemini)
Handles secure data sanitization and task coordination.
"""

import os
import sys
import json
import re
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Rich console for pretty output
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn
    console = Console()
except ImportError:
    console = None
    print("Note: Install 'rich' for better output: pip install rich")


class WorkerType(Enum):
    GEMINI = "gemini"           # Architecture, security review
    GROK_1 = "grok1"            # M365, SharePoint, Teams
    GROK_2 = "grok2"            # Power Apps UI, Forms
    QWEN = "qwen"               # TypeScript, React, APIs
    DEEPSEEK = "deepseek"       # Complex algorithms, Copilot


@dataclass
class Task:
    """Represents a task to delegate to an AI worker"""
    id: str
    title: str
    description: str
    worker: WorkerType
    context_files: List[str]
    output_path: str
    success_criteria: List[str]
    sanitize_data: bool = True
    priority: int = 1  # 1=highest
    status: str = "pending"
    result: Optional[str] = None


class DataSanitizer:
    """Sanitizes sensitive data before sending to free models"""

    # Patterns to detect and replace
    PII_PATTERNS = {
        'email': (r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', 'user@example.com'),
        'phone': (r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '000-000-0000'),
        'ip_address': (r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', '0.0.0.0'),
        'api_key': (r'(sk-|AIza|key-)[a-zA-Z0-9]{20,}', '[API_KEY_REDACTED]'),
        'sharepoint_url': (r'https://[a-zA-Z0-9]+\.sharepoint\.com/[^\s]+', 'https://tenant.sharepoint.com/sites/Example'),
        'azure_tenant': (r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', '00000000-0000-0000-0000-000000000000'),
    }

    # Company-specific terms to anonymize
    COMPANY_TERMS = {
        'SGA': 'COMPANY',
        'sgagroupcomau': 'tenant',
        'SGAQualityAssurance': 'QASite',
    }

    @classmethod
    def sanitize(cls, text: str, level: str = "standard") -> str:
        """Sanitize text based on security level"""
        if level == "none":
            return text

        result = text

        # Replace PII patterns
        for name, (pattern, replacement) in cls.PII_PATTERNS.items():
            result = re.sub(pattern, replacement, result)

        # For high security, also anonymize company terms
        if level == "high":
            for term, replacement in cls.COMPANY_TERMS.items():
                result = result.replace(term, replacement)

        return result

    @classmethod
    def create_context_safe(cls, file_paths: List[str], base_dir: str) -> str:
        """Read files and create sanitized context for AI workers"""
        context_parts = []

        for file_path in file_paths:
            full_path = os.path.join(base_dir, file_path) if not os.path.isabs(file_path) else file_path
            if os.path.exists(full_path):
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    # Sanitize the content
                    safe_content = cls.sanitize(content)
                    context_parts.append(f"### File: {os.path.basename(file_path)}\n```\n{safe_content}\n```\n")
                except Exception as e:
                    context_parts.append(f"### File: {file_path}\n[Error reading: {e}]\n")

        return "\n".join(context_parts)


class AIWorker:
    """Base class for AI workers"""

    def __init__(self, worker_type: WorkerType):
        self.worker_type = worker_type
        self.client = None
        self.model = None
        self._setup()

    def _setup(self):
        """Setup API client based on worker type"""
        raise NotImplementedError

    def execute(self, prompt: str, system_prompt: str = None) -> str:
        """Execute a prompt and return the response"""
        raise NotImplementedError


class GeminiWorker(AIWorker):
    """Google Gemini worker for architecture and security review"""

    def _setup(self):
        import google.generativeai as genai
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not set")
        genai.configure(api_key=api_key)
        self.client = genai
        self.model = "gemini-2.0-flash"  # Fast and capable

    def execute(self, prompt: str, system_prompt: str = None) -> str:
        model = self.client.GenerativeModel(
            self.model,
            system_instruction=system_prompt or "You are an expert software architect."
        )
        response = model.generate_content(prompt)
        return response.text


class GrokWorker(AIWorker):
    """Grok worker via opencode.ai"""

    def __init__(self, worker_type: WorkerType, account_num: int = 1):
        self.account_num = account_num
        super().__init__(worker_type)

    def _setup(self):
        from openai import OpenAI
        key_name = f"OPENCODE_API_KEY_{self.account_num}"
        api_key = os.getenv(key_name)
        if not api_key:
            raise ValueError(f"{key_name} not set")
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.opencode.ai/v1"
        )
        self.model = "x-ai/grok-code-fast-1"

    def execute(self, prompt: str, system_prompt: str = None) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt or "You are an expert M365 developer."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4096,
            temperature=0.7
        )
        return response.choices[0].message.content


class OpenRouterWorker(AIWorker):
    """Worker using OpenRouter API (Qwen, DeepSeek)"""

    def __init__(self, worker_type: WorkerType, account_num: int = 1):
        self.account_num = account_num
        super().__init__(worker_type)

    def _setup(self):
        from openai import OpenAI
        key_name = f"OPENROUTER_API_KEY_{self.account_num}"
        api_key = os.getenv(key_name)
        if not api_key:
            raise ValueError(f"{key_name} not set")
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1"
        )
        # Set model based on worker type
        if self.worker_type == WorkerType.QWEN:
            self.model = "qwen/qwen-2.5-coder-32b-instruct"
        else:  # DEEPSEEK
            self.model = "deepseek/deepseek-chat"

    def execute(self, prompt: str, system_prompt: str = None) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt or "You are an expert TypeScript/React developer."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4096,
            temperature=0.7
        )
        return response.choices[0].message.content


class Orchestrator:
    """Main orchestrator that coordinates AI workers"""

    def __init__(self, project_dir: str):
        self.project_dir = project_dir
        self.output_dir = os.path.join(project_dir, "ai_team_output")
        self.workers: Dict[WorkerType, AIWorker] = {}
        self.task_queue: List[Task] = []
        self.completed_tasks: List[Task] = []
        self._setup_directories()
        self._initialize_workers()

    def _setup_directories(self):
        """Create necessary output directories"""
        dirs = [
            self.output_dir,
            os.path.join(self.output_dir, "sprint4"),
            os.path.join(self.output_dir, "sprint4", "code"),
            os.path.join(self.output_dir, "sprint4", "reviews"),
            os.path.join(self.output_dir, "sprint4", "logs"),
        ]
        for d in dirs:
            os.makedirs(d, exist_ok=True)

    def _initialize_workers(self):
        """Initialize all AI workers"""
        print("Initializing AI workers...")

        # Gemini (paid, secure)
        try:
            self.workers[WorkerType.GEMINI] = GeminiWorker(WorkerType.GEMINI)
            print("  ✓ Gemini initialized")
        except Exception as e:
            print(f"  ✗ Gemini failed: {e}")

        # Grok workers
        try:
            self.workers[WorkerType.GROK_1] = GrokWorker(WorkerType.GROK_1, account_num=1)
            print("  ✓ Grok #1 initialized")
        except Exception as e:
            print(f"  ✗ Grok #1 failed: {e}")

        try:
            self.workers[WorkerType.GROK_2] = GrokWorker(WorkerType.GROK_2, account_num=2)
            print("  ✓ Grok #2 initialized")
        except Exception as e:
            print(f"  ✗ Grok #2 failed: {e}")

        # OpenRouter workers
        try:
            self.workers[WorkerType.QWEN] = OpenRouterWorker(WorkerType.QWEN, account_num=1)
            print("  ✓ Qwen initialized")
        except Exception as e:
            print(f"  ✗ Qwen failed: {e}")

        try:
            self.workers[WorkerType.DEEPSEEK] = OpenRouterWorker(WorkerType.DEEPSEEK, account_num=2)
            print("  ✓ DeepSeek initialized")
        except Exception as e:
            print(f"  ✗ DeepSeek failed: {e}")

    def add_task(self, task: Task):
        """Add a task to the queue"""
        self.task_queue.append(task)
        self.task_queue.sort(key=lambda t: t.priority)

    def execute_task(self, task: Task) -> str:
        """Execute a single task"""
        worker = self.workers.get(task.worker)
        if not worker:
            return f"Error: Worker {task.worker} not available"

        # Build context from files
        if task.context_files:
            context = DataSanitizer.create_context_safe(task.context_files, self.project_dir)
        else:
            context = ""

        # Build the prompt
        prompt = f"""# Task: {task.title}

## Description
{task.description}

## Context
{context}

## Success Criteria
{chr(10).join(f'- {c}' for c in task.success_criteria)}

## Instructions
Please complete this task and provide:
1. The complete code/solution
2. Brief explanation of your approach
3. Any assumptions made

Respond with well-formatted, production-ready code.
"""

        # Sanitize if needed
        if task.sanitize_data:
            prompt = DataSanitizer.sanitize(prompt)

        # Execute
        task.status = "in_progress"
        try:
            result = worker.execute(prompt)
            task.result = result
            task.status = "completed"

            # Save result to file
            output_file = os.path.join(self.output_dir, "sprint4", "code", f"{task.id}.md")
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"# Task: {task.title}\n\n")
                f.write(f"**Worker:** {task.worker.value}\n")
                f.write(f"**Timestamp:** {datetime.now().isoformat()}\n\n")
                f.write("## Result\n\n")
                f.write(result)

            return result
        except Exception as e:
            task.status = "failed"
            task.result = str(e)
            return f"Error: {e}"

    def run_all_tasks(self):
        """Execute all tasks in the queue"""
        print(f"\nExecuting {len(self.task_queue)} tasks...")

        for i, task in enumerate(self.task_queue):
            print(f"\n[{i+1}/{len(self.task_queue)}] {task.title}")
            print(f"  Worker: {task.worker.value}")

            result = self.execute_task(task)

            if task.status == "completed":
                print(f"  ✓ Completed")
                self.completed_tasks.append(task)
            else:
                print(f"  ✗ Failed: {result[:100]}...")

        # Generate summary
        self._generate_summary()

    def _generate_summary(self):
        """Generate execution summary"""
        summary = {
            "timestamp": datetime.now().isoformat(),
            "total_tasks": len(self.task_queue),
            "completed": len([t for t in self.task_queue if t.status == "completed"]),
            "failed": len([t for t in self.task_queue if t.status == "failed"]),
            "tasks": [asdict(t) for t in self.task_queue]
        }

        summary_file = os.path.join(self.output_dir, "sprint4", "logs", f"summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2, default=str)

        print(f"\n📊 Summary saved to: {summary_file}")
        print(f"   Completed: {summary['completed']}/{summary['total_tasks']}")


def create_sprint4_tasks() -> List[Task]:
    """Create the Sprint 4 task list"""
    tasks = []

    # Task 1: Gap Analysis
    tasks.append(Task(
        id="TASK_001_GAP_ANALYSIS",
        title="Analyze gaps between original app and current implementation",
        description="""Compare the original SGA QA Pack application with the current implementation.

Original app location: archive/readme/sga-qa-pack (Original Code) (Readme)/
Current implementation: src/

Identify:
1. Missing QA forms (should have: AsphaltPlacement, SprayReport, SiteRecord, etc.)
2. Missing admin features (Scheduler, JobCreation, NCR)
3. PDF generation gaps
4. Missing API endpoints""",
        worker=WorkerType.GEMINI,
        context_files=[
            "archive/readme/sga-qa-pack (Original Code) (Readme)/types.ts",
        ],
        output_path="ai_team_output/sprint4/gap_analysis.md",
        success_criteria=[
            "Complete list of missing components",
            "Priority ranking for implementation",
            "Estimated complexity for each gap"
        ],
        priority=1
    ))

    # Task 2: Client Tier System
    tasks.append(Task(
        id="TASK_002_CLIENT_TIERS",
        title="Implement Client Tier System (Tier 1/2/3)",
        description="""Create the client tier ranking system:

- Tier 1: 3 site visits (14, 7, 3 days before project)
- Tier 2: 2 site visits (7, 3 days before)
- Tier 3: 1 site visit (within 72 hours)

Create:
1. TypeScript types for client tiers
2. React component for tier selection
3. Logic for automatic site visit scheduling
4. Integration with calendar system""",
        worker=WorkerType.QWEN,
        context_files=[],
        output_path="ai_team_output/sprint4/code/client_tiers.tsx",
        success_criteria=[
            "Type definitions complete",
            "Tier selection UI component",
            "Site visit date calculation logic",
            "Calendar event generation"
        ],
        priority=1
    ))

    # Task 3: Site Visit Automation
    tasks.append(Task(
        id="TASK_003_SITE_VISITS",
        title="Create Site Visit Automation System",
        description="""Build the automated site visit scheduling system:

1. Calculate visit dates based on client tier
2. Create Teams calendar events automatically
3. Send notifications to assigned personnel
4. Generate scope report templates

Use Microsoft Graph API patterns for Teams integration.""",
        worker=WorkerType.GROK_1,
        context_files=[],
        output_path="ai_team_output/sprint4/code/site_visits.ts",
        success_criteria=[
            "Date calculation utilities",
            "Graph API calendar integration",
            "Notification service",
            "Scope report template"
        ],
        priority=1
    ))

    # Task 4: PDF Formatting System
    tasks.append(Task(
        id="TASK_004_PDF_SYSTEM",
        title="Implement SGA PDF Generation with Proper Formatting",
        description="""Create PDF generation system matching SGA requirements:

Headers:
- Logo: Top-left (use placeholder for now)
- Margins: 0.3-1.8

Footers:
- Bottom-left: Document ID and version
- Bottom-center: "Printed copies are uncontrolled documents"
- Bottom-right: Page number

Additional:
- SGA watermark on each page
- Professional, minimal formatting

Use React-PDF or similar library.""",
        worker=WorkerType.QWEN,
        context_files=[],
        output_path="ai_team_output/sprint4/code/pdf_generator.tsx",
        success_criteria=[
            "Header component with logo placement",
            "Footer component with 3-column layout",
            "Watermark implementation",
            "Margin configuration",
            "Page numbering"
        ],
        priority=1
    ))

    # Task 5: Master Calendar Component
    tasks.append(Task(
        id="TASK_005_MASTER_CALENDAR",
        title="Build Master Calendar with Division Filtering",
        description="""Create the master calendar component:

Features:
1. Week/Month/Day views
2. Filter by division (Asphalt, Profiling, Spray, Grooving)
3. Filter by crew
4. Filter by engineer/admin
5. Color coding by job status
6. Integration point for Teams calendar sync

Use a React calendar library like react-big-calendar.""",
        worker=WorkerType.QWEN,
        context_files=[
            "src/components/scheduler/WeeklyCalendar.tsx"
        ],
        output_path="ai_team_output/sprint4/code/master_calendar.tsx",
        success_criteria=[
            "Multiple view modes",
            "Division filter component",
            "Crew filter component",
            "Status color coding",
            "Event click handlers"
        ],
        priority=2
    ))

    # Task 6: Scope Report Form
    tasks.append(Task(
        id="TASK_006_SCOPE_REPORT",
        title="Create Scope Report Form for Site Visits",
        description="""Build the scope report form that personnel fill out during site visits:

Fields needed:
- Job reference info
- Site conditions
- Access requirements
- Safety considerations
- Resource requirements
- Photos/attachments
- Recommendations
- Signature

Should match the style of existing QA forms.""",
        worker=WorkerType.GROK_2,
        context_files=[],
        output_path="ai_team_output/sprint4/code/scope_report_form.tsx",
        success_criteria=[
            "Complete form with all fields",
            "Photo upload capability",
            "Signature capture",
            "Form validation",
            "Submit handler"
        ],
        priority=2
    ))

    return tasks


def main():
    """Main entry point"""
    print("=" * 60)
    print("SGA QA System - AI Team Orchestrator")
    print("=" * 60)

    project_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    print(f"\nProject directory: {project_dir}")

    # Initialize orchestrator
    orchestrator = Orchestrator(project_dir)

    # Add Sprint 4 tasks
    print("\nLoading Sprint 4 tasks...")
    tasks = create_sprint4_tasks()
    for task in tasks:
        orchestrator.add_task(task)

    print(f"Loaded {len(tasks)} tasks")

    # Show task summary
    print("\n" + "-" * 40)
    print("Task Queue:")
    print("-" * 40)
    for i, task in enumerate(orchestrator.task_queue):
        print(f"{i+1}. [{task.worker.value}] {task.title}")

    # Ask for confirmation
    print("\n" + "-" * 40)
    response = input("Execute all tasks? (y/n): ").strip().lower()

    if response == 'y':
        orchestrator.run_all_tasks()
    else:
        print("Aborted.")


if __name__ == "__main__":
    main()
