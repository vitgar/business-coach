import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import { HelpCircle, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

/**
 * Props for the ProductsQuestionnaire component
 * @param businessPlanId - The ID of the business plan
 * @param onComplete - Callback function to handle the completed products text
 */
interface Props {
  businessPlanId: string
  onComplete: (productsText: string) => void
}

/**
 * Interface for chat messages
 */
interface Message {
  role: 'assistant' | 'user' | 'system'
  content: string
}

/**
 * Interface for structured products data
 */
interface ProductsData {
  productDescription?: string;
  uniqueSellingPoints?: string[];
  competitiveAdvantages?: string[];
  pricingStrategy?: string;
  futureProductPlans?: string;
}

// Questions focused on products and services
const PRODUCTS_QUESTIONS = [
  "What products or services will your business offer? Please provide a detailed description.",
  "What are the unique selling points of your products or services?",
  "How are your offerings different from competitors? What competitive advantages do you have?",
  "What is your pricing strategy for these products or services?",
  "Do you have plans for future product development or service expansion?"
]

// Initial message to start the conversation
const INITIAL_MESSAGE: Message = { 
  role: 'assistant', 
  content: "Let's focus on your products and services. A clear description of what you offer is essential for your business plan. What products or services will your business offer? Please provide a detailed description." 
}

// System message to keep responses focused on products and services
const FOCUS_REMINDER: Message = {
  role: 'system',
  content: "Do not respond with long multiple steps answers, guide the user step by step asking one question at a time and wait for the answer. If the user asks for help, expresses uncertainty, or requests examples, provide 2-3 concrete examples that are specific and detailed. After providing examples, always ask if they want to use one of the examples directly or modify their current description with ideas from the examples. Keep the conversation focused on products and services. If the user starts discussing other topics, gently guide them back to defining their products/services, unique selling points, competitive advantages, pricing strategy, and future product plans."
}

/**
 * ProductsQuestionnaire component for gathering information about products and services
 */
export default function ProductsQuestionnaire({ businessPlanId, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [productsData, setProductsData] = useState<ProductsData>({})
  const [isLoading, setIsLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Fetch existing products data when component mounts
  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/business-plans/${businessPlanId}`)
        if (!response.ok) throw new Error('Failed to fetch business plan')
        
        const data = await response.json()
        console.log('Fetched business plan data:', data)
        
        // Check for products data in the response
        if (data.content?.products || data.productsData) {
          const fetchedProductsData = data.productsData || data.content.products
          console.log('Found existing products data:', fetchedProductsData)
          setProductsData(fetchedProductsData)
        }
      } catch (error) {
        console.error('Error fetching products data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProductsData()
  }, [businessPlanId])

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [messages, isLoading])

  /**
   * Format products data into a readable string
   * @param data - The structured products data
   * @returns Formatted markdown text
   */
  const formatProductsText = (data: ProductsData): string => {
    const parts = []
    
    if (data.productDescription) {
      parts.push('### Products/Services Description\n' + data.productDescription + '\n')
    }
    
    if (data.uniqueSellingPoints?.length) {
      parts.push('### Unique Selling Points\n' + data.uniqueSellingPoints.map(p => '- ' + p).join('\n') + '\n')
    }
    
    if (data.competitiveAdvantages?.length) {
      parts.push('### Competitive Advantages\n' + data.competitiveAdvantages.map(a => '- ' + a).join('\n') + '\n')
    }
    
    if (data.pricingStrategy) {
      parts.push('### Pricing Strategy\n' + data.pricingStrategy + '\n')
    }
    
    if (data.futureProductPlans) {
      parts.push('### Future Product Plans\n' + data.futureProductPlans)
    }
    
    return parts.join('\n')
  }

  /**
   * Handle form submission for chat messages
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    try {
      setIsLoading(true)
      const userMessage: Message = { role: 'user', content: input }
      setMessages(prev => [...prev, userMessage])
      setInput('')

      const response = await fetch(`/api/business-plans/${businessPlanId}/products`, {
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
      
      // Update products data if available
      if (data.productsData) {
        console.log('Received products data from API:', data.productsData);
        setProductsData(data.productsData)
      }
      
    } catch (error) {
      console.error('Error in conversation:', error)
      toast.error('Failed to process response')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle request for help/examples
   */
  const handleNotSure = async () => {
    try {
      setIsLoading(true)

      // Add a system message for help that maintains focus on products and services
      const helpMessage: Message = {
        role: 'system',
        content: `The user needs help defining their products or services. Break down the current question into simpler parts and provide 2-3 specific examples. Format your response as:

"Let me help you with some examples:

1. [Specific example with details]
2. [Specific example with details]
3. [Specific example with details]

Would you like to:
- Use one of these examples as your [product/service description]?
- Modify your current one with some ideas from these examples?
- See different examples?

Keep examples concrete and detailed. Maintain focus on products and services. Avoid unrelated topics."`
      }

      const response = await fetch(`/api/business-plans/${businessPlanId}/products`, {
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

      {/* Right side - Products Text Editor */}
      <div className="w-1/2 space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <h3 className="text-lg font-medium text-green-700 mb-4">Products and Services</h3>
          <div className="prose prose-sm max-w-none mb-4 prose-headings:text-green-600 prose-headings:font-medium prose-headings:text-base prose-p:text-gray-700 prose-li:text-gray-700">
            <ReactMarkdown>{formatProductsText(productsData)}</ReactMarkdown>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                const formattedText = formatProductsText(productsData);
                console.log('Saving products data:', productsData);
                console.log('Formatted products text:', formattedText);
                onComplete(formattedText);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save Products & Services
            </button>
          </div>
          
          {/* Show a message if products data exists */}
          {productsData.productDescription && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
              <p className="text-sm font-medium">Products data is loaded and ready to save.</p>
              <p className="text-xs mt-1">You can continue the conversation to refine it, or click "Save Products & Services" to use the current data.</p>
            </div>
          )}
          
          {/* Debug display - completely hidden */}
          {false && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <details>
                <summary>Debug: Products Data</summary>
                <pre className="overflow-auto max-h-40 mt-1">
                  {JSON.stringify(productsData, null, 2)}
                </pre>
              </details>
              <details className="mt-2">
                <summary>Debug: Formatted Products Text</summary>
                <pre className="overflow-auto max-h-40 mt-1">
                  {formatProductsText(productsData) || 'No formatted products text'}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 