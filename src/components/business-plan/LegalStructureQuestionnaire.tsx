import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import { HelpCircle, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import LoadingIndicator from './LoadingIndicator'

/**
 * Props for the LegalStructureQuestionnaire component
 */
interface Props {
  /**
   * The ID of the business plan this questionnaire is for
   */
  businessPlanId: string
  
  /**
   * Function to call when the questionnaire is completed
   * @param legalStructureText - Formatted text content for the legal structure
   */
  onComplete: (legalStructureText: string) => void
}

/**
 * Message object representing a chat message in the conversation
 */
interface Message {
  role: 'assistant' | 'user' | 'system'
  content: string
}

/**
 * Legal structure data structure
 */
interface LegalStructureData {
  /**
   * The selected legal structure type (e.g., sole proprietorship, LLC, corporation)
   */
  structureType?: string;
  
  /**
   * Rationale for choosing this legal structure
   */
  rationale?: string;
  
  /**
   * Ownership details (e.g., partners, shareholders)
   */
  ownershipDetails?: string;
  
  /**
   * Tax implications of the chosen structure
   */
  taxImplications?: string;
  
  /**
   * Legal requirements and regulations specific to this structure
   */
  legalRequirements?: string[];
  
  /**
   * Future plans for changing the legal structure
   */
  futurePlans?: string;
}

/**
 * Legal structure questions to guide the conversation
 */
const LEGAL_STRUCTURE_QUESTIONS = [
  "What type of legal structure have you chosen for your business (e.g., sole proprietorship, partnership, LLC, corporation)?",
  "Why did you choose this legal structure? What specific advantages does it offer your business?",
  "Who are the owners, partners, or shareholders of your business? What are their ownership percentages?",
  "What are the tax implications of your chosen legal structure?",
  "What legal requirements must you fulfill to establish and maintain this structure?",
  "Do you plan to change your legal structure in the future as your business grows?"
];

/**
 * Initial message to start the conversation about legal structure
 */
const INITIAL_MESSAGE = {
  role: 'assistant' as const,
  content: `Let's work on defining your business's legal structure. This is an important decision that affects your taxes, personal liability, paperwork requirements, and ability to raise money.

I'll help you think through the options and document your legal structure. First, what type of legal structure are you considering (sole proprietorship, partnership, LLC, corporation, etc.) and why?`
};

/**
 * System message to remind the assistant to focus on legal structure
 */
const FOCUS_REMINDER = {
  role: 'system' as const,
  content: `Focus the conversation on gathering information about the business's legal structure. Cover structure type, rationale for the choice, ownership details, tax implications, legal requirements, and future plans.

If the user seems uncertain, provide concrete examples of different legal structures and their pros and cons. Explain tax implications in simple terms.

Keep the conversation focused on legal structure topics. If the user brings up unrelated topics, gently guide them back to the legal structure discussion.`
};

/**
 * LegalStructureQuestionnaire component
 * 
 * A questionnaire component that helps users define their business's legal structure 
 * through an interactive chat interface
 */
export default function LegalStructureQuestionnaire({ businessPlanId, onComplete }: Props) {
  // Store messages in the conversation
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  
  // User input for the chat
  const [input, setInput] = useState('');
  
  // Loading state for API calls
  const [isLoading, setIsLoading] = useState(false);
  
  // Structured data for legal structure
  const [legalStructureData, setLegalStructureData] = useState<LegalStructureData>({});
  
  // Refs for scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch existing legal structure data if available
  useEffect(() => {
    const fetchLegalStructureData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/business-plans/${businessPlanId}/legal-structure`);
        
        if (!response.ok) {
          if (response.status !== 404) {
            // Only show error for non-404 responses (404 just means no data yet)
            console.error('Failed to fetch legal structure data');
          }
          return;
        }
        
        const data = await response.json();
        if (data.legalStructureData) {
          setLegalStructureData(data.legalStructureData);
          
          // Add initial context message about existing data
          setMessages([
            INITIAL_MESSAGE,
            {
              role: 'assistant',
              content: `I see you have some information about your legal structure already. Let's review and expand on what you have.

Based on what you've shared, your business is structured as ${data.legalStructureData.structureType || 'not specified yet'}. Would you like to make any changes or add more details?`
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching legal structure data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLegalStructureData();
  }, [businessPlanId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /**
   * Format legal structure data into readable text
   */
  const formatLegalStructureText = (data: LegalStructureData): string => {
    if (!data.structureType) return '';
    
    let text = `## Legal Structure: ${data.structureType}\n\n`;
    
    if (data.rationale) {
      text += `### Rationale\n${data.rationale}\n\n`;
    }
    
    if (data.ownershipDetails) {
      text += `### Ownership Details\n${data.ownershipDetails}\n\n`;
    }
    
    if (data.taxImplications) {
      text += `### Tax Implications\n${data.taxImplications}\n\n`;
    }
    
    if (data.legalRequirements && data.legalRequirements.length > 0) {
      text += `### Legal Requirements\n`;
      data.legalRequirements.forEach(req => {
        text += `- ${req}\n`;
      });
      text += '\n';
    }
    
    if (data.futurePlans) {
      text += `### Future Plans\n${data.futurePlans}\n\n`;
    }
    
    return text;
  };

  /**
   * Handle save button click with propagation prevention
   */
  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const formattedText = formatLegalStructureText(legalStructureData);
    console.log('Saving legal structure data:', legalStructureData);
    console.log('Formatted legal structure text:', formattedText);
    onComplete(formattedText);
  };

  /**
   * Handle form submission to send messages
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      setIsLoading(true);
      
      // Add context message if this is the first user message
      const isFirstMessage = messages.length === 1;
      const messagePayload = isFirstMessage
        ? [...messages, FOCUS_REMINDER, userMessage]
        : [...messages, userMessage];
      
      const response = await fetch(`/api/business-plans/${businessPlanId}/legal-structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagePayload,
          isFirstMessage
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message.content 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update legal structure data if it was extracted
      if (data.legalStructureData) {
        setLegalStructureData(data.legalStructureData);
      }
      
    } catch (error) {
      console.error('Error in conversation:', error);
      toast.error('Failed to process response');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle request for help with the current question
   */
  const handleNotSure = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsLoading(true);

      // Add a system message for help that maintains focus on legal structure
      const helpMessage: Message = {
        role: 'system',
        content: `The user needs help understanding legal structure options. Provide a clear explanation of the common business structures with their pros and cons:

1. Sole Proprietorship: Explain simplicity but mention personal liability risks
2. Partnership: Cover general vs limited partnerships and liability concerns
3. LLC: Explain liability protection and tax flexibility
4. Corporation: Cover S-Corps vs C-Corps and their tax differences
5. Nonprofit: Brief explanation if relevant

Format your response with clear headings for each structure type, then ask which one seems closest to what they need.`
      };

      const response = await fetch(`/api/business-plans/${businessPlanId}/legal-structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, helpMessage, { role: 'user', content: "I'm not sure about the different legal structures. Can you explain my options?" }],
          isFirstMessage: false
        })
      });

      if (!response.ok) throw new Error('Failed to get help');

      const data = await response.json();
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message.content 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting help:', error);
      toast.error('Failed to get help');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Left side - Chat */}
      <div className="w-1/2 space-y-4">
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-t-lg"
          onClick={(e) => e.stopPropagation()}
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
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
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

      {/* Right side - Legal Structure Text Editor */}
      <div className="w-1/2 space-y-4">
        <div 
          className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium text-blue-700 mb-4">Legal Structure</h3>
          <div className="prose prose-sm max-w-none mb-4 prose-headings:text-blue-600 prose-headings:font-medium prose-headings:text-base prose-p:text-gray-700 prose-li:text-gray-700">
            <ReactMarkdown>{formatLegalStructureText(legalStructureData)}</ReactMarkdown>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSaveClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Legal Structure
            </button>
          </div>
          
          {/* Show a message if legal structure data exists */}
          {legalStructureData.structureType && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
              <p className="text-sm font-medium">Legal structure data is loaded and ready to save.</p>
              <p className="text-xs mt-1">You can continue the conversation to refine it, or click "Save Legal Structure" to use the current data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 