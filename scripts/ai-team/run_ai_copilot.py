#!/usr/bin/env python3
"""
Generate AI Copilot Project Manager specification and implementation
"""

import os
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))
from run_task import execute_prompt

PROJECT_ROOT = Path(__file__).parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / "m365-deployment" / "copilot"

def generate_copilot_architecture():
    """Generate AI Copilot architecture and implementation plan"""

    prompt = """Design and implement an AI Copilot Project Manager for the SGA QA System.

**Overview:**
Create an AI agent that lives in SharePoint/Teams and acts as an intelligent project manager.
It should understand all work across divisions, create reports, and answer queries.

**Data Sources:**
- SharePoint document libraries (QA Packs, Job Sheets, Scope Reports, NCRs)
- Dataverse tables (Jobs, Projects, Assignments)
- Teams messages and notifications
- Calendar events

**Core Capabilities:**

1. **Document Understanding**
   - Read and extract data from PDFs (QA packs, reports)
   - Understand job sheets, scope reports, NCRs
   - Track project progress across divisions
   - Identify patterns and anomalies

2. **Report Generation**
   - Daily summaries (jobs completed, issues found, safety incidents)
   - Weekly project status reports
   - Monthly analytics (productivity, quality metrics)
   - Custom reports on demand

3. **Query Answering**
   - "What's the status of Project XYZ?"
   - "Show all NCRs from last month"
   - "Which foremen submitted late last week?"
   - "What projects are scheduled for next week?"
   - "Give me safety incidents for Asphalt division"

4. **Proactive Insights**
   - Identify projects at risk (late submissions, missing visits)
   - Alert on repeated quality issues
   - Suggest resource allocation
   - Predict project completion dates

**Technical Implementation:**

**Option 1: Microsoft Copilot Studio**
- Use Copilot Studio with custom topics
- Connect to SharePoint via Graph API
- Use Dataverse as knowledge base
- Deploy as Teams app

**Option 2: Azure AI + Custom Bot**
- Azure OpenAI for language understanding
- Azure Document Intelligence for PDF extraction
- Bot Framework for Teams integration
- Power Virtual Agents for conversational UI

**Option 3: Hybrid Approach**
- SharePoint Syntex for document understanding
- Power Automate for data aggregation
- Copilot Studio for user interface
- Azure Functions for complex logic

**Security Requirements:**
- Row-level security (users only see their data)
- Audit logging for all queries
- Data encryption at rest and in transit
- Compliance with company data policies

**Deliverables:**

1. **Architecture Diagram**
   - Component overview
   - Data flow
   - Integration points

2. **Implementation Guide**
   - Step-by-step setup instructions
   - Configuration for each service
   - Deployment checklist

3. **Copilot Topics/Intents**
   - List of supported questions
   - Response templates
   - Trigger phrases

4. **Code Samples**
   - Graph API queries for data extraction
   - Document Intelligence integration
   - Report generation logic
   - Teams bot handlers

5. **Testing Plan**
   - Sample queries and expected responses
   - Edge cases
   - Performance benchmarks

**Output Format:**
Provide a complete, production-ready specification with:
- Architectural decisions and justifications
- Complete code for all components
- Configuration files (JSON, YAML)
- PowerShell/CLI deployment scripts
- Documentation in Markdown

Choose the best approach for the SGA use case and provide full implementation details.
"""

    system_prompt = "You are an expert AI architect specializing in Microsoft 365 AI solutions, Copilot Studio, and Azure AI services."

    print("Generating AI Copilot architecture and implementation...")
    result = execute_prompt("deepseek", prompt, system_prompt)

    return result

def generate_copilot_ui():
    """Generate the Copilot UI component for the web app"""

    prompt = """Create a Copilot chat interface component for the SGA QA System web app.

**Requirements:**

1. **Chat Interface**
   - Clean, modern chat UI (like ChatGPT)
   - Message history
   - Typing indicators
   - Quick action buttons
   - Dark mode support

2. **Features**
   - Text input with send button
   - Voice input (speech-to-text)
   - Suggested queries/prompts
   - Context awareness (current page/job)
   - Export chat history

3. **Integration Points**
   - API endpoint: /api/copilot/query
   - Real-time updates via websockets
   - SharePoint document links in responses
   - Inline charts/graphs for analytics

4. **Quick Actions**
   - "Show my jobs for today"
   - "Latest NCRs"
   - "Project status: [job number]"
   - "Generate weekly report"

**Tech Stack:**
- React + TypeScript
- Tailwind CSS
- react-markdown for formatted responses
- react-speech-recognition for voice
- recharts for inline visualizations

**Component Structure:**
- CopilotChat (main container)
- CopilotMessage (individual messages)
- CopilotInput (text/voice input)
- CopilotSuggestions (quick actions)
- CopilotHistory (message list)

**Output:**
Provide complete TypeScript React components, ready to integrate into the app.
Include types, hooks, and API integration logic.
"""

    system_prompt = "You are an expert React/TypeScript developer specializing in conversational UI and AI chat interfaces."

    print("Generating Copilot UI components...")
    result = execute_prompt("qwen", prompt, system_prompt)

    return result

def save_outputs(architecture: str, ui_code: str):
    """Save generated content to files"""

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Save architecture
    arch_file = OUTPUT_DIR / f"copilot_architecture_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    with open(arch_file, 'w', encoding='utf-8') as f:
        f.write("# AI Copilot Project Manager - Architecture\n\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n\n")
        f.write(architecture)

    # Save UI code
    ui_file = OUTPUT_DIR / f"copilot_ui_components_{datetime.now().strftime('%Y%m%d_%H%M%S')}.tsx"
    with open(ui_file, 'w', encoding='utf-8') as f:
        # Clean markdown code blocks if present
        clean_code = ui_code
        if "```tsx" in ui_code or "```typescript" in ui_code:
            lines = ui_code.split('\n')
            code_lines = []
            in_code_block = False
            for line in lines:
                if line.strip().startswith('```'):
                    in_code_block = not in_code_block
                    continue
                if in_code_block:
                    code_lines.append(line)
            clean_code = '\n'.join(code_lines) if code_lines else ui_code

        f.write(clean_code)

    print(f"\n[OK] Architecture saved to: {arch_file}")
    print(f"[OK] UI components saved to: {ui_file}")

def main():
    print("=" * 60)
    print("SGA QA System - AI Copilot Project Manager")
    print("=" * 60)

    try:
        # Generate architecture
        print("\n[1/2] Generating Copilot architecture...")
        architecture = generate_copilot_architecture()

        # Generate UI
        print("\n[2/2] Generating Copilot UI components...")
        ui_code = generate_copilot_ui()

        # Save outputs
        save_outputs(architecture, ui_code)

        print("\n" + "=" * 60)
        print("AI Copilot specifications complete!")
        print("=" * 60)

    except Exception as e:
        print(f"\n[FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
