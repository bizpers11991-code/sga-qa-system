# Vercel App → Dataverse Migration Guide

**Created:** November 19, 2025
**Status:** Ready to migrate
**Time Required:** 30-60 minutes

---

## What We're Doing

Migrating your existing Vercel React app to use Microsoft Dataverse as the backend instead of Redis/Auth0/S3.

### Before (Current):
- ❌ Auth0 for authentication
- ❌ Upstash Redis for data storage
- ❌ AWS S3 for file storage

### After (New):
- ✅ Microsoft Entra ID (MSAL) for authentication
- ✅ Microsoft Dataverse for data storage
- ✅ SharePoint for file storage

---

## Prerequisites

✅ You've completed:
- Phase 1: Azure & Power Platform setup
- Phase 2: Created 12 Dataverse tables
- Phase 3: Created 5 SharePoint libraries

✅ You have:
- Credentials in `.env.azure`
- Vercel Pro account (can be different Google/GitHub account - no problem!)

---

## Step 1: Get Dataverse Table Logical Names

**Important:** When Copilot created your tables, it assigned them "logical names" (schema names). We need to find these.

### Find Table Logical Names:

1. Go to: https://make.powerapps.com
2. Click **"Tables"** in left sidebar
3. For each table, click on it and look for **"Logical name"** in the properties

**Example:**
- Display Name: "Job"
- Logical Name: `cr6d1_job` or `new_job` (Copilot auto-generates this)

### Update the Dataverse Client:

Open `src/api/_lib/dataverse.ts` and update the `Tables` object with your actual logical names:

```typescript
export const Tables = {
  Job: 'YOUR_JOB_LOGICAL_NAME',           // e.g., 'cr6d1_job'
  Foreman: 'YOUR_FOREMAN_LOGICAL_NAME',   // e.g., 'cr6d1_foreman'
  QAPack: 'YOUR_QAPACK_LOGICAL_NAME',     // e.g., 'cr6d1_qapack'
  // ... etc for all 12 tables
};
```

---

## Step 2: Set Up Environment Variables

### Local Development:

1. Copy the template:
   ```bash
   cp .env.vercel.template .env.local
   ```

2. The file is already pre-filled with your credentials from `.env.azure`
3. Update `VITE_MSAL_REDIRECT_URI` to `http://localhost:5173`

### Vercel Production:

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add each variable from `.env.vercel.template`
4. Update `VITE_MSAL_REDIRECT_URI` to your Vercel domain (e.g., `https://sga-qa-system.vercel.app`)

---

## Step 3: Install New Dependencies

```bash
npm install @azure/msal-browser @azure/msal-react @microsoft/microsoft-graph-client
```

These packages provide:
- `@azure/msal-browser` - Microsoft authentication for React
- `@azure/msal-react` - React hooks for MSAL
- `@microsoft/microsoft-graph-client` - SharePoint integration

---

## Step 4: Update Authentication (Frontend)

Replace Auth0 with Microsoft Authentication.

**Current (Auth0):**
```tsx
import { Auth0Provider } from '@auth0/auth0-react';
```

**New (MSAL):**
```tsx
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
```

I'll create the authentication wrapper for you in the next step.

---

## Step 5: Migrate API Endpoints

Each API endpoint in `src/api/` needs to be updated to use Dataverse instead of Redis.

**Example Migration:**

### Before (Redis):
```typescript
// src/api/get-all-jobs.ts
import { redis } from './_lib/redis';

export default async function handler(req, res) {
  const jobs = await redis.hgetall('jobs:*');
  res.json({ jobs });
}
```

### After (Dataverse):
```typescript
// src/api/get-all-jobs.ts
import { getRecords, Tables } from './_lib/dataverse';

export default async function handler(req, res) {
  const jobs = await getRecords(Tables.Job);
  res.json({ jobs });
}
```

---

## Step 6: Test Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser
open http://localhost:5173
```

**Test checklist:**
- [ ] Can you log in with Microsoft account?
- [ ] Can you see data from Dataverse tables?
- [ ] Can you create a new job/QA pack?
- [ ] Can you upload files to SharePoint?

---

## Step 7: Deploy to Vercel

### Option 1: Via Vercel CLI (if installed)

```bash
vercel --prod
```

### Option 2: Via GitHub

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "feat: Integrate with Microsoft Dataverse and Entra ID"
   git push
   ```

2. Vercel will auto-deploy (if connected to GitHub)

### Option 3: Via Vercel Dashboard

1. Go to your Vercel project
2. Click **"Deploy"** → **"Upload Files"**
3. Drag your project folder
4. Click **"Deploy"**

**Note:** You can deploy from ANY GitHub account - just import the repo to Vercel from your other account!

---

## Step 8: Verify Production Deployment

1. Visit your Vercel app URL
2. Test authentication
3. Test data operations
4. Check browser console for errors

---

## Migration Checklist

**Phase 1: Setup (5 minutes)**
- [ ] Find Dataverse table logical names
- [ ] Update `Tables` object in `dataverse.ts`
- [ ] Copy `.env.vercel.template` to `.env.local`
- [ ] Install new dependencies

**Phase 2: Code Updates (30 minutes)**
- [ ] Update authentication (MSAL setup)
- [ ] Migrate API endpoints (one by one)
- [ ] Update file upload to use SharePoint
- [ ] Remove old dependencies (Auth0, Redis, S3)

**Phase 3: Testing (15 minutes)**
- [ ] Test locally
- [ ] Fix any errors
- [ ] Verify all features work

**Phase 4: Deployment (10 minutes)**
- [ ] Add environment variables to Vercel
- [ ] Deploy to production
- [ ] Test production deployment
- [ ] Celebrate! 🎉

---

## Files Created

**New files:**
- ✅ `src/api/_lib/dataverse.ts` - Dataverse API client
- ✅ `.env.vercel.template` - Environment variables template
- ⏳ `src/auth/msalConfig.ts` - MSAL configuration (next step)
- ⏳ `src/components/AuthProvider.tsx` - Authentication wrapper (next step)

**Files to update:**
- `src/App.tsx` - Replace Auth0Provider with MsalProvider
- `src/api/*.ts` - Update all API endpoints
- `package.json` - Add new dependencies, remove old ones

**Files to delete (after migration):**
- `src/api/_lib/redis.ts`
- `src/api/_lib/auth0.ts`
- `src/api/_lib/r2.ts` (S3 alternative)

---

## Troubleshooting

**Error: "Access token failed"**
- Check environment variables are set correctly
- Verify service principal has Dataverse permissions

**Error: "Table not found"**
- Check table logical names are correct
- Verify tables exist in Power Apps portal

**Error: "CORS policy"**
- Update Dataverse CORS settings in Power Platform admin center
- Add your Vercel domain to allowed origins

---

## Next Steps

After migration:
1. **Add detailed columns** to Dataverse tables (currently just primary columns)
2. **Set up relationships** between tables (Job → QA Packs, etc.)
3. **Configure security roles** for different user types
4. **Add Power Automate flows** for notifications
5. **Customize UI** based on user feedback

---

## Need Help?

**Documentation:**
- Dataverse Web API: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview
- MSAL.js: https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-overview
- SharePoint Graph API: https://learn.microsoft.com/en-us/graph/api/resources/sharepoint

**Getting Stuck?**
- Ask me (Claude) - I'll help you through each step!
- The migration can be done gradually - one API endpoint at a time

---

**Ready to start?** Let me know and I'll create the auth configuration files next!
