# SGA QA System - Master Instructions

**Last Updated:** December 3, 2025
**Version:** 1.1.0
**Status:** Production Ready

---

## What This Project Is

A **Quality Assurance management system** for Safety Grooving Australia (SGA), a construction company specializing in asphalt, profiling, and spray works. The app manages:

- **Tenders** - Project handovers when company wins a job
- **Projects** - Multi-job project tracking with Tier 1/2/3 client tiers
- **Jobs** - Daily work assignments for crews
- **QA Packs** - Quality assurance documentation (daily reports, ITP checklists)
- **Scope Reports** - Site visit reports (14/7/3 days out based on tier)
- **Incidents** - Safety incident reporting
- **NCRs** - Non-conformance reports
- **Division Requests** - Cross-division crew coordination

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React 18 + TypeScript + Vite + Tailwind | PWA UI |
| Backend | Vercel Serverless Functions | API endpoints |
| **Data Storage** | **SharePoint Lists** | All CRUD operations |
| **File Storage** | **SharePoint Document Libraries** | PDFs, photos |
| **Caching** | **Upstash Redis** | Rate limiting, token cache |
| Authentication | Microsoft MSAL (Azure AD) | User auth |
| AI Features | Azure OpenAI (primary) / Gemini (fallback) | Summaries, chat |
| Notifications | Microsoft Teams Webhooks | Alerts |
| PDF Generation | jspdf + puppeteer-core | Reports |

**Architecture Summary:**
- SharePoint = Primary data storage (source of truth)
- Redis = Caching layer only (rate limiting, tokens)

---

## Key Directories

```
sga-qa-system/
├── api/                    # Vercel serverless API routes (MAIN)
│   ├── _lib/              # Shared backend libraries
│   │   ├── sharepointData.ts  # Main data layer (1000+ lines)
│   │   ├── aiService.ts       # Unified AI service
│   │   ├── azureOpenAI.ts     # Azure OpenAI implementation
│   │   ├── cache.ts           # Redis caching
│   │   ├── ratelimit.ts       # Rate limiting
│   │   └── teams.ts           # Teams notifications
│   ├── chat/              # AI Chat endpoints
│   ├── cron/              # Scheduled cron jobs
│   └── *.ts               # 95+ API endpoints
├── src/
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── services/          # Frontend API clients
│   ├── lib/sharepoint/    # SharePoint client library
│   └── types.ts           # Main TypeScript types
├── docs/                  # Documentation
├── tests/                 # Test files
└── archive/               # Old code reference
```

---

## Environment Variables

Copy `.env.example` to `.env.local`. Required:

```env
# Azure AD (Required)
TENANT_ID=your-tenant-id
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret

# SharePoint (Required)
SHAREPOINT_SITE_URL=https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance

# Frontend Auth (Required)
VITE_MSAL_CLIENT_ID=your-client-id
VITE_MSAL_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
VITE_MSAL_REDIRECT_URI=https://your-app.vercel.app

# Redis Cache (Required)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# AI Features - Azure OpenAI (THE LAST STEP)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4

# Teams Notifications (Optional)
TEAMS_WEBHOOK_URL_SUMMARY=https://...
```

---

## Current Status

| Feature | Status |
|---------|--------|
| SharePoint Data Layer | Complete |
| All CRUD Operations | Complete |
| PDF Generation | Complete |
| Scheduler Views | Complete |
| QA Pack Forms | Complete |
| Tender/Project Workflow | Complete |
| Scope Reports (Tier 1/2/3) | Complete |
| Division Requests | Complete |
| Incidents & NCRs | Complete |
| Teams Notifications | Complete |
| AI Chat System | Complete (needs Azure OpenAI credentials) |
| Cron Jobs | Complete |
| Rate Limiting | Complete |

**Last Step:** Add Azure OpenAI credentials to Vercel to enable AI chat.

---

## Development Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Build for production
npm run test         # Run tests
npm run preview      # Preview production build
```

---

## SharePoint Lists

| List Name | Purpose |
|-----------|---------|
| Jobs | Job records |
| Projects | Project records |
| Tenders | Tender/handover records |
| QAPacks | QA Pack submissions |
| Incidents | Incident reports |
| NCRs | Non-conformance reports |
| Foremen | Foreman/crew data |
| Resources | Equipment/materials |
| ScopeReports | Site scope reports |
| DivisionRequests | Cross-division requests |
| ITPTemplates | ITP checklist templates |
| SamplingPlans | Sampling plans |
| Drafts | Draft saves |
| Notifications | User notifications |

---

## Health Check

After deployment, verify at `/api/health`:

```json
{
  "status": "healthy",
  "backend": { "type": "sharepoint", "status": "connected" },
  "ai": { "provider": "azure-openai", "status": "configured" },
  "features": {
    "dataStorage": true,
    "aiFeatures": true,
    "teamsNotifications": true
  }
}
```

---

## Troubleshooting

### "SharePoint not configured"
Check `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET`, and `SHAREPOINT_SITE_URL`.

### "No AI provider configured"
Add Azure OpenAI credentials or set `GOOGLE_API_KEY` for Gemini fallback.

### Build errors with imports
Use `.js` extension in API imports (ES modules requirement):
```typescript
import { JobsData } from './_lib/sharepointData.js';  // Correct
```

---

## Original Requirements

See `Opus prompts.pdf` for full original project requirements.

---

**Build Status:** Passing
**Ready for Production:** Yes (pending Azure OpenAI credentials)
