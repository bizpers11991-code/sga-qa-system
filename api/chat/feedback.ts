/**
 * Chat Feedback API Endpoint
 *
 * POST /api/chat/feedback - Submit feedback for a message
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ChatFeedbackRequest } from '../../src/types/chat.js';
import { getConversation, saveConversation } from './_lib/contextManager.js';

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user ID (from auth or fallback)
    const userId = 'anonymous'; // TODO: Get from MSAL token

    // Parse and validate request body
    const { messageId, conversationId, positive, comment } = req.body as ChatFeedbackRequest;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    if (typeof positive !== 'boolean') {
      return res.status(400).json({ error: 'Positive flag is required' });
    }

    // Get conversation
    const conversation = await getConversation(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Find and update message
    let messageFound = false;
    for (const message of conversation.messages) {
      if (message.id === messageId) {
        message.feedback = {
          positive,
          timestamp: new Date(),
        };
        messageFound = true;
        break;
      }
    }

    if (!messageFound) {
      return res.status(404).json({ error: 'Message not found in conversation' });
    }

    // Save updated conversation
    await saveConversation(conversation);

    // Log feedback for analytics (optional)
    console.log('[Chat Feedback]', {
      userId,
      conversationId,
      messageId,
      positive,
      comment: comment?.substring(0, 100),
      timestamp: new Date().toISOString(),
    });

    // TODO: Store feedback in analytics system for improving responses

    return res.status(200).json({
      success: true,
      message: 'Feedback recorded',
    });
  } catch (error) {
    console.error('[Chat Feedback API] Error:', error);
    return res.status(500).json({
      error: 'Failed to record feedback',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
