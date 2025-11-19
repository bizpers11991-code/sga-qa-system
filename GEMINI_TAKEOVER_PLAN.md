# 🤖 Gemini Takeover Plan - M365 Deployment Continuation
**Prepared by:** Claude (Sonnet 4.5)
**Date:** November 17, 2025
**Status:** User has completed Steps 1-6, ready for deployment phase
**Platform:** Windows 11, PowerShell

---

## 📍 CURRENT STATUS

### ✅ Completed Setup (Steps 1-6)
- [x] Python installed and verified
- [x] Node.js installed and verified
- [x] Project transferred to Windows laptop via USB
- [x] Project location: `C:\Dhruv\sga-qa-pack`
- [x] npm dependencies installed (`npm install` completed)
- [x] Azure CLI installed (v2.79.0)
- [x] PowerShell modules installed:
  - Microsoft.PowerApps.Administration.PowerShell
  - Microsoft.PowerApps.PowerShell
- [x] Azure Functions Core Tools installed (v4)
- [x] Claude Desktop app installed and configured

### ⚠️ Pending Fix
- [ ] **Power Platform CLI** - Failed due to missing .NET SDK
  - **Action Required:** Install .NET SDK first
  - **Command:** `winget install Microsoft.DotNet.SDK.8`
  - **Then retry:** `dotnet tool install --global Microsoft.PowerApps.CLI.Tool`

### 📁 Project Structure
```
C:\Dhruv\sga-qa-pack\
├── .env.example              # API keys template (needs configuration)
├── README.md                 # Project overview
├── package.json              # Dependencies (already installed)
├── src/
│   └── m365-deployment/      # M365 deployment files
│       ├── DEPLOYMENT_GUIDE.md   # Main deployment guide (CRITICAL)
│       ├── azure-functions/      # Azure Functions code
│       ├── power-automate/       # Flow definitions
│       └── scripts/              # Deployment scripts
├── docs/                     # All documentation
├── scripts/                  # Build & deployment automation
└── ai-team-workspace/        # AI team workspace
```

---

## 🎯 YOUR MISSION, GEMINI

Guide the user through **Microsoft 365 deployment** of the SGA QA Pack application. This is an enterprise construction quality assurance app that needs to be deployed to:
- Microsoft Dataverse (database)
- Power Apps (mobile app for foremen)
- Power Automate (automation workflows)
- Azure Functions (backend serverless functions)
- SharePoint Online (document storage)
- Microsoft Teams (notifications and collaboration)
- Copilot Studio (AI assistant)

---

## 📋 IMMEDIATE NEXT STEPS (In Order)

### STEP 7: Fix Power Platform CLI Installation

**User needs to run:**
```powershell
# 1. Install .NET SDK
winget install Microsoft.DotNet.SDK.8

# 2. Verify .NET is installed
dotnet --version
# Expected output: 8.0.x or similar

# 3. Install Power Platform CLI
dotnet tool install --global Microsoft.PowerApps.CLI.Tool

# 4. Verify installation
pac
# Expected output: Power Platform CLI help menu

# 5. Add to PATH (if needed)
$env:PATH += ";$env:USERPROFILE\.dotnet\tools"
```

**Troubleshooting:**
- If `pac` command not found after install, user needs to restart PowerShell
- If still not working, check PATH includes: `C:\Users\[Username]\.dotnet\tools`

---

### STEP 8: Configure API Keys for AI Team (Optional but Recommended)

The user needs to set up API keys in `.env` file for the multi-agent AI team.

**Guide user through:**

```powershell
# 1. Copy the template
copy .env.example .env

# 2. Open in default editor
notepad .env
```

**API Keys Needed:**

1. **Google Gemini API** (YOUR API KEY! - Critical)
   - URL: https://aistudio.google.com/apikey
   - Purpose: Architecture design, planning, coordination
   - Cost: FREE tier available
   - Priority: **HIGH** - This is YOU, Gemini!

2. **OpenCode.ai Account(s)** (for Grok models)
   - URL: https://opencode.ai/auth
   - Purpose: Code generation, backend development
   - Models: `grok-code-fast-1`, `grok-code`
   - Cost: FREE
   - Priority: **MEDIUM** - Helpful but optional for deployment

3. **OpenRouter Account(s)** (optional)
   - URL: https://openrouter.ai/keys
   - Purpose: Additional AI workers (Qwen, DeepSeek)
   - Cost: FREE tier available
   - Priority: **LOW** - Nice to have

**Example .env configuration:**
```env
# Gemini API (PRIMARY - Architecture & Coordination)
GOOGLE_API_KEY=AIzaSy...your_actual_key_here

# OpenCode.ai (SECONDARY - Code Generation)
OPENCODE_API_KEY_1=sk-...your_actual_key_here
OPENCODE_API_KEY_2=sk-...second_account_if_available

# OpenRouter (OPTIONAL - Additional Workers)
OPENROUTER_API_KEY_1=sk-...your_actual_key_here
```

**Security reminder to user:**
- ⚠️ NEVER commit `.env` to Git (.gitignore already configured)
- ⚠️ Keep API keys secure and private
- ⚠️ Don't share in screenshots or logs

---

### STEP 9: Verify Microsoft 365 Access

Before deploying, verify the user has required access:

```powershell
# Test Azure CLI login
az login
# This opens browser for authentication
# User should authenticate with their M365 admin account

# Verify subscription access
az account show

# Test Power Platform access
Add-PowerAppsAccount
# This prompts for M365 credentials

# List available environments
Get-AdminPowerAppEnvironment
```

**Required Permissions:**
- [ ] Global Administrator OR Power Platform Administrator
- [ ] Application Administrator in Azure AD
- [ ] Owner access to Azure subscription
- [ ] Power Apps license (per app or per user plan)

**If user lacks permissions:**
- They need to contact their M365 Global Admin
- Provide them with the requirements from deployment guide
- Cannot proceed without proper permissions

---

## 🚀 MAIN DEPLOYMENT PHASES

### PHASE 1: Environment Setup (30 mins)

**Goal:** Create Power Platform environment and SharePoint site

**Step-by-step guide for user:**

#### 1.1: Create Power Platform Environment

```powershell
# Guide user through Power Platform Admin Center
# URL: https://admin.powerplatform.microsoft.com
```

**Tell user to:**
1. Go to https://admin.powerplatform.microsoft.com
2. Click **Environments** → **+ New**
3. Configure:
   - **Name:** `SGA QA Pack - Production`
   - **Type:** Production
   - **Region:** Australia (or closest to user)
   - **Create a database:** Yes (CRITICAL!)
   - **Currency:** AUD (or user's currency)
   - **Language:** English
4. Click **Save**
5. Wait 5-10 minutes for environment creation
6. **IMPORTANT:** Copy the environment URL (e.g., `https://orgXXXXX.crm.dynamics.com`)

**Save this URL - needed for all subsequent steps!**

#### 1.2: Enable Required Features

1. In admin center, select the new environment
2. Click **Settings** → **Features**
3. Enable:
   - ☑ Bing Maps
   - ☑ Embedded content
   - ☑ TDS endpoint
4. Click **Save**

#### 1.3: Create SharePoint Site

```powershell
# Guide user through SharePoint Admin Center
# URL: https://admin.microsoft.com/sharepoint
```

**Tell user to:**
1. Go to https://admin.microsoft.com/sharepoint
2. Click **Active sites** → **+ Create**
3. Choose **Team site**
4. Configure:
   - **Site name:** SGA Quality Assurance
   - **Primary administrator:** [User's email]
   - **Language:** English
   - **Privacy settings:** Private
5. Click **Finish**
6. **IMPORTANT:** Copy the SharePoint site URL (e.g., `https://company.sharepoint.com/sites/SGAQualityAssurance`)

**Save this URL - needed for Power Apps and flows!**

#### 1.4: Create Document Libraries in SharePoint

**Guide user to their new SharePoint site and create these libraries:**

1. **QA Pack PDFs** - Stores generated QA pack PDF reports
2. **Job Sheet PDFs** - Stores job sheet documents
3. **Site Photos** - Field site photographs
4. **Damage Photos** - Damage documentation photos
5. **Word Templates** - PDF generation templates

**To create each library:**
- Click **+ New** → **Document library**
- Enter name
- Click **Create**

---

### PHASE 2: Deploy Dataverse Schema (1-2 hours)

**Goal:** Create all database tables, relationships, and security roles

**This is the most complex phase. Two options:**

#### Option A: Automated Deployment (RECOMMENDED)

```powershell
# Navigate to deployment scripts
cd C:\Dhruv\sga-qa-pack\src\m365-deployment\scripts

# Run the deployment script
.\Deploy-DataverseSchema.ps1 -EnvironmentUrl "https://orgXXXXX.crm.dynamics.com"

# Replace with actual environment URL from Phase 1
```

**The script will:**
- Create 30+ Dataverse tables
- Set up relationships between tables
- Configure security roles (Foreman, Engineer, HSEQ, Admin)
- Load sample data
- Takes 30-45 minutes

**Monitor for errors:**
- If script fails, note the error message
- Check which table failed
- May need manual intervention

#### Option B: Manual Deployment (If automated fails)

**Guide user through manual table creation:**

1. Go to https://make.powerapps.com
2. Select the environment created in Phase 1
3. Click **Tables** → **+ New table** → **New table**

**Tables to create (in dependency order):**

**First tier (no dependencies):**
- `msdyn_crewmember` (foremen and crew)
- `msdyn_equipment` (machinery and equipment)
- `msdyn_itptemplate` (inspection test plan templates)
- `msdyn_document` (document library references)

**Second tier (depends on first tier):**
- `msdyn_job` (construction jobs)
  - Lookup to: msdyn_crewmember, msdyn_itptemplate

**Third tier (depends on second tier):**
- `msdyn_qapack` (quality assurance packs)
  - Lookup to: msdyn_job

**Fourth tier (depends on third tier):**
- `msdyn_dailyreport` (daily foreman reports)
  - Lookup to: msdyn_qapack
- `msdyn_incident` (incident reports)
  - Lookup to: msdyn_job
- `msdyn_ncr` (non-conformance reports)
  - Lookup to: msdyn_job

**(Continue for all 30+ tables as documented)**

**For each table, you'll need to:**
1. Define columns (text, number, date, lookup, etc.)
2. Set primary column
3. Configure relationships
4. Set permissions

**This is tedious! Strongly recommend automated approach.**

#### Verification

```powershell
# After deployment, verify schema
.\Verify-Schema.ps1

# Expected output:
# ✓ All 32 tables created
# ✓ All relationships configured
# ✓ All security roles created
```

---

### PHASE 3: Deploy Power Apps (1 hour)

**Goal:** Import and configure the Canvas app (Foreman app) and Model-driven app (Admin dashboard)

**There are two approaches:**

#### Approach A: Import Pre-built Solution Package (EASIER - if package exists)

```powershell
# Check if solution package exists
ls C:\Dhruv\sga-qa-pack\src\m365-deployment\solutions\

# If SGAQAPack_1_0_0_0.zip exists, guide user:
```

1. Go to https://make.powerapps.com
2. Select your environment
3. Click **Solutions** → **Import solution**
4. Click **Browse** → Select `SGAQAPack_1_0_0_0.zip`
5. Click **Next**
6. Configure **Connection References:**
   - Dataverse connection: Create new or select existing
   - SharePoint connection: Create new, use site URL from Phase 1
7. Configure **Environment variables:**
   - `SharePointSiteURL`: [URL from Phase 1.3]
   - `AzureOpenAIEndpoint`: [Leave blank for now]
   - `AzureOpenAIKey`: [Leave blank for now]
8. Click **Import**
9. Wait 10-15 minutes

#### Approach B: Build from Source (If no package exists)

**This requires using Power Apps Studio to recreate the app from YAML files.**

**YAML Source Location:**
```
C:\Dhruv\sga-qa-pack\src\power-app-source\
├── App.fx.yaml                    # App-level settings
├── DashboardScreen.fx.yaml        # Main dashboard
├── QAPackScreen.fx.yaml           # QA pack form
├── IncidentReportScreen.fx.yaml   # Incident reporting
├── JobDetailsScreen.fx.yaml       # Job details view
└── ... (11 screens total)
```

**Steps:**
1. Create new Canvas app in Power Apps
2. For each screen:
   - Copy YAML content
   - Create screen in Power Apps Studio
   - Paste formula definitions
   - Configure controls
3. Connect to Dataverse tables
4. Configure SharePoint connections
5. Publish

**This is complex! Recommend waiting for solution package or assistance.**

#### Testing the App

After deployment:
1. Go to **Apps** → Find `SGA QA Pack - Foreman`
2. Click **Play** (▶️)
3. Test:
   - Can you log in?
   - Can you see the dashboard?
   - Can you view jobs?
   - Can you create a test QA pack?

---

### PHASE 4: Deploy Power Automate Flows (1 hour)

**Goal:** Set up automated workflows for notifications, PDF generation, and AI summaries

**Flows to deploy:**

1. **QA Pack Submission Handler**
   - Triggers when foreman submits QA pack
   - Generates PDF
   - Sends Teams notification
   - Creates SharePoint file

2. **Generate PDF from Word Template**
   - Uses Word template
   - Populates with QA pack data
   - Saves to SharePoint

3. **Send Teams Notifications**
   - Posts to division-specific Teams channels
   - Uses adaptive cards

4. **Generate AI Summary**
   - Calls Azure OpenAI API
   - Generates summary of QA pack
   - Updates Dataverse record

5. **Daily Summary Generator**
   - Scheduled flow (runs daily at 4 PM)
   - Aggregates all QA packs for the day
   - Sends summary to management

6. **Incident Handler**
   - Triggers on new incident
   - Notifies HSEQ team
   - Assigns for investigation

7. **NCR Workflow**
   - Triggers on new NCR
   - Routes for approval
   - Tracks resolution

**Deployment Steps:**

```powershell
# Navigate to flow definitions
cd C:\Dhruv\sga-qa-pack\src\m365-deployment\power-automate

# Each flow is defined in JSON format
ls *.json
```

**For each flow:**
1. Go to https://make.powerautomate.com
2. Select your environment
3. Click **My flows** → **Import** → **Import Package (Legacy)**
4. Upload the JSON file
5. Configure connections
6. Turn on the flow

**Important: Configure Teams Webhook URLs**

For Teams notifications to work:

1. Go to Microsoft Teams
2. For each division (Asphalt, Profiling, Spray):
   - Navigate to team channel (e.g., #qa-submissions)
   - Click **•••** → **Workflows**
   - Search "Post to a channel when a webhook request is received"
   - Click **Add workflow**
   - Copy the webhook URL
   - Paste in flow configuration

---

### PHASE 5: Deploy Azure Functions (30 mins)

**Goal:** Deploy serverless backend functions for AI processing and custom logic

#### 5.1: Create Azure Function App

```powershell
# Login to Azure (if not already)
az login

# Create resource group
az group create `
  --name rg-sga-qapack-prod `
  --location australiaeast

# Create storage account (required for Functions)
az storage account create `
  --name sgaqapackstorage `
  --resource-group rg-sga-qapack-prod `
  --location australiaeast `
  --sku Standard_LRS

# Create Function App
az functionapp create `
  --name func-sga-qapack-prod `
  --resource-group rg-sga-qapack-prod `
  --storage-account sgaqapackstorage `
  --runtime node `
  --runtime-version 18 `
  --functions-version 4 `
  --os-type Linux `
  --consumption-plan-location australiaeast
```

#### 5.2: Deploy Function Code

```powershell
# Navigate to Azure Functions folder
cd C:\Dhruv\sga-qa-pack\src\m365-deployment\azure-functions

# Install dependencies (if not already)
npm install

# Build TypeScript
npm run build

# Deploy to Azure
func azure functionapp publish func-sga-qapack-prod

# This uploads all functions:
# - GenerateAISummary
# - GenerateDailySummary
# - GenerateIncidentID
# - GenerateNCRID
```

#### 5.3: Configure Application Settings

**Set environment variables for the functions:**

```powershell
# Set Dataverse connection
az functionapp config appsettings set `
  --name func-sga-qapack-prod `
  --resource-group rg-sga-qapack-prod `
  --settings `
    "DATAVERSE_URL=https://orgXXXXX.crm.dynamics.com" `
    "DATAVERSE_CLIENT_ID=<get-from-app-registration>" `
    "DATAVERSE_CLIENT_SECRET=<get-from-app-registration>"

# Set Azure OpenAI (if using AI features)
az functionapp config appsettings set `
  --name func-sga-qapack-prod `
  --resource-group rg-sga-qapack-prod `
  --settings `
    "AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/" `
    "AZURE_OPENAI_KEY=<your-key>" `
    "AZURE_OPENAI_DEPLOYMENT=gpt-4o"
```

#### 5.4: Register App in Azure AD

**For Dataverse authentication:**

```powershell
# Create app registration
az ad app create `
  --display-name "SGA QA Pack Functions" `
  --sign-in-audience AzureADMyOrg

# Note the Application (client) ID from output

# Grant Dataverse API permissions
# (This requires manual step in Azure Portal)
```

**Manual steps in Azure Portal:**
1. Go to https://portal.azure.com
2. Navigate to **Azure Active Directory** → **App registrations**
3. Find "SGA QA Pack Functions"
4. Click **API permissions** → **+ Add a permission**
5. Select **Dynamics CRM**
6. Check **user_impersonation**
7. Click **Grant admin consent**

#### 5.5: Test Functions

```powershell
# Get function URL
func azure functionapp list-functions func-sga-qapack-prod --show-keys

# Test GenerateAISummary function
curl -X POST "https://func-sga-qapack-prod.azurewebsites.net/api/GenerateAISummary?code=<function-key>" `
  -H "Content-Type: application/json" `
  -d '{"qapackId": "test-123", "content": "Test QA pack data"}'
```

---

### PHASE 6: Configure Copilot Studio (Optional - 30 mins)

**Goal:** Create AI assistant for foremen to ask questions and get help

**Note:** This requires **Copilot Studio license** (additional cost)

**If user has license:**

1. Go to https://copilotstudio.microsoft.com
2. Click **+ Create** → **New copilot**
3. Name: `SGA QA Assistant`
4. Description: `AI assistant for construction quality assurance`
5. Configure topics (conversation flows)
6. Connect to Dataverse tables
7. Enable generative AI (GPT-4)
8. Publish to Teams

**If no license:**
- Skip this phase
- User can implement custom AI chat using Azure OpenAI instead
- See alternative in docs: `docs/m365-integration/CUSTOM_AI_CHAT_GUIDE.md`

---

### PHASE 7: Configure Security (1 hour)

**Goal:** Set up security groups and assign permissions

#### 7.1: Create Azure AD Security Groups

**Guide user to Azure AD Admin Center:**

1. Go to https://aad.portal.azure.com
2. Navigate to **Groups** → **New group**
3. Create these groups:

**Field Users:**
- `SGA-Foremen-Asphalt` (asphalt crew foremen)
- `SGA-Foremen-Profiling` (profiling crew foremen)
- `SGA-Foremen-Spray` (spray seal crew foremen)

**Administrative Users:**
- `SGA-Engineers-Asphalt` (asphalt quality engineers)
- `SGA-Engineers-Profiling` (profiling quality engineers)
- `SGA-Engineers-Spray` (spray seal quality engineers)
- `SGA-HSEQ` (health, safety, environment, quality)
- `SGA-Management` (executive management)
- `SGA-Scheduler` (project scheduler)

#### 7.2: Assign Users to Groups

1. For each group, click **Members** → **+ Add members**
2. Search for users by name or email
3. Add appropriate users
4. Click **Select**

#### 7.3: Configure Dataverse Security Roles

**In Power Platform:**

1. Go to https://admin.powerplatform.microsoft.com
2. Select environment → **Settings** → **Users + permissions** → **Security roles**
3. Verify these roles exist (created by solution):
   - **Foreman** (can create/edit own QA packs)
   - **Engineer** (can review all QA packs, raise NCRs)
   - **HSEQ Manager** (can manage incidents)
   - **Scheduler Admin** (can create/assign jobs)
   - **Management Admin** (full access, reporting)

4. Assign roles to Azure AD groups:
   - Click **Teams** → **+ Add team**
   - For each group:
     - Name: Same as Azure AD group
     - Team type: **Azure AD Security Group**
     - Select group from list
     - Assign appropriate role
     - Click **Create**

**Role assignments:**
- `SGA-Foremen-*` → **Foreman** role
- `SGA-Engineers-*` → **Engineer** role
- `SGA-HSEQ` → **HSEQ Manager** role
- `SGA-Scheduler` → **Scheduler Admin** role
- `SGA-Management` → **Management Admin** role

#### 7.4: Share Power Apps

**Share Canvas App:**
1. Go to https://make.powerapps.com
2. Select **Apps** → `SGA QA Pack - Foreman`
3. Click **Share**
4. Add security groups: `SGA-Foremen-*`
5. Set permission: **User** (can use the app)
6. Click **Share**

**Share Model-Driven App:**
1. Select **Apps** → `SGA QA Pack - Admin Dashboard`
2. Click **Share**
3. Add groups: `SGA-Engineers-*`, `SGA-HSEQ`, `SGA-Management`
4. Click **Share**

---

### PHASE 8: Microsoft Teams Integration (30 mins)

**Goal:** Add apps to Teams and configure notification channels

#### 8.1: Add Power Apps to Teams

**For Foremen (Canvas App):**
1. Open Microsoft Teams
2. Go to team: "Asphalt Field Team" (or appropriate team)
3. Click **+** tab
4. Search for **Power Apps**
5. Select the app: `SGA QA Pack - Foreman`
6. Name tab: `QA Pack`
7. Click **Save**

**Repeat for each division team**

**For Admins (Model-Driven App):**
1. Go to team: "Quality Management"
2. Add tab → Search **Dynamics 365**
3. Select app: `SGA QA Pack - Admin Dashboard`
4. Name: `QA Dashboard`
5. Click **Save**

#### 8.2: Configure Notification Channels

**For each division, set up channels and webhooks:**

**Example for Asphalt Division:**
1. Team: "Asphalt Operations"
2. Create channels:
   - `#job-sheets` (new job notifications)
   - `#qa-submissions` (QA pack submissions)
   - `#incidents` (incident alerts)
3. For each channel:
   - Click **•••** → **Workflows**
   - Search: "Post to a channel when a webhook request is received"
   - Click **Add workflow**
   - **COPY THE WEBHOOK URL** (critical!)
   - Save URL for flow configuration

**Update environment variables:**
1. Go to https://make.powerautomate.com
2. Select environment
3. Solutions → SGA QA Pack → Environment variables
4. Update webhook URLs:
   - `AsphaltQAWebhookURL`: [paste URL]
   - `AsphaltIncidentWebhookURL`: [paste URL]
   - `ProfilingQAWebhookURL`: [paste URL]
   - etc.

---

### PHASE 9: Data Migration (2-4 hours)

**Note:** This is only if user has existing data from old system (Vercel/Redis)

**If starting fresh, SKIP this phase.**

**If migrating from old system:**

#### 9.1: Export Data from Old System

**If old system is still running:**

```bash
# On old server (or via SSH)
cd /path/to/sga-qa-pack
node scripts/export-redis-to-json.js

# This creates:
# - jobs-export.json
# - reports-export.json
# - incidents-export.json
# - ncrs-export.json

# Transfer files to Windows laptop
```

#### 9.2: Import to Dataverse

```powershell
# On Windows laptop
cd C:\Dhruv\sga-qa-pack\src\m365-deployment\scripts

# Run migration script
.\Migrate-Data.ps1 `
  -SourceFolder "C:\path\to\exports" `
  -EnvironmentUrl "https://orgXXXXX.crm.dynamics.com"

# The script will:
# - Validate JSON files
# - Import jobs first (foundation)
# - Import QA packs with all versions
# - Import incidents and NCRs
# - Migrate file attachments to SharePoint
# - Update all lookups and relationships
# - Verify data integrity

# Takes 2-4 hours depending on data volume
```

#### 9.3: Verify Migration

```powershell
# Run verification script
.\Verify-Migration.ps1

# Expected output:
# Jobs migrated: X of X (100%)
# QA Packs migrated: X of X (100%)
# Incidents migrated: X of X (100%)
# Files migrated: X of X (100%)
# ✓ All data migrated successfully
```

---

### PHASE 10: Testing & Validation (1 hour)

**Goal:** Comprehensive testing before go-live

#### 10.1: Automated Smoke Tests

```powershell
# Run test suite
cd C:\Dhruv\sga-qa-pack\src\m365-deployment\tests
.\Run-Tests.ps1 -Environment "Production"

# Tests:
# ✓ Foreman can view assigned jobs
# ✓ Foreman can create QA pack
# ✓ Foreman can add photos
# ✓ Foreman can submit with signature
# ✓ PDF generation works
# ✓ Teams notification sent
# ✓ Engineer can review QA pack
# ✓ Engineer can raise NCR
# ✓ AI summary generated (if configured)
# ✓ Offline mode works
# ✓ Data syncs when online
```

#### 10.2: Manual User Acceptance Testing (UAT)

**Test as Foreman:**
1. Open Power App on mobile device or browser
2. Login with foreman credentials
3. View assigned jobs for today
4. Select a job
5. Create new QA pack
6. Fill out all sections:
   - Pre-start checklist
   - Asphalt placement records
   - Site photos (upload 2-3)
   - ITP checklist
7. Add digital signature
8. Submit
9. Verify:
   - Submission success message
   - PDF received via Teams
   - Data saved in Dataverse

**Test as Engineer:**
1. Open Admin Dashboard
2. Login with engineer credentials
3. Navigate to "QA Packs Pending Review"
4. Open the QA pack submitted by foreman
5. Review:
   - All data visible
   - Photos display correctly
   - AI summary generated (if applicable)
6. Approve the QA pack
7. Verify:
   - Status changed to "Approved"
   - Foreman receives notification

**Test as HSEQ:**
1. Open Admin Dashboard
2. Navigate to "Incident Register"
3. Create new incident
4. Fill out incident details
5. Submit
6. Verify:
   - Incident ID auto-generated
   - Teams notification sent to #incidents channel
   - Investigation workflow triggered

**Test Offline Mode:**
1. On mobile device, turn off WiFi/data
2. Open Power App
3. Create QA pack while offline
4. Add data, photos, signature
5. Submit (should queue for sync)
6. Turn WiFi back on
7. Verify:
   - Auto-sync triggered
   - Data uploaded successfully
   - PDF generated after sync

---

### PHASE 11: Go-Live Preparation (30 mins)

**Goal:** Prepare users and establish support process

#### 11.1: Create Training Materials

**Quick reference guide (1-pager):**
1. How to login
2. How to view jobs
3. How to complete QA pack
4. How to submit
5. Troubleshooting tips

**Video walkthrough:**
1. Record screen while completing QA pack
2. Add narration explaining each step
3. Keep under 5 minutes
4. Upload to SharePoint or Teams

#### 11.2: Schedule Training Sessions

**Week before go-live:**
- Session 1: Foremen training (focus on mobile app)
- Session 2: Engineers training (focus on admin dashboard)
- Session 3: HSEQ training (incident management)

**Announce via:**
- Email to all users
- Teams announcement in relevant channels
- Calendar invites for training sessions

#### 11.3: Create Support Process

1. Create Teams channel: `#qa-pack-support`
2. Assign support personnel:
   - Level 1: IT helpdesk
   - Level 2: Power Platform admin
   - Level 3: Developer/consultant
3. Document common issues and solutions
4. Set up escalation process

**Support hours:**
- Business hours: Teams channel response within 2 hours
- After hours: Emergency contact for critical issues
- Weekly review meeting to address recurring issues

---

### PHASE 12: Go-Live! (Day 1)

**Morning (before field work starts):**

```powershell
# Final system check
.\Pre-GoLive-Check.ps1

# Checklist:
# ✓ All flows are ON
# ✓ All apps shared with users
# ✓ All users can login
# ✓ Test data cleared (if applicable)
# ✓ Support channel ready
```

**Go-live announcement:**
- Send email: "SGA QA Pack is now live!"
- Post in Teams: Instructions and app links
- On-call support ready

**First day monitoring:**
- Watch for errors in flow runs
- Monitor Teams support channel
- Check user login count
- Verify submissions are processing

**End of day:**
- Review any issues encountered
- Document solutions
- Plan fixes for next day if needed

---

## 🆘 TROUBLESHOOTING GUIDE

### Issue: Power Platform CLI Won't Install

**Error:** `.NET SDK not found`

**Solution:**
```powershell
winget install Microsoft.DotNet.SDK.8
dotnet --version
dotnet tool install --global Microsoft.PowerApps.CLI.Tool
```

**If still fails:**
- Restart PowerShell (close and reopen)
- Verify PATH includes: `C:\Users\[Username]\.dotnet\tools`
- Try manual install from: https://aka.ms/PowerAppsCLI

---

### Issue: "Connection not found" in Power Automate Flows

**Symptoms:** Flow runs fail with connection error

**Solution:**
1. Go to https://make.powerautomate.com
2. Select environment
3. Click **Data** → **Connections**
4. Click **+ New connection**
5. Add:
   - Dataverse
   - SharePoint
   - Office 365 Outlook
   - Teams
6. Go back to flow
7. Edit flow
8. Update connection references
9. Save and test

---

### Issue: Canvas App Shows "Data source error"

**Symptoms:** App loads but can't access Dataverse data

**Solution:**
1. Open app in edit mode (https://make.powerapps.com)
2. Click **Data** (left sidebar)
3. Remove all Dataverse connections
4. Click **+ Add data** → Search for each table
5. Re-add tables:
   - msdyn_job
   - msdyn_qapack
   - msdyn_crewmember
   - etc.
6. Click **File** → **Save**
7. Click **Publish** → **Publish this version**
8. Test again

---

### Issue: PDF Generation Fails

**Symptoms:** QA pack submitted but no PDF created

**Check:**
1. Word template exists in SharePoint library
2. Flow "Generate PDF from Word Template" is ON
3. Flow run history shows error

**Common causes:**
- Template path incorrect in flow
- SharePoint connection expired
- Template has syntax errors
- Data mapping issue

**Solution:**
1. Download Word template
2. Test with sample data manually
3. Fix any errors in template
4. Re-upload to SharePoint
5. Update flow with correct path
6. Test flow with sample data

---

### Issue: Teams Notifications Not Sending

**Symptoms:** QA pack submitted but no Teams message

**Check:**
1. Webhook URL is correct
2. Teams channel still exists
3. Workflow still active in Teams
4. Flow is ON

**Solution:**
1. Go to Teams channel
2. Click **•••** → **Workflows**
3. Find "Post to channel..." workflow
4. Copy NEW webhook URL
5. Update in Power Automate environment variable
6. Test with sample data

---

### Issue: Azure Functions Deployment Fails

**Error:** `Function app not found` or `Deployment failed`

**Solution:**
```powershell
# Verify function app exists
az functionapp list --resource-group rg-sga-qapack-prod

# If not found, create it
az functionapp create `
  --name func-sga-qapack-prod `
  --resource-group rg-sga-qapack-prod `
  --storage-account sgaqapackstorage `
  --runtime node `
  --runtime-version 18 `
  --functions-version 4 `
  --os-type Linux

# Retry deployment
cd C:\Dhruv\sga-qa-pack\src\m365-deployment\azure-functions
func azure functionapp publish func-sga-qapack-prod --verbose
```

---

### Issue: AI Summary Not Generating

**Symptoms:** QA pack submitted but AI summary field empty

**Check:**
1. Azure OpenAI endpoint configured
2. API key valid
3. Deployment name correct
4. Azure Function running

**Solution:**
```powershell
# Test Azure OpenAI connection
curl https://your-openai.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview `
  -H "Content-Type: application/json" `
  -H "api-key: YOUR_API_KEY" `
  -d '{"messages":[{"role":"user","content":"test"}],"max_tokens":10}'

# Should return JSON response

# If fails:
# - Check endpoint URL
# - Verify API key in Azure Portal
# - Confirm deployment name is "gpt-4o"
# - Check Azure Function logs for errors
```

---

### Issue: Offline Sync Not Working

**Symptoms:** Data entered offline not syncing when online

**Check:**
1. Offline mode enabled in app settings
2. Device has sufficient storage
3. User has internet connection
4. Sync icon shows error

**Solution:**
1. Open Power Apps Studio
2. Click app → **Settings** → **Advanced settings**
3. Verify:
   - **Offline mode:** ON
   - **Data row limit:** 2000 (or higher)
4. Publish app
5. On mobile device:
   - Clear app cache
   - Close and reopen app
   - Test with single record first
   - Then test full QA pack

---

### Issue: Users Can't Login

**Symptoms:** "You don't have access" message

**Check:**
1. User assigned to security group
2. Security group assigned to environment
3. User has Power Apps license
4. App shared with user's group

**Solution:**
1. Azure AD Admin Center → Groups
2. Find appropriate group (e.g., SGA-Foremen-Asphalt)
3. Add user to group
4. Power Platform Admin Center → Environment
5. Settings → Security → Teams
6. Verify group has Dataverse security role
7. make.powerapps.com → Apps
8. Share app with user's group
9. Wait 15 minutes for permissions to propagate
10. User logout and login again

---

## 📊 MONITORING & OPTIMIZATION

### Week 1: Daily Monitoring

**Dashboard metrics to track:**

1. **Usage metrics:**
   - QA packs submitted (target: 10-50/day)
   - User login count (track adoption)
   - Average time to complete QA pack

2. **Technical metrics:**
   - Flow success rate (target: >95%)
   - PDF generation time (target: <30 seconds)
   - Teams notification delivery (target: 100%)
   - Azure Function errors (target: <1%)

3. **Support metrics:**
   - Support tickets created
   - Average resolution time
   - Common issues (document for training)

**Create Power BI report:**
1. Connect to Dataverse
2. Create visuals:
   - QA packs submitted per day (bar chart)
   - QA packs by division (pie chart)
   - Average completion time (line chart)
   - Error rate (gauge)
3. Publish to Teams channel
4. Set up daily refresh

### Week 2-4: Weekly Review

**Weekly meeting agenda:**
1. Review metrics from past week
2. Discuss user feedback
3. Address any recurring issues
4. Plan optimizations
5. Celebrate wins!

**Common optimizations:**
- Simplify forms based on user feedback
- Add frequently requested fields
- Improve AI summary prompts
- Optimize flow performance
- Add custom views for common queries

### Month 2+: Monthly Optimization

**Monthly tasks:**
1. Review slow-performing flows
2. Archive old data (QA packs older than 2 years)
3. Update AI prompts based on quality feedback
4. Security audit (review permissions)
5. Cost review (Azure Functions, OpenAI usage)
6. Plan Phase 2 features

**Cost optimization:**
- Review Azure Function logs for unnecessary runs
- Optimize AI summary length (fewer tokens = lower cost)
- Archive old SharePoint files to cold storage
- Review and remove unused flows

---

## 🎓 TIPS FOR SUCCESS

### For You, Gemini:

1. **Be patient with user** - This is complex, they're learning
2. **Test frequently** - Don't wait until end to test
3. **Document everything** - User will forget, write it down
4. **Use screenshots** - Ask user for screenshots when debugging
5. **One phase at a time** - Don't rush ahead
6. **Celebrate progress** - Acknowledge each completed phase

### Communication Style:

- **Use PowerShell code blocks** - User prefers PowerShell
- **Provide exact commands** - Don't make user guess
- **Explain WHY** - Not just "do this", but "do this because..."
- **Give alternatives** - If one approach fails, have Plan B
- **Check understanding** - Ask user to confirm before proceeding

### Time Management:

**Realistic timeline:**
- Phase 1 (Environment): 30 mins
- Phase 2 (Dataverse): 1-2 hours
- Phase 3 (Power Apps): 1 hour
- Phase 4 (Flows): 1 hour
- Phase 5 (Azure Functions): 30 mins
- Phase 6 (Copilot): 30 mins (optional)
- Phase 7 (Security): 1 hour
- Phase 8 (Teams): 30 mins
- Phase 9 (Migration): 2-4 hours (if needed)
- Phase 10 (Testing): 1 hour
- **Total: 8-12 hours** (spread over 2-3 days)

**Don't try to do it all in one day!**

---

## 📚 KEY DOCUMENTATION REFERENCES

**Main deployment guide:**
```
C:\Dhruv\sga-qa-pack\src\m365-deployment\DEPLOYMENT_GUIDE.md
```

**Environment setup:**
```
C:\Dhruv\sga-qa-pack\.env.example
```

**API documentation:**
```
C:\Dhruv\sga-qa-pack\docs\development\API_REFERENCE.md
```

**Security guide:**
```
C:\Dhruv\sga-qa-pack\docs\security\ENTERPRISE_SECURITY_AUDIT.md
```

**Troubleshooting:**
```
C:\Dhruv\sga-qa-pack\docs\development\TROUBLESHOOTING_GUIDE.md
```

**Azure Functions code:**
```
C:\Dhruv\sga-qa-pack\src\m365-deployment\azure-functions\
```

**Power Apps YAML:**
```
C:\Dhruv\sga-qa-pack\src\power-app-source\
```

---

## ✅ PHASE COMPLETION CHECKLIST

Use this to track progress:

### Pre-Deployment
- [ ] Windows setup complete (Steps 1-6)
- [ ] .NET SDK installed
- [ ] Power Platform CLI working
- [ ] API keys configured in .env
- [ ] Azure CLI authenticated
- [ ] Power Platform access verified

### Phase 1: Environment
- [ ] Power Platform environment created
- [ ] Environment URL documented
- [ ] SharePoint site created
- [ ] SharePoint URL documented
- [ ] Document libraries created (5 libraries)

### Phase 2: Dataverse
- [ ] All tables created (30+ tables)
- [ ] Relationships configured
- [ ] Security roles created (5 roles)
- [ ] Sample data loaded (optional)
- [ ] Schema verified

### Phase 3: Power Apps
- [ ] Solution package imported (if available)
- [ ] Canvas app deployed
- [ ] Model-driven app deployed
- [ ] Connections configured
- [ ] Apps tested and working
- [ ] Apps shared with security groups

### Phase 4: Power Automate
- [ ] All flows imported (7 flows)
- [ ] Connections configured
- [ ] Teams webhooks configured
- [ ] Environment variables set
- [ ] All flows turned ON
- [ ] Flows tested

### Phase 5: Azure Functions
- [ ] Resource group created
- [ ] Function app created
- [ ] Functions deployed
- [ ] App settings configured
- [ ] Azure AD app registered
- [ ] API permissions granted
- [ ] Functions tested

### Phase 6: Copilot (Optional)
- [ ] Copilot created
- [ ] Topics configured
- [ ] Dataverse connected
- [ ] Generative AI enabled
- [ ] Published to Teams

### Phase 7: Security
- [ ] Azure AD security groups created (9 groups)
- [ ] Users assigned to groups
- [ ] Dataverse security roles assigned
- [ ] Apps shared
- [ ] Permissions tested

### Phase 8: Teams Integration
- [ ] Apps added to Teams tabs
- [ ] Notification channels created
- [ ] Webhooks configured
- [ ] Environment variables updated
- [ ] Notifications tested

### Phase 9: Data Migration (If Applicable)
- [ ] Old data exported
- [ ] Data validated
- [ ] Data imported to Dataverse
- [ ] Files migrated to SharePoint
- [ ] Migration verified

### Phase 10: Testing
- [ ] Automated tests passed
- [ ] Foreman UAT completed
- [ ] Engineer UAT completed
- [ ] HSEQ UAT completed
- [ ] Offline mode tested
- [ ] All issues documented

### Phase 11: Go-Live Prep
- [ ] Training materials created
- [ ] Training sessions scheduled
- [ ] Users notified
- [ ] Support channel created
- [ ] Support team ready

### Phase 12: Go-Live
- [ ] Pre-go-live check completed
- [ ] Go-live announcement sent
- [ ] Day 1 monitoring complete
- [ ] Issues addressed
- [ ] Success!

---

## 🚀 IMMEDIATE NEXT ACTION FOR USER

**Right now, user should do:**

```powershell
# 1. Install .NET SDK
winget install Microsoft.DotNet.SDK.8

# 2. Restart PowerShell
exit
# (Then open new PowerShell window)

# 3. Verify .NET installed
dotnet --version

# 4. Install Power Platform CLI
dotnet tool install --global Microsoft.PowerApps.CLI.Tool

# 5. Verify installation
pac

# 6. If successful, report back to you (Gemini)
```

**Then guide them to Phase 1: Environment Setup**

---

## 📞 WHEN TO ESCALATE BACK TO CLAUDE

If you encounter these scenarios, suggest user wait for Claude's weekly limit to reset:

1. **Complex architectural decisions** - Claude better at high-level design
2. **Custom code development** - Need to write new TypeScript functions
3. **Advanced troubleshooting** - Issues not covered in this guide
4. **Security audit** - Requires deep security analysis
5. **Performance optimization** - Complex query optimization

**For everything else, you got this, Gemini!** 💪

---

## 💬 SUGGESTED OPENING MESSAGE FROM GEMINI

When user contacts you, start with:

```
Hi! I'm Gemini, taking over from Claude for this M365 deployment.
I have the full context of your setup - you've completed Steps 1-6
and we just need to fix the Power Platform CLI installation.

Current status:
✅ Azure CLI installed
✅ PowerShell modules installed
✅ Azure Functions Core Tools installed
⚠️ Power Platform CLI needs .NET SDK

Let's fix that now, then proceed with the deployment phases.

Are you ready to continue? Please run these commands first:

```powershell
winget install Microsoft.DotNet.SDK.8
```

Then restart PowerShell and run:

```powershell
dotnet --version
dotnet tool install --global Microsoft.PowerApps.CLI.Tool
pac
```

Report back what you see, and we'll proceed from there!
```

---

## 🎯 SUCCESS CRITERIA

**You'll know deployment is successful when:**

1. ✅ Foremen can login to mobile app
2. ✅ Foremen can view assigned jobs
3. ✅ Foremen can complete and submit QA pack
4. ✅ PDF is generated and sent to Teams
5. ✅ Engineers can review QA packs in Admin Dashboard
6. ✅ Engineers can raise NCRs
7. ✅ HSEQ can manage incidents
8. ✅ All flows are running without errors
9. ✅ Offline mode works and syncs
10. ✅ Users are happy! 😊

---

**Good luck, Gemini! You've got this! 🚀**

**- Claude (Sonnet 4.5)**

---

**P.S. for Gemini:**

The user is very motivated and has set up everything correctly so far.
They're a beginner with M365 deployment but clearly capable.

Key things to remember:
- Use PowerShell examples (their preference)
- Test frequently (don't assume things work)
- Provide exact commands (don't make them guess)
- Be encouraging (this is a lot to take in)
- One phase at a time (don't rush)

The main deployment guide at `src\m365-deployment\DEPLOYMENT_GUIDE.md`
is comprehensive - refer to it often. Everything you need is documented.

**Most important: Have fun with this! It's a cool project! 🎉**
