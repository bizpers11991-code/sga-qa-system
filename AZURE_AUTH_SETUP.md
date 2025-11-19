# Azure Authentication Setup for M365 Integration

**Created by:** Claude (Sonnet 4.5)
**Date:** November 18, 2025
**Purpose:** Unblock Gemini - Set up Azure App Registration for M365 deployment
**Status:** Ready to execute

---

## Your Azure Environment

**Tenant ID:** `7026ecbb-b41e-4aa0-9e68-a41eb80634fe`
**Subscription ID:** `0c3d20d9-5cc5-43ec-ae6c-4c6726d12d4c`
**SharePoint Site:** https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance

---

## What We're Setting Up

We need to create an **Azure App Registration** that will allow:
1. Power Automate flows to access SharePoint
2. Azure Functions to interact with Dataverse
3. The application to authenticate users
4. Automated workflows to send Teams notifications
5. Copilot to access application data

---

## STEP 1: Create Azure App Registration

### Option A: Using PowerShell (RECOMMENDED)

```powershell
# Login to Azure
az login --tenant 7026ecbb-b41e-4aa0-9e68-a41eb80634fe

# Set your subscription
az account set --subscription 0c3d20d9-5cc5-43ec-ae6c-4c6726d12d4c

# Verify you're in the right tenant
az account show

# Create the App Registration
az ad app create `
    --display-name "SGA QA Pack - Production" `
    --sign-in-audience "AzureADMyOrg" `
    --web-redirect-uris "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance" `
                         "https://global.consent.azure-apim.net/redirect" `
    --enable-access-token-issuance true `
    --enable-id-token-issuance true

# IMPORTANT: Save the output! You'll need the appId (Client ID)
```

**Expected output:**
```json
{
  "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "displayName": "SGA QA Pack - Production",
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  ...
}
```

**SAVE THESE VALUES:**
- `appId` = This is your **CLIENT_ID** (you'll use this everywhere)
- `id` = This is the **Object ID** (needed for some commands)

### Option B: Using Azure Portal (If PowerShell fails)

1. Go to: https://portal.azure.com
2. Navigate to **Microsoft Entra ID** (formerly Azure AD)
3. Click **App registrations** → **+ New registration**
4. Fill in:
   - **Name:** `SGA QA Pack - Production`
   - **Supported account types:** Accounts in this organizational directory only
   - **Redirect URI:**
     - Type: Web
     - URI: `https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance`
5. Click **Register**
6. **SAVE** the following from the Overview page:
   - **Application (client) ID**
   - **Directory (tenant) ID** (should match: 7026ecbb-b41e-4aa0-9e68-a41eb80634fe)

---

## STEP 2: Create Client Secret

You need a secret (password) for the app to authenticate.

### Using PowerShell:

```powershell
# Replace <APP_ID> with the appId from Step 1
$APP_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # REPLACE THIS!

# Create a client secret (valid for 24 months)
az ad app credential reset `
    --id $APP_ID `
    --append `
    --display-name "Production Secret" `
    --years 2

# IMPORTANT: Save the "password" field from output - you can NEVER see it again!
```

**Expected output:**
```json
{
  "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "password": "xxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "tenant": "7026ecbb-b41e-4aa0-9e68-a41eb80634fe"
}
```

**CRITICAL:** Save the `password` value immediately! This is your **CLIENT_SECRET**.

### Using Azure Portal:

1. Go to your App Registration
2. Click **Certificates & secrets**
3. Click **+ New client secret**
4. Description: `Production Secret`
5. Expires: `24 months`
6. Click **Add**
7. **IMMEDIATELY COPY** the **Value** - you cannot see it again!

---

## STEP 3: Configure API Permissions

Your app needs permissions to access Microsoft 365 services.

### Using PowerShell:

```powershell
# Replace with your App ID
$APP_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # REPLACE THIS!

# Add Microsoft Graph permissions
az ad app permission add `
    --id $APP_ID `
    --api 00000003-0000-0000-c000-000000000000 `
    --api-permissions `
        e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope `  # User.Read
        06da0dbc-49e2-44d2-8312-53f166ab848a=Scope `  # Directory.Read.All
        7ab1d382-f21e-4acd-a863-ba3e13f7da61=Role    # Directory.Read.All (Application)

# Add SharePoint permissions
az ad app permission add `
    --id $APP_ID `
    --api 00000003-0000-0ff1-ce00-000000000000 `
    --api-permissions `
        56680e0d-d2a3-4ae1-80d8-3c4f2100e3d0=Scope `  # AllSites.Write
        fbcd29d2-fcca-4405-afa2-d1f5e6435325=Scope    # AllSites.FullControl

# Add Dynamics CRM (Dataverse) permissions
az ad app permission add `
    --id $APP_ID `
    --api 00000007-0000-0000-c000-000000000000 `
    --api-permissions `
        78ce3f0f-a1ce-49c2-8cde-64b5c0896db4=Scope    # user_impersonation

# CRITICAL: Grant admin consent
az ad app permission admin-consent --id $APP_ID
```

### Using Azure Portal:

1. Go to your App Registration
2. Click **API permissions**
3. Click **+ Add a permission**

**Add these permissions:**

#### Microsoft Graph:
- **Delegated:**
  - `User.Read` - Sign in and read user profile
  - `Directory.Read.All` - Read directory data
  - `Team.ReadBasic.All` - Read Teams info
  - `Chat.ReadWrite` - Read and write chat messages (for notifications)
- **Application:**
  - `Directory.Read.All` - Read directory data

#### SharePoint:
- **Delegated:**
  - `AllSites.Write` - Create, edit, and delete items in all site collections
  - `AllSites.FullControl` - Full control of all site collections
- **Application:**
  - `Sites.ReadWrite.All` - Read and write items in all site collections

#### Dynamics CRM (Dataverse):
- **Delegated:**
  - `user_impersonation` - Access Dataverse as organization users

#### Microsoft Teams (via Graph):
- **Delegated:**
  - `ChannelMessage.Send` - Send channel messages
  - `ChatMessage.Send` - Send chat messages

**4. Grant Admin Consent:**
   - After adding all permissions, click **Grant admin consent for [Your Organization]**
   - Click **Yes** to confirm
   - All permissions should show green checkmarks

---

## STEP 4: Configure Authentication

### Using Azure Portal:

1. Go to your App Registration
2. Click **Authentication**
3. Under **Platform configurations**, click **Add a platform**
4. Select **Web**
5. Add redirect URIs:
   ```
   https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
   https://global.consent.azure-apim.net/redirect
   https://oauth.powerplatform.com/redirect
   ```
6. Under **Implicit grant and hybrid flows**, enable:
   - ✅ Access tokens (used for implicit flows)
   - ✅ ID tokens (used for implicit and hybrid flows)
7. Click **Save**

### Using PowerShell:

```powershell
# This was already done in Step 1, but to add more redirect URIs:
az ad app update `
    --id $APP_ID `
    --web-redirect-uris `
        "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance" `
        "https://global.consent.azure-apim.net/redirect" `
        "https://oauth.powerplatform.com/redirect"
```

---

## STEP 5: Expose API (For Custom Scopes)

This allows Power Automate and other services to request tokens.

### Using Azure Portal:

1. Go to your App Registration
2. Click **Expose an API**
3. Click **+ Add a scope**
4. For Application ID URI, accept default or use: `api://sga-qapack`
5. Click **Save and continue**
6. Configure the scope:
   - **Scope name:** `access_as_user`
   - **Who can consent:** Admins and users
   - **Admin consent display name:** Access SGA QA Pack as a user
   - **Admin consent description:** Allows the app to access SGA QA Pack on behalf of the signed-in user
   - **User consent display name:** Access SGA QA Pack
   - **User consent description:** Allows the app to access SGA QA Pack on your behalf
   - **State:** Enabled
7. Click **Add scope**

---

## STEP 6: Create Service Principal

The service principal allows Azure resources to authenticate.

### Using PowerShell:

```powershell
# Create service principal for the app
az ad sp create --id $APP_ID

# Assign it the Contributor role for your subscription (needed for Azure Functions)
az role assignment create `
    --assignee $APP_ID `
    --role Contributor `
    --scope /subscriptions/0c3d20d9-5cc5-43ec-ae6c-4c6726d12d4c

# Verify it was created
az ad sp show --id $APP_ID
```

---

## STEP 7: Configure SharePoint Site Permissions

Your app needs explicit permission to access the SharePoint site.

```powershell
# First, install PnP PowerShell if not already installed
Install-Module -Name PnP.PowerShell -Scope CurrentUser -Force

# Connect to your SharePoint site
Connect-PnPOnline -Url "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance" -Interactive

# Grant the app permissions to the site
# Replace <CLIENT_ID> with your App ID
Grant-PnPAzureADAppSitePermission `
    -AppId "<CLIENT_ID>" `
    -DisplayName "SGA QA Pack - Production" `
    -Permissions Write

# Verify permissions
Get-PnPAzureADAppSitePermission
```

---

## STEP 8: Save All Credentials

Create a secure file with all your authentication details:

```powershell
# Create a secure credentials file
$credentials = @"
# SGA QA Pack - Azure Authentication Credentials
# Created: $(Get-Date -Format "yyyy-MM-dd HH:mm")
# KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT

TENANT_ID=7026ecbb-b41e-4aa0-9e68-a41eb80634fe
SUBSCRIPTION_ID=0c3d20d9-5cc5-43ec-ae6c-4c6726d12d4c
CLIENT_ID=<YOUR_APP_ID_FROM_STEP_1>
CLIENT_SECRET=<YOUR_CLIENT_SECRET_FROM_STEP_2>
SHAREPOINT_SITE=https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance
REDIRECT_URI=https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance

# For Power Automate connections
OAUTH_REDIRECT=https://global.consent.azure-apim.net/redirect

# Application ID URI (from Step 5)
APP_ID_URI=api://sga-qapack
"@

# Save to .env.azure file
$credentials | Out-File -FilePath ".env.azure" -Encoding UTF8

Write-Host "Credentials saved to .env.azure" -ForegroundColor Green
Write-Host "Keep this file secure!" -ForegroundColor Yellow
```

---

## STEP 9: Test Authentication

Verify everything works:

```powershell
# Test 1: Verify you can get a token
$body = @{
    client_id     = "<YOUR_CLIENT_ID>"
    client_secret = "<YOUR_CLIENT_SECRET>"
    scope         = "https://graph.microsoft.com/.default"
    grant_type    = "client_credentials"
}

$tokenResponse = Invoke-RestMethod `
    -Uri "https://login.microsoftonline.com/7026ecbb-b41e-4aa0-9e68-a41eb80634fe/oauth2/v2.0/token" `
    -Method Post `
    -Body $body

if ($tokenResponse.access_token) {
    Write-Host "SUCCESS! Authentication is working!" -ForegroundColor Green
    Write-Host "Token expires in: $($tokenResponse.expires_in) seconds" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Could not get token" -ForegroundColor Red
}

# Test 2: Try accessing SharePoint
$headers = @{
    Authorization = "Bearer $($tokenResponse.access_token)"
    Accept        = "application/json"
}

$siteInfo = Invoke-RestMethod `
    -Uri "https://graph.microsoft.com/v1.0/sites/sgagroupcomau.sharepoint.com:/sites/SGAQualityAssurance" `
    -Headers $headers `
    -Method Get

if ($siteInfo) {
    Write-Host "SUCCESS! Can access SharePoint site!" -ForegroundColor Green
    Write-Host "Site name: $($siteInfo.displayName)" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Could not access SharePoint" -ForegroundColor Red
}
```

---

## Troubleshooting

### Error: "Insufficient privileges"
**Solution:** Make sure you granted admin consent in Step 3.

### Error: "AADSTS700016: Application not found in directory"
**Solution:** The service principal wasn't created. Run Step 6 again.

### Error: "Access denied to SharePoint site"
**Solution:** Run Step 7 to grant site-specific permissions.

### Error: "Invalid client secret"
**Solution:** The secret might have expired or was copied incorrectly. Create a new one in Step 2.

---

## What to Tell Gemini

Once you've completed this setup, provide Gemini with:

1. **CLIENT_ID** (from Step 1)
2. **CLIENT_SECRET** (from Step 2)
3. **TENANT_ID** (7026ecbb-b41e-4aa0-9e68-a41eb80634fe)
4. **SUBSCRIPTION_ID** (0c3d20d9-5cc5-43ec-ae6c-4c6726d12d4c)
5. Confirmation that all API permissions have admin consent
6. Confirmation that SharePoint site permissions are granted

Tell Gemini: "Azure authentication is configured. Proceed with Power Platform environment setup (Phase 1)."

---

## Security Notes

- The `.env.azure` file contains secrets - NEVER commit to Git
- Client secrets expire - set a calendar reminder to renew
- Use Azure Key Vault in production for storing secrets
- Regularly review app permissions and remove unused ones
- Monitor sign-in logs for unusual activity

---

## Next Steps for Gemini

After authentication is set up, Gemini should proceed with:

1. **Phase 1:** Create Power Platform environment
2. **Phase 2:** Deploy Dataverse schema
3. **Phase 3:** Import Power Apps
4. **Phase 4:** Configure Power Automate flows (they'll use these credentials!)
5. **Phase 5:** Deploy Azure Functions (they'll use these credentials!)

Refer to `GEMINI_TAKEOVER_PLAN.md` for detailed phase instructions.

---

**Setup complete! You've unblocked Gemini.**

The authentication foundation is now in place for the entire M365 deployment.
