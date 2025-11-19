# Complete M365 Deployment Instructions for Gemini

**Project:** SGA QA Pack - Quality Assurance Application for Construction
**User:** Dhruv Mann (dhruv@sgagroup.com.au)
**Date:** November 18, 2025
**Current Status:** Phase 1 Complete - Ready for Phase 2

---

## ✅ WHAT CLAUDE ACCOMPLISHED (DONE)

### 1. Azure App Registration ✅
- **App Name:** SGA QA Pack - Production
- **Client ID:** `fbd9d6a2-67fb-4364-88e0-850b11c75db9`
- **Client Secret:** `your-client-secret-here`
- **Tenant ID:** `7026ecbb-b41e-4aa0-9e68-a41eb80634fe`
- **Status:** All API permissions granted with admin consent
- **Permissions:** Microsoft Graph, SharePoint, Dataverse

### 2. Power Platform Environment ✅
- **Environment Name:** SGA QA Pack - Production
- **Environment ID:** `c6518f88-4851-efd0-a384-a62aa2ce11c2`
- **Organization ID:** `02fe52d4-43c4-f011-89f5-002248942fce`
- **Dataverse URL:** `https://org02fe52d443c4f01189f5002248942fce.crm6.dynamics.com`
- **Type:** Production
- **Location:** Australia
- **Dataverse Status:** ✅ Provisioned and ready

### 3. SharePoint Site (Already exists)
- **URL:** https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
- **Status:** Active (needs document libraries created)

### 4. All Credentials Saved
- Location: `.env.azure` file
- All secure and ready to use

---

## 📋 REMAINING WORK (YOUR MISSION)

You need to complete Phases 2-12 of the M365 deployment.

---

## 🎯 PHASE 2: DEPLOY DATAVERSE SCHEMA (START HERE)

### Goal
Create all database tables (30+ tables) for the QA Pack application in Dataverse.

### Tables to Create
1. **Jobs** - Construction job records
2. **QA Packs** - Quality assurance documentation
3. **Job Sheets** - Daily work records
4. **Incident Reports** - Safety incidents
5. **NCRs** - Non-conformance reports
6. **Sampling Plans** - Material testing plans
7. **Resources** - Equipment and materials
8. **Foremen** - Crew leaders
9. **Site Photos** - Photo documentation
10. **ITP Templates** - Inspection test plans
... (20+ more tables)

### Option A: Automated Script (TRY THIS FIRST)

**Check if script exists:**
```powershell
ls C:\Dhruv\sga-qa-pack\m365-deployment\scripts\Deploy-DataverseSchema.ps1
```

**If script exists, run it:**
```powershell
cd C:\Dhruv\sga-qa-pack\m365-deployment\scripts
.\Deploy-DataverseSchema.ps1 -EnvironmentUrl "https://org02fe52d443c4f01189f5002248942fce.crm6.dynamics.com"
```

**Note:** This will take 30-45 minutes.

### Option B: Manual Creation (IF SCRIPT DOESN'T EXIST)

**Use Power Apps Maker Portal:**
1. Go to: https://make.powerapps.com
2. Select environment: "SGA QA Pack - Production"
3. Click "Tables" → "+ New table"
4. Create each table with appropriate columns

**Table Creation Order (Important!):**
```
First: Foremen, Resources, ITP Templates
Then: Jobs (depends on Foremen)
Then: QA Packs (depends on Jobs)
Then: Incident Reports, NCRs (depends on Jobs)
Finally: All other tables
```

### Verification

**List all tables created:**
```powershell
Get-AdminPowerAppCdsEntity -EnvironmentName "c6518f88-4851-efd0-a384-a62aa2ce11c2" | Select-Object -ExpandProperty Name
```

**Expected:** Should see 30+ tables listed

---

## 🎯 PHASE 3: SHAREPOINT DOCUMENT LIBRARIES

### Goal
Create 5 document libraries in SharePoint for storing files.

### Method 1: Using Power Platform

**Connect to SharePoint:**
```powershell
# Install PnP PowerShell if not installed
Install-Module -Name PnP.PowerShell -Scope CurrentUser -Force

# Connect to SharePoint site
Connect-PnPOnline -Url "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance" -Interactive
```

**Create Libraries:**
```powershell
# Create 5 document libraries
New-PnPList -Title "QA Packs" -Template DocumentLibrary
New-PnPList -Title "Job Sheets" -Template DocumentLibrary
New-PnPList -Title "Site Photos" -Template DocumentLibrary
New-PnPList -Title "Incident Reports" -Template DocumentLibrary
New-PnPList -Title "NCR Documents" -Template DocumentLibrary
```

**Verify:**
```powershell
Get-PnPList | Where-Object {$_.BaseTemplate -eq 101} | Select-Object Title
```

### Method 2: Manual Creation

1. Go to: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
2. Click "New" → "Document library"
3. Create each library:
   - QA Packs
   - Job Sheets
   - Site Photos
   - Incident Reports
   - NCR Documents

---

## 🎯 PHASE 4: POWER APPS DEPLOYMENT

### Goal
Deploy the mobile app for foremen and admin dashboard.

### Check for Solution Package

```powershell
ls C:\Dhruv\sga-qa-pack\sga-foreman-app-src
```

### Option A: If .zip solution exists

```powershell
# Import using pac CLI
pac solution import --path sga-qa-pack-solution.zip --environment-url https://org02fe52d443c4f01189f5002248942fce.crm6.dynamics.com
```

### Option B: Manual Import

1. Go to: https://make.powerapps.com
2. Select "Solutions"
3. Click "Import" → Browse to solution file
4. Follow wizard to import

### Option C: Create from Source (if no package)

The app source files are in: `C:\Dhruv\sga-qa-pack\sga-foreman-app-src\src\`

**Tell user:** This requires packaging the YAML files into a solution. Recommend using Power Apps Studio to import.

---

## 🎯 PHASE 5: POWER AUTOMATE FLOWS

### Goal
Create 7 automated workflows.

### Flows Needed
1. **QA Pack Submission Handler** - Process submitted QA packs
2. **Generate PDF** - Convert forms to PDF
3. **Teams Notifications** - Send alerts to Teams
4. **AI Summary Generator** - Use Gemini API for summaries
5. **Daily Summary** - Automated daily reports
6. **Incident Handler** - Process incident reports
7. **NCR Workflow** - Manage non-conformances

### Authentication for Flows

**CRITICAL:** When creating connections, use Service Principal:
- **Connection Type:** "Connect with Service Principal"
- **Client ID:** `fbd9d6a2-67fb-4364-88e0-850b11c75db9`
- **Client Secret:** `your-client-secret-here`
- **Tenant ID:** `7026ecbb-b41e-4aa0-9e68-a41eb80634fe`

### Flow Creation

1. Go to: https://make.powerautomate.com
2. Select environment: "SGA QA Pack - Production"
3. Create flows based on templates in: `C:\Dhruv\sga-qa-pack\m365-deployment\power-automate\`

---

## 🎯 PHASE 6: AZURE FUNCTIONS (Optional)

### Goal
Deploy serverless backend functions.

### Functions Available
- `GenerateAISummary.ts` - AI-powered summaries using Gemini
- `GenerateDailySummary.ts` - Daily report generation
- `GenerateIncidentID.ts` - Auto-generate incident IDs
- `GenerateNCRID.ts` - Auto-generate NCR IDs

### Check if Azure Function App exists

```powershell
az functionapp list --query "[].name"
```

### If no Function App, create one

```powershell
# Create resource group
az group create --name rg-sga-qapack-prod --location australiaeast

# Create storage account
az storage account create --name sgaqapackstorage --resource-group rg-sga-qapack-prod --location australiaeast --sku Standard_LRS

# Create Function App
az functionapp create --name func-sga-qapack-prod --resource-group rg-sga-qapack-prod --storage-account sgaqapackstorage --runtime node --runtime-version 18 --functions-version 4
```

### Deploy Functions

```powershell
cd C:\Dhruv\sga-qa-pack\m365-deployment\azure-functions
npm install
npm run build
func azure functionapp publish func-sga-qapack-prod
```

---

## 🎯 PHASE 7: TESTING

### Test Checklist

**Power Platform:**
- [ ] Can login to Power Apps environment
- [ ] All tables visible in Dataverse
- [ ] Can create a test Job record
- [ ] Can create a test QA Pack

**SharePoint:**
- [ ] Can access all 5 document libraries
- [ ] Can upload a test file
- [ ] Permissions working correctly

**Power Apps:**
- [ ] Foreman app loads on mobile
- [ ] Can view assigned jobs
- [ ] Can submit QA pack

**Power Automate:**
- [ ] Flows are running (not suspended)
- [ ] Test notification flow works
- [ ] PDF generation works

**Azure Functions (if deployed):**
- [ ] Functions are running
- [ ] Can call functions via HTTP
- [ ] Gemini API integration works

---

## 🎯 PHASE 8: GO-LIVE PREPARATION

### User Training
- [ ] Train foremen on mobile app
- [ ] Train engineers on review process
- [ ] Train HSEQ on incident management

### Data Migration (if needed)
- [ ] Export data from old system
- [ ] Import to Dataverse
- [ ] Verify data integrity

### Security
- [ ] Configure security roles
- [ ] Assign users to roles
- [ ] Test permissions

### Monitoring
- [ ] Set up Power BI reports
- [ ] Configure alerts
- [ ] Test notification system

---

## 📊 DEPLOYMENT CHECKLIST

- [x] ✅ Azure Authentication
- [x] ✅ Power Platform Environment
- [x] ✅ Dataverse Database
- [ ] ⏳ Dataverse Schema (Tables) - **START HERE**
- [ ] SharePoint Document Libraries
- [ ] Power Apps Deployment
- [ ] Power Automate Flows
- [ ] Azure Functions (optional)
- [ ] Testing
- [ ] User Training
- [ ] Go-Live

---

## 🔑 CREDENTIALS REFERENCE

**All credentials are in:** `.env.azure`

**Quick Reference:**
```
TENANT_ID=7026ecbb-b41e-4aa0-9e68-a41eb80634fe
SUBSCRIPTION_ID=0c3d20d9-5cc5-43ec-ae6c-4c6726d12d4c
CLIENT_ID=fbd9d6a2-67fb-4364-88e0-850b11c75db9
CLIENT_SECRET=your-client-secret-here

POWER_PLATFORM_ENVIRONMENT_ID=c6518f88-4851-efd0-a384-a62aa2ce11c2
DATAVERSE_INSTANCE_URL=https://org02fe52d443c4f01189f5002248942fce.crm6.dynamics.com

SHAREPOINT_SITE_URL=https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
```

---

## 🆘 TROUBLESHOOTING

### "Access Denied" on SharePoint
```powershell
# Grant app permission to SharePoint site
Connect-PnPOnline -Url "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance" -Interactive
Grant-PnPAzureADAppSitePermission -AppId "fbd9d6a2-67fb-4364-88e0-850b11c75db9" -DisplayName "SGA QA Pack - Production" -Permissions Write
```

### "Cannot find environment" errors
**Solution:** User needs to be logged in to Power Platform
```powershell
Add-PowerAppsAccount
```

### Power Automate flow connections fail
**Solution:** Make sure to use Service Principal authentication (credentials above)

### Script execution policy errors
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📚 REFERENCE FILES

- **Main Deployment Plan:** `GEMINI_TAKEOVER_PLAN.md` (comprehensive 1500+ line guide)
- **Current Status:** `DEPLOYMENT_STATUS.md`
- **Credentials:** `.env.azure`
- **Original README:** `README.md`

---

## 🎯 YOUR IMMEDIATE NEXT STEP

**Start with Phase 2: Dataverse Schema**

1. Check if deployment script exists
2. If yes, run it
3. If no, guide user to create tables manually
4. Verify tables were created
5. Move to Phase 3

**After each phase:** Update `DEPLOYMENT_STATUS.md` with progress.

---

## 💡 IMPORTANT NOTES

1. **User Skill Level:** Dhruv is capable but new to M365 deployment. Provide clear, exact commands.

2. **Preferences:**
   - PowerShell commands (Windows)
   - Detailed explanations
   - Step-by-step instructions

3. **Working Hours:** Australia timezone (plan accordingly)

4. **Budget:** User's Gemini API is paid and unlimited. Use it freely!

5. **Security:** Never commit `.env.azure` to Git. It's already in `.gitignore`.

---

## ✅ SUCCESS CRITERIA

Deployment is successful when:
- ✅ Foremen can login and use mobile app
- ✅ Can create and submit QA packs
- ✅ PDFs generate automatically
- ✅ Teams notifications work
- ✅ Engineers can review submissions
- ✅ All workflows automated
- ✅ User is happy!

---

**Good luck with the deployment!**

**Everything Claude accomplished is done. Now it's your turn to complete Phases 2-12.**

**Start with Phase 2 (Dataverse Schema) and work through each phase systematically.**
