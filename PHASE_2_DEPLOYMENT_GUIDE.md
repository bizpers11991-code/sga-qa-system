# Phase 2: Dataverse Schema Deployment Guide

## 🎯 Overview

You're deploying 12 custom tables to your Dataverse environment. This will take approximately **30-45 minutes**.

**Environment Details:**
- **Environment Name:** SGA QA Pack - Production
- **Environment ID:** c6518f88-4851-efd0-a384-a62aa2ce11c2
- **Dataverse URL:** https://org02fe52d443c4f01189f5002248942fce.crm6.dynamics.com
- **SharePoint Site:** https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance

---

## 📋 Tables to Create (12 Total)

1. **Jobs** - Construction job records (9 fields)
2. **Foremen** - Crew leaders (5 fields)
3. **QA Packs** - Quality submissions (7 fields)
4. **Daily Reports** - Daily foreman reports (6 fields)
5. **Incident Reports** - Safety incidents (8 fields)
6. **NCRs** - Non-conformance reports (9 fields)
7. **Sampling Plans** - Testing plans (6 fields)
8. **Resources** - Equipment & crew (5 fields)
9. **ITP Templates** - Inspection plans (5 fields)
10. **Site Photos** - Job photographs (6 fields)
11. **Asphalt Placements** - Asphalt records (6 fields)
12. **Straight Edge Reports** - Profile testing (6 fields)

---

## 🚀 THREE DEPLOYMENT OPTIONS

### Option 1: Use Copilot to Guide You (RECOMMENDED FOR YOU)

Since you have Microsoft Copilot, this is the easiest method!

**Step 1:** Copy this message and paste it to Copilot:

```
I need to deploy custom tables to my Dataverse environment for the SGA QA Pack application.

Environment URL: https://org02fe52d443c4f01189f5002248942fce.crm6.dynamics.com

I have a PowerShell script with 12 table definitions at:
C:\Dhruv\sga-qa-pack\scripts\Deploy-DataverseSchema.ps1

Please guide me step-by-step through creating these tables in the Power Apps Maker Portal.

For each table, I need to:
1. Create the table with the correct schema name
2. Add all the fields (columns) with correct data types
3. Configure any option sets (choice fields)
4. Set required fields

Let's start with the first table: Jobs (sga_job)
```

**Step 2:** Follow Copilot's guidance to create each table

**Step 3:** Use the checklist below to track your progress

---

### Option 2: Manual Creation via Power Apps Portal

1. Go to [Power Apps Maker Portal](https://make.powerapps.com)
2. Select your environment: "SGA QA Pack - Production"
3. Click **Tables** → **+ New table** → **Create table**
4. For each table in the script:
   - Enter Table Name (e.g., "Job")
   - Enter Plural Name (e.g., "Jobs")
   - Enter Schema Name (e.g., "sga_job")
   - Click **Create**
5. Add columns:
   - Click **+ New** → **Column**
   - Configure each field based on the script definitions
   - For OptionSet fields, add all the options listed
6. Click **Save** after adding all columns
7. Repeat for all 12 tables

---

### Option 3: Use Power Platform CLI (For Advanced Users)

```powershell
# Install pac CLI if not installed
# https://learn.microsoft.com/power-platform/developer/cli/introduction

# Authenticate
pac auth create --url https://org02fe52d443c4f01189f5002248942fce.crm6.dynamics.com

# Create tables using pac solution
# (Requires creating a solution package first)
```

---

## ✅ Deployment Checklist

Track your progress as you create each table:

- [ ] 1. Jobs (sga_job) - 9 fields
- [ ] 2. Foremen (sga_foreman) - 5 fields
- [ ] 3. QA Packs (sga_qapack) - 7 fields
- [ ] 4. Daily Reports (sga_dailyreport) - 6 fields
- [ ] 5. Incident Reports (sga_incident) - 8 fields
- [ ] 6. NCRs (sga_ncr) - 9 fields
- [ ] 7. Sampling Plans (sga_samplingplan) - 6 fields
- [ ] 8. Resources (sga_resource) - 5 fields
- [ ] 9. ITP Templates (sga_itptemplate) - 5 fields
- [ ] 10. Site Photos (sga_sitephoto) - 6 fields
- [ ] 11. Asphalt Placements (sga_asphaltplacement) - 6 fields
- [ ] 12. Straight Edge Reports (sga_straightedgereport) - 6 fields

---

## 🔍 Verification

After creating all tables, verify the deployment:

```powershell
# Run the deployment script in test mode
.\scripts\Deploy-DataverseSchema.ps1 -EnvironmentUrl "https://org02fe52d443c4f01189f5002248942fce.crm6.dynamics.com" -WhatIf

# Or check in Power Apps Portal
# Go to: https://make.powerapps.com → Tables
# You should see 12 new tables with "sga_" prefix
```

---

## 📊 Field Type Reference

When creating fields, use these Dataverse data types:

| Script Type | Dataverse Type | Example |
|------------|----------------|---------|
| String | Single line of text | Job Number |
| Memo | Multiple lines of text | Description |
| DateTime | Date and Time | Job Date |
| Integer | Whole Number | Version |
| Decimal | Decimal Number | Temperature |
| Money | Currency | Cost Impact |
| Boolean | Yes/No | Active |
| OptionSet | Choice | Status, Division |

---

## ⏱️ Time Estimates

- **Using Copilot guidance:** 30-45 minutes (recommended)
- **Manual creation:** 60-90 minutes
- **Using pac CLI:** 15-20 minutes (if experienced)

---

## 🆘 Troubleshooting

**Issue:** Can't find the environment

**Solution:**
1. Check you're logged into the correct Microsoft 365 account
2. Verify environment exists: [Power Platform Admin Center](https://admin.powerplatform.microsoft.com)

---

**Issue:** Schema name already exists

**Solution:**
- Someone may have already created it
- Check existing tables in: https://make.powerapps.com → Tables
- You can skip that table and continue

---

**Issue:** Don't have permission to create tables

**Solution:**
- You need "System Administrator" or "System Customizer" role
- Ask your M365 admin to grant permissions
- Or use the service principal created earlier

---

## 🎯 Next Steps After Deployment

Once all 12 tables are created:

1. ✅ Mark Phase 2 as complete in DEPLOYMENT_STATUS.md
2. Move to Phase 3: Create SharePoint Document Libraries
3. Then Phase 4: Deploy Power Apps

---

## 💡 Pro Tips

1. **Use Copilot** - It can read the PowerShell script and guide you through each table
2. **Create in Order** - Some tables may reference others, so follow the order in the script
3. **Double-check Required Fields** - Fields marked `Required=$true` must be set as required
4. **Save Often** - Save after adding each few fields to avoid losing work
5. **Test with Sample Data** - After creating all tables, add 1-2 test records to verify

---

## 📞 Need Help?

- **For Copilot users:** Ask Copilot: "Help me troubleshoot Dataverse table creation"
- **For errors:** Check the Dataverse error logs in the maker portal
- **For Claude:** Ask specific questions about the schema definitions

---

**Ready to deploy? Start with Option 1 (Copilot guidance) above!** 🚀
