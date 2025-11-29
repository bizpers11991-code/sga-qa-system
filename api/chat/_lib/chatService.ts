/**
 * Chat Service
 *
 * Core orchestration logic for the chat system.
 * Routes messages to appropriate handlers and generates responses.
 */

import type {
  ChatRequest,
  ChatResponse,
  ChatMessage,
  ChatConversation,
  ConversationContext,
  ClassificationResult,
  ChatIntent,
} from '../../../src/types/chat.js';
import { generateCompletion, getAIStatus } from '../../_lib/aiService.js';
import { classifyIntent, getSubIntent } from './intentClassifier.js';
import { executeDataQuery, formatQueryResults } from './dataQueryEngine.js';
import { searchKnowledge, formatKnowledgeResponse } from './knowledgeBase.js';
import { handleDraftGeneration } from './draftGenerator.js';
import {
  getContext,
  updateContext,
  addEntityReference,
  buildPromptContext,
  getConversation,
  saveConversation,
  createConversation,
  addMessage,
  getUserConversations,
} from './contextManager.js';
import { getSystemPrompt, getDataQueryPrompt } from './systemPrompts.js';

/**
 * Generate unique ID
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate conversation ID
 */
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Process a chat message
 */
export async function processMessage(
  request: ChatRequest,
  userId: string
): Promise<ChatResponse> {
  const startTime = Date.now();
  const { message, conversationId, context: requestContext } = request;

  // Get or create conversation
  let convId = conversationId || generateConversationId();
  let conversation = await getConversation(convId);

  if (!conversation) {
    conversation = createConversation(convId, userId, requestContext);
  }

  // Update context if provided
  if (requestContext) {
    await updateContext(convId, requestContext);
  }

  // Add user message to conversation
  const userMessage: ChatMessage = {
    id: generateId(),
    role: 'user',
    content: message,
    timestamp: new Date(),
  };
  await addMessage(convId, userMessage);

  // Classify intent
  const context = await getContext(convId);
  const classification = classifyIntent(message, context);

  // Add sub-intent
  classification.subIntent = getSubIntent(message, classification.intent);

  // Route to handler based on intent
  let responseContent: string;
  let metadata: ChatMessage['metadata'] = {
    intent: classification.intent as ChatIntent,
    confidence: classification.confidence,
  };

  try {
    switch (classification.intent) {
      case 'DATA_QUERY':
        responseContent = await handleDataQuery(message, classification);
        break;

      case 'KNOWLEDGE_SEARCH':
        responseContent = await handleKnowledgeSearch(message, classification);
        break;

      case 'DRAFT_CREATE':
        responseContent = await handleDraftCreate(message, classification);
        break;

      case 'HELP':
        responseContent = await handleHelp(message, classification, conversation);
        break;

      case 'CLARIFICATION':
        responseContent = await handleClarification(message, conversation);
        break;

      case 'GENERAL_CHAT':
      default:
        responseContent = await handleGeneralChat(message, classification, conversation);
    }
  } catch (error) {
    console.error('[ChatService] Handler error:', error);
    responseContent = "I encountered an issue processing your request. Please try again or rephrase your question.";
  }

  const processingTime = Date.now() - startTime;
  metadata.processingTime = processingTime;

  // Create assistant message
  const assistantMessage: ChatMessage = {
    id: generateId(),
    role: 'assistant',
    content: responseContent,
    timestamp: new Date(),
    metadata,
  };

  // Add to conversation
  await addMessage(convId, assistantMessage);

  // Extract and track entities mentioned
  for (const entity of classification.entities) {
    if (['job', 'project', 'incident', 'ncr', 'tender'].includes(entity.type)) {
      await addEntityReference(convId, {
        type: entity.type as any,
        id: String(entity.normalized || entity.value),
        name: entity.value,
      });
    }
  }

  // Generate suggested prompts
  const suggestedPrompts = generateSuggestedPrompts(
    classification.intent as ChatIntent,
    context
  );

  return {
    message: assistantMessage,
    conversationId: convId,
    suggestedPrompts,
  };
}

/**
 * Handle data query intent
 */
async function handleDataQuery(
  message: string,
  classification: ClassificationResult
): Promise<string> {
  const result = await executeDataQuery(message, classification);

  if (result.totalCount === 0) {
    return `I couldn't find any ${result.entityType}s matching your query. Try being more specific or check the filters.`;
  }

  return formatQueryResults(result);
}

/**
 * Handle knowledge search intent
 */
async function handleKnowledgeSearch(
  message: string,
  classification: ClassificationResult
): Promise<string> {
  // Search knowledge base
  const results = searchKnowledge(message, 3);

  if (results.length > 0 && results[0].score > 0.3) {
    return formatKnowledgeResponse(results);
  }

  // Fallback to AI if no good match
  const aiStatus = getAIStatus();
  if (aiStatus.configured) {
    try {
      const response = await generateCompletion(message, {
        systemPrompt: getSystemPrompt(),
        temperature: 0.7,
        maxTokens: 500,
      });
      return response;
    } catch (error) {
      console.error('[ChatService] AI fallback failed:', error);
    }
  }

  return formatKnowledgeResponse(results);
}

/**
 * Handle draft creation intent
 */
async function handleDraftCreate(
  message: string,
  classification: ClassificationResult
): Promise<string> {
  const { draft, summary } = await handleDraftGeneration(message, classification);

  // The summary includes the draft details and prompts for confirmation
  return summary;
}

/**
 * Handle help intent
 */
async function handleHelp(
  message: string,
  classification: ClassificationResult,
  conversation: ChatConversation
): Promise<string> {
  // First check knowledge base
  const results = searchKnowledge(message, 3);

  if (results.length > 0 && results[0].score > 0.4) {
    return formatKnowledgeResponse(results);
  }

  // Use AI for general help
  const aiStatus = getAIStatus();
  if (aiStatus.configured) {
    try {
      const promptContext = await buildPromptContext(
        conversation.id,
        conversation.messages.slice(-4)
      );

      const prompt = `User question: ${message}

Context:
${promptContext}

Provide helpful guidance based on the question and context.`;

      const response = await generateCompletion(prompt, {
        systemPrompt: getSystemPrompt(),
        temperature: 0.7,
        maxTokens: 500,
      });

      return response;
    } catch (error) {
      console.error('[ChatService] AI help failed:', error);
    }
  }

  // Fallback
  return `I can help you with:
- **Data queries**: "Show me today's jobs" or "List open incidents"
- **Specifications**: "What's the temp spec for AC14?"
- **Procedures**: "How do I submit a QA pack?"
- **Creating items**: "Draft a job for asphalt patching tomorrow"

What would you like to know?`;
}

/**
 * Handle clarification intent
 */
async function handleClarification(
  message: string,
  conversation: ChatConversation
): Promise<string> {
  // Get context from previous messages
  const recentMessages = conversation.messages.slice(-6);
  const previousAssistant = recentMessages
    .filter(m => m.role === 'assistant')
    .pop();

  if (!previousAssistant) {
    return "I'm not sure what you're referring to. Could you please rephrase your question?";
  }

  // Use AI to interpret clarification
  const aiStatus = getAIStatus();
  if (aiStatus.configured) {
    try {
      const prompt = `Previous response: ${previousAssistant.content.substring(0, 500)}

User clarification: ${message}

Respond appropriately to the clarification, providing more detail or correcting as needed.`;

      const response = await generateCompletion(prompt, {
        systemPrompt: getSystemPrompt(),
        temperature: 0.7,
        maxTokens: 400,
      });

      return response;
    } catch (error) {
      console.error('[ChatService] Clarification AI failed:', error);
    }
  }

  return "I understand. Could you provide more details about what you need?";
}

/**
 * Handle general chat intent
 */
async function handleGeneralChat(
  message: string,
  classification: ClassificationResult,
  conversation: ChatConversation
): Promise<string> {
  const aiStatus = getAIStatus();

  if (!aiStatus.configured) {
    return `I can help you with:
- **Data queries**: "Show me today's jobs"
- **Specifications**: "What's the temp spec for AC14?"
- **Procedures**: "How do I submit a QA pack?"

What would you like to know?`;
  }

  try {
    // Build context from conversation
    const promptContext = await buildPromptContext(
      conversation.id,
      conversation.messages.slice(-6)
    );

    const prompt = `User message: ${message}

${promptContext ? `Context:\n${promptContext}` : ''}`;

    const response = await generateCompletion(prompt, {
      systemPrompt: getSystemPrompt(),
      temperature: 0.7,
      maxTokens: 500,
    });

    return response;
  } catch (error) {
    console.error('[ChatService] General chat AI failed:', error);
    return "I'm having trouble processing that request. Could you try rephrasing?";
  }
}

/**
 * Generate suggested follow-up prompts
 */
function generateSuggestedPrompts(
  intent: ChatIntent,
  context: ConversationContext
): string[] {
  const contextPrompts: Record<string, string[]> = {
    DATA_QUERY: [
      'Show more details',
      'Filter by status',
      "Show only today's items",
    ],
    KNOWLEDGE_SEARCH: [
      'Tell me more',
      'What are the exceptions?',
      'Where can I find this in the app?',
    ],
    DRAFT_CREATE: [
      'Create it now',
      'Modify the details',
      'Cancel draft',
    ],
    HELP: [
      'Show me step by step',
      'What if I make a mistake?',
      'Who can I contact for help?',
    ],
    GENERAL_CHAT: [
      "Show today's jobs",
      "What's the QA status?",
      'Help with QA pack',
    ],
    CLARIFICATION: [
      'Yes, that helps',
      'I need more detail',
      'Show me an example',
    ],
  };

  // Add page-specific prompts
  if (context?.currentPage) {
    if (context.currentPage.includes('job')) {
      return ['Show job details', 'Update status', 'View QA pack'];
    }
    if (context.currentPage.includes('project')) {
      return ['Project jobs', 'Scope reports', 'Division requests'];
    }
  }

  return contextPrompts[intent] || contextPrompts['GENERAL_CHAT'];
}

/**
 * Get conversation history for a user
 */
export async function getConversationHistory(
  userId: string,
  limit: number = 20
): Promise<ChatConversation[]> {
  return getUserConversations(userId, limit);
}

/**
 * Get a specific conversation
 */
export async function getConversationById(
  conversationId: string
): Promise<ChatConversation | null> {
  return getConversation(conversationId);
}

export default {
  processMessage,
  getConversationHistory,
  getConversationById,
};
