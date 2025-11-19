# setup-dataverse-environment.ps1
# Creates Dataverse environment and installs required solutions

# Connect to Power Platform
Install-Module -Name Microsoft.PowerApps.Administration.PowerShell -Force
Add-PowerAppsAccount

# Configuration
$EnvironmentDisplayName = "SGA QA Pack - Production"
$EnvironmentLocation = "australia"
$EnvironmentType = "Production"
$SecurityGroupId = "YOUR_SECURITY_GROUP_ID"  # Azure AD group for access - REPLACE THIS WITH THE ACTUAL ID

Write-Host "Creating Dataverse environment..." -ForegroundColor Cyan

# Create environment
$env = New-AdminPowerAppEnvironment `
    -DisplayName $EnvironmentDisplayName `
    -Location $EnvironmentLocation `
    -EnvironmentSku $EnvironmentType `
    -ProvisionDatabase

Write-Host "Environment created: $($env.DisplayName)" -ForegroundColor Green
Write-Host "Environment ID: $($env.EnvironmentName)" -ForegroundColor Yellow

# Wait for environment provisioning
Write-Host "Waiting for environment to be ready (this can take 5-10 minutes)..."
Start-Sleep -Seconds 300

# Get environment details
$envDetails = Get-AdminPowerAppEnvironment -EnvironmentName $env.EnvironmentName
Write-Host "Dataverse URL: $($envDetails.Internal.properties.linkedEnvironmentMetadata.instanceUrl)" -ForegroundColor Green

# Restrict access to security group
Set-AdminPowerAppEnvironmentRoleAssignment `
    -EnvironmentName $env.EnvironmentName `
    -RoleName EnvironmentAdmin `
    -PrincipalType Group `
    -PrincipalObjectId $SecurityGroupId

Write-Host "`n✅ Dataverse environment setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Save the environment URL: $($envDetails.Internal.properties.linkedEnvironmentMetadata.instanceUrl)"
Write-Host "2. Run the create-dataverse-schema.ps1 script"
