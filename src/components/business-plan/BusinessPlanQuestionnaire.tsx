import { useState } from 'react'
import { toast } from 'react-toastify'
import { HelpCircle, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import LoadingIndicator from './LoadingIndicator'

interface Props {
  businessPlanId: string
  onComplete: (section: string, content: any) => void
}

interface Message {
  role: 'assistant' | 'user'
  content: string
}

type BusinessPlanSection = 'executive_summary' | 'market_analysis' | 'products_services' | 'marketing_plan' | 'financial_projections' | 'operations'

const SECTIONS: BusinessPlanSection[] = [
  'executive_summary',
  'market_analysis',
  'products_services',
  'marketing_plan',
  'financial_projections',
  'operations'
]

const SECTION_TITLES: Record<BusinessPlanSection, string> = {
  executive_summary: 'Executive Summary',
  market_analysis: 'Market Analysis',
  products_services: 'Products & Services',
  marketing_plan: 'Marketing Plan',
  financial_projections: 'Financial Projections',
  operations: 'Operations'
}

export default function BusinessPlanQuestionnaire({ businessPlanId, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hi! I'll help you create a comprehensive business plan. Let's break it down into manageable steps. First, tell me about your business idea - what product or service do you plan to offer?" 
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInHelpMode, setIsInHelpMode] = useState(false)
  const [helpContext, setHelpContext] = useState<string[]>([])
  const [currentSection, setCurrentSection] = useState<BusinessPlanSection>('executive_summary')
  const [questionIndex, setQuestionIndex] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
      const userMessage: Message = { role: 'user', content: input }
      setMessages(prev => [...prev, userMessage])
      setInput('')

      const response = await fetch(`/api/business-plans/${businessPlanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: currentSection,
          questionIndex,
          answer: input,
          needsHelp: isInHelpMode,
          previousContext: isInHelpMode ? [...helpContext, input] : []
        })
      })

      if (!response.ok) throw new Error('Failed to process response')

      const data = await response.json()
      
      // Handle help mode response
      if (data.help) {
        setIsInHelpMode(true)
        setHelpContext(prev => [...prev, input])
        const helpMessage: Message = { 
          role: 'assistant', 
          content: data.help 
        }
        setMessages(prev => [...prev, helpMessage])
        return
      }
      
      // Handle normal response
      if (data.improvedAnswer) {
        const aiMessage: Message = { 
          role: 'assistant', 
          content: data.improvedAnswer 
        }
        setMessages(prev => [...prev, aiMessage])
        
        // If we have a next question in this section
        if (data.nextQuestion) {
          const nextQuestionMessage: Message = {
            role: 'assistant',
            content: data.nextQuestion
          }
          setMessages(prev => [...prev, nextQuestionMessage])
          setQuestionIndex(questionIndex + 1)
        }
        // If this section is complete
        else if (data.isComplete) {
          onComplete(currentSection, data.businessPlan.content[currentSection])
          
          // Move to next section if available
          const currentSectionIndex = SECTIONS.indexOf(currentSection)
          if (currentSectionIndex < SECTIONS.length - 1) {
            const nextSection = SECTIONS[currentSectionIndex + 1]
            setCurrentSection(nextSection)
            setQuestionIndex(0)
            
            // Add transition message
            const transitionMessage: Message = {
              role: 'assistant',
              content: `Great! We've completed the ${SECTION_TITLES[currentSection]}. Now let's move on to the ${SECTION_TITLES[nextSection]}. What do you know about this aspect of your business?`
            }
            setMessages(prev => [...prev, transitionMessage])
          } else {
            // Business plan is complete
            const completionMessage: Message = {
              role: 'assistant',
              content: "Congratulations! We've completed all sections of your business plan. You can now review and refine each section as needed."
            }
            setMessages(prev => [...prev, completionMessage])
          }
        }
        
        setIsInHelpMode(false)
        setHelpContext([])
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
      setIsInHelpMode(true)
      setHelpContext([])

      const response = await fetch(`/api/business-plans/${businessPlanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: currentSection,
          questionIndex,
          needsHelp: true,
          previousContext: []
        })
      })

      if (!response.ok) throw new Error('Failed to get help')

      const data = await response.json()
      const helpMessage: Message = { 
        role: 'assistant', 
        content: data.help 
      }
      setMessages(prev => [...prev, helpMessage])
    } catch (error) {
      console.error('Error getting help:', error)
      toast.error('Failed to get help')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900">
            {SECTION_TITLES[currentSection]}
          </h3>
          <span className="text-sm text-gray-500">
            Question {questionIndex + 1}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ 
              width: `${((SECTIONS.indexOf(currentSection) * 100 + (questionIndex + 1) * 20) / (SECTIONS.length * 100)) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Chat messages */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 bg-gray-50 rounded-lg">
        {messages.map((message, index) => (
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
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer..."
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
        {!isInHelpMode && (
          <button
            type="button"
            onClick={handleNotSure}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Help me
          </button>
        )}
      </form>
    </div>
  )
} 