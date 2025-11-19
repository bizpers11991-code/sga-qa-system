/**
 * AI Chat System Type Definitions
 * Comprehensive TypeScript interfaces for the custom AI chat system
 * integrating with Azure OpenAI and Dataverse for construction foreman assistance
 */

/**
 * Individual message in a conversation
 * Represents a single message with role, content, and timestamp
 */
export interface ChatMessage {
  /** The role of the message sender */
  role: 'user' | 'assistant' | 'system';

  /** The content/body of the message */
  content: string;

  /** Timestamp when the message was created */
  timestamp: Date;
}

/**
 * Legacy chat message format (used in conversation history)
 * Maintains backward compatibility with existing request format
 */
export interface ChatMessageHistory {
  /** The role of the message sender */
  role: 'user' | 'assistant' | 'system';

  /** The message content */
  message: string;

  /** Optional ISO string timestamp */
  timestamp?: string;
}

/**
 * Job object from Dataverse
 * Represents a construction job assigned to the foreman
 */
export interface DataverseJob {
  /** Unique job identifier */
  msdyn_jobid: string;

  /** Job name/title */
  msdyn_name: string;

  /** Job number for reference */
  msdyn_jobnumber: string;

  /** Client/customer name */
  msdyn_client?: string;

  /** Job due date */
  msdyn_duedate?: string;

  /** Current job status */
  msdyn_status?: string;

  /** Additional job-related metadata */
  [key: string]: any;
}

/**
 * QA Pack object from Dataverse
 * Represents quality assurance documentation packs
 */
export interface DataverseQAPack {
  /** Unique QA pack identifier */
  sga_qapackid: string;

  /** QA pack name/title */
  sga_name: string;

  /** Associated job number */
  sga_jobnumber: string;

  /** Current status of the QA pack */
  sga_status?: string;

  /** Date the QA pack was submitted */
  sga_submitteddate?: string;

  /** Additional QA pack metadata */
  [key: string]: any;
}

/**
 * Incident object from Dataverse
 * Represents reported issues or incidents on site
 */
export interface DataverseIncident {
  /** Unique incident identifier */
  msdyn_incidentid: string;

  /** Incident name/title */
  msdyn_name: string;

  /** Detailed description of the incident */
  msdyn_description?: string;

  /** Current incident status */
  msdyn_status?: string;

  /** Severity level of the incident */
  msdyn_severity?: string;

  /** Additional incident metadata */
  [key: string]: any;
}

/**
 * User context data from Dataverse
 * Contains all relevant information about the user for AI decision-making
 */
export interface DataverseContext {
  /** Array of jobs assigned to the user */
  userJobs: DataverseJob[];

  /** Array of recent QA packs submitted by the user */
  recentQAPacks: DataverseQAPack[];

  /** Array of pending incidents reported by the user */
  pendingIncidents: DataverseIncident[];
}

/**
 * Incoming request to the AIChat Azure Function
 * Contains the user message, conversation history, and optional context
 */
export interface AIChatRequest {
  /** The user's message/query */
  message: string;

  /** Previous messages in the conversation for context */
  conversationHistory?: ChatMessageHistory[];

  /** User's email address (must match authenticated user) */
  userId: string;

  /** Optional Dataverse context data for the user */
  contextData?: DataverseContext;
}

/**
 * Response metadata from Azure OpenAI
 * Contains information about the API call and token usage
 */
export interface ResponseMetadata {
  /** Total number of tokens used in the request and response */
  tokensUsed: number;

  /** Prompt tokens used for input */
  promptTokens?: number;

  /** Completion tokens used for output */
  completionTokens?: number;

  /** Time taken to process the request in milliseconds */
  duration: number;

  /** Model identifier used for the response */
  model?: string;

  /** Additional metadata about the request */
  [key: string]: any;
}

/**
 * Successful response from AIChat Azure Function
 * Contains the AI-generated response and metadata
 */
export interface AIChatResponse {
  /** The AI-generated response message */
  response: string;

  /** ISO 8601 formatted timestamp of the response */
  timestamp: string;

  /** Metadata about token usage and processing */
  metadata: ResponseMetadata;
}

/**
 * Error response from AIChat Azure Function
 * Returned when a request fails
 */
export interface AIChatErrorResponse {
  /** Error type/code */
  error: string;

  /** Human-readable error message */
  message: string;

  /** Optional additional error details */
  details?: string;
}

/**
 * Rate limiting configuration
 * Controls how often a user can make requests
 */
export interface RateLimitConfig {
  /** Time window in milliseconds for rate limiting */
  windowMs: number;

  /** Maximum number of requests allowed in the time window */
  maxRequests: number;

  /** Optional Redis key prefix for rate limit tracking */
  keyPrefix?: string;
}

/**
 * Result of a rate limit check
 * Indicates whether a request is allowed and provides reset information
 */
export interface RateLimitInfo {
  /** User's email address for identification */
  userId: string;

  /** Number of requests made in the current window */
  requestCount: number;

  /** Start time of the current rate limit window */
  windowStart: Date;

  /** Whether the request is allowed (has not exceeded limit) */
  isAllowed: boolean;

  /** Time remaining in the current window in milliseconds */
  timeRemaining?: number;

  /** When the rate limit will reset */
  resetTime?: Date;

  /** Number of requests remaining before hitting the limit */
  remaining?: number;
}

/**
 * Rate limit result with HTTP response
 * Used internally by the rate limiter
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;

  /** Optional HTTP response for rejected requests (429 status) */
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
  };

  /** Number of requests remaining in the window */
  remaining?: number;

  /** Time when the rate limit resets */
  resetTime?: Date;
}

/**
 * Validated and sanitized incoming request
 * Used internally after validation
 */
export interface ValidatedAIChatRequest extends AIChatRequest {
  /** Ensures all required fields are present and valid */
  message: string;
  conversationHistory: ChatMessageHistory[];
  userId: string;
}

/**
 * User authentication information
 * Extracted from the incoming request
 */
export interface AuthenticatedUser {
  /** User's email address */
  email: string;

  /** Optional user display name */
  displayName?: string;

  /** Optional user object ID from Azure AD */
  objectId?: string;

  /** Additional user properties */
  [key: string]: any;
}

/**
 * Configuration for the AIChat Azure Function
 * Loaded from Azure Key Vault
 */
export interface AIChatConfig {
  /** Azure OpenAI API endpoint */
  azureOpenAIEndpoint: string;

  /** Azure OpenAI API key */
  azureOpenAIKey: string;

  /** Azure OpenAI deployment name */
  azureOpenAIDeployment?: string;

  /** Dataverse organization URL */
  dataverseUrl: string;

  /** Optional Dataverse authentication details */
  dataverseClientId?: string;
  dataverseClientSecret?: string;

  /** Redis configuration for rate limiting */
  redisHost?: string;
  redisPort?: number;
  redisPassword?: string;

  /** Rate limiting configuration */
  rateLimit?: RateLimitConfig;

  /** Additional configuration parameters */
  [key: string]: any;
}

/**
 * System prompt template data
 * Contains placeholders and context for the AI system message
 */
export interface SystemPromptContext {
  /** User's email for personalization */
  userEmail: string;

  /** User context string with jobs, QA packs, and incidents */
  contextString: string;

  /** Optional organization/company name */
  organizationName?: string;

  /** Additional context values */
  [key: string]: any;
}

/**
 * Azure OpenAI API request message format
 * Matches the format expected by Azure OpenAI
 */
export interface OpenAIMessage {
  /** Role of the message sender */
  role: 'user' | 'assistant' | 'system';

  /** Message content */
  content: string;
}

/**
 * Azure OpenAI API response format (simplified)
 * Contains the generated completion
 */
export interface OpenAIResponse {
  /** Model used for the response */
  model: string;

  /** Array of completion choices */
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index: number;
  }>;

  /** Token usage information */
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };

  /** Response creation timestamp */
  created: number;

  /** Unique response ID */
  id: string;
}

/**
 * Dataverse API request configuration
 * Used for querying Dataverse entities
 */
export interface DataverseQueryConfig {
  /** Dataverse server URL */
  serverUrl: string;

  /** API version (e.g., '9.2') */
  apiVersion: string;
}

/**
 * Request statistics for audit logging
 * Tracks metrics about chat requests
 */
export interface RequestStats {
  /** User's email address */
  userId: string;

  /** Message content length */
  messageLength: number;

  /** Conversation history length */
  historyLength: number;

  /** Tokens used in the request */
  tokensUsed: number;

  /** Processing duration in milliseconds */
  duration: number;

  /** Whether the request was successful */
  success: boolean;

  /** Optional error message if request failed */
  errorMessage?: string;

  /** Timestamp of the request */
  timestamp: Date;

  /** Model used for processing */
  model: string;
}
