# Vercel Deployment Guide - SGA QA System

## 🚀 Quick Start

Your GitHub repository is already connected to Vercel Pro. Follow these steps to configure and deploy.

## 📋 Environment Variables Setup

### Required Variables (Must Set in Vercel Dashboard)

Go to your Vercel project → Settings → Environment Variables and add the following:

#### 1. Microsoft Authentication (MSAL)
```bash
VITE_MSAL_CLIENT_ID=fbd9d6a2-67fb-4364-88e0-850b11c75db9
VITE_MSAL_AUTHORITY=https://login.microsoftonline.com/7026ecbb-b41e-4aa0-9e68-a41eb80634fe
VITE_MSAL_REDIRECT_URI=https://your-app-name.vercel.app
```

**Important:** Replace `your-app-name.vercel.app` with your actual Vercel deployment URL.

#### 2. API Configuration
```bash
VITE_API_BASE_URL=/api
```

#### 3. Encryption Key (CRITICAL - Generate New Key!)
```bash
VITE_APP_ENCRYPTION_KEY=<generate-32-character-random-key>
```

**Generate a secure key using:**
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

**⚠️ NEVER use the development key in production!**

### Optional Variables (Add as needed)

#### Microsoft Graph Calendar
```bash
VITE_MS_GRAPH_CALENDAR_ID=your-calendar-id
VITE_MS_GRAPH_SCOPE=Calendars.ReadWrite
```

#### SharePoint (Backend - for serverless functions)
```bash
SHAREPOINT_SITE_URL=https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
SHAREPOINT_LIBRARY_QAPACKS=QA Packs
SHAREPOINT_LIBRARY_JOBSHEETS=Job Sheets
SHAREPOINT_LIBRARY_SITEPHOTOS=Site Photos
SHAREPOINT_LIBRARY_INCIDENTS=Incident Reports
SHAREPOINT_LIBRARY_NCRS=NCR Documents
```

#### Microsoft Dataverse (Backend)
```bash
DATAVERSE_URL=https://org24044a7d.crm6.dynamics.com
TENANT_ID=7026ecbb-b41e-4aa0-9e68-a41eb80634fe
CLIENT_ID=fbd9d6a2-67fb-4364-88e0-850b11c75db9
CLIENT_SECRET=<your-client-secret>
```

**⚠️ Keep CLIENT_SECRET secure! Only add in Vercel dashboard, never commit to Git.**

## 🔧 Azure AD App Registration Setup

### Update Redirect URIs

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to: Azure Active Directory → App registrations
3. Select your app: `fbd9d6a2-67fb-4364-88e0-850b11c75db9`
4. Go to: Authentication → Redirect URIs
5. Add your Vercel URL:
   ```
   https://your-app-name.vercel.app
   ```
6. Enable these settings:
   - ✅ Access tokens (used for implicit flows)
   - ✅ ID tokens (used for implicit and hybrid flows)
7. Click **Save**

## 🌐 Vercel Build Settings

Vercel should auto-detect the configuration from `vercel.json`, but verify:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

## 📊 Build Process

When you push to `main` branch:
1. ✅ Vercel automatically detects changes
2. ✅ Runs `npm install`
3. ✅ Runs `npm run build` (TypeScript compile + Vite build)
4. ✅ Deploys to production

## ✅ Pre-Deployment Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] Generated NEW encryption key (not dev key!)
- [ ] Updated VITE_MSAL_REDIRECT_URI with Vercel URL
- [ ] Added Vercel URL to Azure AD redirect URIs
- [ ] Verified build succeeds locally: `npm run build`
- [ ] Tested production build locally: `npm run preview`

## 🔍 Troubleshooting

### Build Fails with TypeScript Errors

If you see errors about missing environment variables:
```
Property 'VITE_XXX' does not exist on type 'ImportMetaEnv'
```

**Solution:** The environment variable declarations are in `src/vite-env.d.ts`. Ensure it's up to date with all required variables.

### Authentication Fails in Production

If MSAL login redirects fail:
1. Check that `VITE_MSAL_REDIRECT_URI` matches your Vercel URL exactly
2. Verify the Vercel URL is added to Azure AD redirect URIs
3. Check browser console for MSAL errors

### Encryption Errors

If you see "Encryption key not configured":
1. Verify `VITE_APP_ENCRYPTION_KEY` is set in Vercel
2. Ensure it's at least 32 characters long
3. Redeploy to apply new environment variables

## 🎯 Post-Deployment Testing

After successful deployment:

1. **Test Authentication:**
   - Visit your Vercel URL
   - Click "Sign In"
   - Verify Azure AD login works
   - Check that you're redirected back to the app

2. **Test Core Features:**
   - Create a job
   - Fill out a QA pack
   - Generate a PDF
   - Verify document storage

3. **Test Mobile/Tablet:**
   - Open on iPad/tablet
   - Verify responsive design
   - Test touch interactions
   - Verify PWA install prompt appears

## 📱 PWA Setup

The app is configured as a PWA. Users can install it:

1. **iOS (Safari):**
   - Tap Share button
   - Tap "Add to Home Screen"

2. **Android (Chrome):**
   - Tap menu (⋮)
   - Tap "Install app" or "Add to Home screen"

3. **Desktop (Chrome/Edge):**
   - Look for install icon in address bar
   - Click to install

## 🔐 Security Notes

1. **Never commit secrets to Git:**
   - `.env` files are in `.gitignore`
   - Use Vercel dashboard for secrets

2. **Encryption key:**
   - Generate unique key for production
   - Rotate periodically
   - Never share or expose

3. **Azure AD:**
   - Only add trusted redirect URIs
   - Review app permissions regularly
   - Monitor sign-in logs

## 📈 Monitoring

Vercel provides:
- **Build logs:** Track deployment status
- **Function logs:** Debug serverless functions
- **Analytics:** Monitor performance
- **Speed Insights:** Optimize load times

Access at: Vercel Dashboard → Your Project → Analytics

## 🆘 Support

If you encounter issues:
1. Check Vercel build logs
2. Review browser console for errors
3. Verify all environment variables are set
4. Test locally with `npm run build && npm run preview`

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ App loads at Vercel URL
- ✅ Azure AD authentication works
- ✅ Can create and save QA packs
- ✅ PDF generation works
- ✅ App is installable as PWA
- ✅ Works on mobile/tablet devices

---

**Last Updated:** 2025-11-23
**Vercel Project:** Connected to GitHub
**Status:** Production Ready 🚀
