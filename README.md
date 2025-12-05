# SGA QA System

**Enterprise Quality Assurance & Project Management Platform for Safety Grooving Australia**

A comprehensive Progressive Web App (PWA) for managing tenders, projects, jobs, quality assurance reporting, incidents, and safety compliance - fully integrated with Microsoft 365.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![Version](https://img.shields.io/badge/version-2.3.0-orange)
![License](https://img.shields.io/badge/license-Proprietary-red)

---

## 🏗️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite |
| **Backend** | Vercel Serverless Functions |
| **Data Storage** | SharePoint Lists |
| **File Storage** | SharePoint Document Libraries |
| **Authentication** | Microsoft MSAL (Azure AD) |
| **AI Features** | Azure OpenAI / Microsoft Copilot |
| **Notifications** | Microsoft Teams Webhooks |
| **PDF Generation** | jspdf, puppeteer-core |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Microsoft 365 account with SharePoint access
- Azure AD App Registration

### Installation

```bash
git clone https://github.com/your-org/sga-qa-system.git
cd sga-qa-system
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env.local`
2. Configure your Azure AD credentials:
   - `TENANT_ID`
   - `CLIENT_ID`  
   - `CLIENT_SECRET`
3. Set your SharePoint site URL
4. (Optional) Configure Azure OpenAI or Gemini for AI features
5. (Optional) Add Teams webhook URLs for notifications

### Development

```bash
npm run dev          # Start dev server at localhost:5173
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
```

---

## 📋 Core Features

### Job Management
- Complete Job Creation Wizard
- Division-specific job sheets (Asphalt, Profiling, Spray)
- Materials & Equipment tracking
- Foreman assignment and notifications
- Job sheet PDF generation

### QA Pack System
- SGA Daily Report Form
- Site Record Form (Hazards, Visitors)
- ITP Checklist with templates
- Asphalt Placement Form
- Straight Edge Testing Form
- Traffic Management Plan Checklist
- Site & Damage Photo capture
- AI-generated executive summaries

### Project Management
- Tender handover workflow
- Project lifecycle tracking
- Scope report management (Tier 1/2/3)
- Cross-division coordination
- Multi-view scheduler (Week, Month, Gantt)

### Incident & NCR Management
- Incident reporting with photo documentation
- Non-conformance tracking
- Investigation workflow
- Corrective action management

### AI Features
- Executive summaries for QA packs
- Morning lookahead briefings
- Evening technical summaries
- Supports Azure OpenAI (M365 Copilot) or Google Gemini

---

## 📁 Project Structure

```
sga-qa-system/
├── api/                    # Serverless API routes
│   ├── _lib/              # Shared libraries
│   │   ├── aiService.ts   # Unified AI (Azure OpenAI/Gemini)
│   │   ├── sharepointData.ts  # SharePoint data operations
│   │   ├── sharepoint.ts  # SharePoint document operations
│   │   └── teams.ts       # Teams notifications
│   └── cron/              # Scheduled jobs
├── src/
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── services/          # API client services
│   ├── lib/sharepoint/    # SharePoint client library
│   └── types/             # TypeScript types
├── docs/                  # Documentation
├── tests/                 # Test files
└── public/                # Static assets
```

---

## 🔐 Required Environment Variables

### Core (Required)
```env
TENANT_ID=your-azure-tenant-id
CLIENT_ID=your-azure-app-client-id
CLIENT_SECRET=your-azure-app-client-secret
SHAREPOINT_SITE_URL=https://yourorg.sharepoint.com/sites/YourSite
```

### Frontend Auth (Required)
```env
VITE_MSAL_CLIENT_ID=your-client-id
VITE_MSAL_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
VITE_MSAL_REDIRECT_URI=https://your-app.vercel.app
```

### AI Features (Choose one)
```env
# Option 1: Azure OpenAI (Recommended for M365)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4

# Option 2: Google Gemini
GOOGLE_API_KEY=your-gemini-api-key
```

### Teams Notifications (Optional)
```env
TEAMS_WEBHOOK_URL_MANAGEMENT=https://...
TEAMS_WEBHOOK_URL_QA_PACK=https://...
# See .env.example for full list
```

---

## 🔗 SharePoint Setup

The system requires these SharePoint Lists:
- Jobs, Projects, Tenders
- ScopeReports, DivisionRequests
- QAPacks, Incidents, NCRs
- Foremen, Resources
- ITPTemplates, SamplingPlans
- Drafts, Notifications

And these Document Libraries:
- QA Packs, Job Sheets
- Site Photos, Incident Reports
- NCR Documents

See `docs/SHAREPOINT_SETUP.md` for detailed setup instructions.

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `tender_admin` | Create tenders, manage scope reports |
| `scheduler_admin` | Full scheduling, crew assignment |
| `management_admin` | Full system access |
| `hseq_manager` | Safety oversight, audits, NCRs |
| `asphalt_engineer` | Asphalt division lead |
| `profiling_engineer` | Profiling division lead |
| `spray_admin` | Spray division lead |
| `*_foreman` | Division crew leads, daily QA |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `INIT.md` | Quick start for Claude Code |
| `docs/deployment/` | Deployment guides |
| `docs/development/` | Development guides |
| `docs/m365-integration/` | M365 integration details |

---

## 🧪 Testing

```bash
npm run test              # Run all tests
npm run test:ui           # Run with UI
npm run test:coverage     # Generate coverage report
npm run test:sharepoint   # Test SharePoint integration
```

---

## 📞 Support

For questions about this system:
- **Technical**: Check `docs/` folder
- **Business**: Contact SGA management

---

## 📜 License

Proprietary - Safety Grooving Australia Pty Ltd

---

**Built with ❤️ for SGA's Quality Assurance Team**
