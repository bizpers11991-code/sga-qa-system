#!/usr/bin/env python3
"""
SGA QA System - Sprint 4 PWA Overhaul Orchestrator
Coordinates multiple AI agents to build the complete PWA application

Coordinator: Claude Sonnet 4.5
AI Team: Gemini, Qwen, Grok, DeepSeek
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv not installed. Using environment variables only.")


class AIAgent:
    """Represents a single AI agent in the team"""

    def __init__(self, name: str, model: str, api_endpoint: str, api_key: str, role: str):
        self.name = name
        self.model = model
        self.api_endpoint = api_endpoint
        self.api_key = api_key
        self.role = role
        self.tasks_completed = 0
        self.total_tokens = 0
        self.workstreams = []

    def __str__(self):
        return f"{self.name} ({self.role})"

    def assign_workstream(self, workstream_id: str):
        """Assign a workstream to this agent"""
        self.workstreams.append(workstream_id)

    def call_api(self, prompt: str, system_prompt: str = None) -> Dict[str, Any]:
        """Call the AI agent's API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Different API formats for different providers
        if "generativelanguage.googleapis.com" in self.api_endpoint:
            # Gemini API format
            url = f"{self.api_endpoint}?key={self.api_key}"
            data = {
                "contents": [{
                    "parts": [{
                        "text": f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 8192,
                }
            }
            headers = {"Content-Type": "application/json"}
        else:
            # OpenRouter/OpenCode.ai format (OpenAI-compatible)
            url = self.api_endpoint
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            data = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 8192
            }

        try:
            response = requests.post(url, headers=headers, json=data, timeout=120)
            response.raise_for_status()
            result = response.json()

            # Extract response text based on provider
            if "generativelanguage.googleapis.com" in self.api_endpoint:
                text = result["candidates"][0]["content"]["parts"][0]["text"]
                tokens = result.get("usageMetadata", {}).get("totalTokenCount", 0)
            else:
                text = result["choices"][0]["message"]["content"]
                tokens = result.get("usage", {}).get("total_tokens", 0)

            self.total_tokens += tokens
            return {"success": True, "text": text, "tokens": tokens}

        except Exception as e:
            return {"success": False, "error": str(e)}


class Sprint4Orchestrator:
    """Orchestrates the Sprint 4 PWA overhaul with multiple AI agents"""

    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent
        self.output_dir = self.project_root / "ai_team_output" / "sprint4"
        self.tasks_dir = self.output_dir / "tasks"
        self.deliverables_dir = self.output_dir / "deliverables"

        # Create directories
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.tasks_dir.mkdir(parents=True, exist_ok=True)
        self.deliverables_dir.mkdir(parents=True, exist_ok=True)

        # Initialize logging
        self.log_file = self.output_dir / f"orchestrator_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

        # AI agents
        self.agents: Dict[str, AIAgent] = {}
        self.task_queue: List[Dict] = []
        self.completed_tasks: List[str] = []

    def log(self, message: str, level: str = "INFO"):
        """Log message to console and file"""
        timestamp = datetime.now().isoformat()
        log_message = f"[{timestamp}] [{level}] {message}"
        print(log_message)

        with open(self.log_file, "a") as f:
            f.write(log_message + "\n")

    def initialize_agents(self):
        """Initialize all AI agents with API keys"""
        self.log("🤖 Initializing AI Team...")

        # Load API keys
        GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
        OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY_1") or os.environ.get("OPENROUTER_API_KEY")
        OPENCODE_KEY_1 = os.environ.get("OPENCODE_API_KEY_1") or os.environ.get("OPENCODE_API_KEY")
        OPENCODE_KEY_2 = os.environ.get("OPENCODE_API_KEY_2")

        # Verify keys
        if not GOOGLE_API_KEY:
            self.log("❌ GOOGLE_API_KEY not found", "ERROR")
        else:
            self.log("✓ Gemini API key found")
            self.agents["gemini"] = AIAgent(
                name="Gemini 2.0 Flash Exp",
                model="gemini-2.0-flash-exp",
                api_endpoint="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
                api_key=GOOGLE_API_KEY,
                role="Senior Full-Stack Developer"
            )

        if not OPENROUTER_KEY:
            self.log("⚠️  OPENROUTER_API_KEY not found (Qwen, DeepSeek unavailable)", "WARN")
        else:
            self.log("✓ OpenRouter API key found")
            self.agents["qwen"] = AIAgent(
                name="Qwen 2.5 Coder 32B",
                model="qwen/qwen-2.5-coder-32b-instruct",
                api_endpoint="https://openrouter.ai/api/v1/chat/completions",
                api_key=OPENROUTER_KEY,
                role="Architecture Specialist"
            )
            self.agents["deepseek"] = AIAgent(
                name="DeepSeek Coder V3",
                model="deepseek/deepseek-coder",
                api_endpoint="https://openrouter.ai/api/v1/chat/completions",
                api_key=OPENROUTER_KEY,
                role="Backend Integration Specialist"
            )

        if not OPENCODE_KEY_1:
            self.log("⚠️  OPENCODE_API_KEY_1 not found (Grok unavailable)", "WARN")
        else:
            self.log("✓ OpenCode.ai Account 1 key found")
            self.agents["grok1"] = AIAgent(
                name="Grok Beta (Account 1)",
                model="grok-beta",
                api_endpoint="https://models.dev/api/v1/chat/completions",
                api_key=OPENCODE_KEY_1,
                role="Frontend Developer"
            )

        if OPENCODE_KEY_2:
            self.log("✓ OpenCode.ai Account 2 key found")
            self.agents["grok2"] = AIAgent(
                name="Grok Beta (Account 2)",
                model="grok-beta",
                api_endpoint="https://models.dev/api/v1/chat/completions",
                api_key=OPENCODE_KEY_2,
                role="Support Developer"
            )

        self.log(f"\n✅ Initialized {len(self.agents)} AI agents")
        for agent_id, agent in self.agents.items():
            self.log(f"   - {agent}")

    def load_task_definitions(self):
        """Load all task definition JSON files"""
        self.log("\n📋 Loading task definitions...")

        task_files = list(self.tasks_dir.glob("WS*.json"))
        self.log(f"Found {len(task_files)} workstream task files")

        for task_file in task_files:
            try:
                with open(task_file, "r") as f:
                    task_data = json.load(f)
                    self.task_queue.append(task_data)
                    self.log(f"   ✓ Loaded {task_file.name}: {task_data['title']}")
            except Exception as e:
                self.log(f"   ❌ Error loading {task_file.name}: {e}", "ERROR")

        # Sort by priority (P0 first)
        self.task_queue.sort(key=lambda x: (x.get("priority", "P9"), x.get("workstream_id", "")))

        self.log(f"\n✅ Loaded {len(self.task_queue)} workstreams")

    def assign_tasks_to_agents(self):
        """Assign workstreams to AI agents"""
        self.log("\n📌 Assigning tasks to agents...")

        # Assignment mapping (from coordinator document)
        assignments = {
            "WS1": "gemini",
            "WS2": "qwen",
            "WS3": "grok1",
            "WS4": "deepseek",
            "WS5": "gemini",
            "WS6": "grok1",
            "WS7": "qwen",
            "WS8": "deepseek",
            "WS9": "gemini",
            "WS10": "gemini"  # Collaborative, but primary is Gemini
        }

        for task in self.task_queue:
            ws_id = task["workstream_id"]
            agent_id = assignments.get(ws_id)

            if agent_id and agent_id in self.agents:
                self.agents[agent_id].assign_workstream(ws_id)
                task["assigned_agent"] = agent_id
                self.log(f"   ✓ {ws_id} → {self.agents[agent_id].name}")
            else:
                self.log(f"   ⚠️  {ws_id} - No available agent", "WARN")

    def execute_workstream(self, workstream: Dict, agent: AIAgent) -> Dict:
        """Execute a single workstream with the assigned agent"""
        ws_id = workstream["workstream_id"]
        title = workstream["title"]

        self.log(f"\n{'='*60}")
        self.log(f"🚀 Starting {ws_id}: {title}")
        self.log(f"   Agent: {agent.name}")
        self.log(f"   Priority: {workstream['priority']}")
        self.log(f"   Estimated: {workstream['estimated_hours']}h")
        self.log(f"{'='*60}\n")

        # Build comprehensive prompt for the AI agent
        system_prompt = f"""You are {agent.name}, a {agent.role} working on the SGA QA System PWA overhaul project.

Your role is to implement {title} (Workstream {ws_id}).

You are part of an AI team coordinated by Claude Sonnet 4.5. Your deliverables will be reviewed and integrated by Claude.

IMPORTANT GUIDELINES:
1. Follow the SGA design system exactly (Amber color palette: #b45309, #d97706)
2. Use TypeScript with strict typing
3. Follow React best practices (functional components, hooks)
4. Make components responsive (mobile, tablet, desktop)
5. iPad-optimize all touch targets (minimum 44px)
6. Include ARIA labels for accessibility
7. Use Tailwind CSS for styling
8. No hardcoded API keys or secrets
9. Write clean, documented code

PROJECT CONTEXT:
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS
- Auth: Microsoft MSAL (Azure AD)
- Backend: 45+ API endpoints already exist (Vercel serverless functions)
- Target: PWA for Windows desktop + iPad

Your task details are provided below. Please implement all tasks and provide:
1. Complete working code for all files
2. Clear documentation
3. Any setup/configuration instructions
4. Testing notes"""

        # Create detailed task prompt
        task_prompt = f"""## Workstream {ws_id}: {title}

### Objectives:
{json.dumps(workstream['objectives'], indent=2)}

### Tasks to Complete:
{json.dumps(workstream['tasks'], indent=2)}

### Acceptance Criteria:
{json.dumps(workstream['acceptance_criteria'], indent=2)}

### Expected Deliverables:
{json.dumps(workstream['deliverables'], indent=2)}

Please implement all tasks above. Provide:
1. Complete code for all files (with full file paths)
2. Setup/configuration instructions
3. Testing approach
4. Any dependencies or integration notes

Format your response as:
## Summary
[Brief overview of implementation]

## Files Created/Modified
[List each file with complete code]

### File: <path>
```<language>
[complete code]
```

## Setup Instructions
[Any setup needed]

## Testing Notes
[How to test this workstream]

## Integration Notes
[Dependencies or notes for integration with other workstreams]

Begin implementation now:"""

        # Call the AI agent
        self.log(f"📡 Calling {agent.name} API...")
        start_time = time.time()

        result = agent.call_api(task_prompt, system_prompt)

        elapsed_time = time.time() - start_time

        if result["success"]:
            self.log(f"✅ {agent.name} completed {ws_id} in {elapsed_time:.1f}s")
            self.log(f"   Tokens used: {result['tokens']}")

            # Save deliverable
            agent_dir = self.deliverables_dir / agent.name.lower().replace(" ", "_").split("_")[0]
            agent_dir.mkdir(exist_ok=True)

            deliverable_file = agent_dir / f"{ws_id}_deliverable.md"
            with open(deliverable_file, "w") as f:
                f.write(f"# {ws_id}: {title}\n")
                f.write(f"**Agent**: {agent.name}\n")
                f.write(f"**Date**: {datetime.now().isoformat()}\n")
                f.write(f"**Execution Time**: {elapsed_time:.1f}s\n")
                f.write(f"**Tokens Used**: {result['tokens']}\n\n")
                f.write("---\n\n")
                f.write(result["text"])

            self.log(f"💾 Saved deliverable: {deliverable_file}")

            agent.tasks_completed += 1
            self.completed_tasks.append(ws_id)

            return {
                "success": True,
                "workstream_id": ws_id,
                "agent": agent.name,
                "output_file": str(deliverable_file),
                "elapsed_time": elapsed_time,
                "tokens": result["tokens"]
            }
        else:
            self.log(f"❌ {agent.name} failed on {ws_id}: {result['error']}", "ERROR")
            return {
                "success": False,
                "workstream_id": ws_id,
                "agent": agent.name,
                "error": result["error"]
            }

    def run_phase(self, phase_num: int, workstream_ids: List[str], parallel: bool = False):
        """Execute a phase of workstreams"""
        self.log(f"\n{'='*60}")
        self.log(f"🚀 PHASE {phase_num} START")
        self.log(f"   Workstreams: {', '.join(workstream_ids)}")
        self.log(f"   Mode: {'PARALLEL' if parallel else 'SEQUENTIAL'}")
        self.log(f"{'='*60}\n")

        phase_results = []

        for ws_id in workstream_ids:
            # Find workstream in task queue
            workstream = next((ws for ws in self.task_queue if ws["workstream_id"] == ws_id), None)
            if not workstream:
                self.log(f"⚠️  Workstream {ws_id} not found", "WARN")
                continue

            agent_id = workstream.get("assigned_agent")
            if not agent_id or agent_id not in self.agents:
                self.log(f"⚠️  No agent assigned to {ws_id}", "WARN")
                continue

            agent = self.agents[agent_id]

            # Execute workstream
            result = self.execute_workstream(workstream, agent)
            phase_results.append(result)

            if not parallel:
                # Wait a bit between sequential tasks
                time.sleep(2)

        # Phase summary
        successful = sum(1 for r in phase_results if r["success"])
        total_tokens = sum(r.get("tokens", 0) for r in phase_results if r["success"])

        self.log(f"\n{'='*60}")
        self.log(f"✅ PHASE {phase_num} COMPLETE")
        self.log(f"   Success rate: {successful}/{len(phase_results)}")
        self.log(f"   Total tokens: {total_tokens}")
        self.log(f"{'='*60}\n")

        return phase_results

    def run(self):
        """Execute the full Sprint 4 orchestration"""
        self.log("="*60)
        self.log("🚀 SGA QA System - Sprint 4 PWA Overhaul")
        self.log("   AI Team Orchestrator")
        self.log("="*60)

        # Initialize
        self.initialize_agents()
        self.load_task_definitions()
        self.assign_tasks_to_agents()

        if not self.agents:
            self.log("\n❌ No AI agents available. Please set API keys.", "ERROR")
            return

        self.log(f"\n{'='*60}")
        self.log("📊 Execution Plan")
        self.log(f"   Total Workstreams: {len(self.task_queue)}")
        self.log(f"   Active Agents: {len(self.agents)}")
        self.log(f"{'='*60}\n")

        input("Press Enter to start execution...")

        all_results = []

        # Phase 1: Foundation (Sequential - Blocking)
        phase1_results = self.run_phase(1, ["WS1", "WS2"], parallel=False)
        all_results.extend(phase1_results)

        # Check if Phase 1 succeeded
        if not all(r["success"] for r in phase1_results):
            self.log("\n❌ Phase 1 failed. Cannot proceed to Phase 2.", "ERROR")
            return

        # Phase 2: Core Features (Parallel)
        phase2_results = self.run_phase(2, ["WS3", "WS4", "WS5", "WS6"], parallel=True)
        all_results.extend(phase2_results)

        # Phase 3: Extended Features (Parallel)
        phase3_results = self.run_phase(3, ["WS7", "WS8", "WS9", "WS10"], parallel=True)
        all_results.extend(phase3_results)

        # Final summary
        self.log("\n" + "="*60)
        self.log("📊 FINAL SUMMARY")
        self.log("="*60)

        successful = sum(1 for r in all_results if r["success"])
        failed = sum(1 for r in all_results if not r["success"])
        total_tokens = sum(r.get("tokens", 0) for r in all_results if r["success"])

        self.log(f"Total Workstreams: {len(all_results)}")
        self.log(f"✅ Successful: {successful}")
        self.log(f"❌ Failed: {failed}")
        self.log(f"🎯 Success Rate: {successful/len(all_results)*100:.1f}%")
        self.log(f"📊 Total Tokens: {total_tokens:,}")

        # Agent statistics
        self.log("\n📈 Agent Statistics:")
        for agent_id, agent in self.agents.items():
            self.log(f"   {agent.name}:")
            self.log(f"      Tasks completed: {agent.tasks_completed}")
            self.log(f"      Total tokens: {agent.total_tokens:,}")

        self.log("\n✅ Sprint 4 Orchestration Complete!")
        self.log(f"📁 Deliverables saved to: {self.deliverables_dir}")
        self.log(f"📝 Log file: {self.log_file}")

        self.log("\n🎯 Next Steps:")
        self.log("   1. Review deliverables in ai_team_output/sprint4/deliverables/")
        self.log("   2. Claude will integrate and review all code")
        self.log("   3. Run tests and fix any integration issues")
        self.log("   4. Deploy to GitHub and Vercel")


def main():
    """Main entry point"""
    orchestrator = Sprint4Orchestrator()
    orchestrator.run()


if __name__ == "__main__":
    main()
