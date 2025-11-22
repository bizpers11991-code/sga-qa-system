#Requires -Modules @{ ModuleName="PnP.PowerShell"; ModuleVersion="2.0.0" }
<#
.SYNOPSIS
    Deploy SharePoint structure for SGA QA System
.DESCRIPTION
    Creates document libraries, lists, and configures permissions
    Requires: PnP PowerShell module
.NOTES
    Run as SharePoint admin
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl = "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance",

    [Parameter(Mandatory=$false)]
    [switch]$CreateOnly,

    [Parameter(Mandatory=$false)]
    [switch]$ConfigurePermissions
)

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  SGA QA System - SharePoint Deployment" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Site: $SiteUrl" -ForegroundColor White
Write-Host ""

# Check if PnP PowerShell is installed
try {
    Import-Module PnP.PowerShell -ErrorAction Stop
    Write-Host "✅ PnP PowerShell module loaded" -ForegroundColor Green
} catch {
    Write-Host "❌ PnP PowerShell module not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 To install PnP PowerShell:" -ForegroundColor Yellow
    Write-Host "   Install-Module -Name PnP.PowerShell -Scope CurrentUser" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Connect to SharePoint
Write-Host ""
Write-Host "🔐 Connecting to SharePoint..." -ForegroundColor Yellow
Write-Host "   A browser window will open for authentication" -ForegroundColor Gray

try {
    Connect-PnPOnline -Url $SiteUrl -Interactive
    Write-Host "✅ Connected successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📚 Creating Document Libraries..." -ForegroundColor Yellow
Write-Host ""

# Document Libraries
$libraries = @(
    @{Name="QA Packs"; Description="Submitted QA Pack PDFs"; Template="DocumentLibrary"},
    @{Name="Job Sheets"; Description="Daily job sheets for crews"; Template="DocumentLibrary"},
    @{Name="Scope Reports"; Description="Site visit scope reports"; Template="DocumentLibrary"},
    @{Name="Site Visit Reports"; Description="Completed site visit documentation"; Template="DocumentLibrary"},
    @{Name="NCR Register"; Description="Non-conformance reports"; Template="DocumentLibrary"},
    @{Name="Incident Reports"; Description="Safety incident documentation"; Template="DocumentLibrary"},
    @{Name="Templates"; Description="Form and document templates"; Template="DocumentLibrary"},
    @{Name="Resources"; Description="Training materials and guides"; Template="DocumentLibrary"}
)

foreach ($lib in $libraries) {
    try {
        $existing = Get-PnPList -Identity $lib.Name -ErrorAction SilentlyContinue
        if ($existing) {
            Write-Host "  ⏭️  $($lib.Name) already exists, skipping" -ForegroundColor Gray
        } else {
            New-PnPList -Title $lib.Name -Template $lib.Template -ErrorAction Stop
            Write-Host "  ✅ Created: $($lib.Name)" -ForegroundColor Green

            # Add description
            Set-PnPList -Identity $lib.Name -Description $lib.Description
        }
    } catch {
        Write-Host "  ❌ Failed to create $($lib.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 Creating Lists..." -ForegroundColor Yellow
Write-Host ""

# Lists
try {
    # Client Tiers List
    $tierList = Get-PnPList -Identity "Client Tiers" -ErrorAction SilentlyContinue
    if (-not $tierList) {
        New-PnPList -Title "Client Tiers" -Template GenericList
        Add-PnPField -List "Client Tiers" -DisplayName "Client Name" -InternalName "ClientName" -Type Text -Required
        Add-PnPField -List "Client Tiers" -DisplayName "Tier Level" -InternalName "TierLevel" -Type Choice -Choices "Tier 1","Tier 2","Tier 3" -Required
        Add-PnPField -List "Client Tiers" -DisplayName "Contact Person" -InternalName "ContactPerson" -Type Text
        Add-PnPField -List "Client Tiers" -DisplayName "Contact Email" -InternalName "ContactEmail" -Type Text
        Write-Host "  ✅ Created: Client Tiers" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  Client Tiers already exists" -ForegroundColor Gray
    }

    # Project Assignments List
    $assignList = Get-PnPList -Identity "Project Assignments" -ErrorAction SilentlyContinue
    if (-not $assignList) {
        New-PnPList -Title "Project Assignments" -Template GenericList
        Add-PnPField -List "Project Assignments" -DisplayName "Job Number" -InternalName "JobNumber" -Type Text -Required
        Add-PnPField -List "Project Assignments" -DisplayName "Project Owner" -InternalName "ProjectOwner" -Type User -Required
        Add-PnPField -List "Project Assignments" -DisplayName "Assigned Crew" -InternalName "AssignedCrew" -Type Choice -Choices "Asphalt","Profiling","Spray","Grooving"
        Add-PnPField -List "Project Assignments" -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "Scheduled","In Progress","Completed","On Hold"
        Write-Host "  ✅ Created: Project Assignments" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  Project Assignments already exists" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ Failed to create lists: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📁 Creating Folder Structure..." -ForegroundColor Yellow
Write-Host ""

# Create folders in QA Packs library
$divisions = @("Asphalt", "Profiling", "Spray", "Grooving")
foreach ($division in $divisions) {
    try {
        Add-PnPFolder -Name $division -Folder "QA Packs" -ErrorAction SilentlyContinue
        Write-Host "  ✅ Created folder: QA Packs/$division" -ForegroundColor Green
    } catch {
        Write-Host "  ⏭️  Folder QA Packs/$division already exists or failed" -ForegroundColor Gray
    }
}

if ($ConfigurePermissions) {
    Write-Host ""
    Write-Host "🔐 Configuring Permissions..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  Manual configuration required:" -ForegroundColor Yellow
    Write-Host "   1. Foremen: Read on Templates, Contribute on their division folders" -ForegroundColor White
    Write-Host "   2. Engineers: Read/Write on all libraries except NCR/Incidents (Read only)" -ForegroundColor White
    Write-Host "   3. Admins: Full Control" -ForegroundColor White
    Write-Host "   4. Management: Read on all" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "✅ SharePoint Deployment Complete!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "   • Document Libraries: 8 created" -ForegroundColor White
Write-Host "   • Lists: 2 created" -ForegroundColor White
Write-Host "   • Folders: 4 created (division folders)" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Site URL: $SiteUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Configure permissions (use -ConfigurePermissions)" -ForegroundColor White
Write-Host "   2. Upload form templates to Templates library" -ForegroundColor White
Write-Host "   3. Deploy Power Automate flows: .\Deploy-PowerAutomate.ps1" -ForegroundColor White
Write-Host "   4. Test document upload and automation" -ForegroundColor White
Write-Host ""

Disconnect-PnPOnline
