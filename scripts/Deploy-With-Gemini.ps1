# Deploy-With-Gemini.ps1
# Automated deployment using Gemini AI to guide the process
#
# This script uses Gemini to provide step-by-step deployment commands
# while you work on other things

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("phase2", "phase3", "phase4", "all")]
    [string]$Phase = "all"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SGA QA Pack - Gemini-Assisted Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envUrl = "https://org02fe52d443c4f01189f5002248942fce.crm6.dynamics.com"

switch ($Phase) {
    "phase2" {
        Write-Host "🤖 Asking Gemini for Phase 2 deployment guidance..." -ForegroundColor Yellow
        node scripts/gemini-orchestrator.js phase2 --env-url=$envUrl
    }
    "phase3" {
        Write-Host "🤖 Running SharePoint library creation..." -ForegroundColor Yellow
        & "$PSScriptRoot\Create-SharePointLibraries.ps1"
    }
    "phase4" {
        Write-Host "🤖 Asking Gemini for Phase 4 (Power Apps) guidance..." -ForegroundColor Yellow
        node scripts/gemini-orchestrator.js ask "Guide me through deploying the Power App from src/power-app-source/ to environment $envUrl. Provide step-by-step PowerShell commands."
    }
    "all" {
        Write-Host "🚀 Starting complete deployment with Gemini assistance..." -ForegroundColor Green
        Write-Host ""
        Write-Host "This will guide you through:" -ForegroundColor Yellow
        Write-Host "  - Phase 2: Dataverse schema (30-45 mins)" -ForegroundColor White
        Write-Host "  - Phase 3: SharePoint libraries (2 mins)" -ForegroundColor White
        Write-Host "  - Phase 4: Power Apps deployment (30 mins)" -ForegroundColor White
        Write-Host ""

        $confirm = Read-Host "Continue? (yes/no)"
        if ($confirm -eq "yes") {
            Write-Host "`n=== PHASE 2: DATAVERSE SCHEMA ===" -ForegroundColor Cyan
            node scripts/gemini-orchestrator.js phase2 --env-url=$envUrl

            Write-Host "`nPhase 2 guidance complete. Review above and execute commands." -ForegroundColor Yellow
            Write-Host "When ready for Phase 3, press Enter..." -ForegroundColor Yellow
            Read-Host

            Write-Host "`n=== PHASE 3: SHAREPOINT LIBRARIES ===" -ForegroundColor Cyan
            & "$PSScriptRoot\Create-SharePointLibraries.ps1"

            Write-Host "`nPhase 3 complete! Press Enter for Phase 4..." -ForegroundColor Yellow
            Read-Host

            Write-Host "`n=== PHASE 4: POWER APPS ===" -ForegroundColor Cyan
            node scripts/gemini-orchestrator.js ask "Guide me through importing the Power App from src/power-app-source/ to environment $envUrl"
        }
    }
}

Write-Host "`n✅ Gemini guidance complete!" -ForegroundColor Green
Write-Host "Follow the commands provided above to complete deployment." -ForegroundColor White
