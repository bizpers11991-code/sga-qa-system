# 🎯 CLAUDE CODE - MASTER SESSION INSTRUCTIONS
## SGA QA Pack - Project Management System

**Last Updated**: November 28, 2025
**Session Type**: Development Sprint
**AI Team Status**: ✅ READY (8 workers available)

---

## 📌 QUICK START FOR CLAUDE

```powershell
# 1. Navigate to project
cd C:\Dhruv\sga-qa-system

# 2. Test AI Team connectivity
python scripts/ai-team/test_providers.py

# 3. Start interactive orchestrator
python scripts/ai-team/enhanced_orchestrator.py --interactive
```

---

## 🏗️ ARCHITECTURE DECISIONS (CONFIRMED BY USER)

### Data Storage: **SharePoint Only**
- All data stored in SharePoint lists and document libraries
- NO Dataverse (simplifies licensing)
- SharePoint site: `https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance`

### Automation Strategy: **Hybrid Approach**
| Component | Technology | Reason |
|-----------|------------|--------|
| Simple triggers | Power Automate | Easy to maintain, no-code |
| Complex logic | Code (TypeScript) | More control, testable |
| PDF generation | Code (React-PDF) | Better formatting control |
| Notifications | Power Automate | Native Teams integration |
| Scheduling | Power Automate | Calendar integration |
| AI/Copilot | Custom M365 Copilot Agent | User's preference |

### Production AI: **Custom M365 Copilot Agent**
- User wants to create custom Copilot at https://m365.cloud.microsoft/
- Copilot handles: queries, automation triggers, daily summaries
- Development still uses AI Team (Groq, Gemini, etc.)

### Frontend: **Vercel PWA (Current)**
- Keep existing React/TypeScript/Tailwind stack
- Mobile-first, iPad-optimized
- Offline-capable PWA

---

## 📊 CURRENT PROJECT STATUS

### ✅ COMPLETED (Phase 1 - 100%)
- All TypeScript types (`src/types/project-management.ts`)
- All 19 API endpoints
- All 4 frontend API service clients
- Build passing ✅

### ✅ PHASE 2 - 95% COMPLETE! (Updated Nov 28, 2025)
- ✅ Tender Admin UI (PM_UI_001) - COMPLETE
- ✅ Project Management UI (PM_UI_002) - COMPLETE
- ✅ **Scope Report UI (PM_UI_003)** - COMPLETE (Already built!)
- ✅ **Division Request UI (PM_UI_004)** - COMPLETE (Already built!)
- ✅ All routes and navigation configured
- ✅ TypeScript build passing
- 🟡 Dashboard enhancements (pending)
- 🟡 Document upload UI (pending)
- 🟡 Notification system (pending)

**See:** `PROJECT_STATUS_REPORT.md` for comprehensive analysis

### ⏳ NOT STARTED (Phase 3-4)
- Power Automate flow definitions (PM_AUTOMATE_001-004)
- M365 Copilot Agent setup (PM_COPILOT_001)
- SharePoint folder automation

---

## 🤖 AI TEAM ROSTER


### Available Workers (sorted by speed)

| Worker | Provider | Model | Best For | Status |
|--------|----------|-------|----------|--------|
| `GROQ_LLAMA70B` | Groq | Llama 3.3 70B | General coding, fast iteration | ⚡ Fastest |
| `GROQ_LLAMA8B` | Groq | Llama 3.1 8B | Quick tasks, validation | ⚡ Fastest |
| `GROQ_DEEPSEEK` | Groq | DeepSeek R1 Distill | Complex reasoning | ⚡ Fast |
| `CEREBRAS_LLAMA` | Cerebras | Llama 3.3 70B | Heavy workloads | ⚡ Very Fast |
| `CEREBRAS_QWEN` | Cerebras | Qwen 3 32B | Coding tasks | ⚡ Very Fast |
| `GEMINI_FLASH` | Google | Gemini 2.0 Flash | Architecture, review | 🚀 Fast |
| `GEMINI_PRO` | Google | Gemini 2.5 Pro | Complex analysis | 🚀 Fast |
| `OPENROUTER_QWEN_CODER` | OpenRouter | Qwen 2.5 Coder 32B | TypeScript, React | 🚀 Fast |
| `OPENROUTER_DEEPSEEK_R1` | OpenRouter | DeepSeek R1 | Reasoning, planning | 🚀 Fast |
| `OPENROUTER_DEEPSEEK_V3` | OpenRouter | DeepSeek V3 | General coding | 🚀 Fast |
| `OPENCODE_GROK_1` | OpenCode | Grok Code Fast | Code generation | 🚀 Fast |
| `OPENCODE_GROK_2` | OpenCode | Grok Code Fast | Code generation | 🚀 Fast |

### API Keys Location
Edit `.env` file to add:
- `GROQ_API_KEY` - Get from https://console.groq.com
- `CEREBRAS_API_KEY` - Get from https://cloud.cerebras.ai
- `GOOGLE_API_KEY_2` - Get from https://aistudio.google.com (second Gmail)

---

## 📋 IMMEDIATE TASKS FOR THIS SESSION

### Priority 1: Complete Phase 2 UI

#### Task PM_UI_003: Scope Report UI
**Assign to**: `OPENROUTER_QWEN_CODER` or `GROQ_LLAMA70B`

```python
from enhanced_orchestrator import EnhancedOrchestrator, Task, WorkerType

task = Task(
    id="PM_UI_003_SCOPE_REPORT",
    title="Create Scope Report UI Components",
    description="""Create complete Scope Report UI for field use:

Files to create:
1. src/pages/scope-reports/ScopeReportList.tsx
2. src/pages/scope-reports/ScopeReportCreate.tsx
3. src/components/scope-reports/ScopeReportForm.tsx
4. src/components/scope-reports/SiteAccessibilitySection.tsx
5. src/components/scope-reports/SurfaceConditionSection.tsx
6. src/components/scope-reports/MeasurementsSection.tsx
7. src/components/scope-reports/HazardsSection.tsx
8. src/components/scope-reports/ScopeReportCard.tsx

Requirements:
- Mobile-first (iPad field use)
- Photo capture with GPS coordinates
- Offline support (auto-save every 30s)
- Multi-section wizard form
- Digital signature capture
- Use existing types from src/types/project-management.ts
- Use existing API from src/services/scopeReportsApi.ts
- Follow tier-based visit logic (Tier 1: 3 visits, Tier 2: 2, Tier 3: 1)
""",
    worker=WorkerType.OPENROUTER_QWEN_CODER,
    context_files=[
        "src/types/project-management.ts",
        "src/services/scopeReportsApi.ts",
        "src/components/qa-pack/QAPackForm.tsx"  # Style reference
    ],
    fallback_workers=[WorkerType.GROQ_LLAMA70B, WorkerType.GEMINI_FLASH]
)
```

#### Task PM_UI_004: Division Request UI
**Assign to**: `GROQ_LLAMA70B` or `CEREBRAS_LLAMA`

```python
task = Task(
    id="PM_UI_004_DIVISION_REQUEST",
    title="Create Division Request UI Components",
    description="""Create Division Request workflow UI:

Files to create:
1. src/pages/division-requests/RequestInbox.tsx
2. src/pages/division-requests/RequestOutbox.tsx
3. src/components/division-requests/DivisionRequestForm.tsx
4. src/components/division-requests/DivisionRequestCard.tsx
5. src/components/division-requests/RequestResponseModal.tsx
6. src/components/division-requests/CrewAssignmentSelector.tsx

Requirements:
- Inbox/Outbox split layout (list left, detail right)
- Request workflow: Create → Send → Accept/Reject → Complete
- Status badges (Pending=amber, Accepted=green, Rejected=red)
- Crew assignment interface
- Real-time notification badges
- Use existing types from src/types/project-management.ts
- Use existing API from src/services/divisionRequestsApi.ts
""",
    worker=WorkerType.GROQ_LLAMA70B,
    context_files=[
        "src/types/project-management.ts",
        "src/services/divisionRequestsApi.ts"
    ],
    fallback_workers=[WorkerType.CEREBRAS_LLAMA, WorkerType.OPENROUTER_DEEPSEEK_V3]
)
```


### Priority 2: Update Navigation & Routes

After UI components are created, update:
- `src/routing/routes.tsx` - Add new routes
- `src/components/layout/Sidebar.tsx` - Add menu items

### Priority 3: Setup Power Automate Flows

Create these Power Automate flows (JSON definitions in `m365-deployment/power-automate/`):

1. **ProjectFolderCreation.json** - Auto-create SharePoint folder on project creation
2. **ScopeReportNotification.json** - Send Teams notification on scope report submit
3. **DivisionRequestFlow.json** - Handle division request workflow
4. **SiteVisitReminder.json** - Send calendar reminders for site visits

---

## 🔧 M365 COPILOT AGENT SETUP

### Step 1: Create Agent at https://m365.cloud.microsoft/

1. Go to Microsoft 365 Copilot Studio
2. Create new "Custom Copilot"
3. Name: "SGA QA Assistant"
4. Configure knowledge sources:
   - SharePoint site: SGAQualityAssurance
   - Document library: All project documents

### Step 2: Configure Topics

```yaml
Topics to create:
  - "Report Status": Query project/report status
  - "Quality Insights": Analyze quality trends
  - "Create Job": Launch job creation workflow
  - "Daily Summary": Generate daily work summary
  - "Find Document": Search SharePoint for documents
  - "Schedule Visit": Create site visit calendar events
```

### Step 3: Connect to App

The Copilot agent will be embedded in our Vercel app via:
- Teams tab integration
- Direct API calls from the app

---

## 📁 SHAREPOINT FOLDER STRUCTURE

When a project is created, auto-create this structure:

```
02_Projects/
└── {ProjectNumber}/
    ├── ScopeReports/
    ├── JobSheets/
    ├── ShiftPlans/
    ├── QAPacks/
    ├── NCRs/
    ├── Incidents/
    └── Photos/
```

---

## 🔄 POWER AUTOMATE VS CODE DECISION MATRIX

| Task | Use Power Automate | Use Code |
|------|-------------------|----------|
| Send email/Teams notification | ✅ | |
| Create calendar event | ✅ | |
| Create SharePoint folder | ✅ | |
| Simple data triggers | ✅ | |
| Complex validation | | ✅ |
| PDF generation | | ✅ (React-PDF) |
| AI summary generation | | ✅ (Gemini API) |
| Offline data sync | | ✅ |
| Complex calculations | | ✅ |
| Form validation | | ✅ |

---

## 📊 DEVELOPMENT WORKFLOW

### Using AI Team for Development

```python
# Quick single task
python scripts/ai-team/quick_task.py "Write a React hook for camera capture"

# Interactive mode for multiple tasks
python scripts/ai-team/enhanced_orchestrator.py --interactive

# Programmatic usage
from enhanced_orchestrator import EnhancedOrchestrator, TaskTemplates

orchestrator = EnhancedOrchestrator("C:/Dhruv/sga-qa-system")

# Use templates for common tasks
task = TaskTemplates.create_react_component(
    "PhotoCapture",
    "Camera component with GPS tagging for field photos"
)
orchestrator.add_task(task)
orchestrator.run_all_tasks()
```

### Code Review with AI Team

```python
task = TaskTemplates.code_review(
    "src/components/scope-reports/ScopeReportForm.tsx",
    focus_areas=["TypeScript errors", "accessibility", "mobile UX"]
)
```

---


## 🎯 SESSION CHECKLIST

### Before Starting
- [ ] Run `python scripts/ai-team/test_providers.py` to verify API keys
- [ ] Check build status: `npm run build`
- [ ] Review this document for current priorities

### Phase 2 Completion
- [ ] Generate PM_UI_003 (Scope Report UI) using AI team
- [ ] Generate PM_UI_004 (Division Request UI) using AI team
- [ ] Review and fix any TypeScript errors
- [ ] Update routes in `src/routing/routes.tsx`
- [ ] Update sidebar in `src/components/layout/Sidebar.tsx`
- [ ] Test build passes: `npm run build`
- [ ] Manual test new components

### Phase 3 Preparation
- [ ] Create Power Automate flow JSON definitions
- [ ] Setup SharePoint folder automation
- [ ] Create M365 Copilot agent (user task)
- [ ] Plan Teams calendar integration

---

## 🚨 IMPORTANT NOTES

### Security
- All AI workers sanitize sensitive data automatically
- API keys, SharePoint URLs, tenant IDs are redacted before sending to free models
- Production secrets stay on local machine only

### Quality Assurance
- All generated code must pass TypeScript strict mode
- Mobile-first design (iPad for field use)
- Offline support required for field components
- Follow existing code patterns in the project

### Testing
- Build must pass: `npm run build`
- Manual test on iPad/mobile viewport
- Test offline functionality for field forms

---

## 📚 REFERENCE FILES

| File | Purpose |
|------|---------|
| `src/types/project-management.ts` | All TypeScript types |
| `src/services/*.ts` | API client functions |
| `api/*.ts` | Serverless API endpoints |
| `src/components/qa-pack/*` | Reference for form patterns |
| `docs/m365-integration/*` | M365 integration guides |

---

## 🔗 KEY URLS

- **SharePoint Site**: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
- **M365 Copilot Studio**: https://m365.cloud.microsoft/
- **Groq Console**: https://console.groq.com
- **Cerebras Cloud**: https://cloud.cerebras.ai
- **Google AI Studio**: https://aistudio.google.com/apikey

---

## 📝 AFTER SESSION

Update these files:
1. `PROJECT_STATUS_REPORT.md` - Update completion status
2. `CLAUDE_MASTER_INSTRUCTIONS.md` - Update for next session
3. `ai_team_output/logs/` - Review execution logs

---

**END OF INSTRUCTIONS**

*Claude: Start by running `test_providers.py` to verify AI team connectivity, then proceed with Phase 2 UI generation.*


---

## 🌦️ WEATHER INTEGRATION (NEW - November 28, 2025)

### Bureau of Meteorology via Open-Meteo API

**Files created:**
- `src/services/weatherService.ts` - Weather API service (368 lines)
- `src/components/weather/WeatherWidget.tsx` - React component
- `src/components/weather/index.ts` - Barrel export

**Features:**
- ✅ FREE (no API key required!)
- ✅ Real BOM ACCESS-G model data
- ✅ Location-based (GPS auto-detect)
- ✅ Current conditions + hourly + 7-day forecast
- ✅ Construction work suitability check (heat, rain, wind, UV)
- ✅ Auto-refresh every 30 minutes
- ✅ Works offline (shows cached data)

**API Details:**
- Endpoint: `https://api.open-meteo.com/v1/bom`
- No API key required
- Updates 4x daily from BOM
- 10-day forecast available

**Usage:**
```tsx
import { WeatherWidget } from '@/components/weather';

// Auto-detect user location
<WeatherWidget showWorkSuitability={true} />

// Fixed location (e.g., Perth office)
<WeatherWidget 
  location={{ latitude: -31.9505, longitude: 115.8605 }} 
  expanded={true}
/>
```

**Work Suitability Checks:**
- 🌡️ Temperature > 35°C → Heat warning
- 🌧️ Rain probability > 50% → Rain warning
- 💨 Wind gusts > 60 km/h → Crane warning
- ⛈️ Thunderstorm codes → Work suspension warning
- ☀️ UV index > 8 → Sun protection warning

**TODO for Claude:**
- Add WeatherWidget to main dashboard (`src/pages/Dashboard.tsx`)
- Add weather to job detail pages
- Consider adding weather to daily briefing reports

---

**END OF INSTRUCTIONS**

*Claude: Start by running `test_providers.py` to verify AI team connectivity, then proceed with Phase 2 UI generation.*
