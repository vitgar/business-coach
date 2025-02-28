import React, { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props for the ProductionProcessQuestionnaire component
 */
interface Props {
  /**
   * The ID of the business plan this questionnaire is for
   */
  businessPlanId: string;
  
  /**
   * Function to call when the questionnaire is completed
   * @param productionText - Formatted text content for the production process
   * @param productionData - Structured data for the production process
   */
  onComplete: (productionText: string, productionData: any) => void;
}

/**
 * Message object structure for chat interface
 */
interface Message {
  /**
   * Role of the message sender
   */
  role: 'assistant' | 'user' | 'system';
  
  /**
   * Content of the message
   */
  content: string;
}

/**
 * Interface for production process data
 */
interface ProductionProcessData {
  /**
   * Overview of production or service delivery
   */
  processOverview?: string;
  
  /**
   * Key steps in the production/service process
   */
  processSteps?: string[];
  
  /**
   * Equipment and technologies used in production
   */
  equipmentAndTechnology?: string;
  
  /**
   * Timeline and scheduling information
   */
  productionTimeline?: string;
  
  /**
   * How capacity is managed
   */
  capacityManagement?: string;
  
  /**
   * Outsourcing and partnerships for production
   */
  outsourcingStrategy?: string;
  
  /**
   * Production costs structure
   */
  productionCosts?: string;
}

/**
 * Initial system message to guide the conversation
 */
const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: `# Let's discuss your Production Process

I'll help you define how your business produces your products or delivers your services. This includes your production steps, equipment needs, capacity planning, and more.

Let's explore:
* What are the key steps in your production or service delivery process?
* What equipment and technology do you use?
* What's your production timeline and scheduling approach?
* How do you manage production capacity?
* Do you outsource any parts of production?
* What are your production costs?

Please share details about how your production or service delivery process works.`
};

/**
 * ProductionProcessQuestionnaire component
 * 
 * Provides a chat interface for discussing and defining the production process
 */
export default function ProductionProcessQuestionnaire({ businessPlanId, onComplete }: Props) {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  // State for input value
  const [input, setInput] = useState('');
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  // State for data loading
  const [isDataLoading, setIsDataLoading] = useState(true);
  // State for production process data
  const [productionData, setProductionData] = useState<ProductionProcessData>({});
  // Reference for chat container for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch existing production process data on component mount
  useEffect(() => {
    if (businessPlanId) {
      fetchProductionData();
    }
  }, [businessPlanId]);

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Fetch existing production process data from the API
   */
  const fetchProductionData = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/production`);
      
      if (!response.ok) {
        // It's okay if the data doesn't exist yet
        setIsDataLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.production) {
        // If we have existing data, add it to the messages
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'I found your existing production process information. Here is what we have so far:'
          },
          {
            role: 'assistant',
            content: data.production
          }
        ]);
        
        // Set the formatted text for preview
        setFormattedProductionText(data.production);
      }
      
      setProductionData(data.productionData || {});
    } catch (error) {
      console.error('Error fetching production process data:', error);
      toast.error('Failed to load existing production process data');
    } finally {
      setIsDataLoading(false);
    }
  };

  /**
   * Format the production process data into a markdown text
   */
  const formatProductionText = (data: ProductionProcessData): string => {
    let markdown = '## Production Process\n\n';
    
    if (data.processOverview) {
      markdown += '### Process Overview\n';
      markdown += data.processOverview + '\n\n';
    }
    
    if (data.processSteps && data.processSteps.length > 0) {
      markdown += '### Production Steps\n';
      data.processSteps.forEach((step, index) => {
        markdown += `${index + 1}. ${step}\n`;
      });
      markdown += '\n';
    }
    
    if (data.equipmentAndTechnology) {
      markdown += '### Equipment & Technology\n';
      markdown += data.equipmentAndTechnology + '\n\n';
    }
    
    if (data.productionTimeline) {
      markdown += '### Production Timeline\n';
      markdown += data.productionTimeline + '\n\n';
    }
    
    if (data.capacityManagement) {
      markdown += '### Capacity Management\n';
      markdown += data.capacityManagement + '\n\n';
    }
    
    if (data.outsourcingStrategy) {
      markdown += '### Outsourcing Strategy\n';
      markdown += data.outsourcingStrategy + '\n\n';
    }
    
    if (data.productionCosts) {
      markdown += '### Production Costs\n';
      markdown += data.productionCosts + '\n\n';
    }
    
    return markdown;
  };

  // Generate the formatted production text for the preview
  const [formattedProductionText, setFormattedProductionText] = useState('');

  /**
   * Handle form submission to send a message
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/production`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      // Add the assistant's response to messages
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message 
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // If production data was extracted, update state and preview
      if (data.production) {
        setProductionData(data.productionData || {});
        setFormattedProductionText(data.production);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle "Help me" button click
   */
  const handleNotSure = async () => {
    setIsLoading(true);
    
    try {
      const helpMessage = 'I need help describing my production process. Can you provide guidance and examples?';
      
      // Add user's help request to messages
      const userMessage: Message = { role: 'user', content: helpMessage };
      setMessages(prev => [...prev, userMessage]);
      
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/production`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: helpMessage }),
      });
      
      if (!response.ok) throw new Error('Failed to get help');
      
      const data = await response.json();
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting help:', error);
      toast.error('Failed to get help');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle saving the production process data
   */
  const handleSave = () => {
    if (formattedProductionText) {
      onComplete(formattedProductionText, productionData);
      toast.success('Production process saved!');
    } else {
      toast.warning('Please provide production process details before saving');
    }
  };

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
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          
          {isLoading && <LoadingIndicator />}
          
          {isDataLoading && (
            <div className="flex justify-center my-4">
              <div className="rounded-lg px-4 py-2 bg-gray-100">
                <p className="text-gray-500">Loading existing data...</p>
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={handleNotSure}
            disabled={isLoading || isDataLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading || isDataLoading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
      
      {/* Right side - Preview */}
      <div className="w-1/2">
        <div className="h-[600px] overflow-y-auto p-4 bg-white rounded-lg border-l-4 border-blue-600 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Production Process Preview</h3>
          
          {isDataLoading ? (
            <div className="flex justify-center items-center h-full">
              <LoadingIndicator />
            </div>
          ) : formattedProductionText ? (
            <>
              <div className="prose max-w-none mb-6">
                <ReactMarkdown>
                  {formattedProductionText}
                </ReactMarkdown>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                This is a preview of your production process. You can continue the conversation or save this information.
              </div>
              
              <button
                onClick={handleSave}
                disabled={isLoading || isDataLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Production Process
              </button>
            </>
          ) : (
            <div className="text-gray-500 italic">
              Your production process details will appear here as you discuss them in the chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 