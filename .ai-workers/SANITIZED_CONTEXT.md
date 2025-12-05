# 🤖 AI Worker Context - Backend Development
**CONFIDENTIAL - For AI Workers Only**
**Sensitive information REDACTED**

## Project Overview
**Name:** SGA QA System
**Type:** Quality Assurance Management for Construction
**Tech Stack:** Next.js, TypeScript, React, Vercel
**Backend:** Next.js API Routes + SharePoint

## Environment Configuration (SANITIZED)

### SharePoint Integration
```typescript
SHAREPOINT_SITE_URL: "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance"
AZURE_TENANT_ID: process.env.AZURE_TENANT_ID  // Set in Vercel
AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID  // Set in Vercel
AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET  // Set in Vercel
```

### Authentication
- Using Microsoft MSAL for authentication
- Backend uses @azure/msal-node
- Frontend uses @azure/msal-react (already implemented)
- Service account authentication for SharePoint access

### Deployment
- Platform: Vercel (serverless)
- Auto-deploy on push to main
- Environment variables set in Vercel dashboard

## Architecture Requirements

### API Structure
```
api/
├── auth/
│   ├── me.ts              # GET current user
│   └── validate-token.ts   # Token validation
├── jobs/
│   ├── create.ts          # POST /api/jobs/create
│   ├── [id].ts            # GET/PUT/DELETE /api/jobs/[id]
│   └── list.ts            # GET /api/jobs
├── projects/
│   ├── create.ts
│   ├── [id].ts
│   ├── list.ts
│   └── update-status.ts
├── tenders/
│   ├── create-handover.ts
│   ├── [id].ts
│   └── list.ts
├── scope-reports/
│   ├── submit.ts
│   ├── [id].ts
│   └── list.ts
└── division-requests/
    ├── create.ts
    ├── respond.ts
    ├── [id].ts
    └── list.ts
```

### Library Structure
```
src/lib/
├── sharepoint/
│   ├── connection.ts      # SP client setup
│   ├── auth.ts            # MSAL backend auth
│   ├── lists.ts           # List CRUD operations
│   └── documents.ts       # Document library operations
├── auth/
│   ├── middleware.ts      # API route auth middleware
│   └── permissions.ts     # Role-based checks
├── validation/
│   └── schemas.ts         # Zod validation schemas
└── errors/
    └── api-error.ts       # Error handling
```

## Data Models (From Frontend Types)

### Job
```typescript
interface Job {
  id: string;
  jobNumber: string;
  jobType: 'Asphalt' | 'Profiling' | 'Spray';
  projectId?: string;
  location: string;
  scheduledDate: Date;
  assignedCrewId?: string;
  assignedForemanId: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'On Hold';
  workDescription: string;
  // ... more fields
}
```

### Project
```typescript
interface Project {
  id: string;
  projectNumber: string;
  projectName: string;
  handoverId?: string;
  client: string;
  clientTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  location: string;
  projectOwnerId: string;
  scopingPersonId?: string;
  status: 'Scoping' | 'Scheduled' | 'In Progress' | 'QA Review' | 'Completed' | 'On Hold';
  divisions: ProjectDivision[];
  // ... more fields
}
```

## Security Requirements

### All API Routes Must:
1. **Authenticate requests** - Verify MSAL token
2. **Validate input** - Use Zod schemas
3. **Check permissions** - Role-based access
4. **Log activities** - Audit trail
5. **Handle errors** - Gracefully with proper status codes
6. **Sanitize output** - No sensitive data leaks

### DO NOT Include in Code:
- ❌ Actual API keys
- ❌ Real credentials
- ❌ Secret tokens
- ❌ Personal information
- ❌ Internal URLs (use env vars)

### DO Include:
- ✅ Environment variable references: `process.env.AZURE_CLIENT_ID`
- ✅ Type definitions
- ✅ Validation logic
- ✅ Error handling
- ✅ Comments and documentation

## SharePoint Lists Schema

### Jobs List Columns:
- Title (Job Number)
- JobType (Choice)
- ProjectID (Lookup)
- Location (Text)
- ScheduledDate (DateTime)
- AssignedCrew (Lookup)
- Status (Choice)
- WorkDescription (Note)
- CreatedBy (Person)
- Modified (DateTime)

### Projects List Columns:
- Title (Project Number)
- ProjectName (Text)
- HandoverID (Lookup)
- Client (Text)
- ClientTier (Choice)
- Location (Location)
- ProjectOwner (Person)
- Status (Choice)
- EstimatedStartDate (Date)
- EstimatedEndDate (Date)

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types
- Proper error handling
- Async/await (no callbacks)

### Next.js API Routes
```typescript
// Standard structure
import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/auth/middleware';
import { JobSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const user = await validateAuth(request);

    // 2. Parse and validate
    const body = await request.json();
    const validated = JobSchema.parse(body);

    // 3. Check permissions
    if (!hasPermission(user, 'create_job')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 4. Perform operation
    const result = await createJob(validated);

    // 5. Log activity
    await logActivity('Created', 'Job', result.id, user.id);

    // 6. Return success
    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    return handleError(error);
  }
}
```

### Error Handling
```typescript
class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

// Usage
throw new ApiError(400, 'Invalid job number', 'INVALID_JOB_NUMBER');
```

## Testing Requirements

### Each API Should Include:
- Unit tests for validation
- Integration tests for SharePoint
- Error case tests
- Permission tests

### Test Structure:
```typescript
describe('POST /api/jobs/create', () => {
  it('should create job with valid data', async () => {
    // Test implementation
  });

  it('should reject unauthenticated requests', async () => {
    // Test implementation
  });

  it('should validate required fields', async () => {
    // Test implementation
  });
});
```

## Dependencies Already Installed
- @azure/msal-react (frontend)
- @azure/msal-browser (frontend)
- react, next, typescript
- tailwindcss

## Dependencies to Install
- @pnp/sp
- @pnp/graph
- @azure/msal-node
- zod
- date-fns

## Success Criteria

### Your code must:
1. ✅ Build without TypeScript errors
2. ✅ Follow existing code patterns
3. ✅ Include proper error handling
4. ✅ Have input validation
5. ✅ Use environment variables (not hardcoded values)
6. ✅ Include JSDoc comments
7. ✅ Be production-ready

## Important Notes

- **Use existing frontend types** from `src/types.ts` and `src/types/project-management.ts`
- **Match existing API patterns** from `src/services/*.ts` (these are the client-side callers)
- **SharePoint integration** should be abstracted in `src/lib/sharepoint/`
- **All sensitive data** comes from `process.env.*`
- **No mock data** in production code (only in tests)

## Questions?
- Check existing frontend services for expected API contracts
- Look at src/types for data models
- Use environment variables for all config
- Focus on type safety and error handling

---

**Remember:** Your code will be reviewed and integrated by the master orchestrator. Focus on quality over speed!
