# 🤖 AI Assistant Chatbot - Mission Brief

**Project:** SGA QA System Full AI Assistant
**Estimated Effort:** 1-2 weeks
**Priority:** High

---

## 📋 Mission Overview

Build a comprehensive AI chatbot assistant integrated into the SGA QA System that can:
1. Answer field worker questions about specs, compliance, procedures
2. Query and analyze system data (jobs, projects, incidents, NCRs)
3. Help create drafts (jobs, QA packs, incidents)
4. Search uploaded documents (RAG)
5. Provide proactive suggestions based on context

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ChatInterface Component                 │   │
│  │  - Message history                                   │   │
│  │  - Input field with send button                      │   │
│  │  - Suggested prompts                                 │   │
│  │  - Context awareness (current page)                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Vercel API Endpoint                       │
│                    /api/chat/message                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ChatService                             │   │
│  │  - Message routing                                   │   │
│  │  - Intent classification                             │   │
│  │  - Context management                                │   │
│  │  - Response formatting                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Data Service   │ │  Knowledge Base │ │  AI Service     │
│  (SharePoint)   │ │  (RAG/Embeddings│ │  (Azure OpenAI) │
│                 │ │   + Docs)       │ │                 │
│ - Jobs          │ │ - Specs         │ │ - Chat          │
│ - Projects      │ │ - Procedures    │ │ - Summaries     │
│ - Incidents     │ │ - Standards     │ │ - Analysis      │
│ - QA Packs      │ │ - Training      │ │ - Drafts        │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 📁 Files to Create

### Frontend Components
```
src/components/chat/
├── ChatInterface.tsx       # Main chat UI
├── ChatMessage.tsx         # Individual message component
├── ChatInput.tsx           # Input with suggestions
├── ChatSidebar.tsx         # Chat history sidebar
├── SuggestedPrompts.tsx    # Quick action prompts
└── index.ts                # Exports
```

### API Endpoints
```
api/chat/
├── message.ts              # Main chat endpoint
├── history.ts              # Get chat history
├── feedback.ts             # Rate responses
└── _lib/
    ├── chatService.ts      # Core chat logic
    ├── intentClassifier.ts # Classify user intent
    ├── dataQueryEngine.ts  # Query SharePoint data
    ├── knowledgeBase.ts    # RAG/document search
    ├── draftGenerator.ts   # Generate drafts
    └── contextManager.ts   # Manage conversation context
```

### Supporting Files
```
src/types/chat.ts           # Chat-related types
src/services/chatApi.ts     # Frontend API client
src/hooks/useChat.ts        # React hook for chat
src/pages/ChatPage.tsx      # Dedicated chat page
```

---

## 🎯 Task Breakdown for AI Workers

### Task 1: Chat Types & Interfaces (Worker: Qwen Coder)
**File:** `src/types/chat.ts`
**Description:** Define all TypeScript interfaces for the chat system
**Includes:**
- ChatMessage interface
- ChatConversation interface
- ChatIntent enum
- DataQueryResult interface
- KnowledgeBaseResult interface

### Task 2: Chat API Client (Worker: DeepSeek V3)
**File:** `src/services/chatApi.ts`
**Description:** Frontend service for chat API calls
**Includes:**
- sendMessage()
- getHistory()
- getChatById()
- submitFeedback()
- clearHistory()

### Task 3: useChat Hook (Worker: Gemini Flash)
**File:** `src/hooks/useChat.ts`
**Description:** React hook for managing chat state
**Includes:**
- Message history state
- Loading states
- Send message function
- Auto-scroll behavior
- Retry logic

### Task 4: ChatMessage Component (Worker: Groq Llama)
**File:** `src/components/chat/ChatMessage.tsx`
**Description:** Individual message bubble component
**Includes:**
- User vs assistant styling
- Markdown rendering
- Code syntax highlighting
- Copy button
- Timestamp
- Feedback buttons (thumbs up/down)

### Task 5: ChatInput Component (Worker: Cerebras)
**File:** `src/components/chat/ChatInput.tsx`
**Description:** Input field with features
**Includes:**
- Text input with auto-resize
- Send button
- Voice input option (optional)
- File attachment (optional)
- Keyboard shortcuts

### Task 6: SuggestedPrompts Component (Worker: Qwen 72B)
**File:** `src/components/chat/SuggestedPrompts.tsx`
**Description:** Quick action prompts based on context
**Includes:**
- Context-aware suggestions
- Role-based prompts
- Recent query shortcuts
- Category chips

### Task 7: ChatInterface Component (Worker: DeepSeek R1)
**File:** `src/components/chat/ChatInterface.tsx`
**Description:** Main chat UI container
**Includes:**
- Message list
- Input area
- Suggested prompts
- Loading indicators
- Error handling
- Mobile responsive

### Task 8: Intent Classifier (Worker: Qwen Coder)
**File:** `api/chat/_lib/intentClassifier.ts`
**Description:** Classify user message intent
**Intents:**
- DATA_QUERY: "Show me jobs for tomorrow"
- KNOWLEDGE_SEARCH: "What's the spec for AC14?"
- DRAFT_CREATE: "Help me create a job"
- HELP: "How do I submit a QA pack?"
- GENERAL_CHAT: Everything else

### Task 9: Data Query Engine (Worker: DeepSeek V3)
**File:** `api/chat/_lib/dataQueryEngine.ts`
**Description:** Convert natural language to SharePoint queries
**Includes:**
- Parse natural language
- Build SharePoint filters
- Execute queries
- Format results
- Aggregation support

### Task 10: Knowledge Base (Worker: Gemini Pro)
**File:** `api/chat/_lib/knowledgeBase.ts`
**Description:** RAG system for document search
**Includes:**
- Document indexing
- Vector embeddings (Azure OpenAI)
- Semantic search
- Context window management
- Source attribution

### Task 11: Draft Generator (Worker: DeepSeek R1)
**File:** `api/chat/_lib/draftGenerator.ts`
**Description:** Generate draft content
**Includes:**
- Job draft generation
- QA pack prefilling
- Incident report drafts
- NCR drafts
- Template-based generation

### Task 12: Context Manager (Worker: Groq Llama)
**File:** `api/chat/_lib/contextManager.ts`
**Description:** Manage conversation context
**Includes:**
- Conversation history
- User preferences
- Current page context
- Entity references
- Session management

### Task 13: Chat Service (Worker: Qwen 72B)
**File:** `api/chat/_lib/chatService.ts`
**Description:** Core orchestration logic
**Includes:**
- Route to appropriate handler
- Combine responses
- Format output
- Error handling
- Logging

### Task 14: Chat Message Endpoint (Worker: Cerebras)
**File:** `api/chat/message.ts`
**Description:** Main API endpoint
**Includes:**
- Authentication
- Input validation
- Rate limiting
- Streaming support (optional)
- Error responses

### Task 15: Chat Page (Worker: Gemini Flash)
**File:** `src/pages/ChatPage.tsx`
**Description:** Dedicated full-page chat
**Includes:**
- Full-screen chat interface
- Sidebar with history
- Mobile responsive
- Route integration

### Task 16: System Prompts (Worker: DeepSeek R1)
**File:** `api/chat/_lib/systemPrompts.ts`
**Description:** Expert system prompts for different modes
**Includes:**
- QA specialist prompt
- Safety officer prompt
- Project manager prompt
- Data analyst prompt
- General assistant prompt

---

## 🔒 Security Requirements

1. **Authentication:** All chat endpoints require valid MSAL token
2. **Rate Limiting:** Max 50 messages per minute per user
3. **Input Sanitization:** Prevent prompt injection
4. **Data Access:** Respect user role permissions
5. **Logging:** Audit trail for all queries
6. **PII Protection:** Don't expose sensitive data in responses

---

## 📊 Knowledge Base Content

### Construction Standards
- Main Roads WA specifications
- Austroads guidelines
- AS/NZS standards
- Company procedures

### SGA-Specific
- ITP templates
- QA procedures
- Safety procedures
- Equipment guides

### System Help
- How to use the app
- Feature documentation
- Troubleshooting guides

---

## 🎨 UI/UX Requirements

1. **Chat bubble style** - WhatsApp/Teams-like
2. **Dark/Light mode** - Follow system theme
3. **Mobile-first** - Works on phones in field
4. **Offline support** - Queue messages when offline
5. **Accessibility** - Screen reader compatible

---

## 📈 Success Metrics

1. **Response Time:** < 3 seconds for simple queries
2. **Accuracy:** > 90% correct answers for data queries
3. **User Satisfaction:** Positive feedback > 80%
4. **Adoption:** > 50% of users try within first week

---

## 🚀 Deployment Plan

### Phase 1: Core Chat (Days 1-3)
- Basic chat UI
- Simple Q&A
- System help

### Phase 2: Data Integration (Days 4-6)
- SharePoint queries
- Job/project lookups
- Basic analytics

### Phase 3: Knowledge Base (Days 7-9)
- Document search
- Spec lookups
- Procedure guidance

### Phase 4: Advanced Features (Days 10-14)
- Draft generation
- Proactive suggestions
- Voice input (optional)

---

## 📝 Notes for AI Workers

1. **Use existing patterns** - Follow the codebase conventions
2. **TypeScript strict mode** - No `any` types
3. **Import extensions** - Use `.js` for API imports
4. **Error handling** - Comprehensive try/catch
5. **Mobile-first** - Test on small screens
6. **Accessibility** - ARIA labels, keyboard nav

---

**Let's build something amazing! 🚀**
