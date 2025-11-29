/**
 * Context Manager
 *
 * Manages conversation context and history.
 */

import type {
  ConversationContext,
  EntityReference,
  ChatMessage,
  ChatConversation,
} from '../../../src/types/chat.js';
import { DraftsData } from '../../_lib/sharepointData.js';

/**
 * In-memory conversation cache
 */
const conversationCache = new Map<string, ChatConversation>();
const contextCache = new Map<string, ConversationContext>();

/**
 * Maximum messages to keep in context
 */
const MAX_CONTEXT_MESSAGES = 10;

/**
 * Maximum entities to track
 */
const MAX_ENTITIES = 10;

/**
 * Get or create conversation context
 */
export async function getContext(
  conversationId: string
): Promise<ConversationContext> {
  // Check cache first
  let context = contextCache.get(conversationId);

  if (!context) {
    // Try to load from storage
    try {
      const stored = await loadContextFromStorage(conversationId);
      if (stored) {
        context = stored;
        contextCache.set(conversationId, context);
      }
    } catch (error) {
      console.error('[ContextManager] Failed to load context:', error);
    }
  }

  // Return existing or create new
  return context || {
    recentEntities: [],
  };
}

/**
 * Update conversation context
 */
export async function updateContext(
  conversationId: string,
  updates: Partial<ConversationContext>
): Promise<void> {
  const current = await getContext(conversationId);
  const updated = { ...current, ...updates };
  contextCache.set(conversationId, updated);

  // Persist to storage
  try {
    await saveContextToStorage(conversationId, updated);
  } catch (error) {
    console.error('[ContextManager] Failed to save context:', error);
  }
}

/**
 * Add an entity reference to context
 */
export async function addEntityReference(
  conversationId: string,
  entity: EntityReference
): Promise<void> {
  const context = await getContext(conversationId);
  const entities = context.recentEntities || [];

  // Remove if already exists
  const filtered = entities.filter(
    e => !(e.type === entity.type && e.id === entity.id)
  );

  // Add to front with timestamp
  const newEntity: EntityReference = {
    ...entity,
    mentionedAt: new Date(),
  };

  // Keep only recent entities
  const updated = [newEntity, ...filtered].slice(0, MAX_ENTITIES);

  await updateContext(conversationId, { recentEntities: updated });
}

/**
 * Get recent entities from context
 */
export async function getRecentEntities(
  conversationId: string,
  limit: number = 5
): Promise<EntityReference[]> {
  const context = await getContext(conversationId);
  return (context.recentEntities || []).slice(0, limit);
}

/**
 * Build prompt context string for AI
 */
export async function buildPromptContext(
  conversationId: string,
  recentMessages: ChatMessage[] = []
): Promise<string> {
  const context = await getContext(conversationId);
  const parts: string[] = [];

  // Add user role if known
  if (context.userRole) {
    parts.push(`User role: ${context.userRole}`);
  }

  // Add user division if known
  if (context.userDivision) {
    parts.push(`User division: ${context.userDivision}`);
  }

  // Add current page context
  if (context.currentPage) {
    parts.push(`User is currently on: ${context.currentPage}`);
  }

  // Add current entity context
  if (context.currentEntity) {
    parts.push(
      `User is viewing: ${context.currentEntity.type} ${context.currentEntity.name || context.currentEntity.id}`
    );
  }

  // Add recent entities
  const entities = context.recentEntities || [];
  if (entities.length > 0) {
    parts.push('Recently discussed:');
    entities.slice(0, 3).forEach(e => {
      parts.push(`- ${e.type}: ${e.name || e.id}`);
    });
  }

  // Add recent conversation summary
  if (recentMessages.length > 0) {
    parts.push('\nRecent conversation:');
    recentMessages.slice(-5).forEach(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      const content = msg.content.substring(0, 200);
      parts.push(`${role}: ${content}${msg.content.length > 200 ? '...' : ''}`);
    });
  }

  return parts.join('\n');
}

/**
 * Get conversation from cache or storage
 */
export async function getConversation(
  conversationId: string
): Promise<ChatConversation | null> {
  // Check cache
  const cached = conversationCache.get(conversationId);
  if (cached) {
    return cached;
  }

  // Load from storage
  try {
    const stored = await loadConversationFromStorage(conversationId);
    if (stored) {
      conversationCache.set(conversationId, stored);
      return stored;
    }
  } catch (error) {
    console.error('[ContextManager] Failed to load conversation:', error);
  }

  return null;
}

/**
 * Save conversation
 */
export async function saveConversation(
  conversation: ChatConversation
): Promise<void> {
  // Update cache
  conversationCache.set(conversation.id, conversation);

  // Persist to storage
  try {
    await saveConversationToStorage(conversation);
  } catch (error) {
    console.error('[ContextManager] Failed to save conversation:', error);
  }
}

/**
 * Create a new conversation
 */
export function createConversation(
  id: string,
  userId: string,
  initialContext?: ConversationContext
): ChatConversation {
  const conversation: ChatConversation = {
    id,
    userId,
    title: 'New conversation',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    context: initialContext,
  };

  conversationCache.set(id, conversation);
  return conversation;
}

/**
 * Add message to conversation
 */
export async function addMessage(
  conversationId: string,
  message: ChatMessage
): Promise<ChatConversation> {
  let conversation = await getConversation(conversationId);

  if (!conversation) {
    conversation = createConversation(conversationId, 'anonymous');
  }

  // Add message
  conversation.messages.push(message);
  conversation.updatedAt = new Date();

  // Keep only recent messages in memory
  if (conversation.messages.length > MAX_CONTEXT_MESSAGES * 2) {
    conversation.messages = conversation.messages.slice(-MAX_CONTEXT_MESSAGES * 2);
  }

  // Update title from first user message
  if (conversation.title === 'New conversation') {
    const firstUserMessage = conversation.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      conversation.title = firstUserMessage.content.substring(0, 50) +
        (firstUserMessage.content.length > 50 ? '...' : '');
    }
  }

  await saveConversation(conversation);
  return conversation;
}

/**
 * Get user's conversations
 */
export async function getUserConversations(
  userId: string,
  limit: number = 20
): Promise<ChatConversation[]> {
  // Get from cache first
  const cached: ChatConversation[] = [];
  conversationCache.forEach((conv) => {
    if (conv.userId === userId) {
      cached.push(conv);
    }
  });

  // Sort by update time
  cached.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return cached.slice(0, limit);
}

/**
 * Delete conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  conversationCache.delete(conversationId);
  contextCache.delete(conversationId);

  try {
    await deleteConversationFromStorage(conversationId);
  } catch (error) {
    console.error('[ContextManager] Failed to delete conversation:', error);
  }
}

// ============================================================================
// STORAGE HELPERS (using Drafts list)
// ============================================================================

/**
 * Load context from storage
 */
async function loadContextFromStorage(
  conversationId: string
): Promise<ConversationContext | null> {
  try {
    const drafts = await DraftsData.getAll(`Title eq 'chat-context-${conversationId}'`);
    if (drafts.length > 0) {
      const draft = drafts[0] as any;
      return draft.data ? JSON.parse(draft.data) : null;
    }
  } catch (error) {
    // Ignore storage errors
  }
  return null;
}

/**
 * Save context to storage
 */
async function saveContextToStorage(
  conversationId: string,
  context: ConversationContext
): Promise<void> {
  try {
    const title = `chat-context-${conversationId}`;
    const drafts = await DraftsData.getAll(`Title eq '${title}'`);

    if (drafts.length > 0) {
      await DraftsData.update((drafts[0] as any).id, {
        data: JSON.stringify(context),
      } as any);
    } else {
      await DraftsData.create({
        title,
        type: 'chat-context',
        data: JSON.stringify(context),
      } as any);
    }
  } catch (error) {
    // Ignore storage errors
  }
}

/**
 * Load conversation from storage
 */
async function loadConversationFromStorage(
  conversationId: string
): Promise<ChatConversation | null> {
  try {
    const drafts = await DraftsData.getAll(`Title eq 'chat-conv-${conversationId}'`);
    if (drafts.length > 0) {
      const draft = drafts[0] as any;
      return draft.data ? JSON.parse(draft.data) : null;
    }
  } catch (error) {
    // Ignore storage errors
  }
  return null;
}

/**
 * Save conversation to storage
 */
async function saveConversationToStorage(
  conversation: ChatConversation
): Promise<void> {
  try {
    const title = `chat-conv-${conversation.id}`;
    const drafts = await DraftsData.getAll(`Title eq '${title}'`);

    const data = JSON.stringify({
      ...conversation,
      // Limit stored messages
      messages: conversation.messages.slice(-50),
    });

    if (drafts.length > 0) {
      await DraftsData.update((drafts[0] as any).id, {
        data,
      } as any);
    } else {
      await DraftsData.create({
        title,
        type: 'chat-conversation',
        data,
      } as any);
    }
  } catch (error) {
    // Ignore storage errors
  }
}

/**
 * Delete conversation from storage
 */
async function deleteConversationFromStorage(
  conversationId: string
): Promise<void> {
  try {
    const convDrafts = await DraftsData.getAll(`Title eq 'chat-conv-${conversationId}'`);
    const contextDrafts = await DraftsData.getAll(`Title eq 'chat-context-${conversationId}'`);

    for (const draft of [...convDrafts, ...contextDrafts]) {
      await DraftsData.delete((draft as any).id);
    }
  } catch (error) {
    // Ignore storage errors
  }
}

export default {
  getContext,
  updateContext,
  addEntityReference,
  getRecentEntities,
  buildPromptContext,
  getConversation,
  saveConversation,
  createConversation,
  addMessage,
  getUserConversations,
  deleteConversation,
};
