#!/usr/bin/env python3
"""
Generate Power Automate flows for SharePoint and Teams integration
"""

import os
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))
from run_task import execute_prompt

PROJECT_ROOT = Path(__file__).parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / "m365-deployment" / "power-automate"

def generate_power_automate_flows():
    """Generate Power Automate flow specifications"""

    prompt = """Create detailed Power Automate flow specifications for the SGA QA System.

**Context:**
The SGA QA System is a construction quality assurance app with:
- SharePoint site: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
- 4 divisions: Asphalt, Profiling, Spray, Grooving
- Users: Foremen, Engineers, Admins, Management
- Document types: QA Packs, Job Sheets, Site Visit Reports, Scope Reports, NCRs, Incidents

**Required Flows:**

1. **QA Pack Submission Flow**
   - Trigger: New PDF uploaded to SharePoint "QA Packs" library
   - Actions:
     - Extract metadata (job number, date, division, foreman)
     - Send Teams notification to assigned engineer
     - Create task in Planner for review
     - Update job status in Dataverse

2. **Site Visit Notification Flow**
   - Trigger: New job created with client tier
   - Actions:
     - Calculate visit dates based on tier (T1: 14,7,3 days | T2: 7,3 days | T3: 72 hours)
     - Create calendar events in Teams shared calendar
     - Send notification to assigned engineer
     - Create reminder 24 hours before each visit

3. **Job Sheet Distribution Flow**
   - Trigger: Job sheet uploaded to SharePoint
   - Actions:
     - Identify assigned crew/foreman
     - Send Teams message to crew-specific channel
     - Add calendar event for job date
     - Send mobile push notification to foreman

4. **Scope Report Automation Flow**
   - Trigger: Scope report submitted
   - Actions:
     - Save to SharePoint "Scope Reports" folder
     - Extract key findings
     - Post summary in Teams "Site Visits" channel
     - Notify project owner

5. **NCR/Incident Alert Flow**
   - Trigger: NCR or Incident created
   - Actions:
     - Send immediate Teams notification to HSEQ manager
     - Create high-priority task in Planner
     - Email management team
     - Log in compliance register

6. **Daily Summary Flow**
   - Trigger: Scheduled daily at 5 PM
   - Actions:
     - Aggregate all QA packs submitted today
     - Generate summary report
     - Post in Teams "Daily Updates" channel
     - Email to management

**Output Format:**
For each flow, provide:
1. Flow name and description
2. Trigger configuration (JSON)
3. Step-by-step actions (with Power Automate action names)
4. Conditions and branching logic
5. Error handling steps
6. Complete flow JSON schema (ready to import)

Use Power Automate syntax and actual connector names (SharePoint, Teams, Planner, etc.).
Make flows production-ready with proper error handling.
"""

    system_prompt = "You are an expert Microsoft Power Automate developer specializing in SharePoint and Teams integrations."

    print("Generating Power Automate flows...")
    result = execute_prompt("grok1", prompt, system_prompt)

    return result

def generate_sharepoint_structure():
    """Generate SharePoint site structure specification"""

    prompt = """Create a complete SharePoint site structure specification for the SGA QA System.

**Site URL:** https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance

**Required Structure:**

**Document Libraries:**
1. QA Packs (with folders per division)
2. Job Sheets
3. Scope Reports
4. Site Visit Reports
5. NCR Register
6. Incident Reports
7. Templates
8. Resources

**Lists:**
1. Jobs (Dataverse connection)
2. Client Tiers
3. Project Assignments
4. Calendar Events

**For each library/list, provide:**
- Name and description
- Columns (with types: Text, Number, Date, Choice, Person, etc.)
- Required vs optional fields
- Default values
- Metadata (for filtering/search)
- Folder structure
- Permissions (by role: Foreman, Engineer, Admin, Management)
- Views (All Items, My Items, By Division, etc.)

**Also include:**
- Site navigation structure
- Web parts for home page
- Custom forms (if needed)
- Content types
- Retention policies

**Output Format:**
Provide:
1. PowerShell script to create all libraries/lists
2. JSON schema for each library (with all columns)
3. Permission matrix (role → library → access level)
4. Site homepage layout specification

Make it production-ready and secure.
"""

    system_prompt = "You are an expert SharePoint architect specializing in document management systems."

    print("Generating SharePoint structure...")
    result = execute_prompt("grok1", prompt, system_prompt)

    return result

def save_outputs(flows_content: str, sharepoint_content: str):
    """Save generated content to files"""

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Save flows
    flows_file = OUTPUT_DIR / f"power_automate_flows_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    with open(flows_file, 'w', encoding='utf-8') as f:
        f.write("# Power Automate Flows for SGA QA System\n\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n\n")
        f.write(flows_content)

    # Save SharePoint structure
    sharepoint_file = OUTPUT_DIR / f"sharepoint_structure_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    with open(sharepoint_file, 'w', encoding='utf-8') as f:
        f.write("# SharePoint Site Structure for SGA QA System\n\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n\n")
        f.write(sharepoint_content)

    print(f"\n[OK] Flows saved to: {flows_file}")
    print(f"[OK] SharePoint structure saved to: {sharepoint_file}")

def main():
    print("=" * 60)
    print("SGA QA System - M365 Integration")
    print("Power Automate Flows & SharePoint Structure")
    print("=" * 60)

    try:
        # Generate flows
        print("\n[1/2] Generating Power Automate flows...")
        flows = generate_power_automate_flows()

        # Generate SharePoint structure
        print("\n[2/2] Generating SharePoint structure...")
        sharepoint = generate_sharepoint_structure()

        # Save outputs
        save_outputs(flows, sharepoint)

        print("\n" + "=" * 60)
        print("M365 Integration specifications complete!")
        print("=" * 60)

    except Exception as e:
        print(f"\n[FAIL] Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
