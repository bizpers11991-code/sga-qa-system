# SGA QA System

**Enterprise Quality Assurance & Project Management Platform for Safety Grooving Australia**

A comprehensive Progressive Web App (PWA) for managing tenders, projects, jobs, quality assurance reporting, incidents, and safety compliance - fully integrated with Microsoft 365.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![Version](https://img.shields.io/badge/version-2.2.0-orange)
![License](https://img.shields.io/badge/license-Proprietary-red)

---

## 🎯 Latest Update (November 26, 2025)

### Version 2.2.0 - Project Management System Complete

**🎉 Phase 1 & 2 Complete! Full Project Management System Deployed**

Building on the complete QA system (v2.0), we've successfully deployed a comprehensive project lifecycle management platform with AI-assisted development:

#### ✅ **Completed (Phase 1 - Nov 25, 2025):**
- ✅ **Tender Administration APIs** - 5 endpoints for handover forms
- ✅ **Project Management APIs** - 6 endpoints with full data aggregation
- ✅ **Scope Reports APIs** - 4 endpoints for tier-based site visits
- ✅ **Division Request APIs** - 4 endpoints for cross-division coordination
- ✅ **TypeScript Types** - Complete type system (15+ interfaces)
- ✅ **Frontend API Clients** - 4 service files ready for UI integration

**Stats:** 29 files created | 4,000+ lines of code | 19 API endpoints | Build ✅ passing

#### ✅ **Completed (Phase 2 - Nov 26, 2025):**
- ✅ **Tender Admin UI** - Complete multi-step form wizard (TenderList, TenderCreate, TenderDetail)
- ✅ **Project Management UI** - Full dashboard with division tracking (ProjectList, ProjectDetail)
- ✅ **Scope Report UI** - Mobile-first field forms with tier system (ScopeReportList, ScopeReportCreate)
- ✅ **Division Request UI** - Complete inbox/outbox workflow (7 components including RequestInbox, RequestOutbox, DivisionRequestCard, DivisionRequestForm, RequestResponseModal, CrewAssignmentSelector, CrewAvailabilityDisplay)
- ✅ **Navigation & Routing** - All pages integrated with role-based access
- ✅ **Build Verification** - 0 TypeScript errors, all routes functional

**Stats:** 24 files created | 3,000+ lines of code | 18 UI components | Build ✅ passing

#### ✅ **Completed (Phase 3 - Nov 26, 2025):**
- ✅ **Project Scheduler** - Multi-view scheduler (Week, Month, Gantt, Resources)
- ✅ **Crew Management APIs** - get-crew-availability.ts, assign-crew-to-job.ts
- ✅ **AI Integration Guide** - Complete 500+ line guide for integrating enhanced features
- ✅ **Project Documentation** - Comprehensive PROJECT_COMPLETE.md with all metrics

**Stats:** 3 files created | 355 lines of code | 2 API endpoints | 4 view modes | Build ✅ passing

**Grand Total:** 53+ files | 7,000+ lines of code | 23 API endpoints | 18+ UI components

#### 📦 **Available for Integration (AI-Generated):**
- 📅 **Enhanced Scheduler** - Full drag-drop calendar with conflict detection (2,455 lines from DeepSeek V3)
- 🔗 **M365 Integration** - SharePoint folders, Teams calendar, notifications (ready in AI output)
- 🤖 **Project Copilot** - AI-powered project insights (ready in AI output)

### 📖 Documentation
- **⭐ PROJECT COMPLETE**: `PROJECT_COMPLETE.md` - Full implementation report
- **⭐ AI INTEGRATION**: `AI_INTEGRATION_GUIDE.md` - Guide for enhanced features
- **Session Summaries**: `SESSION_1_SUMMARY.md`, `SESSION_PROGRESS_REPORT.md`
- **Master Plan**: `CLAUDE_CODE_PROJECT_MANAGEMENT_SYSTEM_PLAN.md`
- **INIT File**: `INIT.md`
- **AI Outputs**: `ai_team_output/project_management/deliverables/`

---

## 🚀 Current Features (v2.2 - Complete)

### Core Modules

#### **Dashboard** (Role-Based)
- **Engineer Overview**: At-a-glance project health with 4 key metrics
- **Foreman Dashboard**: AI-powered daily briefings and job assignments
- Latest submissions feed with status badges
- Quick access to active jobs

#### **Job Management**
- Complete Job Creation Wizard (4 steps)
- Division-specific job sheets (Asphalt, Profiling, Spray)
- Materials & Equipment tracking
- Foreman assignment and notifications

#### **Tender Administration** ⭐ NEW
- Complete tender handover form workflow
- Client tier assignment (Tier 1: 3 visits, Tier 2: 2 visits, Tier 3: 1 visit)
- Project owner and scoping person assignment
- Auto-schedule site visits based on tier
- Tender list with status tracking
- Full tender details view

#### **Project Management** ⭐ NEW
- Project entity linking multiple jobs
- Multi-division project tracking (Asphalt, Profiling, Spray)
- Project status workflow (Not Started → In Progress → Completed)
- Timeline and milestone tracking
- Cross-division QA aggregation
- Project details with all linked jobs and divisions

#### **Scope Reports** ⭐ NEW
- Mobile-first field forms optimized for on-site use
- Tier-based site visit tracking (1-3 visits per project)
- GPS location capture for each site
- Photo documentation with captions
- Site accessibility assessment
- Surface condition reporting
- Hazard identification and documentation
- Professional PDF generation
- Scope report list with filtering

#### **Division Requests** ⭐ NEW
- Request crew from other divisions (cross-functional coordination)
- Inbox/Outbox workflow (separate views for sent/received)
- Accept/Reject/Conditional response options
- Crew and foreman assignment selector
- Crew availability display
- Request status tracking (Pending, Accepted, Rejected, Completed, Cancelled)
- Calendar integration ready

#### **Project Scheduler** ⭐ NEW
- Multiple view modes: Week, Month, Gantt, Resources
- Division filtering (All, Asphalt, Profiling, Spray)
- Active project statistics dashboard
- Project-aware scheduling
- Crew availability tracking (API ready)
- Resource allocation by division
- Status-based project filtering (Scheduled, In Progress)

#### **QA Pack System**
- SGA Daily Report Form
- Site Record Form (Hazards, Visitors)
- ITP Checklist with templates
- Asphalt Placement Form
- Straight Edge Testing Form
- Traffic Management Plan Checklist
- Site & Damage Photo capture

#### **Scheduler**
- Weekly calendar view
- Division filtering
- Job cards with quick navigation

#### **Incident Reporting**
- Photo capture and documentation
- AI-generated incident IDs
- Investigation workflow

#### **NCR Management**
- Non-conformance tracking
- Root cause analysis
- Corrective action management

#### **PDF Generation**
- Professional SGA-branded PDFs
- Proper headers, footers, watermarks
- All forms export to PDF

---

## 🏗️ Enhanced Features Available for Integration (AI-Generated)

All features below have been developed by AI workers and are ready for integration. See `AI_INTEGRATION_GUIDE.md` for detailed instructions.

### Enhanced Scheduler (PM_SCHEDULER_001) - DeepSeek V3
**Status**: 9 files, 2,455 lines of code - Ready for integration

**Features**:
- Full-featured calendar with drag-and-drop crew assignment
- Automatic conflict detection and resolution suggestions
- Real-time crew availability tracking
- Interactive Gantt chart with timeline visualization
- Resource allocation heatmaps
- Microsoft Teams calendar integration
- Equipment scheduling alongside crew management
- Mobile-responsive design
- Multi-week and multi-month views

**Dependencies**: `react-big-calendar`, `@tanstack/react-query`, `react-beautiful-dnd`

### SharePoint & Teams Integration (PM_M365_001) - Gemini 2.0 Flash
**Status**: 6 files, ready for integration

**Features**:
- Automatic SharePoint folder creation per project
- Document library management with versioning
- Teams channel creation with project naming
- Calendar event synchronization
- Automated notifications via Teams
- File upload/download integration
- Permission management (Azure AD groups)
- Activity feed integration

**Dependencies**: `@microsoft/microsoft-graph-client`, Azure AD app registration

### Project Copilot (PM_COPILOT_001) - Gemini 2.0 Flash
**Status**: 7 files, ready for integration

**Features**:
- Project-specific AI assistant
- Natural language project queries
- Cross-division insights and analytics
- Scheduling optimization suggestions
- Resource conflict detection
- Report generation assistance
- Historical data analysis
- Predictive scheduling recommendations

**Dependencies**: Gemini API key, vector database for context

### Future Enhancements
- Automated email notifications (SendGrid)
- SMS alerts for critical updates (Twilio)
- Advanced analytics dashboard (Charts.js)
- Mobile app (React Native)
- Offline-first PWA enhancements
- Real-time collaboration (WebSockets)
- Automated testing suite (Jest, Cypress)

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for building
- **PWA** with offline support

### Backend
- **Vercel Serverless Functions**
- **TypeScript** APIs
- **Azure Functions** (M365 integration)

### Data & Storage
- **SharePoint** for documents
- **Cloudflare R2** for photos
- **Upstash Redis** for caching

### AI & Automation
- **Gemini AI** for summaries and insights
- **Power Automate** for workflows
- **Microsoft Copilot** integration

### Authentication
- **Azure AD** (Microsoft 365)
- **Auth0** (backup)

---

## 📁 Project Structure

```
sga-qa-system/
├── PROJECT_COMPLETE.md              # ⭐ Final project report
├── AI_INTEGRATION_GUIDE.md          # ⭐ Guide for AI features
├── INIT.md                          # Start here for Claude Code
├── CLAUDE_CODE_PROJECT_MANAGEMENT_SYSTEM_PLAN.md  # Full plan
├── ai_team_output/
│   └── project_management/
│       ├── tasks/                   # Task definitions for AI team
│       └── deliverables/            # AI-generated code
│           ├── PM_SCHEDULER_001_*.md
│           ├── PM_M365_001_*.md
│           └── PM_COPILOT_001_*.md
├── api/                             # Serverless API routes (23 endpoints)
│   ├── create-handover.ts
│   ├── get-handovers.ts
│   ├── create-project.ts
│   ├── get-projects.ts
│   ├── update-project-status.ts
│   ├── create-division-request.ts
│   ├── get-division-requests.ts
│   ├── respond-division-request.ts
│   ├── complete-division-request.ts
│   ├── submit-scope-report.ts
│   ├── get-scope-reports.ts
│   ├── get-crew-availability.ts
│   └── assign-crew-to-job.ts
├── src/
│   ├── components/
│   │   ├── tenders/                 # Tender components
│   │   ├── projects/                # Project components
│   │   ├── scope-reports/           # Scope report components
│   │   └── division-requests/       # Division request components (7 files)
│   ├── pages/
│   │   ├── tenders/                 # TenderList, TenderCreate, TenderDetail
│   │   ├── projects/                # ProjectList, ProjectDetail
│   │   ├── scope-reports/           # ScopeReportList, ScopeReportCreate
│   │   ├── division-requests/       # RequestInbox, RequestOutbox
│   │   └── scheduler/               # SchedulerPage, ProjectSchedulerPage
│   ├── services/                    # API clients (4 files)
│   │   ├── tendersApi.ts
│   │   ├── projectsApi.ts
│   │   ├── scopeReportsApi.ts
│   │   └── divisionRequestsApi.ts
│   ├── types/
│   │   └── project-management.ts    # All TypeScript types (15+ interfaces)
│   ├── config/
│   │   └── navigation.ts            # Navigation menu (updated)
│   └── routing/
│       └── routes.tsx                # All routes (updated)
├── m365-deployment/                 # M365 integration files
├── docs/                            # Documentation
├── scripts/
│   └── ai-team/                     # AI team orchestration scripts
└── archive/                         # Historical files
```

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- Python 3.10+ (for AI team scripts)
- PowerShell (Windows) or Terminal (Mac)

### Installation
```bash
git clone https://github.com/your-org/sga-qa-system.git
cd sga-qa-system
npm install
```

### Environment Variables
Copy `.env.example` to `.env.local` and configure:
- Microsoft 365 credentials
- API keys (Gemini, OpenRouter, OpenCode)
- SharePoint site URLs

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### AI Team
```bash
python scripts/ai-team/orchestrate_project_management.py --status
```

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `tender_admin` | Create tenders/handovers, assign project owners, manage scope reports |
| `scheduler_admin` | Full scheduling, crew assignment, resource management, project scheduler |
| `management_admin` | Full system access, reports, analytics, all project data |
| `hseq_manager` | Safety oversight, audits, NCR management, incident reviews |
| `asphalt_engineer` | Project ownership (Asphalt division), QA review, division requests, scope reports |
| `profiling_engineer` | Profiling works, division request responses, project participation |
| `spray_admin` | Spray works, division request responses, project participation |
| `asphalt_foreman` | Asphalt crew lead, daily QA submission, job execution |
| `profiling_foreman` | Profiling crew lead, daily QA submission, job execution |
| `spray_foreman` | Spray crew lead, daily QA submission, job execution |

**New Features by Role:**
- **tender_admin**: Full access to Tender Administration, Scope Reports creation
- **All Engineers**: Access to Projects, Division Requests (send/receive), Project Scheduler
- **scheduler_admin**: Enhanced Project Scheduler with all views, crew assignment APIs
- **All Roles**: View-only access to Projects list and Scope Reports relevant to their division

---

## 📞 Support

For questions about this system, contact:
- **Technical**: Check `docs/` folder
- **Business**: Contact SGA management

---

## 📜 License

Proprietary - Safety Grooving Australia Pty Ltd

---

**Built with ❤️ for SGA's Quality Assurance Team**
