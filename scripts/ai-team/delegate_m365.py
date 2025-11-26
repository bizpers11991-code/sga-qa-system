#!/usr/bin/env python3
"""
Delegate PM_M365_001 to Gemini 2.5 Pro
SharePoint & Teams Integration for Project Management
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment
PROJECT_ROOT = Path(__file__).parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

OUTPUT_DIR = PROJECT_ROOT / "ai_team_output" / "project_management" / "deliverables"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PROMPT = """# Task: PM_M365_001 - SharePoint & Teams Integration

## Overview
You are implementing Microsoft 365 integration for the SGA QA System's project management module. This includes automatic SharePoint folder creation, Teams calendar synchronization, and Power Automate notification flows.

## Your Mission
Create 6 files that integrate SharePoint and Teams with the project management system.

## Deliverables

### 1. api/_lib/sharepoint-project.ts
SharePoint operations module for projects:

```typescript
/**
 * Create complete folder structure for a new project
 * Structure:
 * 02_Projects/{ProjectNumber}/
 *   ├── ScopeReports/
 *   ├── JobSheets/
 *   ├── ShiftPlans/
 *   ├── QAPacks/
 *   ├── NCRs/
 *   ├── Incidents/
 *   └── Photos/
 */
export async function createProjectFolders(
  projectNumber: string,
  projectName: string,
  client: string
): Promise<boolean>

/**
 * Upload document to correct project subfolder
 */
export async function uploadProjectDocument(
  projectNumber: string,
  subfolder: 'ScopeReports' | 'JobSheets' | 'QAPacks' | 'NCRs' | 'Incidents' | 'Photos',
  fileName: string,
  fileContent: Buffer | string
): Promise<string> // Returns file URL

/**
 * Set metadata on project folder
 */
export async function setProjectMetadata(
  projectNumber: string,
  metadata: {
    ProjectNumber: string;
    ProjectName: string;
    Client: string;
    ClientTier: string;
    ProjectOwner: string;
    Status: string;
  }
): Promise<boolean>

/**
 * Get all files in a project subfolder
 */
export async function getProjectFiles(
  projectNumber: string,
  subfolder: string
): Promise<Array<{ name: string; url: string; modifiedAt: string }>>
```

**Implementation Notes:**
- Use Microsoft Graph API (`@microsoft/microsoft-graph-client`)
- Site URL: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
- Document library: "Shared Documents"
- Use existing authentication from `api/_lib/sharepoint.ts`
- Handle errors gracefully (folder already exists = OK)

### 2. api/_lib/teams-project.ts
Teams operations module for projects:

```typescript
/**
 * Create calendar event for site visit
 */
export async function createSiteVisitEvent(
  projectName: string,
  visitType: '14-Day' | '7-Day' | '3-Day' | '72-Hour',
  scheduledDate: string,
  location: string,
  scopingPersonEmail: string,
  projectOwnerEmail: string
): Promise<string> // Returns event ID

/**
 * Create calendar event for job scheduling
 */
export async function createJobEvent(
  jobNo: string,
  projectName: string,
  division: 'Asphalt' | 'Profiling' | 'Spray',
  jobDate: string,
  foremanEmail: string,
  crewEmails: string[]
): Promise<string> // Returns event ID

/**
 * Post adaptive card to Teams channel
 */
export async function postToChannel(
  channelId: string,
  card: AdaptiveCard
): Promise<boolean>

/**
 * Create adaptive card for scope report submission
 */
export function createScopeReportCard(
  reportNumber: string,
  projectName: string,
  visitType: string,
  completedBy: string,
  findings: string,
  pdfUrl: string
): AdaptiveCard

/**
 * Create adaptive card for division request
 */
export function createDivisionRequestCard(
  requestNumber: string,
  fromEngineer: string,
  toEngineer: string,
  projectName: string,
  workDescription: string,
  requestedDates: string[],
  actionUrl: string
): AdaptiveCard

/**
 * Send Teams notification with @mention
 */
export async function sendMentionNotification(
  userEmail: string,
  message: string,
  actionUrl?: string
): Promise<boolean>
```

**Implementation Notes:**
- Use Microsoft Graph API for calendar and messages
- Calendar: Use shared calendar (get from config)
- Channels:
  - "Project Updates" for scope reports
  - "Division Coordination" for requests
- Adaptive Cards format: https://adaptivecards.io/
- Include proper @mention formatting

### 3. m365-deployment/power-automate/ProjectFolderCreation.json
Power Automate flow definition:

**Trigger:** When HTTP request is received
**Schema:**
```json
{
  "projectNumber": "PRJ-2025-001",
  "projectName": "Main Street Resurfacing",
  "client": "City Council",
  "clientTier": "Tier 1",
  "projectOwner": "john@sga.com.au"
}
```

**Actions:**
1. Parse JSON
2. Create folder `02_Projects/{projectNumber}`
3. Create 7 subfolders (ScopeReports, JobSheets, etc.)
4. Set folder metadata
5. Add to Projects SharePoint list
6. Respond with success

**Output:** Complete flow JSON ready to import

### 4. m365-deployment/power-automate/ScopeReportNotification.json
Power Automate flow definition:

**Trigger:** When file is created in `02_Projects/*/ScopeReports/`
**Actions:**
1. Get file properties
2. Parse project number from folder path
3. Get project metadata from list
4. Extract report data (if possible)
5. Post adaptive card to "Project Updates" channel
6. Send email to project owner
7. Update project status if needed

**Card Content:**
- Report number and visit type
- Project name
- Completed by
- Key findings summary
- Link to PDF

### 5. m365-deployment/power-automate/DivisionRequestFlow.json
Power Automate flow definition:

**Trigger:** When HTTP request is received
**Schema:**
```json
{
  "requestNumber": "REQ-2025-001",
  "projectId": "project_123",
  "projectName": "Main Street",
  "requestedBy": "asphalt.eng@sga.com.au",
  "requestedTo": "profiling.eng@sga.com.au",
  "division": "Profiling",
  "workDescription": "Mill 50mm",
  "requestedDates": ["2025-11-30", "2025-12-01"]
}
```

**Actions:**
1. Parse JSON
2. Post adaptive card to "Division Coordination" channel with @mention
3. Send email notification to division engineer
4. Create placeholder calendar event (tentative)
5. Respond with success

**Card Actions:**
- "Accept Request" button → webhook to app
- "Reject Request" button → webhook to app
- "View Project" link

### 6. m365-deployment/power-automate/SiteVisitReminder.json
Power Automate flow definition:

**Trigger:** Recurrence (Daily at 7:00 AM)
**Actions:**
1. Get current date
2. Query Projects SharePoint list for upcoming site visits (next 3 days)
3. For each visit:
   - Send email reminder to scoping person
   - Send Teams notification
   - Check if overdue → escalate to project owner
4. Post summary to Teams channel
5. Log execution

**Email Template:**
```
Subject: Site Visit Reminder - {ProjectName}
Body:
You have a {VisitType} site visit scheduled for {Date}

Project: {ProjectName}
Location: {Location}
Client: {Client} ({Tier})

Please complete the scope report within 24 hours of your visit.

[View Project] [Start Scope Report]
```

## Technical Requirements

### Authentication
Use existing MSAL integration from current app:
- Tenant ID: From environment
- Client ID: From environment
- Required scopes:
  - Files.ReadWrite.All
  - Sites.ReadWrite.All
  - Calendars.ReadWrite
  - ChannelMessage.Send
  - User.Read.All

### Error Handling
All functions should:
- Try/catch with specific error types
- Log errors to console and application log
- Return boolean success OR throw specific errors
- Include retry logic for transient failures (3 retries, exponential backoff)

### Configuration
Create config object in each file:
```typescript
const CONFIG = {
  SHAREPOINT_SITE_ID: process.env.SHAREPOINT_SITE_ID,
  SHAREPOINT_SITE_URL: 'https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance',
  PROJECTS_LIBRARY: 'Shared Documents/02_Projects',
  TEAMS_PROJECT_UPDATES_CHANNEL: process.env.TEAMS_PROJECT_UPDATES_CHANNEL_ID,
  TEAMS_DIVISION_CHANNEL: process.env.TEAMS_DIVISION_CHANNEL_ID,
  SHARED_CALENDAR_ID: process.env.TEAMS_SHARED_CALENDAR_ID
};
```

### Dependencies
Install if needed:
- `@microsoft/microsoft-graph-client`
- `@microsoft/microsoft-graph-types`
- `adaptivecards`

### Power Automate Flows
Each .json file should be complete and ready to import into Power Automate. Include:
- Schema version
- Trigger configuration
- All actions with proper connections
- Error handling actions
- Comments for each step

## Integration Points

### From API Routes
```typescript
// In api/create-project.ts
import { createProjectFolders, setProjectMetadata } from './_lib/sharepoint-project.js';
import { createSiteVisitEvent } from './_lib/teams-project.js';

// After creating project in Redis:
await createProjectFolders(projectNumber, projectName, client);
await setProjectMetadata(projectNumber, metadata);
```

### Webhook Endpoints Needed
Create these API routes to receive webhooks from Power Automate:
- `POST /api/webhooks/scope-report-submitted`
- `POST /api/webhooks/division-request-response`

## Output Format
For each file, provide complete, production-ready code:

```typescript
// File: <path>
<complete file contents>
```

For Power Automate .json files, provide complete flow definitions ready to import.

## Success Criteria
- Folders created automatically on project creation
- Documents stored in correct SharePoint locations
- Calendar events appear in shared Teams calendar
- Channel notifications posted with adaptive cards
- Reminders sent on schedule
- All error cases handled gracefully

Begin implementation now. Provide all 6 files.
"""

def main():
    print("="*60)
    print("Delegating PM_M365_001 to Gemini 2.5 Pro")
    print("="*60)

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("ERROR: GOOGLE_API_KEY not found")
        sys.exit(1)

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash-exp")

    print("\nCalling Gemini 2.5 Pro...")

    try:
        response = model.generate_content(
            PROMPT,
            generation_config=genai.GenerationConfig(
                temperature=0.3,
                max_output_tokens=16000
            )
        )

        result = response.text

        # Save output
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = OUTPUT_DIR / f"PM_M365_001_gemini_{timestamp}.md"

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"# PM_M365_001 - SharePoint & Teams Integration\n")
            f.write(f"## Worker: Gemini 2.5 Pro\n")
            f.write(f"## Timestamp: {timestamp}\n\n")
            f.write("---\n\n")
            f.write(result)

        print(f"\n✓ SUCCESS!")
        print(f"Output saved to: {output_file}")
        print(f"\nPreview (first 500 chars):")
        print("="*60)
        print(result[:500] + "...")

    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
