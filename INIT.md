# SGA QA System - Master Instructions

**Last Updated:** December 5, 2025
**Version:** 1.3.0
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
| **File Storage** | **SharePoint Document Libraries** | PDFs, photos, specs |
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
│   │   ├── sharepointFiles.ts # File upload/download
│   │   ├── aiService.ts       # Unified AI service
│   │   ├── azureOpenAI.ts     # Azure OpenAI implementation
│   │   ├── cache.ts           # Redis caching
│   │   ├── ratelimit.ts       # Rate limiting
│   │   └── teams.ts           # Teams notifications
│   ├── chat/              # AI Chat endpoints
│   ├── cron/              # Scheduled cron jobs
│   ├── crew/              # Crew CRUD API
│   ├── equipment/         # Equipment CRUD API
│   ├── resources/         # Dynamic document browsing API
│   └── *.ts               # 100+ API endpoints
├── src/
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── services/          # Frontend API clients
│   ├── lib/sharepoint/    # SharePoint client library
│   └── types.ts           # Main TypeScript types
├── scripts/               # SharePoint setup scripts
├── docs/                  # Specifications & Test Methods
├── tests/                 # Test files
└── archive/               # Old code reference
```

---

## Recent Updates (December 5, 2025)

### UX Enhancement Suite
Major UI/UX overhaul with "mindblowing" interactive features:

**New UI Components:**
- **Dark Mode Toggle** - Added to TopBar with system preference detection
- **Command Palette** - Press `Cmd+K` (or `Ctrl+K`) for quick navigation
- **Keyboard Shortcuts Modal** - Press `Shift+?` to view all shortcuts
- **Floating Action Button (FAB)** - Mobile-friendly quick actions
- **Onboarding Tour** - Step-by-step guided tour for new users
- **Offline Indicator** - Shows connection status and pending sync count
- **Pull-to-Refresh** - Mobile pull gesture to refresh content
- **Confetti Celebrations** - Success feedback animations

**New Hooks:**
- `useDarkMode` - Dark mode state with localStorage persistence
- `useHaptics` - Vibration feedback for mobile devices
- `useSwipeGestures` - Touch swipe detection for navigation
- `useAutoSave` - Auto-save forms to localStorage with debounce
- `useSoundEffects` - Synthesized audio feedback (Web Audio API)
- `useCommandPalette` - Command palette state management
- `useOnboardingTour` - Tour state with completion tracking
- `useKeyboardShortcutsModal` - Shortcuts modal toggle

**CSS Enhancements:**
- Smooth page transitions and animations
- Button ripple effects on click
- Modern gradient backgrounds
- Glass morphism effects
- Hover state improvements
- Dark mode color scheme

**Files Added:**
```
src/hooks/useHaptics.ts
src/hooks/useSwipeGestures.ts
src/hooks/useAutoSave.tsx
src/hooks/useSoundEffects.ts
src/components/ui/offline-indicator.tsx
src/components/ui/floating-action-button.tsx
src/components/ui/onboarding-tour.tsx
src/components/ui/keyboard-shortcuts-modal.tsx
```

---

## Previous Updates (December 3, 2025)

### Bug Fixes Applied
- Fixed SharePoint create operation (skip `id` field - auto-generated)
- Fixed handover `clientId` missing error (auto-generate from clientName)
- Fixed cron job API key configuration (use GOOGLE_API_KEY)

### New Features Added
1. **Dynamic Resources API** - Documents now load from SharePoint with folder navigation
2. **Crew Management CRUD** - Add/edit/delete crew members from app (syncs with SharePoint)
3. **Equipment Management CRUD** - Add/edit/delete equipment from app
4. **SharePoint Folder Structure** - Organized specs into folders (Main Roads WA, Australian Standards, etc.)

### SharePoint Document Libraries
| Library | Contents |
|---------|----------|
| Specifications | Main Roads WA specs (15), IPWEA (1), Australian Standards (1) |
| TestMethods | Asphalt Tests (8), Bitumen Tests (5), Density (1), Sampling (1), Surface (1) |
| QADocuments | QA documents and templates |
| SGAQAFiles | Uploaded site photos and reports |

---

## Environment Variables

Copy `.env.example` to `.env.local`. Required:

```env
# Azure AD (Required)
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# SharePoint (Required)
SHAREPOINT_SITE_URL=https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance

# Frontend Auth (Required)
VITE_MSAL_CLIENT_ID=your-client-id
VITE_MSAL_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
VITE_MSAL_REDIRECT_URI=https://your-app.vercel.app

# Redis Cache (Required)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# AI Features - Azure OpenAI
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
| **Dynamic Resources (SharePoint)** | **Complete** |
| **Crew/Equipment Management** | **Complete** |
| **Dark Mode** | **Complete** |
| **Command Palette (Cmd+K)** | **Complete** |
| **Keyboard Shortcuts** | **Complete** |
| **Offline Indicator** | **Complete** |
| **Mobile UX (FAB, Haptics)** | **Complete** |
| **Onboarding Tour** | **Complete** |

**Remaining:**
1. Add Azure OpenAI credentials to Vercel (for AI chat features)
2. Configure SharePoint homepage/navigation (manual - see below)

---

## SharePoint Configuration (Manual)

### Navigation Setup
1. Go to: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
2. Click "Edit" at bottom of left navigation
3. Add parent items (Documents, Lists, System) with sub-links
4. Save

### Homepage Setup
1. Click "Edit" on homepage
2. Add web parts: Hero, Quick Links, Document Library, Site Activity
3. Configure theme: Settings → Change the look → Orange
4. Set logo: Settings → Header → sga-logo.png (already uploaded)

---

## API Endpoints (New)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/resources/documents` | GET | Browse SharePoint documents with folders |
| `/api/resources/libraries` | GET | List available document libraries |
| `/api/crew` | GET/POST/PUT/DELETE | Crew member CRUD |
| `/api/equipment` | GET/POST/PUT/DELETE | Equipment CRUD |

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
| Resources | Crew & Equipment |
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
Check `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, and `SHAREPOINT_SITE_URL`.

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
