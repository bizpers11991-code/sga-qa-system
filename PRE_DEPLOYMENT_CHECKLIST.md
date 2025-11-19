# ✅ Pre-Deployment Environment Checklist

**Run this checklist before starting M365 deployment**
**For: Gemini AI Assistant**
**Date: November 17, 2025**

---

## 🔍 Quick Environment Verification

Have the user run these commands to verify everything is ready:

### 1. Check Development Tools

```powershell
# Node.js version (should be v14+ or higher)
node --version
# Expected: v24.11.1 ✅

# npm version (should be v6+ or higher)
npm --version
# Expected: v11.6.2 ✅

# TypeScript compiler (if needed)
npx tsc --version
```

### 2. Check .NET and Azure Tools

```powershell
# .NET SDK (should be 6.0+ or higher)
dotnet --version
# Expected: 8.0.416 ✅

# Azure CLI (should be 2.50+ or higher)
az --version | Select-Object -First 1
# Expected: 2.79.0 ✅

# Azure Functions Core Tools (should be v4+)
func --version
# Expected: 4.5.0 ✅
```

### 3. Check Power Platform Tools

```powershell
# Power Platform CLI (THIS NEEDS FIXING!)
pac --version
# Expected: Version number OR error

# If error, install with:
# Option 1: Direct download from https://aka.ms/PowerAppsCLI
# Option 2: winget install Microsoft.PowerPlatformCLI
# Option 3: See GEMINI_START_HERE.md for detailed steps
```

### 4. Check PowerShell Modules

```powershell
# List installed Power Platform modules
Get-Module -ListAvailable | Where-Object { $_.Name -like "*PowerApps*" }
# Should show:
# - Microsoft.PowerApps.Administration.PowerShell
# - Microsoft.PowerApps.PowerShell

# If missing, install with:
Install-Module -Name Microsoft.PowerApps.Administration.PowerShell -Force -AllowClobber
Install-Module -Name Microsoft.PowerApps.PowerShell -Force -AllowClobber
```

### 5. Verify Project Dependencies

```powershell
# Check if node_modules installed
Test-Path ".\node_modules" | ForEach-Object { if ($_) { "✅ node_modules exists" } else { "❌ Run: npm install" } }

# Check Azure Functions dependencies
Test-Path ".\m365-deployment\azure-functions\node_modules" | ForEach-Object {
    if ($_) { "✅ Azure Functions dependencies exist" }
    else { "❌ Run: cd m365-deployment\azure-functions && npm install" }
}
```

### 6. Verify API Keys Configuration

```powershell
# Check if .env file exists
Test-Path ".\.env" | ForEach-Object { if ($_) { "✅ .env file exists" } else { "❌ Copy .env.example to .env" } }

# Check for critical API keys (without revealing values)
if (Test-Path ".\.env") {
    Write-Host "`n🔑 API Keys Status:"
    Select-String "GOOGLE_API_KEY" .env | ForEach-Object {
        $value = $_.Line -split "=",2
        if ($value[1] -and $value[1] -ne "your_paid_gemini_api_key_here") {
            "✅ Gemini API Key: Configured"
        } else {
            "⚠️ Gemini API Key: Not configured"
        }
    }

    # Check other keys
    @("OPENCODE_API_KEY", "OPENROUTER_API_KEY") | ForEach-Object {
        if (Select-String $_ .env -Quiet) {
            "ℹ️ $_ : Present in .env"
        }
    }
}
```

### 7. Azure Authentication Check

```powershell
# Check if logged in to Azure CLI
az account show 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Azure CLI: Authenticated"
    az account show --query "{Subscription:name, ID:id}" -o table
} else {
    Write-Host "⚠️ Azure CLI: Not authenticated"
    Write-Host "Run: az login"
}
```

### 8. Power Platform Authentication Check

```powershell
# Try to get Power Platform environments (will prompt if not logged in)
Write-Host "`nChecking Power Platform access..."
try {
    Get-AdminPowerAppEnvironment -ErrorAction Stop | Select-Object -First 1 | Out-Null
    Write-Host "✅ Power Platform: Authenticated"
} catch {
    Write-Host "⚠️ Power Platform: Not authenticated or no access"
    Write-Host "Run: Add-PowerAppsAccount"
}
```

---

## 📋 Full Checklist Summary

Copy this and have user fill it out:

```
PRE-DEPLOYMENT CHECKLIST
========================

Development Tools:
[ ] Node.js v24+ installed
[ ] npm v11+ installed
[ ] TypeScript available

.NET & Azure:
[ ] .NET SDK 8+ installed
[ ] Azure CLI 2.50+ installed
[ ] Azure Functions Core Tools v4 installed
[ ] Azure CLI authenticated (az login)

Power Platform:
[ ] Power Platform CLI (pac) installed
[ ] PowerShell modules installed:
    [ ] Microsoft.PowerApps.Administration.PowerShell
    [ ] Microsoft.PowerApps.PowerShell
[ ] Power Platform authenticated (Add-PowerAppsAccount)

Project Setup:
[ ] Project cloned to: C:\Dhruv\sga-qa-pack
[ ] npm install completed (main project)
[ ] npm install completed (azure-functions folder)
[ ] .env file created and configured
[ ] Gemini API key configured in .env

Permissions Required:
[ ] Global Administrator OR Power Platform Administrator
[ ] Application Administrator in Azure AD
[ ] Owner access to Azure subscription
[ ] Power Apps license (per app or per user plan)

Ready to Deploy:
[ ] All items above checked
[ ] User has 8-12 hours available over next 2-3 days
[ ] User has M365 tenant with admin access
[ ] User understands this is a multi-phase deployment
```

---

## 🚨 Common Issues & Quick Fixes

### Issue 1: pac command not found
**Fix:**
```powershell
# Add to PATH manually
$env:PATH += ";$env:USERPROFILE\.dotnet\tools"

# Or install via alternative method
Invoke-WebRequest -Uri "https://aka.ms/PowerAppsCLI" -OutFile "$env:TEMP\PowerPlatformCLI.msi"
Start-Process msiexec.exe -Wait -ArgumentList "/i $env:TEMP\PowerPlatformCLI.msi /quiet"

# Restart PowerShell after installation
```

### Issue 2: PowerShell module import fails
**Fix:**
```powershell
# Update PowerShellGet first
Install-Module -Name PowerShellGet -Force -AllowClobber

# Then install Power Apps modules
Install-Module -Name Microsoft.PowerApps.Administration.PowerShell -Force -AllowClobber
Install-Module -Name Microsoft.PowerApps.PowerShell -Force -AllowClobber
```

### Issue 3: Azure CLI not authenticated
**Fix:**
```powershell
# Login to Azure
az login

# Select correct subscription
az account list -o table
az account set --subscription "<subscription-id or name>"
```

### Issue 4: .env file missing
**Fix:**
```powershell
# Copy template
Copy-Item .env.example .env

# Open in editor
notepad .env

# Add your Gemini API key from: https://aistudio.google.com/apikey
```

### Issue 5: npm install fails
**Fix:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall
npm install
```

---

## 🎯 Once All Checks Pass

**User is ready to proceed with Phase 1!**

Have them open:
1. `GEMINI_START_HERE.md` - Your onboarding guide
2. `GEMINI_TAKEOVER_PLAN.md` - Detailed 12-phase deployment plan

Start with **Phase 1: Environment Setup**

---

## 💡 Quick Tips for Gemini

1. ✅ Run this checklist FIRST before starting any deployment
2. ✅ Don't proceed if critical items are missing (Azure CLI, .NET SDK, etc.)
3. ✅ Power Platform CLI is important but not a blocker - can use web UI
4. ✅ Make sure user is authenticated to both Azure AND Power Platform
5. ✅ Verify API keys are configured (especially Gemini!)
6. ✅ Keep this checklist handy for troubleshooting later

---

**Ready? Let's deploy! 🚀**
