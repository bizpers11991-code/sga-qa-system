#!/usr/bin/env python3
"""
Delegate PM_COPILOT_001 to Gemini 2.5 Pro
Project-Aware Copilot Integration
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

PROMPT = """# Task: PM_COPILOT_001 - Project-Aware Copilot Integration

## Overview
You are building an AI Copilot feature for the SGA Project Management system. This Copilot understands project context and can answer complex questions about projects, scheduling, QA compliance, and cross-division coordination.

## Your Mission
Create 7 new files that implement a project-aware AI Copilot using Gemini API.

## Deliverables

### 1. api/copilot-query.ts
API endpoint for Copilot queries:

```typescript
/**
 * POST /api/copilot-query
 * Body: {
 *   query: string;
 *   projectId?: string; // Optional project context
 *   userId: string;
 * }
 *
 * Returns: {
 *   response: string;
 *   sources?: string[]; // Source documents/data
 *   suggestedActions?: Action[];
 * }
 */
```

Features:
- Parse user query
- Identify entities (project, person, date, location)
- Retrieve relevant context from database
- Call Gemini API with context
- Format response with markdown
- Return sources and suggested actions

### 2. api/_lib/copilotHandler.ts
Copilot business logic and context management:

```typescript
/**
 * Main Copilot handler
 */
export async function handleCopilotQuery(
  query: string,
  userId: string,
  projectId?: string
): Promise<CopilotResponse>

/**
 * Build context for query
 */
export async function buildQueryContext(
  query: string,
  userId: string,
  projectId?: string
): Promise<string>

/**
 * Parse entities from query
 */
export function parseEntities(query: string): {
  projects: string[];
  people: string[];
  dates: string[];
  locations: string[];
}

/**
 * Format Copilot response with markdown
 */
export function formatCopilotResponse(rawResponse: string): {
  text: string;
  suggestedActions?: Action[];
}
```

Context building logic:
- If projectId provided: include full project details
- Parse query for project numbers/names
- Include relevant QA packs, scope reports, division requests
- Include user's role and permissions
- Limit context to 100K tokens

### 3. api/_lib/projectIndexer.ts
Project document indexing for Copilot:

```typescript
/**
 * Index project documents for fast retrieval
 */
export async function indexProject(projectId: string): Promise<boolean>

/**
 * Search indexed documents
 */
export async function searchProjectDocuments(
  query: string,
  projectId?: string
): Promise<Document[]>

/**
 * Get project summary for context
 */
export async function getProjectSummary(projectId: string): Promise<string>

/**
 * Update index when data changes
 */
export async function updateProjectIndex(
  projectId: string,
  documentType: string,
  documentId: string
): Promise<boolean>
```

Indexing strategy:
- Index project metadata
- Index scope report summaries
- Index QA pack data (compliance status)
- Index NCRs and incidents
- Cache in Redis with 1-hour TTL
- Background job to rebuild index daily

### 4. src/components/copilot/CopilotChat.tsx
Chat interface component:

Features:
- Slide-out panel from right side
- Full conversation history (stored in localStorage)
- Input field with autocomplete
- Context-aware suggestions ("Ask about...")
- Quick actions from responses (e.g., "View Project", "Schedule Visit")
- Export conversation as PDF
- Clear conversation button
- Loading indicator during query

UI/UX:
- User messages right-aligned (blue)
- Copilot responses left-aligned (gray)
- Markdown rendering for responses
- Code blocks with syntax highlighting
- Click project numbers to open project
- Responsive (works on mobile)

### 5. src/components/copilot/CopilotWidget.tsx
Dashboard widget for quick queries:

Features:
- Small card on dashboard
- Quick query input (one-line)
- 3-4 suggested queries based on role
- Recent queries (last 5)
- Click to expand to full chat
- Badge showing new insights

Suggested queries by role:
- asphalt_engineer: "Which projects need scope reports?", "Show my division requests"
- scheduler_admin: "Crew availability next week?", "Any scheduling conflicts?"
- hseq_manager: "Open NCRs summary", "Incident trends this month"

### 6. src/components/copilot/ProjectInsights.tsx
AI-generated project insights panel:

Location: Project detail page (right sidebar)

Features:
- Auto-generated project summary
- Risk indicators:
  - Schedule risk (behind schedule, crew unavailable)
  - Quality risk (open NCRs, missing QA packs)
  - Safety risk (incident patterns)
- Upcoming milestones with dates
- Action recommendations (e.g., "Schedule profiling crew", "Submit scope report")
- Refresh button to regenerate insights

Example insight:
```
📊 Project Summary
PRJ-2025-001 is 35% complete, on track for April 15 completion.

⚠️ Risks Identified
- Profiling crew not yet assigned for Week 2
- Scope Report #2 overdue by 3 days

📅 Upcoming Milestones
- Site Visit #3 (72-Hour): March 28
- Profiling Work: April 1-3
- Final QA Review: April 14

✅ Recommended Actions
1. Assign profiling crew for April 1-3
2. Complete Scope Report #2 by March 25
3. Schedule final inspection for April 14
```

### 7. m365-deployment/copilot/project_copilot_config.json
Copilot configuration:

```json
{
  "name": "SGA Project Copilot",
  "description": "AI assistant for SGA project management",
  "capabilities": [
    "project_queries",
    "cross_division_insights",
    "scheduling_assistance",
    "qa_compliance_check",
    "document_search"
  ],
  "context_sources": [
    "projects",
    "jobs",
    "scope_reports",
    "qa_packs",
    "ncrs",
    "incidents",
    "division_requests",
    "crew_schedules"
  ],
  "prompt_template": "You are the SGA Project Copilot...",
  "security": {
    "respect_permissions": true,
    "filter_by_role": true,
    "audit_all_queries": true
  }
}
```

## Example Queries and Expected Responses

**Query:** "How many days has Project PRJ-2025-001 been active?"

**Response:**
```
Project PRJ-2025-001 (Main Street Resurfacing) has been active for 12 days.

- Start Date: March 10, 2025
- Current Date: March 22, 2025
- Estimated Completion: April 15, 2025
- Days Remaining: 24 days

Status: On Track ✓
```

**Query:** "What NCRs are open for the Main Street project?"

**Response:**
```
Found 2 open NCRs for Main Street Resurfacing (PRJ-2025-001):

1. **NCR-2025-045** (March 18)
   - Issue: Asphalt temperature below spec (145°C, spec: 150-165°C)
   - Severity: Medium
   - Action: Re-check plant temperature controls
   - Assigned: John Smith (Asphalt Foreman)
   - Due: March 25

2. **NCR-2025-047** (March 20)
   - Issue: Missing density test for Chainage 200-250
   - Severity: Low
   - Action: Schedule density testing
   - Assigned: Sarah Jones (QA Officer)
   - Due: March 24

Recommended Action: Follow up with John and Sarah on NCR closures.
```

**Query:** "Which crews are available next Monday?"

**Response:**
```
Crew availability for Monday, March 25, 2025:

**Asphalt Division:**
✓ Crew A (Foreman: John Smith) - Available
✗ Crew B (Foreman: Mike Davis) - Assigned to PRJ-2025-003
✓ Crew C (Foreman: Tom Wilson) - Available

**Profiling Division:**
✓ Crew P1 (Foreman: Sarah Jones) - Available
✓ Crew P2 (Foreman: Emma Brown) - Available

**Spray Division:**
✗ Crew S1 (Foreman: Alex Lee) - On Leave
✓ Crew S2 (Foreman: Chris Taylor) - Available

Total: 5 crews available (60% capacity)
```

## Technical Requirements

### Gemini API Integration
- Use Gemini 2.5 Pro model
- Set temperature to 0.3 for consistency
- Max tokens: 8000 for responses
- System prompt defines Copilot personality
- Use function calling for actions

### Context Management
- Build context from multiple sources
- Prioritize recent data
- Include user's permissions in context
- Limit context to 100K tokens
- Cache frequently accessed data

### Security
- Respect user role permissions
- Filter data by access level
- Audit all queries (log to database)
- Rate limit: 20 queries per user per hour
- Don't expose sensitive data

### Performance
- Cache common queries (Redis, 5 min TTL)
- Response time target: < 3 seconds
- Background indexing for large projects
- Lazy load conversation history

### Error Handling
- Graceful fallback if Gemini API fails
- Show "Copilot unavailable" message
- Retry with exponential backoff
- Log all errors for debugging

## Code Style
- TypeScript strict mode
- Functional components with hooks
- Proper error boundaries
- Loading/error states
- JSDoc comments
- Markdown rendering with `react-markdown`

## Success Criteria
- Copilot answers project queries accurately
- Response time under 3 seconds
- Context-aware suggestions helpful
- Respects user permissions
- Works across all data types
- No TypeScript errors
- Follows existing code patterns

Begin implementation now. Provide all 7 files with complete, production-ready code.
"""

def main():
    print("="*60)
    print("Delegating PM_COPILOT_001 to Gemini 2.5 Pro")
    print("="*60)

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("ERROR: GOOGLE_API_KEY not found")
        sys.exit(1)

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')

    print("\nCalling Gemini 2.5 Pro...")

    try:
        response = model.generate_content(
            PROMPT,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,
                max_output_tokens=16000
            )
        )

        result = response.text

        # Save output
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = OUTPUT_DIR / f"PM_COPILOT_001_gemini_{timestamp}.md"

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"# PM_COPILOT_001 - Project-Aware Copilot\n")
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
