/**
 * ChatMessage Component
 * 
 * Displays an individual chat message with styling based on role.
 */

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Check, User, Bot } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  onFeedback?: (positive: boolean) => void;
  showFeedback?: boolean;
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Simple markdown renderer for chat messages
 */
function renderMarkdown(content: string): React.ReactNode {
  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    // Code block
    if (part.startsWith('```')) {
      const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
      if (match) {
        const [, language, code] = match;
        return (
          <CodeBlock key={index} code={code.trim()} language={language} />
        );
      }
    }

    // Regular text with inline formatting
    return (
      <span key={index}>
        {renderInlineMarkdown(part)}
      </span>
    );
  });
}

/**
 * Render inline markdown (bold, italic, inline code)
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  // Process line by line for lists
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Bullet points
    if (line.match(/^[\s]*[-*]\s/)) {
      const content = line.replace(/^[\s]*[-*]\s/, '');
      return (
        <div key={lineIndex} className="flex items-start gap-2 ml-4">
          <span className="text-gray-400">•</span>
          <span>{renderInlineFormatting(content)}</span>
        </div>
      );
    }

    // Numbered lists
    if (line.match(/^[\s]*\d+\.\s/)) {
      const match = line.match(/^[\s]*(\d+)\.\s(.*)$/);
      if (match) {
        return (
          <div key={lineIndex} className="flex items-start gap-2 ml-4">
            <span className="text-gray-400 min-w-[1.5rem]">{match[1]}.</span>
            <span>{renderInlineFormatting(match[2])}</span>
          </div>
        );
      }
    }

    // Regular paragraph
    return (
      <React.Fragment key={lineIndex}>
        {lineIndex > 0 && <br />}
        {renderInlineFormatting(line)}
      </React.Fragment>
    );
  });
}

/**
 * Render inline formatting (bold, italic, code)
 */
function renderInlineFormatting(text: string): React.ReactNode {
  // Simple regex-based formatting
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Combined regex for bold, italic, and inline code
  const regex = /(\*\*.*?\*\*)|(`[^`]+`)|(\*[^*]+\*)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const matched = match[0];
    
    if (matched.startsWith('**')) {
      // Bold
      parts.push(
        <strong key={match.index} className="font-semibold">
          {matched.slice(2, -2)}
        </strong>
      );
    } else if (matched.startsWith('`')) {
      // Inline code
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
          {matched.slice(1, -1)}
        </code>
      );
    } else if (matched.startsWith('*')) {
      // Italic
      parts.push(
        <em key={match.index}>
          {matched.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + matched.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Code block component with copy button
 */
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-2 rounded-lg overflow-hidden bg-gray-900 dark:bg-gray-950">
      {language && (
        <div className="px-4 py-1 bg-gray-800 text-gray-400 text-xs font-mono">
          {language}
        </div>
      )}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
        aria-label="Copy code"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-gray-100 font-mono">{code}</code>
      </pre>
    </div>
  );
}

/**
 * ChatMessage component
 */
export function ChatMessage({ message, onFeedback, showFeedback = true }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
          }`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {renderMarkdown(message.content)}
          </div>
        </div>

        {/* Timestamp and feedback */}
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-xs text-gray-400">
            {formatRelativeTime(message.timestamp)}
          </span>

          {/* Feedback buttons for assistant messages */}
          {isAssistant && showFeedback && onFeedback && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onFeedback(true)}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  message.feedback?.positive === true
                    ? 'text-green-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                aria-label="Good response"
              >
                <ThumbsUp size={14} />
              </button>
              <button
                onClick={() => onFeedback(false)}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  message.feedback?.positive === false
                    ? 'text-red-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                aria-label="Bad response"
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Show sources if available */}
        {message.metadata?.sources && message.metadata.sources.length > 0 && (
          <div className="mt-2 px-1">
            <div className="text-xs text-gray-400">
              Sources: {message.metadata.sources.join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
