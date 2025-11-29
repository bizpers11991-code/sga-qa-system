/**
 * ChatInterface Component
 * 
 * Main chat UI container that combines all chat components.
 */

import React, { useEffect, useRef } from 'react';
import { MessageSquare, X, RefreshCw, Trash2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChat } from '../../hooks/useChat';
import type { ConversationContext } from '../../types/chat';

interface ChatInterfaceProps {
  className?: string;
  initialContext?: ConversationContext;
  onClose?: () => void;
  variant?: 'full' | 'sidebar' | 'modal';
  title?: string;
}

/**
 * Loading dots animation
 */
function LoadingDots() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <MessageSquare size={16} className="text-gray-400" />
      </div>
      <div className="flex items-center gap-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

/**
 * Empty state when no messages
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
        <MessageSquare size={32} className="text-blue-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        SGA QA Assistant
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">
        Ask me anything about jobs, projects, QA procedures, safety standards, or get help using the system.
      </p>
    </div>
  );
}

/**
 * Error display
 */
function ErrorDisplay({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mx-4">
      <div className="flex-1">
        <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Main ChatInterface component
 */
export function ChatInterface({
  className = '',
  initialContext,
  onClose,
  variant = 'full',
  title = 'Chat Assistant',
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearConversation,
    suggestedPrompts,
    submitFeedback,
    retry,
  } = useChat({
    initialContext,
    autoLoadLast: variant === 'full',
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Variant-specific styling
  const containerStyles = {
    full: 'flex flex-col h-full',
    sidebar: 'flex flex-col h-full w-80 border-l border-gray-200 dark:border-gray-700',
    modal: 'flex flex-col h-[600px] w-full max-w-2xl rounded-xl shadow-xl',
  };

  return (
    <div className={`${containerStyles[variant]} bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-blue-500" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <Trash2 size={18} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onFeedback={(positive) => submitFeedback(message.id, positive)}
                showFeedback={message.role === 'assistant'}
              />
            ))}
            
            {isLoading && <LoadingDots />}
            
            {error && (
              <ErrorDisplay message={error} onRetry={retry} />
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <ChatInput
          onSend={sendMessage}
          disabled={isLoading}
          suggestedPrompts={messages.length === 0 ? suggestedPrompts : []}
          placeholder="Ask about jobs, specs, procedures..."
        />
      </div>
    </div>
  );
}

export default ChatInterface;
