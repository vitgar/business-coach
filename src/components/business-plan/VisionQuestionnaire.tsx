import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import { HelpCircle, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Props {
  businessPlanId: string
  onComplete: (visionText: string) => void
}

interface Message {
  role: 'assistant' | 'user' | 'system'
  content: string
}

interface VisionData {
  longTermVision?: string;
  yearOneGoals?: string[];
  yearThreeGoals?: string[];
  yearFiveGoals?: string[];
  alignmentExplanation?: string;
}

// Questions focused strictly on vision and goals
const VISION_QUESTIONS = [
  "What is your core business vision? Describe the long-term impact and change you want to create with your business.",
  "What specific, measurable goals do you want to achieve in your first year of operation? (Focus on metrics like revenue, customers, market share, etc.)",
  "Looking ahead to three years, what quantifiable goals do you aim to achieve? How will you measure this growth?",
  "What are your five-year goals? What specific metrics and milestones will indicate success?",
  "How do these progressive goals align with and support your overall business strategy?"
]

const INITIAL_MESSAGE: Message = { 
  role: 'assistant', 
  content: "Let's focus on your business vision and goals. A clear vision will guide your business's direction, while specific goals will mark the path to achieve it. First, what is your core business vision - the fundamental change or impact you want your business to create?" 
}

// System message to keep responses focused on vision and goals
const FOCUS_REMINDER: Message = {
  role: 'system',
  content: "Do not respond with long multiple steps answers, guide the user step by step asking one question at a time and wait for the answer. If the user asks for help, expresses uncertainty, or requests examples, provide 2-3 concrete examples that are specific and measurable. After providing examples, always ask if they want to use one of the examples directly or modify their current vision/goals with ideas from the examples. Keep the conversation focused on vision and goals. If the user starts discussing implementation, marketing, or other topics, gently guide them back to defining their vision and specific, measurable goals for years 1, 3, and 5."
}

export default function VisionQuestionnaire({ businessPlanId, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [visionData, setVisionData] = useState<VisionData>({})
  const [isLoading, setIsLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Fetch existing vision data when component mounts
  useEffect(() => {
    const fetchVisionData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/business-plans/${businessPlanId}`)
        if (!response.ok) throw new Error('Failed to fetch business plan')
        
        const data = await response.json()
        console.log('Fetched business plan data:', data)
        
        // Check for vision data in the response
        if (data.content?.vision || data.visionData) {
          const fetchedVisionData = data.visionData || data.content.vision
          console.log('Found existing vision data:', fetchedVisionData)
          setVisionData(fetchedVisionData)
        }
      } catch (error) {
        console.error('Error fetching vision data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchVisionData()
  }, [businessPlanId])

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [messages, isLoading])

  // Format vision data into a readable string
  const formatVisionText = (data: VisionData): string => {
    const parts = []
    
    if (data.longTermVision) {
      parts.push('### Long-Term Vision\n' + data.longTermVision + '\n')
    }
    
    if (data.yearOneGoals?.length) {
      parts.push('### First Year Goals\n' + data.yearOneGoals.map(g => '- ' + g).join('\n') + '\n')
    }
    
    if (data.yearThreeGoals?.length) {
      parts.push('### Three-Year Goals\n' + data.yearThreeGoals.map(g => '- ' + g).join('\n') + '\n')
    }
    
    if (data.yearFiveGoals?.length) {
      parts.push('### Five-Year Goals\n' + data.yearFiveGoals.map(g => '- ' + g).join('\n') + '\n')
    }
    
    if (data.alignmentExplanation) {
      parts.push('### Goal Alignment\n' + data.alignmentExplanation)
    }
    
    return parts.join('\n')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
      const userMessage: Message = { role: 'user', content: input }
      setMessages(prev => [...prev, userMessage])
      setInput('')

      const response = await fetch(`/api/business-plans/${businessPlanId}/vision`, {
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
      
      // Update vision data if available
      if (data.visionData) {
        console.log('Received vision data from API:', data.visionData);
        setVisionData(data.visionData)
      }
      
    } catch (error) {
      console.error('Error in conversation:', error)
      toast.error('Failed to process response')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotSure = async () => {
    try {
      setIsLoading(true)

      // Add a system message for help that maintains focus on vision and goals
      const helpMessage: Message = {
        role: 'system',
        content: `The user needs help defining their vision and goals. Break down the current question into simpler parts and provide 2-3 specific examples. Format your response as:

"Let me help you with some examples:

1. [Specific example with numbers/metrics]
2. [Specific example with numbers/metrics]
3. [Specific example with numbers/metrics]

Would you like to:
- Use one of these examples as your [vision/goal]?
- Modify your current one with some ideas from these examples?
- See different examples?

Keep examples concrete and measurable. Maintain focus on vision and goals. Avoid implementation details."`
      }

      const response = await fetch(`/api/business-plans/${businessPlanId}/vision`, {
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

  return (
    <div className="flex gap-6">
      {/* Left side - Chat */}
      <div className="w-1/2 space-y-4">
        <div 
          ref={chatContainerRef}
          className="h-[600px] overflow-y-auto p-4 bg-gray-50 rounded-lg scroll-smooth"
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
        </div>

        {/* Chat input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
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

      {/* Right side - Vision Text Editor */}
      <div className="w-1/2 space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <h3 className="text-lg font-medium text-blue-700 mb-4">Vision and Business Goals</h3>
          <div className="prose prose-sm max-w-none mb-4 prose-headings:text-blue-600 prose-headings:font-medium prose-headings:text-base prose-p:text-gray-700 prose-li:text-gray-700">
            <ReactMarkdown>{formatVisionText(visionData)}</ReactMarkdown>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                const formattedText = formatVisionText(visionData);
                console.log('Saving vision data:', visionData);
                console.log('Formatted vision text:', formattedText);
                onComplete(formattedText);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Vision & Goals
            </button>
          </div>
          
          {/* Show a message if vision data exists */}
          {visionData.longTermVision && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
              <p className="text-sm font-medium">Vision data is loaded and ready to save.</p>
              <p className="text-xs mt-1">You can continue the conversation to refine it, or click "Save Vision & Goals" to use the current data.</p>
            </div>
          )}
          
          {/* Debug display - completely hidden */}
          {false && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <details>
                <summary>Debug: Vision Data</summary>
                <pre className="overflow-auto max-h-40 mt-1">
                  {JSON.stringify(visionData, null, 2)}
                </pre>
              </details>
              <details className="mt-2">
                <summary>Debug: Formatted Vision Text</summary>
                <pre className="overflow-auto max-h-40 mt-1">
                  {formatVisionText(visionData) || 'No formatted vision text'}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 