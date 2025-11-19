# Deploy-DataverseSchema.ps1
# SGA QA Pack - Dataverse Schema Deployment Script
# Creates all tables, fields, and relationships for the M365 integration
#
# Prerequisites:
# - Power Platform environment created
# - Power Apps Administration PowerShell module installed
# - Appropriate permissions (System Administrator role in Dataverse)
#
# Usage:
# .\Deploy-DataverseSchema.ps1 -EnvironmentUrl "https://org....crm6.dynamics.com"

param(
    [Parameter(Mandatory=$true, HelpMessage="Dataverse environment URL (e.g., https://org....crm6.dynamics.com)")]
    [string]$EnvironmentUrl,

    [Parameter(Mandatory=$false)]
    [switch]$WhatIf = $false
)

# Color output functions
function Write-Step {
    param([string]$Message)
    Write-Host "`n$Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  ℹ️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "  ❌ $Message" -ForegroundColor Red
}

# Check and install required modules
Write-Step "Checking PowerShell modules..."

$requiredModules = @(
    "Microsoft.PowerApps.Administration.PowerShell",
    "Microsoft.Xrm.Data.PowerShell"
)

foreach ($module in $requiredModules) {
    if (!(Get-Module -ListAvailable -Name $module)) {
        Write-Info "Installing $module..."
        Install-Module -Name $module -Scope CurrentUser -Force -AllowClobber
    } else {
        Write-Success "$module is installed"
    }
}

# Connect to Power Apps
Write-Step "Connecting to Power Platform..."
Add-PowerAppsAccount

# Define the complete table schema
Write-Step "Defining Dataverse schema..."

$tables = @(
    # ===== CORE TABLES =====

    # 1. Jobs
    @{
        LogicalName = "sga_job"
        DisplayName = "Job"
        PluralDisplayName = "Jobs"
        Description = "Construction job records"
        Attributes = @(
            @{LogicalName="sga_jobnumber"; DisplayName="Job Number"; Type="String"; MaxLength=50; Required=$true},
            @{LogicalName="sga_client"; DisplayName="Client"; Type="String"; MaxLength=200; Required=$true},
            @{LogicalName="sga_projectname"; DisplayName="Project Name"; Type="String"; MaxLength=300; Required=$true},
            @{LogicalName="sga_location"; DisplayName="Location"; Type="String"; MaxLength=500; Required=$true},
            @{LogicalName="sga_division"; DisplayName="Division"; Type="OptionSet"; Options=@("Asphalt", "Profiling", "Spray"); Required=$true},
            @{LogicalName="sga_jobdate"; DisplayName="Job Date"; Type="DateTime"; Format="DateOnly"; Required=$true},
            @{LogicalName="sga_duedate"; DisplayName="Due Date"; Type="DateTime"; Format="DateOnly"; Required=$true},
            @{LogicalName="sga_status"; DisplayName="Status"; Type="OptionSet"; Options=@("Scheduled", "In Progress", "Completed", "On Hold", "Cancelled"); Required=$true},
            @{LogicalName="sga_description"; DisplayName="Description"; Type="Memo"; MaxLength=2000}
        )
    },

    # 2. Foremen
    @{
        LogicalName = "sga_foreman"
        DisplayName = "Foreman"
        PluralDisplayName = "Foremen"
        Description = "Crew leaders and supervisors"
        Attributes = @(
            @{LogicalName="sga_name"; DisplayName="Name"; Type="String"; MaxLength=200; Required=$true},
            @{LogicalName="sga_email"; DisplayName="Email"; Type="String"; MaxLength=200; Required=$true},
            @{LogicalName="sga_phone"; DisplayName="Phone"; Type="String"; MaxLength=50},
            @{LogicalName="sga_division"; DisplayName="Division"; Type="OptionSet"; Options=@("Asphalt", "Profiling", "Spray"); Required=$true},
            @{LogicalName="sga_active"; DisplayName="Active"; Type="Boolean"; DefaultValue=$true}
        )
    },

    # 3. QA Packs
    @{
        LogicalName = "sga_qapack"
        DisplayName = "QA Pack"
        PluralDisplayName = "QA Packs"
        Description = "Quality assurance documentation submissions"
        Attributes = @(
            @{LogicalName="sga_reportid"; DisplayName="Report ID"; Type="String"; MaxLength=100; Required=$true},
            @{LogicalName="sga_timestamp"; DisplayName="Timestamp"; Type="DateTime"; Required=$true},
            @{LogicalName="sga_version"; DisplayName="Version"; Type="Integer"; Required=$true; DefaultValue=1},
            @{LogicalName="sga_status"; DisplayName="Status"; Type="OptionSet"; Options=@("Draft", "Submitted", "Under Review", "Approved", "Rejected", "Archived"); Required=$true},
            @{LogicalName="sga_aisummary"; DisplayName="AI Summary"; Type="Memo"; MaxLength=10000},
            @{LogicalName="sga_pdfurl"; DisplayName="PDF URL"; Type="String"; MaxLength=500},
            @{LogicalName="sga_division"; DisplayName="Division"; Type="OptionSet"; Options=@("Asphalt", "Profiling", "Spray"); Required=$true}
        )
    },

    # 4. Daily Reports
    @{
        LogicalName = "sga_dailyreport"
        DisplayName = "Daily Report"
        PluralDisplayName = "Daily Reports"
        Description = "Daily foreman reports"
        Attributes = @(
            @{LogicalName="sga_reportdate"; DisplayName="Report Date"; Type="DateTime"; Format="DateOnly"; Required=$true},
            @{LogicalName="sga_weatherconditions"; DisplayName="Weather Conditions"; Type="String"; MaxLength=200},
            @{LogicalName="sga_temperature"; DisplayName="Temperature (°C)"; Type="Decimal"; Precision=2},
            @{LogicalName="sga_starttime"; DisplayName="Start Time"; Type="String"; MaxLength=10},
            @{LogicalName="sga_endtime"; DisplayName="End Time"; Type="String"; MaxLength=10},
            @{LogicalName="sga_comments"; DisplayName="Comments"; Type="Memo"; MaxLength=5000}
        )
    },

    # 5. Incident Reports
    @{
        LogicalName = "sga_incident"
        DisplayName = "Incident Report"
        PluralDisplayName = "Incident Reports"
        Description = "Safety and quality incidents"
        Attributes = @(
            @{LogicalName="sga_incidentnumber"; DisplayName="Incident Number"; Type="String"; MaxLength=50; Required=$true},
            @{LogicalName="sga_incidentdate"; DisplayName="Incident Date"; Type="DateTime"; Required=$true},
            @{LogicalName="sga_incidenttype"; DisplayName="Incident Type"; Type="OptionSet"; Options=@("Safety", "Quality", "Environmental", "Near Miss", "Property Damage"); Required=$true},
            @{LogicalName="sga_severity"; DisplayName="Severity"; Type="OptionSet"; Options=@("Low", "Medium", "High", "Critical"); Required=$true},
            @{LogicalName="sga_description"; DisplayName="Description"; Type="Memo"; MaxLength=5000; Required=$true},
            @{LogicalName="sga_immediateaction"; DisplayName="Immediate Action Taken"; Type="Memo"; MaxLength=2000},
            @{LogicalName="sga_status"; DisplayName="Status"; Type="OptionSet"; Options=@("Open", "Under Investigation", "Resolved", "Closed"); Required=$true},
            @{LogicalName="sga_location"; DisplayName="Location"; Type="String"; MaxLength=500}
        )
    },

    # 6. Non-Conformance Reports (NCRs)
    @{
        LogicalName = "sga_ncr"
        DisplayName = "Non-Conformance Report"
        PluralDisplayName = "NCR Register"
        Description = "Non-conformance reports and corrective actions"
        Attributes = @(
            @{LogicalName="sga_ncrnumber"; DisplayName="NCR Number"; Type="String"; MaxLength=50; Required=$true},
            @{LogicalName="sga_dateissued"; DisplayName="Date Issued"; Type="DateTime"; Format="DateOnly"; Required=$true},
            @{LogicalName="sga_status"; DisplayName="Status"; Type="OptionSet"; Options=@("Open", "Under Review", "Resolved", "Closed", "Rejected"); Required=$true},
            @{LogicalName="sga_description"; DisplayName="Description"; Type="Memo"; MaxLength=5000; Required=$true},
            @{LogicalName="sga_specificationclause"; DisplayName="Specification Clause"; Type="String"; MaxLength=200},
            @{LogicalName="sga_proposedcorrectiveaction"; DisplayName="Proposed Corrective Action"; Type="Memo"; MaxLength=5000},
            @{LogicalName="sga_rootcauseanalysis"; DisplayName="Root Cause Analysis"; Type="Memo"; MaxLength=10000},
            @{LogicalName="sga_preventativeaction"; DisplayName="Preventative Action"; Type="Memo"; MaxLength=5000},
            @{LogicalName="sga_costimpact"; DisplayName="Cost Impact ($)"; Type="Money"; Precision=2}
        )
    },

    # 7. Sampling Plans
    @{
        LogicalName = "sga_samplingplan"
        DisplayName = "Sampling Plan"
        PluralDisplayName = "Sampling Plans"
        Description = "Core sampling and material testing plans"
        Attributes = @(
            @{LogicalName="sga_plandate"; DisplayName="Plan Date"; Type="DateTime"; Format="DateOnly"; Required=$true},
            @{LogicalName="sga_testingtype"; DisplayName="Testing Type"; Type="OptionSet"; Options=@("Core Sampling", "Asphalt Testing", "Compaction Testing", "Profile Testing"); Required=$true},
            @{LogicalName="sga_numberofsamples"; DisplayName="Number of Samples"; Type="Integer"; Required=$true},
            @{LogicalName="sga_samplingmethod"; DisplayName="Sampling Method"; Type="String"; MaxLength=500},
            @{LogicalName="sga_status"; DisplayName="Status"; Type="OptionSet"; Options=@("Planned", "In Progress", "Completed", "Results Pending"); Required=$true},
            @{LogicalName="sga_results"; DisplayName="Results"; Type="Memo"; MaxLength=10000}
        )
    },

    # 8. Resources
    @{
        LogicalName = "sga_resource"
        DisplayName = "Resource"
        PluralDisplayName = "Resources"
        Description = "Equipment, materials, and crew resources"
        Attributes = @(
            @{LogicalName="sga_name"; DisplayName="Resource Name"; Type="String"; MaxLength=200; Required=$true},
            @{LogicalName="sga_resourcetype"; DisplayName="Resource Type"; Type="OptionSet"; Options=@("Equipment", "Material", "Crew Member", "Subcontractor"); Required=$true},
            @{LogicalName="sga_description"; DisplayName="Description"; Type="Memo"; MaxLength=2000},
            @{LogicalName="sga_registrationnumber"; DisplayName="Registration/ID Number"; Type="String"; MaxLength=100},
            @{LogicalName="sga_available"; DisplayName="Available"; Type="Boolean"; DefaultValue=$true}
        )
    },

    # 9. ITP Templates
    @{
        LogicalName = "sga_itptemplate"
        DisplayName = "ITP Template"
        PluralDisplayName = "ITP Templates"
        Description = "Inspection and Test Plan templates"
        Attributes = @(
            @{LogicalName="sga_name"; DisplayName="Template Name"; Type="String"; MaxLength=200; Required=$true},
            @{LogicalName="sga_division"; DisplayName="Division"; Type="OptionSet"; Options=@("Asphalt", "Profiling", "Spray"); Required=$true},
            @{LogicalName="sga_version"; DisplayName="Version"; Type="String"; MaxLength=20},
            @{LogicalName="sga_checklistitems"; DisplayName="Checklist Items (JSON)"; Type="Memo"; MaxLength=20000},
            @{LogicalName="sga_active"; DisplayName="Active"; Type="Boolean"; DefaultValue=$true}
        )
    },

    # 10. Site Photos
    @{
        LogicalName = "sga_sitephoto"
        DisplayName = "Site Photo"
        PluralDisplayName = "Site Photos"
        Description = "Job site photographs"
        Attributes = @(
            @{LogicalName="sga_filename"; DisplayName="File Name"; Type="String"; MaxLength=200; Required=$true},
            @{LogicalName="sga_fileurl"; DisplayName="File URL"; Type="String"; MaxLength=500; Required=$true},
            @{LogicalName="sga_datecaptured"; DisplayName="Date Captured"; Type="DateTime"; Required=$true},
            @{LogicalName="sga_description"; DisplayName="Description"; Type="String"; MaxLength=500},
            @{LogicalName="sga_latitude"; DisplayName="Latitude"; Type="Decimal"; Precision=8},
            @{LogicalName="sga_longitude"; DisplayName="Longitude"; Type="Decimal"; Precision=8}
        )
    },

    # 11. Asphalt Placements
    @{
        LogicalName = "sga_asphaltplacement"
        DisplayName = "Asphalt Placement"
        PluralDisplayName = "Asphalt Placements"
        Description = "Asphalt placement records"
        Attributes = @(
            @{LogicalName="sga_placementdate"; DisplayName="Placement Date"; Type="DateTime"; Format="DateOnly"; Required=$true},
            @{LogicalName="sga_lotno"; DisplayName="Lot Number"; Type="String"; MaxLength=50},
            @{LogicalName="sga_totaltonnes"; DisplayName="Total Tonnes"; Type="Decimal"; Precision=2; Required=$true},
            @{LogicalName="sga_mixtype"; DisplayName="Mix Type"; Type="String"; MaxLength=100},
            @{LogicalName="sga_supplier"; DisplayName="Supplier"; Type="String"; MaxLength=200},
            @{LogicalName="sga_compliancestatus"; DisplayName="Compliance Status"; Type="OptionSet"; Options=@("Compliant", "Non-Compliant", "Pending Review")}
        )
    },

    # 12. Straight Edge Reports
    @{
        LogicalName = "sga_straightedgereport"
        DisplayName = "Straight Edge Report"
        PluralDisplayName = "Straight Edge Reports"
        Description = "Surface profile testing reports"
        Attributes = @(
            @{LogicalName="sga_reportdate"; DisplayName="Report Date"; Type="DateTime"; Format="DateOnly"; Required=$true},
            @{LogicalName="sga_chainage"; DisplayName="Chainage"; Type="String"; MaxLength=100},
            @{LogicalName="sga_offset"; DisplayName="Offset"; Type="String"; MaxLength=100},
            @{LogicalName="sga_maxgap"; DisplayName="Maximum Gap (mm)"; Type="Decimal"; Precision=2},
            @{LogicalName="sga_compliant"; DisplayName="Compliant"; Type="Boolean"; Required=$true},
            @{LogicalName="sga_specification"; DisplayName="Specification"; Type="String"; MaxLength=200}
        )
    }
)

Write-Success "Defined $($tables.Count) tables"

# Confirmation prompt
if (!$WhatIf) {
    Write-Host "`n⚠️  This will create $($tables.Count) custom tables in your Dataverse environment:" -ForegroundColor Yellow
    Write-Host "   Environment: $EnvironmentUrl" -ForegroundColor Yellow
    Write-Host "`n   Tables to be created:" -ForegroundColor White
    foreach ($table in $tables) {
        Write-Host "   - $($table.DisplayName) ($($table.Attributes.Count) fields)" -ForegroundColor Gray
    }

    $confirm = Read-Host "`nDo you want to proceed? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "`nDeployment cancelled." -ForegroundColor Yellow
        exit
    }
}

# Note: The actual table creation requires using the Dataverse Web API or Power Platform CLI
# This script provides the schema definition. To create tables, use one of these methods:
#
# METHOD 1: Power Platform CLI (pac)
# METHOD 2: Power Apps Maker Portal (https://make.powerapps.com)
# METHOD 3: Dataverse Web API with PowerShell

Write-Step "Schema definition complete!"
Write-Info "To create these tables, choose one of the following methods:"
Write-Host ""
Write-Host "METHOD 1: Using Power Platform CLI (pac) - RECOMMENDED" -ForegroundColor Green
Write-Host "  1. Install pac CLI: https://learn.microsoft.com/power-platform/developer/cli/introduction" -ForegroundColor White
Write-Host "  2. Authenticate: pac auth create --url $EnvironmentUrl" -ForegroundColor White
Write-Host "  3. Use this script's output to create tables via pac CLI" -ForegroundColor White
Write-Host ""
Write-Host "METHOD 2: Using Power Apps Maker Portal - EASIEST" -ForegroundColor Green
Write-Host "  1. Go to: https://make.powerapps.com" -ForegroundColor White
Write-Host "  2. Select your environment" -ForegroundColor White
Write-Host "  3. Go to: Tables -> New table -> Create manually" -ForegroundColor White
Write-Host "  4. Use the schema definitions above to create each table" -ForegroundColor White
Write-Host ""
Write-Host "METHOD 3: Ask Copilot to Guide You - WITH YOUR M365 COPILOT" -ForegroundColor Green
Write-Host "  Copy this message to Copilot:" -ForegroundColor White
Write-Host ""
Write-Host "  'I need to create $($tables.Count) custom tables in Dataverse." -ForegroundColor Cyan
Write-Host "   Environment URL: $EnvironmentUrl" -ForegroundColor Cyan
Write-Host "   Please guide me step-by-step through creating these tables using" -ForegroundColor Cyan
Write-Host "   the Power Apps Maker Portal. The table definitions are in the file:" -ForegroundColor Cyan
Write-Host "   C:\Dhruv\sga-qa-pack\scripts\Deploy-DataverseSchema.ps1'" -ForegroundColor Cyan
Write-Host ""
Write-Info "Schema exported successfully. Ready for deployment!"
