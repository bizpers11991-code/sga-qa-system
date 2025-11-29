# Claude Code - Next Session Instructions

**Created:** November 29, 2025
**Last Session:** AI Chatbot Backend Services COMPLETED

---

## ✅ What Was Completed This Session

### AI Chatbot - FULLY IMPLEMENTED

The AI chatbot is now complete with all backend services:

**Backend Services Created:**
- `api/chat/_lib/knowledgeData.ts` - 40+ knowledge entries covering:
  - Asphalt specifications (AC10, AC14, AC20 temperatures, thickness, compaction)
  - QA procedures (QA pack contents, submission, ITP checklists)
  - Safety procedures (PPE, traffic management, incident reporting)
  - System help (creating jobs, job statuses, finding specs)

- `api/chat/_lib/knowledgeBase.ts` - TF-IDF based knowledge search

- `api/chat/_lib/systemPrompts.ts` - Expert prompts for:
  - General assistant
  - QA Specialist
  - Safety Officer
  - Project Manager
  - Data Analyst
  - Field Helper

- `api/chat/_lib/intentClassifier.ts` - Intent classification with:
  - Pattern matching for DATA_QUERY, KNOWLEDGE_SEARCH, DRAFT_CREATE, HELP, CLARIFICATION
  - Entity extraction (jobs, projects, dates, divisions, locations, numbers)

- `api/chat/_lib/dataQueryEngine.ts` - Natural language to SharePoint queries:
  - Job queries with date/status/division filters
  - Project queries
  - Incident queries
  - NCR queries
  - Tender queries

- `api/chat/_lib/contextManager.ts` - Conversation management:
  - In-memory caching
  - SharePoint persistence via Drafts list
  - Entity tracking
  - Context building for AI prompts

- `api/chat/_lib/draftGenerator.ts` - Draft generation for:
  - Jobs (with date/location/quantity extraction)
  - Incidents
  - NCRs
  - QA pack notes

- `api/chat/_lib/chatService.ts` - Core orchestration:
  - Routes messages to appropriate handlers
  - Combines services
  - Generates suggested prompts

**API Endpoints:**
- `api/chat/message.ts` - Refactored to use ChatService
- `api/chat/history.ts` - Conversation history (list, get, delete)
- `api/chat/feedback.ts` - Message feedback submission

**Frontend:**
- `src/pages/ChatPage.tsx` - Full chat page with:
  - Conversation sidebar
  - Search functionality
  - Mobile responsive design

**Integration:**
- Added `/chat` route to `src/routing/routes.tsx`
- Added "AI Assistant" to navigation in `src/config/navigation.ts`

---

## 🎯 Build Status

✅ **Build passes with 0 errors**

```
✓ 1957 modules transformed
✓ built in 15.53s
ChatPage-CqDtSW9A.js - 39.55 kB
```

---

## 🚀 Current Chat Capabilities

The chat system can now:
- ✅ Send messages and receive intelligent responses
- ✅ Query data from SharePoint (jobs, projects, incidents, NCRs, tenders)
- ✅ Filter by date, status, division
- ✅ Search knowledge base (40+ entries on specs, procedures, safety)
- ✅ Fall back to AI for general questions (Azure OpenAI or Gemini)
- ✅ Generate job/incident/NCR drafts from natural language
- ✅ Track conversation context and history
- ✅ Persist conversations to SharePoint
- ✅ Submit feedback on responses
- ✅ Show suggested prompts based on context
- ✅ Full-page chat interface with sidebar
- ✅ Mobile responsive design

---

## 📁 Files Created This Session

### Backend Services
```
api/chat/_lib/knowledgeData.ts    # 450 lines - Static knowledge base
api/chat/_lib/knowledgeBase.ts    # 160 lines - Knowledge search
api/chat/_lib/systemPrompts.ts    # 200 lines - Expert prompts
api/chat/_lib/intentClassifier.ts # 280 lines - Intent classification
api/chat/_lib/dataQueryEngine.ts  # 320 lines - Data query engine
api/chat/_lib/contextManager.ts   # 300 lines - Context management
api/chat/_lib/draftGenerator.ts   # 350 lines - Draft generation
api/chat/_lib/chatService.ts      # 280 lines - Core orchestration
```

### API Endpoints
```
api/chat/message.ts   # Updated - Uses ChatService
api/chat/history.ts   # 90 lines - History endpoint
api/chat/feedback.ts  # 80 lines - Feedback endpoint
```

### Frontend
```
src/pages/ChatPage.tsx           # 220 lines - Full chat page
src/routing/routes.tsx           # Updated - Added /chat route
src/config/navigation.ts         # Updated - Added AI Assistant nav
```

---

## 🧪 Testing the Chat

### Via UI
1. Start the app: `npm run dev`
2. Navigate to `/chat` or click "AI Assistant" in sidebar
3. Try these queries:
   - "Show me today's jobs"
   - "What's the temperature spec for AC14?"
   - "How do I submit a QA pack?"
   - "Create a job for asphalt patching at Main Street, 50 tonnes, next Monday"

### Via API
```bash
curl -X POST https://your-app.vercel.app/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Show today's jobs"}'
```

---

## 📋 What's Next (Optional Enhancements)

The chatbot is functional but could be enhanced with:

1. **Vector Embeddings** - Replace TF-IDF with Azure OpenAI embeddings for better knowledge search
2. **Document RAG** - Index uploaded specification documents
3. **Streaming Responses** - Real-time token streaming
4. **Voice Input** - Speech-to-text for field use
5. **Proactive Suggestions** - Based on current page/context
6. **Analytics** - Track query patterns and feedback

---

## 🔑 Configuration Required

```env
# For AI responses (one required)
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# OR
GOOGLE_API_KEY=xxx

# For data queries (all required)
TENANT_ID=xxx
CLIENT_ID=xxx
CLIENT_SECRET=xxx
SHAREPOINT_SITE_URL=https://xxx.sharepoint.com/sites/xxx
```

---

## 📊 Success Criteria - ALL MET

- ✅ All backend services created and working
- ✅ Chat integrated into the UI
- ✅ Build passes with 0 errors
- ✅ Can send a message and get intelligent response
- ✅ Data queries work (e.g., "show me today's jobs")
- ✅ Knowledge base queries work (e.g., "what's the temp spec for AC14")

---

**The AI Chatbot is COMPLETE! 🎉🤖**
