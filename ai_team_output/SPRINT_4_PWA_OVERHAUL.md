# Sprint 4: Complete PWA Overhaul - SGA QA System
**Date**: November 19, 2025
**Coordinator**: Claude Sonnet 4.5
**AI Team**: Multi-model delegation (Gemini, Grok, Qwen, DeepSeek)
**Platform**: Cross-platform PWA (Windows Desktop + iPad optimized)

---

## 🎯 Mission Objective

Transform the basic authenticated app into a world-class Progressive Web Application with:
- ✅ Full-featured responsive UI (Windows Desktop + iPad)
- ✅ Professional SGA branding throughout
- ✅ All 45+ backend APIs connected
- ✅ Offline-capable PWA functionality
- ✅ Touch-optimized for iPad fieldwork
- ✅ PDF generation with SGA logos
- ✅ Role-based access control (RBAC)
- ✅ Microsoft 365 deep integration

---

## 📋 Workstream Breakdown (AI Team Delegation)

### **Workstream 1: PWA Foundation & Design System**
**AI Agent**: Gemini 2.0 Flash Exp
**Complexity**: High
**Priority**: P0 (Blocking)

**Tasks**:
1. **PWA Manifest & Service Worker**
   - Create `manifest.json` with SGA branding
   - Implement service worker for offline support
   - Configure installability (Windows + iPad)
   - Add app icons (multiple sizes)

2. **Design System Setup**
   - Tailwind CSS configuration with SGA color palette
     - Primary: `#b45309` (Amber-700)
     - Secondary: `#d97706` (Amber-600)
     - Accent: `#92400e` (Amber-800)
   - Typography system (Helvetica Neue, fallbacks)
   - Component library foundation
   - Responsive breakpoints (mobile, tablet, desktop)
   - Touch-friendly sizing (44px minimum tap targets for iPad)

3. **SGA Logo Integration**
   - Header logo component
   - Favicon generation (all sizes)
   - Loading screen with SGA branding
   - PDF watermark component

**Deliverables**:
- `public/manifest.json`
- `public/sw.js` (service worker)
- `public/icons/` (PWA icons 192x192, 512x512)
- `src/styles/design-system.css`
- `src/components/branding/SgaHeader.tsx`
- `src/components/branding/SgaLoader.tsx`

---

### **Workstream 2: Navigation & Layout Architecture**
**AI Agent**: Qwen 2.5 Coder 32B (OpenRouter)
**Complexity**: Medium-High
**Priority**: P0 (Blocking)

**Tasks**:
1. **Main Navigation System**
   - Responsive sidebar (collapsible on mobile/tablet)
   - Top app bar with user menu
   - Breadcrumb navigation
   - Role-based menu items (RBAC)
   - iPad-optimized touch targets

2. **Layout Components**
   - `AppShell.tsx` - Main layout wrapper
   - `Sidebar.tsx` - Navigation sidebar
   - `TopBar.tsx` - Header with user profile
   - `Footer.tsx` - App footer with version
   - `PageContainer.tsx` - Content wrapper

3. **Routing Structure**
   - React Router v6 setup
   - Protected route wrapper (auth check)
   - Role-based route guards
   - Deep linking support for PWA
   - 404 page

**Deliverables**:
- `src/components/layout/AppShell.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/TopBar.tsx`
- `src/routing/routes.tsx`
- `src/routing/ProtectedRoute.tsx`
- `src/routing/RoleGuard.tsx`

---

### **Workstream 3: Dashboard & Home Screen**
**AI Agent**: Grok Beta (OpenCode.ai Account 1)
**Complexity**: High
**Priority**: P1

**Tasks**:
1. **Dashboard Landing Page**
   - Welcome widget with user context
   - Quick action cards (Create Job, Submit Report, etc.)
   - Recent activity feed
   - Pending tasks counter
   - Daily briefing widget (AI-generated summary)

2. **Analytics Widgets**
   - Jobs overview (total, pending, completed)
   - Reports status chart
   - Incidents tracker
   - NCR dashboard (engineer/admin only)

3. **Offline Indicator**
   - Connection status banner
   - Sync queue indicator
   - Offline mode instructions

**Deliverables**:
- `src/pages/Dashboard.tsx`
- `src/components/dashboard/WelcomeWidget.tsx`
- `src/components/dashboard/QuickActions.tsx`
- `src/components/dashboard/ActivityFeed.tsx`
- `src/components/dashboard/AnalyticsPanel.tsx`

---

### **Workstream 4: Job Management Module**
**AI Agent**: DeepSeek Coder V3 (OpenRouter)
**Complexity**: High
**Priority**: P1

**Tasks**:
1. **Job List View**
   - Filterable/sortable table
   - Search functionality
   - Status badges
   - Pagination
   - Export to Excel

2. **Job Creation Form**
   - Multi-step wizard
   - Form validation
   - Foreman assignment dropdown
   - Date/time pickers (iPad-friendly)
   - Address autocomplete (Maps API)

3. **Job Detail View**
   - Job information display
   - Edit capability (role-based)
   - Document attachments
   - Activity timeline
   - Map view (location)

4. **API Integration**
   - `GET /api/get-all-jobs`
   - `GET /api/get-foreman-jobs`
   - `POST /api/create-job`
   - `POST /api/create-multiple-jobs`
   - `PUT /api/update-job`
   - `DELETE /api/delete-job`

**Deliverables**:
- `src/pages/jobs/JobList.tsx`
- `src/pages/jobs/JobCreate.tsx`
- `src/pages/jobs/JobDetail.tsx`
- `src/components/jobs/JobCard.tsx`
- `src/components/jobs/JobForm.tsx`
- `src/services/jobsApi.ts`

---

### **Workstream 5: QA Pack Reporting System**
**AI Agent**: Gemini 2.0 Flash Exp
**Complexity**: Very High
**Priority**: P1

**Tasks**:
1. **Daily Job Sheet Form**
   - Dynamic form builder
   - Photo capture (camera + upload) - iPad optimized
   - Material entry table
   - Equipment checklist
   - GPS location capture
   - Offline draft saving

2. **Sampling Plan Form**
   - Core location generator (AI-assisted)
   - Grid view/map view
   - Test results entry
   - Pass/fail indicators

3. **Report Submission**
   - Validation checks
   - PDF preview
   - Submit with notification
   - Teams channel integration
   - SharePoint upload

4. **Report History**
   - List view with filters
   - Status tracking
   - Re-generate AI summary
   - Download PDF

5. **API Integration**
   - `POST /api/submit-report`
   - `GET /api/get-reports`
   - `GET /api/get-report-history`
   - `POST /api/save-draft`
   - `GET /api/get-draft`
   - `POST /api/regenerate-ai-summary`
   - `PUT /api/update-report-status`

**Deliverables**:
- `src/pages/reports/ReportCreate.tsx`
- `src/pages/reports/ReportList.tsx`
- `src/pages/reports/ReportDetail.tsx`
- `src/components/reports/JobSheetForm.tsx`
- `src/components/reports/SamplingPlanForm.tsx`
- `src/components/reports/PhotoCapture.tsx`
- `src/services/reportsApi.ts`

---

### **Workstream 6: Incident & NCR Management**
**AI Agent**: Grok Beta (OpenCode.ai Account 2)
**Complexity**: Medium-High
**Priority**: P2

**Tasks**:
1. **Incident Reporting**
   - Quick incident form (emergency-focused)
   - Photo capture (multiple)
   - Location tagging
   - AI-generated incident ID
   - Immediate notification to management

2. **Incident Register**
   - List view with search
   - Status filter (Open, Investigating, Closed)
   - Detail view with timeline
   - Comment/update capability

3. **NCR System** (Engineer/Admin only)
   - NCR creation form
   - AI-generated NCR ID
   - Assignment workflow
   - Status tracking
   - Resolution documentation

4. **API Integration**
   - `POST /api/submit-incident`
   - `POST /api/save-incident`
   - `GET /api/get-incidents`
   - `POST /api/save-ncr`
   - `GET /api/get-ncrs`

**Deliverables**:
- `src/pages/incidents/IncidentCreate.tsx`
- `src/pages/incidents/IncidentList.tsx`
- `src/pages/incidents/IncidentDetail.tsx`
- `src/pages/ncr/NcrCreate.tsx`
- `src/pages/ncr/NcrList.tsx`
- `src/services/incidentsApi.ts`
- `src/services/ncrApi.ts`

---

### **Workstream 7: PDF Generation & Documents**
**AI Agent**: Qwen 2.5 Coder 32B
**Complexity**: High
**Priority**: P2

**Tasks**:
1. **PDF Template System**
   - Professional SGA header/footer
   - Logo placement (top-right, watermark)
   - Consistent formatting
   - Multi-page support
   - Photo embedding

2. **PDF Generation Components**
   - Job Sheet PDF
   - Sampling Plan PDF
   - Incident Report PDF
   - NCR PDF
   - All with SGA branding

3. **Document Management**
   - Upload/download
   - Document library view
   - SharePoint sync status
   - Thumbnail previews

4. **API Integration**
   - `POST /api/generate-jobsheet-pdf`
   - `POST /api/generate-sampling-pdf`
   - `POST /api/generate-incident-pdf`
   - `POST /api/generate-ncr-pdf`
   - `POST /api/generate-upload-url`
   - `POST /api/confirm-document-upload`
   - `GET /api/get-documents`
   - `DELETE /api/delete-document`

**Deliverables**:
- `src/components/pdf/PdfGenerator.tsx`
- `src/components/pdf/SgaPdfHeader.tsx`
- `src/components/pdf/SgaPdfFooter.tsx`
- `src/pages/documents/DocumentLibrary.tsx`
- `src/services/pdfApi.ts`
- `src/services/documentsApi.ts`

---

### **Workstream 8: Resources & Templates**
**AI Agent**: DeepSeek Coder V3
**Complexity**: Medium
**Priority**: P3

**Tasks**:
1. **ITP Template Management**
   - Template list
   - Template editor
   - Version control
   - Preview

2. **Resource Library**
   - Searchable resource list
   - Categories/tags
   - Upload/edit/delete
   - File type support

3. **API Integration**
   - `GET /api/get-itp-templates`
   - `POST /api/save-itp-template`
   - `DELETE /api/delete-itp-template`
   - `GET /api/get-resources`
   - `POST /api/save-resource`
   - `DELETE /api/delete-resource`

**Deliverables**:
- `src/pages/templates/TemplateList.tsx`
- `src/pages/templates/TemplateEditor.tsx`
- `src/pages/resources/ResourceLibrary.tsx`
- `src/services/templatesApi.ts`
- `src/services/resourcesApi.ts`

---

### **Workstream 9: Admin Panel & User Management**
**AI Agent**: Gemini 2.0 Flash Exp
**Complexity**: Medium
**Priority**: P2

**Tasks**:
1. **User Management**
   - Foreman list view
   - Role assignment
   - User detail view
   - Activity tracking

2. **System Settings**
   - App configuration
   - Notification preferences
   - Integration settings
   - Data export tools

3. **Analytics Dashboard** (Admin only)
   - Usage statistics
   - Performance metrics
   - Error logs
   - Audit trail

4. **API Integration**
   - `GET /api/get-foremen`
   - `GET /api/get-notifications`
   - `POST /api/resolve-notification`
   - `POST /api/log-client-error`

**Deliverables**:
- `src/pages/admin/UserManagement.tsx`
- `src/pages/admin/SystemSettings.tsx`
- `src/pages/admin/Analytics.tsx`
- `src/services/adminApi.ts`

---

### **Workstream 10: AI Features & Integrations**
**AI Agent**: Grok Beta + Gemini 2.0 (Collaborative)
**Complexity**: High
**Priority**: P2

**Tasks**:
1. **Daily Briefing Widget**
   - AI-generated summary (Gemini)
   - Personalized by role
   - Today's jobs overview
   - Pending actions

2. **Smart Features**
   - Job detail extraction (AI parsing)
   - Anomaly detection
   - Risk analysis
   - Core location generation

3. **Copilot Chat** (Future)
   - In-app chat interface
   - Context-aware responses
   - Quick actions from chat

4. **API Integration**
   - `GET /api/get-daily-briefing`
   - `POST /api/extract-job-details`
   - `POST /api/detect-anomalies`
   - `POST /api/analyze-job-risk`
   - `POST /api/generate-core-locations`

**Deliverables**:
- `src/components/ai/DailyBriefing.tsx`
- `src/components/ai/SmartExtractor.tsx`
- `src/components/ai/AnomalyDetector.tsx`
- `src/services/aiApi.ts`

---

## 🎨 UI/UX Design Requirements

### Color Palette
```css
:root {
  --sga-amber-900: #78350f;
  --sga-amber-800: #92400e;
  --sga-amber-700: #b45309; /* Primary */
  --sga-amber-600: #d97706; /* Secondary */
  --sga-amber-500: #f59e0b;
  --sga-amber-400: #fbbf24;
  --sga-amber-300: #fcd34d;
  --sga-amber-200: #fde68a;
  --sga-amber-100: #fef3c7;
  --sga-amber-50: #fffbeb;
}
```

### Typography
- **Headings**: Helvetica Neue, Bold (900 weight)
- **Body**: Helvetica, Arial, sans-serif
- **Monospace**: Courier New (for IDs, codes)

### Component Sizing (iPad-friendly)
- **Buttons**: Minimum 44px height
- **Input fields**: Minimum 44px height
- **Touch targets**: Minimum 44x44px
- **Spacing**: 16px/24px/32px/48px scale
- **Border radius**: 8px standard, 12px large

### Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet (iPad)**: 640px - 1024px
- **Desktop**: > 1024px

---

## 🔐 Security & Access Control

### Role-Based Permissions

| Feature | Foreman | Engineer | Admin | HSEQ |
|---------|---------|----------|-------|------|
| View Jobs | Own only | All | All | All |
| Create Jobs | ❌ | ✅ | ✅ | ✅ |
| Submit Reports | ✅ | ✅ | ✅ | ✅ |
| View NCRs | ✅ (read) | ✅ | ✅ | ✅ |
| Create NCRs | ❌ | ✅ | ✅ | ✅ |
| Create Incidents | ✅ | ✅ | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ | ❌ |
| System Settings | ❌ | ❌ | ✅ | ❌ |

### Authentication Flow
1. Microsoft Entra ID (Azure AD) OAuth
2. JWT token storage (secure)
3. Automatic token refresh
4. Logout on token expiry

---

## 📱 PWA Features

### Offline Capabilities
- **Service Worker**: Cache static assets
- **IndexedDB**: Store draft reports
- **Background Sync**: Queue submissions when offline
- **Offline indicator**: Clear UI feedback

### Installability
- **Add to Home Screen**: iOS Safari + Android Chrome
- **Desktop Install**: Windows Edge/Chrome
- **App Icon**: SGA-branded launcher icon
- **Splash Screen**: Professional loading experience

### Push Notifications (Future)
- New job assignments
- Report approvals
- Incident alerts

---

## 🧪 Testing Requirements

### Test Coverage (Each Workstream)
1. **Unit Tests**: Critical business logic
2. **Component Tests**: React Testing Library
3. **Integration Tests**: API mocking (MSW)
4. **E2E Tests**: Playwright (key user flows)
5. **Accessibility**: ARIA labels, keyboard nav
6. **Performance**: Lighthouse score > 90

### Browser/Device Testing
- ✅ Windows 11 - Edge, Chrome
- ✅ iPad Pro - Safari
- ✅ iPad Air - Safari
- ✅ iPhone - Safari (responsive)

---

## 🚀 Deployment Pipeline

### Build Process
1. TypeScript compilation
2. Vite production build
3. Service worker generation
4. Asset optimization
5. Source maps

### Environment Variables (Vercel)
- `VITE_MSAL_CLIENT_ID`
- `VITE_MSAL_TENANT_ID`
- `VITE_API_BASE_URL`
- `VITE_ENVIRONMENT`

### Deployment Steps
1. GitHub commit (main branch)
2. Vercel auto-deploy trigger
3. Build verification
4. Preview deployment (review)
5. Production promotion

---

## 📊 Success Metrics

### Technical Metrics
- ✅ Lighthouse Performance: > 90
- ✅ Lighthouse Accessibility: > 95
- ✅ Lighthouse Best Practices: > 95
- ✅ Lighthouse PWA: 100
- ✅ Bundle size: < 500KB gzipped
- ✅ Time to Interactive: < 3s

### User Experience Metrics
- ✅ Zero authentication friction
- ✅ < 2 clicks to common actions
- ✅ All forms iPad-touch optimized
- ✅ Professional PDF output
- ✅ SGA branding consistency

---

## 🤖 AI Team Coordination Protocol

### Task Assignment Strategy
- **Parallel execution**: All workstreams start simultaneously
- **Daily syncs**: AI agents report progress to Claude
- **Conflict resolution**: Claude reviews and merges code
- **Quality gates**: Code review before integration

### Communication Format
Each AI agent provides:
```json
{
  "workstream": "Workstream N",
  "agent": "Gemini/Grok/Qwen/DeepSeek",
  "status": "In Progress/Blocked/Complete",
  "completed_tasks": ["task1", "task2"],
  "blockers": ["description"],
  "files_created": ["path1", "path2"],
  "next_steps": ["task3", "task4"],
  "estimated_completion": "HH hours"
}
```

### Integration Points
- **Workstream 1 + 2**: Design system used by all others
- **Workstream 2**: Layout wraps all page components
- **Workstream 3-10**: Use shared services/components

---

## 📦 Deliverable Checklist

### Phase 1: Foundation (Complete First)
- [ ] PWA manifest and service worker
- [ ] Design system and Tailwind config
- [ ] Navigation and layout components
- [ ] Routing structure
- [ ] Authentication flow enhancement

### Phase 2: Core Features (Parallel)
- [ ] Dashboard
- [ ] Job management
- [ ] QA Pack reporting
- [ ] Incident/NCR system
- [ ] PDF generation

### Phase 3: Extended Features (Parallel)
- [ ] Resources/Templates
- [ ] Admin panel
- [ ] AI integrations
- [ ] Document management

### Phase 4: Polish & Deploy
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Testing coverage
- [ ] Documentation
- [ ] Production deployment

---

## 🎓 Knowledge Transfer

### Documentation Required
- [ ] User guide (PDF with SGA branding)
- [ ] Admin guide
- [ ] API documentation (existing)
- [ ] Deployment guide
- [ ] Troubleshooting guide

### Training Materials
- [ ] Video walkthrough (screen recording)
- [ ] Quick start guide
- [ ] FAQ document

---

## ⏱️ Timeline Estimate

**Total Estimated Time**: 48-72 hours (AI team work)

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Foundation | 6-8 hours | None |
| Phase 2: Core Features | 24-36 hours | Phase 1 |
| Phase 3: Extended Features | 12-18 hours | Phase 1 |
| Phase 4: Polish & Deploy | 6-10 hours | All above |

**With 6-10 AI workers in parallel**: **12-16 hours real-time**

---

## 🔒 Security Considerations

### Data Protection
- No API keys in frontend code
- Environment variables only
- HTTPS everywhere
- CSP headers
- XSS protection

### Secure Coding Practices
- Input validation (all forms)
- Output encoding
- CSRF tokens (where applicable)
- SQL injection prevention (backend)
- File upload restrictions

---

## 🎯 Next Steps

1. **Claude**: Review and approve this plan
2. **Claude**: Initialize AI team task distribution
3. **AI Team**: Begin parallel execution
4. **Claude**: Monitor progress, resolve conflicts
5. **Claude**: Code review and integration
6. **Claude**: Final QA and deployment

---

**Plan Status**: ✅ Ready for Execution
**Approved By**: [Pending Dhruv + Claude approval]
**Start Date**: November 19, 2025
**Target Completion**: November 21-22, 2025
