# 🤖 AI Team Delegation Plan
## SGA Project Management System Implementation

**Created**: November 26, 2025
**Supervisor**: Claude Code (Sonnet 4.5)
**Total Remaining Tasks**: 6
**Estimated Total Hours**: 56 hours

---

## 📊 Current Status Summary

### ✅ COMPLETED: Phase 1 (100%)
- All TypeScript types defined (343 lines in project-management.ts)
- All 19 API endpoints created and tested
- All 4 frontend API service clients implemented
- Build passing with no errors

### 🟡 IN PROGRESS: Phase 2 (50%)
- ✅ Tender Admin UI (PM_UI_001) - COMPLETE
- ✅ Project Management UI (PM_UI_002) - COMPLETE
- ❌ Scope Report UI (PM_UI_003) - **NEEDS DELEGATION**
- ❌ Division Request UI (PM_UI_004) - **NEEDS DELEGATION**

### ⏳ NOT STARTED: Phase 3 (0%)
- ❌ Enhanced Scheduler (PM_SCHEDULER_001) - **NEEDS DELEGATION**
- ❌ M365 Integration (PM_M365_001) - **NEEDS DELEGATION**

### ⏳ NOT STARTED: Phase 4 (0%)
- ❌ Project Copilot (PM_COPILOT_001) - **NEEDS DELEGATION**

---

## 🎯 AI TEAM ROSTER

| Worker ID | Model | Strengths | Current Status |
|-----------|-------|-----------|----------------|
| **gemini** | Gemini 2.5 Pro | Architecture, Complex Forms, AI/Copilot | ✅ Phase 1&2 Done → Ready for PM_UI_003 & PM_COPILOT_001 |
| **qwen** | Qwen 2.5 Coder 32B | TypeScript, API Routes, Types | ✅ Phase 1 Done → Standby for fixes |
| **deepseek** | DeepSeek V3 | Business Logic, Algorithms, Scheduling | ✅ Phase 1 Done → Ready for PM_SCHEDULER_001 |
| **grok1** | Grok Code Fast #1 | SharePoint, Teams, M365 Integration | Idle → Ready for PM_M365_001 |
| **grok2** | Grok Code Fast #2 | React UI, Components | ✅ Phase 2 partial → Ready for PM_UI_004 |

---

## 📋 IMMEDIATE PRIORITY: Complete Phase 2

### Task 1: PM_UI_003 - Scope Report UI Components
**Assigned to**: Gemini 2.5 Pro
**Priority**: P2 (High)
**Estimated Hours**: 8 hours
**Status**: Ready to delegate

#### Deliverables (9 files):
1. `src/pages/scope-reports/ScopeReportList.tsx` - List view for scope reports
2. `src/pages/scope-reports/ScopeReportCreate.tsx` - Create/edit scope report page
3. `src/components/scope-reports/ScopeReportForm.tsx` - Multi-section field form
4. `src/components/scope-reports/SiteAccessibilitySection.tsx` - Site access assessment
5. `src/components/scope-reports/SurfaceConditionSection.tsx` - Surface condition with photos
6. `src/components/scope-reports/MeasurementsSection.tsx` - Area, depth, chainages input
7. `src/components/scope-reports/HazardsSection.tsx` - Hazard identification and controls
8. `src/components/scope-reports/ScopeReportCard.tsx` - Card for list display
9. `src/components/scope-reports/index.ts` - Barrel export file

#### Key Features:
- **Mobile-first design** (iPad for field use)
- **Photo capture** with camera integration
- **GPS location capture** on submit
- **Offline support** (PWA with auto-save every 30s)
- **Photo compression** before upload
- **Digital signature** pad
- **Progress indicator** across sections

#### Technical Requirements:
- Use existing `ScopeReport` type from `src/types/project-management.ts`
- Use existing `scopeReportsApi` from `src/services/scopeReportsApi.ts`
- Follow tier-based visit logic (Tier 1: 3 visits, Tier 2: 2, Tier 3: 1)
- Auto-calculate visit type from client tier
- Store drafts in IndexedDB via existing offline storage
- Support multi-step form wizard pattern

---

### Task 2: PM_UI_004 - Division Request UI Components
**Assigned to**: Grok #2
**Priority**: P2 (High)
**Estimated Hours**: 6 hours
**Status**: Ready to delegate

#### Deliverables (7 files):
1. `src/pages/division-requests/RequestInbox.tsx` - Incoming requests page
2. `src/pages/division-requests/RequestOutbox.tsx` - Sent requests page
3. `src/components/division-requests/DivisionRequestForm.tsx` - Form to create new request
4. `src/components/division-requests/DivisionRequestCard.tsx` - Card for request display
5. `src/components/division-requests/RequestResponseModal.tsx` - Modal for accepting/rejecting
6. `src/components/division-requests/CrewAssignmentSelector.tsx` - Crew and foreman selection
7. `src/components/division-requests/index.ts` - Barrel export file

#### Key Features:
- **Inbox/Outbox views** (split layout: list left, detail right)
- **Request workflow**: Create → Send → Accept/Reject → Complete
- **Crew assignment** interface with available crews
- **Status badges** (Pending=amber, Accepted=green, Rejected=red, Completed=blue)
- **Real-time notifications** (badge count in sidebar)
- **Multi-select dates** for requested work dates

#### Technical Requirements:
- Use existing `DivisionRequest` type from `src/types/project-management.ts`
- Use existing `divisionRequestsApi` from `src/services/divisionRequestsApi.ts`
- Link to projects (select from user's owned/managed projects)
- Auto-suggest division engineer based on selected division
- Show pending count badge in navigation

---

## 📅 PHASE 3 DELEGATION PLAN

### Task 3: PM_SCHEDULER_001 - Enhanced Project-Aware Scheduler
**Assigned to**: DeepSeek V3
**Priority**: P2 (High)
**Estimated Hours**: 10 hours
**Status**: Ready to delegate after Phase 2

#### Deliverables (9 files):
1. `src/pages/scheduler/ProjectScheduler.tsx` - New project-aware scheduler page
2. `src/components/scheduler/ProjectCalendar.tsx` - Calendar with project grouping
3. `src/components/scheduler/CrewAvailability.tsx` - Crew availability view
4. `src/components/scheduler/ResourceAllocation.tsx` - Resource allocation panel
5. `src/components/scheduler/ProjectGantt.tsx` - Gantt chart view for projects
6. `src/components/scheduler/CrewCard.tsx` - Draggable crew card
7. `src/hooks/useCrewAvailability.ts` - Hook for crew availability logic
8. `api/get-crew-availability.ts` - API for crew availability data
9. `api/assign-crew-to-job.ts` - API to assign crew to job

#### Key Features:
- **Multiple views**: Week, Month, Gantt, Resources
- **Drag-and-drop** crew assignment to jobs
- **Conflict detection** (crew double-booked warning)
- **Project grouping** in calendar view
- **Resource tracking** (equipment and crews)
- **Teams calendar sync** (bidirectional)

#### Technical Requirements:
- Extend existing scheduler (don't replace)
- Use React DnD or react-beautiful-dnd for drag-drop
- Implement conflict detection algorithm
- Cache crew availability in Redis
- Update Teams calendar via Microsoft Graph API

---

### Task 4: PM_M365_001 - SharePoint & Teams Integration
**Assigned to**: Grok #1
**Priority**: P2 (High)
**Estimated Hours**: 8 hours
**Status**: Ready to delegate after Phase 2

#### Deliverables (6 files):
1. `api/_lib/sharepoint-project.ts` - SharePoint operations for projects
2. `api/_lib/teams-project.ts` - Teams operations for projects
3. `m365-deployment/power-automate/ProjectFolderCreation.json` - PA flow for folder creation
4. `m365-deployment/power-automate/ScopeReportNotification.json` - PA flow for scope report
5. `m365-deployment/power-automate/DivisionRequestFlow.json` - PA flow for division requests
6. `m365-deployment/power-automate/SiteVisitReminder.json` - PA flow for site visit reminders

#### SharePoint Operations:
- **Auto-create folder structure** on project creation:
  ```
  02_Projects/{ProjectNumber}/
    ├── ScopeReports/
    ├── JobSheets/
    ├── ShiftPlans/
    ├── QAPacks/
    ├── NCRs/
    ├── Incidents/
    └── Photos/
  ```
- **Document storage** for all project artifacts
- **Metadata tagging** (ProjectNumber, Client, Status, etc.)
- **SharePoint list sync** for project index

#### Teams Operations:
- **Calendar events** for site visits (auto-created from tier/dates)
- **Channel posts** for scope report submissions (Adaptive Cards)
- **@Mentions** for division request notifications
- **Daily reminders** for upcoming site visits (Power Automate)

#### Technical Requirements:
- Use Microsoft Graph API for SharePoint/Teams
- Create Power Automate flows (JSON definitions)
- Implement webhook handlers for PA triggers
- Extend existing sharepoint.ts library
- Bidirectional sync (app ↔️ Teams calendar)

---

## 🚀 PHASE 4 DELEGATION PLAN

### Task 5: PM_COPILOT_001 - Project-Aware AI Copilot
**Assigned to**: Gemini 2.5 Pro
**Priority**: P3 (Medium)
**Estimated Hours**: 10 hours
**Status**: Delegate after Phase 3

#### Deliverables (7 files):
1. `api/copilot-query.ts` - API endpoint for Copilot queries
2. `api/_lib/copilotHandler.ts` - Copilot business logic and context management
3. `api/_lib/projectIndexer.ts` - Project document indexing for Copilot
4. `src/components/copilot/CopilotChat.tsx` - Chat interface component
5. `src/components/copilot/CopilotWidget.tsx` - Dashboard widget for quick queries
6. `src/components/copilot/ProjectInsights.tsx` - AI-generated project insights panel
7. `m365-deployment/copilot/project_copilot_config.json` - Copilot configuration

#### Copilot Capabilities:
**Project Queries**:
- "How many days has Project PRJ-2025-001 been active?"
- "What NCRs are open for the Main Street project?"
- "Which projects are at risk of missing their deadline?"
- "Summarize the scope reports for the CBD project"

**Cross-Division Insights**:
- "Which profiling jobs are pending for asphalt projects?"
- "Show me division requests that haven't been responded to"
- "How much profiling work is scheduled this week?"

**Scheduling Assistance**:
- "Which crews are available next Monday?"
- "Can we fit a new job on Wednesday for Crew A?"
- "Show scheduling conflicts for next week"

**Reporting**:
- "Generate a project status report for client XYZ"
- "What's our QA completion rate this month?"
- "List all incidents across active projects"

#### Technical Implementation:
- **RAG (Retrieval Augmented Generation)** approach
- **Index all project documents** (metadata + summaries)
- **Context building** (relevant data in prompts)
- **Query parsing** (identify entities: project, person, date)
- **Redis caching** for document index
- **Security**: Respect user permissions in responses
- **Audit logging**: Log all Copilot queries

#### Technical Requirements:
- Use Gemini 2.5 Pro API (paid, secure)
- Implement vector embedding for RAG
- Cache in Redis (index + common queries)
- Build slide-out chat panel UI
- Create dashboard widget
- Auto-generate project insights on detail page

---

## 🔄 DELEGATION WORKFLOW

### Step 1: Generate Task Prompts
For each task, I will create a comprehensive delegation prompt including:
- Full task specification
- Code examples from existing codebase
- Type definitions to use
- API endpoints to integrate with
- UI/UX requirements
- Success criteria

### Step 2: Execute via AI Workers
- Use environment variables for API keys (already configured)
- Run tasks in parallel where possible (PM_UI_003 + PM_UI_004 simultaneously)
- Log all outputs to `ai_team_output/project_management/deliverables/`
- Track execution in `ai_team_output/project_management/logs/execution_log.jsonl`

### Step 3: Review & Integration
- Claude Code reviews all AI-generated code
- Run build tests (`npm run build`)
- Fix any TypeScript errors
- Test UI components manually
- Integrate into routing and navigation

### Step 4: Validation
- Test complete workflows end-to-end
- Verify mobile responsiveness
- Test offline functionality
- Confirm Teams/SharePoint integration

---

## 📊 ESTIMATED TIMELINE

| Phase | Tasks | Hours | Parallel Execution | Wall Time |
|-------|-------|-------|--------------------|-----------|
| **Phase 2 Completion** | PM_UI_003, PM_UI_004 | 14h | ✅ Yes (both UI) | ~8 hours |
| **Phase 3** | PM_SCHEDULER_001, PM_M365_001 | 18h | ✅ Yes (independent) | ~10 hours |
| **Phase 4** | PM_COPILOT_001 | 10h | N/A (single task) | ~10 hours |
| **Integration & Testing** | Manual review, fixes | 14h | N/A | ~14 hours |
| **TOTAL** | 6 tasks | 56h | With parallelization | **~42 hours** |

---

## ✅ SUCCESS CRITERIA

### Phase 2 Complete When:
- [ ] Scope Report form works offline on iPad
- [ ] Photos can be captured with GPS coordinates
- [ ] Division Request inbox/outbox functional
- [ ] Crew assignment workflow complete
- [ ] All new pages added to navigation
- [ ] Build passes with no errors

### Phase 3 Complete When:
- [ ] Enhanced scheduler shows project-grouped jobs
- [ ] Drag-and-drop crew assignment works
- [ ] Conflict detection alerts user
- [ ] Teams calendar syncs bidirectionally
- [ ] SharePoint folders auto-create on project creation
- [ ] All Power Automate flows deployed

### Phase 4 Complete When:
- [ ] Copilot answers project queries accurately
- [ ] Response time under 3 seconds
- [ ] Context-aware suggestions helpful
- [ ] Respects user permissions
- [ ] Audit log captures all queries

### Final Deployment When:
- [ ] All phases complete
- [ ] Full end-to-end testing passed
- [ ] User acceptance testing passed
- [ ] Documentation complete
- [ ] Training materials ready

---

## 🚨 RISK MITIGATION

### Potential Risks:
1. **UI components don't match existing design system**
   - Mitigation: Provide detailed style guide and component examples

2. **AI-generated code has TypeScript errors**
   - Mitigation: Claude Code reviews and fixes before integration

3. **M365 integration breaks existing functionality**
   - Mitigation: Test in isolation first, gradual rollout

4. **Copilot responses not accurate enough**
   - Mitigation: Iterate on prompts, expand context window

### Quality Assurance:
- All code reviewed by Claude Code before merge
- Build must pass TypeScript strict mode
- Manual testing on each component
- User acceptance testing before final deployment

---

## 📞 NEXT STEPS

### Immediate Actions (User Approval Required):
1. **Approve this delegation plan**
2. **Confirm AI team has necessary API keys** (GOOGLE_API_KEY, OPENROUTER_API_KEY_1, OPENROUTER_API_KEY_2, OPENCODE_API_KEY_1, OPENCODE_API_KEY_2)
3. **Start Phase 2 completion**: Delegate PM_UI_003 and PM_UI_004 in parallel

### After Phase 2:
1. Review and integrate UI components
2. Update navigation and routes
3. Test complete workflows
4. Start Phase 3 delegation

### After Phase 3:
1. Validate M365 integration
2. Test scheduler enhancements
3. Start Phase 4 delegation

### After Phase 4:
1. Final integration testing
2. User acceptance testing
3. Production deployment

---

**This delegation plan is ready for execution. Awaiting user approval to begin Phase 2 completion.** 🚀
