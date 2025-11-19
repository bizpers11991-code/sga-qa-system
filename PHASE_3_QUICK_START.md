# Phase 3: SharePoint Libraries - Quick Start Guide

**Status:** Ready to execute after Phase 2 completes
**Time Required:** 5-10 minutes
**Prerequisites:** Dataverse tables created

---

## Two Options to Create SharePoint Libraries

### Option 1: Automated Script (Recommended)

**Run this command:**
```powershell
.\scripts\Create-SharePointLibraries.ps1
```

**What it does:**
1. Installs PnP PowerShell module (if needed)
2. Opens browser for authentication
3. Creates all 5 document libraries automatically
4. Verifies creation

**Expected output:**
```
✅ Created: QA Packs
✅ Created: Job Sheets
✅ Created: Site Photos
✅ Created: Incident Reports
✅ Created: NCR Documents
```

---

### Option 2: Manual Creation (If Script Fails)

**Steps:**
1. Go to: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
2. Click **"New"** → **"Document library"**
3. Create these 5 libraries one by one:

**Libraries to Create:**

| Library Name | Description |
|--------------|-------------|
| QA Packs | Quality Assurance Pack submissions and PDFs |
| Job Sheets | Daily job sheets and work records |
| Site Photos | Job site photographs and documentation |
| Incident Reports | Safety and quality incident reports |
| NCR Documents | Non-Conformance Report documentation |

**For each library:**
1. Click "New" → "Document library"
2. Enter the library name from table above
3. Enter the description (optional but recommended)
4. Click "Create"

---

## Verification

After creation (automated or manual), verify:

**Check in SharePoint:**
1. Go to: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
2. You should see 5 new document libraries in the left navigation
3. Click on each to verify they're accessible

**Check via PowerShell (optional):**
```powershell
Connect-PnPOnline -Url "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance" -Interactive
Get-PnPList | Where-Object {$_.BaseTemplate -eq 101} | Select-Object Title, ItemCount
```

---

## Troubleshooting

**"Access Denied" error:**
- Verify you have Site Owner or Site Collection Admin permissions
- Try manual creation via web browser instead

**"PnP module installation fails":**
- Run PowerShell as Administrator
- Or skip to manual creation

**"Site not found":**
- Verify the SharePoint site URL is correct
- Make sure site exists: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance

---

## After Completion

**Update deployment status:**
```powershell
# Edit DEPLOYMENT_FINAL_STATUS.md
# Mark Phase 3 complete ✅
```

**Next steps:**
1. ✅ Mark Phase 3 complete in DEPLOYMENT_FINAL_STATUS.md
2. Continue to Phase 4: Import Power App
3. See COMPLETE_DEPLOYMENT_NOW.md for Phase 4 instructions

---

**Created:** November 19, 2025
**Status:** Ready to execute
**Estimated Time:** 5-10 minutes
