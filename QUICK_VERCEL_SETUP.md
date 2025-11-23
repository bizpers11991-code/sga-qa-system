# Quick Vercel Setup - 5 Minutes ⚡

## Step 1: Generate Encryption Key (30 seconds)

Open PowerShell and run:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (should be 64 characters). You'll use this in Step 3.

## Step 2: Azure AD Redirect URI (1 minute)

1. Get your Vercel deployment URL (e.g., `https://sga-qa-system.vercel.app`)
2. Go to: https://portal.azure.com
3. Navigate to: **Azure Active Directory** → **App registrations**
4. Find app ID: `fbd9d6a2-67fb-4364-88e0-850b11c75db9`
5. Click **Authentication** → **Add a platform** → **Single-page application**
6. Add URL: `https://your-app.vercel.app` (replace with your actual Vercel URL)
7. Click **Save**

## Step 3: Vercel Environment Variables (3 minutes)

Go to: https://vercel.com → Your Project → **Settings** → **Environment Variables**

Add these variables (click "Add" for each):

### Required Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_MSAL_CLIENT_ID` | `fbd9d6a2-67fb-4364-88e0-850b11c75db9` | Production, Preview, Development |
| `VITE_MSAL_AUTHORITY` | `https://login.microsoftonline.com/7026ecbb-b41e-4aa0-9e68-a41eb80634fe` | Production, Preview, Development |
| `VITE_MSAL_REDIRECT_URI` | `https://your-app.vercel.app` | Production |
| `VITE_API_BASE_URL` | `/api` | Production, Preview, Development |
| `VITE_APP_ENCRYPTION_KEY` | `<paste-key-from-step-1>` | Production, Preview, Development |

**Important:**
- Replace `your-app.vercel.app` with your actual Vercel deployment URL
- Use the encryption key you generated in Step 1

### Optional Variables (Add Later):

| Name | Value | Notes |
|------|-------|-------|
| `SHAREPOINT_SITE_URL` | `https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance` | For SharePoint integration |
| `CLIENT_SECRET` | `<your-azure-client-secret>` | For backend API calls |
| `VITE_MS_GRAPH_CALENDAR_ID` | `<your-calendar-id>` | For calendar integration |

## Step 4: Deploy (1 minute)

Your app is already connected to GitHub. Just push to trigger deployment:

```bash
git add .
git commit -m "Production ready for Vercel deployment"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Install dependencies
3. Run `npm run build`
4. Deploy to production

## Step 5: Verify (30 seconds)

1. Go to your Vercel deployment URL
2. Click **Sign In**
3. Login with your Microsoft account
4. Verify you can access the dashboard

## ✅ Done! Your app is live!

---

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the Vercel URL in environment variables matches exactly
- Ensure you added it to Azure AD (Step 2)
- Wait 5 minutes for Azure AD to propagate changes

### "Encryption key not configured" error
- Verify `VITE_APP_ENCRYPTION_KEY` is set in Vercel
- Must be at least 32 characters
- Redeploy to apply changes

### Build fails
- Check Vercel build logs for specific error
- Ensure all required environment variables are set
- Contact support if issue persists

---

**Need detailed instructions?** See `VERCEL_DEPLOYMENT_GUIDE.md`
