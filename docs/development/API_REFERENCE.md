# SGA QA Pack API Reference

## Overview
The SGA QA Pack provides REST APIs for Quality Assurance pack management, AI-powered summaries, and system administration.

## Base URL
```
https://sga-qapack-func-prod.azurewebsites.net/api/
```

## Authentication
All API endpoints require Azure AD authentication via Easy Auth. Requests must include the `x-ms-client-principal` header injected by Azure Functions authentication.

## Rate Limiting
- 20 requests per hour per authenticated user
- Returns HTTP 429 when exceeded
- Includes `X-RateLimit-*` headers in responses

## Endpoints

### POST /api/GenerateAISummary
Generate an AI-powered executive summary for a QA Pack.

**Request Body:**
```json
{
  "qaPackId": "uuid",
  "jobNumber": "string",
  "client": "string",
  "dailyReport": {
    "msdyn_completedby": "string",
    "msdyn_starttime": "string",
    "msdyn_finishtime": "string",
    "msdyn_correctorused": "boolean",
    "msdyn_siteinstructions": "string",
    "msdyn_othercomments": "string",
    "msdyn_date": "string"
  },
  "asphaltPlacement": {
    "msdyn_date": "string",
    "msdyn_lotno": "string",
    "msdyn_pavementsurfacecondition": "number",
    "msdyn_rainfallduringshift": "boolean"
  },
  "placementRows": [
    {
      "msdyn_docketnumber": "string",
      "msdyn_tonnes": "number",
      "msdyn_incomingtemp": "number",
      "msdyn_placementtemp": "number",
      "msdyn_tempscompliant": "boolean",
      "msdyn_nonconformancereason": "string",
      "msdyn_sequencenumber": "number"
    }
  ]
}
```

**Response:**
```json
{
  "summary": "string",
  "qaPackId": "uuid",
  "generatedAt": "ISO8601 timestamp"
}
```

**Error Responses:**
- `400` - Invalid input validation
- `401` - Authentication required
- `403` - Authorization denied or HTTPS required
- `429` - Rate limit exceeded
- `500` - Internal server error

**Security Notes:**
- All inputs are sanitized to prevent prompt injection
- User authorization is validated before processing
- AI responses are logged for audit purposes

## Data Types

### QA Pack Status Values
- `0` - Draft
- `1` - Submitted
- `2` - Under Review
- `3` - Approved
- `4` - Rejected

### Division Codes
- `1` - Asphalt
- `2` - Profiling
- `3` - Spray

### Temperature Compliance
- `true` - Within acceptable range (±10°C of target)
- `false` - Outside acceptable range

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "ErrorType",
  "message": "Human-readable description"
}
```

## Monitoring

### Application Insights
All API calls are logged to Azure Application Insights with:
- Request/response times
- User information (anonymized)
- Error details
- Performance metrics

### Audit Logging
Security events are logged including:
- Authentication attempts
- Authorization decisions
- AI usage (token counts, duration)
- Rate limit violations

## Versioning

API versioning follows Azure Functions best practices:
- No version in URL (current version only)
- Breaking changes require new endpoint
- Deprecation notices provided 30 days in advance

## Support

For API issues:
1. Check Application Insights logs
2. Review error messages for specific guidance
3. Contact system administrator for access issues
4. Report bugs via standard channels

## Compliance

- GDPR compliant (data minimization, consent)
- SOC 2 Type II certified
- ISO 27001 compliant
- Regular security audits performed