# Custom AI Chat Component - Implementation Guide

**Project:** SGA Foreman QA Pack Power Apps
**Version:** 1.0.0
**Last Updated:** November 16, 2025
**Author:** SGA Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Cost Analysis](#cost-analysis)
4. [Component Overview](#component-overview)
5. [Setup Instructions](#setup-instructions)
6. [Power Apps Integration](#power-apps-integration)
7. [Azure Function Deployment](#azure-function-deployment)
8. [Power Automate Flow Configuration](#power-automate-flow-configuration)
9. [Testing Procedures](#testing-procedures)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [Security Considerations](#security-considerations)
12. [Troubleshooting](#troubleshooting)
13. [Future Enhancements](#future-enhancements)

---

## Executive Summary

This guide documents the implementation of a **custom AI chat interface** for the SGA Foreman QA Pack Power Apps application. This solution replaces the need for Microsoft Copilot Studio, providing significant cost savings while maintaining enterprise-grade AI capabilities.

### Key Benefits

- **90% Cost Reduction**: $20-30/month vs $200+/month for Copilot Studio
- **Full Customization**: Tailored specifically for construction foremen workflows
- **Dataverse Integration**: Context-aware responses using real-time job, QA pack, and incident data
- **Enterprise Security**: Azure AD authentication, HTTPS enforcement, rate limiting
- **Production-Ready**: Error handling, audit logging, retry policies

### Solution Components

1. **CopilotScreen.fx.yaml** - Power Apps chat interface with SGA Orange branding
2. **AIChat.ts** - Azure Function for AI chat processing (GPT-4o)
3. **ChatbotFlow.json** - Power Automate flow connecting Power Apps to Azure Function
4. **Dataverse Integration** - Real-time context from jobs, QA packs, and incidents

---

## Architecture Overview

```
┌─────────────────┐
│   Power Apps    │
│ CopilotScreen   │
│  (User Input)   │
└────────┬────────┘
         │
         │ Send Message
         ▼
┌─────────────────────┐
│  Power Automate     │
│   ChatbotFlow       │
│ (Authentication &   │
│  Orchestration)     │
└────────┬────────────┘
         │
         │ HTTP POST
         ▼
┌──────────────────────┐
│  Azure Function      │
│     AIChat.ts        │
│  (AI Processing)     │
└────────┬─────────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌──────────────┐    ┌──────────────┐
│  Azure       │    │  Dataverse   │
│  OpenAI      │    │  (Context)   │
│  GPT-4o      │    │  Jobs/QA/    │
│              │    │  Incidents   │
└──────────────┘    └──────────────┘
         │                  │
         │   Response       │
         │◄─────────────────┘
         ▼
   ┌─────────────┐
   │ Power Apps  │
   │ Chat Bubble │
   └─────────────┘
```

### Data Flow

1. **User Input**: Foreman types message in Power Apps CopilotScreen
2. **Trigger Flow**: Power Apps calls ChatbotFlow (Power Automate)
3. **Authentication**: Flow validates user and adds Azure AD headers
4. **Azure Function**: AIChat.ts receives request
   - Authenticates user via Azure AD
   - Checks rate limits (50 messages/hour/user)
   - Queries Dataverse for user context (jobs, QA packs, incidents)
   - Calls Azure OpenAI GPT-4o with system prompt + context + user message
5. **Response**: AI response flows back through Power Automate to Power Apps
6. **Display**: Chat bubble appears in conversation history

---

## Cost Analysis

### Copilot Studio (Traditional Approach)

| Item | Cost |
|------|------|
| Copilot Studio License | $200/month |
| Dataverse API calls | Included |
| **Total Monthly Cost** | **$200/month** |
| **Annual Cost** | **$2,400/year** |

### Custom AI Chat (This Solution)

| Item | Cost | Notes |
|------|------|-------|
| Azure OpenAI GPT-4o | $15-25/month | ~50,000 tokens/day estimate |
| Azure Functions | $0-5/month | Consumption plan (free tier) |
| Power Automate Premium | Included | Already licensed |
| Dataverse API calls | Included | Already licensed |
| **Total Monthly Cost** | **$20-30/month** | |
| **Annual Cost** | **$240-360/year** | |

### ROI Analysis

- **Annual Savings**: $2,040 - $2,160 (90% reduction)
- **Break-Even**: Immediate (no setup costs)
- **3-Year Savings**: $6,120 - $6,480

### Usage Estimates

Based on 20 foremen using the chat assistant:

- **Average messages per foreman per day**: 5
- **Total daily messages**: 100
- **Monthly messages**: ~3,000
- **Tokens per conversation**: ~500 (input) + 300 (output) = 800 tokens
- **Monthly tokens**: 2.4M tokens
- **GPT-4o Cost**: $5/1M input tokens, $15/1M output tokens
- **Monthly AI Cost**: (1.5M × $5/1M) + (0.9M × $15/1M) = $7.50 + $13.50 = **$21/month**

---

## Component Overview

### 1. CopilotScreen.fx.yaml

**Location**: `/Users/dhruvmann/sga-qa-pack/src/power-app-source/CopilotScreen.fx.yaml`

**Features**:
- Chat message gallery (scrollable, auto-scroll to bottom)
- User message input with send button
- Conversation history stored in `colChatHistory` collection
- Quick action buttons for common queries
- SGA Orange branding (#FF6600)
- Loading indicator during AI processing
- Accessibility labels and screen reader support

**Key Variables**:
- `colChatHistory`: Collection storing chat messages
- `varUserMessage`: Current user input
- `varAIResponse`: AI response from Power Automate
- `varSendingMessage`: Boolean flag for loading state
- `varUserContext`: User email, name, division

### 2. AIChat.ts Azure Function

**Location**: `/Users/dhruvmann/sga-qa-pack/src/m365-deployment/azure-functions/AIChat.ts`

**Features**:
- Azure AD authentication via EasyAuth headers
- Rate limiting (50 requests/hour/user)
- Input sanitization and validation (Joi schema)
- Dataverse integration for context retrieval
- Azure OpenAI GPT-4o integration
- Comprehensive error handling and audit logging
- 30-second timeout protection

**API Contract**:

**Request**:
```json
{
  "message": "What are my assigned jobs?",
  "conversationHistory": [
    {
      "role": "user",
      "message": "Hello",
      "timestamp": "2025-11-16T10:00:00Z"
    },
    {
      "role": "assistant",
      "message": "Hi! How can I help?",
      "timestamp": "2025-11-16T10:00:01Z"
    }
  ],
  "userId": "foreman@sga.com.au"
}
```

**Response**:
```json
{
  "response": "You have 3 assigned jobs: Job SGA-2025-001 (Client: City Council, Status: Active), Job SGA-2025-002...",
  "timestamp": "2025-11-16T10:00:05Z",
  "metadata": {
    "tokensUsed": 850,
    "duration": 1250
  }
}
```

### 3. ChatbotFlow.json Power Automate Flow

**Location**: `/Users/dhruvmann/sga-qa-pack/src/m365-deployment/power-automate-flows/ChatbotFlow.json`

**Features**:
- Power Apps manual trigger
- User profile lookup (Office 365 connector)
- Input validation
- Azure Function HTTP call with retry policy
- Error handling with fallback messages
- Chat interaction logging to Dataverse
- Managed Service Identity authentication

**Trigger**: Power Apps button
**Return Values**: AI response, timestamp, error flag

---

## Setup Instructions

### Prerequisites

✅ **Azure Resources**:
- Azure OpenAI resource with GPT-4o deployment
- Azure Function App (Consumption or Premium plan)
- Azure Key Vault for secrets
- Managed Service Identity enabled

✅ **Power Platform**:
- Power Apps Premium license
- Power Automate Premium license
- Dataverse environment with tables:
  - `msdyn_jobs`
  - `sga_qapacks`
  - `msdyn_incidents`
  - `sga_chatinteractions` (for logging)
  - `sga_errorlogs` (for error logging)

✅ **Permissions**:
- Azure Contributor role for Function deployment
- Power Platform Environment Maker role
- Dataverse System Administrator role

### Step-by-Step Setup

#### Phase 1: Azure Function Deployment

**1. Configure Azure Key Vault**

Store the following secrets:

```bash
# Azure OpenAI
az keyvault secret set --vault-name sga-keyvault \
  --name "AzureOpenAI--Endpoint" \
  --value "https://sga-openai.openai.azure.com/"

az keyvault secret set --vault-name sga-keyvault \
  --name "AzureOpenAI--ApiKey" \
  --value "your-api-key-here"

# Dataverse
az keyvault secret set --vault-name sga-keyvault \
  --name "Dataverse--Url" \
  --value "https://sgaaust.crm6.dynamics.com"
```

**2. Deploy Azure Function**

```bash
cd /Users/dhruvmann/sga-qa-pack/src/m365-deployment/azure-functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy to Azure
func azure functionapp publish sga-qa-functions --typescript
```

**3. Configure Function App Settings**

```bash
# Enable Managed Service Identity
az functionapp identity assign --name sga-qa-functions --resource-group sga-rg

# Grant Key Vault access
az keyvault set-policy --name sga-keyvault \
  --object-id $(az functionapp identity show --name sga-qa-functions --resource-group sga-rg --query principalId -o tsv) \
  --secret-permissions get list

# Configure environment variables
az functionapp config appsettings set --name sga-qa-functions --resource-group sga-rg \
  --settings "KEY_VAULT_URL=https://sga-keyvault.vault.azure.net/"
```

**4. Enable EasyAuth (Azure AD Authentication)**

```bash
az webapp auth update --name sga-qa-functions --resource-group sga-rg \
  --enabled true \
  --action LoginWithAzureActiveDirectory \
  --aad-client-id <your-app-registration-id>
```

#### Phase 2: Dataverse Table Setup

**Create Chat Interactions Table** (`sga_chatinteractions`):

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| `sga_chatinteractionid` | GUID | Primary Key |
| `sga_userid` | Single Line Text | User email |
| `sga_usermessage` | Multiple Lines Text | User's message |
| `sga_airesponse` | Multiple Lines Text | AI response |
| `sga_timestamp` | Date and Time | Interaction timestamp |
| `sga_tokensused` | Whole Number | Tokens consumed |
| `sga_responsetime` | Whole Number | Response time (ms) |

**Create Error Logs Table** (`sga_errorlogs`):

| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| `sga_errorlogid` | GUID | Primary Key |
| `sga_source` | Single Line Text | Error source (e.g., "ChatbotFlow") |
| `sga_errormessage` | Multiple Lines Text | Error details |
| `sga_userid` | Single Line Text | User email |
| `sga_timestamp` | Date and Time | Error timestamp |
| `sga_severity` | Choice | Error, Warning, Info |

#### Phase 3: Power Automate Flow Import

**1. Import ChatbotFlow.json**

- Go to Power Automate (https://make.powerautomate.com)
- Click **My flows** → **Import** → **Import Package (Legacy)**
- Upload `/Users/dhruvmann/sga-qa-pack/src/m365-deployment/power-automate-flows/ChatbotFlow.json`
- Configure connections:
  - **Office 365 Users**: Connect with your account
  - **Dataverse**: Connect with your environment
  - **HTTP**: No connection needed

**2. Configure Flow Parameters**

- Open the imported flow
- Click **Edit**
- Update parameter:
  - `AzureFunctionURL`: https://sga-qa-functions.azurewebsites.net

**3. Test the Flow**

- Click **Test** → **Manually**
- Provide test inputs:
  ```json
  {
    "message": "What are my jobs?",
    "conversationHistory": "[]",
    "userId": "your-email@sga.com.au"
  }
  ```
- Verify successful response

#### Phase 4: Power Apps Integration

**1. Add CopilotScreen to Power Apps**

- Open Power Apps Studio
- Import `/Users/dhruvmann/sga-qa-pack/src/power-app-source/CopilotScreen.fx.yaml`
- Alternatively, copy the YAML content and paste into a new screen

**2. Configure Flow Connection**

- In Power Apps Studio, select **CopilotScreen**
- Click **Action** → **Power Automate** → **Add flow**
- Select **ChatbotFlow**

**3. Update Navigation**

Edit `DashboardScreen.fx.yaml`:

```yaml
CopilotButton As button:
    Text: ="Ask AI Assistant"
    X: =180
    Y: =110
    Width: =120
    Height: =40
    Fill: =RGBA(255, 102, 0, 1)  // SGA Orange
    Color: =RGBA(255, 255, 255, 1)
    OnSelect: =Navigate(CopilotScreen, ScreenTransition.Fade)
```

**4. Test in Power Apps**

- Run the app in preview mode
- Navigate to CopilotScreen
- Send a test message: "Hello"
- Verify AI response appears

---

## Power Apps Integration

### Screen Components

**Header Section**:
- Logo image (left)
- "SGA Assistant" title (center)
- Back button (right, chevron icon)

**Chat Messages Gallery**:
- Vertical scrolling gallery
- User messages: Right-aligned, blue background (#0078D4)
- AI messages: Left-aligned, gray background (#E1E1E1)
- Timestamp below each message
- Auto-scroll to latest message

**Input Section**:
- Multi-line text input (500 char max)
- Send button (arrow icon, SGA Orange when active)
- Loading indicator ("Thinking...")

**Quick Actions**:
- "Show My Jobs" - Asks about assigned jobs
- "QA Status" - Checks QA pack status
- "Asphalt Testing" - Explains testing procedures
- "Clear Chat" - Resets conversation

### Power Apps Formulas

**OnVisible** (Initialize chat):
```powerFx
If(
    IsEmpty(colChatHistory),
    ClearCollect(
        colChatHistory,
        {
            role: "assistant",
            message: "Hello! I'm your SGA Construction Assistant...",
            timestamp: Now()
        }
    )
);
Set(varUserContext, {
    email: User().Email,
    name: User().FullName,
    division: LookUp(Users, Email = User().Email, Division)
})
```

**Send Button OnSelect**:
```powerFx
If(
    Not(IsBlank(MessageInput.Text)) And Not(varSendingMessage),
    Set(varSendingMessage, true);
    Collect(colChatHistory, {
        role: "user",
        message: MessageInput.Text,
        timestamp: Now()
    });
    Set(varUserMessage, MessageInput.Text);
    Reset(MessageInput);
    Set(varAIResponse, PowerAutomate.Run("ChatbotFlow", {
        message: varUserMessage,
        conversationHistory: JSON(colChatHistory),
        userId: User().Email
    }));
    Collect(colChatHistory, {
        role: "assistant",
        message: varAIResponse.response,
        timestamp: Now()
    });
    Set(varSendingMessage, false)
)
```

### Accessibility Features

- **Screen reader support**: All components have `AccessibilityLabel` properties
- **Keyboard navigation**: Tab order configured for input → send → quick actions
- **High contrast**: Text meets WCAG AA standards (4.5:1 ratio)
- **Role attributes**: Heading roles for titles

---

## Azure Function Deployment

### Build and Deploy

**Local Development**:
```bash
cd /Users/dhruvmann/sga-qa-pack/src/m365-deployment/azure-functions

# Install dependencies
npm install

# Run tests
npm test

# Build TypeScript
npm run build

# Run locally
func start
```

**Deploy to Azure**:
```bash
# Login to Azure
az login

# Deploy function
func azure functionapp publish sga-qa-functions --typescript

# Verify deployment
curl -X POST https://sga-qa-functions.azurewebsites.net/api/AIChat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","userId":"test@sga.com.au"}'
```

### Environment Variables

Configure in Azure Portal → Function App → Configuration:

| Name | Value | Description |
|------|-------|-------------|
| `KEY_VAULT_URL` | `https://sga-keyvault.vault.azure.net/` | Key Vault URL |
| `DATAVERSE_URL` | `https://sgaaust.crm6.dynamics.com` | Dataverse instance URL |
| `FUNCTIONS_WORKER_RUNTIME` | `node` | Node.js runtime |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~20` | Node.js version |

### Monitoring

**Application Insights**:
- Function executions
- Response times
- Token usage
- Error rates

**Log Queries** (Application Insights → Logs):

```kql
// Chat function invocations
traces
| where message contains "AI Chat function triggered"
| project timestamp, message, severityLevel
| order by timestamp desc

// Error analysis
exceptions
| where outerMessage contains "AI Chat"
| summarize count() by outerMessage
| order by count_ desc

// Token usage tracking
traces
| where message contains "AUDIT: Chat response"
| extend tokensUsed = extract("tokens: ([0-9]+)", 1, message)
| summarize sum(toint(tokensUsed)) by bin(timestamp, 1h)
```

---

## Power Automate Flow Configuration

### Import Steps

1. **Download Flow**: Get `ChatbotFlow.json` from repository
2. **Import to Environment**:
   - Power Automate → My flows → Import → Import Package
   - Upload JSON file
   - Map connections (Office 365, Dataverse, HTTP)
3. **Update Parameters**:
   - `AzureFunctionURL`: Your Azure Function URL
4. **Enable Flow**: Toggle "On" in flow details

### Flow Actions Breakdown

**1. Initialize Variables**:
- `aiResponse` (String): Stores AI response
- `errorOccurred` (Boolean): Error flag

**2. Get Current User**:
- Office 365 Users connector
- Returns user email and display name

**3. Validate User Input**:
- Check message not empty
- Check userId provided
- Check message length ≤ 2000 chars

**4. Parse Conversation History**:
- Parse JSON string to array
- Handle empty history (default to `[]`)

**5. Call Azure Function**:
- HTTP POST to `/api/AIChat`
- Headers include base64-encoded user principal
- Retry policy: 2 retries, exponential backoff

**6. Parse AI Response**:
- Extract `response`, `timestamp`, `metadata`

**7. Log Chat Interaction**:
- Create record in `sga_chatinteractions` table
- Store user message, AI response, tokens, duration

**8. Error Handling**:
- Catch Azure Function failures
- Log to `sga_errorlogs` table
- Return friendly error message

**9. Return to Power Apps**:
- Response schema: `{response, timestamp, error}`

### Testing the Flow

**Test Flow** in Power Automate:

```json
{
  "message": "What are my assigned jobs?",
  "conversationHistory": "[{\"role\":\"user\",\"message\":\"Hello\",\"timestamp\":\"2025-11-16T10:00:00Z\"},{\"role\":\"assistant\",\"message\":\"Hi! How can I help?\",\"timestamp\":\"2025-11-16T10:00:01Z\"}]",
  "userId": "foreman@sga.com.au"
}
```

Expected output:
```json
{
  "response": "You have 3 assigned jobs: ...",
  "timestamp": "2025-11-16T10:00:05Z",
  "error": false
}
```

---

## Testing Procedures

### Unit Testing (Azure Function)

**Test AIChat function locally**:

```bash
cd /Users/dhruvmann/sga-qa-pack/src/m365-deployment/azure-functions

# Run all tests
npm test

# Run specific test file
npm test -- AIChat.test.ts

# Coverage report
npm test -- --coverage
```

**Sample test cases**:

1. ✅ Valid chat request returns AI response
2. ✅ Missing authentication returns 401
3. ✅ Rate limit exceeded returns 429
4. ✅ Invalid input returns 400 with validation errors
5. ✅ User ID mismatch returns 403
6. ✅ Dataverse error returns 500 with error message
7. ✅ Conversation history is properly sanitized
8. ✅ System prompt includes user context

### Integration Testing

**Test End-to-End Flow**:

1. **Power Apps → Power Automate**:
   - Open Power Apps in preview mode
   - Navigate to CopilotScreen
   - Send message: "Hello"
   - Verify loading indicator appears
   - Verify response appears in chat

2. **Power Automate → Azure Function**:
   - Run ChatbotFlow manually
   - Check flow run history
   - Verify all actions succeeded
   - Check response returned to Power Apps

3. **Azure Function → Dataverse**:
   - Verify function fetches user jobs
   - Verify function fetches QA packs
   - Check audit logs in Application Insights

4. **Azure Function → Azure OpenAI**:
   - Check OpenAI API calls succeed
   - Verify token usage is logged
   - Ensure response time < 5 seconds

### User Acceptance Testing (UAT)

**Test Scenarios**:

| Scenario | User Action | Expected Result |
|----------|-------------|-----------------|
| First-time user | Opens CopilotScreen | Welcome message appears |
| General question | "What is SGA?" | AI provides company info |
| Job query | "Show my jobs" | Lists assigned jobs from Dataverse |
| QA status | "Check QA status" | Shows recent QA packs |
| Testing info | "Asphalt temp requirements" | Explains temperature compliance |
| Long message | 2000+ characters | Validation error |
| Rapid messages | 60 messages in 1 hour | Rate limit triggered |
| Network error | Azure Function down | Friendly error message |
| Clear chat | Clicks "Clear Chat" | Conversation resets |

### Performance Testing

**Metrics to Monitor**:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response time | < 5 seconds | Azure Function duration |
| Token usage | < 1000 tokens/request | OpenAI API response |
| Error rate | < 1% | Application Insights |
| Availability | > 99.5% | Function App metrics |

**Load Testing**:

```bash
# Apache Bench test (100 requests, 10 concurrent)
ab -n 100 -c 10 -T application/json -p test-request.json \
  https://sga-qa-functions.azurewebsites.net/api/AIChat
```

---

## Monitoring and Maintenance

### Application Insights Dashboards

**Create Custom Dashboard**:

1. Go to Azure Portal → Application Insights → sga-qa-functions
2. Create new dashboard: "AI Chat Monitoring"
3. Add tiles:
   - **Request Rate**: Chart of requests/hour
   - **Response Time**: P95 latency
   - **Error Rate**: Failed requests %
   - **Token Usage**: Custom metric from logs

### Alert Rules

**Set up alerts** in Application Insights:

**1. High Error Rate**:
```
exceptions
| where customDimensions.FunctionName == "AIChat"
| summarize count() by bin(timestamp, 5m)
| where count_ > 10
```
Action: Email dev team

**2. Slow Responses**:
```
requests
| where name == "AIChat"
| summarize avg(duration) by bin(timestamp, 15m)
| where avg_duration > 5000
```
Action: Webhook to Slack

**3. Rate Limit Triggered**:
```
traces
| where message contains "Rate limit exceeded"
| summarize count() by bin(timestamp, 1h)
| where count_ > 50
```
Action: Increase rate limit or investigate abuse

### Maintenance Tasks

**Weekly**:
- Review error logs in Dataverse (`sga_errorlogs`)
- Check token usage trends
- Verify AI responses are accurate

**Monthly**:
- Update system prompt if needed
- Review chat interaction logs for improvements
- Update documentation for new features

**Quarterly**:
- Audit Azure OpenAI costs vs budget
- Review user feedback on AI responses
- Consider upgrading to newer GPT model

---

## Security Considerations

### Authentication and Authorization

✅ **Azure AD Authentication**:
- EasyAuth enforces Azure AD login
- User identity passed in `x-ms-client-principal` header
- User email validated against Dataverse

✅ **Rate Limiting**:
- 50 messages per hour per user
- Prevents abuse and cost overruns
- 429 response with retry-after header

✅ **Input Sanitization**:
- Joi schema validation
- Prompt injection prevention (removes special chars)
- Max message length: 2000 characters
- Max conversation history: 20 messages

### Data Privacy

✅ **PII Protection**:
- Chat interactions logged to Dataverse (customer-managed)
- No data sent to third parties (except Azure OpenAI)
- User consent required in Power Apps

✅ **Audit Logging**:
- All chat interactions logged with timestamp
- Tokens used and response time tracked
- User email associated with every request

✅ **HTTPS Enforcement**:
- Azure Function rejects HTTP requests
- TLS 1.2+ required
- Certificate pinning recommended

### Compliance

✅ **Australian Privacy Principles (APPs)**:
- User data stored in Australia (Dataverse Australia region)
- Azure OpenAI data residency: Australia East
- No international data transfer

✅ **ISO 27001**:
- Azure Functions and OpenAI are ISO 27001 certified
- Managed Service Identity eliminates credential storage
- Key Vault for secret management

---

## Troubleshooting

### Common Issues

#### Issue 1: "AI is not responding"

**Symptoms**: Send button clicked, loading indicator appears, but no response

**Possible Causes**:
1. Power Automate flow not enabled
2. Azure Function down or rate limited
3. Network connectivity issue

**Resolution**:
```bash
# Check flow status
az flow show --name ChatbotFlow --resource-group sga-rg

# Check function logs
az functionapp log tail --name sga-qa-functions --resource-group sga-rg

# Test function directly
curl -X POST https://sga-qa-functions.azurewebsites.net/api/AIChat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","userId":"test@sga.com.au"}'
```

#### Issue 2: "Rate limit exceeded"

**Symptoms**: Error message "Too many requests, please try again later"

**Possible Causes**:
- User sent > 50 messages in 1 hour
- Multiple users sharing the same account

**Resolution**:
1. Wait for rate limit window to reset (1 hour)
2. Increase rate limit in `AIChat.ts`:
   ```typescript
   maxRequests: 100,  // Increase from 50
   ```
3. Deploy updated function

#### Issue 3: "Azure OpenAI timeout"

**Symptoms**: Error after 30 seconds, no response

**Possible Causes**:
- Azure OpenAI service overloaded
- Large conversation history
- Complex query

**Resolution**:
1. Check Azure OpenAI service health
2. Reduce conversation history size (keep last 5 messages):
   ```typescript
   const recentHistory = sanitizedHistory.slice(-5);
   ```
3. Increase timeout in `AIChat.ts`:
   ```typescript
   setTimeout(() => reject(new Error('AI request timeout')), 60000) // 60s
   ```

#### Issue 4: "Dataverse authentication failed"

**Symptoms**: Error "Dataverse authentication failed - check Azure AD permissions"

**Possible Causes**:
- Managed Service Identity not configured
- Key Vault permissions missing
- Dataverse connection string incorrect

**Resolution**:
```bash
# Check MSI is enabled
az functionapp identity show --name sga-qa-functions --resource-group sga-rg

# Grant Key Vault access
az keyvault set-policy --name sga-keyvault \
  --object-id <MSI-principal-id> \
  --secret-permissions get list

# Verify Dataverse URL
az keyvault secret show --vault-name sga-keyvault --name "Dataverse--Url"
```

### Debug Logging

**Enable verbose logging** in Azure Function:

```typescript
// AIChat.ts
context.log('DEBUG: User message:', sanitizedMessage);
context.log('DEBUG: User context:', userContext);
context.log('DEBUG: AI prompt:', messages);
context.log('DEBUG: AI response:', response);
```

**View logs** in Application Insights:

```kql
traces
| where severityLevel >= 3
| where message contains "DEBUG"
| project timestamp, message
| order by timestamp desc
```

---

## Future Enhancements

### Phase 2 Features (Q1 2026)

1. **Voice Input**: Integrate speech-to-text for hands-free operation
2. **Image Analysis**: Upload site photos and ask AI to analyze
3. **Proactive Notifications**: AI suggests actions based on job status
4. **Multi-language Support**: Translate prompts for diverse workforce

### Phase 3 Features (Q2 2026)

1. **RAG (Retrieval-Augmented Generation)**: Index SGA policies and standards
2. **Fine-tuned Model**: Train custom GPT on SGA-specific data
3. **Predictive Analytics**: AI forecasts project delays and risks
4. **Teams Integration**: Chat with AI directly in Microsoft Teams

### Long-term Vision

**SGA AI Copilot Platform**:
- Unified AI assistant across Power Apps, Teams, and Web
- Document processing (OCR for handwritten QA forms)
- Automated compliance checking (Australian Standards)
- Incident root cause analysis
- Crew scheduling optimization

---

## Support and Contact

**Technical Support**:
- Email: dev-team@sga.com.au
- Teams Channel: SGA Tech Support
- Documentation: https://docs.sga.com.au

**Azure Support**:
- Azure Portal → Help + Support
- Phone: 1800-123-456 (Australia)

**Power Platform Support**:
- Power Apps Maker Portal → Support
- Microsoft 365 Admin Center

---

## Appendix

### A. File Locations

| File | Path |
|------|------|
| Power Apps Screen | `/Users/dhruvmann/sga-qa-pack/src/power-app-source/CopilotScreen.fx.yaml` |
| Azure Function | `/Users/dhruvmann/sga-qa-pack/src/m365-deployment/azure-functions/AIChat.ts` |
| Power Automate Flow | `/Users/dhruvmann/sga-qa-pack/src/m365-deployment/power-automate-flows/ChatbotFlow.json` |
| Documentation | `/Users/dhruvmann/sga-qa-pack/docs/m365-integration/CUSTOM_AI_CHAT_GUIDE.md` |

### B. API Reference

**AIChat Azure Function**

- **Endpoint**: `POST /api/AIChat`
- **Authentication**: Azure AD (EasyAuth)
- **Rate Limit**: 50 requests/hour/user
- **Timeout**: 30 seconds
- **Max Request Size**: 10 MB
- **Max Response Size**: 5 MB

**Request Schema**:
```json
{
  "message": "string (required, max 2000 chars)",
  "conversationHistory": "array (optional, max 20 items)",
  "userId": "string (required, email format)"
}
```

**Response Schema**:
```json
{
  "response": "string (AI response)",
  "timestamp": "string (ISO 8601)",
  "metadata": {
    "tokensUsed": "integer",
    "duration": "integer (ms)"
  }
}
```

### C. Dataverse Tables

**sga_chatinteractions**:
- Schema version: 1.0
- Retention: 90 days
- Indexes: `sga_userid`, `sga_timestamp`

**sga_errorlogs**:
- Schema version: 1.0
- Retention: 30 days
- Indexes: `sga_timestamp`, `sga_severity`

### D. Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-16 | Initial release |

---

**Document Status**: Approved
**Next Review**: 2026-02-16
**Owner**: SGA Development Team
