# Create-Dataverse-Tables-WebAPI.ps1
# Created by: Claude + Gemini AI Team
# Uses Dataverse Web API to create all 12 tables programmatically

# Load credentials from .env.azure
$envFile = "C:\Dhruv\sga-qa-pack\.env.azure"

function Get-EnvVariable {
    param([string]$Key, [string]$EnvFile)
    try {
        $value = (Get-Content $EnvFile | Where-Object { $_ -match "^$Key=" }) -replace "$Key=", ""
        return $value.Trim()
    } catch {
        Write-Error "Error reading $Key from .env.azure"
        return $null
    }
}

$tenantId = Get-EnvVariable -Key "TENANT_ID" -EnvFile $envFile
$clientId = Get-EnvVariable -Key "CLIENT_ID" -EnvFile $envFile
$clientSecret = Get-EnvVariable -Key "CLIENT_SECRET" -EnvFile $envFile
$dataverseUrl = "https://org24044a7d.crm6.dynamics.com"  # Updated URL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dataverse Table Creation via Web API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tenant: $tenantId" -ForegroundColor Gray
Write-Host "Client: $clientId" -ForegroundColor Gray
Write-Host "Dataverse: $dataverseUrl" -ForegroundColor Gray
Write-Host ""

# Get Access Token
Write-Host "Acquiring access token..." -ForegroundColor Yellow

$body = @{
    client_id     = $clientId
    client_secret = $clientSecret
    scope         = "$dataverseUrl/.default"
    grant_type    = "client_credentials"
}

try {
    $tokenResponse = Invoke-RestMethod -Method Post -Uri "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token" -Body $body
    $accessToken = $tokenResponse.access_token
    Write-Host "✅ Access token acquired" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get access token: $_" -ForegroundColor Red
    exit 1
}

# Headers for API calls
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
    "OData-MaxVersion" = "4.0"
    "OData-Version" = "4.0"
    "Accept" = "application/json"
}

# Function to create a table
function Create-DataverseTable {
    param(
        [string]$SchemaName,
        [string]$DisplayName,
        [string]$PluralName,
        [string]$Description
    )

    Write-Host "`nCreating table: $DisplayName ($SchemaName)..." -ForegroundColor Cyan

    $tableDefinition = @{
        "@odata.type" = "Microsoft.Dynamics.CRM.EntityMetadata"
        SchemaName = $SchemaName
        DisplayName = @{ LocalizedLabels = @(@{ Label = $DisplayName; LanguageCode = 1033 }) }
        DisplayCollectionName = @{ LocalizedLabels = @(@{ Label = $PluralName; LanguageCode = 1033 }) }
        Description = @{ LocalizedLabels = @(@{ Label = $Description; LanguageCode = 1033 }) }
        OwnershipType = "UserOwned"
        IsActivity = $false
        HasNotes = $true
        HasActivities = $true
        Attributes = @(
            @{
                "@odata.type" = "Microsoft.Dynamics.CRM.StringAttributeMetadata"
                SchemaName = "$($SchemaName)_name"
                RequiredLevel = @{ Value = "None" }
                MaxLength = 100
                FormatName = @{ Value = "Text" }
                DisplayName = @{ LocalizedLabels = @(@{ Label = "Name"; LanguageCode = 1033 }) }
                Description = @{ LocalizedLabels = @(@{ Label = "Primary name field"; LanguageCode = 1033 }) }
                IsPrimaryName = $true
            }
        )
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "$dataverseUrl/api/data/v9.2/EntityDefinitions" -Method Post -Headers $headers -Body $tableDefinition
        Write-Host "  ✅ Table created successfully" -ForegroundColor Green
        return $response.MetadataId
    } catch {
        Write-Host "  ❌ Error: $_" -ForegroundColor Red
        return $null
    }
}

# Create all 12 tables
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Creating 12 Dataverse Tables" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Create-DataverseTable -SchemaName "sga_foreman" -DisplayName "Foreman" -PluralName "Foremen" -Description "Construction foremen"
Create-DataverseTable -SchemaName "sga_job" -DisplayName "Job" -PluralName "Jobs" -Description "Construction jobs"
Create-DataverseTable -SchemaName "sga_qapack" -DisplayName "QA Pack" -PluralName "QA Packs" -Description "Quality assurance packs"
Create-DataverseTable -SchemaName "sga_dailyreport" -DisplayName "Daily Report" -PluralName "Daily Reports" -Description "Daily foreman reports"
Create-DataverseTable -SchemaName "sga_incident" -DisplayName "Incident" -PluralName "Incidents" -Description "Incident reports"
Create-DataverseTable -SchemaName "sga_ncr" -DisplayName "NCR" -PluralName "NCRs" -Description "Non-conformance reports"
Create-DataverseTable -SchemaName "sga_samplingplan" -DisplayName "Sampling Plan" -PluralName "Sampling Plans" -Description "Sampling plans"
Create-DataverseTable -SchemaName "sga_resource" -DisplayName "Resource" -PluralName "Resources" -Description "Resources"
Create-DataverseTable -SchemaName "sga_itptemplate" -DisplayName "ITP Template" -PluralName "ITP Templates" -Description "ITP templates"
Create-DataverseTable -SchemaName "sga_sitephoto" -DisplayName "Site Photo" -PluralName "Site Photos" -Description "Site photos"
Create-DataverseTable -SchemaName "sga_asphaltplacement" -DisplayName "Asphalt Placement" -PluralName "Asphalt Placements" -Description "Asphalt placements"
Create-DataverseTable -SchemaName "sga_straightedgereport" -DisplayName "Straight Edge Report" -PluralName "Straight Edge Reports" -Description "Straight edge reports"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Table Creation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Add columns to each table via Power Apps Maker Portal" -ForegroundColor Yellow
Write-Host "URL: https://make.powerapps.com" -ForegroundColor White
