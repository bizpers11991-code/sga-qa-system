# SGA QA Pack Deployment Guide

## Prerequisites

### Azure Requirements
- Azure subscription with Owner/Contributor access
- Azure AD Premium P1 or higher
- Power Apps per-user or per-app license
- Power Automate per-user or per-flow license

### Development Environment
- Node.js 18.x or higher
- Azure CLI 2.40+
- PowerShell 7.0+
- Git

### Permissions Required
- Azure subscription administrator
- Power Platform administrator
- SharePoint administrator
- Teams administrator

## Infrastructure Setup

### 1. Azure Resource Group
```bash
az group create --name sga-qapack-prod-rg --location australiaeast
```

### 2. Azure Key Vault
```bash
# Create Key Vault
az keyvault create \
  --name sga-qapack-kv-prod \
  --resource-group sga-qapack-prod-rg \
  --location australiaeast \
  --enable-soft-delete true \
  --enable-purge-protection true \
  --sku standard

# Run setup script
chmod +x m365-deployment/scripts/setup-keyvault.sh
./m365-deployment/scripts/setup-keyvault.sh prod
```

### 3. Azure Functions App
```bash
az functionapp create \
  --name sga-qapack-func-prod \
  --resource-group sga-qapack-prod-rg \
  --consumption-plan-location australiaeast \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --storage-account sgaqapackstprod
```

### 4. Configure Authentication
```bash
az functionapp auth microsoft configure \
  --name sga-qapack-func-prod \
  --resource-group sga-qapack-prod-rg \
  --client-id YOUR_CLIENT_ID \
  --issuer-url https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0 \
  --allowed-audiences https://sga-qapack-func-prod.azurewebsites.net
```

## Dataverse Setup

### 1. Create Environment
1. Go to Power Platform Admin Center
2. Create new environment: "SGA QA Pack Production"
3. Enable Dataverse
4. Set security group for access control

### 2. Import Solution
1. Go to Solutions in Power Apps
2. Import `SGA_QA_Pack_Solution.zip`
3. Publish all customizations

### 3. Configure Security Roles
1. Assign users to appropriate roles:
   - `asphalt_foreman`
   - `profiling_foreman`
   - `spray_foreman`
   - `asphalt_engineer`
   - `profiling_engineer`
   - `spray_admin`
   - `scheduler_admin`
   - `management_admin`
   - `hseq_manager`

## SharePoint Setup

### 1. Create Site
1. Go to SharePoint Admin Center
2. Create team site: "SGA QA Pack Documents"
3. Configure permissions

### 2. Create Libraries
- QA Pack PDFs
- Job Sheets
- Word Templates

### 3. Configure Permissions
- Foremen: Contribute to their division folders
- Engineers: Read access to all QA packs
- Management: Full access

## Teams Setup

### 1. Create Channels
- Asphalt Division
- Profiling Division
- Spray Division
- Executive Summaries
- System Alerts

### 2. Configure Webhooks
1. For each channel, create incoming webhooks
2. Note webhook URLs for environment variables

## Power Apps Deployment

### 1. Import App
1. Go to Power Apps
2. Import `power-app-source.zip`
3. Update data source connections

### 2. Configure Environment Variables
```
VITE_APP_AUTH0_DOMAIN=your-auth0-domain
VITE_APP_AUTH0_CLIENT_ID=your-client-id
VITE_APP_AUTH0_AUDIENCE=your-api-audience
```

### 3. Update API URLs
Update all API calls to point to production Azure Functions URL.

## Power Automate Deployment

### 1. Import Flows
```bash
pac flow import --path m365-deployment/power-automate-flows/QA_Pack_Submission_Handler.json
pac flow import --path m365-deployment/power-automate-flows/Daily_Summary_Generator.json
pac flow import --path m365-deployment/power-automate-flows/Job_Creation_Handler.json
```

### 2. Configure Connections
- Update SharePoint site URLs
- Configure Teams webhook URLs
- Set Azure Function URLs

## Environment Configuration

### Azure Functions Environment Variables
```bash
az functionapp config appsettings set \
  --name sga-qapack-func-prod \
  --resource-group sga-qapack-prod-rg \
  --settings \
    KEY_VAULT_NAME=sga-qapack-kv-prod \
    TEAMS_WEBHOOK_URL_MANAGEMENT=https://outlook.office.com/webhook/... \
    TEAMS_WEBHOOK_URL_SUMMARY=https://outlook.office.com/webhook/... \
    TEAMS_WEBHOOK_URL_QA_PACK=https://outlook.office.com/webhook/... \
    TEAMS_WEBHOOK_URL_BIOSECURITY=https://outlook.office.com/webhook/... \
    TEAMS_WEBHOOK_URL_ERROR=https://outlook.office.com/webhook/... \
    TEAMS_WEBHOOK_URL_INCIDENTS=https://outlook.office.com/webhook/... \
    TEAMS_WEBHOOK_URL_ASPHALT_JOBS=https://outlook.office.com/webhook/... \
    TEAMS_WEBHOOK_URL_PROFILING_JOBS=https://outlook.office.com/webhook/... \
    TEAMS_WEBHOOK_URL_SPRAY_JOBS=https://outlook.office.com/webhook/...
```

## Testing Deployment

### 1. Smoke Tests
```bash
# Test Azure Functions health
curl https://sga-qapack-func-prod.azurewebsites.net/api/health

# Test authentication
curl -H "Authorization: Bearer <token>" \
  https://sga-qapack-func-prod.azurewebsites.net/api/GenerateAISummary
```

### 2. Functional Tests
1. Create a test job in Dataverse
2. Submit a QA pack through Power App
3. Verify PDF generation
4. Check Teams notifications
5. Validate AI summary generation

### 3. Performance Tests
```bash
cd m365-deployment/tests/load
k6 run --env BASE_URL=https://sga-qapack-func-prod.azurewebsites.net performance-test.js
```

## Monitoring Setup

### 1. Application Insights
```bash
az monitor app-insights component create \
  --app sga-qapack-appinsights-prod \
  --location australiaeast \
  --resource-group sga-qapack-prod-rg \
  --application-type web
```

### 2. Configure Alerts
- Function app failures
- High response times (>5s)
- Rate limit violations
- Storage quota warnings

### 3. Log Analytics
Configure diagnostic settings to send logs to Log Analytics workspace.

## Backup and Recovery

### 1. Dataverse Backups
- Automatic daily backups enabled
- Point-in-time restore available
- Export data for long-term retention

### 2. Azure Functions
- Code deployed via CI/CD
- Configuration stored in Key Vault
- Easy rollback via slot swapping

### 3. SharePoint
- Version history enabled
- Automated backup policies
- Retention policies configured

## Go-Live Checklist

- [ ] All environment variables configured
- [ ] Security roles assigned
- [ ] Test data created
- [ ] User training completed
- [ ] Support team briefed
- [ ] Monitoring alerts configured
- [ ] Rollback plan tested
- [ ] Stakeholder sign-off obtained

## Post-Deployment

### 1. Monitor for 48 Hours
- Check Application Insights
- Monitor Teams notifications
- Validate user feedback
- Performance metrics

### 2. User Communication
- Announce go-live
- Provide user guides
- Set up support channels

### 3. Continuous Improvement
- Monitor usage patterns
- Collect user feedback
- Plan feature enhancements