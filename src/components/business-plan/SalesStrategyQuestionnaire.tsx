import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props for the SalesStrategyQuestionnaire component
 */
interface Props {
  /**
   * The ID of the business plan this questionnaire is for
   */
  businessPlanId: string;
  
  /**
   * Function to call when the questionnaire is completed
   * @param salesText - Formatted text content for the sales strategy
   */
  onComplete: (salesText: string) => void;
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
 * Structure for Sales Strategy data
 */
interface SalesStrategyData {
  /**
   * Sales channels used (e.g. direct, partners, online)
   */
  salesChannels?: string[];
  
  /**
   * Sales process description
   */
  salesProcess?: string;
  
  /**
   * Team structure and roles
   */
  salesTeam?: string;
  
  /**
   * Customer acquisition cost and metrics
   */
  acquisitionMetrics?: string;
  
  /**
   * Tools and technology used in sales
   */
  salesTools?: string;
  
  /**
   * Goals and targets for sales
   */
  salesGoals?: string;
}

/**
 * SalesStrategyQuestionnaire component
 * 
 * A component that provides a chat interface for discussing and developing
 * a sales strategy for a business plan.
 */
export default function SalesStrategyQuestionnaire({ businessPlanId, onComplete }: Props) {
  // State for messages in the chat
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'I\'ll help you define your sales strategy. This includes your sales channels, sales process, team structure, and key metrics. Let\'s start by discussing how you plan to sell your products or services.'
    }
  ]);
  
  // Input state for the message being composed
  const [input, setInput] = useState('');
  // Loading state for when waiting for a response
  const [isLoading, setIsLoading] = useState(false);
  // State to track if in help mode
  const [isInHelpMode, setIsInHelpMode] = useState(false);
  // State for the formatted sales strategy text
  const [formattedSalesText, setFormattedSalesText] = useState('');
  // State for the sales strategy data
  const [salesData, setSalesData] = useState<SalesStrategyData | null>(null);
  
  // Reference to chat container for scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch existing sales strategy data on component mount
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/sales`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.salesStrategy) {
            // Add the existing sales strategy as a message from the assistant
            const existingMessage: Message = {
              role: 'assistant',
              content: `Here's your current sales strategy:\n\n${data.salesStrategy}`
            };
            setMessages(prev => [...prev, existingMessage]);
            setFormattedSalesText(data.salesStrategy);
          }
        }
      } catch (error) {
        console.error('Error fetching sales strategy data:', error);
      }
    };
    
    fetchSalesData();
  }, [businessPlanId]);

  // Format sales data into a markdown text
  const formatSalesText = (data: SalesStrategyData): string => {
    let text = '# Sales Strategy\n\n';
    
    if (data.salesChannels && data.salesChannels.length > 0) {
      text += '## Sales Channels\n';
      text += data.salesChannels.map(channel => `- ${channel}`).join('\n');
      text += '\n\n';
    }
    
    if (data.salesProcess) {
      text += '## Sales Process\n';
      text += data.salesProcess + '\n\n';
    }
    
    if (data.salesTeam) {
      text += '## Sales Team\n';
      text += data.salesTeam + '\n\n';
    }
    
    if (data.acquisitionMetrics) {
      text += '## Customer Acquisition Metrics\n';
      text += data.acquisitionMetrics + '\n\n';
    }
    
    if (data.salesTools) {
      text += '## Sales Tools & Technology\n';
      text += data.salesTools + '\n\n';
    }
    
    if (data.salesGoals) {
      text += '## Sales Goals & Targets\n';
      text += data.salesGoals + '\n\n';
    }
    
    return text;
  };

  /**
   * Handle form submission to send a new message
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send message to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          isInHelpMode
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      // Add assistant response to chat
      const assistantMessage: Message = { 
        role: 'assistant',
        content: data.message
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update formatted text if sales data was returned
      if (data.salesStrategy) {
        setFormattedSalesText(data.salesStrategy);
      }
      
      // Clear help mode flag
      if (isInHelpMode) {
        setIsInHelpMode(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle "Not sure? Get help" button click
   * Prevents default behavior and stops propagation to avoid scrolling issues
   */
  const handleNotSure = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsInHelpMode(true);
    setIsLoading(true);
    
    try {
      // Send help request to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "I need help with my sales strategy. Can you provide some guidance and examples?",
          isInHelpMode: true
        }),
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
   * Handle save button click
   * Prevents default behavior and stops propagation to avoid scrolling issues
   */
  const handleSave = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (formattedSalesText) {
      onComplete(formattedSalesText);
      toast.success('Sales strategy saved!');
    } else {
      toast.error('Please develop a sales strategy before saving');
    }
  };

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-white rounded-lg shadow-sm" onClick={(e) => e.stopPropagation()}>
      {/* Left side - Chat */}
      <div className="flex gap-6">
        {/* Chat container */}
        <div 
          ref={chatContainerRef}
          className="w-1/2 space-y-4 h-[600px] overflow-y-auto p-4 bg-gray-50 rounded-lg scroll-smooth"
          onClick={(e) => e.stopPropagation()}
        >
          {messages.map((message, index) => (
            message.role !== 'system' && (
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
            )
          ))}
          
          {isLoading && (
            <LoadingIndicator type="spinner" />
          )}
        </div>
        
        {/* Form */}
        <form 
          onSubmit={handleSubmit} 
          className="flex items-stretch gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleNotSure}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Help me
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Strategy Preview</h3>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <LoadingIndicator type="spinner" />
            </div>
          ) : formattedSalesText ? (
            <>
              <div className="prose max-w-none mb-6">
                <ReactMarkdown>
                  {formattedSalesText}
                </ReactMarkdown>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                This is a preview of your sales strategy. You can continue the conversation or save this information.
              </div>
              
              <button
                onClick={handleSave}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Save Sales Strategy
              </button>
            </>
          ) : (
            <div className="text-gray-500 italic">
              Your sales strategy will appear here as you discuss it with the assistant.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 