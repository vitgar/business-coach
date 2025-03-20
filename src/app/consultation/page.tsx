'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'
import Chat from '@/components/Chat'
import ConversationList from '@/components/ConversationList'
import HeaderBar from '@/components/layout/HeaderBar'

/**
 * ConsultationPage component
 * 
 * Main page for the AI Business Coach chat interface.
 * Shows conversation history on the left and the chat interface on the right.
 */
export default function ConsultationPage() {
  const [currentConversationId, setCurrentConversationId] = useState<string>()

  /**
   * Handles when a conversation is selected from the list
   * @param id - ID of the selected conversation
   */
  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id)
  }

  /**
   * Handles when the New Chat button is clicked
   */
  const handleNewChat = () => {
    setCurrentConversationId(undefined)
  }

  /**
   * Handles when a new conversation is created
   * @param id - ID of the newly created conversation
   */
  const handleConversationCreated = (id: string) => {
    setCurrentConversationId(id)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <HeaderBar 
        onNewChat={handleNewChat}
        isOnDashboard={false}
      />
      <main className="flex-1 overflow-hidden flex">
        <ConversationList
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
          selectedId={currentConversationId}
        />
        <div className="flex-1">
          <Chat
            key={currentConversationId || 'new'}
            conversationId={currentConversationId}
            onConversationCreated={handleConversationCreated}
          />
        </div>
      </main>
    </div>
  )
} 