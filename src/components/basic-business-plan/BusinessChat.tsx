'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, ArrowRight } from 'lucide-react'
import { toast } from 'react-toastify'
import ReactMarkdown from 'react-markdown'
import { API_ENDPOINTS } from '@/config/constants'

/**
 * BusinessChat Component Props
 */
interface BusinessChatProps {
  currentBusinessId: string | null;
  onApplySuggestion?: (content: string) => void;
}

/**
 * Chat Message Interface
 */
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  id?: string;
  hasSuggestion?: boolean;
  suggestion?: string;
}

/**
 * BusinessChat Component
 * 
 * Provides a specialized chat interface for business plan guidance:
 * - Sends messages to the chat API with business context
 * - Displays conversation history with markdown formatting
 * - Offers a simple input for user questions
 * - Allows applying suggestions to the business plan editor
 */
export default function BusinessChat({ currentBusinessId, onApplySuggestion }: BusinessChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'You are a helpful business coach assistant. Help the user create and improve their business plan.'
    },
    {
      role: 'assistant',
      content: "👋 I'm your Business Plan Coach! I'm here to help you create and refine your business plan. You can ask me questions about any section, request suggestions, or get feedback on your ideas. What would you like help with today?"
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle sending a new message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    if (!currentBusinessId) {
      toast.error('Please select a business first')
      return
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const contextMessages = getContextMessages(messages, userMessage)
      
      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: contextMessages,
          businessId: currentBusinessId,
          context: 'business_plan',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to send message')
      }

      const data = await response.json()
      
      // Check if the response contains potential content that could be applied
      // This is a simple detection - in a real system you'd have more structured data
      let hasSuggestion = false
      let suggestion = ''
      
      // Simple heuristic to detect if message contains a suggestion
      // In production, you'd have a more structured API response
      if (data.message.content.includes('```html') || 
          data.message.content.includes('<h1>') ||
          data.message.content.includes('<p>')) {
        
        hasSuggestion = true
        
        // Extract HTML-like content from the message
        // This is a simplistic approach - in production you'd have a more robust solution
        const htmlMatch = data.message.content.match(/```html\n([\s\S]*?)\n```/) || 
                         data.message.content.match(/<([hp][1-6]?)>([\s\S]*?)(<\/\1>)/)
        
        if (htmlMatch) {
          suggestion = htmlMatch[1] || data.message.content
        } else {
          // If no clear HTML block, just use the whole message as suggestion
          suggestion = data.message.content
        }
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message.content,
        id: data.id,
        hasSuggestion,
        suggestion
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Gets relevant context messages to send to the API
   * Limits context size to prevent token limit issues
   */
  const getContextMessages = (allMessages: ChatMessage[], newMessage: ChatMessage): ChatMessage[] => {
    // Always include the system message
    const systemMessage = allMessages.find(m => m.role === 'system');
    const contextMessages = systemMessage ? [systemMessage] : [];
    
    // Add the most recent messages up to a reasonable limit
    const recentMessages = [...allMessages.filter(m => m.role !== 'system'), newMessage]
      .slice(-10); // Limit to last 10 messages for context
    
    return [...contextMessages, ...recentMessages];
  }

  /**
   * Handle applying a suggestion to the business plan
   */
  const handleApplySuggestion = (suggestion: string) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion)
      toast.success('Suggestion applied to business plan')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages display */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.filter(m => m.role !== 'system').map((message, index) => (
            <div key={index} className="space-y-2">
              <div
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
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
              
              {/* Add suggestion action button if applicable */}
              {message.role === 'assistant' && message.hasSuggestion && onApplySuggestion && (
                <div className="flex justify-start pl-2">
                  <button
                    onClick={() => handleApplySuggestion(message.suggestion || '')}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Apply this suggestion
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[80%]">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question about your business plan..."
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`p-2 rounded-md ${
              isLoading || !input.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
} 