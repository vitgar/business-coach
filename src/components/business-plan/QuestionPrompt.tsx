import { useState } from 'react'
import { Send, HelpCircle } from 'lucide-react'

interface Props {
  question: string
  onAnswer: (answer: string) => Promise<void>
  onNotSure: () => Promise<void>
  isLoading?: boolean
}

export default function QuestionPrompt({ question, onAnswer, onNotSure, isLoading = false }: Props) {
  const [input, setInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    await onAnswer(input)
    setInput('')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 p-2 rounded-full">
          <HelpCircle className="h-5 w-5 text-blue-600" />
        </div>
        <p className="text-gray-800 flex-1">{question}</p>
      </div>

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
        <button
          type="button"
          onClick={onNotSure}
          disabled={isLoading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Help me
        </button>
      </form>
    </div>
  )
} 