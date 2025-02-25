import { useState, useEffect, useRef } from 'react'
import { Send, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'react-toastify'

/**
 * Props for the MarketsQuestionnaire component
 */
interface Props {
  businessPlanId: string
  onComplete: (text: string) => void
}

/**
 * Interface for chat messages
 */
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/**
 * Interface for structured markets data
 */
interface MarketsData {
  targetMarket?: string
  marketSize?: string
  customerSegments?: string[]
  customerNeeds?: string[]
  marketTrends?: string[]
  competitiveLandscape?: string
}

/**
 * Questions to guide the user through the markets questionnaire
 */
const MARKETS_QUESTIONS = [
  "Who are your target customers or market segments?",
  "What is the estimated size of your target market?",
  "What specific customer segments are you targeting?",
  "What customer needs or problems does your business address?",
  "What are the current trends in your target market?",
  "Who are your main competitors and what is your competitive position?"
]

/**
 * Initial system message to set context for the chat
 */
const INITIAL_SYSTEM_MESSAGE: Message = {
  role: 'system',
  content: `You are a helpful business planning assistant focused on helping the user define their target markets and customers.
  
  Guide the user through describing:
  1. Their target market and customer demographics
  2. The size and growth potential of their market
  3. Specific customer segments they're targeting
  4. Customer needs, pain points, and how the business addresses them
  5. Current market trends and how they impact the business
  6. The competitive landscape and the business's position
  
  Ask questions one at a time and wait for responses. Be conversational and helpful.
  Provide examples when asked. Avoid technical jargon.
  
  Your goal is to help the user create a comprehensive description of their target markets and customers.`
}

/**
 * MarketsQuestionnaire component for gathering information about target markets and customers
 */
export default function MarketsQuestionnaire({ businessPlanId, onComplete }: Props) {
  // State for chat messages, loading status, and input value
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const [marketsData, setMarketsData] = useState<MarketsData | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  
  // Reference to the message container for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize chat with system message and first question
  useEffect(() => {
    const initialMessages: Message[] = [
      INITIAL_SYSTEM_MESSAGE,
      {
        role: 'assistant',
        content: `Let's define the markets and customers your business will serve. This will help clarify who you're targeting and how you'll position your offerings.

First question: Who are your target customers or market segments? Please describe them in terms of demographics, behaviors, needs, or any other relevant characteristics.`
      }
    ]
    setMessages(initialMessages)
  }, [])

  // Fetch existing markets data when component mounts
  useEffect(() => {
    const fetchMarketsData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/business-plans/${businessPlanId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch business plan data')
        }
        
        const data = await response.json()
        console.log('Fetched business plan data:', data)
        
        // Check if markets data exists in the response
        if (data.content?.markets || data.marketsData) {
          const fetchedMarketsData = data.marketsData || data.content.markets
          console.log('Found existing markets data:', fetchedMarketsData)
          setMarketsData(fetchedMarketsData)
        }
      } catch (error) {
        console.error('Error fetching markets data:', error)
        toast.error('Failed to load existing markets data')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchMarketsData()
  }, [businessPlanId])

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /**
   * Handles form submission for sending messages
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Send message to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/markets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].filter(m => m.role !== 'system'),
          isFirstMessage: messages.length <= 2 // Only includes system and first assistant message
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()
      
      // Add assistant response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message.content 
      }])
      
      // Update markets data if available
      if (data.marketsData) {
        setMarketsData(data.marketsData)
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handles the "Help me" button click
   * Sends a request for examples or guidance
   */
  const handleNotSure = async () => {
    try {
      setIsLoading(true)

      // Create a help message
      const helpMessage: Message = { 
        role: 'user', 
        content: "I need some examples to help me think about this." 
      }
      
      setMessages(prev => [...prev, helpMessage])

      // Send message to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/markets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, helpMessage].filter(m => m.role !== 'system'),
          isFirstMessage: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get help')
      }

      const data = await response.json()
      
      // Add assistant response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message.content 
      }])
      
      // Update markets data if available
      if (data.marketsData) {
        setMarketsData(data.marketsData)
      }
      
    } catch (error) {
      console.error('Error getting help:', error)
      toast.error('Failed to get help. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Formats markets data into a structured text format
   */
  const formatMarketsData = (data: MarketsData): string => {
    if (!data) return ''

    let formattedText = '### Target Markets and Customers\n\n'

    if (data.targetMarket) {
      formattedText += `#### Target Market\n${data.targetMarket}\n\n`
    }

    if (data.marketSize) {
      formattedText += `#### Market Size\n${data.marketSize}\n\n`
    }

    if (data.customerSegments && data.customerSegments.length > 0) {
      formattedText += '#### Customer Segments\n'
      data.customerSegments.forEach(segment => {
        formattedText += `- ${segment}\n`
      })
      formattedText += '\n'
    }

    if (data.customerNeeds && data.customerNeeds.length > 0) {
      formattedText += '#### Customer Needs\n'
      data.customerNeeds.forEach(need => {
        formattedText += `- ${need}\n`
      })
      formattedText += '\n'
    }

    if (data.marketTrends && data.marketTrends.length > 0) {
      formattedText += '#### Market Trends\n'
      data.marketTrends.forEach(trend => {
        formattedText += `- ${trend}\n`
      })
      formattedText += '\n'
    }

    if (data.competitiveLandscape) {
      formattedText += `#### Competitive Landscape\n${data.competitiveLandscape}\n\n`
    }

    return formattedText
  }

  /**
   * Handles saving the markets data
   */
  const handleSave = () => {
    if (!marketsData) {
      toast.error('No markets data to save')
      return
    }

    const formattedText = formatMarketsData(marketsData)
    onComplete(formattedText)
    toast.success('Markets data saved successfully')
  }

  return (
    <div className="flex gap-6">
      {/* Left side - Chat */}
      <div className="w-1/2 space-y-4">
        <div className="h-[600px] overflow-y-auto p-4 bg-gray-50 rounded-lg scroll-smooth">
          {messages.filter(m => m.role !== 'system').map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[80%] rounded-lg p-3 bg-white border border-gray-200">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your response..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNotSure}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Help me
          </button>
        </form>
      </div>

      {/* Right side - Markets Data Display */}
      <div className="w-1/2 space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <h3 className="text-lg font-medium text-orange-700 mb-4">Markets and Customers Information</h3>
          <div className="prose prose-sm max-w-none mb-4 prose-headings:text-orange-600 prose-headings:font-medium prose-headings:text-base prose-p:text-gray-700 prose-li:text-gray-700">
            <ReactMarkdown>{marketsData ? formatMarketsData(marketsData) : "No markets data available yet. Complete the questionnaire to generate markets information."}</ReactMarkdown>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              disabled={!marketsData}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              Save Markets Information
            </button>
          </div>
          
          {/* Show a message if markets data exists */}
          {marketsData && marketsData.targetMarket && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
              <p className="text-sm font-medium">Markets data is loaded and ready to save.</p>
              <p className="text-xs mt-1">You can continue the conversation to refine it, or click "Save Markets Information" to use the current data.</p>
            </div>
          )}
          
          {/* Debug section - hidden by default */}
          {showDebug && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <details>
                <summary>Debug: Markets Data</summary>
                <pre className="overflow-auto max-h-40 mt-1">
                  {JSON.stringify(marketsData, null, 2) || 'No markets data'}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 