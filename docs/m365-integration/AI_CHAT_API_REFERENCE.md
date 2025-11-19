# Custom AI Chat System - Complete API Reference

## Overview

The Custom AI Chat system provides enterprise-grade conversational AI capabilities for the SGA QA Pack platform. This documentation covers all API endpoints, Power Automate flows, Power Apps integration, and Dataverse connections needed to implement the AI chat functionality across M365.

---

## Part 1: Azure Function Endpoints

### Azure Function Architecture

```
Azure Function App: sga-qa-functions
├── Runtime: Node.js 20 LTS
├── Language: TypeScript
├── Region: Australia East
├── Authentication: Managed Identity + Azure AD
├── Rate Limiting: 50 requests/hour/user
└── Monitoring: Application Insights
```

### Endpoint 1: POST /api/AIChat

**Purpose:** Process user messages through AI and maintain conversation context

**Base URL:** `https://sga-qa-functions.azurewebsites.net`

**Endpoint:** `/api/AIChat`

#### Request Format

```json
{
  "message": "string (required) - User's question or statement",
  "conversationId": "string (optional) - Unique conversation identifier",
  "conversationHistory": [
    {
      "role": "user | assistant",
      "content": "string - Message text",
      "timestamp": "ISO 8601 datetime"
    }
  ],
  "userId": "string (required) - Azure AD user ID",
  "context": {
    "currentJob": "string (optional) - Job number for context",
    "currentScreen": "string (optional) - Power Apps screen name",
    "dataverseEnvironment": "string (optional) - Environment ID"
  }
}
```

#### Request Example

```json
{
  "message": "What's the temperature compliance for job SGA-2024-189?",
  "conversationId": "conv_8a92f3d4-5c1e-4b9f-a8f2-1c3d5e7f9b2a",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Show me recent QA packs",
      "timestamp": "2024-11-16T09:30:00Z"
    },
    {
      "role": "assistant",
      "content": "I found 5 QA packs submitted this week. Which job would you like details on?",
      "timestamp": "2024-11-16T09:30:15Z"
    }
  ],
  "userId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "context": {
    "currentJob": "SGA-2024-189",
    "currentScreen": "QAPackDetailScreen",
    "dataverseEnvironment": "sga-production"
  }
}
```

#### Response Format

```json
{
  "success": "boolean - Operation success status",
  "response": "string - AI-generated response to user message",
  "conversationId": "string - Conversation identifier",
  "timestamp": "ISO 8601 datetime - Response timestamp",
  "metadata": {
    "tokensUsed": "integer - OpenAI tokens consumed",
    "executionTime": "integer - Milliseconds to generate response",
    "model": "string - GPT model used",
    "dataverseCallsMade": "integer - Number of Dataverse queries",
    "suggestionCards": [
      {
        "title": "string - Suggestion card title",
        "description": "string - Brief description",
        "action": "string - Recommended action",
        "dataverseRecordId": "string (optional) - Related record ID"
      }
    ]
  },
  "conversationHistory": [
    {
      "role": "user | assistant",
      "content": "string - Full message text",
      "timestamp": "ISO 8601 datetime"
    }
  ],
  "error": null | {
    "code": "string - Error code",
    "message": "string - Error description",
    "details": "object - Additional error information"
  }
}
```

#### Response Example (Success)

```json
{
  "success": true,
  "response": "Job SGA-2024-189 (Tonkin Highway) has a temperature compliance of 87% with 3 placements below minimum specification. The QA pack was submitted on November 12, 2024. I recommend reviewing the non-compliant placements and potentially raising an NCR. Would you like me to show you the detailed breakdown?",
  "conversationId": "conv_8a92f3d4-5c1e-4b9f-a8f2-1c3d5e7f9b2a",
  "timestamp": "2024-11-16T09:31:45Z",
  "metadata": {
    "tokensUsed": 245,
    "executionTime": 1823,
    "model": "gpt-4",
    "dataverseCallsMade": 3,
    "suggestionCards": [
      {
        "title": "View Full Report",
        "description": "Open the complete QA pack report in Power Apps",
        "action": "openQAPack",
        "dataverseRecordId": "c7e3f9a2-1b4d-4e8c-a5f2-7d9e1a3c5b8f"
      },
      {
        "title": "Create NCR",
        "description": "Raise a non-conformance report for the temperature issues",
        "action": "createNCR",
        "dataverseRecordId": "c7e3f9a2-1b4d-4e8c-a5f2-7d9e1a3c5b8f"
      },
      {
        "title": "Contact Foreman",
        "description": "Send message to John Smith (foreman) about the non-compliant placements",
        "action": "contactForeman",
        "dataverseRecordId": "f4a1d6b9-3e2c-4a7d-8f1e-5c9b2a7d4e6f"
      }
    ]
  },
  "conversationHistory": [
    {
      "role": "user",
      "content": "Show me recent QA packs",
      "timestamp": "2024-11-16T09:30:00Z"
    },
    {
      "role": "assistant",
      "content": "I found 5 QA packs submitted this week. Which job would you like details on?",
      "timestamp": "2024-11-16T09:30:15Z"
    },
    {
      "role": "user",
      "content": "What's the temperature compliance for job SGA-2024-189?",
      "timestamp": "2024-11-16T09:31:00Z"
    },
    {
      "role": "assistant",
      "content": "Job SGA-2024-189 (Tonkin Highway) has a temperature compliance of 87%...",
      "timestamp": "2024-11-16T09:31:45Z"
    }
  ],
  "error": null
}
```

#### Response Example (Error)

```json
{
  "success": false,
  "response": null,
  "conversationId": "conv_8a92f3d4-5c1e-4b9f-a8f2-1c3d5e7f9b2a",
  "timestamp": "2024-11-16T09:32:15Z",
  "metadata": {
    "tokensUsed": 0,
    "executionTime": 342,
    "model": "gpt-4",
    "dataverseCallsMade": 0,
    "suggestionCards": []
  },
  "conversationHistory": [],
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "User has exceeded maximum requests per hour (50 limit reached)",
    "details": {
      "userId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      "requestsThisHour": 50,
      "resetTime": "2024-11-16T10:30:00Z",
      "retryAfter": 3600
    }
  }
}
```

#### Authentication

**Method:** Azure AD Bearer Token + Managed Identity

```bash
# Get Azure AD token
curl -X POST \
  https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id={CLIENT_ID}' \
  -d 'scope=https://sga-qa-functions.azurewebsites.net/.default' \
  -d 'client_secret={CLIENT_SECRET}' \
  -d 'grant_type=client_credentials'

# Example request with auth header
curl -X POST \
  https://sga-qa-functions.azurewebsites.net/api/AIChat \
  -H 'Authorization: Bearer {ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Show me recent QA packs",
    "userId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
  }'
```

#### Rate Limiting

- **Limit:** 50 requests per hour per user
- **Header Response:** `X-RateLimit-Remaining: 49`
- **Exceeded Response:** HTTP 429 with `Retry-After` header

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 49
X-RateLimit-Reset: 1731745800
Retry-After: 3600
```

#### Error Codes

| Code | HTTP Status | Description | Retry? |
|------|-------------|-------------|--------|
| INVALID_MESSAGE | 400 | Message field is empty or null | No |
| MISSING_USER_ID | 400 | userId parameter required | No |
| INVALID_CONVERSATION_HISTORY | 400 | Malformed conversation history array | No |
| UNAUTHORIZED | 401 | Invalid or expired Azure AD token | No |
| FORBIDDEN | 403 | User doesn't have permission to this environment | No |
| RATE_LIMIT_EXCEEDED | 429 | User exceeded 50 requests/hour limit | Yes (wait Retry-After) |
| DATAVERSE_ERROR | 500 | Error querying Dataverse tables | Yes (exponential backoff) |
| OPENAI_API_ERROR | 500 | Azure OpenAI service error | Yes (exponential backoff) |
| INTERNAL_SERVER_ERROR | 500 | Unexpected server error | Yes (exponential backoff) |

#### Implementation Example (TypeScript)

```typescript
async function callAIChatEndpoint(
  message: string,
  userId: string,
  conversationHistory?: Array<{role: 'user'|'assistant', content: string, timestamp: string}>,
  context?: {currentJob?: string, currentScreen?: string}
): Promise<{success: boolean, response: string, error?: any}> {

  const token = await getAzureADToken();

  const requestBody = {
    message,
    userId,
    conversationHistory: conversationHistory || [],
    context: context || {}
  };

  const response = await fetch(
    'https://sga-qa-functions.azurewebsites.net/api/AIChat',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
    throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${data.error.code} - ${data.error.message}`);
  }

  return data;
}
```

---

## Part 2: Power Automate ChatbotFlow

### Flow Overview

**Name:** ChatbotFlow

**Type:** Instant cloud flow (Manual trigger from Power Apps)

**Purpose:** Handles message processing, Dataverse queries, and response generation

### Flow Architecture Diagram

```
Power Apps [Send Message Button]
    ↓
Power Automate [ChatbotFlow]
    ├─→ Parse input message
    ├─→ Check rate limits (Redis or custom table)
    ├─→ Query Dataverse for context
    │   ├─→ Recent QA packs
    │   ├─→ Jobs
    │   ├─→ User's assigned tasks
    │   └─→ Audit log for history
    ├─→ Call Azure Function /api/AIChat
    ├─→ Process response
    ├─→ Generate suggestion cards
    ├─→ Store conversation in Dataverse
    └─→ Return to Power Apps

Response → Power Apps [Display Message]
```

### Flow Trigger Configuration

**Trigger Type:** Manually trigger a flow (Power Apps Button)

**Input Parameters:**

```json
{
  "message": {
    "description": "User message",
    "type": "string"
  },
  "conversationId": {
    "description": "Conversation identifier",
    "type": "string"
  },
  "userId": {
    "description": "Azure AD user ID",
    "type": "string"
  },
  "currentJobId": {
    "description": "Current job record ID (optional)",
    "type": "string"
  }
}
```

### Flow Steps

#### Step 1: Initialize Variables

```yaml
Variables:
  varMessage: string = triggerBody()?['message']
  varConversationId: string = triggerBody()?['conversationId']
  varUserId: string = triggerBody()?['userId']
  varCurrentJobId: string = triggerBody()?['currentJobId']
  varConversationHistory: array = []
  varAPIResponse: object = {}
  varErrorOccurred: boolean = false
```

#### Step 2: Check Rate Limit

```yaml
Action: Check if user has exceeded rate limit
  - Check custom table: msdyn_apiratelimit
  - Filter: _msdyn_user_value = @{variables('varUserId')}
  - Filter: msdyn_timestamp > @{addHours(utcNow(), -1)}
  - Count rows
  - If count >= 50: Set varErrorOccurred = true, return 429 error
  - Else: Increment request count for this user
```

#### Step 3: Retrieve Conversation History

```yaml
Action: Get Conversation History
  Table: msdyn_chatconversation
  Filter: _msdyn_user_value eq @{variables('varUserId')} and msdyn_conversationid eq @{variables('varConversationId')}
  OrderBy: msdyn_timestamp descending
  Top: 10 (last 10 messages)

Action: Transform to Array
  Map each result:
    {
      "role": if(msdyn_issenderuser = true, 'user', 'assistant'),
      "content": msdyn_messagecontent,
      "timestamp": msdyn_timestamp
    }
  Store in: varConversationHistory
```

#### Step 4: Build Context

```yaml
Action: Get Current Job Details (if jobId provided)
  Table: msdyn_job
  Row ID: @{variables('varCurrentJobId')}
  Store in: varCurrentJob

Action: Get User's Assigned Jobs
  Table: msdyn_job
  Filter: _msdyn_assignedforeman_value eq @{variables('varUserId')}
  Top: 5
  Store in: varAssignedJobs

Action: Get Recent QA Packs (user submitted)
  Table: msdyn_qapack
  Filter: _msdyn_submittedby_value eq @{variables('varUserId')}
  OrderBy: msdyn_timestamp descending
  Top: 5
  Store in: varRecentQAPacks
```

#### Step 5: Call Azure Function

```yaml
Action: HTTP - POST to Azure Function
  URI: https://sga-qa-functions.azurewebsites.net/api/AIChat
  Method: POST
  Headers:
    Authorization: Bearer @{variables('varAzureADToken')}
    Content-Type: application/json

  Body:
    {
      "message": "@{variables('varMessage')}",
      "conversationId": "@{variables('varConversationId')}",
      "conversationHistory": @{variables('varConversationHistory')},
      "userId": "@{variables('varUserId')}",
      "context": {
        "currentJob": "@{variables('varCurrentJobId')}",
        "currentScreen": "ChatScreen",
        "dataverseEnvironment": "sga-production"
      }
    }

  Store response in: varAPIResponse
```

#### Step 6: Error Handling

```yaml
Condition: Is HTTP Response OK?
  No:
    Action: Compose Error Details
    Set: varErrorOccurred = true

    Action: Post to Teams - Error Channel
    Message: "ChatBot API Error - @{variables('varAPIResponse')?['error']['code']}"

    Condition: Is it rate limit (429)?
      Yes: Return special message "You've asked too many questions. Please try again after 1 hour"
      No: Return generic error message

  Yes: Continue to next step
```

#### Step 7: Store Conversation in Dataverse

```yaml
Action: Add User Message
  Table: msdyn_chatconversation
  Fields:
    msdyn_messageid: @{guid()}
    _msdyn_user_value: @{variables('varUserId')}
    _msdyn_conversation_value: @{variables('varConversationId')}
    msdyn_messagecontent: @{variables('varMessage')}
    msdyn_issenderuser: true
    msdyn_timestamp: @{utcNow()}
    msdyn_tokensused: 0

Action: Add Assistant Response
  Table: msdyn_chatconversation
  Fields:
    msdyn_messageid: @{guid()}
    _msdyn_user_value: @{variables('varUserId')}
    _msdyn_conversation_value: @{variables('varConversationId')}
    msdyn_messagecontent: @{body('varAPIResponse')?['response']}
    msdyn_issenderuser: false
    msdyn_timestamp: @{utcNow()}
    msdyn_tokensused: @{body('varAPIResponse')?['metadata']['tokensUsed']}
    msdyn_relatedrecordid: @{if(not(empty(body('varAPIResponse')?['metadata']['suggestionCards'][0]['dataverseRecordId'])), body('varAPIResponse')?['metadata']['suggestionCards'][0]['dataverseRecordId'], null)}
```

#### Step 8: Return Response to Power Apps

```yaml
Action: Respond to Power App
  Output:
    {
      "success": @{body('varAPIResponse')?['success']},
      "message": @{body('varAPIResponse')?['response']},
      "suggestionCards": @{body('varAPIResponse')?['metadata']['suggestionCards']},
      "error": @{if(variables('varErrorOccurred'), body('varAPIResponse')?['error'], null)},
      "conversationId": @{variables('varConversationId')},
      "timestamp": @{utcNow()}
    }
```

### Return Values

```json
{
  "success": boolean,
  "message": "string - AI-generated response",
  "suggestionCards": [
    {
      "title": "string",
      "description": "string",
      "action": "string - actionType",
      "dataverseRecordId": "string (optional)"
    }
  ],
  "error": {
    "code": "string",
    "message": "string",
    "details": "object"
  } | null,
  "conversationId": "string",
  "timestamp": "ISO 8601"
}
```

### Error Handling Strategy

```yaml
Try-Catch Pattern:
  Try:
    - All flow steps above

  Catch (Azure Function timeout):
    - Log error to msdyn_flowerrorlog
    - Return message: "AI is processing your request. Please wait a moment and ask again."
    - Send alert to admin channel

  Catch (Dataverse connection error):
    - Retry 3 times with exponential backoff
    - If still failing: Return cached response
    - Log to error table

  Catch (Rate limit):
    - Return 429 status
    - Include Retry-After header with reset time

  Finally:
    - Log execution metrics to Application Insights
```

---

## Part 3: Power Apps Integration

### CopilotScreen Component

**File:** `CopilotScreen.fx.yaml`

**Location:** Canvas App in Power Apps

#### Collections

```powerapps
// Collection: colChatHistory
// Stores conversation history locally
{
  messageId: Text,
  conversationId: Text,
  sender: Text,  // "user" or "assistant"
  message: Text,
  timestamp: Date,
  isLoading: Boolean,
  suggestions: Table  // Suggestion cards
}

// Collection: colSuggestionCards
// Stores quick action suggestions
{
  cardId: Text,
  title: Text,
  description: Text,
  action: Text,
  recordId: Text (GUID),
  isPending: Boolean
}

// Collection: colActiveConversations
// Track multiple parallel conversations
{
  conversationId: Text,
  jobId: Text,
  userId: Text,
  createdTime: Date,
  messageCount: Number,
  lastMessage: Text
}
```

#### Variables

```powerapps
// Message input
var_UserMessage: String = ""

// AI Response
var_AIResponse: String = ""
var_AILoading: Boolean = false

// Conversation management
var_ConversationId: String = GUID()
var_CurrentUser: Record = User()
var_CurrentJobId: String = ""

// Error handling
var_ErrorOccurred: Boolean = false
var_ErrorMessage: String = ""

// Rate limiting
var_RequestsThisHour: Number = 0
var_RateLimitExceeded: Boolean = false

// UI State
var_ChatExpanded: Boolean = false
var_ShowSuggestions: Boolean = true
var_ScrollToBottom: Boolean = true
```

#### Power Automate Flow Call

```powerapps
// OnSelect handler for "Send Message" button
OnSelect =
    // Validate input
    If(
        IsBlank(var_UserMessage),
        Notify("Please enter a message", NotificationType.Error),

        // Set loading state
        UpdateContext({var_AILoading: true});

        // Call Power Automate Flow
        Set(
            var_AIResponse,
            ChatbotFlow.Run(
                {
                    message: var_UserMessage,
                    conversationId: var_ConversationId,
                    userId: var_CurrentUser.Id,
                    currentJobId: var_CurrentJobId
                }
            ).value
        );

        // Add user message to history
        Collect(
            colChatHistory,
            {
                messageId: GUID(),
                conversationId: var_ConversationId,
                sender: "user",
                message: var_UserMessage,
                timestamp: Now(),
                isLoading: false,
                suggestions: Table()
            }
        );

        // Check for errors
        If(
            var_AIResponse.success,
            // Success: Add AI response
            Collect(
                colChatHistory,
                {
                    messageId: GUID(),
                    conversationId: var_ConversationId,
                    sender: "assistant",
                    message: var_AIResponse.message,
                    timestamp: Now(),
                    isLoading: false,
                    suggestions: var_AIResponse.suggestionCards
                }
            );

            // Add suggestion cards to collection
            ForAll(
                var_AIResponse.suggestionCards,
                Collect(
                    colSuggestionCards,
                    {
                        cardId: GUID(),
                        title: ThisRecord.title,
                        description: ThisRecord.description,
                        action: ThisRecord.action,
                        recordId: ThisRecord.dataverseRecordId,
                        isPending: false
                    }
                )
            );

            // Reset input
            Set(var_UserMessage, "");
            Set(var_ShowSuggestions, true);
            Set(var_ScrollToBottom, true),

            // Error: Show error message
            Notify(
                "Error: " & var_AIResponse.error.message,
                NotificationType.Error
            );
            Set(var_ErrorOccurred, true);
            Set(var_ErrorMessage, var_AIResponse.error.message)
        );

        // Hide loading state
        UpdateContext({var_AILoading: false})
    )
```

#### UI Components

**Chat Message List:**

```powerapps
// Gallery Control: gallChatHistory
Items: colChatHistory
Layout: Vertical
Scrolling: var_ScrollToBottom

// Template for each message
IsUserMessage = ThisRecord.sender = "user"

Background Color:
    If(IsUserMessage, Color.LightBlue, Color.White)

Border Radius: 12
Padding: 12

// Message Text
Label_MessageContent:
    Text: ThisRecord.message
    Wrap: true
    FontSize: 14
    Color: If(IsUserMessage, Color.White, Color.Black)

// Timestamp
Label_Timestamp:
    Text: Text(ThisRecord.timestamp, "hh:mm am/pm")
    FontSize: 10
    Color: Color.Gray
```

**Suggestion Cards:**

```powerapps
// Container: containerSuggestionCards
Visible: var_ShowSuggestions && !IsEmpty(colSuggestionCards)
Height: 120

// Horizontal Gallery of Cards
Items: colSuggestionCards
Width: Parent.Width
Direction: Horizontal
Scrolling: true

// Each Card
Border: 1
BorderColor: Color.LightGray
BorderRadius: 8
Padding: 8
Background: Color.White

// Title
Label_SuggestionTitle:
    Text: ThisRecord.title
    FontWeight: FontWeight.Bold
    FontSize: 13

// Description
Label_SuggestionDesc:
    Text: ThisRecord.description
    FontSize: 11
    Color: Color.Gray
    Wrap: true

// Action Button
Button_SelectSuggestion:
    Text: "Select"
    OnSelect: HandleSuggestionAction(
        ThisRecord.action,
        ThisRecord.recordId
    )
```

**Input Box:**

```powerapps
// Text Input: TextInput_Message
HintText: "Ask me anything about QA packs, jobs, or quality metrics..."
Multiline: false
Visible: !var_RateLimitExceeded

// Message Count Label
Label_CharCount:
    Text: Len(var_UserMessage) & "/500"
    Color: If(Len(var_UserMessage) > 450, Color.Red, Color.Gray)

// Send Button
Button_SendMessage:
    Text: "Send"
    DisplayMode: If(IsBlank(var_UserMessage) || var_AILoading, DisplayMode.Disabled, DisplayMode.Edit)
    OnSelect: <OnSelect handler from above>
```

**Error Display:**

```powerapps
// Error Container
containerError:
    Visible: var_ErrorOccurred
    Background: Color.LightRed
    Padding: 12

    // Error Message
    Label_ErrorText:
        Text: var_ErrorMessage
        Color: Color.Red
        Wrap: true

    // Close Button
    Button_CloseError:
        Text: "X"
        OnSelect: UpdateContext({var_ErrorOccurred: false})
```

#### Suggestion Action Handlers

```powerapps
// Function: HandleSuggestionAction
HandleSuggestionAction =
    Function(action, recordId,
        Switch(
            action,
            "openQAPack",
                Navigate(
                    QAPackDetailScreen,
                    ScreenTransition.Fade,
                    {qaPackId: recordId}
                ),
            "createNCR",
                Navigate(
                    NCRCreationScreen,
                    ScreenTransition.Fade,
                    {sourceQAPackId: recordId}
                ),
            "contactForeman",
                // Open Teams/Email compose
                Power("https://teams.microsoft.com/l/chat/0/0?users=" & recordId),
            "viewFullReport",
                Navigate(
                    ReportViewerScreen,
                    ScreenTransition.Fade,
                    {reportId: recordId}
                ),
            // Default
            Notify("Action not implemented: " & action, NotificationType.Warning)
        )
    )
```

---

## Part 4: Dataverse Tables & Integration

### Chat Conversation Table

**Table Name:** `msdyn_chatconversation`

**Purpose:** Store all chat messages and conversation history

#### Schema

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| msdyn_chatconversationid | GUID | Yes | Primary key |
| msdyn_messageid | Text | Yes | Unique message identifier |
| msdyn_user | Lookup | Yes | Reference to systemuser (who sent/received) |
| msdyn_conversationid | Text | Yes | Conversation identifier (groups related messages) |
| msdyn_messagecontent | Text (Memo) | Yes | Full message text |
| msdyn_issenderuser | Boolean | Yes | True if user sent, false if AI assistant |
| msdyn_timestamp | DateTime | Yes | When message was sent |
| msdyn_tokensused | Whole Number | No | OpenAI tokens consumed by this message |
| msdyn_relatedrecord | Lookup | No | Related Dataverse record (job, QA pack, etc.) |
| msdyn_suggestionscards | Text (Memo) | No | JSON array of suggestion cards |
| msdyn_erroroccurred | Boolean | No | True if message resulted in error |
| msdyn_errormessage | Text | No | Error details if applicable |

#### Relationships

```
msdyn_chatconversation.msdyn_user → systemuser.systemuserid
msdyn_chatconversation.msdyn_relatedrecord → (polymorphic to msdyn_job, msdyn_qapack, msdyn_ncr, etc.)
```

#### Indexes

```sql
INDEX ON (msdyn_user, msdyn_timestamp DESC)  -- For user's conversation history
INDEX ON (msdyn_conversationid, msdyn_timestamp ASC)  -- For conversation flow
INDEX ON (msdyn_timestamp DESC)  -- For system-wide queries
```

### Chat Configuration Table

**Table Name:** `msdyn_chatconfig`

**Purpose:** Store user-specific chat settings and preferences

#### Schema

| Column Name | Type | Description |
|------------|------|-------------|
| msdyn_chatconfigid | GUID | Primary key |
| msdyn_user | Lookup | Reference to systemuser |
| msdyn_autoscroll | Boolean | Auto-scroll to latest message |
| msdyn_showsuggestions | Boolean | Show AI suggestion cards |
| msdyn_maxconversationlength | Whole Number | Number of messages to keep (default: 50) |
| msdyn_enablenotifications | Boolean | Alert user of AI responses |
| msdyn_preferredresponselength | Choice | Short/Medium/Long |
| msdyn_defaultjob | Lookup | Default job context |

### Rate Limit Tracking Table

**Table Name:** `msdyn_apiratelimit`

**Purpose:** Track API request counts for rate limiting

#### Schema

| Column Name | Type | Description |
|------------|------|-------------|
| msdyn_apiratelimitid | GUID | Primary key |
| msdyn_user | Lookup | Reference to systemuser |
| msdyn_requestcount | Whole Number | Number of requests this hour |
| msdyn_lastreset | DateTime | When count was last reset |
| msdyn_issuspended | Boolean | Is user rate-limited? |
| msdyn_suspensionendtime | DateTime | When suspension ends |

#### Queries

**Query: Get Current Hour's Requests**

```odata
GET /api/data/v9.2/msdyn_apilimits
  ?$filter=_msdyn_user_value eq 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
    and msdyn_lastre set gt @{addHours(utcNow(), -1)}
  &$select=msdyn_requestcount,msdyn_lastre set
```

### Data Queries Used in Chat

```typescript
// Query 1: Get user's recent QA packs
const recentQAPacks = await dataverseClient.retrieveMultiple('msdyn_qapacks', {
  filter: `_msdyn_submittedby_value eq '${userId}'`,
  select: ['msdyn_qapackid', 'msdyn_reportid', 'msdyn_timestamp', 'msdyn_status'],
  orderBy: ['msdyn_timestamp desc'],
  top: 10
});

// Query 2: Get user's assigned jobs
const assignedJobs = await dataverseClient.retrieveMultiple('msdyn_jobs', {
  filter: `_msdyn_assignedforeman_value eq '${userId}'`,
  select: ['msdyn_jobid', 'msdyn_jobnumber', 'msdyn_projectname', 'msdyn_jobdate'],
  orderBy: ['msdyn_jobdate desc'],
  top: 5
});

// Query 3: Get specific job with related data
const jobDetails = await dataverseClient.retrieve(jobId, 'msdyn_jobs', {
  select: ['*'],
  expand: [
    {
      property: 'msdyn_qapacks_job',
      select: ['msdyn_qapackid', 'msdyn_status', 'msdyn_expertsummary']
    },
    {
      property: 'msdyn_incidents_job',
      select: ['msdyn_incidentid', 'msdyn_type', 'msdyn_description']
    }
  ]
});

// Query 4: Get QA pack details with asphalt placement
const qaPackDetails = await dataverseClient.retrieve(qaPackId, 'msdyn_qapacks', {
  select: ['*'],
  expand: [
    {
      property: 'msdyn_asphaltplacements',
      select: ['*']
    },
    {
      property: 'msdyn_dailyreport',
      select: ['*']
    }
  ]
});
```

---

## Part 5: Quick Start Guide

### Prerequisites

- Microsoft 365 E3/E5 license
- Power Apps and Power Automate licenses
- Dataverse environment provisioned
- Azure subscription for Azure Functions
- Azure OpenAI service deployed

### Step 1: Deploy Azure Function

#### 1a. Set Up Local Development

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Create function project
func init sga-ai-chat --typescript
cd sga-ai-chat

# Install dependencies
npm install @azure/identity
npm install @azure/openai
npm install dynamics-web-api
npm install axios

# Create HTTP triggered function
func new --name AIChat --template "HTTP trigger"
```

#### 1b. Implement Function Code

Copy the TypeScript implementation from `/Users/dhruvmann/sga-qa-pack/docs/m365-integration/07_AZURE_FUNCTIONS.md`

Key sections to implement:
- Dataverse client authentication
- OpenAI client setup
- Message processing logic
- Rate limiting
- Error handling

#### 1c. Configure local.settings.json

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",

    "AZURE_TENANT_ID": "your-tenant-id",
    "AZURE_CLIENT_ID": "your-service-principal-id",
    "AZURE_CLIENT_SECRET": "your-service-principal-secret",

    "DATAVERSE_URL": "https://sgagroup.crm6.dynamics.com",

    "AZURE_OPENAI_ENDPOINT": "https://sga-openai.openai.azure.com",
    "AZURE_OPENAI_KEY": "your-openai-key",
    "AZURE_OPENAI_DEPLOYMENT": "gpt-4"
  }
}
```

#### 1d. Test Locally

```bash
# Run locally
func start

# In another terminal, test endpoint
curl -X POST http://localhost:7071/api/AIChat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message",
    "userId": "test-user-id"
  }'
```

#### 1e. Deploy to Azure

```bash
# Login to Azure
az login

# Create resource group
az group create --name sga-ai-functions-rg --location australiaeast

# Create storage account
az storage account create \
  --name sgaaifunctions \
  --resource-group sga-ai-functions-rg \
  --location australiaeast \
  --sku Standard_LRS

# Create function app
az functionapp create \
  --name sga-ai-chat-functions \
  --resource-group sga-ai-functions-rg \
  --storage-account sgaaifunctions \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4

# Deploy function
npm run build
func azure functionapp publish sga-ai-chat-functions

# Configure app settings
az functionapp config appsettings set \
  --name sga-ai-chat-functions \
  --resource-group sga-ai-functions-rg \
  --settings \
    AZURE_TENANT_ID="your-tenant-id" \
    AZURE_CLIENT_ID="your-client-id" \
    AZURE_CLIENT_SECRET="your-client-secret" \
    DATAVERSE_URL="https://sgagroup.crm6.dynamics.com" \
    AZURE_OPENAI_ENDPOINT="https://sga-openai.openai.azure.com" \
    AZURE_OPENAI_KEY="your-key" \
    AZURE_OPENAI_DEPLOYMENT="gpt-4"
```

### Step 2: Import Power Automate Flow

#### 2a. Create ChatbotFlow in Power Automate

1. Go to `https://make.powerautomate.com`
2. Click **Create** → **Instant cloud flow**
3. Select **Power Apps button** as trigger
4. Name it: `ChatbotFlow`

#### 2b. Add Flow Steps

Follow the flow configuration from Part 2 of this document:

1. Initialize variables
2. Check rate limits
3. Retrieve conversation history
4. Build context
5. Call Azure Function
6. Handle errors
7. Store in Dataverse
8. Return to Power Apps

#### 2c. Configure Connections

- Dataverse connection (already configured)
- Azure AD connection (for authentication)
- HTTP connection (for Azure Function calls)

#### 2d. Test Flow

Use **Test** button in Power Automate:

```json
{
  "message": "What is the temperature compliance for job SGA-2024-189?",
  "conversationId": "conv_test_123",
  "userId": "your-user-id",
  "currentJobId": "job-id-here"
}
```

### Step 3: Add CopilotScreen to Power Apps

#### 3a. Open Canvas App

1. Go to `https://make.powerapps.com`
2. Open your canvas app (or create new)
3. Create new screen: **CopilotScreen**

#### 3b. Add Controls

1. **Gallery** (for chat history)
   - Name: `gallChatHistory`
   - Items: `colChatHistory`

2. **Text Input** (for user message)
   - Name: `TextInput_Message`
   - Placeholder: "Ask me anything..."

3. **Button** (send message)
   - Name: `Button_SendMessage`
   - Text: "Send"
   - OnSelect: `ChatbotFlow.Run({...})`

4. **Vertical Gallery** (for suggestions)
   - Name: `gallSuggestions`
   - Items: `colSuggestionCards`

#### 3c: Connect ChatbotFlow

In Power Apps formula bar for Send button:

```powerapps
OnSelect =
    Set(var_AILoading, true);
    ClearCollect(colChatHistory, Table());
    ChatbotFlow.Run({
        message: TextInput_Message.Value,
        conversationId: var_ConversationId,
        userId: User().Id,
        currentJobId: var_CurrentJobId
    })
```

### Step 4: Create Dataverse Tables

#### 4a. Create Chat Conversation Table

1. Go to `https://make.powerapps.com`
2. **Tables** → **New table**
3. Name: `Chat Conversation`
4. Display name: `Chat Conversation`
5. Add columns:

```
- Message ID (Text, Required)
- User (Lookup to User, Required)
- Conversation ID (Text, Required)
- Message Content (Text - Memo, Required)
- Is Sender User (Boolean, Required)
- Timestamp (Date Time, Required)
- Tokens Used (Whole Number)
- Error Occurred (Boolean)
- Error Message (Text)
```

#### 4b. Create Rate Limit Table

1. New table: `API Rate Limit`
2. Add columns:

```
- User (Lookup to User)
- Request Count (Whole Number)
- Last Reset (Date Time)
- Is Suspended (Boolean)
- Suspension End Time (Date Time)
```

#### 4c. Create Indexes

In table advanced settings:

```sql
-- For user conversation history
INDEX ON (_msdyn_user_value, msdyn_timestamp DESC)

-- For conversation flow
INDEX ON (msdyn_conversationid, msdyn_timestamp ASC)
```

### Step 5: Test Integration

#### 5a: End-to-End Test

1. Open Power Apps with CopilotScreen
2. Type message: "Show recent QA packs"
3. Verify:
   - Message appears in chat
   - Loading indicator shows
   - Azure Function called (check Application Insights)
   - Response appears in chat
   - Suggestion cards displayed
   - Message stored in Dataverse

#### 5b: Test Error Scenarios

**Rate Limit:**
- Send 51 messages rapidly
- Should get 429 error after 50th

**Network Error:**
- Disconnect network temporarily
- Azure Function should timeout gracefully
- User should see retry message

**Invalid Input:**
- Empty message
- Should not call flow

---

## Part 6: Troubleshooting Guide

### Common Issues

#### Issue 1: "Unauthorized (401)" on Azure Function Call

**Causes:**
- Invalid Azure AD token
- Token expired
- Service Principal doesn't have permissions

**Solutions:**

```powerapps
// In Power Automate, ensure auth header is correct:
Headers:
  {
    "Authorization": "Bearer " & body('Get_Token')['access_token'],
    "Content-Type": "application/json"
  }
```

Check token expiration:
```bash
az account get-access-token \
  --resource https://sga-qa-functions.azurewebsites.net
```

Grant permissions to service principal:
```bash
az role assignment create \
  --assignee your-client-id \
  --role "Function App Contributor" \
  --scope /subscriptions/your-subscription-id
```

#### Issue 2: Dataverse Connection Timeout

**Causes:**
- Large queries returning too much data
- Network connectivity issues
- Dataverse throttling

**Solutions:**

Add pagination to queries:
```powerapps
// In Power Automate, use 'Top' parameter
Actions:
  Table: msdyn_job
  Top: 10  // Limit results
  Filter: _msdyn_assignedforeman_value eq @{varUserId}
```

#### Issue 3: Rate Limit Errors (429)

**Causes:**
- User exceeded 50 requests/hour
- Rate limiter not checking correctly

**Solutions:**

Verify rate limit table:
```sql
SELECT msdyn_user, msdyn_requestcount, msdyn_lastre set
FROM msdyn_apiratelimit
WHERE DATEDIFF(HOUR, msdyn_lastre set, GETUTCDATE()) < 1
```

Reset user's rate limit:
```sql
UPDATE msdyn_apiratelimit
SET msdyn_requestcount = 0,
    msdyn_lastre set = GETUTCDATE()
WHERE _msdyn_user_value = 'user-id'
```

#### Issue 4: Suggestion Cards Not Appearing

**Causes:**
- Empty suggestionCards array
- Gallery not bound correctly
- Collection not populated

**Solutions:**

Check Azure Function response:
```json
// Should include:
"metadata": {
  "suggestionCards": [
    {
      "title": "...",
      "description": "...",
      "action": "...",
      "dataverseRecordId": "..."
    }
  ]
}
```

Verify Power Apps collection:
```powerapps
// In app, check if cards are being added:
Trace("Suggestion Cards: " & JSON(colSuggestionCards));
```

#### Issue 5: Chat History Not Persisting

**Causes:**
- Dataverse table not created
- Messages not being inserted
- User permissions issue

**Solutions:**

Check Dataverse table exists:
```bash
curl -X GET "https://sgagroup.crm6.dynamics.com/api/data/v9.2/EntityDefinitions(LogicalName='msdyn_chatconversation')" \
  -H "Authorization: Bearer $token"
```

Manually insert test message:
```
POST /api/data/v9.2/msdyn_chatconversations
{
  "msdyn_messageid": "test-123",
  "_msdyn_user_value": "user-id",
  "msdyn_conversationid": "conv-123",
  "msdyn_messagecontent": "Test message",
  "msdyn_issenderuser": true,
  "msdyn_timestamp": "2024-11-16T10:00:00Z"
}
```

#### Issue 6: High Token Usage

**Causes:**
- Long conversation histories
- Large Dataverse queries
- Inefficient prompts

**Solutions:**

Limit conversation history in Azure Function:
```typescript
// Keep only last 10 messages
const limitedHistory = conversationHistory.slice(-10);

const response = await aiClient.generateCompletion(
  systemPrompt,
  userPrompt,
  0.3  // Lower temperature for efficiency
);
```

Cache frequent queries:
```typescript
// Cache job details for 1 hour
const cacheKey = `job_${jobId}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

const jobDetails = await dataverseClient.retrieve(jobId, 'msdyn_jobs');
await redis.setex(cacheKey, 3600, JSON.stringify(jobDetails));
```

---

## Part 7: Monitoring & Analytics

### Application Insights Setup

**Metrics to Track:**

```javascript
// Log to Application Insights
appInsights.trackEvent({
  name: 'ChatMessage',
  properties: {
    userId: userId,
    messageLength: message.length,
    conversationLength: conversationHistory.length,
    tokensUsed: response.usage.total_tokens,
    executionTime: endTime - startTime,
    hasError: false
  },
  measurements: {
    responseTime: executionTime,
    tokenCount: response.usage.total_tokens
  }
});

// Track exceptions
appInsights.trackException({
  exception: error,
  properties: {
    userId: userId,
    messageContent: message
  }
});
```

### Dashboard Queries

**Query: Daily Chat Volume**

```kusto
customEvents
| where name == "ChatMessage"
| summarize count() by bin(timestamp, 1h)
| render linechart
```

**Query: Average Response Time**

```kusto
customEvents
| where name == "ChatMessage"
| extend responseTime = todouble(properties.executionTime)
| summarize avg(responseTime), max(responseTime) by bin(timestamp, 1h)
```

---

## Summary

This API reference provides complete documentation for implementing the Custom AI Chat system in M365. The system includes:

✅ **Azure Function Endpoint** - RESTful API for AI processing
✅ **Power Automate Flow** - Orchestration and Dataverse integration
✅ **Power Apps UI** - User-friendly chat interface
✅ **Dataverse Backend** - Persistent conversation storage
✅ **Rate Limiting** - Prevent abuse (50 req/hour/user)
✅ **Error Handling** - Comprehensive error management
✅ **Authentication** - Azure AD + Managed Identity
✅ **Monitoring** - Application Insights tracking

**Next Steps:**
1. Deploy Azure Function
2. Create Power Automate ChatbotFlow
3. Add CopilotScreen to Power Apps
4. Configure Dataverse tables
5. Test end-to-end integration
6. Set up monitoring
7. Monitor and optimize

For detailed implementation guidance, refer to the individual section documentation in this reference.
