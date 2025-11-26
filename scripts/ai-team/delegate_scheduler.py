#!/usr/bin/env python3
"""
Delegate PM_SCHEDULER_001 to DeepSeek V3
Enhanced Scheduler with Project Awareness
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# Load environment
PROJECT_ROOT = Path(__file__).parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

OUTPUT_DIR = PROJECT_ROOT / "ai_team_output" / "project_management" / "deliverables"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PROMPT = """# Task: PM_SCHEDULER_001 - Enhanced Project-Aware Scheduler

## Overview
You are building an enhanced scheduler for the SGA QA System that adds project awareness to the existing scheduler. This scheduler handles crew assignments across multiple divisions (Asphalt, Profiling, Spray) for complex multi-day projects.

## Context: Existing Scheduler
The system currently has a basic scheduler at `src/pages/scheduler/SchedulerPage.tsx`. We need to enhance it to be project-aware without breaking existing functionality.

## Your Mission
Create 9 new files that add project-aware scheduling capabilities to the SGA QA System.

## Deliverables

### 1. src/pages/scheduler/ProjectScheduler.tsx
Main page component with 4 view modes:
- Week View (enhanced current weekly calendar)
- Month View (month overview with project bars)
- Gantt View (project timeline with dependencies)
- Resources View (crew and equipment allocation)

Features:
- Filter by Division (All/Asphalt/Profiling/Spray)
- Filter by Crew
- Filter by Project Owner
- Filter by Status
- Project grouping (show jobs grouped by project)
- Conflict detection visual indicators

### 2. src/components/scheduler/ProjectCalendar.tsx
Calendar component that shows projects with jobs grouped underneath:
- Use react-big-calendar or @fullcalendar/react
- Display project bars spanning multiple days
- Individual job events nested under projects
- Color coding by division
- Click handlers for projects and jobs
- Tooltips showing details on hover

### 3. src/components/scheduler/CrewAvailability.tsx
Panel showing crew availability:
- List all crews by division
- Show current assignment (if any)
- Show upcoming assignments for next 7 days
- Visual availability calendar (green = available, red = booked)
- Click to filter calendar by crew

### 4. src/components/scheduler/ResourceAllocation.tsx
Resource planning panel:
- Crews section: list with availability status
- Equipment section: list with allocation status
- Drag-drop interface to assign resources
- Statistics: X of Y crews available on selected date
- Warnings for over-allocation

### 5. src/components/scheduler/ProjectGantt.tsx
Gantt chart view for projects:
- One row per active project
- Project duration bar (full width)
- Division work periods as sub-bars with color coding
- Site visit milestone markers
- Today line indicator
- Zoom controls (day/week/month)
- Click to open project details

### 6. src/components/scheduler/CrewCard.tsx
Draggable crew card component:
- Crew name and division badge
- Current assignment (if any)
- Drag handle for drag-drop operations
- Status indicator (Available/Assigned/On Leave)
- Click to view crew details

### 7. src/hooks/useCrewAvailability.ts
Custom hook for crew availability logic:
```typescript
interface CrewAvailabilityHook {
  crews: CrewAvailability[];
  getAvailableCrews: (date: string, division: string) => CrewAvailability[];
  assignCrew: (crewId: string, jobId: string, date: string) => Promise<boolean>;
  checkConflict: (crewId: string, date: string) => boolean;
  loading: boolean;
  error: Error | null;
}
```

### 8. api/get-crew-availability.ts
API endpoint to fetch crew availability:
- GET /api/get-crew-availability?division=Asphalt&startDate=2025-11-26&endDate=2025-12-02
- Returns array of crews with their assignments
- Uses Redis to fetch job assignments
- Calculates availability based on assigned jobs

### 9. api/assign-crew-to-job.ts
API endpoint to assign crew to job:
- POST /api/assign-crew-to-job
- Body: { crewId, jobId, date, foremanId? }
- Validates crew is available
- Updates job assignment in Redis
- Returns success/error

## Technical Requirements

### Types to Use
Import from `src/types/project-management.ts`:
- CrewAvailability
- ResourceAllocation
- SchedulerView
- SchedulerFilters

Import from `src/types.ts`:
- Job
- Project
- CrewResource

### API Integration
Use existing services:
- `src/services/projectsApi.ts` for project data
- `src/services/jobsApi.ts` for job data
- Create new functions in services for crew operations

### Scheduling Logic

**Conflict Detection:**
- Same crew cannot be in two places same day
- Show warning icon if crew already assigned
- Block assignment if crew is confirmed elsewhere

**Project Priority:**
- Tier 1 clients: Highest priority (red indicator)
- Tier 2 clients: Medium priority (yellow indicator)
- Tier 3 clients: Standard priority (green indicator)

**Auto-Suggestions:**
- Suggest available crews for a job based on:
  - Division match
  - Date availability
  - Proximity to other jobs (if location data available)

### UI/UX Requirements
- Mobile responsive (work on iPad)
- Keyboard shortcuts (n = new job, w/m/g/r = switch views)
- Loading states for all data fetches
- Error boundaries for graceful failures
- Optimistic UI updates (update UI immediately, rollback on error)
- Toast notifications for successes/errors

### Performance
- Lazy load calendar events (fetch only visible date range)
- Cache crew availability for 5 minutes
- Debounce drag-drop operations
- Virtual scrolling for long lists (100+ crews)

### Libraries Allowed
- react-big-calendar OR @fullcalendar/react (calendar)
- react-beautiful-dnd OR @dnd-kit (drag-drop)
- date-fns (date operations)
- zustand OR redux (state management if needed)

## Code Style
- TypeScript strict mode (no `any`)
- Functional components with hooks
- Tailwind CSS for styling
- JSDoc comments on all exported functions
- Error handling with try/catch
- Proper loading/error states

## Example Integration

The ProjectScheduler should be accessible from navigation and integrate with existing scheduler:

```typescript
// In src/routing/routes.tsx
{
  path: '/scheduler/projects',
  element: <ProjectScheduler />
}
```

## Output Format
For each file, provide complete, production-ready code:

```typescript
// File: <path>
<complete file contents>
```

## Success Criteria
- All views render correctly
- Drag-drop assignment works smoothly
- Conflicts detected and shown with warning
- Project grouping visible in calendar
- Performance good with 100+ jobs
- No TypeScript errors
- Follows existing code patterns

Begin implementation now. Provide all 9 files.
"""

def main():
    print("="*60)
    print("Delegating PM_SCHEDULER_001 to DeepSeek V3")
    print("="*60)

    api_key = os.getenv("OPENROUTER_API_KEY_2")
    if not api_key:
        print("ERROR: OPENROUTER_API_KEY_2 not found")
        sys.exit(1)

    client = OpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1"
    )

    print("\nCalling DeepSeek V3...")

    try:
        response = client.chat.completions.create(
            model="deepseek/deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert software architect and React developer specializing in complex scheduling systems. You write production-ready, well-documented code."
                },
                {
                    "role": "user",
                    "content": PROMPT
                }
            ],
            temperature=0.3,
            max_tokens=16000
        )

        result = response.choices[0].message.content

        # Save output
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = OUTPUT_DIR / f"PM_SCHEDULER_001_deepseek_{timestamp}.md"

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"# PM_SCHEDULER_001 - Enhanced Scheduler\n")
            f.write(f"## Worker: DeepSeek V3\n")
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
