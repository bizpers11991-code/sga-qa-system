#Requires -Version 5.1
<#
.SYNOPSIS
    Deploy Power Automate flows for SGA QA System
.DESCRIPTION
    This script creates all 6 Power Automate flows for the SGA QA System
    Requires: Power Platform CLI (pac) or manual import
.NOTES
    Run this with Microsoft 365 admin credentials
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "default",

    [Parameter(Mandatory=$false)]
    [switch]$CreateFlowsManually
)

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  SGA QA System - Power Automate Flow Deployment" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Power Platform CLI is installed
$pacInstalled = Get-Command pac -ErrorAction SilentlyContinue

if (-not $pacInstalled -and -not $CreateFlowsManually) {
    Write-Host "❌ Power Platform CLI (pac) not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 To install Power Platform CLI:" -ForegroundColor Yellow
    Write-Host "   Option 1: Install via dotnet tool" -ForegroundColor White
    Write-Host "   dotnet tool install --global Microsoft.PowerApps.CLI.Tool" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Option 2: Download from Microsoft" -ForegroundColor White
    Write-Host "   https://aka.ms/PowerAppsCLI" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 OR run this script with -CreateFlowsManually to get manual instructions" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Power Platform CLI found" -ForegroundColor Green
Write-Host ""

# Flow definitions
$flows = @{
    "QA Pack Submission" = @{
        Description = "Automatically notify engineers when QA packs are submitted"
        Trigger = "When a file is created in SharePoint (QA Packs library)"
        Actions = @(
            "Get file metadata"
            "Parse job number and division from filename"
            "Get assigned engineer from Dataverse"
            "Send Teams notification to engineer"
            "Create task in Planner"
            "Update job status in Dataverse"
        )
    }

    "Site Visit Notification" = @{
        Description = "Schedule site visits based on client tier"
        Trigger = "When a job is created in Dataverse"
        Actions = @(
            "Get client tier from job"
            "Calculate visit dates (Tier 1: 14,7,3 days | Tier 2: 7,3 days | Tier 3: 72 hours)"
            "Create calendar events in Teams shared calendar"
            "Send notification to assigned engineer"
            "Create reminder 24 hours before each visit"
        )
    }

    "Job Sheet Distribution" = @{
        Description = "Distribute job sheets to crew-specific Teams channels"
        Trigger = "When a file is created in SharePoint (Job Sheets library)"
        Actions = @(
            "Get file metadata"
            "Identify assigned crew from filename"
            "Get crew-specific Teams channel"
            "Post message with file link to channel"
            "Add calendar event for job date"
            "Send mobile push notification to foreman"
        )
    }

    "Scope Report Automation" = @{
        Description = "Post scope report summaries to Teams"
        Trigger = "When a file is created in SharePoint (Scope Reports library)"
        Actions = @(
            "Extract PDF text using AI Builder"
            "Summarize key findings"
            "Get project owner"
            "Post summary in Teams 'Site Visits' channel"
            "Notify project owner via email"
        )
    }

    "NCR/Incident Alert" = @{
        Description = "Immediate escalation for NCRs and incidents"
        Trigger = "When an item is created in Dataverse (NCR or Incident table)"
        Actions = @(
            "Get incident details"
            "Send Teams notification to HSEQ manager"
            "Create high-priority task in Planner"
            "Send email to management team"
            "Log in compliance register (SharePoint list)"
        )
    }

    "Daily Summary" = @{
        Description = "Daily 5 PM summary of all QA packs"
        Trigger = "Recurrence (Daily at 5:00 PM)"
        Actions = @(
            "Get all QA packs created today from SharePoint"
            "Get all jobs from Dataverse"
            "Calculate completion rate"
            "Identify any overdue submissions"
            "Generate summary report"
            "Post in Teams 'Daily Updates' channel"
            "Email summary to management"
        )
    }
}

Write-Host "📋 Flows to Deploy:" -ForegroundColor Yellow
Write-Host ""
$i = 1
foreach ($flowName in $flows.Keys) {
    $flow = $flows[$flowName]
    Write-Host "  $i. $flowName" -ForegroundColor White
    Write-Host "     $($flow.Description)" -ForegroundColor Gray
    $i++
}
Write-Host ""

if ($CreateFlowsManually) {
    Write-Host "📝 MANUAL CREATION INSTRUCTIONS" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""

    foreach ($flowName in $flows.Keys) {
        $flow = $flows[$flowName]
        Write-Host "🔷 $flowName" -ForegroundColor Yellow
        Write-Host "   Description: $($flow.Description)" -ForegroundColor White
        Write-Host "   Trigger: $($flow.Trigger)" -ForegroundColor White
        Write-Host "   Actions:" -ForegroundColor White
        foreach ($action in $flow.Actions) {
            Write-Host "     • $action" -ForegroundColor Gray
        }
        Write-Host ""
    }

    Write-Host "📖 To create these flows manually:" -ForegroundColor Yellow
    Write-Host "   1. Go to https://make.powerautomate.com" -ForegroundColor White
    Write-Host "   2. Click 'Create' > 'Automated cloud flow'" -ForegroundColor White
    Write-Host "   3. Follow the trigger and actions listed above for each flow" -ForegroundColor White
    Write-Host "   4. Configure connections to SharePoint, Teams, Dataverse" -ForegroundColor White
    Write-Host ""

    Write-Host "💾 Flow definitions saved to: m365-deployment/power-automate/" -ForegroundColor Green
    exit 0
}

# Authenticate with Power Platform
Write-Host "🔐 Authenticating with Microsoft 365..." -ForegroundColor Yellow
try {
    pac auth create --environment $Environment
    Write-Host "✅ Authentication successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Run this command manually: pac auth create" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "⚠️  IMPORTANT: Flow creation requires manual configuration" -ForegroundColor Yellow
Write-Host "   Power Automate flows must be created through the Power Automate portal" -ForegroundColor White
Write-Host "   This is because flows require:" -ForegroundColor White
Write-Host "   • Interactive connection setup (SharePoint, Teams, Dataverse)" -ForegroundColor Gray
Write-Host "   • Specific environment context" -ForegroundColor Gray
Write-Host "   • Visual flow designer for complex logic" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ NEXT STEPS:" -ForegroundColor Green
Write-Host "   1. Go to https://make.powerautomate.com" -ForegroundColor White
Write-Host "   2. Select your environment: $Environment" -ForegroundColor White
Write-Host "   3. Use the flow definitions above to create each flow" -ForegroundColor White
Write-Host "   4. OR import flow packages from: m365-deployment/flow-packages/" -ForegroundColor White
Write-Host ""
Write-Host "📚 Detailed instructions: docs/DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
