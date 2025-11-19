# Power Apps Model-Driven App - Admin Dashboard
## Complete Implementation Guide

## Overview

Model-driven apps are built on top of Dataverse and provide rich, data-centric interfaces perfect for complex business applications. This guide builds the administrative dashboard for engineers, HSEQ managers, schedulers, and management.

---

## Why Model-Driven App for Admins?

✅ **Built-in CRUD operations** - No need to build forms manually
✅ **Advanced filtering & search** - Out-of-the-box grid views
✅ **Business process flows** - Visual workflows (e.g., NCR approval)
✅ **Timeline controls** - Show audit history
✅ **Dashboards & charts** - Native Dataverse charts
✅ **Sitemap navigation** - Multi-level menus
✅ **Responsive design** - Works on desktop & tablet

---

## Part 1: Create the Model-Driven App

### Step 1: Initialize App

1. Go to [make.powerapps.com](https://make.powerapps.com)
2. Select your environment
3. Click **+ Create** → **Model-driven app**
4. Choose **Modern App Designer** (new experience)
5. Name: `SGA QA Pack - Admin Dashboard`
6. Description: `Administrative dashboard for QA pack management`
7. Click **Create**

### Step 2: Add Tables to the App

In the left **Pages** panel, click **+ Add page** → **Dataverse table**

Add these tables:
- ☑ msdyn_qapack
- ☑ msdyn_job
- ☑ msdyn_dailyreport
- ☑ msdyn_asphaltplacement
- ☑ msdyn_incident
- ☑ msdyn_ncr
- ☑ msdyn_samplingplan
- ☑ msdyn_crewmember
- ☑ msdyn_equipment
- ☑ msdyn_itptemplate
- ☑ msdyn_document

For each table, the designer will automatically create:
- Main grid view (list of records)
- Form (detail view)
- Associated views (related records)

---

## Part 2: Configure the Sitemap (Navigation)

The sitemap is the left navigation menu. Configure it to match this structure:

### Sitemap Structure

```
🏠 Home
├── 📊 Dashboard (Power BI)

📋 Quality Management
├── 🔍 QA Packs
├── 📑 Jobs
├── ⚠️ Reports to Review
└── 📦 Archive

🛡️ HSEQ
├── ⚡ Incidents
├── 📝 NCR Register
└── 🧪 Sampling Plans

📅 Scheduler
├── ➕ Create Job
├── 📥 Bulk Job Import
└── 📆 Weekly Planner

👥 Resources
├── 👷 Crew Management
├── 🚜 Equipment Register
└── ✓ ITP Templates

📚 Documents
├── 📄 Specifications
├── 📋 Procedures
└── 🎓 Training Materials

📈 Analytics
├── 📊 Divisional Dashboards
├── 📉 Quality Metrics
└── ✅ Compliance Reports
```

### Implementation:

1. In the App Designer, click **Navigation** (left panel)

2. **Add Area**: "Quality Management"
   - Icon: Choose "Quality" icon
   
3. **Add Group**: "Active Records"
   - **Add Subarea**: "QA Packs"
     - Entity: msdyn_qapack
     - Default view: "Active QA Packs"
   - **Add Subarea**: "Jobs"
     - Entity: msdyn_job
     - Default view: "All Jobs"
   - **Add Subarea**: "Reports to Review"
     - Entity: msdyn_qapack
     - Default view: "Pending Review" (create custom view)

4. **Add Group**: "Historical"
   - **Add Subarea**: "Archive"
     - Entity: msdyn_qapack
     - Default view: "Archived Reports"

5. Repeat for other areas (HSEQ, Scheduler, Resources, etc.)

---

## Part 3: Customize Forms

### QA Pack Main Form (Enhanced)

1. Navigate to **Tables** → **msdyn_qapack**
2. Click **Forms** → Select **Information** form
3. Open in **Form Designer**

#### Form Structure:

**Header Section (Always Visible):**
- Report ID (prominent)
- Status (status bar)
- Job lookup
- Version

**Tab 1: Summary**
- Section: Job Information
  - Job Number (read-only, from lookup)
  - Client (read-only)
  - Project Name (read-only)
  - Location (read-only)
  
- Section: Submission Details
  - Submitted By
  - Timestamp
  - Version
  
- Section: AI Executive Summary
  - Expert Summary (multiline, read-only)
  - Summary Status indicator

- Section: Documents
  - PDF URL (as hyperlink)
  - Foreman Photo (image preview)

**Tab 2: Daily Report**
- Sub-grid: Daily Report (1:1 relationship)
  - Shows related msdyn_dailyreport record
  - Click to open in-line or separate form
- Sub-grids for child records:
  - Works Performed
  - Labour
  - Plant Equipment
  - Trucks
  - On-Site Tests

**Tab 3: Asphalt Placement**
- Sub-grid: Asphalt Placement record
- Sub-grid: Placement Rows (with temperature compliance highlighting)

**Tab 4: ITP Checklist**
- Sub-grid: ITP Checklist
- Compliance percentage (calculated field - display as gauge chart)

**Tab 5: Photos**
- Sub-grid: Site Photos (gallery view)
- Sub-grid: Damage Photos (gallery view)

**Tab 6: Review**
- Section: Review Information
  - Status dropdown
  - Internal Notes (multiline)
  - Reviewed By
  - Review Date
  
- Section: Related Records
  - NCRs raised from this report (sub-grid)
  - Incidents referenced (sub-grid)

**Tab 7: Audit Trail**
- Sub-grid: Audit Log entries for this QA Pack
  - Filteredby entityid = current record
  - Shows all changes made to this record

#### Business Rules on Form:

**Rule 1: Status Change Validation**
```javascript
// Rule triggered when status changes to "Approved"
If (Status == "Approved") {
    Require: Internal Notes
    Require: Reviewed By
    Require: Review Date (auto-populate with today)
}
```

**Rule 2: Expert Summary Indicator**
```javascript
// Show loading spinner if summary is pending
If (Expert Summary Status == "Pending") {
    Show: Loading indicator
    Hide: Expert Summary field
}

If (Expert Summary Status == "Completed") {
    Show: Expert Summary field
    Hide: Loading indicator
}

If (Expert Summary Status == "Failed") {
    Show: Error message with retry button
}
```

### Job Form (Enhanced)

**Header:**
- Job Number
- Status
- Division badge (colored based on division)

**Tab 1: Details**
- Section: Basic Information
  - Client
  - Project Name
  - Location (with map integration if possible)
  - Division
  
- Section: Schedule
  - Job Date
  - Due Date
  - Assigned Foreman
  
- Section: Specifications
  - QA Spec
  - Area
  - Thickness
  - Required QA Forms (checklist)

**Tab 2: Job Sheet**
- Display job sheet data (if available)
- Link to job sheet PDF
- Edit job sheet button (opens custom page)

**Tab 3: QA Packs**
- Sub-grid: All QA pack submissions for this job (all versions)
- Highlight the latest version

**Tab 4: Related Records**
- Sub-grid: Incidents
- Sub-grid: NCRs
- Sub-grid: Sampling Plans

### Incident Form

**Header:**
- Incident Number
- Type (colored badge)
- Status

**Tab 1: Details**
- Reporter information
- Date/time of incident
- Location
- Description
- Immediate action taken
- Involved personnel
- Witnesses

**Tab 2: Photos**
- Photo gallery (sub-grid)
- Add photo button

**Tab 3: Investigation**
- Investigation findings (rich text)
- Corrective actions (rich text)
- Root cause analysis

**Tab 4: Sign-Offs**
- HSEQ Manager sign-off
  - Name (lookup)
  - Date (auto-populate)
  - Signature
- Admin sign-off
  - Name
  - Date
- Close-out details

**Tab 5: Related**
- Related job
- Related QA pack

**Business Process Flow:**
```
Open → Under Investigation → Corrective Actions → HSEQ Review → Admin Review → Closed
```

### NCR Form

**Header:**
- NCR Number
- Status (colored)
- Related Job

**Tab 1: Details**
- Job information
- Description of non-conformance
- Specification clause reference
- Date issued
- Issued by

**Tab 2: Analysis & Actions**
- Root cause analysis
- Proposed corrective action
- Preventative action
- Verification method

**Tab 3: Closure**
- Verified by
- Verification date
- Cost impact
- Closed by
- Close date

**Tab 4: Related**
- Related QA pack
- Related sampling plan

**Business Process Flow:**
```
Open → Under Review → Action Required → Verification → Closed
```

---

## Part 4: Custom Views

### QA Packs - Custom Views

#### View 1: "Pending Review"

**Columns:**
- Report ID
- Job Number (from lookup)
- Client (from lookup)
- Division (from lookup)
- Submitted By
- Timestamp
- Days Since Submission (calculated)
- Status

**Filter:**
- Status = "Pending Review"

**Sort:**
- Timestamp (oldest first)

#### View 2: "Requires Action"

**Filter:**
- Status = "Requires Action"

**Highlight:**
- Row color: Red tint

#### View 3: "My Division Reports" (for Engineers)

**Filter:**
- Job.Division = User's Division (dynamic)
- Status != "Archived"

#### View 4: "Temperature Non-Compliance"

**Filter:**
- Has Asphalt Placement
- Asphalt Placement.Temperature Compliance % < 95

**Highlight:**
- Temperature Compliance column in red if < 95%

### Jobs - Custom Views

#### View 1: "Jobs Due This Week"

**Filter:**
- Due Date >= Start of This Week
- Due Date <= End of This Week
- Status != "Completed"

**Sort:**
- Due Date (ascending)

#### View 2: "Overdue Jobs"

**Filter:**
- Due Date < Today
- Status != "Completed"

**Highlight:**
- Row color: Red tint

#### View 3: "Jobs Without QA Pack"

**Filter:**
- Job Date <= Today
- No related QA Pack exists

**This view shows jobs that should have been submitted**

### Incidents - Custom Views

#### View 1: "Open Incidents"

**Filter:**
- Status = "Open" OR Status = "Under Investigation"

**Sort:**
- Date of Incident (descending)

#### View 2: "Pending HSEQ Review"

**Filter:**
- Status = "Under Investigation"
- Investigation Findings is not blank
- HSEQ Sign-Off is blank

### NCRs - Custom Views

#### View 1: "Open NCRs by Job"

**Group By:**
- Job Number

**Filter:**
- Status != "Closed"

---

## Part 5: Custom Pages (Advanced)

Model-driven apps now support custom pages (embedded Canvas apps). Use these for complex interactions.

### Custom Page 1: Job Sheet Editor

**Purpose:** Rich interface for editing job sheet data with dynamic forms based on division

**Implementation:**
1. In App Designer, click **+ Add page** → **Custom page**
2. Name: "Job Sheet Editor"
3. Design Canvas page inside the model-driven app
4. Add context parameter: `JobID`

**Design:**
- Tabbed interface showing division-specific fields
- Asphalt: Plant location, mix details, equipment
- Profiling: Crew details, profilers, trucks, depth/tons
- Spray: Product details, spray rate, run details

### Custom Page 2: Bulk Job Import

**Purpose:** Upload Excel file to create multiple jobs at once

**Implementation:**
- File upload control
- Excel parsing (use Power Automate flow)
- Preview grid showing jobs to be created
- Validation indicators
- Bulk create button

### Custom Page 3: Sampling Plan Generator

**Purpose:** AI-powered core sampling plan generator

**Implementation:**
- Input form:
  - Start chainage
  - End chainage
  - Number of cores
  - Specification
- "Generate Plan" button (calls Power Automate/Azure Function)
- Results display:
  - Map showing core locations
  - Table of chainage positions
  - Export to PDF

---

## Part 6: Dashboards & Charts

### Dashboard 1: Executive Dashboard

**Layout:** 4 columns x 3 rows

**Widgets:**

Row 1 (KPIs):
- **Card 1:** Total QA Packs This Month
- **Card 2:** Pending Review Count
- **Card 3:** NCR Rate (%)
- **Card 4:** Incident Count This Month

Row 2 (Charts):
- **Chart 1:** QA Packs by Division (Donut)
  - Data: msdyn_qapack
  - Group by: Division (from Job lookup)
  - Value: Count
  
- **Chart 2:** Temperature Compliance Trend (Line)
  - Data: msdyn_asphaltplacement
  - X-axis: Week
  - Y-axis: Average Temperature Compliance %
  
- **Chart 3:** NCR Status Breakdown (Funnel)
  - Data: msdyn_ncr
  - Stages: Open → Review → Resolved → Closed

Row 3 (Lists):
- **Grid 1:** Reports Pending Review (top 10)
- **Grid 2:** Overdue Jobs (top 10)

### Dashboard 2: Quality Metrics

**Charts:**
- **ITP Compliance by Job** (Column chart)
- **Common Non-Conformance Reasons** (Bar chart, horizontal)
- **First-Time-Right Rate** (Gauge chart)
- **Rework Cost Trend** (Line chart with cost $)

### Dashboard 3: HSEQ Dashboard

**Charts:**
- **Incident Types Breakdown** (Pie chart)
- **Incidents by Month** (Column chart)
- **Open vs Closed Incidents** (Stacked column)
- **Days to Close Incidents** (Histogram)

---

## Part 7: Business Process Flows

### Process Flow 1: QA Pack Review Process

```
Stage 1: Submitted
↓ (Auto-transition when submitted)
Stage 2: Engineer Review
├── Field: Review Notes
├── Field: Any NCRs to raise?
└── Action: Approve / Request Changes
↓
Stage 3: Final Approval (if required)
├── Condition: Check if high-value job
├── Field: Management Notes
└── Action: Approve / Reject
↓
Stage 4: Archived
```

**Implementation:**
1. In solution, add **Business Process Flow**
2. Name: "QA Pack Review"
3. Primary entity: msdyn_qapack
4. Add stages as shown above
5. Add fields and conditions
6. Publish

### Process Flow 2: NCR Management

```
Stage 1: Reported
├── Field: Description
└── Field: Specification Reference
↓
Stage 2: Root Cause Analysis
├── Field: Root Cause
├── Field: Proposed Corrective Action
└── Action: Submit for Review
↓
Stage 3: Corrective Action
├── Field: Action Taken
├── Field: Verification Method
└── Action: Request Verification
↓
Stage 4: Verification
├── Field: Verified By
├── Field: Verification Date
└── Action: Close NCR
↓
Stage 5: Closed
```

### Process Flow 3: Incident Investigation

```
Stage 1: Reported
↓
Stage 2: Investigation
├── Field: Findings
├── Field: Corrective Actions
└── Action: Submit to HSEQ
↓
Stage 3: HSEQ Review
├── Field: HSEQ Manager Sign-Off
└── Action: Approve / Request More Info
↓
Stage 4: Admin Review
├── Field: Admin Sign-Off
└── Action: Close Incident
↓
Stage 5: Closed
```

---

## Part 8: Quick Actions & Command Bar Buttons

### QA Pack Form - Custom Buttons

**Button 1: "Generate AI Summary"**
```javascript
// Trigger Power Automate flow
Action: Run workflow
Workflow: "Generate AI Summary for QA Pack"
Parameters: QA Pack ID

// Show notification
Notification: "AI summary generation started. You'll be notified when complete."
```

**Button 2: "Raise NCR"**
```javascript
// Pre-populate NCR form with job details
Action: Open form
Entity: msdyn_ncr
Mode: New
Pre-populate:
  - Job: Current QA Pack's Job
  - Related QA Pack: Current QA Pack
  - Date Issued: Today
  - Issued By: Current User
```

**Button 3: "Download PDF"**
```javascript
// Open PDF URL in new window
Action: Open URL
URL: msdyn_pdfurl field value
Target: New window
```

**Button 4: "Email to Client"**
```javascript
// Open email with PDF attached
Action: Send email
To: Job.Client Contact Email
Subject: "QA Pack - {Job Number}"
Body: Template
Attachments: PDF URL
```

### Job Form - Custom Buttons

**Button 1: "Create Job Sheet PDF"**
```javascript
// Trigger flow to generate job sheet
Action: Run workflow
Workflow: "Generate Job Sheet PDF"
Parameters: Job ID
```

**Button 2: "Generate Sampling Plan"**
```javascript
// Open custom page
Action: Navigate to custom page
Page: "Sampling Plan Generator"
Parameters: Job ID
```

**Button 3: "Assign to Foreman"**
```javascript
// Quick assign dialog
Action: Open dialog
Show: Foreman dropdown (filtered by division)
On Save: Update job.AssignedForeman
Send notification to foreman
```

---

## Part 9: App Branding & Theming

### Configure App Theme

1. In App Designer, click **Settings** → **Theme**

2. **Logo:**
   - Upload company logo (transparent PNG)
   - Size: 200x60 pixels

3. **Colors:**
   ```
   Primary: #0078D4 (Microsoft Blue)
   Accent: #107C10 (Green for success)
   Navigation: #F3F2F1 (Light gray)
   Header Text: #FFFFFF (White)
   ```

4. **Division-Specific Accents:**
   - Asphalt: #F59E0B (Orange)
   - Profiling: #3B82F6 (Blue)
   - Spray: #8B5CF6 (Purple)

### Configure App Icon

1. Upload app icon (512x512 PNG)
2. This appears in app launcher and Teams

---

## Part 10: Security & Access

### Configure App Security Roles

The model-driven app automatically respects Dataverse security roles, but you need to assign the app to roles:

1. In App Designer, click **Settings** → **Security**
2. Check these roles:
   - ☑ Engineer
   - ☑ HSEQ Manager
   - ☑ Scheduler Admin
   - ☑ Management Admin

### Row-Level Security Example

**Scenario:** Engineers can only see jobs from their division

**Implementation:**
1. In Dataverse, edit the Engineer security role
2. For msdyn_job table:
   - Read: Organization (can see all jobs)
   - Write: Business Unit (can edit jobs in their BU)
   
3. Create a Dataverse view filter:
   ```javascript
   // Advanced Find filter
   Job.Division = User.Division
   ```

---

## Part 11: Publish & Deploy

### Pre-Deployment Checklist

- ☑ All forms designed and tested
- ☑ All views created and filtered
- ☑ Business process flows configured
- ☑ Security roles assigned
- ☑ Sitemap navigation complete
- ☑ Dashboards published
- ☑ Custom pages working
- ☑ Theme applied

### Publish

1. Click **Save**
2. Click **Publish**
3. Wait for publish to complete

### Share App

1. Click **Share**
2. Add security groups:
   - SGA-Engineers-Asphalt
   - SGA-Engineers-Profiling
   - SGA-HSEQ
   - SGA-Management
3. Set permissions: **User**

### Add to Microsoft Teams

1. In App Designer, click **Add to Teams**
2. Select team: "SGA Quality Management"
3. Configure:
   - Tab name: "QA Dashboard"
   - Add to channel: #quality-assurance
4. Click **Save**

---

## Part 12: User Training Guide

### Navigation Basics

**For Engineers:**
1. Open app from Teams or app launcher
2. Use left navigation to find QA packs
3. Click on a report to review
4. Use business process flow to guide review
5. Update status and add notes
6. Save and close

**Quick Actions:**
- Use search bar to find job numbers
- Use filters to show only your division
- Click "Raise NCR" button for non-conformances
- Use "Generate AI Summary" if summary failed

### Common Tasks

**Task 1: Review a QA Pack**
1. Navigate to: Quality Management → QA Packs
2. View: "Pending Review"
3. Click on report
4. Review all tabs (Daily Report, Asphalt, ITP, Photos)
5. Check AI summary
6. Update status to "Approved" or "Requires Action"
7. Add internal notes
8. Save

**Task 2: Create a Job**
1. Navigate to: Scheduler → Jobs
2. Click **+ New**
3. Fill in basic information
4. Add job sheet data (or use bulk import)
5. Assign to foreman
6. Save
7. Job sheet PDF is auto-generated and sent to Teams

**Task 3: Manage an Incident**
1. Navigate to: HSEQ → Incidents
2. Click on incident
3. Use business process flow:
   - Add investigation findings
   - Document corrective actions
   - Get HSEQ sign-off
   - Get admin sign-off
   - Close incident
4. All changes are audited

---

## Summary

This model-driven app provides a comprehensive, enterprise-grade interface for managing construction quality assurance. Key features:

✅ **No-code/low-code**: Built entirely in Power Apps
✅ **Role-based**: Different views for different roles
✅ **Process-driven**: Business process flows guide workflows
✅ **Audit-ready**: Complete change tracking
✅ **Integrated**: Seamless with Teams, SharePoint, Power BI
✅ **Scalable**: Handles millions of records
✅ **Secure**: Row-level and field-level security

**Next Steps:** Configure Power Automate flows for automations and PDF generation.
