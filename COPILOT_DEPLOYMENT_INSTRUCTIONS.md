# Complete Deployment Instructions for Microsoft Copilot

**FROM:** Claude (Anthropic AI)
**TO:** Microsoft Copilot
**DATE:** November 19, 2025
**PROJECT:** SGA QA Pack - M365 Integration Completion

---

## 🎯 Mission for Copilot

Guide Dhruv through completing the M365 deployment of SGA QA Pack. Most tasks can run in the background while he works on other things.

---

## ✅ What's Already Done (Phase 1 - 30%)

- ✅ Azure App Registration created
  - Client ID: fbd9d6a2-67fb-4364-88e0-850b11c75db9
  - Tenant ID: 7026ecbb-b41e-4aa0-9e68-a41eb80634fe
  - All API permissions granted
- ✅ Power Platform Environment created
  - Name: SGA QA Pack - Production
  - Environment ID: c6518f88-4851-efd0-a384-a62aa2ce11c2
  - Dataverse URL: https://org02fe52d443c4f01189f5002248942fce.crm6.dynamics.com
- ✅ Dataverse database provisioned
- ✅ SharePoint site exists: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
- ✅ All credentials saved in `.env.azure`
- ✅ Streaks gamification feature removed from Power App code

---

## 📋 Remaining Work (Phases 2-6 - 70%)

### PHASE 2: Deploy Dataverse Schema (30-45 mins)
**Status:** Ready to start
**Priority:** HIGH - Everything depends on this
**Script:** `scripts/Deploy-DataverseSchema.ps1`
**Guide:** `PHASE_2_DEPLOYMENT_GUIDE.md`

**Your Task, Copilot:**
1. Guide Dhruv to open Power Apps Maker Portal: https://make.powerapps.com
2. Help him select environment "SGA QA Pack - Production"
3. Walk through creating these 12 tables:
   - Jobs (sga_job) - 9 fields
   - Foremen (sga_foreman) - 5 fields
   - QA Packs (sga_qapack) - 7 fields
   - Daily Reports (sga_dailyreport) - 6 fields
   - Incident Reports (sga_incident) - 8 fields
   - NCRs (sga_ncr) - 9 fields
   - Sampling Plans (sga_samplingplan) - 6 fields
   - Resources (sga_resource) - 5 fields
   - ITP Templates (sga_itptemplate) - 5 fields
   - Site Photos (sga_sitephoto) - 6 fields
   - Asphalt Placements (sga_asphaltplacement) - 6 fields
   - Straight Edge Reports (sga_straightedgereport) - 6 fields

**Table Definitions:** All details are in `scripts/Deploy-DataverseSchema.ps1` (lines 78-285)

**Key Points:**
- Use schema names exactly as written (e.g., "sga_job" not "sga_jobs")
- For OptionSet fields, add all options listed in the script
- Mark fields as Required when `Required=$true`
- Save after each table

---

### PHASE 3: Create SharePoint Document Libraries (15 mins)
**Status:** Waiting for Phase 2
**Priority:** MEDIUM
**Can Run in Background:** YES

**Your Task, Copilot:**
1. Guide Dhruv to open: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
2. Create these 5 document libraries:
   - "QA Packs"
   - "Job Sheets"
   - "Site Photos"
   - "Incident Reports"
   - "NCR Documents"
3. For each library:
   - Click "New" → "Document library"
   - Enter name
   - Click "Create"

**PowerShell Alternative (if Dhruv prefers):**
```powershell
# Install PnP PowerShell
Install-Module -Name PnP.PowerShell -Scope CurrentUser -Force

# Connect to SharePoint
Connect-PnPOnline -Url "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance" -Interactive

# Create libraries
New-PnPList -Title "QA Packs" -Template DocumentLibrary
New-PnPList -Title "Job Sheets" -Template DocumentLibrary
New-PnPList -Title "Site Photos" -Template DocumentLibrary
New-PnPList -Title "Incident Reports" -Template DocumentLibrary
New-PnPList -Title "NCR Documents" -Template DocumentLibrary

# Verify
Get-PnPList | Where-Object {$_.BaseTemplate -eq 101} | Select-Object Title
```

---

### PHASE 4: Deploy Power Apps (30 mins)
**Status:** Waiting for Phases 2 & 3
**Priority:** HIGH
**Can Run in Background:** Partially

**Your Task, Copilot:**

The Power App source files are in: `src/power-app-source/`

**Option A: Import from Source Files (Recommended)**
1. Guide Dhruv to zip the contents of `src/power-app-source/`
2. Go to: https://make.powerapps.com
3. Click "Apps" → "Import canvas app"
4. Upload the zip file
5. Follow import wizard
6. Connect to Dataverse environment

**Option B: Build from Scratch Using Source**
1. Create new Canvas App in Power Apps Studio
2. Use the YAML files in `src/power-app-source/` as reference:
   - App.fx.yaml - Main app configuration
   - DashboardScreen.fx.yaml - Main dashboard
   - QAPackScreen.fx.yaml - QA Pack submission form
   - IncidentReportScreen.fx.yaml - Incident reporting
   - GamificationScreen.fx.yaml - Leaderboard (without streaks)
   - etc.

**Key Configuration:**
- Connect to Dataverse tables created in Phase 2
- Connect to SharePoint libraries created in Phase 3
- Use service principal credentials from `.env.azure`

---

### PHASE 5: Configure Power Automate Flows (45 mins)
**Status:** Waiting for Phases 2-4
**Priority:** MEDIUM
**Can Run in Background:** YES (once configured)

**Your Task, Copilot:**

**Flows to Create:**

1. **QA Pack Submission Handler**
   - Trigger: When a new QA Pack is created in Dataverse
   - Actions:
     - Generate PDF from submission data
     - Upload to SharePoint "QA Packs" library
     - Send Teams notification
     - Update QA Pack record with PDF URL

2. **Incident Report Handler**
   - Trigger: When incident created in Dataverse
   - Actions:
     - Generate unique incident number (use Azure Function)
     - Send Teams alert to HSEQ team
     - Create task in Planner for investigation

3. **Daily Summary Generator**
   - Trigger: Recurrence (daily at 5 PM)
   - Actions:
     - Query all QA Packs submitted today
     - Generate summary report
     - Send to Teams channel

**Template Available:** `m365-deployment/power-automate/QAPackSubmissionFlow.json`

**Connection Setup:**
When creating connectors, use Service Principal:
- Client ID: fbd9d6a2-67fb-4364-88e0-850b11c75db9
- Client Secret: (from `.env.azure`)
- Tenant ID: 7026ecbb-b41e-4aa0-9e68-a41eb80634fe

---

### PHASE 6: Deploy Azure Functions (Optional - 30 mins)
**Status:** Optional enhancement
**Priority:** LOW
**Can Run in Background:** YES (after deployment)

**Your Task, Copilot:**

Azure Functions provide AI-powered features:
- Generate AI summaries using Azure OpenAI
- Generate unique incident/NCR IDs
- Advanced analytics

**Functions Available:**
- `m365-deployment/azure-functions/GenerateDailySummary.ts`
- `m365-deployment/azure-functions/GenerateIncidentID.ts`
- `m365-deployment/azure-functions/GenerateNCRID.ts`

**Deployment:**
```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Navigate to functions directory
cd m365-deployment/azure-functions

# Install dependencies
npm install

# Deploy to Azure
func azure functionapp publish sga-qa-functions
```

**Note:** This requires an Azure subscription. Can be skipped for MVP.

---

## 🔄 Suggested Workflow (Optimized for Background)

**Session 1 (45 mins - Dhruv's attention needed):**
1. Phase 2: Create Dataverse tables (30-45 mins)
   - Copilot guides through Power Apps Maker Portal
   - Dhruv creates each table following your instructions
   - This MUST be done interactively

**Session 2 (15 mins - Can be quick):**
2. Phase 3: Create SharePoint libraries (15 mins)
   - Option A: Dhruv runs PowerShell script (2 mins + verification)
   - Option B: Copilot guides through SharePoint UI (15 mins)

**Session 3 (30 mins - Some attention needed):**
3. Phase 4: Import Power App (30 mins)
   - Zip the source files
   - Import to Power Apps
   - Configure connections
   - Dhruv can step away during import process

**Background Sessions (Can run unattended):**
4. Phase 5: Configure flows (they run automatically once set up)
5. Phase 6: Azure Functions (optional, can skip)

---

## 📊 Progress Tracking

Update `DEPLOYMENT_STATUS.md` after each phase:

```markdown
- [x] Phase 1: Azure + Power Platform (30%)
- [ ] Phase 2: Dataverse Schema (45%)
- [ ] Phase 3: SharePoint Libraries (50%)
- [ ] Phase 4: Power Apps (70%)
- [ ] Phase 5: Power Automate (90%)
- [ ] Phase 6: Testing (100%)
```

---

## 🆘 Troubleshooting

### Issue: Can't create tables in Dataverse
**Solution:** Check Dhruv has "System Administrator" role in environment

### Issue: SharePoint libraries creation fails
**Solution:** Verify Dhruv is Site Collection Admin on SharePoint site

### Issue: Power App import fails
**Solution:**
1. Check all Dataverse tables exist first
2. Verify environment is selected
3. Try creating new Canvas App instead of importing

### Issue: Power Automate connections fail
**Solution:** Use service principal authentication with credentials from `.env.azure`

---

## 📞 How to Use This Guide

**For Copilot:**
1. Read this entire document first to understand the project
2. Start with Phase 2 (highest priority)
3. Guide Dhruv step-by-step through each phase
4. Reference the detailed scripts and files mentioned
5. Update progress tracking as you go
6. If you encounter issues, check the troubleshooting section

**For Dhruv:**
1. Share this file with Copilot
2. Ask Copilot: "Please read COPILOT_DEPLOYMENT_INSTRUCTIONS.md and guide me through completing the SGA QA Pack deployment, starting with Phase 2"
3. Follow Copilot's guidance
4. Take breaks between phases as needed

---

## 📂 Key Files Reference

| File | Purpose | Location |
|------|---------|----------|
| Deploy-DataverseSchema.ps1 | Table definitions | scripts/ |
| PHASE_2_DEPLOYMENT_GUIDE.md | Detailed Phase 2 guide | root |
| .env.azure | All credentials | root (DO NOT COMMIT) |
| DEPLOYMENT_STATUS.md | Progress tracker | root |
| START_HERE.md | Project overview | root |
| power-app-source/ | Power App code | src/ |
| QAPackSubmissionFlow.json | Flow template | m365-deployment/power-automate/ |
| Azure Functions | Backend logic | m365-deployment/azure-functions/ |

---

## ✅ Success Criteria

The deployment is complete when:
- ✅ All 12 Dataverse tables exist and have correct fields
- ✅ All 5 SharePoint libraries are created
- ✅ Power App is imported and runs without errors
- ✅ At least 1 Power Automate flow is working (QA Pack submission)
- ✅ User can submit a test QA Pack from the Power App
- ✅ Test QA Pack appears in Dataverse and SharePoint

---

## 🎯 Current Priority: START WITH PHASE 2

**Copilot, please begin by:**
1. Confirming you understand the project
2. Guiding Dhruv to https://make.powerapps.com
3. Helping him create the first table: "Jobs (sga_job)"
4. Continue through all 12 tables
5. Mark Phase 2 as complete in DEPLOYMENT_STATUS.md

**Estimated Time:** 30-45 minutes for Phase 2

---

**Good luck, Copilot! You've got all the information you need. Let's get this deployed! 🚀**
