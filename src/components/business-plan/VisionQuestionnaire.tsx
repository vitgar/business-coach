import { useState } from 'react'
import { toast } from 'react-toastify'
import { HelpCircle, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Props {
  businessPlanId: string
  onComplete: (visionText: string) => void
}

interface Message {
  role: 'assistant' | 'user'
  content: string
}

const QUESTIONS = [
  "What is the long-term vision of your business?",
  "What are your one-year goals? Can you quantify them?",
  "What are your three-year goals? How will you measure success?",
  "What are your five-year goals? What metrics will you use?",
  "How do these goals align with your overall business strategy?"
]

export default function VisionQuestionnaire({ businessPlanId, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hi! I'm here to help you develop your business vision and goals. Don't worry if you're not sure about all the details yet - we'll figure it out together, step by step. Let's start with something simple: what inspired you to start this business journey? What problem or opportunity caught your attention?" 
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [isInHelpMode, setIsInHelpMode] = useState(false)
  const [helpContext, setHelpContext] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
      const userMessage: Message = { role: 'user', content: input }
      setMessages(prev => [...prev, userMessage])
      setInput('')

      if (isInHelpMode) {
        // In help mode, send the answer along with previous context
        const response = await fetch(`/api/business-plans/${businessPlanId}/vision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: QUESTIONS[currentQuestionIndex],
            answer: input,
            needsHelp: true,
            previousContext: [...helpContext, input]
          })
        })

        if (!response.ok) throw new Error('Failed to get help')

        const data = await response.json()
        setHelpContext(prev => [...prev, input])
        const helpMessage: Message = { 
          role: 'assistant', 
          content: data.help 
        }
        setMessages(prev => [...prev, helpMessage])
      } else {
        // Normal answer flow
        const response = await fetch(`/api/business-plans/${businessPlanId}/vision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: QUESTIONS[currentQuestionIndex],
            answer: input,
            needsHelp: false
          })
        })

        if (!response.ok) throw new Error('Failed to process response')

        const data = await response.json()
        
        // If we got a help response, switch to help mode
        if (data.help) {
          setIsInHelpMode(true)
          setHelpContext([input])
          const helpMessage: Message = {
            role: 'assistant',
            content: data.help
          }
          setMessages(prev => [...prev, helpMessage])
          return
        }
        
        // Store the improved answer
        const newAnswers = [...answers]
        newAnswers[currentQuestionIndex] = data.improvedAnswer

        // Add AI's response to messages
        const aiMessage: Message = { 
          role: 'assistant', 
          content: data.improvedAnswer
        }
        setMessages(prev => [...prev, aiMessage])

        // If there are more questions, ask the next one
        if (currentQuestionIndex < QUESTIONS.length - 1) {
          const nextQuestion: Message = { 
            role: 'assistant', 
            content: QUESTIONS[currentQuestionIndex + 1]
          }
          setMessages(prev => [...prev, nextQuestion])
          setCurrentQuestionIndex(currentQuestionIndex + 1)
          setIsInHelpMode(false)
          setHelpContext([])
        } else {
          // If we're done with all questions, combine answers and complete
          const visionText = newAnswers.join('\n\n')
          const finalMessage: Message = {
            role: 'assistant',
            content: "Perfect! I've compiled all your answers into a comprehensive vision statement."
          }
          setMessages(prev => [...prev, finalMessage])
          onComplete(visionText)
        }

        setAnswers(newAnswers)
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

      const response = await fetch(`/api/business-plans/${businessPlanId}/vision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: QUESTIONS[currentQuestionIndex],
          needsHelp: true
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

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-gray-200">
          <div 
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-600">
          {currentQuestionIndex + 1} of {QUESTIONS.length}
        </span>
      </div>

      {/* Input area */}
      {currentQuestionIndex < QUESTIONS.length && (
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
              I'm not sure
            </button>
          )}
        </form>
      )}
    </div>
  )
} 