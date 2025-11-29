/**
 * Chat History API Endpoint
 *
 * GET /api/chat/history - List user's conversations
 * GET /api/chat/history?id=xxx - Get specific conversation
 * DELETE /api/chat/history?id=xxx - Delete a conversation
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ChatConversation, ConversationSummary } from '../../src/types/chat.js';
import {
  getUserConversations,
  getConversation,
  deleteConversation,
} from './_lib/contextManager.js';

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Get user ID (from auth or fallback)
  const userId = 'anonymous'; // TODO: Get from MSAL token

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, userId);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Chat History API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle GET requests
 */
async function handleGet(
  req: VercelRequest,
  res: VercelResponse,
  userId: string
) {
  const { id, limit, offset } = req.query;

  // Get specific conversation
  if (id && typeof id === 'string') {
    const conversation = await getConversation(id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // TODO: Check if user owns this conversation
    // if (conversation.userId !== userId) {
    //   return res.status(403).json({ error: 'Access denied' });
    // }

    return res.status(200).json({ conversation });
  }

  // List conversations
  const limitNum = parseInt(String(limit)) || 20;
  const offsetNum = parseInt(String(offset)) || 0;

  const conversations = await getUserConversations(userId, limitNum + offsetNum);

  // Apply offset
  const paginatedConversations = conversations.slice(offsetNum, offsetNum + limitNum);

  // Convert to summaries
  const summaries: ConversationSummary[] = paginatedConversations.map(conv => ({
    id: conv.id,
    title: conv.title,
    lastMessage: conv.messages.length > 0
      ? conv.messages[conv.messages.length - 1].content.substring(0, 100)
      : '',
    updatedAt: conv.updatedAt,
    messageCount: conv.messages.length,
  }));

  return res.status(200).json({
    conversations: summaries,
    total: conversations.length,
    limit: limitNum,
    offset: offsetNum,
  });
}

/**
 * Handle DELETE requests
 */
async function handleDelete(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Conversation ID is required' });
  }

  // Check if conversation exists
  const conversation = await getConversation(id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // TODO: Check if user owns this conversation
  // const userId = 'anonymous'; // Get from auth
  // if (conversation.userId !== userId) {
  //   return res.status(403).json({ error: 'Access denied' });
  // }

  await deleteConversation(id);

  return res.status(200).json({ success: true, message: 'Conversation deleted' });
}
