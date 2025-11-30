# SharePoint Lists Setup Guide

This guide details all the SharePoint Lists and Document Libraries required for the SGA QA System.

## Prerequisites

- SharePoint site created: `https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance`
- Admin access to the SharePoint site
- Azure AD App Registration with Sites.ReadWrite.All permission

---

## Document Libraries

Create these document libraries for file storage:

### 1. QA Packs
- **Name:** QA Packs
- **Purpose:** Store generated QA Pack PDF documents
- **Structure:** Auto-organized by month (e.g., `/2025-11/`)

### 2. Job Sheets
- **Name:** Job Sheets
- **Purpose:** Store generated Job Sheet PDFs
- **Structure:** Auto-organized by month

### 3. Site Photos
- **Name:** Site Photos
- **Purpose:** Store site photographs from field workers
- **Structure:** Organized by Job Number

### 4. Incident Reports
- **Name:** Incident Reports
- **Purpose:** Store incident report documents and photos

### 5. NCR Documents
- **Name:** NCR Documents
- **Purpose:** Store Non-Conformance Report documents

---

## SharePoint Lists

### 1. Jobs
**Purpose:** Track all construction jobs

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | Job Number (e.g., "JOB-2025-001") |
| JobNo | Single line of text | Yes | Same as Title |
| Client | Single line of text | Yes | Client name |
| Division | Choice | Yes | Asphalt, Profiling, Spray |
| ProjectName | Single line of text | Yes | Project name |
| Location | Single line of text | Yes | Site location |
| ForemanId | Single line of text | Yes | Foreman user ID |
| ForemanEmail | Single line of text | No | Foreman email |
| JobDate | Date | Yes | Scheduled job date |
| DueDate | Date | No | Due date |
| Status | Choice | Yes | Pending, In Progress, Completed, On Hold |
| WorkDescription | Multiple lines | No | Description of work |
| Area | Number | No | Area in m² |
| Thickness | Number | No | Thickness in mm |
| ClientTier | Choice | No | Tier 1, Tier 2, Tier 3 |
| QaSpec | Single line of text | No | QA specification reference |
| ProjectId | Single line of text | No | Link to Projects list |
| AssignedCrewId | Single line of text | No | Assigned crew ID |
| JobSheetData | Multiple lines | No | JSON data |
| AsphaltDetails | Multiple lines | No | JSON data |
| ProfilingDetails | Multiple lines | No | JSON data |

### 2. Projects
**Purpose:** Track multi-division projects

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | Project Number |
| ProjectNumber | Single line of text | Yes | Same as Title |
| HandoverId | Single line of text | No | Link to Tenders |
| ProjectName | Single line of text | Yes | Project name |
| Client | Single line of text | Yes | Client name |
| ClientTier | Choice | Yes | Tier 1, Tier 2, Tier 3 |
| Location | Single line of text | Yes | Project location |
| ProjectOwnerId | Single line of text | Yes | Project owner user ID |
| ProjectOwnerDivision | Choice | Yes | Asphalt, Profiling, Spray |
| ScopingPersonId | Single line of text | No | Scoping person ID |
| EstimatedStartDate | Date | No | Estimated start |
| EstimatedEndDate | Date | No | Estimated end |
| ActualStartDate | Date | No | Actual start |
| ActualEndDate | Date | No | Actual end |
| Status | Choice | Yes | Scoping, Scheduled, In Progress, QA Review, Completed, On Hold |
| Divisions | Multiple lines | No | JSON array of divisions |
| JobIds | Multiple lines | No | JSON array of job IDs |
| ScopeReportIds | Multiple lines | No | JSON array of scope report IDs |

### 3. Tenders
**Purpose:** Track tender handovers

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | Handover Number |
| HandoverNumber | Single line of text | Yes | Same as Title |
| ClientName | Single line of text | Yes | Client name |
| ClientTier | Choice | Yes | Tier 1, Tier 2, Tier 3 |
| ClientId | Single line of text | No | Client reference |
| ProjectName | Single line of text | Yes | Project name |
| ProjectDescription | Multiple lines | No | Description |
| Location | Single line of text | Yes | Location |
| EstimatedStartDate | Date | No | Estimated start |
| EstimatedEndDate | Date | No | Estimated end |
| DivisionsRequired | Multiple lines | No | JSON object |
| ProjectOwnerId | Single line of text | No | Owner ID |
| ScopingPersonId | Single line of text | No | Scoping person ID |
| Status | Choice | Yes | Draft, Submitted, Approved, Converted |
| DateCreated | Date/Time | Yes | Creation date |
| CreatedById | Single line of text | Yes | Creator ID |

### 4. ScopeReports
**Purpose:** Track site scope visits

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | Report Number |
| ReportNumber | Single line of text | Yes | Same as Title |
| ProjectId | Single line of text | Yes | Link to Projects |
| VisitNumber | Number | Yes | 1, 2, or 3 |
| VisitType | Choice | Yes | Initial, Follow-up, Final |
| ScheduledDate | Date | Yes | Scheduled date |
| ActualDate | Date | No | Actual visit date |
| CompletedById | Single line of text | No | Completed by ID |
| SiteAccessibility | Multiple lines | No | JSON data |
| SurfaceCondition | Multiple lines | No | JSON data |
| Measurements | Multiple lines | No | JSON data |
| TrafficManagement | Multiple lines | No | JSON data |
| Utilities | Multiple lines | No | JSON data |
| Hazards | Multiple lines | No | JSON data |
| Recommendations | Multiple lines | No | Text recommendations |
| EstimatedDuration | Number | No | Days estimate |
| Photos | Multiple lines | No | JSON array of photo URLs |
| Signature | Multiple lines | No | Base64 signature |
| SignedAt | Date/Time | No | Signature timestamp |
| Status | Choice | Yes | Draft, Submitted, Approved |

### 5. DivisionRequests
**Purpose:** Cross-division coordination

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | Request Number |
| RequestNumber | Single line of text | Yes | Same as Title |
| ProjectId | Single line of text | Yes | Link to Projects |
| RequestedById | Single line of text | Yes | Requestor ID |
| RequestedDivision | Choice | Yes | Asphalt, Profiling, Spray |
| RequestedToId | Single line of text | No | Target person ID |
| WorkDescription | Multiple lines | Yes | Work description |
| Location | Single line of text | Yes | Location |
| RequestedDates | Multiple lines | No | JSON array of dates |
| Status | Choice | Yes | Pending, Accepted, Rejected, Completed, Cancelled |
| AssignedCrewId | Single line of text | No | Assigned crew |
| AssignedForemanId | Single line of text | No | Assigned foreman |
| ResponseNotes | Multiple lines | No | Response notes |
| ConfirmedDates | Multiple lines | No | JSON array |
| CompletedAt | Date/Time | No | Completion date |
| QaPackId | Single line of text | No | Link to QA Pack |

### 6. QAPacks
**Purpose:** Store QA Pack submissions

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | QAPack identifier |
| JobNo | Single line of text | Yes | Job number reference |
| Version | Number | Yes | Version number |
| Status | Choice | Yes | Draft, Submitted, Approved |
| SubmittedBy | Single line of text | No | Submitter ID |
| Timestamp | Date/Time | No | Submission time |
| Job | Multiple lines | No | JSON - full job data |
| SgaDailyReport | Multiple lines | No | JSON - daily report |
| AsphaltPlacement | Multiple lines | No | JSON - placement data |
| ItpChecklist | Multiple lines | No | JSON - ITP data |
| SiteRecord | Multiple lines | No | JSON - site record |
| Photos | Multiple lines | No | JSON - photo URLs |
| PdfUrl | Hyperlink | No | Link to PDF |
| ExpertSummary | Multiple lines | No | AI summary |
| ForemanSignature | Multiple lines | No | Base64 signature |
| ForemanPhotoUrl | Hyperlink | No | Photo URL |

### 7. Incidents
**Purpose:** Track safety incidents

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | Incident Number |
| IncidentNumber | Single line of text | Yes | Same as Title |
| Type | Choice | Yes | Incident, Near Miss, Hazard |
| DateOfIncident | Date | Yes | Incident date |
| Location | Single line of text | Yes | Location |
| JobNo | Single line of text | No | Job reference |
| ReportedBy | Single line of text | Yes | Reporter ID |
| Description | Multiple lines | Yes | Incident description |
| ImmediateAction | Multiple lines | No | Immediate actions taken |
| Photos | Multiple lines | No | JSON array of photos |
| Status | Choice | Yes | Open, Under Investigation, Closed |
| InvestigationNotes | Multiple lines | No | Investigation details |

### 8. NCRs
**Purpose:** Track Non-Conformance Reports

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | NCR Number |
| NCRNumber | Single line of text | Yes | Same as Title |
| JobNo | Single line of text | Yes | Job reference |
| DateRaised | Date | Yes | Date raised |
| RaisedBy | Single line of text | Yes | Raised by ID |
| Description | Multiple lines | Yes | NCR description |
| RootCause | Multiple lines | No | Root cause analysis |
| CorrectiveAction | Multiple lines | No | Corrective actions |
| PreventiveAction | Multiple lines | No | Preventive actions |
| Status | Choice | Yes | Open, In Progress, Closed |
| ClosedDate | Date | No | Closure date |
| ClosedBy | Single line of text | No | Closed by ID |

### 9. Foremen
**Purpose:** Store foreman/crew leader information

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | Foreman name |
| Name | Single line of text | Yes | Full name |
| Email | Single line of text | Yes | Email address |
| Division | Choice | Yes | Asphalt, Profiling, Spray |
| Phone | Single line of text | No | Phone number |
| Active | Yes/No | Yes | Is active |

### 10. Resources
**Purpose:** Track equipment and resources

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | Resource name |
| ResourceName | Single line of text | Yes | Same as Title |
| Type | Choice | Yes | Equipment, Vehicle, Tool |
| Division | Choice | No | Asphalt, Profiling, Spray |
| Status | Choice | Yes | Available, In Use, Maintenance |
| AssignedTo | Single line of text | No | Assignment reference |

### 11. ITPTemplates
**Purpose:** Store ITP checklist templates

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | Template name |
| TemplateName | Single line of text | Yes | Same as Title |
| Division | Choice | Yes | Asphalt, Profiling, Spray |
| Content | Multiple lines | Yes | JSON template data |
| Active | Yes/No | Yes | Is active |

### 12. SamplingPlans
**Purpose:** Track sampling plans

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | Plan name |
| PlanName | Single line of text | Yes | Same as Title |
| ProjectId | Single line of text | No | Project reference |
| Content | Multiple lines | Yes | JSON plan data |
| Status | Choice | Yes | Draft, Active, Completed |

### 13. Drafts
**Purpose:** Auto-save form drafts

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | Draft identifier |
| EntityType | Single line of text | Yes | Type of entity |
| EntityId | Single line of text | No | Entity reference |
| UserId | Single line of text | Yes | User ID |
| DraftData | Multiple lines | Yes | JSON draft content |
| LastSaved | Date/Time | Yes | Last save time |

### 14. Notifications
**Purpose:** In-app notifications

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | Notification title |
| Type | Choice | Yes | Info, Warning, Error, Success |
| Message | Multiple lines | Yes | Notification message |
| UserId | Single line of text | Yes | Target user |
| Read | Yes/No | Yes | Read status |
| Link | Hyperlink | No | Action link |
| CreatedAt | Date/Time | Yes | Creation time |

### 15. DailyReports
**Purpose:** Store daily report data separately

| Column Name | Type | Required | Notes |
|-------------|------|----------|-------|
| Title | Single line of text | Yes | Report identifier |
| ReportDate | Date | Yes | Report date |
| JobId | Single line of text | Yes | Job reference |
| Data | Multiple lines | Yes | JSON report data |
| SubmittedBy | Single line of text | Yes | Submitter ID |

---

## Setup Instructions

### Using SharePoint Admin

1. Navigate to your SharePoint site
2. Click **Site contents** > **New** > **List**
3. Create each list with the columns specified above
4. For Document Libraries, click **New** > **Document library**

### Using PowerShell (PnP)

```powershell
# Connect to SharePoint
Connect-PnPOnline -Url "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance" -Interactive

# Example: Create Jobs list
New-PnPList -Title "Jobs" -Template GenericList

# Add columns
Add-PnPField -List "Jobs" -DisplayName "JobNo" -InternalName "JobNo" -Type Text -Required
Add-PnPField -List "Jobs" -DisplayName "Client" -InternalName "Client" -Type Text -Required
Add-PnPField -List "Jobs" -DisplayName "Division" -InternalName "Division" -Type Choice -Choices "Asphalt","Profiling","Spray" -Required
# ... continue for all columns
```

### Using Power Automate

You can also create lists programmatically using Power Automate's SharePoint connector.

---

## Verification

After setup, call the health endpoint to verify configuration:

```
GET https://your-app.vercel.app/api/health
```

The response should show `sharepoint.configured: true`.

---

## Support

For issues with SharePoint setup, contact your Microsoft 365 administrator or refer to [Microsoft SharePoint documentation](https://docs.microsoft.com/sharepoint/).
