# 🚀 SGA QA System - Claude Code AI Team Master Plan

## 📋 Executive Summary
You are Claude Code, tasked with orchestrating a 6-AI worker team to complete the SGA QA System to 100% production-ready state. This document provides your complete roadmap and execution strategy.

**Current Status:** Sprint 3 COMPLETE - Basic features working
**Target:** 100% Commercial-ready PWA with full M365 integration
**Your Role:** AI Team Orchestrator using secure PowerShell commands

## 🎯 PROJECT VISION (MUST ACHIEVE)

### Core Requirements from Original App (REFERENCE)
Location: `C:\Dhruv\sga-qa-system\archive\readme\sga-qa-pack (Original Code) (Readme)`
- **Job Creation:** Engineers/Admins create jobs → Scheduler visible to all
- **Assignment:** Jobs assigned to Foremen with notifications
- **QA Pack Forms:** EXACT forms as in original (Asphalt, Profiling, Spray, Grooving)
- **PDF Export:** Minimal, formal format with proper headers/footers
- **Logo Usage:** SGA Logo (top-left), watermark, page numbers, "uncontrolled" warning

### NEW Features to Add
1. **Full Scheduling System:**
   - Scheduler takes client orders (weeks in advance)
   - Basic info: client, project, location, job number, area, thickness, asphalt plant
   - Smart division-specific forms
   - Assigns crews to jobs
   
2. **Master Calendar Integration:**
   - Teams shared calendar (visible in app + Outlook)
   - Admin/Engineer/Management filters
   - Division and crew filtering

3. **Tier-Based Site Visits:**
   - Tier 1: 3 visits (14, 7, 3 days out)
   - Tier 2: 2 visits (7, 3 days out) 
   - Tier 3: 1 visit (within 72 hours)
   - Automated Teams notifications
   - Scope reports saved as PDFs

4. **AI Project Manager (Copilot):**
   - Understands all work across divisions
   - Creates full project reports
   - Answers queries using all documents
   - Lives in SharePoint securely

## 🤖 YOUR AI WORKER TEAM

### Configuration (.env file ALREADY SET UP)
```
GOOGLE_API_KEY="[Gemini 2.5 Pro - Architecture & Review]"
OPENCODE_API_KEY_1="[Grok-code Account 1 - M365 Development]"
OPENCODE_API_KEY_2="[Grok-code Account 2 - Power Apps UI]"
OPENROUTER_API_KEY_1="[Qwen 2.5 Coder 32B - Code Generation]"
OPENROUTER_API_KEY_2="[DeepSeek V3.1 671B - Advanced Logic]"
```

### Worker Roles & Assignments
1. **Gemini 2.5 Pro** ($0.05/sprint) - Security audits, architecture review
2. **Grok-code #1** (FREE) - SharePoint, Teams, Power Automate
3. **Grok-code #2** (FREE) - Power Apps screens, UI components  
4. **Qwen 2.5 Coder** (FREE) - TypeScript, React, API development
5. **DeepSeek V3.1** (FREE) - Complex algorithms, Copilot integration

## 📁 DIRECTORY STRUCTURE & KEY FILES

### Reference Material (STUDY FIRST)
```
archive/readme/sga-qa-pack (Original Code)/  # Original app standards
archive/readme/SGA Logo.png                   # Company logo
archive/readme/forms/                         # QA form templates
```

### Current Implementation
```
src/                    # Vercel React app (TypeScript)
m365-deployment/        # M365 components
docs/m365-integration/  # Integration guides
ai_team_output/         # AI team deliverables
scripts/ai-team/        # AI orchestration tools
```

### SharePoint Site
URL: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance

## 🚀 EXECUTION PLAN (5 PHASES)

### PHASE 1: Analysis & Cleanup (2 hours)
```powershell
# 1. Analyze current state
python scripts/ai-team/run_team.py --task "analyze_current_state"

# 2. Create dependency map
python scripts/ai-team/run_team.py --task "map_dependencies"

# 3. Clean unused files
python scripts/ai-team/run_team.py --task "cleanup_code"

# Output: ai_team_output/phase1/analysis_report.md
```
### PHASE 2: Scheduling System Development (4 hours)
```powershell
# 1. Create scheduling data models
python scripts/ai-team/run_team.py --task "create_scheduling_models" --workers "qwen,deepseek"

# 2. Build calendar integration
python scripts/ai-team/run_team.py --task "teams_calendar_integration" --workers "grok1,gemini"

# 3. Implement tier-based site visits
python scripts/ai-team/run_team.py --task "site_visit_automation" --workers "grok2,qwen"

# Output: m365-deployment/scheduling/
```

**Deliverables:**
- Dataverse tables for scheduling
- Power Automate flows for notifications
- Teams calendar connector
- Site visit report templates

### PHASE 3: Enhanced QA Forms & PDF System (3 hours)
```powershell
# 1. Replicate original QA forms exactly
python scripts/ai-team/run_team.py --task "replicate_qa_forms" --reference "archive/readme/sga-qa-pack"

# 2. Implement PDF generation with exact formatting
python scripts/ai-team/run_team.py --task "pdf_generation_system" --workers "qwen,grok1"

# 3. SharePoint integration for storage
python scripts/ai-team/run_team.py --task "sharepoint_storage" --workers "grok2,gemini"

# Output: src/components/forms/, src/services/pdfGenerator/
```

**Key Requirements:**
- Logo placement (top-left)
- Margins: 0.3-1.8
- SGA watermark
- Page numbers (bottom-right)
- "Uncontrolled documents" warning (footer-center)
- Document ID & version (bottom-left)

### PHASE 4: Copilot AI Project Manager (3 hours)
```powershell
# 1. Design Copilot architecture
python scripts/ai-team/run_team.py --task "copilot_architecture" --workers "deepseek,gemini"

# 2. Implement document understanding
python scripts/ai-team/run_team.py --task "document_ai_processing" --workers "qwen,grok1"

# 3. Build query interface
python scripts/ai-team/run_team.py --task "copilot_interface" --workers "grok2,qwen"

# Output: m365-deployment/copilot/
```

**Features:**
- Reads all project documents from SharePoint
- Generates project summaries
- Answers complex queries
- Creates insights across divisions

### PHASE 5: Production Deployment & Testing (2 hours)
```powershell
# 1. Deploy to SharePoint
.\scripts\Deploy-DataverseSchema.ps1

# 2. Configure Teams integration
python scripts/ai-team/run_team.py --task "teams_deployment"

# 3. Deploy Vercel PWA
vercel --prod

# 4. Run comprehensive tests
python scripts/ai-team/run_team.py --task "full_system_test"
```

## 🛡️ SECURITY REQUIREMENTS (CRITICAL)

### Data Privacy with Free Models
1. **Never send:** Real names, addresses, phone numbers, emails
2. **Use placeholders:** "Client_A", "Location_B", "Project_123"
3. **Sanitize inputs:** Remove PII before sending to free models
4. **Local processing:** Keep sensitive operations in PowerShell

### Secure Communication Pattern
```python
# Example: Secure task delegation
def delegate_to_worker(task, data):
    # Sanitize sensitive data
    safe_data = sanitize_pii(data)
    
    # Use paid model for sensitive tasks
    if task.requires_security:
        return gemini_pro.process(data)  # Paid, secure
    
    # Use free models for generic tasks
    return free_model.process(safe_data)  # Free, sanitized
```

## 📊 SUCCESS METRICS

### Must Achieve (100% Required)
- [ ] All original QA forms replicated exactly
- [ ] PDF formatting matches specifications
- [ ] Teams calendar fully integrated
- [ ] SharePoint document storage working
- [ ] Tier-based site visits automated
- [ ] Copilot AI answering queries
- [ ] PWA deployed on Vercel Pro
- [ ] Azure AD authentication working
- [ ] All divisions supported (Asphalt, Profiling, Spray, Grooving)

### Quality Standards
- Code coverage: >80%
- Performance: <2s page load
- Security: Zero critical vulnerabilities
- Accessibility: WCAG 2.1 AA compliant
- Mobile-first: iPad optimized

## 🔧 TOOLS & COMMANDS

### PowerShell Orchestration
```powershell
# Start AI team session
cd C:\Dhruv\sga-qa-system
python scripts\ai-team\run_team.py --start

# Monitor progress
python scripts\ai-team\run_team.py --status

# Review outputs
Get-Content ai_team_output\latest\*.md
```

### Vercel Deployment
```bash
# Build and test locally
npm run build
npm run preview

# Deploy to production
vercel --prod
```

### M365 Commands
```powershell
# Connect to SharePoint
Connect-PnPOnline -Url "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance"

# Deploy Power Apps
pac solution import --path solutions/SGAQAPack.zip

# Configure Teams
Install-Module MicrosoftTeams
Connect-MicrosoftTeams
```

## 📝 TASK DELEGATION TEMPLATE

When delegating to AI workers, use this format:

```python
task = {
    "id": "TASK_001",
    "title": "Implement Teams Calendar Integration",
    "assigned_to": ["grok1", "gemini"],
    "context": {
        "reference_files": ["docs/m365-integration/09_TEAMS_INTEGRATION.md"],
        "requirements": ["Must sync with Outlook", "Support filtering by division"],
        "constraints": ["Use Graph API", "No custom connectors"]
    },
    "deliverables": [
        "m365-deployment/teams-calendar/connector.ts",
        "Documentation in docs/deployment/"
    ],
    "success_criteria": [
        "Calendar events visible in app",
        "Bidirectional sync working",
        "Filters functional"
    ]
}
```

## ⚡ QUICK START FOR CLAUDE CODE

1. **Read this entire document first**
2. **Study the original app:** `archive/readme/sga-qa-pack (Original Code)/`
3. **Check current progress:** `ai_team_output/sprint3/`
4. **Start Phase 1 analysis**
5. **Delegate tasks to AI workers using scripts**
6. **Monitor and coordinate outputs**
7. **Test each component before moving to next phase**

## 🎯 FINAL GOAL

Transform the current basic QA system into a **commercial-grade enterprise PWA** that:
- Handles 500+ daily users
- Processes 1000+ QA packs/month
- Integrates seamlessly with M365
- Provides real-time insights via Copilot
- Scales across all SGA divisions
- Maintains 99.9% uptime

**Deadline:** System must be 100% ready for production by November 22, 2025

---

**YOU ARE CLAUDE CODE. YOU HAVE THE TOOLS. YOU HAVE THE TEAM. MAKE IT HAPPEN.**
