/**
 * Chat Page
 *
 * Dedicated full-page chat interface with conversation history sidebar.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Plus, Trash2, ChevronLeft, Menu, Search } from 'lucide-react';
import { ChatInterface } from '../components/chat/ChatInterface';
import type { ConversationSummary } from '../types/chat';
import { getConversations, deleteConversation } from '../services/chatApi';

/**
 * Format relative time for display
 */
function formatTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
}

/**
 * Conversation list item
 */
function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: ConversationSummary;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={`group relative px-3 py-3 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/40'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <MessageSquare size={14} className="text-gray-500 dark:text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {conversation.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {conversation.lastMessage || 'No messages'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatTime(conversation.updatedAt)}
          </p>
        </div>
      </div>

      {/* Delete button */}
      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          aria-label="Delete conversation"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

/**
 * Empty state for no conversations
 */
function EmptyConversations({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <MessageSquare size={24} className="text-gray-400" />
      </div>
      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
        No conversations yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Start a new chat to get help
      </p>
      <button
        onClick={onNewChat}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
      >
        <Plus size={16} />
        New Chat
      </button>
    </div>
  );
}

/**
 * Main Chat Page component
 */
export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const result = await getConversations({ limit: 50 });
      setConversations(result.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    if (!confirm('Delete this conversation?')) return;

    try {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));

      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, [activeConversationId]);

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 overflow-hidden md:relative absolute inset-y-0 left-0 z-20 bg-white dark:bg-gray-900`}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              Chats
            </h2>
            <button
              onClick={handleNewChat}
              className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              aria-label="New chat"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <EmptyConversations onNewChat={handleNewChat} />
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={activeConversationId === conversation.id}
                  onSelect={() => handleSelectConversation(conversation.id)}
                  onDelete={() => handleDeleteConversation(conversation.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with menu toggle */}
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="font-semibold text-gray-900 dark:text-gray-100">
            Chat Assistant
          </h1>
        </div>

        {/* Chat interface */}
        <div className="flex-1 min-h-0">
          <ChatInterface
            key={activeConversationId || 'new'}
            variant="full"
            title="SGA QA Assistant"
          />
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
