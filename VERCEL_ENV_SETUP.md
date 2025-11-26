# Vercel Environment Variables Setup Guide

## ✅ Environment Variables Review

Based on the codebase analysis, here's the comprehensive review of your Vercel environment variables:

---

## 📋 Your Current Variables (Status Check)

### ✅ **REQUIRED - Currently Configured Correctly**

| Variable | Status | Purpose | Used By |
|----------|--------|---------|---------|
| `TENANT_ID` | ✅ Required | Azure AD Tenant ID for Microsoft services | SharePoint, Dataverse, Teams APIs |
| `CLIENT_ID` | ✅ Required | Azure AD App Registration Client ID | SharePoint, Dataverse, Teams APIs |
| `CLIENT_SECRET` | ✅ Required | Azure AD App Registration Secret | SharePoint, Dataverse, Teams APIs |
| `DATAVERSE_URL` | ✅ Required | Microsoft Dataverse instance URL | Dataverse API client |
| `SHAREPOINT_SITE_URL` | ✅ Required | SharePoint site URL for document storage | SharePoint API client |

### ✅ **REQUIRED - Frontend Variables (Correct)**

| Variable | Status | Purpose | Used By |
|----------|--------|---------|---------|
| `VITE_APP_ENCRYPTION_KEY` | ✅ Required | AES-256 encryption key for draft QA reports (min 32 chars) | Frontend encryption service |
| `VITE_MSAL_CLIENT_ID` | ✅ Required | Azure AD Client ID for frontend auth | MSAL browser authentication |
| `VITE_MSAL_AUTHORITY` | ✅ Required | Azure AD authority URL | MSAL browser authentication |
| `VITE_MSAL_REDIRECT_URI` | ✅ Required | OAuth redirect URI after login | MSAL browser authentication |

### ⚠️ **OPTIONAL - Currently Configured (Review Needed)**

| Variable | Status | Notes |
|----------|--------|-------|
| `BYPASS_AUTH` | ⚠️ Optional | Currently used for development. **Remove for production!** |
| `NODE_ENV` | ⚠️ Auto-set | Vercel sets this automatically. Can remove. |
| `VITE_APP_NAME` | ⚠️ Optional | Not used in codebase. Can remove unless needed. |
| `VITE_API_BASE_URL` | ⚠️ Optional | Not actively used (APIs use relative paths). Can remove. |

### ❌ **NOT USED - Can Be Removed**

| Variable | Status | Notes |
|----------|--------|-------|
| `SHAREPOINT_LIBRARY_QAPACKS` | ❌ Not used | Hardcoded in sharepoint.ts as 'QA Packs' |
| `SHAREPOINT_LIBRARY_JOBSHEETS` | ❌ Not used | Hardcoded in sharepoint.ts as 'Job Sheets' |
| `SHAREPOINT_LIBRARY_SITEPHOTOS` | ❌ Not used | Hardcoded in sharepoint.ts as 'Site Photos' |
| `SHAREPOINT_LIBRARY_INCIDENTS` | ❌ Not used | Hardcoded in sharepoint.ts as 'Incident Reports' |
| `SHAREPOINT_LIBRARY_NCRS` | ❌ Not used | Hardcoded in sharepoint.ts as 'NCR Documents' |

---

## 🔴 CRITICAL: Missing Required Variables

### **Must Add These to Vercel:**

#### 1. **Redis/Upstash Variables** (CRITICAL - App Won't Work Without These!)

```bash
# Option A: Upstash Redis Direct Integration
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token_here

# OR Option B: Vercel KV (if using Vercel's managed Redis)
KV_REST_API_URL=https://your-kv-instance.vercel-storage.com
KV_REST_API_TOKEN=your_kv_token_here
```

**Why:** All API endpoints use Redis for data storage. Without this, every API call will fail with `DATABASE_CONFIGURATION_ERROR`.

**How to get:**
- **Option A**: Go to [Upstash Console](https://console.upstash.com) → Create Redis database → Copy REST URL and Token
- **Option B**: In Vercel dashboard → Storage → Create KV Database → Variables auto-added

#### 2. **Gemini API Key** (Required for AI features)

```bash
API_KEY=your_gemini_api_key_here
```

**Why:** Used for:
- AI-generated report summaries
- Daily briefings
- Risk analysis
- Job detail extraction
- Anomaly detection

**How to get:** [Google AI Studio](https://aistudio.google.com/apikey) → Create API key

#### 3. **Auth0 Variables** (Required when auth is enabled)

```bash
AUTH0_DOMAIN=your-tenant.auth0.com
```

**Why:** Currently bypassed for development, but needed for production authentication.

**How to get:** [Auth0 Dashboard](https://manage.auth0.com/) → Applications → Your App → Settings

---

## 📝 Recommended Environment Variables Configuration

### **For Immediate Deployment (Development/Testing):**

```bash
# ========================================
# CRITICAL - MUST HAVE
# ========================================

# Redis/Upstash (choose one option)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token_here

# Gemini AI
API_KEY=your_gemini_api_key_here

# Azure AD (Backend Services)
TENANT_ID=7026ecbb-b41e-4aa0-9e68-a41eb80634fe
CLIENT_ID=fbd9d6a2-67fb-4364-88e0-850b11c75db9
CLIENT_SECRET=your_client_secret_here

# Dataverse
DATAVERSE_URL=https://org24044a7d.crm6.dynamics.com

# SharePoint
SHAREPOINT_SITE_URL=https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance

# ========================================
# FRONTEND VARIABLES (Vite - must start with VITE_)
# ========================================

# Encryption
VITE_APP_ENCRYPTION_KEY=your_32_character_encryption_key_here

# MSAL Authentication
VITE_MSAL_CLIENT_ID=fbd9d6a2-67fb-4364-88e0-850b11c75db9
VITE_MSAL_AUTHORITY=https://login.microsoftonline.com/7026ecbb-b41e-4aa0-9e68-a41eb80634fe
VITE_MSAL_REDIRECT_URI=https://your-app.vercel.app

# ========================================
# DEVELOPMENT ONLY (Remove for production)
# ========================================

# Temporarily bypass authentication
BYPASS_AUTH=true
```

### **For Production Deployment:**

```bash
# Remove these:
# - BYPASS_AUTH
# - NODE_ENV (Vercel sets automatically)
# - VITE_APP_NAME (not used)
# - VITE_API_BASE_URL (not used)
# - All SHAREPOINT_LIBRARY_* (not used)

# Add these:
# - AUTH0_DOMAIN (for real authentication)
```

---

## 🔧 How to Set Variables in Vercel

### Method 1: Vercel Dashboard

1. Go to your project in Vercel dashboard
2. Settings → Environment Variables
3. Add each variable with appropriate scope:
   - **Production**: Live environment
   - **Preview**: PR deployments
   - **Development**: Local development

### Method 2: Vercel CLI

```bash
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_URL preview
vercel env add UPSTASH_REDIS_REST_URL development
```

### Method 3: Bulk Import

Create `.env.production` locally:
```bash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=AbCd...
API_KEY=AIza...
# ... all other variables
```

Then run:
```bash
vercel env pull .env.vercel
```

---

## 🚨 Security Recommendations

### 1. **Sensitive Variables - Never Commit**
- ✅ Add to `.gitignore`: `.env`, `.env.local`, `.env.production`
- ✅ Use Vercel's encrypted environment variable storage
- ✅ Rotate secrets regularly (especially CLIENT_SECRET, API_KEY)

### 2. **Frontend Variables (VITE_*)**
- ⚠️ These are PUBLIC - visible in browser JavaScript
- ❌ Never put secrets in VITE_ variables
- ✅ Only use for non-sensitive config (client IDs, redirect URIs)

### 3. **Backend Variables**
- ✅ These stay server-side (API endpoints only)
- ✅ Can contain secrets (CLIENT_SECRET, API_KEY, Redis tokens)

### 4. **Encryption Key**
- ✅ Generate secure 32+ character key:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- ✅ Never reuse across environments (dev/staging/prod)

---

## 🔍 Verification Checklist

After configuring variables in Vercel:

- [ ] Build passes in Vercel (check deployment logs)
- [ ] API endpoints return 200 (not 500 "DATABASE_CONFIGURATION_ERROR")
- [ ] Redis connection works (check `/api/get-all-jobs`)
- [ ] AI features work (check `/api/generate-ai-summary`)
- [ ] SharePoint integration works (check document uploads)
- [ ] Authentication works (if AUTH0_DOMAIN is set)

---

## 📞 Troubleshooting

### Error: "DATABASE_CONFIGURATION_ERROR"
**Cause:** Missing `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN`
**Fix:** Add Redis variables to Vercel environment

### Error: "Authentication service is misconfigured"
**Cause:** `AUTH0_DOMAIN` not set (when auth bypass is disabled)
**Fix:** Add `AUTH0_DOMAIN` or keep `BYPASS_AUTH=true` for development

### Error: "FATAL: API_KEY environment variable not set"
**Cause:** Missing Gemini API key
**Fix:** Add `API_KEY` to Vercel environment

### Build fails with "import.meta.env.VITE_* is undefined"
**Cause:** Frontend variable not set
**Fix:** Add all `VITE_*` variables to Vercel

---

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables)
- [Upstash Redis Setup](https://console.upstash.com)
- [Google AI Studio](https://aistudio.google.com)
- [Azure AD App Registration](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps)

---

**Last Updated:** November 26, 2025
**Project:** SGA QA System v2.2.0
