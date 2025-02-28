import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import { HelpCircle, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import LoadingIndicator from './LoadingIndicator'

/**
 * Props for the CompanyOverviewQuestionnaire component
 */
interface Props {
  /**
   * The ID of the business plan this questionnaire is for
   */
  businessPlanId: string
  
  /**
   * Function to call when the questionnaire is completed
   * @param overviewText - Formatted text content for the company overview
   */
  onComplete: (overviewText: string) => void
}

/**
 * Message object representing a chat message in the conversation
 */
interface Message {
  role: 'assistant' | 'user' | 'system'
  content: string
}

/**
 * Company overview data structure
 */
interface CompanyOverviewData {
  /**
   * The business name and basic information
   */
  businessName?: string;
  
  /**
   * The founding story and history of the business
   */
  foundingStory?: string;
  
  /**
   * The current stage of business development
   */
  currentStage?: string;
  
  /**
   * Core business activities
   */
  coreActivities?: string[];
  
  /**
   * Key milestones achieved or planned
   */
  keyMilestones?: string[];
  
  /**
   * Business model summary
   */
  businessModel?: string;
}

// Questions focused on company overview
const COMPANY_OVERVIEW_QUESTIONS = [
  "What is your business name and what does it do at a high level?",
  "What's the founding story or history behind your business?",
  "What stage is your business currently in? (e.g., idea, startup, established)",
  "What are the core activities or operations of your business?",
  "What key milestones have you achieved or plan to achieve soon?",
  "How does your business make money? Summarize your business model."
]

const INITIAL_MESSAGE: Message = { 
  role: 'assistant', 
  content: "Let's focus on developing your company overview. This section helps readers understand what your business does, how it started, and its current status. First, what is your business name and what does it do at a high level?" 
}

// System message to keep responses focused on company overview
const FOCUS_REMINDER: Message = {
  role: 'system',
  content: "Do not respond with long multiple steps answers, guide the user step by step asking one question at a time and wait for the answer. If the user asks for help, expresses uncertainty, or requests examples, provide 2-3 concrete examples that are specific and realistic. After providing examples, always ask if they want to use one of the examples directly or modify their response with ideas from the examples. Keep the conversation focused on company overview topics. If the user starts discussing unrelated topics, gently guide them back to defining their company overview information."
}

/**
 * CompanyOverviewQuestionnaire component
 * 
 * Provides an interactive chat interface for gathering company overview information
 * and displays a formatted preview of the information that can be saved.
 */
export default function CompanyOverviewQuestionnaire({ businessPlanId, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [companyOverviewData, setCompanyOverviewData] = useState<CompanyOverviewData>({})
  const [isLoading, setIsLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch existing company overview data when component mounts
  useEffect(() => {
    const fetchCompanyOverviewData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/business-plans/${businessPlanId}`)
        if (!response.ok) throw new Error('Failed to fetch business plan')
        
        const data = await response.json()
        console.log('Fetched business plan data:', data)
        
        // Check for company overview data in the response
        if (data.content?.companyOverview) {
          const fetchedOverviewData = data.content.companyOverview
          console.log('Found existing company overview data:', fetchedOverviewData)
          setCompanyOverviewData(fetchedOverviewData)
        }
      } catch (error) {
        console.error('Error fetching company overview data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCompanyOverviewData()
  }, [businessPlanId])

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [messages, isLoading])

  // Format company overview data into a readable string
  const formatOverviewText = (data: CompanyOverviewData): string => {
    const parts = []
    
    if (data.businessName) {
      parts.push('### Business Name and Overview\n' + data.businessName + '\n')
    }
    
    if (data.foundingStory) {
      parts.push('### Founding Story\n' + data.foundingStory + '\n')
    }
    
    if (data.currentStage) {
      parts.push('### Current Business Stage\n' + data.currentStage + '\n')
    }
    
    if (data.coreActivities?.length) {
      parts.push('### Core Business Activities\n' + data.coreActivities.map(a => '- ' + a).join('\n') + '\n')
    }
    
    if (data.keyMilestones?.length) {
      parts.push('### Key Milestones\n' + data.keyMilestones.map(m => '- ' + m).join('\n') + '\n')
    }
    
    if (data.businessModel) {
      parts.push('### Business Model\n' + data.businessModel)
    }
    
    return parts.join('\n')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
      const userMessage: Message = { role: 'user', content: input }
      setMessages(prev => [...prev, userMessage])
      setInput('')

      // We'll implement the API endpoint later
      const response = await fetch(`/api/business-plans/${businessPlanId}/company-overview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, FOCUS_REMINDER, userMessage],
          isFirstMessage: messages.length === 1
        })
      })

      if (!response.ok) throw new Error('Failed to process response')

      const data = await response.json()
      
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message.content 
      }
      setMessages(prev => [...prev, assistantMessage])
      
      // Update company overview data if available
      if (data.companyOverviewData) {
        console.log('Received company overview data from API:', data.companyOverviewData);
        setCompanyOverviewData(data.companyOverviewData)
      }
      
    } catch (error) {
      console.error('Error in conversation:', error)
      toast.error('Failed to process response')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotSure = async (e: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    e.preventDefault()
    e.stopPropagation()
    
    try {
      setIsLoading(true)

      // Add a system message for help that maintains focus on company overview
      const helpMessage: Message = {
        role: 'system',
        content: `The user needs help defining their company overview information. Break down the current question into simpler parts and provide 2-3 specific examples. Format your response as:

"Let me help you with some examples:

1. [Specific example]
2. [Specific example]
3. [Specific example]

Would you like to:
- Use one of these examples as your response?
- Modify your current response with some ideas from these examples?
- See different examples?

Keep examples concrete and realistic. Maintain focus on company overview information. Avoid unrelated details."`
      }

      const response = await fetch(`/api/business-plans/${businessPlanId}/company-overview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, helpMessage, { role: 'user', content: "I need some examples to help me think about this." }],
          isFirstMessage: false
        })
      })

      if (!response.ok) throw new Error('Failed to get help')

      const data = await response.json()
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message.content 
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error getting help:', error)
      toast.error('Failed to get help')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle save button click with propagation prevention
  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const formattedText = formatOverviewText(companyOverviewData);
    console.log('Saving company overview data:', companyOverviewData);
    console.log('Formatted company overview text:', formattedText);
    onComplete(formattedText);
  }

  return (
    <div className="flex gap-6">
      {/* Left side - Chat */}
      <div className="w-1/2 space-y-4">
        <div 
          ref={chatContainerRef}
          className="h-[600px] overflow-y-auto p-4 bg-gray-50 rounded-lg scroll-smooth"
          onClick={(e) => e.stopPropagation()} // Stop click propagation in chat container
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              } mb-4`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <LoadingIndicator type="spinner" />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <form 
          onSubmit={handleSubmit} 
          className="flex gap-2"
          onClick={(e) => e.stopPropagation()} // Stop click propagation in form
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
            onClick={(e) => e.stopPropagation()} // Stop click propagation on input
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation(); // Stop click propagation on submit button
              if (!input.trim() || isLoading) e.preventDefault();
            }}
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

      {/* Right side - Company Overview Text Editor */}
      <div className="w-1/2 space-y-4">
        <div 
          className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500"
          onClick={(e) => e.stopPropagation()} // Stop click propagation in preview container
        >
          <h3 className="text-lg font-medium text-blue-700 mb-4">Company Overview</h3>
          <div className="prose prose-sm max-w-none mb-4 prose-headings:text-blue-600 prose-headings:font-medium prose-headings:text-base prose-p:text-gray-700 prose-li:text-gray-700">
            <ReactMarkdown>{formatOverviewText(companyOverviewData)}</ReactMarkdown>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSaveClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Company Overview
            </button>
          </div>
          
          {/* Show a message if company overview data exists */}
          {companyOverviewData.businessName && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
              <p className="text-sm font-medium">Company overview data is loaded and ready to save.</p>
              <p className="text-xs mt-1">You can continue the conversation to refine it, or click "Save Company Overview" to use the current data.</p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  )
} 