# M365 Deployment - Quick Start Guide

## ⚡ Fast Track Deployment (30 minutes)

### Prerequisites Checklist

- [ ] Microsoft 365 Admin access
- [ ] SharePoint site created: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
- [ ] PowerShell 5.1 or later
- [ ] Internet connection

---

## Step 1: Install Required Tools (5 minutes)

### Install PnP PowerShell

```powershell
# Open PowerShell as Administrator
Install-Module -Name PnP.PowerShell -Scope CurrentUser
```

### Install Power Platform CLI (Optional)

```powershell
# Option A: Via dotnet
dotnet tool install --global Microsoft.PowerApps.CLI.Tool

# Option B: Download installer
# Visit: https://aka.ms/PowerAppsCLI
```

---

## Step 2: Deploy SharePoint Structure (10 minutes)

```powershell
# Navigate to project directory
cd C:\Dhruv\sga-qa-system\m365-deployment

# Run SharePoint deployment
.\Deploy-SharePoint.ps1 -SiteUrl "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance"

# You'll be prompted to sign in with your M365 account
```

**What this creates:**
- ✅ 8 Document Libraries (QA Packs, Job Sheets, Scope Reports, etc.)
- ✅ 2 Lists (Client Tiers, Project Assignments)
- ✅ Folder structure (Asphalt, Profiling, Spray, Grooving)

---

## Step 3: Create Power Automate Flows (15 minutes)

### Option A: Manual Creation (Recommended for First Time)

```powershell
# Get flow definitions
.\Deploy-PowerAutomate.ps1 -CreateFlowsManually
```

Then follow the printed instructions to create each flow at https://make.powerautomate.com

### Option B: Automated (Requires Power Platform CLI)

```powershell
.\Deploy-PowerAutomate.ps1 -Environment "production"
```

**6 Flows to Create:**
1. QA Pack Submission (Auto-notify engineers)
2. Site Visit Notification (Tier-based scheduling)
3. Job Sheet Distribution (Crew-specific channels)
4. Scope Report Automation (Summary posting)
5. NCR/Incident Alert (Immediate escalation)
6. Daily Summary (5 PM aggregation)

---

## Step 4: Configure Teams Integration

### Create Shared Calendar

1. Open Microsoft Teams
2. Go to Calendar tab
3. Click "Share" > "Share with your organization"
4. Name it: "SGA QA Schedule"
5. Add permissions:
   - Engineers: Can edit
   - Foremen: Can view
   - Management: Can view

### Create Teams Channels

In your SGA Quality Assurance team, create these channels:

- **#daily-updates** - Daily summary reports
- **#site-visits** - Site visit scope reports
- **#ncr-alerts** - NCR and incident alerts
- **#asphalt-crew** - Asphalt job sheets
- **#profiling-crew** - Profiling job sheets
- **#spray-crew** - Spray job sheets
- **#grooving-crew** - Grooving job sheets

---

## Step 5: Test the System

### Test 1: Upload a QA Pack

1. Go to SharePoint: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
2. Open "QA Packs" library > "Asphalt" folder
3. Upload a test PDF file
4. ✅ Check: Teams notification sent
5. ✅ Check: Task created in Planner

### Test 2: Create a Job

1. In your Vercel app (after deployment)
2. Create a new job with client tier
3. ✅ Check: Calendar events created for site visits
4. ✅ Check: Notifications sent

### Test 3: Daily Summary

1. Wait until 5:00 PM
2. ✅ Check: Summary posted in #daily-updates channel
3. ✅ Check: Management receives email

---

## Troubleshooting

### PowerShell Execution Policy Error

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Cannot Connect to SharePoint

1. Ensure you're using a Global Admin or SharePoint Admin account
2. Check that the site URL is correct
3. Try using `-Interactive` parameter explicitly

### Power Automate Flows Not Triggering

1. Check flow run history at https://make.powerautomate.com
2. Verify connections are authenticated (green checkmark)
3. Test with "Run now" button

---

## What to Do If You Get Stuck

### For SharePoint Issues:

```powershell
# Check connection
Connect-PnPOnline -Url "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance" -Interactive

# List all libraries (should show our 8 libraries)
Get-PnPList
```

### For Power Automate Issues:

1. Go to https://make.powerautomate.com
2. Click "My flows"
3. Find the failing flow
4. Click "Edit"
5. Check each step for red error icons
6. Re-authenticate connections if needed

### Need Help?

1. Check `docs/DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review Power Automate flow definitions in `m365-deployment/power-automate/`
3. Check SharePoint permissions and library settings

---

## Success Checklist

After completing all steps, verify:

- [ ] All 8 SharePoint libraries exist
- [ ] All 2 SharePoint lists created
- [ ] All 6 Power Automate flows active (green status)
- [ ] Teams channels created
- [ ] Shared calendar accessible
- [ ] Test QA pack upload works
- [ ] Test notifications received
- [ ] Daily summary flow scheduled

---

## Cost Estimate

**Monthly Microsoft 365 Costs:**
- SharePoint: Included in M365 license
- Power Automate: Included in M365 license (standard connectors)
- Teams: Included in M365 license
- **Total Additional Cost: $0** (if you have M365 Business Premium/E3/E5)

**⚠️ Note:** AI Builder (for PDF extraction) requires Power Apps or Power Automate premium license (~$20/user/month). You can skip this and use basic text extraction for now.

---

## Next: Deploy the Vercel App

Once M365 is configured, deploy the frontend:

```bash
cd C:\Dhruv\sga-qa-system
npm run build
vercel --prod
```

See `docs/DEPLOYMENT_GUIDE.md` for complete Vercel deployment instructions.

---

**🎉 Congratulations! Your M365 backend is ready!**
