'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChatMessage, ChatResponse, Role } from '@/types/chat'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { API_ENDPOINTS, INITIAL_MESSAGES, ASSISTANT_CONFIG } from '@/config/constants'
import ReactMarkdown from 'react-markdown'

/**
 * Chat component that handles displaying chat messages, message input, and API interactions
 * 
 * @param conversationId - Optional ID of an existing conversation to load
 * @param onConversationCreated - Callback when a new conversation is created, passing the ID
 */
interface ChatProps {
  conversationId?: string
  onConversationCreated?: (id: string) => void
}

export default function Chat({ conversationId, onConversationCreated }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: ASSISTANT_CONFIG.INSTRUCTIONS
    },
    {
      role: 'assistant',
      content: INITIAL_MESSAGES.WELCOME
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversation when ID changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    } else {
      // Reset to initial state for new chat
      setMessages([
        {
          role: 'system',
          content: ASSISTANT_CONFIG.INSTRUCTIONS
        },
        {
          role: 'assistant',
          content: INITIAL_MESSAGES.WELCOME
        }
      ])
    }
  }, [conversationId])

  /**
   * Loads an existing conversation from the API
   * @param id - The conversation ID to load
   */
  const loadConversation = async (id: string) => {
    try {
      setIsLoadingConversation(true)
      const response = await fetch(`/api/conversations/${id}`)
      if (!response.ok) throw new Error('Failed to load conversation')
      const data = await response.json()
      
      // Ensure system message is included
      const systemMessage = {
        role: 'system' as Role,
        content: ASSISTANT_CONFIG.INSTRUCTIONS
      }
      
      const conversationMessages = data.messages.map((msg: any) => ({
        role: msg.role as Role,
        content: msg.content,
        id: msg.id
      }))
      
      setMessages([systemMessage, ...conversationMessages])
    } catch (error) {
      console.error('Error loading conversation:', error)
      toast.error('Failed to load conversation')
    } finally {
      setIsLoadingConversation(false)
    }
  }

  /**
   * Saves a new conversation to the API
   * @param title - Title for the new conversation
   * @param newMessages - Messages to save in the conversation
   * @returns The created conversation data
   */
  const saveConversation = async (title: string, newMessages: ChatMessage[]) => {
    try {
      // Filter out system messages when saving
      const messagesToSave = newMessages.filter(msg => msg.role !== 'system')
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          messages: messagesToSave.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      })

      if (!response.ok) throw new Error('Failed to save conversation')
      
      const data = await response.json()
      if (onConversationCreated) {
        onConversationCreated(data.id)
      }
      return data
    } catch (error) {
      console.error('Error saving conversation:', error)
      toast.error('Failed to save conversation')
    }
  }

  /**
   * Updates an existing conversation in the API
   * @param id - The conversation ID to update
   * @param newMessages - The updated messages for the conversation
   */
  const updateConversation = async (id: string, newMessages: ChatMessage[]) => {
    try {
      // Filter out system messages when saving
      const messagesToSave = newMessages.filter(msg => msg.role !== 'system')
      
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSave.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      })

      if (!response.ok) throw new Error('Failed to update conversation')
    } catch (error) {
      console.error('Error updating conversation:', error)
      toast.error('Failed to update conversation')
    }
  }

  /**
   * Gets a subset of messages that fit within context limits
   * @param allMessages - All messages in the conversation
   * @param newMessage - The new message being added
   * @returns A subset of messages that fit within context limits
   */
  const getContextMessages = (allMessages: ChatMessage[], newMessage: ChatMessage): ChatMessage[] => {
    // Always include the system message
    const systemMessage = allMessages.find(m => m.role === 'system');
    const contextMessages = systemMessage ? [systemMessage] : [];
    
    // Add the most recent messages up to the limit
    const recentMessages = [...allMessages.filter(m => m.role !== 'system'), newMessage]
      .slice(-ASSISTANT_CONFIG.MAX_CONTEXT_MESSAGES);
    
    // Calculate total content length (rough approximation of tokens)
    let totalLength = 0;
    const messagesToInclude: ChatMessage[] = [];
    
    for (const msg of recentMessages.reverse()) { // Start from most recent
      const messageLength = msg.content.length;
      if (totalLength + messageLength > ASSISTANT_CONFIG.MAX_CONTEXT_LENGTH) {
        break;
      }
      messagesToInclude.unshift(msg); // Add to start to maintain order
      totalLength += messageLength;
    }
    
    return [...contextMessages, ...messagesToInclude];
  }

  /**
   * Scrolls the chat to the bottom
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /**
   * Handles form submission to send a message
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const isFirstMessage = !conversationId && messages.length <= 2 // Account for system message
      const contextMessages = getContextMessages(messages, userMessage);
      
      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: contextMessages,
          isFirstMessage
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to send message')
      }

      const data: ChatResponse & { title?: string } = await response.json()
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message.content,
        id: data.id
      }

      const newMessages = [...messages, userMessage, assistantMessage]
      setMessages(newMessages)

      // If this is a new conversation, save it with the generated title
      if (isFirstMessage && data.title) {
        await saveConversation(data.title, newMessages)
      } else if (conversationId) {
        // Update existing conversation
        await updateConversation(conversationId, newMessages)
      }
    } catch (error) {
      console.error('Chat error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {isLoadingConversation ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>Loading conversation...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.filter(m => m.role !== 'system').map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                  <div className="animate-pulse flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your business coach..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            disabled={isLoading || isLoadingConversation}
          />
          <button
            type="submit"
            disabled={isLoading || isLoadingConversation || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
} 