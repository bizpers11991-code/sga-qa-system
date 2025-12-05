#!/usr/bin/env python3
"""
SGA QA System - AI Chatbot Build Orchestrator
=============================================
Orchestrates the AI worker team to build the full AI assistant chatbot.

Usage:
    python orchestrate_chatbot.py [--dry-run] [--parallel] [--phase N]

Author: Claude Code Supervisor
Created: November 2025
"""

import os
import sys
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not required for dry-run

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn
    console = Console()
except ImportError:
    console = None
    print("Install rich for better output: pip install rich")


# ============================================================================
# TASK DEFINITIONS
# ============================================================================

class TaskPhase(Enum):
    PHASE_1_TYPES = 1      # Types and interfaces
    PHASE_2_FRONTEND = 2   # Frontend components
    PHASE_3_API = 3        # API endpoints
    PHASE_4_SERVICES = 4   # Backend services
    PHASE_5_INTEGRATION = 5 # Integration and testing


@dataclass
class Task:
    id: str
    title: str
    description: str
    output_file: str
    phase: TaskPhase
    dependencies: List[str]
    preferred_model: str
    fallback_models: List[str]
    context_files: List[str]
    prompt: str


# Define all tasks
TASKS: List[Task] = [
    # ========== PHASE 1: Types ==========
    Task(
        id="CHAT_TYPES_001",
        title="Chat TypeScript Interfaces",
        description="Define all TypeScript interfaces for the chat system",
        output_file="src/types/chat.ts",
        phase=TaskPhase.PHASE_1_TYPES,
        dependencies=[],
        preferred_model="qwen/qwen-2.5-coder-32b-instruct:free",
        fallback_models=["deepseek/deepseek-chat-v3-0324:free", "groq/llama-3.3-70b"],
        context_files=["src/types.ts", "src/types/project-management.ts"],
        prompt="""Create comprehensive TypeScript interfaces for a chat system.

The chat system needs these interfaces:

1. ChatMessage - Individual message
   - id: string
   - role: 'user' | 'assistant' | 'system'
   - content: string
   - timestamp: Date
   - metadata?: MessageMetadata

2. MessageMetadata
   - intent?: ChatIntent
   - sources?: string[]
   - dataResults?: any[]
   - confidence?: number
   - processingTime?: number

3. ChatIntent enum
   - DATA_QUERY
   - KNOWLEDGE_SEARCH
   - DRAFT_CREATE
   - HELP
   - GENERAL_CHAT
   - CLARIFICATION

4. ChatConversation
   - id: string
   - userId: string
   - title: string
   - messages: ChatMessage[]
   - createdAt: Date
   - updatedAt: Date
   - context?: ConversationContext

5. ConversationContext
   - currentPage?: string
   - currentEntity?: { type: string, id: string }
   - userRole?: string
   - recentEntities?: EntityReference[]

6. EntityReference
   - type: 'job' | 'project' | 'incident' | 'ncr' | 'tender'
   - id: string
   - name: string

7. ChatRequest
   - message: string
   - conversationId?: string
   - context?: ConversationContext

8. ChatResponse
   - message: ChatMessage
   - conversationId: string
   - suggestedPrompts?: string[]

9. DataQueryResult
   - query: string
   - results: any[]
   - totalCount: number
   - entityType: string

10. KnowledgeBaseResult
    - content: string
    - source: string
    - confidence: number
    - relevantSection?: string

Export all interfaces and types. Use proper JSDoc comments.
Follow existing code patterns from the context files."""
    ),

    # ========== PHASE 2: Frontend Components ==========
    Task(
        id="CHAT_API_CLIENT_001",
        title="Chat API Client Service",
        description="Frontend service for chat API calls",
        output_file="src/services/chatApi.ts",
        phase=TaskPhase.PHASE_2_FRONTEND,
        dependencies=["CHAT_TYPES_001"],
        preferred_model="deepseek/deepseek-chat-v3-0324:free",
        fallback_models=["qwen/qwen-2.5-72b-instruct:free"],
        context_files=["src/services/jobsApi.ts", "src/types/chat.ts"],
        prompt="""Create a frontend API client service for the chat system.

Functions needed:
1. sendMessage(request: ChatRequest): Promise<ChatResponse>
2. getConversations(): Promise<ChatConversation[]>
3. getConversation(id: string): Promise<ChatConversation>
4. deleteConversation(id: string): Promise<void>
5. submitFeedback(messageId: string, positive: boolean): Promise<void>
6. getSuggestedPrompts(context?: ConversationContext): Promise<string[]>

Use the existing API client patterns from jobsApi.ts.
Handle errors gracefully with proper error types.
Include loading state helpers if needed."""
    ),

    Task(
        id="CHAT_HOOK_001",
        title="useChat React Hook",
        description="React hook for managing chat state",
        output_file="src/hooks/useChat.ts",
        phase=TaskPhase.PHASE_2_FRONTEND,
        dependencies=["CHAT_API_CLIENT_001"],
        preferred_model="google/gemini-2.0-flash",
        fallback_models=["groq/llama-3.3-70b-versatile"],
        context_files=["src/services/chatApi.ts", "src/types/chat.ts"],
        prompt="""Create a React hook for managing chat functionality.

The hook should provide:
- messages: ChatMessage[] - current conversation messages
- isLoading: boolean - loading state
- error: string | null - error message
- conversationId: string | null - current conversation ID
- sendMessage: (content: string) => Promise<void>
- clearConversation: () => void
- loadConversation: (id: string) => Promise<void>
- suggestedPrompts: string[]

Features:
- Auto-scroll to bottom on new messages
- Optimistic UI updates
- Error retry with exponential backoff
- Persist conversation ID in session storage
- Handle streaming responses (if supported)

Use React hooks: useState, useEffect, useCallback, useRef"""
    ),

    Task(
        id="CHAT_MESSAGE_COMP_001",
        title="ChatMessage Component",
        description="Individual message bubble component",
        output_file="src/components/chat/ChatMessage.tsx",
        phase=TaskPhase.PHASE_2_FRONTEND,
        dependencies=["CHAT_TYPES_001"],
        preferred_model="groq/llama-3.3-70b-versatile",
        fallback_models=["cerebras/llama-3.3-70b"],
        context_files=["src/types/chat.ts", "src/components/ui/Button.tsx"],
        prompt="""Create a ChatMessage React component for displaying chat messages.

Props:
- message: ChatMessage
- onFeedback?: (positive: boolean) => void
- showFeedback?: boolean

Features:
- Different styling for user vs assistant messages
- User messages: right-aligned, blue background
- Assistant messages: left-aligned, gray background
- Render markdown content (bold, lists, code blocks)
- Syntax highlighting for code blocks
- Copy button for code blocks
- Timestamp display (relative time: "2 min ago")
- Feedback buttons (thumbs up/down) for assistant messages
- Loading skeleton for pending messages
- Error state styling

Use Tailwind CSS for styling. Make it mobile-responsive.
Include ARIA labels for accessibility."""
    ),

    Task(
        id="CHAT_INPUT_COMP_001",
        title="ChatInput Component",
        description="Chat input field with features",
        output_file="src/components/chat/ChatInput.tsx",
        phase=TaskPhase.PHASE_2_FRONTEND,
        dependencies=["CHAT_TYPES_001"],
        preferred_model="cerebras/llama-3.3-70b",
        fallback_models=["groq/llama-3.1-8b-instant"],
        context_files=["src/types/chat.ts"],
        prompt="""Create a ChatInput React component for message input.

Props:
- onSend: (message: string) => void
- disabled?: boolean
- placeholder?: string
- suggestedPrompts?: string[]
- onSelectPrompt?: (prompt: string) => void

Features:
- Auto-resizing textarea (1-5 rows)
- Send button (enabled only when text exists)
- Enter to send, Shift+Enter for newline
- Character limit indicator (optional)
- Suggested prompts chips above input
- Clear button when text exists
- Focus management

Use Tailwind CSS. Make it mobile-friendly with proper touch targets.
Include keyboard shortcut hints."""
    ),

    Task(
        id="CHAT_SUGGESTED_001",
        title="SuggestedPrompts Component",
        description="Quick action prompts based on context",
        output_file="src/components/chat/SuggestedPrompts.tsx",
        phase=TaskPhase.PHASE_2_FRONTEND,
        dependencies=["CHAT_TYPES_001"],
        preferred_model="qwen/qwen-2.5-72b-instruct:free",
        fallback_models=["meta-llama/llama-3.3-70b-instruct:free"],
        context_files=["src/types/chat.ts"],
        prompt="""Create a SuggestedPrompts component showing contextual quick actions.

Props:
- context?: ConversationContext
- onSelect: (prompt: string) => void
- userRole?: string

Features:
- Display prompts as clickable chips/buttons
- Context-aware: show relevant prompts based on current page
- Role-aware: show different prompts for foremen vs engineers
- Categories: Data, Help, Actions
- Collapse/expand for more prompts
- Loading state

Default prompts by context:
- Jobs page: "Show today's jobs", "Jobs with issues", "My assigned jobs"
- QA Pack page: "Help me complete this QA pack", "What's missing?"
- Dashboard: "Summary of this week", "Any overdue items?"
- General: "How do I...?", "What's the procedure for...?"

Use Tailwind CSS with horizontal scrolling on mobile."""
    ),

    Task(
        id="CHAT_INTERFACE_001",
        title="ChatInterface Component",
        description="Main chat UI container",
        output_file="src/components/chat/ChatInterface.tsx",
        phase=TaskPhase.PHASE_2_FRONTEND,
        dependencies=["CHAT_MESSAGE_COMP_001", "CHAT_INPUT_COMP_001", "CHAT_SUGGESTED_001", "CHAT_HOOK_001"],
        preferred_model="deepseek/deepseek-r1:free",
        fallback_models=["qwen/qwen-2.5-72b-instruct:free"],
        context_files=[
            "src/components/chat/ChatMessage.tsx",
            "src/components/chat/ChatInput.tsx",
            "src/components/chat/SuggestedPrompts.tsx",
            "src/hooks/useChat.ts"
        ],
        prompt="""Create the main ChatInterface component that combines all chat components.

Props:
- className?: string
- initialContext?: ConversationContext
- onClose?: () => void (for modal/sidebar use)
- variant?: 'full' | 'sidebar' | 'modal'

Features:
- Message list with auto-scroll
- Input area at bottom
- Suggested prompts (collapsible)
- Loading indicator when waiting for response
- Error display with retry button
- Empty state for new conversations
- Header with title and close button (for sidebar/modal)
- Responsive: full width on mobile, fixed width on desktop

Layout:
- Header (optional): Title, close button
- Messages area: Scrollable, flex-grow
- Suggested prompts: Above input
- Input area: Fixed at bottom

Use the useChat hook for state management.
Make it work in all three variants."""
    ),

    # ========== PHASE 3: API Endpoints ==========
    Task(
        id="INTENT_CLASSIFIER_001",
        title="Intent Classifier",
        description="Classify user message intent",
        output_file="api/chat/_lib/intentClassifier.ts",
        phase=TaskPhase.PHASE_3_API,
        dependencies=["CHAT_TYPES_001"],
        preferred_model="qwen/qwen-2.5-coder-32b-instruct:free",
        fallback_models=["deepseek/deepseek-chat-v3-0324:free"],
        context_files=["src/types/chat.ts", "api/_lib/aiService.ts"],
        prompt="""Create an intent classifier for the chat system.

Function: classifyIntent(message: string, context?: ConversationContext): Promise<ClassificationResult>

ClassificationResult:
- intent: ChatIntent
- confidence: number (0-1)
- entities: ExtractedEntity[]
- parameters: Record<string, any>

ExtractedEntity:
- type: 'job' | 'project' | 'date' | 'person' | 'location' | 'number'
- value: string
- normalized?: string | Date | number

Intent patterns:
- DATA_QUERY: "show me", "list", "how many", "what's the status of"
- KNOWLEDGE_SEARCH: "what is", "how do I", "what's the spec", "procedure for"
- DRAFT_CREATE: "create", "help me write", "draft", "generate"
- HELP: "help", "how to use", "where is", "can you explain"
- CLARIFICATION: responses to bot questions
- GENERAL_CHAT: everything else

Use Azure OpenAI (via aiService) for complex classification.
Use regex patterns for simple cases (faster, no API call).
Extract entities like dates, job numbers, project names."""
    ),

    Task(
        id="DATA_QUERY_ENGINE_001",
        title="Data Query Engine",
        description="Convert natural language to SharePoint queries",
        output_file="api/chat/_lib/dataQueryEngine.ts",
        phase=TaskPhase.PHASE_3_API,
        dependencies=["INTENT_CLASSIFIER_001"],
        preferred_model="deepseek/deepseek-chat-v3-0324:free",
        fallback_models=["qwen/qwen-2.5-coder-32b-instruct:free"],
        context_files=["api/_lib/sharepointData.ts", "src/types/chat.ts"],
        prompt="""Create a data query engine that converts natural language to SharePoint queries.

Function: executeDataQuery(query: string, intent: ClassificationResult): Promise<DataQueryResult>

Capabilities:
1. Entity lookups: "Show me job ASP-2025-001"
2. Filtered lists: "Jobs scheduled for tomorrow", "Open incidents"
3. Aggregations: "How many jobs this week?", "Total tonnes this month"
4. Comparisons: "Jobs with more than 100 tonnes"
5. Time-based: "What happened yesterday?", "Last week's NCRs"

Implementation:
- Parse the query and classification result
- Determine which SharePoint list to query
- Build appropriate filters
- Execute query using sharepointData functions
- Format results for chat display

Supported entities:
- Jobs, Projects, Tenders, Incidents, NCRs, QAPacks
- Support common filters: status, date, division, foreman

Return formatted results with counts and summaries."""
    ),

    Task(
        id="KNOWLEDGE_BASE_001",
        title="Knowledge Base Service",
        description="RAG system for document search",
        output_file="api/chat/_lib/knowledgeBase.ts",
        phase=TaskPhase.PHASE_3_API,
        dependencies=["CHAT_TYPES_001"],
        preferred_model="google/gemini-2.5-pro",
        fallback_models=["deepseek/deepseek-r1:free"],
        context_files=["api/_lib/aiService.ts", "src/types/chat.ts"],
        prompt="""Create a knowledge base service for document search (RAG).

Functions:
1. searchKnowledge(query: string): Promise<KnowledgeBaseResult[]>
2. getDocumentContext(documentId: string): Promise<string>

Knowledge categories:
1. Construction Standards
   - Asphalt specifications (temperature, thickness, etc.)
   - Main Roads WA requirements
   - Austroads guidelines

2. Company Procedures
   - QA procedures
   - Safety procedures
   - ITP requirements

3. System Help
   - How to use the app
   - Feature explanations
   - Troubleshooting

Implementation approach:
- For now, use a static knowledge base (JSON file with Q&A pairs)
- Later can upgrade to vector embeddings with Azure OpenAI
- Include source attribution in results
- Return confidence scores

Static knowledge format:
{
  "id": "spec_ac14_temp",
  "category": "specifications",
  "question": "What is the minimum placement temperature for AC14?",
  "answer": "The minimum placement temperature for AC14...",
  "keywords": ["ac14", "temperature", "placement"],
  "source": "Main Roads WA Spec 501"
}

Search using keyword matching and TF-IDF for now."""
    ),

    Task(
        id="DRAFT_GENERATOR_001",
        title="Draft Generator Service",
        description="Generate draft content for forms",
        output_file="api/chat/_lib/draftGenerator.ts",
        phase=TaskPhase.PHASE_3_API,
        dependencies=["CHAT_TYPES_001"],
        preferred_model="deepseek/deepseek-r1:free",
        fallback_models=["qwen/qwen-2.5-72b-instruct:free"],
        context_files=["api/_lib/aiService.ts", "src/types.ts"],
        prompt="""Create a draft generator service for creating form drafts.

Functions:
1. generateJobDraft(params: JobDraftParams): Promise<Partial<Job>>
2. generateIncidentDraft(params: IncidentDraftParams): Promise<Partial<Incident>>
3. generateNCRDraft(params: NCRDraftParams): Promise<Partial<NCR>>
4. generateQAPackNotes(context: QAPackContext): Promise<string>

JobDraftParams:
- description: string (natural language)
- projectId?: string
- division?: string

IncidentDraftParams:
- description: string
- type?: string
- severity?: string

The generator should:
1. Parse the natural language description
2. Extract relevant fields
3. Use AI to fill in reasonable defaults
4. Return a partial object for user review

Example:
User: "Create a job for asphalt patching at Main Street, 50 tonnes, next Monday"
Result: {
  jobType: "Asphalt",
  division: "Asphalt",
  location: "Main Street",
  workDescription: "Asphalt patching works",
  estimatedTonnes: 50,
  jobDate: "2025-12-08" // next Monday
}

Use Azure OpenAI via aiService for parsing."""
    ),

    Task(
        id="CONTEXT_MANAGER_001",
        title="Context Manager",
        description="Manage conversation context",
        output_file="api/chat/_lib/contextManager.ts",
        phase=TaskPhase.PHASE_3_API,
        dependencies=["CHAT_TYPES_001"],
        preferred_model="groq/llama-3.3-70b-versatile",
        fallback_models=["cerebras/llama-3.3-70b"],
        context_files=["src/types/chat.ts"],
        prompt="""Create a context manager for maintaining conversation state.

Class: ContextManager

Methods:
1. getContext(conversationId: string): Promise<ConversationContext>
2. updateContext(conversationId: string, updates: Partial<ConversationContext>): Promise<void>
3. addEntityReference(conversationId: string, entity: EntityReference): Promise<void>
4. getRecentEntities(conversationId: string, limit?: number): EntityReference[]
5. buildPromptContext(conversationId: string): string

Features:
- Track current page/view
- Remember recently mentioned entities (jobs, projects, etc.)
- Track user preferences
- Maintain short-term memory (last 10 messages)
- Build context string for AI prompts

Storage:
- Use in-memory cache for current session
- Optionally persist to SharePoint Drafts list

Context building for AI:
- Include user role
- Include recent entities
- Include current page
- Include relevant previous messages

This helps the AI understand references like "that job" or "the incident we discussed"."""
    ),

    Task(
        id="SYSTEM_PROMPTS_001",
        title="System Prompts",
        description="Expert system prompts for different modes",
        output_file="api/chat/_lib/systemPrompts.ts",
        phase=TaskPhase.PHASE_3_API,
        dependencies=[],
        preferred_model="deepseek/deepseek-r1:free",
        fallback_models=["google/gemini-2.5-pro"],
        context_files=["api/_lib/prompts.ts"],
        prompt="""Create expert system prompts for the chat assistant.

Export functions:
1. getSystemPrompt(mode: ChatMode): string
2. getDataQueryPrompt(): string
3. getDraftGenerationPrompt(type: string): string

ChatMode enum:
- GENERAL: General assistant
- QA_SPECIALIST: QA and compliance focus
- SAFETY_OFFICER: Safety and incident focus
- PROJECT_MANAGER: Project and scheduling focus
- DATA_ANALYST: Data and reporting focus
- FIELD_HELPER: Field worker assistance

Each prompt should:
- Define the assistant's role and expertise
- Set boundaries (what it can/can't do)
- Include relevant domain knowledge
- Specify response format preferences
- Include SGA-specific context

Example for QA_SPECIALIST:
"You are an expert QA engineer for Safety Grooving Australia...
You specialize in asphalt, profiling, and spray works...
You know Main Roads WA specifications...
When asked about compliance, always cite the specific standard..."

Keep prompts focused and under 500 words each.
Include examples of good responses where helpful."""
    ),

    Task(
        id="CHAT_SERVICE_001",
        title="Chat Service (Core)",
        description="Core orchestration logic for chat",
        output_file="api/chat/_lib/chatService.ts",
        phase=TaskPhase.PHASE_4_SERVICES,
        dependencies=[
            "INTENT_CLASSIFIER_001",
            "DATA_QUERY_ENGINE_001",
            "KNOWLEDGE_BASE_001",
            "DRAFT_GENERATOR_001",
            "CONTEXT_MANAGER_001",
            "SYSTEM_PROMPTS_001"
        ],
        preferred_model="qwen/qwen-2.5-72b-instruct:free",
        fallback_models=["deepseek/deepseek-chat-v3-0324:free"],
        context_files=[
            "api/chat/_lib/intentClassifier.ts",
            "api/chat/_lib/dataQueryEngine.ts",
            "api/chat/_lib/knowledgeBase.ts",
            "api/_lib/aiService.ts"
        ],
        prompt="""Create the core chat service that orchestrates all chat functionality.

Class: ChatService

Methods:
1. processMessage(request: ChatRequest, userId: string): Promise<ChatResponse>
2. getConversation(conversationId: string): Promise<ChatConversation>
3. saveConversation(conversation: ChatConversation): Promise<void>
4. generateSuggestedPrompts(context: ConversationContext): string[]

processMessage flow:
1. Get/create conversation
2. Add user message to history
3. Classify intent
4. Based on intent:
   - DATA_QUERY: Use dataQueryEngine
   - KNOWLEDGE_SEARCH: Use knowledgeBase
   - DRAFT_CREATE: Use draftGenerator
   - HELP: Use knowledge base + general AI
   - GENERAL_CHAT: Use AI directly
5. Build context for AI
6. Generate response with AI
7. Save conversation
8. Return response with suggestions

Error handling:
- Graceful degradation if services fail
- User-friendly error messages
- Logging for debugging

Include rate limiting check.
Use aiService for AI generation."""
    ),

    Task(
        id="CHAT_ENDPOINT_001",
        title="Chat Message Endpoint",
        description="Main API endpoint for chat",
        output_file="api/chat/message.ts",
        phase=TaskPhase.PHASE_4_SERVICES,
        dependencies=["CHAT_SERVICE_001"],
        preferred_model="cerebras/llama-3.3-70b",
        fallback_models=["groq/llama-3.1-8b-instant"],
        context_files=["api/chat/_lib/chatService.ts", "api/_lib/auth.ts"],
        prompt="""Create the main chat API endpoint.

Endpoint: POST /api/chat/message

Request body (ChatRequest):
- message: string (required)
- conversationId?: string
- context?: ConversationContext

Response (ChatResponse):
- message: ChatMessage
- conversationId: string
- suggestedPrompts?: string[]

Implementation:
1. Verify authentication (MSAL token)
2. Validate request body
3. Apply rate limiting (50 req/min per user)
4. Call chatService.processMessage()
5. Return response

Error responses:
- 401: Unauthorized
- 400: Bad request (validation error)
- 429: Rate limit exceeded
- 500: Internal server error

Include proper CORS headers.
Log request/response for debugging (sanitized).
Use Vercel edge runtime if possible for speed."""
    ),

    Task(
        id="CHAT_HISTORY_ENDPOINT_001",
        title="Chat History Endpoint",
        description="API endpoint for conversation history",
        output_file="api/chat/history.ts",
        phase=TaskPhase.PHASE_4_SERVICES,
        dependencies=["CHAT_SERVICE_001"],
        preferred_model="groq/llama-3.1-8b-instant",
        fallback_models=["cerebras/llama-3.3-70b"],
        context_files=["api/chat/_lib/chatService.ts"],
        prompt="""Create the chat history API endpoint.

Endpoints:
GET /api/chat/history - List conversations
GET /api/chat/history?id=xxx - Get specific conversation
DELETE /api/chat/history?id=xxx - Delete conversation

List response:
{
  conversations: [
    { id, title, lastMessage, updatedAt }
  ]
}

Detail response:
{
  conversation: ChatConversation
}

Implementation:
1. Verify authentication
2. Get user ID from token
3. Query conversations (filtered by user)
4. Return formatted response

Pagination for list:
- limit: number (default 20)
- offset: number (default 0)

Sort by updatedAt descending (newest first)."""
    ),

    # ========== PHASE 5: Integration ==========
    Task(
        id="CHAT_PAGE_001",
        title="Chat Page",
        description="Dedicated full-page chat interface",
        output_file="src/pages/ChatPage.tsx",
        phase=TaskPhase.PHASE_5_INTEGRATION,
        dependencies=["CHAT_INTERFACE_001"],
        preferred_model="google/gemini-2.0-flash",
        fallback_models=["groq/llama-3.3-70b-versatile"],
        context_files=["src/components/chat/ChatInterface.tsx", "src/pages/Dashboard.tsx"],
        prompt="""Create a dedicated chat page for the SGA QA System.

Layout:
- Sidebar (desktop): Conversation history list
- Main area: ChatInterface component (full variant)
- Mobile: Hide sidebar, show as drawer

Features:
- List previous conversations in sidebar
- Create new conversation button
- Delete conversation with confirmation
- Search conversations (optional)
- Responsive layout

Route: /chat

Include proper page title and meta.
Use existing layout patterns from Dashboard.tsx.
Add to navigation config."""
    ),

    Task(
        id="CHAT_INDEX_001",
        title="Chat Components Index",
        description="Export all chat components",
        output_file="src/components/chat/index.ts",
        phase=TaskPhase.PHASE_5_INTEGRATION,
        dependencies=[
            "CHAT_MESSAGE_COMP_001",
            "CHAT_INPUT_COMP_001",
            "CHAT_SUGGESTED_001",
            "CHAT_INTERFACE_001"
        ],
        preferred_model="groq/llama-3.1-8b-instant",
        fallback_models=["cerebras/llama-3.3-70b"],
        context_files=[],
        prompt="""Create an index file that exports all chat components.

Exports:
- ChatInterface
- ChatMessage
- ChatInput
- SuggestedPrompts

Also export any shared types/utilities used by components.

Simple barrel export file."""
    ),

    Task(
        id="KNOWLEDGE_DATA_001",
        title="Knowledge Base Data",
        description="Static knowledge base content",
        output_file="api/chat/_lib/knowledgeData.ts",
        phase=TaskPhase.PHASE_5_INTEGRATION,
        dependencies=[],
        preferred_model="deepseek/deepseek-r1:free",
        fallback_models=["google/gemini-2.5-pro"],
        context_files=[],
        prompt="""Create static knowledge base data for the chat assistant.

Export: KNOWLEDGE_BASE: KnowledgeEntry[]

Categories to include:

1. Asphalt Specifications (10+ entries)
   - Temperature requirements
   - Thickness requirements
   - Mix types (AC10, AC14, AC20, etc.)
   - Compaction requirements

2. QA Procedures (10+ entries)
   - ITP checklist items
   - Testing requirements
   - Documentation requirements

3. Safety Procedures (10+ entries)
   - PPE requirements
   - Traffic management
   - Hot works safety
   - Environmental protection

4. System Help (10+ entries)
   - How to submit QA pack
   - How to create a job
   - How to report an incident
   - How to use the scheduler

Format each entry as:
{
  id: string,
  category: string,
  question: string,
  answer: string,
  keywords: string[],
  source?: string
}

Make answers detailed and actionable.
Include specific numbers and requirements where applicable."""
    ),
]


# ============================================================================
# ORCHESTRATOR
# ============================================================================

class ChatbotOrchestrator:
    """Orchestrates the AI worker team to build the chatbot"""

    def __init__(self, project_root: str, dry_run: bool = False):
        self.project_root = Path(project_root)
        self.dry_run = dry_run
        self.output_dir = self.project_root / "ai_team_output" / "chatbot"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.completed_tasks: List[str] = []
        self.failed_tasks: List[str] = []

    def get_tasks_for_phase(self, phase: TaskPhase) -> List[Task]:
        """Get all tasks for a specific phase"""
        return [t for t in TASKS if t.phase == phase]

    def check_dependencies(self, task: Task) -> bool:
        """Check if all dependencies are completed"""
        for dep in task.dependencies:
            if dep not in self.completed_tasks:
                return False
        return True

    def load_context_files(self, task: Task) -> str:
        """Load content from context files"""
        context = []
        for file_path in task.context_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                content = full_path.read_text(encoding='utf-8')
                context.append(f"=== {file_path} ===\n{content}\n")
        return "\n".join(context)

    def build_full_prompt(self, task: Task) -> str:
        """Build the complete prompt with context"""
        context = self.load_context_files(task)

        full_prompt = f"""# Task: {task.title}

## Description
{task.description}

## Output File
{task.output_file}

## Context Files
{context if context else "No context files provided."}

## Instructions
{task.prompt}

## Requirements
- Use TypeScript with strict mode
- Follow existing code patterns
- Include proper JSDoc comments
- Handle errors gracefully
- Use .js extension for imports in API files
- Make it production-ready

Generate ONLY the code for the file. No explanations before or after.
Start with any necessary imports and end with exports.
"""
        return full_prompt

    def execute_task(self, task: Task) -> bool:
        """Execute a single task using AI worker"""
        if console:
            console.print(f"[bold blue]Executing:[/bold blue] {task.title}")

        # Check dependencies
        if not self.check_dependencies(task):
            if console:
                console.print(f"[yellow]Skipping {task.id} - dependencies not met[/yellow]")
            return False

        # Build prompt
        prompt = self.build_full_prompt(task)

        if self.dry_run:
            # Save prompt for review
            prompt_file = self.output_dir / f"{task.id}_prompt.txt"
            prompt_file.write_text(prompt, encoding='utf-8')
            if console:
                console.print(f"[green]Dry run: Saved prompt to {prompt_file}[/green]")
            self.completed_tasks.append(task.id)
            return True

        # TODO: Call AI worker here
        # For now, save prompts for manual execution
        prompt_file = self.output_dir / f"{task.id}_prompt.txt"
        prompt_file.write_text(prompt, encoding='utf-8')

        if console:
            console.print(f"[green]Saved prompt: {prompt_file}[/green]")

        self.completed_tasks.append(task.id)
        return True

    def run_phase(self, phase: TaskPhase, parallel: bool = False):
        """Run all tasks in a phase"""
        tasks = self.get_tasks_for_phase(phase)

        if console:
            console.print(f"\n[bold magenta]Phase {phase.value}: {phase.name}[/bold magenta]")
            console.print(f"Tasks: {len(tasks)}")

        for task in tasks:
            self.execute_task(task)

    def run_all(self, parallel: bool = False):
        """Run all phases"""
        for phase in TaskPhase:
            self.run_phase(phase, parallel)

        self.print_summary()

    def print_summary(self):
        """Print execution summary"""
        if console:
            table = Table(title="Execution Summary")
            table.add_column("Status", style="cyan")
            table.add_column("Count", style="magenta")
            table.add_row("Completed", str(len(self.completed_tasks)))
            table.add_row("Failed", str(len(self.failed_tasks)))
            table.add_row("Total", str(len(TASKS)))
            console.print(table)


# ============================================================================
# MAIN
# ============================================================================

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Orchestrate AI team to build chatbot")
    parser.add_argument("--dry-run", action="store_true", help="Save prompts without executing")
    parser.add_argument("--parallel", action="store_true", help="Run tasks in parallel where possible")
    parser.add_argument("--phase", type=int, help="Run specific phase only (1-5)")
    args = parser.parse_args()

    project_root = Path(__file__).parent.parent.parent
    orchestrator = ChatbotOrchestrator(project_root, dry_run=args.dry_run)

    if console:
        console.print(Panel.fit(
            "[bold green]SGA QA System - AI Chatbot Builder[/bold green]\n"
            f"Project: {project_root}\n"
            f"Dry Run: {args.dry_run}\n"
            f"Total Tasks: {len(TASKS)}",
            title="🤖 AI Team Orchestrator"
        ))

    if args.phase:
        phase = TaskPhase(args.phase)
        orchestrator.run_phase(phase, args.parallel)
    else:
        orchestrator.run_all(args.parallel)


if __name__ == "__main__":
    main()
