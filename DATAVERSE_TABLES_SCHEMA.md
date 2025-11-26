# Dataverse Tables Schema for SGA Project Management

## 📋 Overview

This document defines all Dataverse tables needed for the SGA Project Management System.

**Architecture:**
- Frontend: React app on Vercel
- Backend: Vercel serverless functions
- Database: Microsoft Dataverse
- Automation: Power Automate flows
- AI: Microsoft Copilot

---

## 🗄️ New Tables to Create

### 1. Tender Handovers (`cr3cd_tender`)

**Display Name:** Tender
**Plural Name:** Tenders
**Primary Column:** Handover Number (`cr3cd_handovernumber`)

#### Columns:

| Column Name | Display Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| `cr3cd_tenderId` | Tender | Unique Identifier | Yes | Primary Key (auto-generated) |
| `cr3cd_handovernumber` | Handover Number | Text (50) | Yes | e.g., "HO-2025-001" |
| `cr3cd_clientid` | Client ID | Text (100) | Yes | External client reference |
| `cr3cd_clientname` | Client Name | Text (200) | Yes | Client organization name |
| `cr3cd_clienttier` | Client Tier | Choice | Yes | Options: Tier 1, Tier 2, Tier 3 |
| `cr3cd_projectname` | Project Name | Text (300) | Yes | Name of the project |
| `cr3cd_projectdescription` | Project Description | Multiline Text (5000) | Yes | Detailed description |
| `cr3cd_location` | Location | Text (500) | Yes | Project location |
| `cr3cd_estimatedstartdate` | Estimated Start Date | Date Only | Yes | Expected start date |
| `cr3cd_estimatedenddate` | Estimated End Date | Date Only | Yes | Expected end date |
| `cr3cd_divisionsrequired` | Divisions Required | Multiline Text (500) | Yes | JSON array of divisions |
| `cr3cd_projectownerid` | Project Owner ID | Text (100) | Yes | User ID of project owner |
| `cr3cd_scopingpersonid` | Scoping Person ID | Text (100) | Yes | User ID of scoping person |
| `cr3cd_estimatedarea` | Estimated Area | Decimal (10,2) | No | Area in m² |
| `cr3cd_estimatedthickness` | Estimated Thickness | Decimal (10,2) | No | Thickness in mm |
| `cr3cd_asphaltplant` | Asphalt Plant | Text (200) | No | Plant location |
| `cr3cd_specialrequirements` | Special Requirements | Multiline Text (2000) | No | Special notes |
| `cr3cd_contractvalue` | Contract Value | Currency | No | Contract value |
| `cr3cd_contractnumber` | Contract Number | Text (100) | No | Contract reference |
| `cr3cd_purchaseordernumber` | Purchase Order Number | Text (100) | No | PO reference |
| `cr3cd_attachments` | Attachments | Multiline Text (2000) | No | JSON array of attachments |
| `cr3cd_status` | Status | Choice | Yes | Options: Draft, Submitted, In Progress, Completed, Cancelled |
| `cr3cd_datecreated` | Date Created | Date and Time | Yes | Auto-populated |
| `cr3cd_createdby` | Created By | Text (100) | Yes | User ID |

#### Choices (Option Sets):

**Client Tier:**
- Tier 1 (Value: 1)
- Tier 2 (Value: 2)
- Tier 3 (Value: 3)

**Status:**
- Draft (Value: 1)
- Submitted (Value: 2)
- In Progress (Value: 3)
- Completed (Value: 4)
- Cancelled (Value: 5)

---

### 2. Projects (`cr3cd_project`)

**Display Name:** Project
**Plural Name:** Projects
**Primary Column:** Project Number (`cr3cd_projectnumber`)

#### Columns:

| Column Name | Display Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| `cr3cd_projectId` | Project | Unique Identifier | Yes | Primary Key |
| `cr3cd_projectnumber` | Project Number | Text (50) | Yes | e.g., "PRJ-2025-001" |
| `cr3cd_projectname` | Project Name | Text (300) | Yes | Name of the project |
| `cr3cd_projectdescription` | Project Description | Multiline Text (5000) | No | Detailed description |
| `cr3cd_clientname` | Client Name | Text (200) | Yes | Client organization |
| `cr3cd_clienttier` | Client Tier | Choice | Yes | Tier 1/2/3 |
| `cr3cd_location` | Location | Text (500) | Yes | Project location |
| `cr3cd_estimatedstartdate` | Estimated Start Date | Date Only | Yes | Start date |
| `cr3cd_estimatedenddate` | Estimated End Date | Date Only | Yes | End date |
| `cr3cd_actualstartdate` | Actual Start Date | Date Only | No | Actual start |
| `cr3cd_actualenddate` | Actual End Date | Date Only | No | Actual end |
| `cr3cd_projectownerid` | Project Owner ID | Text (100) | Yes | User ID |
| `cr3cd_divisions` | Divisions | Multiline Text (2000) | Yes | JSON array of divisions |
| `cr3cd_status` | Status | Choice | Yes | Not Started, In Progress, Completed, On Hold, Cancelled |
| `cr3cd_totaltonnes` | Total Tonnes | Decimal (10,2) | No | Total tonnage |
| `cr3cd_totalarea` | Total Area | Decimal (10,2) | No | Total area m² |
| `cr3cd_contractvalue` | Contract Value | Currency | No | Contract value |
| `cr3cd_tenderid` | Tender | Lookup | No | Related tender |
| `cr3cd_datecreated` | Date Created | Date and Time | Yes | Auto-populated |
| `cr3cd_createdby` | Created By | Text (100) | Yes | User ID |

#### Choices:

**Status:**
- Not Started (Value: 1)
- In Progress (Value: 2)
- Completed (Value: 3)
- On Hold (Value: 4)
- Cancelled (Value: 5)

#### Relationships:
- Many-to-One with `cr3cd_tender` (tender to project)

---

### 3. Scope Reports (`cr3cd_scopereport`)

**Display Name:** Scope Report
**Plural Name:** Scope Reports
**Primary Column:** Report Number (`cr3cd_reportnumber`)

#### Columns:

| Column Name | Display Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| `cr3cd_scopereportId` | Scope Report | Unique Identifier | Yes | Primary Key |
| `cr3cd_reportnumber` | Report Number | Text (50) | Yes | e.g., "SR-2025-001-V1" |
| `cr3cd_projectid` | Project | Lookup | Yes | Related project |
| `cr3cd_visitnumber` | Visit Number | Whole Number | Yes | 1, 2, or 3 |
| `cr3cd_visitdate` | Visit Date | Date Only | Yes | Date of visit |
| `cr3cd_visitedby` | Visited By | Text (100) | Yes | User ID |
| `cr3cd_location` | Location | Text (500) | Yes | Site location |
| `cr3cd_gpslocation` | GPS Location | Multiline Text (200) | No | JSON {lat, lng} |
| `cr3cd_siteaccessibility` | Site Accessibility | Multiline Text (3000) | Yes | JSON object |
| `cr3cd_surfacecondition` | Surface Condition | Multiline Text (3000) | Yes | JSON object |
| `cr3cd_measurements` | Measurements | Multiline Text (3000) | Yes | JSON object |
| `cr3cd_hazards` | Hazards | Multiline Text (3000) | Yes | JSON array |
| `cr3cd_photos` | Photos | Multiline Text (2000) | No | JSON array |
| `cr3cd_observations` | Observations | Multiline Text (5000) | No | General notes |
| `cr3cd_recommendations` | Recommendations | Multiline Text (5000) | No | Recommendations |
| `cr3cd_status` | Status | Choice | Yes | Draft, Submitted, Approved, Rejected |
| `cr3cd_datecreated` | Date Created | Date and Time | Yes | Auto-populated |
| `cr3cd_createdby` | Created By | Text (100) | Yes | User ID |

#### Choices:

**Status:**
- Draft (Value: 1)
- Submitted (Value: 2)
- Approved (Value: 3)
- Rejected (Value: 4)

#### Relationships:
- Many-to-One with `cr3cd_project` (project to scope reports)

---

### 4. Division Requests (`cr3cd_divisionrequest`)

**Display Name:** Division Request
**Plural Name:** Division Requests
**Primary Column:** Request Number (`cr3cd_requestnumber`)

#### Columns:

| Column Name | Display Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| `cr3cd_divisionrequestId` | Division Request | Unique Identifier | Yes | Primary Key |
| `cr3cd_requestnumber` | Request Number | Text (50) | Yes | e.g., "DR-2025-001" |
| `cr3cd_projectid` | Project | Lookup | Yes | Related project |
| `cr3cd_requestedby` | Requested By | Text (100) | Yes | User ID |
| `cr3cd_requesteddivision` | Requested Division | Choice | Yes | Asphalt, Profiling, Spray |
| `cr3cd_requestingdivision` | Requesting Division | Choice | Yes | Asphalt, Profiling, Spray |
| `cr3cd_requestdate` | Request Date | Date and Time | Yes | When requested |
| `cr3cd_requiredfrom` | Required From | Date Only | Yes | Start date needed |
| `cr3cd_requiredto` | Required To | Date Only | Yes | End date needed |
| `cr3cd_crewsizeNeeded` | Crew Size Needed | Whole Number | Yes | Number of crew |
| `cr3cd_equipmentneeded` | Equipment Needed | Multiline Text (1000) | No | Equipment list |
| `cr3cd_reason` | Reason | Multiline Text (2000) | Yes | Why needed |
| `cr3cd_priority` | Priority | Choice | Yes | Low, Medium, High, Urgent |
| `cr3cd_status` | Status | Choice | Yes | Pending, Accepted, Rejected, etc. |
| `cr3cd_respondedby` | Responded By | Text (100) | No | User ID |
| `cr3cd_responsedate` | Response Date | Date and Time | No | When responded |
| `cr3cd_responsetype` | Response Type | Choice | No | Accepted, Rejected, Conditional |
| `cr3cd_responsemessage` | Response Message | Multiline Text (2000) | No | Response notes |
| `cr3cd_assignedcrews` | Assigned Crews | Multiline Text (1000) | No | JSON array |
| `cr3cd_assignedforeman` | Assigned Foreman | Text (100) | No | Foreman ID |
| `cr3cd_completiondate` | Completion Date | Date and Time | No | When completed |
| `cr3cd_datecreated` | Date Created | Date and Time | Yes | Auto-populated |

#### Choices:

**Division:**
- Asphalt (Value: 1)
- Profiling (Value: 2)
- Spray (Value: 3)

**Priority:**
- Low (Value: 1)
- Medium (Value: 2)
- High (Value: 3)
- Urgent (Value: 4)

**Status:**
- Pending (Value: 1)
- Accepted (Value: 2)
- Rejected (Value: 3)
- Conditional (Value: 4)
- Completed (Value: 5)
- Cancelled (Value: 6)

**Response Type:**
- Accepted (Value: 1)
- Rejected (Value: 2)
- Conditional (Value: 3)

#### Relationships:
- Many-to-One with `cr3cd_project` (project to division requests)

---

### 5. Crew Availability (`cr3cd_crewavailability`)

**Display Name:** Crew Availability
**Plural Name:** Crew Availability
**Primary Column:** Crew Name (`cr3cd_crewname`)

#### Columns:

| Column Name | Display Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| `cr3cd_crewavailabilityId` | Crew Availability | Unique Identifier | Yes | Primary Key |
| `cr3cd_crewid` | Crew ID | Text (50) | Yes | e.g., "CREW_A1" |
| `cr3cd_crewname` | Crew Name | Text (200) | Yes | Crew name |
| `cr3cd_division` | Division | Choice | Yes | Asphalt, Profiling, Spray |
| `cr3cd_available` | Available | Two Options (Yes/No) | Yes | Current availability |
| `cr3cd_crewsize` | Crew Size | Whole Number | Yes | Number of members |
| `cr3cd_foremanid` | Foreman ID | Text (100) | No | Assigned foreman |
| `cr3cd_currentjobid` | Current Job ID | Text (100) | No | If assigned |
| `cr3cd_availablefrom` | Available From | Date Only | No | Next available |
| `cr3cd_skills` | Skills | Multiline Text (1000) | No | JSON array |
| `cr3cd_equipment` | Equipment | Multiline Text (1000) | No | JSON array |

---

## 🔧 How to Create Tables in Dataverse

### Step 1: Access Power Apps Maker Portal

1. Go to https://make.powerapps.com
2. Select your environment
3. Navigate to **Tables** → **New table** → **New table**

### Step 2: Create Each Table

For each table above:

1. **Create the table:**
   - Click "New table"
   - Enter Display Name (e.g., "Tender")
   - Enter Plural Name (e.g., "Tenders")
   - Change Primary Column name and display name
   - Click "Save"

2. **Add columns:**
   - Click "+ New" → "Column"
   - Enter Display Name
   - Select Data Type
   - Set Required (if needed)
   - Click "Save"

3. **Create Choice columns:**
   - For Choice type columns:
     - Select "Choice" as data type
     - Click "+ New choice" or use global choice
     - Add options with display names and values
     - Click "Save"

4. **Create Lookup relationships:**
   - Click "+ New" → "Relationship"
   - Select "Many-to-one"
   - Select related table
   - Click "Done"

### Step 3: Set Permissions

1. Go to **Settings** → **Security Roles**
2. Edit roles to grant access:
   - System Administrator: Full access
   - Your custom roles: Read/Write as needed

---

## 📊 Table Relationships

```
cr3cd_tender (1) ----→ (Many) cr3cd_project
                               ↓
                               ↓ (1)
                               ↓
                         (Many) cr3cd_scopereport

cr3cd_project (1) ----→ (Many) cr3cd_divisionrequest
```

---

## 🔑 API Mapping

### Logical Names to Use in Code:

```typescript
export const DataverseTables = {
  Tender: 'cr3cd_tenders',
  Project: 'cr3cd_projects',
  ScopeReport: 'cr3cd_scopereports',
  DivisionRequest: 'cr3cd_divisionrequests',
  CrewAvailability: 'cr3cd_crewavailabilities'
};
```

### Field Name Format:

All field names in API calls must be **lowercase** without underscores:
- `cr3cd_projectname` (in schema)
- `cr3cd_projectname` (in API)

---

## 🧪 Test Data

After creating tables, add test data:

1. One tender (Draft status)
2. One project linked to the tender
3. One scope report for the project
4. One division request for the project
5. A few crew availability records

---

## ✅ Verification Checklist

- [ ] All 5 tables created in Dataverse
- [ ] All columns added with correct data types
- [ ] All choice columns configured
- [ ] All lookup relationships created
- [ ] Security roles configured
- [ ] Test data added
- [ ] Can query tables via API

---

**Next Step:** Once tables are created, I'll update all the API code to use Dataverse instead of Redis.
