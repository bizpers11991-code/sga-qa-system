# AI Team Instructions for SGA QA Pack M365 Development

**Project:** SGA QA Pack - Office 365 Premium Enterprise Quality Assurance Application
**Team Members:** Grok (Developer) + Gemini (Architect/Reviewer)
**Supervisor:** Claude (User - providing oversight)
**Date:** November 15, 2025

---

## 🎯 PROJECT OVERVIEW

You are working on the **SGA QA Pack**, a comprehensive quality assurance application built 100% on Microsoft 365 infrastructure for construction project management. This application enables foremen to submit QA reports, track incidents, generate AI-powered summaries, and integrate with Microsoft Teams.

### Technology Stack:
- **Power Apps** (Canvas + Model-driven apps)
- **Microsoft Dataverse** (Database)
- **Power Automate** (Workflows)
- **Azure Functions** (Backend API with TypeScript)
- **Azure OpenAI** (AI-powered summaries)
- **Microsoft Teams** (Notifications and collaboration)
- **Microsoft Copilot** (AI assistant integration)

---

## 📋 YOUR CURRENT TASKS

Based on Claude's comprehensive analysis, the project is approximately **70% complete** but requires:
1. Bug fixes and security improvements
2. Completing Azure Functions implementation
3. Dataverse schema deployment
4. Power Apps validation and testing
5. Power Automate flow enhancements
6. Copilot integration

---

## 🚀 SPRINT PLAN

### SPRINT 1: Foundation Fixes (Priority 1)
**Duration:** 3-5 days
**Goal:** Get everything compiling, validated, and deployable

#### Task 1.1: Complete Azure Functions TypeScript Fixes
**Owner:** Grok
**Time:** 2-3 hours
**Location:** `/m365-deployment/azure-functions/`

**Steps:**
1. Navigate to: `cd /Users/dhruvmann/sga-qa-pack/m365-deployment/azure-functions`
2. Run: `npm install`
3. Run: `npm run build`
4. Fix any remaining TypeScript compilation errors
5. Ensure all tests pass: `npm test`
6. Document changes in a file: `ai_team_output/code_changes/azure_functions_fixes.md`

**Success Criteria:**
- Zero TypeScript errors in m365-deployment directory
- All unit tests passing
- Build completes successfully

---

#### Task 1.2: Consolidate Power Apps Files
**Owner:** Gemini
**Time:** 2 hours
**Problem:** Duplicate YAML files in two locations

**Steps:**
1. Compare files in:
   - `/Users/dhruvmann/sga-qa-pack/power-app-source/`
   - `/Users/dhruvmann/sga-qa-pack/sga-foreman-app-src/src/`
2. Determine which set is more recent/complete
3. Consolidate into `/power-app-source/` (preferred location)
4. Delete duplicates
5. Document the consolidation process

**Success Criteria:**
- Single source of truth for Power Apps YAML
- No duplicate files
- Documentation of changes made

---

#### Task 1.3: Implement Dataverse Connection in Azure Functions
**Owner:** Grok
**Time:** 4-6 hours
**Location:** `m365-deployment/azure-functions/GenerateAISummary.ts`

**Current Issue:** The Dataverse connection is mocked (lines 90-98)

**Steps:**
1. Install package: `npm install @microsoft/power-platform-dataverse`
2. Replace mock function with real Dataverse API calls
3. Update authentication to use Azure AD
4. Test with sample QA Pack ID
5. Add error handling for connection failures

**Code Reference:**
```typescript
// Replace fetchQAPackFromDataverse function
import { DataverseClient } from '@microsoft/power-platform-dataverse';

async function fetchQAPackFromDataverse(qaPackId: string, config: any): Promise<any> {
  const client = new DataverseClient({
    serverUrl: config.dataverseUrl,
    onTokenRefresh: async () => {
      // Use Azure AD authentication
      return await getAccessToken(config);
    }
  });

  const result = await client.retrieve('sga_qapacks', qaPackId);
  return result;
}
```

**Success Criteria:**
- Real Dataverse queries working
- Proper error handling
- Authentication configured
- Test connection successful

---

#### Task 1.4: Fix Power Automate Flows
**Owner:** Grok
**Time:** 4-6 hours
**Reference:** See `m365-deployment/power-automate-flows/QUICK_FIX_GUIDE.md`

**Files to Update:**
1. `QA_Pack_Submission_Handler.json`
2. `Daily_Summary_Generator.json`
3. `Job_Creation_Handler.json`

**Required Changes (all 3 flows):**
1. Wrap all actions in Try-Catch scopes
2. Add retry policies with exponential backoff
3. Replace hardcoded values with environment variables
4. Add proper error logging to Teams
5. Test each flow end-to-end

**Template for Error Handling:**
```json
{
  "Scope_Try": {
    "type": "Scope",
    "actions": {
      // Your existing actions here
    }
  },
  "Scope_Catch": {
    "type": "Scope",
    "actions": {
      "Send_Error_Notification": {
        "type": "ApiConnection",
        "inputs": {
          "host": {
            "connectionName": "shared_teams",
            "operationId": "PostMessageToChannel"
          },
          "parameters": {
            "message": "@{result('Scope_Try')}"
          }
        }
      }
    },
    "runAfter": {
      "Scope_Try": ["Failed", "Skipped", "TimedOut"]
    }
  }
}
```

**Success Criteria:**
- All flows have error scopes
- Retry policies configured
- No hardcoded values
- Flows tested successfully

---

### SPRINT 2: Integration & Testing (Priority 2)
**Duration:** 5-7 days
**Goal:** Connect all components and validate end-to-end flow

#### Task 2.1: Deploy Dataverse Schema
**Owner:** Gemini
**Time:** 3-4 hours
**Reference:** `m365-integration/02_DATAVERSE_SCHEMA_PART2.md`

**Steps:**
1. Review the schema design document
2. Access Microsoft Power Platform admin center
3. Create Dataverse environment (if not exists)
4. Create tables:
   - `sga_qapack`
   - `sga_job`
   - `sga_incident`
   - `sga_dailyreport`
   - `sga_user`
5. Set up relationships between tables
6. Create security roles:
   - Foreman
   - Engineer
   - HSEQ Manager
   - Administrator
7. Document the deployment process

**Success Criteria:**
- All tables created in Dataverse
- Relationships established
- Security roles configured
- Sample data added for testing

---

#### Task 2.2: Validate Power Apps YAML
**Owner:** Grok
**Time:** 3 hours

**Steps:**
1. Install Power Apps CLI if not installed:
   ```bash
   dotnet tool install --global Microsoft.PowerApps.CLI
   ```
2. Navigate to power apps directory:
   ```bash
   cd /Users/dhruvmann/sga-qa-pack/power-app-source
   ```
3. Pack the YAML into MSAPP:
   ```bash
   pac canvas pack --sources . --msapp sga-qa-pack.msapp
   ```
4. Fix any YAML syntax errors reported
5. Import to Power Apps Studio for visual testing
6. Document any issues found

**Success Criteria:**
- YAML validates without errors
- MSAPP file generated successfully
- App opens in Power Apps Studio
- All screens load correctly

---

#### Task 2.3: End-to-End Testing
**Owner:** Gemini + Grok (collaborative)
**Time:** 6-8 hours

**Test Scenarios:**
1. **QA Pack Submission Flow:**
   - Foreman opens Power App
   - Selects a job
   - Fills in QA Pack form
   - Submits to Dataverse
   - Power Automate flow triggers
   - Azure Function generates AI summary
   - Teams notification sent
   - Verify all steps complete successfully

2. **Daily Report Generation:**
   - Trigger daily summary flow
   - Verify data pulled from Dataverse
   - Check PDF generation
   - Confirm email sent

3. **Incident Reporting:**
   - Create incident in Power App
   - Verify saved to Dataverse
   - Check Teams alert
   - Confirm escalation workflow

**Documentation:**
- Record results in `ai_team_output/testing_report.md`
- Screenshot any errors
- Log performance metrics

**Success Criteria:**
- All 3 test scenarios pass
- No critical bugs found
- Performance acceptable (< 5s response times)

---

### SPRINT 3: Intelligence & Enhancement (Priority 3)
**Duration:** 5-7 days
**Goal:** Add AI features and polish user experience

#### Task 3.1: Microsoft Copilot Integration
**Owner:** Gemini (research) + Grok (implementation)
**Time:** 6-8 hours
**Reference:** `m365-integration/06_COPILOT_INTEGRATION.md`

**Gemini Research Steps:**
1. Research latest Microsoft Copilot Studio (November 2025)
2. Identify best practices for Dataverse integration
3. Document available features for Office 365 Premium
4. Create implementation plan

**Grok Implementation Steps:**
1. Access Microsoft Copilot Studio
2. Create new Copilot agent: "SGA QA Assistant"
3. Add topics:
   - "Show my QA packs"
   - "Create new QA pack"
   - "Find incidents by job number"
   - "Summarize today's work"
   - "Show safety statistics"
4. Connect to Dataverse tables
5. Configure security (role-based access)
6. Add Copilot plugin to Power App
7. Test all topics

**Success Criteria:**
- Copilot agent created and configured
- All 5 topics working
- Integrated with Power App
- Responses are accurate and helpful
- Respects user security roles

---

#### Task 3.2: Enhance Azure OpenAI Summaries
**Owner:** Grok
**Time:** 3-4 hours
**Location:** `m365-deployment/azure-functions/GenerateAISummary.ts`

**Enhancements:**
1. Improve prompt engineering for better summaries
2. Add multi-language support (if needed)
3. Include sentiment analysis
4. Add risk scoring based on content
5. Implement summary caching (Redis)

**Code Sample:**
```typescript
const enhancedPrompt = `
You are a senior construction project manager with 36 years of experience in Australian construction projects.

Analyze the following QA report and provide:
1. Executive Summary (3-4 bullet points)
2. Risk Assessment (Low/Medium/High with justification)
3. Required Actions (prioritized list)
4. Compliance Status (temperature, quality metrics)

QA Pack Data:
${sanitizedData}

Provide output in JSON format for easy parsing.
`;
```

**Success Criteria:**
- Better quality summaries
- Risk scoring implemented
- JSON output for structured data
- Performance maintained (< 10s generation time)

---

#### Task 3.3: Offline Sync Implementation
**Owner:** Grok
**Time:** 6-8 hours
**Location:** Power Apps Canvas App

**Steps:**
1. Research Power Apps offline capabilities
2. Configure offline profile
3. Implement data caching strategy
4. Add sync conflict resolution
5. Test offline->online sync

**Success Criteria:**
- App works offline
- Data syncs when connection restored
- Conflicts resolved gracefully
- User notified of sync status

---

## 🔐 SECURITY REQUIREMENTS

**CRITICAL:** The application has 23 security vulnerabilities identified by Claude's audit. Prioritize these fixes:

### Priority Security Fixes:
1. **Prompt Injection Protection** - Already implemented in GenerateAISummary.ts
2. **Authorization Checks** - Verify users can only access their division's data
3. **Input Sanitization** - All user inputs must be sanitized
4. **Rate Limiting** - Prevent API abuse (already implemented)
5. **Secret Management** - Use Azure Key Vault (configured)

**For ALL code changes:**
- Never hardcode API keys or secrets
- Always validate and sanitize user input
- Implement proper error handling
- Log security events
- Follow principle of least privilege

---

## 📊 REPORTING & COLLABORATION

### Daily Progress Report
Create file: `ai_team_output/daily_progress_YYYYMMDD.md`

**Template:**
```markdown
# Daily Progress Report - [DATE]

## Completed Tasks:
- [Task name] - [Status] - [Time spent]

## In Progress:
- [Task name] - [Current blocker if any]

## Blockers/Issues:
- [Describe any blockers]

## Questions for Claude:
- [Any architecture or security questions]

## Next Steps:
- [Tomorrow's plan]

## Code Changes:
- Files modified: [list]
- Lines changed: [count]
- Tests added/updated: [count]
```

### Code Review Process
**Grok writes code → Gemini reviews → Both document → Claude approves**

For each code change:
1. Grok implements and commits
2. Gemini reviews for:
   - Code quality
   - Security issues
   - Performance concerns
   - Best practices
3. Gemini creates review report
4. Claude (user) provides final approval

---

## 🛠️ TOOLS & RESOURCES

### Development Tools:
- **VS Code** (recommended IDE)
- **Power Apps CLI** (`pac` command)
- **Azure CLI** (`az` command)
- **Postman** (API testing)
- **Git** (version control)

### Documentation References:
- Project docs in `/m365-integration/`
- Security audit: `/ENTERPRISE_SECURITY_AUDIT.md`
- Implementation guide: `/IMPLEMENTATION_GUIDE_FOR_GEMINI_GROK.md`
- M365 guide: `/M365_IMPLEMENTATION_GUIDE.md`

### Microsoft Documentation:
- Power Apps: https://learn.microsoft.com/power-apps/
- Dataverse: https://learn.microsoft.com/power-apps/developer/data-platform/
- Power Automate: https://learn.microsoft.com/power-automate/
- Azure Functions: https://learn.microsoft.com/azure/azure-functions/
- Copilot Studio: https://learn.microsoft.com/microsoft-copilot-studio/

---

## ✅ SUCCESS CRITERIA

### Sprint 1 Complete When:
- [ ] Zero TypeScript errors
- [ ] All unit tests passing
- [ ] Power Apps YAML validated
- [ ] Power Automate flows fixed
- [ ] Documentation updated

### Sprint 2 Complete When:
- [ ] Dataverse schema deployed
- [ ] End-to-end tests passing
- [ ] All components connected
- [ ] Performance benchmarks met

### Sprint 3 Complete When:
- [ ] Copilot integration working
- [ ] AI summaries enhanced
- [ ] Offline sync functional
- [ ] User acceptance testing passed

---

## 🚨 ESCALATION PROTOCOL

**When to ask Claude for help:**
- Security vulnerability discovered
- Architecture decision needed
- Stuck on blocker > 2 hours
- Major design change required
- Unclear requirements

**How to ask:**
1. Document the issue clearly
2. Show what you've tried
3. Provide error messages/logs
4. Suggest potential solutions
5. Ask specific questions

---

## 🎯 CURRENT PRIORITY

**START HERE:** Sprint 1, Task 1.1 - Complete Azure Functions TypeScript Fixes

Good luck, team! Build something amazing! 🚀

---

**Document Created:** November 15, 2025
**For:** Grok + Gemini AI Team
**Supervised by:** Claude (via user interaction)
**Version:** 1.0
