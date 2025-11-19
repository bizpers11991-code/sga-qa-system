# SGA QA Pack Troubleshooting Guide

## Common Issues and Solutions

### Azure Functions Issues

#### Function App Not Starting
**Symptoms:** Function app shows as "Running" but requests fail
**Solutions:**
1. Check Application Insights logs
2. Verify Key Vault access: `az keyvault list --resource-group sga-qapack-prod-rg`
3. Check environment variables: `az functionapp config appsettings list`
4. Restart function app: `az functionapp restart`

#### Authentication Errors (401)
**Symptoms:** Requests return 401 Unauthorized
**Solutions:**
1. Verify Azure AD configuration
2. Check client principal header injection
3. Validate token expiration
4. Confirm user has proper roles

#### Rate Limiting (429)
**Symptoms:** Requests return 429 Too Many Requests
**Solutions:**
1. Check Redis connection: `az redis show --name sga-qapack-redis-prod`
2. Verify rate limit configuration
3. Monitor usage patterns
4. Consider increasing limits for power users

#### AI Generation Timeouts (500)
**Symptoms:** AI summary requests timeout after 30 seconds
**Solutions:**
1. Check Azure OpenAI service status
2. Verify API key validity
3. Monitor token usage limits
4. Reduce prompt complexity

### Power Apps Issues

#### Delegation Errors
**Symptoms:** Gallery shows "Delegation warning" or limited results
**Solutions:**
1. Check query complexity in Power Apps
2. Verify OnVisible collections are loading
3. Use Filter instead of Search where possible
4. Implement pagination for large datasets

#### Offline Sync Issues
**Symptoms:** Data not syncing between devices
**Solutions:**
1. Check network connectivity
2. Verify offline conflict resolution flows
3. Clear local cache: Settings > Clear cache
4. Restart app to force sync

#### Camera/GPS Permissions
**Symptoms:** Hardware features not working
**Solutions:**
1. Check device permissions in browser settings
2. Verify HTTPS is enabled
3. Test on different devices/browsers
4. Check console for permission errors

### Power Automate Issues

#### Flow Failures
**Symptoms:** Flows show "Failed" status
**Solutions:**
1. Check flow run history for error details
2. Verify connection references are valid
3. Check API rate limits
4. Review error handling scopes

#### Teams Notifications Not Sending
**Symptoms:** No messages in Teams channels
**Solutions:**
1. Verify webhook URLs are correct
2. Check Teams channel permissions
3. Validate message format
4. Test webhook manually

#### PDF Generation Failures
**Symptoms:** Word to PDF conversion fails
**Solutions:**
1. Check OneDrive for Business connection
2. Verify template file exists
3. Check file permissions
4. Validate template format

### Dataverse Issues

#### Record Not Found (404)
**Symptoms:** API calls return 404 for existing records
**Solutions:**
1. Verify table permissions
2. Check record ownership
3. Validate GUID format
4. Confirm environment URL

#### Slow Query Performance
**Symptoms:** Queries take >5 seconds
**Solutions:**
1. Check query complexity
2. Add appropriate indexes
3. Use FetchXML instead of OData for complex queries
4. Implement caching where appropriate

### SharePoint Issues

#### File Upload Failures
**Symptoms:** PDFs not saving to SharePoint
**Solutions:**
1. Check site permissions
2. Verify folder structure exists
3. Validate file naming (no special characters)
4. Check storage quota

#### Permission Errors
**Symptoms:** Access denied to SharePoint resources
**Solutions:**
1. Verify user has appropriate SharePoint permissions
2. Check site collection admin settings
3. Validate app permissions
4. Review sharing settings

### Teams Integration Issues

#### Webhook Authentication
**Symptoms:** Webhook requests fail authentication
**Solutions:**
1. Regenerate webhook URLs
2. Update environment variables
3. Check Teams app permissions
4. Verify message format

#### Message Formatting
**Symptoms:** Adaptive cards not displaying correctly
**Solutions:**
1. Validate JSON schema
2. Check Teams client version
3. Test on different platforms
4. Simplify card design

## Monitoring and Diagnostics

### Application Insights Queries

#### Find Failed Requests
```
requests
| where success == false
| where timestamp > ago(1h)
| project timestamp, name, resultCode, duration
```

#### Check Performance
```
requests
| where duration > 5000
| where timestamp > ago(24h)
| project timestamp, name, duration, user_Id
```

#### Monitor Errors
```
exceptions
| where timestamp > ago(1h)
| project timestamp, type, method, message
```

### Power Automate Diagnostics

#### Check Flow Performance
1. Go to flow details
2. Review run history
3. Check action durations
4. Identify bottlenecks

#### Debug Connections
1. Test all connection references
2. Verify API endpoints
3. Check authentication tokens
4. Validate permissions

### Power Apps Diagnostics

#### Monitor Usage
1. Check Power Apps analytics
2. Review user adoption metrics
3. Monitor error rates
4. Track performance metrics

#### Debug Formulas
1. Use Monitor tool in Power Apps Studio
2. Check formula syntax
3. Validate data types
4. Test in isolation

## Emergency Procedures

### Complete System Outage
1. Check Azure status page
2. Verify resource health
3. Check Application Insights
4. Contact Microsoft support if needed

### Data Corruption
1. Stop all write operations
2. Restore from backup
3. Validate data integrity
4. Notify affected users

### Security Incident
1. Isolate affected systems
2. Preserve evidence
3. Notify security team
4. Follow incident response plan

## Support Contacts

- **Development Team:** dev@sga.com.au
- **Infrastructure Team:** infra@sga.com.au
- **Security Team:** security@sga.com.au
- **Microsoft Support:** Premier support contract
- **Power Platform Support:** https://powerplatform.microsoft.com/support/

## Escalation Matrix

- **Level 1:** Support team (response < 4 hours)
- **Level 2:** Development team (response < 2 hours)
- **Level 3:** Infrastructure team (response < 1 hour)
- **Level 4:** Executive team (critical business impact)

## Prevention Best Practices

1. **Regular Backups:** Daily automated backups
2. **Monitoring:** 24/7 system monitoring
3. **Testing:** Regular load and security testing
4. **Updates:** Keep all components updated
5. **Documentation:** Maintain current runbooks
6. **Training:** Regular team training sessions