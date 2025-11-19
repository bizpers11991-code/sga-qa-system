# SGA QA Pack - Microsoft 365 Integration

**Status:** 100% Complete - Ready for Vercel Deployment
**Last Updated:** November 19, 2025

Enterprise quality assurance application for Safety Grooving Australia, integrated with Microsoft 365 ecosystem.

## Quick Start

**New to this project?** → Read **[INIT.md](./INIT.md)** for complete session summary

**Ready to deploy?** → Read **[DEPLOYMENT_SUCCESS.md](./DEPLOYMENT_SUCCESS.md)** for deployment guide

**Need migration help?** → Read **[API_MIGRATION_EXAMPLES.md](./API_MIGRATION_EXAMPLES.md)** for code examples

## Architecture

### Authentication
- **Microsoft Entra ID (MSAL)** - Replacing Auth0
- Files: `src/auth/msalConfig.ts`, `src/components/AuthProvider.tsx`

### Data Storage
- **Microsoft Dataverse** - 12 tables with `cr3cd_` prefix
- Client: `src/api/_lib/dataverse.ts`

### File Storage
- **SharePoint Document Libraries** - 5 libraries
- Client: `src/api/_lib/sharepoint.ts`

## Environment

**Power Platform:**
- Environment: SGA QA Pack - Production
- Dataverse: https://org24044a7d.crm6.dynamics.com

**Tables (12):** foreman, itptemplate, job, qapack, dailyreport, incident, ncr, samplingplan, resource, sitephoto, asphaltplacement, straightedgereport

**SharePoint Libraries (5):** QA Packs, Job Sheets, Site Photos, Incident Reports, NCR Documents

## Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Run dev server
npm run dev
```

## Deployment to Vercel

### Option 1: Via GitHub
```bash
git remote add origin https://github.com/YOUR-USERNAME/sga-qa-system.git
git push -u origin main
```

### Option 2: Via Vercel CLI
```bash
vercel --prod
```

**Environment Variables:** Copy from `.env.vercel.template`

See **[DEPLOYMENT_SUCCESS.md](./DEPLOYMENT_SUCCESS.md)** for detailed instructions.

## Documentation

### For Deployment
- [DEPLOYMENT_SUCCESS.md](./DEPLOYMENT_SUCCESS.md) - Complete deployment guide
- [VERCEL_MIGRATION_GUIDE.md](./VERCEL_MIGRATION_GUIDE.md) - Migration steps
- [.env.vercel.template](./.env.vercel.template) - Environment variables

### For Development
- [API_MIGRATION_EXAMPLES.md](./API_MIGRATION_EXAMPLES.md) - Code migration examples
- [docs/development/](./docs/development/) - Development guides

### For Administration
- [docs/deployment/](./docs/deployment/) - Deployment guides
- [docs/security/](./docs/security/) - Security audits

## Tech Stack

- React 18 + TypeScript
- Vite
- Microsoft Dataverse
- Microsoft Entra ID (MSAL)
- SharePoint + Microsoft Graph API
- Vercel

## Contributors

- **Claude Code** - Orchestration & architecture
- **Gemini AI** - Code generation
- **Dhruv Mann** - Deployment & testing

---

**Created with:** Claude Code + Gemini AI + Dhruv Mann
**License:** Proprietary - Safety Grooving Australia