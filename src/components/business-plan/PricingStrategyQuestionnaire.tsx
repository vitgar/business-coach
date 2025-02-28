import React, { useEffect, useRef, useState } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props for the PricingStrategyQuestionnaire component
 */
interface Props {
  /**
   * The ID of the business plan this questionnaire is for
   */
  businessPlanId: string;
  
  /**
   * Function to call when the questionnaire is completed
   * @param pricingText - Formatted text content for the pricing strategy
   */
  onComplete: (pricingText: string) => void;
}

/**
 * Message interface for chat messages
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
 * Interface for pricing strategy data
 */
interface PricingStrategyData {
  /**
   * Overall pricing approach (e.g. premium, budget, value-based)
   */
  pricingApproach?: string;
  
  /**
   * Specific pricing models used (e.g. subscription, one-time, tiered)
   */
  pricingModels?: string[];
  
  /**
   * Explanation of how prices are determined
   */
  priceCalculation?: string;
  
  /**
   * Competitive price analysis
   */
  competitiveAnalysis?: string;
  
  /**
   * Planned discounts, promotions or special offers
   */
  discountStrategy?: string;
  
  /**
   * Expected price changes over time
   */
  pricingTimeline?: string;
}

/**
 * PricingStrategyQuestionnaire component
 * 
 * Provides a chat interface for discussing pricing strategy with AI assistance
 * and a preview section for the formatted pricing strategy information
 */
export default function PricingStrategyQuestionnaire({ businessPlanId, onComplete }: Props) {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Let's discuss your pricing strategy. I'll help you think through how to price your products or services in a way that aligns with your business goals and market positioning. What are your initial thoughts on pricing?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Pricing strategy data state
  const [pricingData, setPricingData] = useState<PricingStrategyData>({});
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [formattedPricingText, setFormattedPricingText] = useState('');

  // Load existing data on component mount
  useEffect(() => {
    fetchPricingData();
  }, [businessPlanId]);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Fetch existing pricing strategy data from the API
   */
  const fetchPricingData = async () => {
    try {
      setIsDataLoading(true);
      const response = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/pricing`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pricing data');
      }
      
      const data = await response.json();
      
      if (data.pricing) {
        setPricingData({});
        setFormattedPricingText(data.pricing);
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      toast.error('Failed to fetch pricing data');
    } finally {
      setIsDataLoading(false);
    }
  };

  /**
   * Format pricing strategy data into a markdown text string
   */
  const formatPricingText = (data: PricingStrategyData): string => {
    let text = '';

    if (data.pricingApproach) {
      text += `## Pricing Approach\n${data.pricingApproach}\n\n`;
    }

    if (data.pricingModels && data.pricingModels.length > 0) {
      text += `## Pricing Models\n${data.pricingModels.map(model => `- ${model}`).join('\n')}\n\n`;
    }

    if (data.priceCalculation) {
      text += `## Price Determination\n${data.priceCalculation}\n\n`;
    }

    if (data.competitiveAnalysis) {
      text += `## Competitive Price Analysis\n${data.competitiveAnalysis}\n\n`;
    }

    if (data.discountStrategy) {
      text += `## Discount Strategy\n${data.discountStrategy}\n\n`;
    }

    if (data.pricingTimeline) {
      text += `## Pricing Timeline\n${data.pricingTimeline}\n\n`;
    }

    return text.trim();
  };

  /**
   * Handle form submission to send a new message
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event propagation
    
    // Format the pricing strategy text
    const formattedText = formatPricingText(pricingData);
    
    // Call the onComplete callback with the formatted text
    onComplete(formattedText);
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
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    const helpMessage: Message = { 
      role: 'system', 
      content: 'Provide guidance on developing a pricing strategy' 
    };
    
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'I need help with my pricing strategy. What factors should I consider?',
          isHelp: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get help');
      }
      
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
    
    if (formattedPricingText) {
      onComplete(formattedPricingText);
      toast.success('Pricing strategy saved');
    } else {
      toast.warning('No pricing strategy data to save');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm" onClick={(e) => e.stopPropagation()}>
      {/* Chat container */}
      <div 
        className="h-80 overflow-y-auto p-4 border border-gray-200 rounded-lg mb-4"
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
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        
        {isLoading && <LoadingIndicator type="dots" />}
      </div>
      
      {/* Form */}
      <form 
        onSubmit={handleSubmit} 
        className="flex items-start space-x-2"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Type your message..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
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
          <HelpCircle className="h-5 w-5" />
        </button>
      </form>
      
      {/* Right side - Preview */}
      <div className="w-1/2 border border-gray-200 border-l-4 border-l-blue-600 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-xl text-gray-800">Pricing Strategy Preview</h3>
          
          <button
            onClick={handleSave}
            disabled={isDataLoading || !formattedPricingText}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Save Pricing Strategy
          </button>
        </div>
        
        <div className="bg-white rounded-md p-4 h-[600px] overflow-y-auto border border-gray-200">
          {isDataLoading ? (
            <div className="flex justify-center items-center h-full">
              <LoadingIndicator type="spinner" />
            </div>
          ) : formattedPricingText ? (
            <ReactMarkdown>
              {formattedPricingText}
            </ReactMarkdown>
          ) : (
            <div className="text-gray-500 italic">
              As you discuss your pricing strategy, a formatted preview will appear here.
              Once complete, you can save it to your business plan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 