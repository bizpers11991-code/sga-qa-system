# SharePoint Lists Setup Guide

**For SGA QA System v2.3.0**

This guide walks you through creating the required SharePoint Lists and Document Libraries for the SGA QA System.

---

## 📋 Prerequisites

1. Microsoft 365 account with SharePoint admin access
2. A SharePoint site created (e.g., `SGAQualityAssurance`)
3. Site URL: `https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance`

---

## 🗂️ Required SharePoint Lists

Create these 14 lists in your SharePoint site:

### 1. Jobs List

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line (default) | Job Number (e.g., "ASP-2025-001") |
| JobType | Choice | Asphalt, Profiling, Spray |
| Division | Choice | Asphalt, Profiling, Spray |
| Client | Single line | Client name |
| ProjectId | Single line | Reference to Projects list |
| Location | Single line | Job location |
| JobDate | Date | Scheduled date |
| Status | Choice | Pending, In Progress, Completed, On Hold |
| AssignedForeman | Person | Assigned foreman |
| WorkDescription | Multiple lines | Description of work |
| EstimatedTonnes | Number | For asphalt jobs |
| ActualTonnes | Number | Completed tonnes |
| CrewSize | Number | Number of crew members |

### 2. Projects List

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line | Project Number |
| ProjectName | Single line | Full project name |
| Client | Single line | Client name |
| ClientTier | Choice | Tier 1, Tier 2, Tier 3 |
| HandoverId | Single line | Reference to Tenders |
| Status | Choice | Scoping, Scheduled, In Progress, QA Review, Completed, On Hold |
| ProjectOwner | Person | Project owner |
| Location | Single line | Project location |
| Divisions | Multiple lines | JSON array of divisions |
| EstimatedStartDate | Date | |
| EstimatedEndDate | Date | |
| ActualStartDate | Date | |
| ActualEndDate | Date | |

### 3. Tenders List

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line | Handover Number |
| ClientName | Single line | |
| ClientTier | Choice | Tier 1, Tier 2, Tier 3 |
| ProjectName | Single line | |
| Status | Choice | Pending, Scoping, Scheduled, Completed |
| TenderValue | Currency | |
| ReceivedDate | Date | |
| DueDate | Date | |
| AssignedTo | Person | |
| Notes | Multiple lines | |

### 4. QAPacks List

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line | QA Pack ID |
| JobNo | Single line | Reference to Jobs |
| Version | Number | Pack version |
| Status | Choice | Draft, Submitted, Approved, Rejected |
| SubmittedBy | Person | |
| SubmittedDate | Date and Time | |
| PackData | Multiple lines | JSON data (large) |
| AISummary | Multiple lines | AI-generated summary |
| PdfUrl | Hyperlink | Link to generated PDF |

### 5. Incidents List

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line | Incident Number |
| IncidentType | Choice | Near Miss, First Aid, Medical, Environmental, Property Damage |
| Location | Single line | |
| IncidentDate | Date and Time | |
| ReportedBy | Person | |
| Description | Multiple lines | |
| Status | Choice | Open, Under Investigation, Closed |
| Severity | Choice | Low, Medium, High, Critical |
| CorrectiveActions | Multiple lines | |
| InvestigationNotes | Multiple lines | |

### 6. NCRs List (Non-Conformance Reports)

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line | NCR Number |
| JobId | Single line | Reference to Jobs |
| ProjectId | Single line | Reference to Projects |
| Description | Multiple lines | |
| Status | Choice | Open, Under Review, Corrective Action, Closed |
| Severity | Choice | Minor, Major, Critical |
| RaisedBy | Person | |
| RaisedDate | Date | |
| CorrectiveAction | Multiple lines | |
| ClosedDate | Date | |
| ClosedBy | Person | |

### 7. Foremen List

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line | Foreman name |
| Email | Single line | Email address |
| Phone | Single line | Phone number |
| Division | Choice | Asphalt, Profiling, Spray |
| IsActive | Yes/No | |
| UserId | Person | Link to M365 user |

### 8. Resources List

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line | Resource name |
| ResourceType | Choice | Vehicle, Equipment, Tool |
| Division | Choice | Asphalt, Profiling, Spray, All |
| Status | Choice | Available, In Use, Maintenance, Retired |
| RegistrationNumber | Single line | For vehicles |
| LastServiceDate | Date | |
| NextServiceDate | Date | |

### 9. ScopeReports List

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line | Report Number |
| ProjectId | Single line | Reference to Projects |
| VisitNumber | Number | 1, 2, or 3 |
| VisitType | Choice | Initial, Follow-up, Final |
| VisitDate | Date | |
| Status | Choice | Draft, Submitted, Approved |
| ReportData | Multiple lines | JSON data |
| CreatedBy | Person | |

### 10. DivisionRequests List

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line | Request Number |
| ProjectId | Single line | Reference to Projects |
| RequestedDivision | Choice | Asphalt, Profiling, Spray |
| RequestedBy | Person | |
| RequestDate | Date | |
| Status | Choice | Pending, Accepted, Rejected, Completed |
| ResponseBy | Person | |
| ResponseDate | Date | |
| Notes | Multiple lines | |

### 11. ITPTemplates List

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line | Template name |
| Division | Choice | Asphalt, Profiling, Spray |
| TemplateData | Multiple lines | JSON template |
| IsActive | Yes/No | |
| Version | Number | |
| LastUpdated | Date | |

### 12. SamplingPlans List

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line | Plan name |
| ProjectId | Single line | Reference to Projects |
| PlanData | Multiple lines | JSON data |
| Status | Choice | Draft, Active, Completed |
| CreatedBy | Person | |

### 13. Drafts List

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line | Draft ID |
| EntityType | Choice | Job, QAPack, Incident, NCR, ScopeReport |
| EntityId | Single line | Reference to entity |
| DraftData | Multiple lines | JSON data |
| LastSaved | Date and Time | |
| SavedBy | Person | |

### 14. Notifications List

| Column Name | Type | Notes |
|-------------|------|-------|
| Title | Single line | Notification ID |
| UserId | Person | Target user |
| NotificationType | Choice | Info, Warning, Action Required |
| Message | Multiple lines | |
| IsRead | Yes/No | |
| CreatedDate | Date and Time | |
| LinkUrl | Hyperlink | Optional action link |

---

## 📁 Required Document Libraries

Create these 5 document libraries:

### 1. QA Packs
- Purpose: Store generated QA Pack PDFs
- Folder structure: `/Year/Month/JobNo/`

### 2. Job Sheets
- Purpose: Store job sheet PDFs
- Folder structure: `/Year/Month/JobNo/`

### 3. Site Photos
- Purpose: Store site photographs
- Folder structure: `/Year/Month/JobNo/`

### 4. Incident Reports
- Purpose: Store incident report PDFs and photos
- Folder structure: `/Year/IncidentNo/`

### 5. NCR Documents
- Purpose: Store NCR PDFs and supporting documents
- Folder structure: `/Year/NCRNo/`

---

## ⚡ Quick Setup with PowerShell

If you have PnP PowerShell installed, you can create lists programmatically:

```powershell
# Connect to SharePoint
Connect-PnPOnline -Url "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance" -Interactive

# Create Jobs list
New-PnPList -Title "Jobs" -Template GenericList
Add-PnPField -List "Jobs" -DisplayName "JobType" -InternalName "JobType" -Type Choice -Choices "Asphalt","Profiling","Spray"
Add-PnPField -List "Jobs" -DisplayName "Division" -InternalName "Division" -Type Choice -Choices "Asphalt","Profiling","Spray"
# ... add more fields

# Repeat for other lists
```

---

## ✅ Verification

After creating all lists, verify by:

1. Go to Site Contents in SharePoint
2. Confirm all 14 lists exist
3. Confirm all 5 document libraries exist
4. Test the app's health endpoint: `/api/health`

---

## 🔐 Permissions

Ensure your Azure AD app registration has these API permissions:
- `Sites.Read.All`
- `Sites.ReadWrite.All`
- `Files.ReadWrite.All`

And grant admin consent in Azure Portal.

---

## 📞 Support

If you encounter issues:
1. Check Azure AD app permissions
2. Verify site URL is correct
3. Check environment variables in Vercel
4. Review `/api/health` endpoint response
