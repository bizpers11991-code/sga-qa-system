# 🚀 AI TEAM MISSION: OPTION B - M365 INTEGRATION COMPLETION

**Orchestrator:** Claude Code (Sonnet 4.5)
**Mission Start:** November 23, 2025
**Estimated Duration:** 10-15 hours
**Token Budget:** 115,000 tokens

## 🎯 MISSION OBJECTIVES

Complete the following critical M365 integration features:

### Task 1: Fix PDF Generation Gaps (PRIORITY: CRITICAL)
**Assigned to:** Qwen 2.5 Coder (TypeScript/PDF specialist)
**Estimated:** 2-3 hours, 8K-12K tokens
**Deliverables:**
1. Add SGA watermark to all PDFs
2. Add Document ID to footer (bottom-left)
3. Add Version number to footer (bottom-left)
4. Reposition page numbers to bottom-right
5. Update all 4 generate-*-pdf.ts files

**Files to Modify:**
- src/api/generate-incident-pdf.ts
- src/api/generate-ncr-pdf.ts
- src/api/generate-sampling-pdf.ts
- src/api/generate-jobsheet-pdf.ts
- src/utils/pdfHelpers.ts (integrate watermark function)

**Requirements:**
- Logo: /assets/sga-logo.png (top-left)
- Watermark: "SGA" diagonal, 45° angle, 20% opacity, gray
- Footer layout: [Doc ID v1.0] [Uncontrolled docs] [Page X of Y]
- Margins: 15-25mm (within 0.3-1.8 inch spec)

---

### Task 2: Teams Calendar Graph API Integration (PRIORITY: HIGH)
**Assigned to:** Grok 1 (M365 Integration specialist)
**Estimated:** 8-10 hours, 30K-40K tokens
**Deliverables:**
1. Create src/api/_lib/calendar.ts with Graph API methods
2. Implement createCalendarEvent() function
3. Implement updateCalendarEvent() function
4. Implement deleteCalendarEvent() function
5. Implement getCalendarEvents() function
6. Add calendar event creation on job assignment
7. Add bidirectional sync (Teams ↔ App)
8. Create API endpoints: /api/create-calendar-event, /api/sync-calendar

**Graph API Requirements:**
- Use existing MSAL auth (src/auth/msalConfig.ts)
- Scopes: Calendars.ReadWrite, Calendars.ReadWrite.Shared
- Target calendar: Shared "SGA QA Schedule" calendar
- Event fields: subject, start, end, location, body, attendees

**Integration Points:**
- Trigger on job creation (src/api/create-job.ts)
- Trigger on job assignment (src/api/update-job.ts)
- Display in WeeklyCalendar component (src/components/scheduler/WeeklyCalendar.tsx)

---

### Task 3: Tier-Based Site Visit Automation (PRIORITY: HIGH)
**Assigned to:** Grok 2 + DeepSeek (Workflow automation team)
**Estimated:** 6-8 hours, 20K-30K tokens
**Deliverables:**
1. Integrate client_tiers_223625.md logic into job creation
2. Create Power Automate flow: "Site Visit Notification"
3. Create Power Automate flow: "Site Visit Reminder" (24h before)
4. Add automatic calendar event creation for each site visit
5. Add Teams notification for each visit
6. Create scope report form component
7. Add scope report PDF generation

**Tier Logic (from existing design):**
- Tier 1: 3 visits @ -14, -7, -3 days
- Tier 2: 2 visits @ -7, -3 days
- Tier 3: 1 visit @ -3 days

**New Components Needed:**
- src/components/reports/ScopeReportForm.tsx
- src/api/generate-scope-report-pdf.ts
- m365-deployment/power-automate/SiteVisitNotification.json
- m365-deployment/power-automate/SiteVisitReminder.json

---

### Task 4: Power Automate Flow Templates (PRIORITY: MEDIUM)
**Assigned to:** Gemini 2.0 Flash (Architecture & validation)
**Estimated:** 3-4 hours, 10K-15K tokens
**Deliverables:**
1. Create complete JSON template for Site Visit Notification flow
2. Create complete JSON template for Site Visit Reminder flow
3. Create complete JSON template for Job Sheet Distribution flow
4. Create complete JSON template for Scope Report Automation flow
5. Create complete JSON template for NCR/Incident Alert flow
6. Update Daily Summary flow (replace mocks with real queries)

**Template Structure:**
Each flow must have:
- Trigger definition (SharePoint, Dataverse, Recurrence)
- Connection references (Teams, SharePoint, Dataverse)
- Actions with proper configuration
- Error handling steps
- Testing instructions

---

## 🔄 EXECUTION ORDER

**Phase 1 (Immediate):** Task 1 - PDF Fixes
**Phase 2 (After Phase 1):** Task 2 & Task 3 in parallel
**Phase 3 (Final):** Task 4 - Flow templates

## 📝 OUTPUT FORMAT

Each task should output:
1. Complete working code (production-ready)
2. Integration instructions
3. Testing checklist
4. Documentation updates

Save all outputs to: `ai_team_output/option_b/`

## ✅ SUCCESS CRITERIA

- [ ] All PDFs have proper watermark + footer formatting
- [ ] Calendar events auto-create when jobs assigned
- [ ] Bidirectional calendar sync working (Teams ↔ App)
- [ ] Site visit dates auto-calculated based on tier
- [ ] Calendar events created for all site visits
- [ ] Teams notifications sent 24h before each visit
- [ ] 6 Power Automate flow templates ready for deployment
- [ ] All code TypeScript error-free
- [ ] Build compiles successfully

## 🚨 CONSTRAINTS

- Token budget: 70K-90K tokens (stay within budget)
- Code must match existing architecture
- Use existing auth (MSAL, no new auth systems)
- Follow SGA branding standards
- All code must be production-ready (no TODOs/placeholders)

---

**GO TIME! 🚀**
