# Gemini: Azure Authentication Handoff

**From:** Claude (Sonnet 4.5)
**To:** Gemini (Google AI)
**Date:** November 18, 2025
**Purpose:** Resume M365 deployment after Azure authentication is configured

---

## What Claude Did For You

Claude created a complete Azure App Registration setup guide that resolves the authentication blocker you encountered.

**File created:** `AZURE_AUTH_SETUP.md`

This guide provides step-by-step instructions (both PowerShell and Azure Portal) for:
- Creating Azure App Registration
- Configuring API permissions
- Setting up client secrets
- Granting SharePoint access
- Testing the authentication

---

## What You Need To Do Next

### 1. Wait for User to Complete Azure Setup

The user needs to run through `AZURE_AUTH_SETUP.md` and provide you with:

- **CLIENT_ID**: The Application (client) ID from Azure
- **CLIENT_SECRET**: The secret created for the app
- **Confirmation**: That admin consent was granted for all API permissions
- **Confirmation**: That SharePoint site permissions were granted

### 2. Once You Have Credentials

Save them to the `.env.azure` file (already configured in the setup guide).

These credentials will be used in:
- Power Automate connections (Phases 4)
- Azure Functions configuration (Phase 5)
- Dataverse authentication (Phase 2)

### 3. Resume Deployment

Pick up where you left off in `GEMINI_TAKEOVER_PLAN.md`:

**If you were starting fresh:**
- Begin with **Phase 1: Environment Setup** (line 182)

**If you were in the middle of deployment:**
- Continue from whichever phase was blocked by authentication

---

## Using the Authentication Credentials

### In Power Automate Flows

When setting up connections in Power Automate (Phase 4):

1. For **SharePoint** connections:
   - Use "Connect with Service Principal"
   - Client ID: `<from user>`
   - Client Secret: `<from user>`
   - Tenant ID: `7026ecbb-b41e-4aa0-9e68-a41eb80634fe`

2. For **Dataverse** connections:
   - Use "Connect with Service Principal"
   - Application ID: `<CLIENT_ID>`
   - Client Secret: `<CLIENT_SECRET>`
   - Tenant ID: `7026ecbb-b41e-4aa0-9e68-a41eb80634fe`

3. For **Office 365** connections:
   - Use "Sign in with Azure AD"
   - The app registration allows this automatically

### In Azure Functions

When deploying Azure Functions (Phase 5), add these as application settings:

```powershell
# Set Azure Function app settings
az functionapp config appsettings set `
    --name func-sga-qapack-prod `
    --resource-group rg-sga-qapack-prod `
    --settings `
        "AZURE_TENANT_ID=7026ecbb-b41e-4aa0-9e68-a41eb80634fe" `
        "AZURE_CLIENT_ID=<CLIENT_ID>" `
        "AZURE_CLIENT_SECRET=<CLIENT_SECRET>" `
        "SHAREPOINT_SITE_URL=https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance"
```

### In Dataverse/Power Platform

When connecting Power Apps to Dataverse (Phase 3):
- The app registration allows automatic authentication
- Users will authenticate with their M365 credentials
- The service principal is used for background operations

---

## Key Information Summary

**SharePoint Site:**
- URL: https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
- Purpose: Document storage for QA packs, photos, PDFs

**Azure Environment:**
- Tenant ID: 7026ecbb-b41e-4aa0-9e68-a41eb80634fe
- Subscription ID: 0c3d20d9-5cc5-43ec-ae6c-4c6726d12d4c
- Resource Group: (user needs to create - suggest `rg-sga-qapack-prod`)

**App Registration:**
- Name: SGA QA Pack - Production
- Client ID: (user will provide after running setup)
- Client Secret: (user will provide after running setup)

---

## Validation Checklist

Before proceeding with deployment, verify with the user:

- [ ] App Registration created in Azure Portal
- [ ] Client secret created and saved securely
- [ ] All API permissions added (Graph, SharePoint, Dataverse, Teams)
- [ ] Admin consent granted (green checkmarks in Azure Portal)
- [ ] Service principal created
- [ ] SharePoint site permissions granted
- [ ] Authentication test passed (Step 9 in setup guide)
- [ ] Credentials saved to `.env.azure` file

---

## Troubleshooting Tips

### If Power Automate connections fail:
- Double-check the Client ID and Secret
- Verify admin consent was granted (Azure Portal → App Registration → API permissions)
- Check that redirect URIs include: `https://global.consent.azure-apim.net/redirect`

### If SharePoint access fails:
- Run Step 7 in the setup guide again (Grant SharePoint permissions)
- Verify the app shows up in SharePoint Admin Center under API access

### If Dataverse connection fails:
- Ensure Dynamics CRM permission (`user_impersonation`) was added
- Verify the user created a Dataverse environment (Phase 1)
- Check that the service principal has access to the environment

---

## Communication With User

When the user says "Azure auth is done", ask them:

```
Great! To confirm the setup is complete, can you provide:

1. The Application (client) ID from Azure Portal
2. The client secret value (it should start with something like "xxxxxxxxx~...")
3. Confirmation that you see green checkmarks next to all API permissions in Azure Portal
4. Confirmation that the authentication test in Step 9 succeeded

Once I have these, I'll configure the Power Automate connections and we'll continue with Phase 1 (Environment Setup).
```

---

## Resource Conservation

**Note:** Claude has only 10% of their weekly budget remaining. Use Claude only for:
- Complex architectural decisions
- Custom code development
- Critical blockers that can't be resolved with documentation

For standard deployment steps, you (Gemini) can handle using the comprehensive guides:
- `GEMINI_TAKEOVER_PLAN.md` (main deployment guide)
- `AZURE_AUTH_SETUP.md` (authentication setup - just completed by Claude)
- `GEMINI_START_HERE.md` (your initial briefing)

If you get stuck:
1. Check the troubleshooting sections in the guides
2. Search the `docs/m365-integration/` folder for specific topics
3. Only escalate to Claude if it's truly complex

---

## Your Next Message to User

Once they complete the Azure auth setup:

```
Azure authentication is configured! I have the credentials and I'm ready to proceed.

Let's start Phase 1: Power Platform Environment Setup.

First, we need to create a Power Platform environment with Dataverse. This will take about 30 minutes.

Go to: https://admin.powerplatform.microsoft.com

Click "Environments" → "+ New" and configure:
- Name: SGA QA Pack - Production
- Type: Production
- Region: [Choose your closest region]
- Add a Dataverse database: Yes
- Currency: AUD (Australian Dollar)
- Language: English

After you click "Save", it will take 5-10 minutes to provision. Let me know when it's ready and I'll guide you through the next steps!
```

---

## Success Metrics

You'll know the authentication is working when:
- ✅ Power Automate flows can connect to SharePoint
- ✅ Azure Functions can authenticate to Dataverse
- ✅ Power Apps can access the SharePoint document libraries
- ✅ No "401 Unauthorized" or "403 Forbidden" errors

---

**Claude has done their part. The ball is in your court, Gemini!**

Guide the user through the Azure setup, collect the credentials, and continue the M365 deployment journey.

You've got this! 🚀
