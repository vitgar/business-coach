'use client'

import { useState } from 'react'
import Chat from '@/components/Chat'
import Logo from '@/components/Logo'
import ConversationList from '@/components/ConversationList'

export default function ConsultationPage() {
  const [currentConversationId, setCurrentConversationId] = useState<string>()

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id)
  }

  const handleNewChat = () => {
    setCurrentConversationId(undefined)
  }

  const handleConversationCreated = (id: string) => {
    setCurrentConversationId(id)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-600 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Logo />
            <div>
              <h1 className="text-2xl font-bold mb-1">AI Business Coach</h1>
              <p className="text-blue-100 text-sm">
                Get instant guidance and answers to your business questions
              </p>
            </div>
          </div>
        </div>
      </header>
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