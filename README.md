# SGA QA System

**Enterprise quality assurance application for Safety Grooving Australia**

A comprehensive Progressive Web App (PWA) for managing jobs, quality assurance reporting, incidents, and safety compliance - fully integrated with Microsoft 365.

---

## 🚀 Features

### Core Modules
- **Dashboard** - Real-time statistics, AI-powered daily briefings, activity feed
- **Job Management** - Complete CRUD for asphalt, profiling, and spray jobs
- **QA Pack Reporting** - Multi-step forms with photo capture and offline support
- **Incident Reporting** - Quick emergency reporting with GPS and photos
- **NCR Tracking** - Non-conformance reports with role-based access
- **Document Management** - PDF generation with SGA branding
- **Resources & Templates** - Crew and equipment management

### Technical Highlights
- ✅ Progressive Web App (installable on Windows & iPad)
- ✅ Offline support with service worker
- ✅ Touch-optimized for iPad field work (44px touch targets)
- ✅ Real-time data from 45+ backend APIs
- ✅ Role-based access control
- ✅ Microsoft Entra ID authentication
- ✅ Professional PDF generation with SGA logos
- ✅ Photo capture with iPad camera integration
- ✅ Auto-save drafts (online & offline)

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5.4
- **Styling**: Tailwind CSS 3.4
- **Routing**: React Router 6
- **Auth**: Microsoft MSAL (Azure AD)
- **UI Components**: Radix UI + custom components
- **Icons**: Lucide React
- **Backend**: Vercel Serverless Functions
- **Database**: Microsoft Dataverse
- **Storage**: SharePoint + Azure Blob
- **AI**: Google Gemini (daily briefings, core location generation)

---

## 📦 Installation

```bash
npm install
npm run dev
```

---

## 🌐 Deployment

Deploy to Vercel:
```bash
vercel --prod
```

See [DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md) for full details.

---

## 📄 License

Proprietary - Safety Grooving Australia. All rights reserved.

---

**Version**: 1.0.0 | **Status**: Production Ready ✅
