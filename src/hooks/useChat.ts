/**
 * useChat Hook
 * 
 * React hook for managing chat state and interactions.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ChatMessage,
  ConversationContext,
  UseChatReturn,
} from '../types/chat';
import {
  sendMessage as apiSendMessage,
  getConversation,
  submitFeedback as apiSubmitFeedback,
  getSuggestedPrompts,
  saveConversationId,
  getLastConversationId,
  clearLocalHistory,
} from '../services/chatApi';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * useChat hook options
 */
interface UseChatOptions {
  /** Initial context */
  initialContext?: ConversationContext;
  /** Auto-load last conversation */
  autoLoadLast?: boolean;
  /** Callback when message is sent */
  onMessageSent?: (message: ChatMessage) => void;
  /** Callback when response is received */
  onResponseReceived?: (message: ChatMessage) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Custom hook for chat functionality
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    initialContext,
    autoLoadLast = false,
    onMessageSent,
    onResponseReceived,
    onError,
  } = options;

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [context, setContext] = useState<ConversationContext | undefined>(initialContext);

  // Refs
  const lastMessageRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Load suggested prompts
  useEffect(() => {
    getSuggestedPrompts(context).then(setSuggestedPrompts);
  }, [context]);

  // Auto-load last conversation
  useEffect(() => {
    if (autoLoadLast) {
      const lastId = getLastConversationId();
      if (lastId) {
        loadConversation(lastId).catch(() => {
          // If loading fails, start fresh
          clearLocalHistory();
        });
      }
    }
  }, [autoLoadLast]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);
    lastMessageRef.current = content;
    retryCountRef.current = 0;

    // Create optimistic user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    onMessageSent?.(userMessage);

    try {
      const response = await apiSendMessage({
        message: content.trim(),
        conversationId: conversationId || undefined,
        context,
      });

      // Update conversation ID
      if (response.conversationId) {
        setConversationId(response.conversationId);
        saveConversationId(response.conversationId);
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        ...response.message,
        timestamp: new Date(response.message.timestamp),
      };

      setMessages(prev => [...prev, assistantMessage]);
      onResponseReceived?.(assistantMessage);

      // Update suggested prompts
      if (response.suggestedPrompts) {
        setSuggestedPrompts(response.suggestedPrompts);
      }

      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      setIsLoading(false);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [conversationId, context, isLoading, onMessageSent, onResponseReceived, onError]);

  /**
   * Retry last failed message
   */
  const retry = useCallback(async () => {
    if (!lastMessageRef.current || retryCountRef.current >= maxRetries) {
      setError('Maximum retry attempts reached');
      return;
    }

    retryCountRef.current += 1;
    
    // Remove the failed user message
    setMessages(prev => prev.slice(0, -1));
    
    // Retry with exponential backoff
    const delay = Math.pow(2, retryCountRef.current) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    await sendMessage(lastMessageRef.current);
  }, [sendMessage]);

  /**
   * Clear current conversation
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    clearLocalHistory();
    getSuggestedPrompts(context).then(setSuggestedPrompts);
  }, [context]);

  /**
   * Load an existing conversation
   */
  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const conversation = await getConversation(id);
      
      setMessages(conversation.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })));
      setConversationId(conversation.id);
      saveConversationId(conversation.id);
      
      if (conversation.context) {
        setContext(conversation.context);
      }

      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  }, []);

  /**
   * Submit feedback for a message
   */
  const submitFeedback = useCallback(async (messageId: string, positive: boolean) => {
    if (!conversationId) return;

    try {
      await apiSubmitFeedback({
        messageId,
        conversationId,
        positive,
      });

      // Update local message with feedback
      setMessages(prev => prev.map(msg => 
        msg.id === messageId
          ? { ...msg, feedback: { positive, timestamp: new Date() } }
          : msg
      ));
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  }, [conversationId]);

  /**
   * Update context
   */
  const updateContext = useCallback((newContext: Partial<ConversationContext>) => {
    setContext(prev => ({ ...prev, ...newContext }));
  }, []);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    clearConversation,
    loadConversation,
    suggestedPrompts,
    submitFeedback,
    retry,
  };
}

export default useChat;
