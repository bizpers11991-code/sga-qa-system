/**
 * Chat API Client
 * 
 * Frontend service for interacting with the chat API.
 */

import type {
  ChatRequest,
  ChatResponse,
  ChatConversation,
  ConversationSummary,
  ConversationContext,
  ChatFeedbackRequest,
} from '../types/chat';

const API_BASE = '/api/chat';

/**
 * API Error class
 */
export class ChatAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ChatAPIError';
  }
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ChatAPIError(
      errorData.message || `Request failed with status ${response.status}`,
      response.status,
      errorData.code
    );
  }
  return response.json();
}

/**
 * Send a chat message
 */
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return handleResponse<ChatResponse>(response);
}

/**
 * Get all conversations for current user
 */
export async function getConversations(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ conversations: ConversationSummary[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));

  const url = `${API_BASE}/history${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);

  return handleResponse(response);
}

/**
 * Get a specific conversation by ID
 */
export async function getConversation(id: string): Promise<ChatConversation> {
  const response = await fetch(`${API_BASE}/history?id=${encodeURIComponent(id)}`);
  return handleResponse<ChatConversation>(response);
}

/**
 * Delete a conversation
 */
export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/history?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ChatAPIError(
      errorData.message || 'Failed to delete conversation',
      response.status
    );
  }
}

/**
 * Submit feedback for a message
 */
export async function submitFeedback(request: ChatFeedbackRequest): Promise<void> {
  const response = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ChatAPIError(
      errorData.message || 'Failed to submit feedback',
      response.status
    );
  }
}

/**
 * Get suggested prompts based on context
 */
export async function getSuggestedPrompts(
  context?: ConversationContext
): Promise<string[]> {
  // For now, return static prompts based on context
  // Later this can call an API endpoint

  const defaultPrompts = [
    "What jobs are scheduled for today?",
    "How do I submit a QA pack?",
    "Show me recent incidents",
    "What's the spec for AC14 temperature?",
  ];

  if (!context?.currentPage) {
    return defaultPrompts;
  }

  const pagePrompts: Record<string, string[]> = {
    '/jobs': [
      "Show today's jobs",
      "Jobs with missing QA packs",
      "Create a new job",
      "Jobs by division",
    ],
    '/qa-pack': [
      "Help me complete this QA pack",
      "What fields are required?",
      "Check temperature compliance",
      "Generate summary",
    ],
    '/projects': [
      "Show active projects",
      "Projects needing scope reports",
      "Project status summary",
      "Division request status",
    ],
    '/incidents': [
      "Recent incidents",
      "Open investigations",
      "Report a new incident",
      "Incident trends",
    ],
    '/dashboard': [
      "Weekly summary",
      "Overdue items",
      "My tasks",
      "Team performance",
    ],
  };

  // Find matching prompts
  for (const [path, prompts] of Object.entries(pagePrompts)) {
    if (context.currentPage.startsWith(path)) {
      return prompts;
    }
  }

  return defaultPrompts;
}

/**
 * Clear conversation history (local only)
 */
export function clearLocalHistory(): void {
  sessionStorage.removeItem('chat_conversation_id');
}

/**
 * Get last conversation ID from session
 */
export function getLastConversationId(): string | null {
  return sessionStorage.getItem('chat_conversation_id');
}

/**
 * Save conversation ID to session
 */
export function saveConversationId(id: string): void {
  sessionStorage.setItem('chat_conversation_id', id);
}

export default {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation,
  submitFeedback,
  getSuggestedPrompts,
  clearLocalHistory,
  getLastConversationId,
  saveConversationId,
};
