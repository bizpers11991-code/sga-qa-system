# 🏗️ SGA QA System - Project Management Evolution Master Plan

## 📋 Executive Summary

**Project Name**: SGA QA System with Tendering & Project Management  
**Version**: 2.0 (Project Management Evolution)  
**Date**: November 25, 2025  
**Status**: Planning Phase  
**Target**: Full-featured Project Management + QA System  

### Vision Statement
Transform the existing SGA QA System into a comprehensive **Project Lifecycle Management Platform** that handles:
- Tender handovers and project creation
- Multi-division coordination (Asphalt, Profiling, Spray)
- Scope reporting and site visits
- Crew scheduling and assignment
- QA documentation and compliance
- AI-powered project insights via Copilot

---

## 🎯 NEW REQUIREMENTS BREAKDOWN

### 1. Tendering Administration Module
**New Role**: `tender_admin`

**Responsibilities**:
- Creates projects when company wins a job
- Completes handover form with all project details
- Assigns Project Admin/Engineer (project owner)
- Assigns Scoping Person
- Sets client tier (Tier 1/2/3)

**Handover Form Data**:
```typescript
interface TenderHandover {
  id: string;
  handoverNumber: string;  // e.g., HO-2025-001
  dateCreated: string;
  createdBy: string;       // tender_admin id
  
  // Client Details
  clientId: string;
  clientName: string;
  clientTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  
  // Project Details
  projectName: string;
  projectDescription: string;
  location: string;
  estimatedStartDate: string;
  estimatedEndDate: string;
  
  // Divisions Required
  divisionsRequired: {
    asphalt: boolean;
    profiling: boolean;
    spray: boolean;
  };
  
  // Assignment
  projectOwnerId: string;    // asphalt_engineer/admin (primary owner)
  scopingPersonId: string;   // Person who will do site visits
  
  // Technical Details
  estimatedArea?: number;
  estimatedThickness?: number;
  asphaltPlant?: string;
  specialRequirements?: string;
  
  // Contract Details
  contractValue?: number;
  contractNumber?: string;
  purchaseOrderNumber?: string;
  
  // Attachments
  attachments: {
    fileId: string;
    fileName: string;
    fileType: string;
    uploadedAt: string;
  }[];
  
  // Status
  status: 'Draft' | 'Submitted' | 'Active' | 'Completed' | 'On Hold';
}
```

### 2. Project Management Module
**New Entity**: `Project` (evolves from existing `Job`)

```typescript
interface Project {
  id: string;
  projectNumber: string;     // e.g., PRJ-2025-001
  handoverId: string;        // Link to TenderHandover
  
  // Core Details
  projectName: string;
  client: string;
  clientTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  location: string;
  
  // Ownership
  projectOwnerId: string;     // Primary (usually asphalt engineer)
  projectOwnerDivision: 'Asphalt' | 'Profiling' | 'Spray';
  scopingPersonId: string;
  
  // Timeline
  estimatedStartDate: string;
  estimatedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  
  // Divisions & Sub-Projects
  divisions: ProjectDivision[];
  
  // Status
  status: 'Scoping' | 'Scheduled' | 'In Progress' | 'QA Review' | 'Completed' | 'On Hold';
  
  // Related Jobs (Day-by-day work)
  jobIds: string[];
  
  // Scope Reports
  scopeReportIds: string[];
  
  // Calendar Events
  siteVisitEventIds: string[];
  projectCalendarEventId: string;
  
  // QA Summary
  qaPackIds: string[];
  ncrIds: string[];
  incidentIds: string[];
}

interface ProjectDivision {
  division: 'Asphalt' | 'Profiling' | 'Spray';
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed';
  assignedEngineerId?: string;  // Division engineer/admin
  assignedCrewIds: string[];
  scheduledDates: string[];
  completedDates: string[];
  qaPackIds: string[];
}
```

### 3. Scope Report System
**New Entity**: `ScopeReport`

```typescript
interface ScopeReport {
  id: string;
  reportNumber: string;  // e.g., SCR-2025-001-01 (project-visit#)
  projectId: string;
  
  // Visit Details
  visitNumber: number;   // 1, 2, or 3 based on tier
  visitType: '14-Day' | '7-Day' | '3-Day' | '72-Hour';
  scheduledDate: string;
  actualDate: string;
  completedBy: string;   // Scoping person ID
  
  // Site Assessment
  siteAccessibility: {
    accessible: boolean;
    accessNotes: string;
    restrictions: string[];
  };
  
  surfaceCondition: {
    currentCondition: 'Good' | 'Fair' | 'Poor' | 'Critical';
    defects: string[];
    photos: SitePhoto[];
  };
  
  measurements: {
    area: number;
    depth: number;
    chainages: { start: number; end: number }[];
  };
  
  trafficManagement: {
    required: boolean;
    tmpRequired: boolean;
    restrictions: string[];
    notes: string;
  };
  
  utilities: {
    identified: boolean;
    services: string[];  // Gas, Water, Telstra, etc.
    photos: SitePhoto[];
  };
  
  hazards: {
    identified: boolean;
    hazardList: { hazard: string; control: string }[];
  };
  
  recommendations: string;
  estimatedDuration: number;  // Days
  
  // Attachments
  photos: SitePhoto[];
  documents: { fileId: string; fileName: string }[];
  
  // Sign-off
  signature: string;
  signedAt: string;
  
  // Status
  status: 'Draft' | 'Submitted' | 'Reviewed';
}
```

### 4. Cross-Division Coordination
**Workflow for Multi-Division Projects**:

1. **Asphalt owns the project** (typical scenario):
   - Asphalt engineer is project owner
   - They coordinate profiling/spray as needed

2. **Profiling Request Flow**:
   ```
   Asphalt Engineer (Project Owner)
         │
         ▼ Sends Request
   Profiling Engineer
         │
         ▼ Assigns Crew
   Profiling Foreman
         │
         ▼ Completes Work
   Submit Profiling QA Pack
         │
         ▼ Returns to
   Asphalt Engineer (views all QA in project)
   ```

3. **New Entity**: `DivisionRequest`
```typescript
interface DivisionRequest {
  id: string;
  requestNumber: string;
  projectId: string;
  
  // Request Details
  requestedBy: string;      // Project owner ID
  requestedDivision: 'Profiling' | 'Spray' | 'Asphalt';
  requestedTo: string;      // Division engineer ID
  
  // Work Details
  workDescription: string;
  location: string;
  requestedDates: string[];
  
  // Status
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Completed';
  assignedCrewId?: string;
  assignedForemanId?: string;
  
  // Response
  responseNotes?: string;
  confirmedDates?: string[];
  
  // Completion
  completedAt?: string;
  qaPackId?: string;
}
```

### 5. Enhanced Scheduling System
**New Features for Scheduler**:

```typescript
interface SchedulerView {
  // Master Calendar (Teams-integrated)
  masterCalendar: {
    viewType: 'Week' | 'Month' | 'Timeline';
    filters: {
      divisions: ('Asphalt' | 'Profiling' | 'Spray')[];
      crews: string[];
      engineers: string[];
      status: string[];
    };
  };
  
  // Crew Availability
  crewAvailability: {
    crewId: string;
    crewName: string;
    division: string;
    assignments: {
      date: string;
      projectId: string;
      jobId: string;
    }[];
  }[];
  
  // Resource Allocation
  resourceAllocation: {
    date: string;
    division: string;
    availableCrews: number;
    assignedCrews: number;
    availableEquipment: string[];
    assignedEquipment: string[];
  }[];
}
```

---

## 🏛️ UPDATED ARCHITECTURE

### Role Hierarchy (Updated)

```
┌────────────────────────────────────────────────────────────────┐
│                    MANAGEMENT LAYER                             │
├────────────────────────────────────────────────────────────────┤
│  management_admin     │ Full system access, reporting, insights│
│  hseq_manager         │ Safety, quality oversight, audits      │
└────────────────────────────────────────────────────────────────┘
                              │
┌────────────────────────────────────────────────────────────────┐
│                 ADMINISTRATION LAYER                            │
├────────────────────────────────────────────────────────────────┤
│  tender_admin [NEW]   │ Creates projects from won tenders      │
│  scheduler_admin      │ Master scheduling, crew assignment     │
└────────────────────────────────────────────────────────────────┘
                              │
┌────────────────────────────────────────────────────────────────┐
│                   ENGINEERING LAYER                             │
├────────────────────────────────────────────────────────────────┤
│  asphalt_engineer     │ Asphalt project owner, primary coord.  │
│  profiling_engineer   │ Profiling works, responds to requests  │
│  spray_admin          │ Spray works, responds to requests      │
└────────────────────────────────────────────────────────────────┘
                              │
┌────────────────────────────────────────────────────────────────┐
│                    OPERATIONS LAYER                             │
├────────────────────────────────────────────────────────────────┤
│  asphalt_foreman      │ Asphalt crew lead, QA submission       │
│  profiling_foreman    │ Profiling crew lead, QA submission     │
│  spray_foreman        │ Spray crew lead, QA submission         │
└────────────────────────────────────────────────────────────────┘
```

### Data Flow (Updated)

```
TENDER WIN
    │
    ▼
┌─────────────────────┐
│   Tender Admin      │
│   Creates Project   │
│   (Handover Form)   │
└─────────────────────┘
    │
    ├─────────────────────────────────────┐
    ▼                                     ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Project Owner      │     │   Scoping Person    │
│  (Asphalt Engineer) │     │   (Site Visits)     │
└─────────────────────┘     └─────────────────────┘
    │                               │
    │                               ▼
    │                    ┌─────────────────────┐
    │                    │   Scope Reports     │
    │                    │   (Tier 1/2/3)      │
    │                    └─────────────────────┘
    │                               │
    ▼                               │
┌─────────────────────┐             │
│   Project Planning  │◀────────────┘
│   - Multi-division  │
│   - Crew scheduling │
└─────────────────────┘
    │
    ├───────────────┬───────────────┐
    ▼               ▼               ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│Profiling│   │ Asphalt │   │  Spray  │
│Division │   │Division │   │Division │
│ Request │   │(Primary)│   │ Request │
└─────────┘   └─────────┘   └─────────┘
    │               │               │
    ▼               ▼               ▼
┌─────────────────────────────────────┐
│         DAILY JOBS & QA PACKS       │
│  (Existing QA System continues)     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│          PROJECT SUMMARY            │
│    - All QA from all divisions      │
│    - NCRs, Incidents                │
│    - Copilot insights & queries     │
└─────────────────────────────────────┘
```

---

## 📦 SHAREPOINT DOCUMENT STRUCTURE

### Site: SGAQualityAssurance

```
📁 SGAQualityAssurance/
├── 📁 01_Tenders/
│   ├── 📁 Handovers/           # Tender handover forms
│   └── 📁 Attachments/         # Contract docs, drawings
│
├── 📁 02_Projects/
│   ├── 📁 {ProjectNumber}/     # e.g., PRJ-2025-001/
│   │   ├── 📁 ScopeReports/    # Site visit reports
│   │   ├── 📁 JobSheets/       # Daily job sheets
│   │   ├── 📁 ShiftPlans/      # Crew shift plans
│   │   ├── 📁 QAPacks/         # Submitted QA packs
│   │   ├── 📁 NCRs/            # Non-conformance reports
│   │   ├── 📁 Incidents/       # Incident reports
│   │   └── 📁 Photos/          # Site photos
│   └── 📄 ProjectIndex.xlsx    # Master project list
│
├── 📁 03_DivisionRequests/
│   ├── 📁 Profiling/           # Profiling requests
│   └── 📁 Spray/               # Spray requests
│
├── 📁 04_Resources/
│   ├── 📁 Crews/               # Crew information
│   ├── 📁 Equipment/           # Equipment registry
│   └── 📁 Templates/           # ITP templates, forms
│
├── 📁 05_Reports/
│   ├── 📁 DailySummaries/      # Auto-generated summaries
│   ├── 📁 WeeklySummaries/     # Weekly rollups
│   └── 📁 ProjectReports/      # Project completion reports
│
└── 📁 06_Archive/              # Completed projects
```

---

## 🤖 AI TEAM DELEGATION (UPDATED)

### Worker Assignments for Project Management Module

| AI Worker | Tasks | Priority |
|-----------|-------|----------|
| **Gemini 2.5 Pro** | Tender Handover Form, Scope Report Form, Architecture | P1 |
| **Qwen 2.5 Coder** | Project Data Models, TypeScript Types, API Routes | P1 |
| **DeepSeek V3** | Cross-Division Coordination Logic, Scheduler Algorithm | P1 |
| **Grok #1** | SharePoint Folder Automation, Teams Calendar Events | P2 |
| **Grok #2** | UI Components (Project View, Division Requests) | P2 |

### Security Protocol (Same as Original)
```python
def delegate_to_worker(task, data):
    # Rule 1: NEVER send real data to free models
    safe_data = {
        "client": f"Client_{hash(data.get('client', ''))[:6]}",
        "project": f"Project_{hash(data.get('project', ''))[:6]}",
        "location": "Location_REDACTED",
        # ... sanitize all PII
    }
    
    # Rule 2: Use paid Gemini for sensitive architecture
    if task.requires_sensitive_data:
        return gemini_pro.process(data)  # Paid = secure
    
    # Rule 3: Free models get sanitized data only
    return free_model.process(safe_data)
```

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Data Model & API Foundation (Week 1)
**Workers**: Qwen 2.5 Coder (types) + DeepSeek (logic)

1. **Day 1-2**: New TypeScript Types
   - [ ] `TenderHandover` type
   - [ ] `Project` type (evolving from Job)
   - [ ] `ScopeReport` type
   - [ ] `DivisionRequest` type
   - [ ] Update `Role` type with `tender_admin`
   - [ ] Update related types

2. **Day 3-4**: API Routes
   - [ ] `POST /api/create-handover` - Tender creates project
   - [ ] `POST /api/create-project` - Scheduler/Engineer creates
   - [ ] `POST /api/submit-scope-report` - Scoping person submits
   - [ ] `POST /api/create-division-request` - Request profiling/spray
   - [ ] `POST /api/respond-division-request` - Accept/reject request
   - [ ] `GET /api/get-project/{id}` - Full project details
   - [ ] `GET /api/get-projects` - List with filters
   - [ ] `GET /api/get-scope-reports/{projectId}` - Project's scope reports
   - [ ] `GET /api/get-division-requests` - Incoming/outgoing requests

3. **Day 5**: SharePoint Integration
   - [ ] Create folder structure per project
   - [ ] Document storage paths
   - [ ] Auto-create project folders on handover

### Phase 2: UI Components (Week 2)
**Workers**: Grok #2 (UI) + Gemini (forms)

1. **Day 1-2**: Tender Admin Module
   - [ ] `TenderHandoverForm.tsx` - Multi-step wizard
   - [ ] `HandoverList.tsx` - List/manage handovers
   - [ ] `HandoverDetail.tsx` - View handover details

2. **Day 3-4**: Project Management Module
   - [ ] `ProjectDashboard.tsx` - Project overview
   - [ ] `ProjectList.tsx` - All projects with filters
   - [ ] `ProjectDetail.tsx` - Full project view
   - [ ] `ProjectTimeline.tsx` - Visual timeline
   - [ ] `DivisionSummary.tsx` - Per-division status

3. **Day 5**: Scope Report Module
   - [ ] `ScopeReportForm.tsx` - Field form (mobile-first)
   - [ ] `ScopeReportList.tsx` - List reports
   - [ ] `ScopeReportPDF.tsx` - PDF generation

### Phase 3: Cross-Division Features (Week 3)
**Workers**: DeepSeek (logic) + Grok #1 (Teams)

1. **Day 1-2**: Division Request System
   - [ ] `DivisionRequestForm.tsx` - Request form
   - [ ] `DivisionRequestList.tsx` - Inbox/outbox view
   - [ ] `DivisionRequestCard.tsx` - Card component
   - [ ] Email/Teams notification on request

2. **Day 3-4**: Enhanced Scheduler
   - [ ] `ProjectScheduler.tsx` - Project-aware scheduler
   - [ ] `CrewAvailabilityView.tsx` - See crew schedules
   - [ ] `ResourceAllocation.tsx` - Equipment/crew planning
   - [ ] Drag-drop crew assignment

3. **Day 5**: Teams Integration
   - [ ] Master calendar sync
   - [ ] Site visit auto-scheduling
   - [ ] Project notification channels
   - [ ] Scope report summary posts

### Phase 4: Copilot & AI Features (Week 4)
**Workers**: Gemini (Copilot) + DeepSeek (queries)

1. **Day 1-2**: Project-Aware Copilot
   - [ ] Project document indexing
   - [ ] Cross-division query capability
   - [ ] Project summary generation
   - [ ] Work-days calculation

2. **Day 3-4**: Intelligent Features
   - [ ] Resource conflict detection
   - [ ] Schedule optimization suggestions
   - [ ] QA compliance alerts
   - [ ] Project risk analysis

3. **Day 5**: Reporting
   - [ ] Project completion reports
   - [ ] Division performance metrics
   - [ ] Crew utilization reports
   - [ ] Client tier analysis

### Phase 5: Testing & Deployment (Week 5)
**Workers**: All workers for testing

1. **Day 1-2**: Integration Testing
   - [ ] Full workflow testing
   - [ ] Cross-division scenarios
   - [ ] Permission testing

2. **Day 3-4**: UAT & Fixes
   - [ ] User acceptance testing
   - [ ] Bug fixes
   - [ ] Performance optimization

3. **Day 5**: Production Deployment
   - [ ] Final deployment
   - [ ] Documentation
   - [ ] Training materials

---

## 📁 FILE STRUCTURE (NEW/MODIFIED)

### New Files to Create

```
src/
├── types.ts                          # UPDATE: Add new types
├── pages/
│   ├── tenders/                      # NEW FOLDER
│   │   ├── TenderList.tsx            # List handovers
│   │   ├── TenderCreate.tsx          # Create handover
│   │   └── TenderDetail.tsx          # View handover
│   ├── projects/                     # NEW FOLDER
│   │   ├── ProjectList.tsx           # List projects
│   │   ├── ProjectDetail.tsx         # Full project view
│   │   └── ProjectDashboard.tsx      # Project overview
│   ├── scope-reports/                # NEW FOLDER
│   │   ├── ScopeReportList.tsx       # List reports
│   │   └── ScopeReportCreate.tsx     # Create/edit report
│   └── division-requests/            # NEW FOLDER
│       ├── RequestInbox.tsx          # Incoming requests
│       └── RequestOutbox.tsx         # Sent requests
├── components/
│   ├── tenders/                      # NEW FOLDER
│   │   ├── TenderHandoverForm.tsx
│   │   ├── TenderCard.tsx
│   │   └── index.ts
│   ├── projects/                     # NEW FOLDER
│   │   ├── ProjectHeader.tsx
│   │   ├── ProjectTimeline.tsx
│   │   ├── DivisionStatusCard.tsx
│   │   └── index.ts
│   ├── scope-reports/                # NEW FOLDER
│   │   ├── ScopeReportForm.tsx
│   │   ├── ScopeReportCard.tsx
│   │   └── index.ts
│   ├── division-requests/            # NEW FOLDER
│   │   ├── DivisionRequestForm.tsx
│   │   ├── DivisionRequestCard.tsx
│   │   └── index.ts
│   └── scheduler/                    # UPDATE EXISTING
│       ├── ProjectScheduler.tsx      # NEW
│       ├── CrewAvailability.tsx      # NEW
│       └── ResourceAllocation.tsx    # NEW
├── services/
│   ├── tendersApi.ts                 # NEW
│   ├── projectsApi.ts                # NEW
│   ├── scopeReportsApi.ts            # NEW
│   └── divisionRequestsApi.ts        # NEW
└── routing/
    └── routes.tsx                    # UPDATE: Add new routes

api/
├── create-handover.ts                # NEW
├── get-handovers.ts                  # NEW
├── create-project.ts                 # NEW
├── get-projects.ts                   # NEW
├── get-project.ts                    # NEW
├── submit-scope-report.ts            # NEW
├── get-scope-reports.ts              # NEW
├── create-division-request.ts        # NEW
├── respond-division-request.ts       # NEW
├── get-division-requests.ts          # NEW
└── _lib/
    ├── scopeReportHandler.ts         # NEW
    ├── divisionRequestHandler.ts     # NEW
    └── ScopeReportPrintView.tsx      # NEW
```

### Files to Delete (Cleanup)

```
# Old documentation (outdated)
- AGENT_5_IMPLEMENTATION_SUMMARY.md
- AI_TEAM_OPERATION_COMPLETE.md
- AI_TEAM_STATUS_REPORT.md
- OPERATION_FINAL_REPORT.md
- DEPLOYMENT_READY.md
- DAILY_PROGRESS_2025-11-23.md
- PRODUCTION_READINESS_SUMMARY.md
- Gemini Instructions- 20.11.2025.txt
- Screenshot 2025-11-23 194319.png
- chat-with-gemini.cjs

# Archive cleanup (move to archive/old-docs)
- Multiple redundant markdown files in root

# Keep the master plan but rename
- CLAUDE_CODE_AI_TEAM_MASTER_PLAN.md → archive/CLAUDE_CODE_AI_TEAM_MASTER_PLAN_V1.md
```

---

## 🔧 POWER AUTOMATE FLOWS (NEW)

### Flow 1: Handover Notification Flow
```
TRIGGER: New item in SharePoint (Handovers list)
ACTIONS:
1. Get handover details
2. Send email to Project Owner
3. Send email to Scoping Person
4. Create Teams channel message
5. Create initial site visit calendar events
6. Create project folder structure
```

### Flow 2: Scope Report Submission Flow
```
TRIGGER: Form submission (Scope Report)
ACTIONS:
1. Save to SharePoint
2. Generate PDF
3. Send to Project Owner
4. Post summary in Teams project channel
5. Update project status
```

### Flow 3: Division Request Flow
```
TRIGGER: New division request created
ACTIONS:
1. Notify division engineer (email + Teams)
2. Add to their request inbox
3. On response: notify project owner
4. On accept: create calendar events
5. On complete: update project status
```

### Flow 4: Site Visit Reminder Flow
```
TRIGGER: Scheduled (daily check)
ACTIONS:
1. Get upcoming site visits (next 3 days)
2. Send reminders to scoping person
3. Send reminder to project owner
4. Update calendar if rescheduled
```

---

## 🎯 SUCCESS METRICS

### Must Achieve (100%)
- [ ] Tender admin can create projects via handover form
- [ ] Project owners can view all project data in one place
- [ ] Scoping person can submit scope reports from field
- [ ] Cross-division requests work end-to-end
- [ ] Scheduler can see projects and assign crews
- [ ] All documents stored in SharePoint (organized)
- [ ] Teams calendar integration working
- [ ] Copilot can answer project-specific questions
- [ ] PDF generation for all new forms
- [ ] All existing QA system features still work

### Quality Standards
- Mobile-first design (iPad optimized)
- < 2 second page loads
- WCAG 2.1 AA accessibility
- TypeScript strict mode
- 80%+ test coverage on new code

---

## 🚀 QUICK START FOR CLAUDE CODE

### Immediate Actions

1. **Read this plan completely**
2. **Delete cleanup files** (listed above)
3. **Start Phase 1, Day 1**: Create new types in `src/types.ts`
4. **Delegate to AI workers** using the delegation plan

### Command to Start AI Team

```powershell
cd C:\Dhruv\sga-qa-system
python scripts\ai-team\run_team.py --task "phase1_types" --workers "qwen"
```

### Key Principles

1. **Project = Collection of Jobs** - A project spans multiple days and divisions
2. **Asphalt Usually Owns** - But any engineer can be project owner
3. **Division Requests = Internal Orders** - Not external client requests
4. **Scope Reports = Pre-Work Assessment** - Tier-based site visits
5. **SharePoint = Single Source of Truth** - All docs stored there
6. **Copilot = Project Intelligence** - Knows everything about each project

---

## 📞 INTEGRATION POINTS

### Microsoft 365
- **SharePoint**: Document storage, lists
- **Teams**: Calendar, notifications, channels
- **Outlook**: Email notifications
- **Azure AD**: User authentication, roles

### Vercel
- **PWA Hosting**: Frontend deployment
- **Serverless Functions**: API routes
- **Edge Functions**: Performance

### External
- **Cloudflare R2**: Photo storage
- **Upstash Redis**: Caching, rate limiting

---

**This is your evolved mission, Claude Code. Transform SGA's QA system into a full Project Management powerhouse! 🚀**
