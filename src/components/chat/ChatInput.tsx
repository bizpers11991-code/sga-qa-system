/**
 * ChatInput Component
 * 
 * Input field for chat messages with auto-resize and keyboard shortcuts.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestedPrompts?: string[];
  onSelectPrompt?: (prompt: string) => void;
  maxLength?: number;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask me anything...',
  suggestedPrompts = [],
  onSelectPrompt,
  maxLength = 2000,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 150); // Max 5 lines roughly
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handlePromptClick = useCallback((prompt: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
    } else {
      setValue(prompt);
      textareaRef.current?.focus();
    }
  }, [onSelectPrompt]);

  const handleClear = useCallback(() => {
    setValue('');
    textareaRef.current?.focus();
  }, []);

  const charCount = value.length;
  const isOverLimit = charCount > maxLength;
  const canSend = value.trim().length > 0 && !disabled && !isOverLimit;

  return (
    <div className="space-y-3">
      {/* Suggested prompts */}
      {suggestedPrompts.length > 0 && !value && (
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.slice(0, 4).map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt)}
              disabled={disabled}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed truncate max-w-[200px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="relative flex items-end gap-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 px-4 py-3 bg-transparent resize-none focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ maxHeight: '150px' }}
          aria-label="Chat message input"
        />

        <div className="flex items-center gap-1 pr-2 pb-2">
          {/* Clear button */}
          {value && (
            <button
              onClick={handleClear}
              disabled={disabled}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              aria-label="Clear input"
            >
              <X size={18} />
            </button>
          )}

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className={`p-2 rounded-full transition-colors ${
              canSend
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Character count and hints */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span>
          Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Enter</kbd> to send,{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Shift+Enter</kbd> for new line
        </span>
        {value && (
          <span className={isOverLimit ? 'text-red-500' : ''}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

export default ChatInput;
