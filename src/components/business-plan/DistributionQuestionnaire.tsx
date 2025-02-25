import { useState, useEffect, useRef } from 'react'
import { Send, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'react-toastify'

/**
 * Props for the DistributionQuestionnaire component
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
 * Interface for structured distribution strategy data
 */
interface DistributionData {
  distributionChannels?: string[]
  primaryChannel?: string
  channelStrategy?: string
  logisticsApproach?: string
  partnershipStrategy?: string
  costStructure?: string
  innovativeApproaches?: string[]
}

/**
 * Questions to guide the user through the distribution questionnaire
 */
const DISTRIBUTION_QUESTIONS = [
  "What distribution channels will you use to reach customers?",
  "Which channel will be your primary method of distribution?",
  "How will you manage your distribution process?",
  "What is your logistics and fulfillment approach?",
  "Will you work with partners or intermediaries?",
  "What are the costs associated with your distribution strategy?",
  "Are there any innovative or unique distribution methods you'll employ?"
]

/**
 * Initial system message to set context for the chat
 */
const INITIAL_SYSTEM_MESSAGE: Message = {
  role: 'system',
  content: `You are a helpful business planning assistant focused on helping the user define their distribution strategy.
  
  Guide the user through describing:
  1. Their distribution channels (retail, e-commerce, direct sales, etc.)
  2. Their primary distribution method and why it's appropriate
  3. How they'll manage the distribution process
  4. Their logistics and fulfillment approach
  5. Any partnerships or intermediaries they'll work with
  6. The costs associated with their distribution strategy
  7. Any innovative or unique distribution methods
  
  Ask questions one at a time and wait for responses. Be conversational and helpful.
  Provide examples when asked. Avoid technical jargon.
  
  Your goal is to help the user create a comprehensive description of their distribution strategy.`
}

/**
 * DistributionQuestionnaire component for gathering information about distribution strategy
 */
export default function DistributionQuestionnaire({ businessPlanId, onComplete }: Props) {
  // State for chat messages, loading status, and input value
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const [distributionData, setDistributionData] = useState<DistributionData | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  
  // Reference to the message container for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize chat with system message and first question
  useEffect(() => {
    const initialMessages: Message[] = [
      INITIAL_SYSTEM_MESSAGE,
      {
        role: 'assistant',
        content: `Let's define your distribution strategy - how your products or services will reach your customers. This is a critical part of your business plan.

First question: What distribution channels will you use to reach your customers? (Examples include retail stores, e-commerce, direct sales, distributors, etc.)`
      }
    ]
    setMessages(initialMessages)
  }, [])

  // Fetch existing distribution data when component mounts
  useEffect(() => {
    const fetchDistributionData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/business-plans/${businessPlanId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch business plan data')
        }
        
        const data = await response.json()
        console.log('Fetched business plan data:', data)
        
        // Check if distribution data exists in the response
        if (data.content?.distribution || data.distributionData) {
          const fetchedDistributionData = data.distributionData || data.content.distribution
          console.log('Found existing distribution data:', fetchedDistributionData)
          setDistributionData(fetchedDistributionData)
        }
      } catch (error) {
        console.error('Error fetching distribution data:', error)
        toast.error('Failed to load existing distribution data')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDistributionData()
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
      const response = await fetch(`/api/business-plans/${businessPlanId}/distribution`, {
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
      
      // Update distribution data if available
      if (data.distributionData) {
        setDistributionData(data.distributionData)
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
      const response = await fetch(`/api/business-plans/${businessPlanId}/distribution`, {
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
      
      // Update distribution data if available
      if (data.distributionData) {
        setDistributionData(data.distributionData)
      }
      
    } catch (error) {
      console.error('Error getting help:', error)
      toast.error('Failed to get help. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Formats distribution data into a structured text format
   */
  const formatDistributionData = (data: DistributionData): string => {
    if (!data) return ''

    let formattedText = '## Distribution Strategy\n\n'

    if (data.distributionChannels && data.distributionChannels.length > 0) {
      formattedText += '### Distribution Channels\n'
      data.distributionChannels.forEach(channel => {
        formattedText += `- ${channel}\n`
      })
      formattedText += '\n'
    }

    if (data.primaryChannel) {
      formattedText += `### Primary Distribution Method\n${data.primaryChannel}\n\n`
    }

    if (data.channelStrategy) {
      formattedText += `### Channel Management Strategy\n${data.channelStrategy}\n\n`
    }

    if (data.logisticsApproach) {
      formattedText += `### Logistics and Fulfillment\n${data.logisticsApproach}\n\n`
    }

    if (data.partnershipStrategy) {
      formattedText += `### Partnerships and Intermediaries\n${data.partnershipStrategy}\n\n`
    }

    if (data.costStructure) {
      formattedText += `### Distribution Costs\n${data.costStructure}\n\n`
    }

    if (data.innovativeApproaches && data.innovativeApproaches.length > 0) {
      formattedText += '### Innovative Distribution Methods\n'
      data.innovativeApproaches.forEach(approach => {
        formattedText += `- ${approach}\n`
      })
      formattedText += '\n'
    }

    return formattedText
  }

  /**
   * Handles saving the distribution data
   */
  const handleSave = () => {
    if (!distributionData) {
      toast.error('No distribution data to save')
      return
    }

    const formattedText = formatDistributionData(distributionData)
    onComplete(formattedText)
    toast.success('Distribution strategy saved successfully')
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

      {/* Right side - Distribution Data Display */}
      <div className="w-1/2 space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribution Strategy Information</h3>
          <div className="prose prose-sm max-w-none mb-4">
            <ReactMarkdown>{distributionData ? formatDistributionData(distributionData) : "No distribution data available yet. Complete the questionnaire to generate distribution strategy information."}</ReactMarkdown>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              disabled={!distributionData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Save Distribution Strategy
            </button>
          </div>
          
          {/* Show a message if distribution data exists */}
          {distributionData && distributionData.distributionChannels && distributionData.distributionChannels.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
              <p className="text-sm font-medium">Distribution strategy data is loaded and ready to save.</p>
              <p className="text-xs mt-1">You can continue the conversation to refine it, or click "Save Distribution Strategy" to use the current data.</p>
            </div>
          )}
          
          {/* Debug section - hidden by default */}
          {showDebug && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <details>
                <summary>Debug: Distribution Data</summary>
                <pre className="overflow-auto max-h-40 mt-1">
                  {JSON.stringify(distributionData, null, 2) || 'No distribution data'}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 