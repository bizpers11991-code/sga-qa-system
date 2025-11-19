# SGA QA Pack - Complete M365 Deployment Guide

## 🚀 DEPLOYMENT OVERVIEW

This guide provides step-by-step instructions to deploy the complete SGA QA Pack system to Microsoft 365. Total deployment time: **4-6 hours** for a skilled admin.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Microsoft 365 Requirements

✅ **Licenses Required:**
- Microsoft 365 E3 or E5 (for base M365 services)
- Power Apps per app plan ($20/user/month) OR Power Apps per user plan ($40/user/month)
- Azure subscription (for Azure Functions - pay-as-you-go is fine)

✅ **Permissions Required:**
- **Global Administrator** or **Power Platform Administrator** role
- **Application Administrator** in Azure AD
- **Owner** access to Azure subscription

✅ **Services to Enable:**
- Power Apps
- Power Automate
- Dataverse
- Azure OpenAI Service (or access to Copilot)
- SharePoint Online
- Microsoft Teams

### 2. Required Software

Install these on your deployment machine:

```powershell
# Install PowerShell 7 (if not already installed)
winget install Microsoft.PowerShell

# Install Power Platform CLI
dotnet tool install --global Microsoft.PowerApps.CLI.Tool

# Install Azure CLI
winget install Microsoft.AzureCLI

# Install Power Platform Build Tools
Install-Module -Name Microsoft.PowerApps.Administration.PowerShell -Force
Install-Module -Name Microsoft.PowerApps.PowerShell -AllowClobber -Force
Install-Module -Name Microsoft.Xrm.Data.PowerShell -Force
Install-Module -Name Microsoft.Xrm.Tooling.CrmConnector.PowerShell -Force

# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

### 3. Prepare Deployment Files

Download/clone the deployment package:
```bash
git clone <repository-url>
cd sga-qa-pack/m365-deployment
```

---

## 🏗️ DEPLOYMENT STEPS

### PHASE 1: Environment Setup (30 mins)

#### Step 1.1: Create Power Platform Environment

1. Go to [Power Platform Admin Center](https://admin.powerplatform.microsoft.com)
2. Click **Environments** → **+ New**
3. Configure:
   - **Name:** `SGA QA Pack - Production`
   - **Type:** Production
   - **Region:** Australia (or closest)
   - **Create a database:** Yes
   - **Currency:** AUD
   - **Language:** English
   - **Security group:** Leave blank for now (we'll configure later)
4. Click **Save**
5. Wait 5-10 minutes for environment creation

#### Step 1.2: Enable Required Features

1. In admin center, select your new environment
2. Click **Settings** → **Features**
3. Enable:
   - ☑ Bing Maps (for location features)
   - ☑ Embedded content (for Power BI)
   - ☑ TDS endpoint (for external connections)
4. Click **Save**

#### Step 1.3: Create SharePoint Site

1. Go to [SharePoint Admin Center](https://admin.microsoft.com/sharepoint)
2. Click **Active sites** → **+ Create**
3. Choose **Team site**
4. Configure:
   - **Site name:** SGA Quality Assurance
   - **Primary administrator:** Add yourself
   - **Language:** English
   - **Privacy settings:** Private
5. Click **Finish**
6. Note the site URL (e.g., `https://yourcompany.sharepoint.com/sites/SGAQualityAssurance`)

#### Step 1.4: Create Document Libraries

In your new SharePoint site:
1. Create library: **QA Pack PDFs**
2. Create library: **Job Sheet PDFs**
3. Create library: **Site Photos**
4. Create library: **Damage Photos**
5. Create library: **Word Templates**

---

### PHASE 2: Deploy Dataverse Schema (1-2 hours)

#### Option A: Automated Deployment (Recommended)

Run the PowerShell script:

```powershell
# Navigate to deployment folder
cd m365-deployment/scripts

# Connect to your environment
.\Connect-Environment.ps1

# Deploy Dataverse schema
.\Deploy-DataverseSchema.ps1 -EnvironmentUrl "https://yourorg.crm.dynamics.com"

# This script will:
# - Create all 30+ tables
# - Set up relationships
# - Configure security roles
# - Create sample data
# - Estimated time: 30-45 minutes
```

#### Option B: Manual Deployment

If automated script fails, use the manual approach:

1. Open [Power Apps](https://make.powerapps.com)
2. Select your environment
3. Click **Tables** → **+ New table**
4. For each table in `/m365-deployment/dataverse-schema/`:
   - Import the JSON definition
   - Create columns
   - Configure relationships
5. See detailed table creation in `02_DATAVERSE_SCHEMA_PART2.md`

**Tables to create (in this order):**
1. msdyn_crewmember (no dependencies)
2. msdyn_equipment (no dependencies)
3. msdyn_itptemplate (no dependencies)
4. msdyn_document (no dependencies)
5. msdyn_job (references crewmember, itptemplate)
6. msdyn_qapack (references job)
7. msdyn_dailyreport (references qapack)
8. msdyn_dailyreportwork (references dailyreport)
9. msdyn_dailyreportlabour (references dailyreport)
10. ... (continue for all 30+ tables)

#### Step 2.1: Verify Schema Deployment

```powershell
# Run verification script
.\Verify-Schema.ps1

# Expected output:
# ✓ All 32 tables created
# ✓ All relationships configured
# ✓ All security roles created
# ✓ Sample data loaded
```

---

### PHASE 3: Deploy Power Apps (1 hour)

#### Step 3.1: Import Solution Package

1. Download the solution ZIP: `SGAQAPack_1_0_0_0.zip`
2. Go to [Power Apps](https://make.powerapps.com)
3. Select your environment
4. Click **Solutions** → **Import solution**
5. Click **Browse** → Select the ZIP file
6. Click **Next**
7. **Connection References:** Configure connections:
   - Dataverse connection: Create new or select existing
   - SharePoint connection: Create new, use site URL
   - Azure OpenAI: Create new (or skip if using Copilot)
8. **Environment variables:** Set values:
   - `SharePointSiteURL`: Your SharePoint site URL
   - `AzureOpenAIEndpoint`: Your Azure OpenAI endpoint
   - `AzureOpenAIKey`: Your API key
9. Click **Import**
10. Wait 10-15 minutes for import to complete

#### Step 3.2: Configure Canvas App (Foreman App)

After import completes:

1. Go to **Apps** → Find `SGA QA Pack - Foreman`
2. Click **Edit**
3. When it opens in Power Apps Studio:
   - Click **Data** → Verify all connections are working
   - Click **Settings** → **Advanced settings**
     - Enable **Offline mode**
     - Set **Data row limit** to 2000
   - Click **File** → **Save**
   - Click **Publish** → **Publish this version**

4. Test the app:
   - Click **Play** (▶️)
   - Sign in with your test foreman account
   - Verify you see the dashboard
   - Try creating a test QA pack

5. Share the app:
   - Click **Share**
   - Add security group: `SGA-Foremen`
   - Set permissions: **User (can use the app)**
   - Click **Share**

#### Step 3.3: Configure Model-Driven App (Admin Dashboard)

1. Go to **Apps** → Find `SGA QA Pack - Admin Dashboard`
2. Click **Edit** (opens in modern app designer)
3. Verify:
   - All tables are present in sitemap
   - Forms are configured
   - Views are correct
4. Click **Save** → **Publish**

5. Test the app:
   - Click **Play**
   - Navigate through all menu items
   - Verify forms open correctly

6. Share the app:
   - Click **Share**
   - Add security groups:
     - SGA-Engineers-Asphalt
     - SGA-Engineers-Profiling
     - SGA-HSEQ
     - SGA-Management
   - Click **Share**

---

### PHASE 4: Deploy Power Automate Flows (1 hour)

The solution package includes all flows, but they need to be activated:

#### Step 4.1: Configure Flow Connections

1. Go to **Solutions** → **SGA QA Pack**
2. Click **Cloud flows**
3. For each flow, configure connections:

**Flow 1: QA Pack Submission Handler**
- Turn on the flow
- Edit → Configure trigger connection
- Test with sample data

**Flow 2: Generate PDF from Word Template**
- Upload Word templates to SharePoint
- Configure template paths in flow
- Test PDF generation

**Flow 3: Send Teams Notifications**
- Get Teams webhook URLs:
  1. Go to desired Teams channel
  2. Click **•••** → **Workflows**
  3. Search "Post to a channel when a webhook request is received"
  4. Copy webhook URL
  5. Paste in flow configuration
- Configure for each division channel

**Flow 4: Generate AI Summary (Azure OpenAI)**
- Configure Azure OpenAI connection
- Set deployment name
- Set system prompt
- Test with sample QA pack

**Flow 5: Daily Summary Generator (Scheduled)**
- Set schedule: Daily at 4 PM Perth time
- Configure timezone: `(UTC+08:00) Perth`
- Activate flow

**Flow 6: Incident Handler**
- Configure HSEQ Teams channel webhook
- Set up email notifications

**Flow 7: NCR Workflow**
- Configure approval flow
- Set up notification recipients

#### Step 4.2: Activate All Flows

```powershell
# Run activation script
.\Activate-Flows.ps1

# This will:
# - Turn on all flows
# - Verify connections
# - Run test executions
```

---

### PHASE 5: Deploy Azure Functions (30 mins)

#### Step 5.1: Create Azure Function App

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **+ Create a resource** → **Function App**
3. Configure:
   - **Resource Group:** Create new: `rg-sga-qapack-prod`
   - **Function App name:** `func-sga-qapack-prod`
   - **Publish:** Code
   - **Runtime stack:** Node.js
   - **Version:** 18 LTS
   - **Region:** Australia East
   - **Operating System:** Linux
   - **Plan type:** Consumption (Serverless)
4. Click **Review + create** → **Create**

#### Step 5.2: Deploy Function Code

```bash
# Navigate to Azure Functions folder
cd m365-deployment/azure-functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy to Azure
func azure functionapp publish func-sga-qapack-prod

# Configure app settings
az functionapp config appsettings set \
  --name func-sga-qapack-prod \
  --resource-group rg-sga-qapack-prod \
  --settings \
    "DATAVERSE_URL=https://yourorg.crm.dynamics.com" \
    "DATAVERSE_CLIENT_ID=<your-client-id>" \
    "DATAVERSE_CLIENT_SECRET=<your-client-secret>" \
    "AZURE_OPENAI_ENDPOINT=<your-endpoint>" \
    "AZURE_OPENAI_KEY=<your-key>"
```

#### Step 5.3: Configure API Permissions

1. Register app in Azure AD:
```bash
az ad app create \
  --display-name "SGA QA Pack Functions" \
  --sign-in-audience AzureADMyOrg
```

2. Grant Dataverse API permissions:
   - Go to Azure AD → App registrations
   - Find your app
   - API permissions → Add permission → Dynamics CRM
   - Add: `user_impersonation`
   - Grant admin consent

---

### PHASE 6: Deploy Copilot Agent (Optional - 30 mins)

#### Step 6.1: Create Copilot Agent

1. Go to [Copilot Studio](https://copilotstudio.microsoft.com)
2. Click **+ Create** → **New copilot**
3. Name: `SGA QA Assistant`
4. Description: `AI assistant for construction quality assurance`

#### Step 6.2: Configure Topics

Import topic definitions from `/m365-deployment/copilot/topics/`

**Main Topics:**
1. Report Status Inquiry
2. Quality Insights
3. Create Job
4. Risk Analysis
5. Compliance Check

#### Step 6.3: Connect to Dataverse

1. In Copilot Studio, click **Settings** → **Data**
2. Add connection: Dataverse
3. Select tables:
   - msdyn_qapack
   - msdyn_job
   - msdyn_ncr
   - msdyn_incident

#### Step 6.4: Configure Generative AI

1. Settings → **Generative AI**
2. Enable: **Generative answers**
3. Model: GPT-4
4. System message: (use prompt from `/copilot/system-prompt.txt`)
5. Temperature: 0.3

#### Step 6.5: Publish to Teams

1. Click **Publish** → **Microsoft Teams**
2. Configure:
   - App name: SGA QA Assistant
   - Short description: Quality assurance AI assistant
   - Icon: Upload SGA logo
3. Submit to Teams app catalog
4. Install in your Teams tenant

---

### PHASE 7: Configure Security (1 hour)

#### Step 7.1: Create Security Groups in Azure AD

```powershell
# Run security setup script
.\Setup-Security.ps1

# This creates:
# - SGA-Foremen-Asphalt
# - SGA-Foremen-Profiling
# - SGA-Foremen-Spray
# - SGA-Engineers-Asphalt
# - SGA-Engineers-Profiling
# - SGA-Engineers-Spray
# - SGA-HSEQ
# - SGA-Management
# - SGA-Scheduler
```

#### Step 7.2: Assign Users to Groups

1. Go to [Azure AD Admin Center](https://aad.portal.azure.com)
2. Navigate to **Groups**
3. For each group, click → **Members** → **+ Add members**
4. Add appropriate users

#### Step 7.3: Configure Dataverse Security Roles

1. Go to [Power Platform Admin Center](https://admin.powerplatform.microsoft.com)
2. Select environment → **Settings** → **Users + permissions** → **Security roles**
3. Verify these roles exist (created by solution):
   - Foreman
   - Engineer
   - HSEQ Manager
   - Scheduler Admin
   - Management Admin

4. Assign roles to teams:
   - Click **Teams** → **+ Add team**
   - Name: `SGA Foremen - Asphalt`
   - Team type: Azure AD Security Group
   - Select group: `SGA-Foremen-Asphalt`
   - Assign role: `Foreman`
   - Repeat for all groups

---

### PHASE 8: Configure Microsoft Teams Integration (30 mins)

#### Step 8.1: Add Apps to Teams

**For Foremen (Canvas App):**
1. Open Microsoft Teams
2. Go to the desired team (e.g., "Asphalt Field Team")
3. Click **+** to add a tab
4. Search for **Power Apps**
5. Select the Canvas app: `SGA QA Pack - Foreman`
6. Name the tab: `QA Pack`
7. Click **Save**

**For Admins (Model-Driven App):**
1. Go to team: "Quality Management"
2. Add tab → Search **Model-driven app**
3. Select: `SGA QA Pack - Admin Dashboard`
4. Name: `QA Dashboard`
5. Click **Save**

**For Everyone (Copilot):**
1. Teams → **Apps** → Find `SGA QA Assistant`
2. Click **Add**
3. The bot will appear in your chat list

#### Step 8.2: Configure Notification Channels

For each division, create channels and get webhook URLs:

**Asphalt Division:**
1. Team: "Asphalt Operations"
2. Create channels:
   - #job-sheets (for new jobs)
   - #qa-submissions (for QA packs)
   - #incidents (for incidents)
3. For each channel → **Workflows** → "Post to channel..."
4. Copy webhook URL
5. Update environment variables in Power Platform

Repeat for Profiling and Spray divisions.

---

### PHASE 9: Data Migration (2-4 hours)

#### Step 9.1: Export Data from Redis

```bash
# On your current server
cd sga-qa-pack
node scripts/export-redis-to-json.js

# This creates:
# - jobs-export.json
# - reports-export.json
# - incidents-export.json
```

#### Step 9.2: Import to Dataverse

```powershell
# Run migration script
cd m365-deployment/scripts
.\Migrate-Data.ps1 -SourceFolder ".\exports" -EnvironmentUrl "https://yourorg.crm.dynamics.com"

# The script will:
# 1. Import jobs (with validation)
# 2. Import QA packs (all versions)
# 3. Import incidents
# 4. Import NCRs
# 5. Migrate files to SharePoint
# 6. Update all references
# 7. Verify data integrity
```

#### Step 9.3: Verify Migration

```powershell
.\Verify-Migration.ps1

# Expected output:
# Jobs migrated: 847 of 847 (100%)
# QA Packs migrated: 2,341 of 2,341 (100%)
# Incidents migrated: 23 of 23 (100%)
# Files migrated: 8,932 of 8,932 (100%)
# ✓ Migration complete
```

---

### PHASE 10: Testing & Validation (1 hour)

#### Step 10.1: Smoke Tests

Run automated test suite:

```powershell
.\Run-Tests.ps1 -Environment "Production"

# Tests:
# ✓ Foreman can view jobs
# ✓ Foreman can create QA pack
# ✓ Foreman can submit with signature
# ✓ Engineer can review QA pack
# ✓ Engineer can raise NCR
# ✓ PDF generation works
# ✓ Teams notifications sent
# ✓ AI summary generated
# ✓ Offline mode works
# ✓ Data syncs when online
```

#### Step 10.2: User Acceptance Testing (UAT)

1. **Test as Foreman:**
   - Login to Canvas app
   - View assigned jobs
   - Complete a full QA pack
   - Add photos
   - Submit with signature
   - Verify PDF received

2. **Test as Engineer:**
   - Login to Admin dashboard
   - Review submitted QA pack
   - Check AI summary
   - Raise an NCR
   - Approve report

3. **Test as HSEQ:**
   - View incident register
   - Investigate incident
   - Sign off
   - Close incident

4. **Test Offline:**
   - Turn off WiFi on mobile device
   - Complete QA pack
   - Turn WiFi back on
   - Verify auto-sync

---

### PHASE 11: Go-Live Preparation (30 mins)

#### Step 11.1: Create Training Materials

1. Record video walkthrough of foreman app
2. Create quick reference guide (1-pager)
3. Schedule training sessions

#### Step 11.2: Communication Plan

**Week before go-live:**
- Email announcement to all users
- Teams announcement in all channels
- Training session invites

**Go-live day:**
- Morning: Final system check
- 9 AM: Turn on all flows
- 10 AM: Training session 1 (foremen)
- 2 PM: Training session 2 (admins)
- End of day: Monitor for issues

**Week after go-live:**
- Daily check-ins with users
- Address any issues immediately
- Collect feedback

#### Step 11.3: Create Support Process

1. Create Teams channel: #qa-pack-support
2. Assign support personnel
3. Document common issues and solutions
4. Create escalation process

---

### PHASE 12: Decommission Old System (1-2 weeks later)

After verifying new system is stable:

#### Step 12.1: Final Data Sync

```powershell
# One final sync from old system
.\Final-Data-Sync.ps1
```

#### Step 12.2: Archive Old System

1. Take final backup of Redis
2. Export all data to JSON
3. Store in secure location
4. Keep for 90 days

#### Step 12.3: Redirect Users

1. Update old app URL to redirect to new app
2. Display message: "System migrated to M365"
3. Provide new app links

#### Step 12.4: Shutdown

After 90 days with no issues:
1. Shut down Vercel project
2. Close Redis database
3. Cancel third-party subscriptions:
   - Upstash
   - Cloudflare R2
   - Auth0
   - Google Gemini API

---

## 📊 POST-DEPLOYMENT MONITORING

### Week 1: Daily Monitoring

**Metrics to track:**
- Number of QA packs submitted
- PDF generation success rate
- Teams notification delivery
- AI summary generation time
- User login count
- Error rate

**Dashboard:** Create Power BI report showing these metrics

### Week 2-4: Weekly Monitoring

**Review:**
- User feedback
- System performance
- Cost analysis
- Feature requests

### Month 2+: Monthly Monitoring

**Optimization:**
- Review flow execution times
- Optimize slow queries
- Archive old data
- Update AI prompts based on feedback

---

## 🆘 TROUBLESHOOTING

### Issue: "Connection not found" error in flows

**Solution:**
```powershell
# Refresh all connections
.\Refresh-Connections.ps1
```

### Issue: Canvas app shows "Data source error"

**Solution:**
1. Open app in edit mode
2. Click **Data** → Remove and re-add Dataverse connection
3. Republish app

### Issue: PDF generation fails

**Solution:**
1. Check Word template is in SharePoint
2. Verify template path in flow
3. Test template with sample data
4. Check flow run history for specific error

### Issue: AI summary not generating

**Solution:**
1. Verify Azure OpenAI connection
2. Check API key validity
3. Review prompt length (must be under token limit)
4. Test with smaller data set

### Issue: Offline sync not working

**Solution:**
1. Verify offline mode is enabled in app settings
2. Check device storage space
3. Clear app cache and retry
4. Test with single record first

---

## 📞 SUPPORT CONTACTS

**Technical Issues:**
- Email: it-support@sgagroup.com.au
- Teams: #qa-pack-support

**Microsoft Support:**
- Power Platform: [https://aka.ms/PowerAppsSupport](https://aka.ms/PowerAppsSupport)
- Azure: [https://azure.microsoft.com/support](https://azure.microsoft.com/support)

**Emergency Contact:**
- After-hours support: +61 (mobile number)

---

## ✅ DEPLOYMENT SIGN-OFF

Use this checklist for final sign-off:

- [ ] All Dataverse tables created and verified
- [ ] Canvas app deployed and tested
- [ ] Model-driven app deployed and tested
- [ ] All Power Automate flows activated
- [ ] Azure Functions deployed and connected
- [ ] Copilot agent configured (if applicable)
- [ ] Security groups and roles assigned
- [ ] Teams integration complete
- [ ] Data migration completed and verified
- [ ] User training completed
- [ ] Support process established
- [ ] Old system archived
- [ ] Go-live communication sent

**Deployed by:** _________________ **Date:** _________

**Approved by:** _________________ **Date:** _________

---

## 📚 NEXT STEPS

After successful deployment:

1. **Monitor usage** for first month
2. **Collect feedback** from users
3. **Optimize** based on actual usage patterns
4. **Plan Phase 2 features:**
   - Advanced analytics with Power BI
   - Integration with other systems
   - Mobile app enhancements
   - Additional AI capabilities

---

**Congratulations! Your SGA QA Pack M365 system is now live! 🎉**
