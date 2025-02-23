'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { MessageSquare, Plus } from 'lucide-react'
import type { Conversation } from '@/types/chat'
import { toast } from 'react-toastify'

interface ConversationListProps {
  onSelect: (id: string) => void
  selectedId?: string
  onNewChat: () => void
}

export default function ConversationList({ onSelect, selectedId, onNewChat }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (!response.ok) throw new Error('Failed to load conversations')
      const data = await response.json()
      setConversations(data)
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversations')
    }
  }

  const handleSelect = (id: string) => {
    if (typeof onSelect === 'function') {
      onSelect(id)
    }
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
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => handleSelect(conversation.id)}
            className={`w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors flex items-start gap-3 ${
              selectedId === conversation.id ? 'bg-gray-100' : ''
            }`}
          >
            <MessageSquare className="h-5 w-5 mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{conversation.title}</p>
              <p className="text-sm text-gray-500">
                {format(new Date(conversation.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
} 