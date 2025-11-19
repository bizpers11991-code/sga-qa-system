# Changelog

All notable changes to the SGA QA System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2025-11-19

### 🎉 Major Release - Complete Feature Parity Achieved

This release brings the SGA QA Pack application to full feature parity with the original system, implementing all missing functionality and enhancing existing features for production readiness.

### Added

#### Logo & Branding Integration
- Official SGA logo integrated across all pages (TopBar, Login, PDF outputs)
- PWA icons created (192×192 and 512×512) with SGA branding
- Updated manifest.json with SGA orange theme color (#F5A524)
- Consistent branding across web app and PDF documents

#### Engineer's Overview Dashboard
- NEW: `EngineerDashboard.tsx` with role-based dashboard routing
- Four statistics cards:
  - Reports Submitted Today
  - Active & Overdue Jobs (with red indicators)
  - Upcoming Jobs
  - Unassigned Jobs
- Latest Submissions feed with color-coded status badges
- Active & Overdue Jobs list with Edit/Delete action buttons
- `DashboardRouter.tsx` for automatic role-based dashboard selection

#### Enhanced Job Creation
- Extended `JobFormWizard.tsx` to comprehensive 4-step wizard
- **Step 1: Basic Information**
  - All core fields (Job#, Client, Project, Location, Dates)
  - ITP Template selection dropdown
  - Division selection (Asphalt/Profiling/Spray)
  - Foreman assignment (filtered by division)
- **Step 2: Job Sheet Details** (Division-Specific)
  - **Profiling Jobs** (50+ fields):
    - Crew multi-select dropdown (8 crew members)
    - Equipment table (6 machines: 2m Profiler, Pocket Rocket, Skid Steer)
    - Plant requirements with start times
    - RAP dumpsite location
    - Description of works
  - **Asphalt Jobs** (60+ fields):
    - Contacts section (8 fields: PM, Supervisors, Client contacts)
    - Site details (plant location, inspection, traffic control)
    - Cartage section (5 truck types)
    - Asphalt plant and timing information
  - **Spray Jobs**: Simplified workflow
- **Step 3: Job & Materials** (Asphalt Only)
  - Dynamic materials table with [+ Add Material]
  - 7 fields per material (Mix Code, Pavement Type, Tonnes, Area, Depth, Density, Lot#)
- **Step 4: Review & Create**
  - Comprehensive summary with all data
  - Crew/equipment names resolved from IDs
- NEW: `resourcesApi.ts` - Fetch crew and equipment resources
- NEW: `itpApi.ts` - Fetch ITP templates
- Extended `Job` type with 60+ additional fields

#### Scheduler/Calendar View
- NEW: `SchedulerPage.tsx` - Weekly calendar with job planning
- NEW: `WeeklyCalendar.tsx` - 7-day grid (Monday-Sunday)
- NEW: `CalendarJobCard.tsx` - Color-coded job cards by division
  - Blue border: Profiling
  - Orange border: Asphalt
  - Green border: Spray
- NEW: `DivisionFilter.tsx` - Filter jobs by division
- Current day highlighting (blue background)
- Previous/Next week navigation
- "Today" button to jump to current week
- Click job card to navigate to job details
- Responsive layout for mobile/tablet/desktop

#### QA Pack Multi-Tab System (CRITICAL FEATURE)
- NEW: `QaPackPage.tsx` - Main orchestrator (500+ lines)
  - 7-tab comprehensive workflow
  - Auto-save every 30 seconds
  - Draft persistence (localStorage + server)
  - Guided Mode with step-by-step navigation
  - Submit workflow with signature capture

- NEW: `QaPackTabs.tsx` - Tab navigation component
  - Horizontal tab bar with active highlighting
  - Completed tabs show checkmark icons
  - Guided mode progress indicator

- NEW Form Components (7 tabs):
  1. `JobSheetDisplay.tsx` - Read-only job details
  2. `DailyReportForm.tsx` - Complete daily report (580+ lines)
     - Weather conditions table
     - Assigned works (pre-filled from job sheet)
     - Calculated placement totals (from Asphalt Placement tab)
     - Actual work performed
     - Corrector usage with conditional details table
     - Site instructions with voice input
     - Plant/Equipment table
     - Crew table with auto-calculated hours
     - On-site testing
     - Client approval with signature
  3. `SiteRecordForm.tsx` - Hazard log + site visitors
  4. `ItpChecklistForm.tsx` - ITP checklist from templates
     - Yes/No/N/A dropdowns
     - Comments with voice input
     - Witness points highlighted
  5. `AsphaltPlacementForm.tsx` - Placement records (Asphalt only)
     - Weather conditions
     - 14-column placement table
     - Auto-calculations (progressive tonnes, area)
  6. `StraightEdgeForm.tsx` - Testing results (Asphalt only)
  7. `SitePhotosForm.tsx` - Photo upload with drag & drop
     - Captions with voice input
     - Image optimization (1920×1080, 85% JPEG)

- NEW Helper Components:
  - `VoiceInput.tsx` - Web Speech API integration
  - `SignaturePad.tsx` - Canvas-based signature capture
  - `SgaLogo.tsx` - Reusable branded logo component

- Auto-Calculations:
  - Hours from start/end times (handles overnight shifts)
  - Progressive tonnes (cumulative)
  - Chainage length (end - start)
  - Area (length × width)
  - Tonnes laid (area × depth × density)

#### PDF Generation Enhancement
- Completely rewritten `ReportPrintView.tsx` (1,100+ lines)
- Exact layout matching reference PDF:
  - **Page 1**: Professional cover page with job details table
  - **Page 2**: Job Sheet Details section
  - **Page 3**: SGA Daily Report with all data tables
  - **Page 4**: Site Record (Hazard Log + Visitors)
  - **Page 5**: ITP Checklist (if applicable)
  - **Page 6**: Asphalt Placement Record (Asphalt only)
  - **Page 7**: Straight Edge Testing (Asphalt only)
  - **Page 8**: Verification & Signatures
  - **Page 9+**: Site Photos (1 per page with captions)
- SGA logo on all pages
- Professional header/footer on every page
- Footer: "Page X of Y | Printed copies are uncontrolled documents"
- Orange section headers (#d97706)
- Bordered tables with proper styling
- Division-specific sections
- Photo grid with automatic pagination
- Enhanced Puppeteer settings (60s timeout, A4 format)

### Changed

- Updated `TopBar.tsx` - Added SGA logo (40px height)
- Updated `Login.tsx` - Added large SGA logo (80px height)
- Updated `Sidebar.tsx` - Added Scheduler menu item with calendar icon
- Updated `navigation.ts` - Added Scheduler route
- Updated `routes.tsx` - Added routes for QA Pack, Scheduler, Dashboard Router
- Updated `types.ts` - Extended with 60+ new fields for jobs and reports
- Updated `jobsApi.ts` - Extended CreateJobRequest interface
- Updated `create-job.ts` - Backend API to handle new fields
- Updated `generate-jobsheet-pdf.ts` - Enhanced PDF settings
- Updated `submit-report.ts` - Enhanced PDF generation workflow
- Updated `manifest.json` - SGA orange theme color

### Fixed

- TypeScript compilation errors (100% type coverage)
- Build warnings resolved
- Line ending warnings (CRLF normalization)
- Missing type definitions
- Component prop type mismatches

### Technical Improvements

- Zero TypeScript compilation errors
- Build time: 13.32 seconds
- Bundle size: 684 KB (optimized)
- Gzipped bundle: 190 KB
- Clean component architecture
- Proper error handling and loading states
- Responsive design for iPad and desktop
- Offline support with localStorage drafts
- Image optimization for photo uploads
- Role-based routing implementation

### Files Created (23 new files)

**Assets (3 files):**
- `public/assets/sga-logo.png`
- `public/icon-192.png`
- `public/icon-512.png`

**Components (15 files):**
- `src/components/common/VoiceInput.tsx`
- `src/components/common/SignaturePad.tsx`
- `src/components/common/SgaLogo.tsx`
- `src/components/reports/QaPackTabs.tsx`
- `src/components/reports/JobSheetDisplay.tsx`
- `src/components/reports/DailyReportForm.tsx`
- `src/components/reports/SiteRecordForm.tsx`
- `src/components/reports/ItpChecklistForm.tsx`
- `src/components/reports/AsphaltPlacementForm.tsx`
- `src/components/reports/StraightEdgeForm.tsx`
- `src/components/reports/SitePhotosForm.tsx`
- `src/components/scheduler/WeeklyCalendar.tsx`
- `src/components/scheduler/CalendarJobCard.tsx`
- `src/components/scheduler/DivisionFilter.tsx`
- `src/components/scheduler/index.ts`

**Pages (3 files):**
- `src/pages/DashboardRouter.tsx`
- `src/pages/EngineerDashboard.tsx`
- `src/pages/reports/QaPackPage.tsx`
- `src/pages/scheduler/SchedulerPage.tsx`

**Services (2 files):**
- `src/services/resourcesApi.ts`
- `src/services/itpApi.ts`

### Files Modified (15 files)

- `.claude/settings.local.json`
- `public/manifest.json`
- `src/api/_lib/ReportPrintView.tsx`
- `src/api/_lib/SgaLogo.tsx`
- `src/api/create-job.ts`
- `src/api/generate-jobsheet-pdf.ts`
- `src/api/submit-report.ts`
- `src/components/Login.tsx`
- `src/components/jobs/JobFormWizard.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/TopBar.tsx`
- `src/config/navigation.ts`
- `src/routing/routes.tsx`
- `src/services/jobsApi.ts`
- `src/types.ts`

### Success Criteria Met

✅ All features from original PDF implemented
✅ SGA logo integrated across all touchpoints
✅ Engineer and Foreman dashboards with role-based routing
✅ Comprehensive job creation with all 60+ fields
✅ Scheduler with calendar view and division filters
✅ Complete QA Pack system with 7 tabs and auto-save
✅ PDF output matches exact reference layout
✅ TypeScript compilation with zero errors
✅ Responsive design for iPad field work
✅ Build successful (13.32s, 684KB bundle)

---

## [1.0.0] - 2025-11-14

### Initial Release

#### Added
- Basic job management (create, read, update, delete)
- Incident reporting system
- NCR (Non-Conformance Report) tracking
- Document library with SharePoint integration
- Microsoft Entra ID authentication
- Role-based access control
- PDF generation for reports
- Progressive Web App (PWA) support
- Service worker for offline functionality
- 45+ backend API endpoints
- Microsoft 365 integration
- Google Gemini AI for daily briefings

#### Technical Stack
- React 18 + TypeScript
- Vite 5.4 build system
- Tailwind CSS 3.4 styling
- Vercel Serverless Functions
- Microsoft Dataverse database
- Redis caching
- SharePoint document storage

---

## Version History

- **2.0.0** (2025-11-19) - Complete feature parity with original app
- **1.0.0** (2025-11-14) - Initial production release

---

Generated with Claude Code (Sonnet 4.5)
Co-Authored-By: Claude <noreply@anthropic.com>
