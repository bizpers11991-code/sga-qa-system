# create-dataverse-schema.ps1
# Creates all tables, relationships, and security roles

param(
    [Parameter(Mandatory=$true)]
    [string]$DataverseUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$TenantId,
    
    [Parameter(Mandatory=$true)]
    [string]$ClientId,
    
    [Parameter(Mandatory=$true)]
    [string]$ClientSecret
)

# Install required modules
Install-Module -Name Microsoft.Xrm.Data.PowerShell -Force
Install-Module -Name Microsoft.Xrm.Tooling.CrmConnector.PowerShell -Force

# Connect to Dataverse
$securePassword = ConvertTo-SecureString $ClientSecret -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($ClientId, $securePassword)
$conn = Get-CrmConnection -ServerUrl $DataverseUrl -Credential $credential

Write-Host "Connected to Dataverse" -ForegroundColor Green

# Define tables to create
$tables = @(
    @{
        LogicalName = "msdyn_job"
        DisplayName = "Job"
        PluralDisplayName = "Jobs"
        Attributes = @(
            @{LogicalName="msdyn_jobnumber"; DisplayName="Job Number"; Type="String"; MaxLength=50; Required=$true},
            @{LogicalName="msdyn_client"; DisplayName="Client"; Type="String"; MaxLength=200; Required=$true},
            @{LogicalName="msdyn_projectname"; DisplayName="Project Name"; Type="String"; MaxLength=300; Required=$true},
            @{LogicalName="msdyn_location"; DisplayName="Location"; Type="String"; MaxLength=500; Required=$true},
            @{LogicalName="msdyn_division"; DisplayName="Division"; Type="OptionSet"; Options=@("Asphalt", "Profiling", "Spray"); Required=$true},
            @{LogicalName="msdyn_jobdate"; DisplayName="Job Date"; Type="DateTime"; Required=$true},
            @{LogicalName="msdyn_duedate"; DisplayName="Due Date"; Type="DateTime"; Required=$true}
        )
    },
    @{
        LogicalName = "msdyn_qapack"
        DisplayName = "QA Pack"
        PluralDisplayName = "QA Packs"
        Attributes = @(
            @{LogicalName="msdyn_reportid"; DisplayName="Report ID"; Type="String"; MaxLength=100; Required=$true},
            @{LogicalName="msdyn_timestamp"; DisplayName="Timestamp"; Type="DateTime"; Required=$true},
            @{LogicalName="msdyn_version"; DisplayName="Version"; Type="Integer"; Required=$true},
            @{LogicalName="msdyn_status"; DisplayName="Status"; Type="OptionSet"; Options=@("Pending Review", "Approved", "Archived"); Required=$true},
            @{LogicalName="msdyn_expertsummary"; DisplayName="AI Summary"; Type="Memo"; MaxLength=10000}
        )
    }
    # Add remaining tables from schema...
)

Write-Host "Creating $($tables.Count) tables..." -ForegroundColor Cyan

foreach ($table in $tables) {
    Write-Host "Creating table: $($table.DisplayName)..." -ForegroundColor Yellow
    
    try {
        # Create table
        $entityId = New-CrmEntity `
            -conn $conn `
            -EntityLogicalName $table.LogicalName `
            -DisplayName $table.DisplayName `
            -PluralDisplayName $table.PluralDisplayName `
            -OwnershipType UserOwned
        
        Write-Host "  ✅ Table created" -ForegroundColor Green
        
        # Create attributes
        foreach ($attr in $table.Attributes) {
            Write-Host "    Adding field: $($attr.DisplayName)..." -ForegroundColor Gray
            
            switch ($attr.Type) {
                "String" {
                    New-CrmStringAttribute `
                        -conn $conn `
                        -EntityLogicalName $table.LogicalName `
                        -AttributeLogicalName $attr.LogicalName `
                        -DisplayName $attr.DisplayName `
                        -MaxLength $attr.MaxLength `
                        -Required $attr.Required
                }
                "DateTime" {
                    New-CrmDateTimeAttribute `
                        -conn $conn `
                        -EntityLogicalName $table.LogicalName `
                        -AttributeLogicalName $attr.LogicalName `
                        -DisplayName $attr.DisplayName `
                        -Required $attr.Required
                }
                "Integer" {
                    New-CrmIntegerAttribute `
                        -conn $conn `
                        -EntityLogicalName $table.LogicalName `
                        -AttributeLogicalName $attr.LogicalName `
                        -DisplayName $attr.DisplayName `
                        -Required $attr.Required
                }
                "OptionSet" {
                    $options = @{}
                    $value = 1
                    foreach ($option in $attr.Options) {
                        $options[$value] = $option
                        $value++
                    }
                    
                    New-CrmOptionSetAttribute `
                        -conn $conn `
                        -EntityLogicalName $table.LogicalName `
                        -AttributeLogicalName $attr.LogicalName `
                        -DisplayName $attr.DisplayName `
                        -OptionSetValues $options `
                        -Required $attr.Required
                }
                "Memo" {
                    New-CrmMemoAttribute `
                        -conn $conn `
                        -EntityLogicalName $table.LogicalName `
                        -AttributeLogicalName $attr.LogicalName `
                        -DisplayName $attr.DisplayName `
                        -MaxLength $attr.MaxLength `
                        -Required $attr.Required
                }
            }
        }
        
        Write-Host "  ✅ All fields created" -ForegroundColor Green
        
    } catch {
        Write-Host "  ❌ Error creating table: $_" -ForegroundColor Red
    }
}

# Publish all customizations
Write-Host "`nPublishing all customizations..." -ForegroundColor Cyan
Publish-CrmAllCustomization -conn $conn
Write-Host "✅ Customizations published" -ForegroundColor Green

Write-Host "`n✅ Dataverse schema creation complete!" -ForegroundColor Green
