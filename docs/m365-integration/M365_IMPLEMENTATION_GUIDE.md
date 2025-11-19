# M365-Only Implementation Guide
**For:** Grok & Gemini
**Focus:** 100% Microsoft 365 Integration
**Date:** November 15, 2025

---

## 🎯 ARCHITECTURE DECISION: M365-ONLY

**User Decision:** Build 100% M365-based app using:
- ✅ Power Apps (Canvas + Model-driven)
- ✅ SharePoint/Dataverse
- ✅ Power Automate
- ✅ Azure Functions (backend logic)
- ✅ Microsoft Copilot
- ✅ Microsoft Teams integration

**Ignore:** The Vercel/React app in root directory (reference only)

---

## 🚀 CURRENT STATUS - M365 COMPONENTS

### Azure Functions ✅ 70% Complete
**Location:** `/m365-deployment/azure-functions/`
**Status:** Most TypeScript errors fixed (reduced from 33 to ~10)
**What Works:**
- ✅ GenerateAISummary.ts - AI-powered QA summaries
- ✅ Security fixes implemented (sanitization, auth, rate limiting)
- ✅ Input validation with Joi
- ✅ Key Vault integration
- ✅ Rate limiting with Redis

**What Needs Work:**
- ⚠️ Few remaining TypeScript errors
- ❌ Implement actual Dataverse connectivity (currently mock)
- ❌ Add more Azure Functions for CRUD operations
- ❌ Complete test suite

---

### Power Apps 📱 50% Complete
**Location:** `/power-app-source/` AND `/sga-foreman-app-src/`
**Status:** YAML scaffolding exists, needs validation

**Screens Created:**
1. DashboardScreen.fx.yaml
2. QAPackScreen.fx.yaml
3. JobDetailsScreen.fx.yaml
4. IncidentReportScreen.fx.yaml
5. SettingsScreen.fx.yaml
6. AROverlayScreen.fx.yaml
7. CollaborationScreen.fx.yaml
8. GamificationScreen.fx.yaml
9. VivaInsightsScreen.fx.yaml
10. DailyReportForm.fx.yaml
11. App.fx.yaml

**What Needs Work:**
- ⚠️ Duplicate files in two locations - need to consolidate
- ❌ Validate YAML syntax with PAC CLI
- ❌ Test in Power Apps Studio
- ❌ Connect to Dataverse
- ❌ Implement offline sync
- ❌ Add Copilot integration properly

---

### Power Automate 🔄 60% Complete
**Location:** `/m365-deployment/power-automate-flows/`
**Status:** Flow JSONs exist, need fixes

**Flows Created:**
1. QA_Pack_Submission_Handler.json
2. Daily_Summary_Generator.json
3. Job_Creation_Handler.json

**Issues Found:** 57 issues (17 critical) - See ANALYSIS_REPORT.md

**What Needs Work:**
- ❌ Fix error handling scopes
- ❌ Implement retry policies
- ❌ Add proper Teams notifications
- ❌ Connect to Azure Functions
- ❌ Test end-to-end

---

### Dataverse/SharePoint 📊 30% Complete
**Location:** `/m365-integration/02_DATAVERSE_SCHEMA_PART2.md`
**Status:** Schema designed in documentation, not deployed

**What Needs Work:**
- ❌ Deploy schema to Dataverse
- ❌ Create tables and relationships
- ❌ Set up security roles
- ❌ Create sample data
- ❌ Test Power Apps connection

---

### Copilot Integration 🤖 20% Complete
**Location:** `/m365-integration/06_COPILOT_INTEGRATION.md`
**Status:** Documented but not implemented

**What Needs Work:**
- ❌ Create Copilot agent
- ❌ Add knowledge sources
- ❌ Integrate with Power Apps
- ❌ Test queries
- ❌ Add custom topics

---

## 🔧 IMMEDIATE FIXES NEEDED

### Fix #1: Consolidate Power Apps Files (GROK - 2 hours)
**Problem:** Duplicate YAML files in two locations
- `/power-app-source/` (11 files)
- `/sga-foreman-app-src/src/` (11 files)

**Tasks:**
1. Compare files to find differences
2. Determine which is newer/better
3. Consolidate into one location
4. Delete duplicates
5. Update documentation

---

### Fix #2: Complete Azure Functions (GEMINI - 8 hours)
**Remaining TypeScript errors:** ~10 (Vercel app related - can ignore for M365)

**Tasks:**
1. Run: `npm run build` in m365-deployment/azure-functions
2. Verify 0 errors in m365-deployment directory
3. Implement actual Dataverse connection:
```typescript
// Replace mock in GenerateAISummary.ts:90-98
async function fetchQAPackFromDataverse(qaPackId: string, ...): Promise<any> {
  // Use @microsoft/dataverse-webapi
  const client = new DataverseWebApi(dataverseUrl);
  const result = await client.retrieve('sga_qapacks', qaPackId);
  return result;
}
```
4. Add CRUD Azure Functions:
   - CreateQAPack
   - UpdateQAPack
   - DeleteQAPack
   - ListQAPacks
5. Test with Postman/REST Client

---

### Fix #3: Deploy Dataverse Schema (GEMINI - 4 hours)
**Use:** PowerShell scripts in `/m365-deployment/scripts/`

**Tasks:**
1. Review: `m365-integration/02_DATAVERSE_SCHEMA_PART2.md`
2. Create Dataverse environment (if not exists)
3. Run: `Deploy-DataverseSchema.ps1`
4. Verify tables created:
   - sga_qapack
   - sga_job
   - sga_incident
   - sga_user
   - etc.
5. Create security roles:
   - Foreman
   - Engineer
   - HSEQ Manager
   - Admin

---

### Fix #4: Validate Power Apps YAML (GROK - 3 hours)
**Tool:** Power Apps CLI (PAC)

**Tasks:**
1. Install PAC CLI:
```bash
dotnet tool install --global Microsoft.PowerApps.CLI
```

2. Validate YAML:
```bash
cd /Users/dhruvmann/sga-qa-pack/power-app-source
pac canvas pack --sources . --msapp sga-qa-pack.msapp
```

3. If errors, research and fix
4. Import to Power Apps Studio:
```bash
pac canvas unpack --msapp sga-qa-pack.msapp --sources power-app-source-validated
```

5. Open in Power Apps Studio and test

---

### Fix #5: Implement Copilot (GROK - 6 hours)
**Resource:** https://learn.microsoft.com/microsoft-copilot-studio/

**Tasks:**
1. Research: Latest Copilot Studio features (November 2025)
2. Create Copilot agent in Copilot Studio
3. Add topics:
   - "Show my QA packs"
   - "Create new QA pack"
   - "Find incidents"
   - "Summarize today's work"
4. Connect to Dataverse
5. Add to Power App as plugin
6. Test queries

---

### Fix #6: Fix Power Automate Flows (GEMINI - 6 hours)
**Reference:** `m365-deployment/power-automate-flows/QUICK_FIX_GUIDE.md`

**Priority Fixes:**
1. Add error scopes to all actions
2. Implement retry policies (exponential backoff)
3. Fix hardcoded values (use environment variables)
4. Add proper Teams notifications
5. Test each flow end-to-end

**Template for Error Scope:**
```json
{
  "Scope_TryCatch": {
    "type": "Scope",
    "actions": {
      "Your_Action": { ...}
    },
    "runAfter": {}
  },
  "Scope_Catch": {
    "type": "Scope",
    "actions": {
      "Send_Teams_Error": { ...}
    },
    "runAfter": {
      "Scope_TryCatch": ["Failed", "Skipped", "TimedOut"]
    }
  }
}
```

---

## 📋 SPRINT PLAN - M365 FOCUSED

### Sprint 1 (Week 1): Fix Foundation
**Owner:** Gemini + Grok
**Goal:** Get everything compiling and basic deployment working

- [x] Fix Azure Functions TypeScript errors (DONE by Claude)
- [ ] Complete remaining TypeScript fixes (Gemini - 2 hours)
- [ ] Consolidate Power Apps files (Grok - 2 hours)
- [ ] Validate YAML with PAC CLI (Grok - 3 hours)
- [ ] Deploy Dataverse schema (Gemini - 4 hours)
- [ ] Test Azure Functions locally (Gemini - 2 hours)

**Deliverable:** Clean build, Dataverse deployed, Power Apps validated

---

### Sprint 2 (Week 2): Connect Everything
**Owner:** Gemini
**Goal:** End-to-end connectivity

- [ ] Implement Dataverse connector in Azure Functions (8 hours)
- [ ] Connect Power Apps to Dataverse (4 hours)
- [ ] Fix Power Automate flows (6 hours)
- [ ] Test QA Pack submission flow end-to-end (4 hours)
- [ ] Add Teams notifications (2 hours)

**Deliverable:** Working QA Pack creation and submission

---

### Sprint 3 (Week 3): Add Intelligence
**Owner:** Grok (research) + Gemini (implement)
**Goal:** Copilot and AI features

- [ ] Create Copilot agent (Grok - 4 hours)
- [ ] Integrate Copilot with Power Apps (Gemini - 4 hours)
- [ ] Enhance Azure OpenAI summaries (Gemini - 4 hours)
- [ ] Add offline sync (Gemini - 6 hours)
- [ ] Implement AR features (Grok research, Gemini implement - 6 hours)

**Deliverable:** AI-powered app with Copilot

---

### Sprint 4 (Week 4): Polish & Deploy
**Owner:** Both
**Goal:** Production-ready

- [ ] Complete testing (8 hours)
- [ ] Fix all bugs (6 hours)
- [ ] Complete documentation (4 hours)
- [ ] Security audit (4 hours)
- [ ] Deploy to production (4 hours)
- [ ] User training (2 hours)

**Deliverable:** PRODUCTION DEPLOYMENT

---

## 🏗️ DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                     Microsoft 365 Tenant                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │   Power Apps     │◄────────►│   Dataverse      │        │
│  │  (Canvas App)    │          │   (Database)     │        │
│  └──────────────────┘          └──────────────────┘        │
│           │                              │                   │
│           │                              │                   │
│           ▼                              ▼                   │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │ Power Automate   │◄────────►│ Azure Functions  │        │
│  │    (Workflows)   │          │   (Backend API)  │        │
│  └──────────────────┘          └──────────────────┘        │
│           │                              │                   │
│           ▼                              ▼                   │
│  ┌──────────────────┐          ┌──────────────────┐        │
│  │ Microsoft Teams  │          │  Azure OpenAI    │        │
│  │ (Notifications)  │          │   (AI Summaries) │        │
│  └──────────────────┘          └──────────────────┘        │
│                                         │                    │
│  ┌──────────────────┐                  │                   │
│  │ Copilot Studio   │◄─────────────────┘                   │
│  │  (AI Assistant)  │                                       │
│  └──────────────────┘                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 REQUIRED AZURE RESOURCES

### Create these in Azure Portal:

1. **Resource Group:** `rg-sga-qapack-prod`

2. **Azure Function App:**
   - Name: `func-sga-qapack-prod`
   - Runtime: Node.js 18 LTS
   - Plan: Consumption (serverless)

3. **Azure Key Vault:**
   - Name: `kv-sga-qapack-prod`
   - Enable Managed Identity on Function App
   - Grant Function App "Secret Get" permission

4. **Azure OpenAI:**
   - Name: `openai-sga-qapack-prod`
   - Deploy model: `gpt-4` or `gpt-4-turbo`

5. **Application Insights:**
   - Name: `ai-sga-qapack-prod`
   - Connect to Function App

6. **Redis Cache** (for rate limiting):
   - Use Azure Redis Cache OR Upstash (free tier)

---

## 🔐 SECRETS TO CONFIGURE

**In Azure Key Vault:**
```
AzureOpenAIEndpoint = https://openai-sga-qapack-prod.openai.azure.com/
AzureOpenAIKey = <your-key>
DataverseUrl = https://org.crm.dynamics.com
DataverseClientId = <app-registration-id>
DataverseClientSecret = <app-secret>
RedisConnectionString = <redis-connection>
TeamsWebhookManagement = <webhook-url>
TeamsWebhookSummary = <webhook-url>
TeamsWebhookError = <webhook-url>
```

---

## 🧪 TESTING CHECKLIST

### Azure Functions Testing:
- [ ] `npm test` passes in m365-deployment/azure-functions
- [ ] Postman tests for all endpoints
- [ ] Load testing with k6
- [ ] Security scanning with OWASP ZAP

### Power Apps Testing:
- [ ] Open in Power Apps Studio without errors
- [ ] All screens navigable
- [ ] Dataverse connection works
- [ ] Offline mode functions
- [ ] Forms submit successfully

### Power Automate Testing:
- [ ] Manual trigger works
- [ ] Error handling catches failures
- [ ] Retry policies work
- [ ] Teams notifications arrive
- [ ] End-to-end QA pack flow completes

### Copilot Testing:
- [ ] Agent responds to queries
- [ ] Connects to Dataverse correctly
- [ ] Provides accurate information
- [ ] Handles errors gracefully

---

## 📚 KEY DOCUMENTATION

**Read These:**
1. `/m365-integration/MASTER_INTEGRATION_PLAN.md` - Overall architecture
2. `/m365-integration/02_DATAVERSE_SCHEMA_PART2.md` - Database design
3. `/m365-integration/03_POWER_APPS_CANVAS.md` - App structure
4. `/m365-integration/05_POWER_AUTOMATE_FLOWS.md` - Workflow logic
5. `/m365-integration/06_COPILOT_INTEGRATION.md` - AI features
6. `/m365-integration/07_AZURE_FUNCTIONS.md` - Backend API

**Also Review:**
- `CLAUDE_COMPREHENSIVE_ANALYSIS.md` - Full project analysis
- `m365-deployment/power-automate-flows/QUICK_FIX_GUIDE.md` - Flow fixes

---

## 🎯 SUCCESS CRITERIA

### You know it's working when:
- [ ] Power App opens in Studio without errors
- [ ] Can create a QA Pack in Power App
- [ ] QA Pack saves to Dataverse
- [ ] Power Automate flow triggers
- [ ] Azure Function generates AI summary
- [ ] Teams notification received
- [ ] Copilot answers "Show my QA packs"
- [ ] Everything works offline

---

## 🚨 AVOID THESE MISTAKES

1. ❌ Don't work on Vercel app code (it's reference only)
2. ❌ Don't deploy without testing in staging first
3. ❌ Don't hardcode secrets (use Key Vault)
4. ❌ Don't skip error handling
5. ❌ Don't forget retry policies
6. ❌ Don't ignore security warnings

---

## 📞 COMMUNICATION PROTOCOL

**Daily Standup Format:**
```
Yesterday: [What you completed]
Today: [What you're working on]
Blockers: [Any issues]
Progress: X/Y tasks complete
```

**When Stuck:**
1. Search Microsoft Learn docs
2. Check GitHub issues
3. Ask in Teams channel
4. Escalate if > 2 hours blocked

---

## 🏁 READY TO START

**Next Actions:**
1. **Grok:** Start with Fix #1 (Consolidate Power Apps files)
2. **Gemini:** Start with Fix #2 (Complete Azure Functions)
3. **Both:** Update progress in daily log
4. **Both:** Commit to git frequently

**Let's build an amazing M365 app!** 🚀

---

**Created by:** Claude
**For:** 100% M365 Implementation
**Timeline:** 4 weeks to production
**Status:** READY TO IMPLEMENT
