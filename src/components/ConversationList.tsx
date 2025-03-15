'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { MessageSquare, Plus, Loader2 } from 'lucide-react'
import type { Conversation } from '@/types/chat'
import { toast } from 'react-toastify'

/**
 * ConversationList component
 * 
 * Displays a list of saved conversations that can be selected.
 * Allows creating a new chat conversation.
 * 
 * @param onSelect - Callback when a conversation is selected, passing the ID
 * @param selectedId - Currently selected conversation ID
 * @param onNewChat - Callback when the new chat button is clicked
 */
interface ConversationListProps {
  onSelect: (id: string) => void
  selectedId?: string
  onNewChat: () => void
}

export default function ConversationList({ onSelect, selectedId, onNewChat }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load conversations on component mount
  useEffect(() => {
    loadConversations()
  }, [])

  /**
   * Fetches all conversations from the API
   */
  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/conversations')
      if (!response.ok) throw new Error('Failed to load conversations')
      const data = await response.json()
      setConversations(data)
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handles selecting a conversation
   * @param id - The ID of the conversation to select
   */
  const handleSelect = (id: string) => {
    if (typeof onSelect === 'function') {
      onSelect(id)
    }
  }

  /**
   * Creates a tooltip with conversation details
   * @param conversation - The conversation to create tooltip for
   * @returns - A string with conversation details for the tooltip
   */
  const getTooltipContent = (conversation: Conversation): string => {
    // Get first few messages (excluding system messages)
    const previewMessages = conversation.messages
      .filter(msg => msg.role !== 'system')
      .slice(0, 2) // Get first 2 messages
      .map(msg => `${msg.role === 'user' ? 'You' : 'Coach'}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`)
      .join('\n');
    
    const date = format(new Date(conversation.createdAt), 'MMM d, yyyy h:mm a');
    return `${conversation.title}\n\nCreated: ${date}\n\n${previewMessages || 'No messages'}`;
  }

  return (
    <div className="w-64 bg-gray-50 p-4 border-r h-full flex flex-col">
      <button
        onClick={onNewChat}
        className="w-full mb-4 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-5 w-5" />
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading && conversations.length === 0 ? (
          <div className="flex items-center justify-center p-4 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Loading conversations...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start a new chat to begin</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => handleSelect(conversation.id)}
              className={`w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors flex items-start gap-3 ${
                selectedId === conversation.id ? 'bg-gray-200' : ''
              }`}
              title={getTooltipContent(conversation)}
              aria-label={`Load conversation: ${conversation.title}`}
            >
              <MessageSquare className="h-5 w-5 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{conversation.title}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(conversation.createdAt), 'MMM d, yyyy')}
                </p>
                {conversation.messages.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {conversation.messages
                      .filter(msg => msg.role !== 'system')
                      .slice(-1)[0]?.content?.substring(0, 60) || ''}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
} 