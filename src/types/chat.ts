/**
 * Chat System Types
 * 
 * TypeScript interfaces and types for the SGA QA System AI Chat Assistant.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Chat intent classification
 */
export enum ChatIntent {
  /** Querying data (jobs, projects, etc.) */
  DATA_QUERY = 'DATA_QUERY',
  /** Searching knowledge base / specs */
  KNOWLEDGE_SEARCH = 'KNOWLEDGE_SEARCH',
  /** Creating drafts (jobs, incidents, etc.) */
  DRAFT_CREATE = 'DRAFT_CREATE',
  /** Help with using the system */
  HELP = 'HELP',
  /** General conversation */
  GENERAL_CHAT = 'GENERAL_CHAT',
  /** Clarifying previous response */
  CLARIFICATION = 'CLARIFICATION',
}

/**
 * Entity types that can be referenced in chat
 */
export type EntityType = 'job' | 'project' | 'incident' | 'ncr' | 'tender' | 'qapack' | 'foreman';

/**
 * Chat assistant mode
 */
export enum ChatMode {
  GENERAL = 'GENERAL',
  QA_SPECIALIST = 'QA_SPECIALIST',
  SAFETY_OFFICER = 'SAFETY_OFFICER',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  DATA_ANALYST = 'DATA_ANALYST',
  FIELD_HELPER = 'FIELD_HELPER',
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * Metadata attached to a chat message
 */
export interface MessageMetadata {
  /** Classified intent */
  intent?: ChatIntent;
  /** Sources used to generate response */
  sources?: string[];
  /** Data query results (if applicable) */
  dataResults?: DataQueryResult[];
  /** Confidence score (0-1) */
  confidence?: number;
  /** Processing time in ms */
  processingTime?: number;
  /** Knowledge base results */
  knowledgeResults?: KnowledgeBaseResult[];
  /** Generated draft (if applicable) */
  draft?: Record<string, any>;
}

/**
 * Individual chat message
 */
export interface ChatMessage {
  /** Unique message ID */
  id: string;
  /** Message role */
  role: 'user' | 'assistant' | 'system';
  /** Message content (may contain markdown) */
  content: string;
  /** Timestamp */
  timestamp: Date;
  /** Additional metadata */
  metadata?: MessageMetadata;
  /** User feedback */
  feedback?: {
    positive?: boolean;
    timestamp?: Date;
  };
}

// ============================================================================
// CONVERSATION TYPES
// ============================================================================

/**
 * Reference to an entity mentioned in conversation
 */
export interface EntityReference {
  /** Entity type */
  type: EntityType;
  /** Entity ID */
  id: string;
  /** Display name */
  name: string;
  /** When it was mentioned */
  mentionedAt?: Date;
}

/**
 * Conversation context
 */
export interface ConversationContext {
  /** Current page/view in the app */
  currentPage?: string;
  /** Currently viewed entity */
  currentEntity?: {
    type: EntityType;
    id: string;
    name?: string;
  };
  /** User's role */
  userRole?: string;
  /** User's division */
  userDivision?: string;
  /** Recently mentioned entities */
  recentEntities?: EntityReference[];
  /** Chat mode */
  mode?: ChatMode;
}

/**
 * Chat conversation (full history)
 */
export interface ChatConversation {
  /** Unique conversation ID */
  id: string;
  /** User ID (owner) */
  userId: string;
  /** Conversation title (auto-generated or user-set) */
  title: string;
  /** All messages */
  messages: ChatMessage[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Conversation context */
  context?: ConversationContext;
}

/**
 * Conversation summary (for list views)
 */
export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Date;
  messageCount: number;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Chat request (sent to API)
 */
export interface ChatRequest {
  /** User message */
  message: string;
  /** Existing conversation ID (optional) */
  conversationId?: string;
  /** Current context */
  context?: ConversationContext;
}

/**
 * Chat response (from API)
 */
export interface ChatResponse {
  /** Assistant message */
  message: ChatMessage;
  /** Conversation ID */
  conversationId: string;
  /** Suggested follow-up prompts */
  suggestedPrompts?: string[];
}

/**
 * Chat feedback request
 */
export interface ChatFeedbackRequest {
  /** Message ID */
  messageId: string;
  /** Conversation ID */
  conversationId: string;
  /** Positive or negative feedback */
  positive: boolean;
  /** Optional feedback text */
  comment?: string;
}

// ============================================================================
// CLASSIFICATION TYPES
// ============================================================================

/**
 * Extracted entity from user message
 */
export interface ExtractedEntity {
  /** Entity type */
  type: 'job' | 'project' | 'date' | 'person' | 'location' | 'number' | 'division';
  /** Raw value from message */
  value: string;
  /** Normalized value */
  normalized?: string | Date | number;
  /** Start position in message */
  start?: number;
  /** End position in message */
  end?: number;
}

/**
 * Intent classification result
 */
export interface ClassificationResult {
  /** Classified intent */
  intent: ChatIntent;
  /** Confidence score (0-1) */
  confidence: number;
  /** Extracted entities */
  entities: ExtractedEntity[];
  /** Additional parameters */
  parameters: Record<string, any>;
  /** Sub-intent (for more specific routing) */
  subIntent?: string;
}

// ============================================================================
// DATA QUERY TYPES
// ============================================================================

/**
 * Data query result
 */
export interface DataQueryResult {
  /** Original query */
  query: string;
  /** Query results */
  results: any[];
  /** Total count (may be more than returned) */
  totalCount: number;
  /** Entity type queried */
  entityType: EntityType;
  /** Applied filters */
  filters?: Record<string, any>;
  /** Aggregation results (if applicable) */
  aggregations?: Record<string, number>;
}

// ============================================================================
// KNOWLEDGE BASE TYPES
// ============================================================================

/**
 * Knowledge base entry
 */
export interface KnowledgeEntry {
  /** Unique ID */
  id: string;
  /** Category */
  category: 'specifications' | 'procedures' | 'safety' | 'system_help' | 'general';
  /** Question/topic */
  question: string;
  /** Answer/content */
  answer: string;
  /** Search keywords */
  keywords: string[];
  /** Source reference */
  source?: string;
}

/**
 * Knowledge base search result
 */
export interface KnowledgeBaseResult {
  /** Matched entry */
  entry: KnowledgeEntry;
  /** Relevance score (0-1) */
  score: number;
  /** Matched keywords */
  matchedKeywords: string[];
  /** Relevant section/snippet */
  snippet?: string;
}

// ============================================================================
// DRAFT GENERATION TYPES
// ============================================================================

/**
 * Job draft parameters
 */
export interface JobDraftParams {
  /** Natural language description */
  description: string;
  /** Target project ID */
  projectId?: string;
  /** Division */
  division?: 'Asphalt' | 'Profiling' | 'Spray';
  /** Additional hints */
  hints?: Record<string, any>;
}

/**
 * Incident draft parameters
 */
export interface IncidentDraftParams {
  /** Natural language description */
  description: string;
  /** Incident type hint */
  type?: string;
  /** Severity hint */
  severity?: string;
  /** Location */
  location?: string;
}

/**
 * NCR draft parameters
 */
export interface NCRDraftParams {
  /** Natural language description */
  description: string;
  /** Related job ID */
  jobId?: string;
  /** Severity hint */
  severity?: string;
}

// ============================================================================
// SUGGESTED PROMPTS
// ============================================================================

/**
 * Suggested prompt category
 */
export interface PromptCategory {
  /** Category name */
  name: string;
  /** Category icon (lucide icon name) */
  icon: string;
  /** Prompts in this category */
  prompts: string[];
}

/**
 * Suggested prompts by context
 */
export interface SuggestedPromptsConfig {
  /** Default prompts */
  default: string[];
  /** Prompts by page */
  byPage: Record<string, string[]>;
  /** Prompts by role */
  byRole: Record<string, string[]>;
}

// ============================================================================
// HOOK TYPES
// ============================================================================

/**
 * useChat hook return type
 */
export interface UseChatReturn {
  /** Current messages */
  messages: ChatMessage[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Current conversation ID */
  conversationId: string | null;
  /** Send a message */
  sendMessage: (content: string) => Promise<void>;
  /** Clear current conversation */
  clearConversation: () => void;
  /** Load an existing conversation */
  loadConversation: (id: string) => Promise<void>;
  /** Suggested prompts */
  suggestedPrompts: string[];
  /** Submit feedback for a message */
  submitFeedback: (messageId: string, positive: boolean) => Promise<void>;
  /** Retry last failed message */
  retry: () => Promise<void>;
}
