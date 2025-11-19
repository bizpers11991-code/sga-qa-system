# Create-SharePointLibraries.ps1
# SGA QA Pack - SharePoint Document Libraries Setup
# Creates 5 document libraries for storing QA Pack files
#
# Usage:
# .\Create-SharePointLibraries.ps1

# SharePoint site URL
$SiteUrl = "https://sgagroupcomau.sharepoint.com/sites/SGAQualityAssurance"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SGA QA Pack - SharePoint Libraries Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PnP PowerShell is installed
Write-Host "Checking for PnP PowerShell module..." -ForegroundColor Yellow
if (!(Get-Module -ListAvailable -Name PnP.PowerShell)) {
    Write-Host "Installing PnP PowerShell module..." -ForegroundColor Yellow
    Install-Module -Name PnP.PowerShell -Scope CurrentUser -Force -AllowPrerelease
    Write-Host "✅ PnP PowerShell installed" -ForegroundColor Green
} else {
    Write-Host "✅ PnP PowerShell already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Connecting to SharePoint site..." -ForegroundColor Yellow
Write-Host "Site: $SiteUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "📌 A browser window will open for authentication" -ForegroundColor Cyan
Write-Host "   Please sign in with your Microsoft 365 account" -ForegroundColor Cyan
Write-Host ""

try {
    # Connect to SharePoint site
    Connect-PnPOnline -Url $SiteUrl -Interactive
    Write-Host "✅ Connected to SharePoint" -ForegroundColor Green
    Write-Host ""

    # Define libraries to create
    $libraries = @(
        @{Title="QA Packs"; Description="Quality Assurance Pack submissions and PDFs"},
        @{Title="Job Sheets"; Description="Daily job sheets and work records"},
        @{Title="Site Photos"; Description="Job site photographs and documentation"},
        @{Title="Incident Reports"; Description="Safety and quality incident reports"},
        @{Title="NCR Documents"; Description="Non-Conformance Report documentation"}
    )

    Write-Host "Creating $($libraries.Count) document libraries..." -ForegroundColor Cyan
    Write-Host ""

    foreach ($library in $libraries) {
        Write-Host "Creating library: $($library.Title)..." -ForegroundColor Yellow

        try {
            # Check if library already exists
            $existingList = Get-PnPList -Identity $library.Title -ErrorAction SilentlyContinue

            if ($existingList) {
                Write-Host "  ⚠️  Library already exists: $($library.Title)" -ForegroundColor Yellow
            } else {
                # Create the library
                New-PnPList -Title $library.Title -Template DocumentLibrary -EnableVersioning

                # Add description
                Set-PnPList -Identity $library.Title -Description $library.Description

                Write-Host "  ✅ Created: $($library.Title)" -ForegroundColor Green
            }
        } catch {
            Write-Host "  ❌ Error creating $($library.Title): $_" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Verification" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # List all document libraries
    $allLibraries = Get-PnPList | Where-Object {$_.BaseTemplate -eq 101} | Select-Object Title, ItemCount, Created

    Write-Host "Document libraries in site:" -ForegroundColor Yellow
    $allLibraries | Format-Table -AutoSize

    Write-Host ""
    Write-Host "✅ SharePoint libraries setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📌 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Verify libraries at: $SiteUrl" -ForegroundColor White
    Write-Host "   2. Update DEPLOYMENT_STATUS.md - mark Phase 3 complete" -ForegroundColor White
    Write-Host "   3. Continue to Phase 4: Deploy Power Apps" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure you're signed in with the correct account" -ForegroundColor White
    Write-Host "2. Verify you have Site Owner or Site Collection Admin rights" -ForegroundColor White
    Write-Host "3. Check the site URL is correct: $SiteUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "Manual alternative:" -ForegroundColor Yellow
    Write-Host "1. Go to: $SiteUrl" -ForegroundColor White
    Write-Host "2. Click 'New' → 'Document library'" -ForegroundColor White
    Write-Host "3. Create these 5 libraries:" -ForegroundColor White
    foreach ($library in $libraries) {
        Write-Host "   - $($library.Title)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Script complete." -ForegroundColor Cyan
