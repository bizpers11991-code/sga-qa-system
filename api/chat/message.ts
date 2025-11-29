/**
 * Chat Message API Endpoint
 *
 * POST /api/chat/message
 *
 * Main endpoint for chat interactions.
 * Uses the ChatService for message processing.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ChatRequest } from '../../src/types/chat.js';
import { processMessage } from './_lib/chatService.js';

// Rate limiting (simple in-memory for now)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 50; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

/**
 * Check rate limit
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

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

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
    }

    // Parse and validate request
    const { message, conversationId, context } = req.body as ChatRequest;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    }

    // Process message using ChatService
    const response = await processMessage(
      { message, conversationId, context },
      userId
    );

    return res.status(200).json(response);
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return res.status(500).json({
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
