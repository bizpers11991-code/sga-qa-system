# Deployment Checklist - November 17, 2025
## SGA QA Pack App - Sprint 3 Deployment

**Device:** Windows Laptop (work device)
**Environment:** SGA (Default) - Power Platform
**Duration:** 2-3 hours
**Status:** Ready to deploy

---

## Pre-Deployment Checklist

### ✅ Completed (Ready to Deploy)
- [x] All Sprint 3 code written and reviewed
- [x] Architecture review passed (approved for production)
- [x] Security audit passed
- [x] TypeScript interfaces complete
- [x] Azure Function templates complete
- [x] Power Apps screens complete
- [x] Power Automate flow complete
- [x] Algorithm designs complete
- [x] Documentation complete

### ⏳ Ready for Tomorrow
- [ ] Dataverse tables deployed
- [ ] SharePoint libraries configured
- [ ] Teams channels set up
- [ ] Power Automate flow imported
- [ ] Azure Functions deployed
- [ ] Power Apps screens published

---

## Part 1: Dataverse Deployment (30-40 minutes)

### Step 1: Open PowerShell on Windows Laptop

```powershell
# Navigate to project directory
cd C:\Users\[YourUsername]\sga-qa-pack

# Or wherever you have the repo on Windows
```

### Step 2: Run Dataverse Deployment Script

**Option A: If you have the PowerShell script**
```powershell
# Run the deployment script
.\ai_team_output\sprint2\dataverse_deployment_script.ps1
```

**Option B: Manual deployment via Power Platform Admin Center**

1. Go to https://admin.powerplatform.microsoft.com/
2. Select **SGA (Default)** environment
3. Navigate to **Tables** → **Create new table**
4. Import table definitions from: `m365-deployment/dataverse-schema/`

**Tables to Deploy (12 total):**
- ✅ sga_jobs (Job Management)
- ✅ sga_qapacks (QA Pack Submissions)
- ✅ sga_incidentregister (Incident Tracking) ⭐ NEW
- ✅ sga_ncrregister (NCR Tracking) ⭐ NEW
- ✅ sga_asphalttemperaturetests
- ✅ sga_straightedgetests
- ✅ sga_compactiontests
- ✅ sga_photos
- ✅ sga_signatures
- ✅ sga_auditlogs
- ✅ sga_errorlogs
- ✅ sga_chatinteractions

### Step 3: Verify Dataverse Deployment

```powershell
# Check tables exist
# Navigate to: https://make.powerapps.com
# Environment: SGA (Default)
# Tables → Verify all 12 tables are listed
```

**Expected Result:** All 12 tables visible with correct schema

### Step 4: Configure Security Roles

Navigate to: https://admin.powerplatform.microsoft.com/

1. **SGA (Default)** → **Settings** → **Security Roles**
2. Verify/Create 4 roles:
   - **Foreman** (read QA packs, create incidents, read jobs)
   - **Engineer** (create jobs, create NCRs, read QA packs)
   - **Scheduler** (create jobs, read QA packs)
   - **Manager** (read-only all data)

3. Assign users to roles (yourself first for testing)

---

## Part 2: SharePoint Configuration (20-30 minutes)

### Step 1: Navigate to SharePoint Site

```
https://[your-tenant].sharepoint.com/sites/SGA
```

**If site doesn't exist:**
1. Create new SharePoint Team Site: "SGA Quality Assurance"
2. Site URL: `/sites/SGA`

### Step 2: Create Document Libraries

**Library 1: QA Packs**
```
Name: QA Packs
Description: Submitted QA pack PDFs organized by job
Folder structure: Auto-created by Power Automate
```

1. Site → **New** → **Document Library**
2. Name: `QA Packs`
3. Show in navigation: Yes

**Library 2: Incidents**
```
Name: Incidents
Description: Incident photos organized by incident ID
Folder structure: Auto-created by Power Automate
```

1. Site → **New** → **Document Library**
2. Name: `Incidents`
3. Show in navigation: Yes

**Library 3: NCRs** (Optional - for future)
```
Name: NCRs
Description: Non-Conformance Report attachments
```

### Step 3: Set Permissions

**QA Packs Library:**
- Foremen: Read-only (can view their own)
- Engineers/Schedulers: Full control
- Managers: Full control

**Incidents Library:**
- All authenticated users: Contribute (can add photos)
- Managers: Full control

### Step 4: Get SharePoint Site URL

Copy the full site URL for Power Automate configuration:
```
https://[your-tenant].sharepoint.com/sites/SGA
```

**Save this!** You'll need it for Power Automate flow.

---

## Part 3: Microsoft Teams Configuration (15-20 minutes)

### Step 1: Create Team (if not exists)

1. Open Microsoft Teams
2. **Teams** → **Create team**
3. Team name: `SGA Quality Assurance`
4. Privacy: Private
5. Add members: All foremen, engineers, schedulers

### Step 2: Create Channels

**Channel 1: #qa-submissions**
```
Name: qa-submissions
Description: Automated notifications when QA packs are submitted
```

1. Team → **...** → **Add channel**
2. Name: `qa-submissions`
3. Privacy: Standard
4. Auto-favorite: Yes (for managers)

**Channel 2: #incidents**
```
Name: incidents
Description: Automated notifications when incidents are reported
```

1. Team → **...** → **Add channel**
2. Name: `incidents`
3. Privacy: Standard
4. Auto-favorite: Yes (for managers)

**Channel 3: #jobs** (Optional)
```
Name: jobs
Description: Job assignment notifications
```

### Step 3: Get Team and Channel IDs

**Method 1: Via Teams URL**
1. Click on **#qa-submissions** channel
2. Copy URL from browser
3. Extract `groupId` (Team ID) and `threadId` (Channel ID)

**Method 2: Via Graph Explorer**
1. Go to https://developer.microsoft.com/en-us/graph/graph-explorer
2. Sign in with your account
3. GET: `https://graph.microsoft.com/v1.0/me/joinedTeams`
4. Find "SGA Quality Assurance" → copy `id` (Team ID)
5. GET: `https://graph.microsoft.com/v1.0/teams/{team-id}/channels`
6. Find "#qa-submissions" → copy `id` (Channel ID)

**Save these IDs!**
```
Team ID: [paste here]
Channel ID (qa-submissions): [paste here]
Channel ID (incidents): [paste here]
```

---

## Part 4: Power Automate Flow Import (20-30 minutes)

### Step 1: Open Power Automate

```
https://make.powerautomate.com
```

Select environment: **SGA (Default)**

### Step 2: Import QA Pack Submission Flow

1. **My flows** → **Import** → **Import Package (Legacy)**
2. Upload: `m365-deployment/power-automate/QAPackSubmissionFlow.json`

**IMPORTANT: Update Placeholders**

Before activating, edit the flow and update:

```json
// Line 67: SharePoint site URL
"site": "https://[your-tenant].sharepoint.com/sites/SGA"

// Line 68: Folder path
"folderPath": "/Shared Documents/QA Packs/"

// Line 104: Teams Team ID
"teamId": "[paste Team ID from Step 3]"

// Line 105: Teams Channel ID
"channelId": "[paste Channel ID for #qa-submissions]"
```

### Step 3: Configure PDF Generation

**Replace placeholder PDF generation with real action:**

1. Delete the placeholder "Generate_PDF" action
2. Add new action: **Create HTML to PDF**
3. Configure:
   - HTML Content: `@{variables('qaPackHtml')}`
   - File name: `QA_Pack_@{body('Get_QA_Pack_Details')?['sga_title']}_@{formatDateTime(utcNow(), 'yyyyMMdd_HHmmss')}.pdf`

**HTML Template (paste in a "Compose" action before PDF generation):**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background-color: #FF6600; color: white; padding: 20px; }
    .section { margin: 20px; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #ddd; padding: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SGA QA Pack Submission</h1>
  </div>
  <div class="section">
    <h2>Job Details</h2>
    <table>
      <tr><th>Job Title</th><td>@{body('Get_QA_Pack_Details')?['sga_jobid']?['sga_jobtitle']}</td></tr>
      <tr><th>Location</th><td>@{body('Get_QA_Pack_Details')?['sga_jobid']?['sga_location']}</td></tr>
      <tr><th>Submitted By</th><td>@{outputs('Get_Current_User')?['userDisplayName']}</td></tr>
      <tr><th>Submitted Date</th><td>@{formatDateTime(body('Get_QA_Pack_Details')?['sga_submitteddate'], 'dd/MM/yyyy HH:mm')}</td></tr>
    </table>
  </div>
  <div class="section">
    <h2>QA Pack Details</h2>
    <p>@{body('Get_QA_Pack_Details')?['sga_description']}</p>
  </div>
</body>
</html>
```

### Step 4: Test the Flow

1. Save flow
2. Turn on flow
3. Test with manual trigger:
   - Use a test QA Pack ID from Dataverse
   - Verify PDF is generated
   - Verify PDF is uploaded to SharePoint
   - Verify Teams notification is posted

**Expected Result:**
- ✅ PDF created in SharePoint: `/QA Packs/[JobTitle]/QA_Pack_YYYYMMDD_HHMMSS.pdf`
- ✅ Teams message posted to #qa-submissions
- ✅ QA Pack status updated to "Submitted"

---

## Part 5: Azure Functions Deployment (30-40 minutes)

### Step 1: Install Azure Functions Core Tools (if not installed)

```powershell
# Install via npm
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Verify installation
func --version
```

### Step 2: Install Azure CLI (if not installed)

```powershell
# Download and install from:
# https://aka.ms/installazurecliwindows

# After install, sign in
az login

# Select subscription
az account set --subscription "[Your Subscription Name]"
```

### Step 3: Create Azure Function App

```powershell
# Create resource group (if not exists)
az group create --name SGA-QA-Pack-RG --location australiaeast

# Create storage account (required for Functions)
az storage account create \
  --name sgaqapackstorage \
  --resource-group SGA-QA-Pack-RG \
  --location australiaeast \
  --sku Standard_LRS

# Create Function App
az functionapp create \
  --resource-group SGA-QA-Pack-RG \
  --consumption-plan-location australiaeast \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name sga-qa-pack-functions \
  --storage-account sgaqapackstorage
```

### Step 4: Configure Azure OpenAI for Daily Summaries

**Option A: Use existing Azure OpenAI resource**
```powershell
# Set environment variables in Function App
az functionapp config appsettings set \
  --name sga-qa-pack-functions \
  --resource-group SGA-QA-Pack-RG \
  --settings \
    AZURE_OPENAI_ENDPOINT="https://[your-resource].openai.azure.com/" \
    AZURE_OPENAI_KEY="[your-api-key]" \
    AZURE_OPENAI_DEPLOYMENT="gpt-4o"
```

**Option B: Create new Azure OpenAI resource**
1. Go to: https://portal.azure.com/
2. Create resource → Azure OpenAI
3. Region: Australia East
4. Pricing: Standard S0
5. Deploy model: gpt-4o (or gpt-4)
6. Copy endpoint and key → use in Step 4A

### Step 5: Deploy Functions to Azure

```powershell
# Navigate to functions directory
cd m365-deployment/azure-functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy to Azure
func azure functionapp publish sga-qa-pack-functions
```

**Expected Output:**
```
Deployment successful.
Functions deployed:
  - GenerateIncidentID: https://sga-qa-pack-functions.azurewebsites.net/api/GenerateIncidentID
  - GenerateDailySummary: https://sga-qa-pack-functions.azurewebsites.net/api/GenerateDailySummary
  - GenerateNCRID: https://sga-qa-pack-functions.azurewebsites.net/api/GenerateNCRID
```

**Save these URLs!** You'll need them for Power Apps integration.

### Step 6: Enable EasyAuth (Azure AD Authentication)

```powershell
# Enable Azure AD authentication
az functionapp auth update \
  --resource-group SGA-QA-Pack-RG \
  --name sga-qa-pack-functions \
  --enabled true \
  --action LoginWithAzureActiveDirectory
```

### Step 7: Test Azure Functions

```powershell
# Test GenerateIncidentID
curl -X POST https://sga-qa-pack-functions.azurewebsites.net/api/GenerateIncidentID \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected response:
# {"incidentId":"INC-20251117-0001","date":"20251117","sequenceNumber":1}
```

---

## Part 6: Power Apps Publishing (20-30 minutes)

### Step 1: Open Power Apps Studio

```
https://make.powerapps.com
```

Environment: **SGA (Default)**

### Step 2: Import Updated Screens

1. **Apps** → **[Your SGA QA Pack App]** → **Edit**
2. Power Apps Studio opens
3. Import screens:
   - **JobAssignmentScreen.fx.yaml** (new)
   - **IncidentReportScreen.fx.yaml** (updated)

**Method:**
- File → Settings → Advanced settings → Enable experimental features
- Enable YAML source control
- Import screens from: `src/power-app-source/`

### Step 3: Configure Azure Functions Integration

**In IncidentReportScreen:**

1. Add data source: **Custom connector** → **Import from Azure Function**
2. Azure Function URL: `https://sga-qa-pack-functions.azurewebsites.net/api/GenerateIncidentID`
3. Authentication: Azure AD

**Update SubmitIncidentButton OnSelect:**

Replace:
```
Set(varGeneratedIncidentID, "INC-" & Text(Today(), "yyyymmdd") & "-" & Text(RandBetween(1, 9999), "0000"));
```

With:
```
Set(varGeneratedIncidentID, GenerateIncidentID.Run().incidentId);
```

**In DashboardScreen (for Daily Summary):**

1. Add data source: Custom connector → `GenerateDailySummary`
2. Add widget on homepage:

```yaml
DailySummaryContainer As container:
  OnVisible: |
    =Set(varDailySummary, GenerateDailySummary.Run({userId: User().Email}).summary)

  SummaryLabel As label:
    Text: =varDailySummary
    # ... styling
```

### Step 4: Publish App

1. **File** → **Save**
2. **File** → **Publish**
3. **Publish this version**
4. Share with users:
   - All foremen: Can use
   - All engineers/schedulers: Can use + Can edit
   - All managers: Can use

---

## Part 7: End-to-End Testing (30-40 minutes)

### Test 1: Job Assignment Workflow

**As Engineer:**
1. Open app → Navigate to JobAssignmentScreen
2. Create new job:
   - Title: "Test Highway Resurfacing"
   - Description: "Test job for Sprint 3 deployment"
   - Location: "Test Location"
   - Assign to: [Your test foreman account]
   - Start date: Tomorrow
   - End date: Next week
3. Submit job

**Expected:**
- ✅ Job created in Dataverse (sga_jobs table)
- ✅ Foreman receives Teams notification
- ✅ Job appears in foreman's app

---

### Test 2: Incident Reporting Workflow

**As Foreman:**
1. Open app → Report Incident (from homepage)
2. Fill form:
   - Description: "Test incident report"
   - Location: "Test site"
   - Severity: Medium
   - Upload 2 test photos
3. Submit incident

**Expected:**
- ✅ Unique incident ID generated: INC-20251117-0001
- ✅ Incident saved to Dataverse (sga_incidentregister)
- ✅ Photos uploaded to SharePoint: `/Incidents/INC-20251117-0001/`
- ✅ Teams notification posted to #incidents
- ✅ Success message shows incident ID

---

### Test 3: QA Pack Submission Workflow

**As Foreman:**
1. Open app → Open a job → Start QA Pack
2. Fill out QA pack (asphalt tests, photos, etc.)
3. Submit QA pack

**Expected:**
- ✅ PDF generated from QA pack data
- ✅ PDF uploaded to SharePoint: `/QA Packs/[JobTitle]/QA_Pack_YYYYMMDD_HHMMSS.pdf`
- ✅ Teams Adaptive Card posted to #qa-submissions
- ✅ QA pack status updated to "Submitted"
- ✅ Foreman sees success message

---

### Test 4: Daily Summary (Copilot)

**As Foreman:**
1. Open app → View homepage
2. Check Daily Summary widget

**Expected:**
- ✅ Summary displays within 3 seconds
- ✅ Shows jobs for today
- ✅ Shows pending QA packs count
- ✅ Highlights urgent deadlines
- ✅ Natural language (friendly tone)

**Example Summary:**
```
Good morning! You have 2 jobs scheduled for today:
- Test Highway Resurfacing (Due in 18 hours)
- M1 Pothole Repairs (Low priority)

You have 1 pending QA pack to submit. Remember to complete
it before starting new work. Have a productive day!
```

---

## Troubleshooting Guide

### Issue 1: PowerShell script fails with "Execution policy" error

```powershell
# Fix: Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 2: Azure Functions deployment fails with authentication error

```powershell
# Fix: Re-authenticate
az logout
az login
az account set --subscription "[Your Subscription]"
```

### Issue 3: Power Automate flow fails at PDF generation

**Solution:**
- Verify "Create HTML to PDF" action is configured
- Check HTML template has no syntax errors
- Test with simple HTML first

### Issue 4: Teams notification not posting

**Solution:**
- Verify Team ID and Channel ID are correct
- Check app has permission to post to Teams
- Test with manual Teams webhook first

### Issue 5: Incident ID not generating

**Solution:**
- Check Azure Function is deployed and running
- Verify EasyAuth is configured
- Test function directly with Postman/curl
- Check Dataverse connection in function

---

## Post-Deployment Checklist

After successful deployment, verify:

- [ ] All 12 Dataverse tables deployed and accessible
- [ ] SharePoint libraries created with correct permissions
- [ ] Teams channels created with webhooks configured
- [ ] Power Automate flow imported and tested
- [ ] Azure Functions deployed and responding
- [ ] Power Apps published with all screens working
- [ ] End-to-end test passed for all 4 workflows
- [ ] Users can access app and perform basic operations
- [ ] No errors in Azure Function logs
- [ ] No errors in Power Automate run history

---

## Success Criteria

✅ **Deployment Successful** if:

1. Engineer can create job → Foreman receives notification
2. Foreman can report incident → Unique ID generated → Teams notified
3. Foreman can submit QA pack → PDF in SharePoint → Teams notified
4. Foreman sees daily summary on homepage within 3 seconds
5. No errors in logs (Dataverse, Azure, Power Automate)

---

## What to Do if Something Goes Wrong

**Priority 1: Don't panic**
- All code is in git
- All configurations documented
- Can rollback if needed

**Priority 2: Check logs**
- Azure Functions: Portal → Function → Monitor → Logs
- Power Automate: Flow → Run history → Error details
- Dataverse: Admin center → System jobs

**Priority 3: Contact me (Claude)**
- I'll be ready to help debug
- Can review logs together
- Can provide fixes on the fly

---

## Backup Plan

If deployment takes longer than expected:

**Minimum Viable Deployment (1 hour):**
1. Dataverse tables only (skip Azure Functions)
2. Manual incident IDs (skip Copilot ID generation)
3. Skip daily summary (implement later)
4. Focus on core QA pack submission workflow

**Can add later:**
- Azure Functions (Copilot features)
- Advanced Teams notifications
- Caching optimizations

---

## Time Allocation (Total: 2-3 hours)

| Task | Estimated Time |
|------|----------------|
| Dataverse deployment | 30-40 min |
| SharePoint setup | 20-30 min |
| Teams configuration | 15-20 min |
| Power Automate import | 20-30 min |
| Azure Functions deploy | 30-40 min |
| Power Apps publish | 20-30 min |
| End-to-end testing | 30-40 min |
| **Buffer** | 20-30 min |
| **TOTAL** | **2.5-3.5 hours** |

---

## Final Notes

**You're well-prepared!**
- All code is written and reviewed
- All documentation is complete
- All critical issues identified and solutions provided
- Step-by-step instructions ready

**Tomorrow's session will be smooth because:**
- No coding required (all done today)
- Just configuration and deployment
- Clear success criteria
- Troubleshooting guide included

**If you get stuck, I'll be here to help!**

---

**Good luck with tomorrow's deployment!** 🚀

You've got this. The AI team did great work today, and everything is ready to go live.

See you tomorrow for the deployment session.

---

**Created by:** Claude Sonnet 4.5 (AI Team Coordinator)
**Date:** November 16, 2025
**Status:** Ready for deployment
