import React, { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props for the RevenueProjectionsQuestionnaire component
 */
interface Props {
  /**
   * The ID of the business plan this questionnaire is for
   */
  businessPlanId: string;
  
  /**
   * Function to call when the questionnaire is completed
   * @param revenueProjectionsText - Formatted text content for the revenue projections
   * @param revenueProjectionsData - Structured data for the revenue projections
   */
  onComplete: (revenueProjectionsText: string, revenueProjectionsData: any) => void;
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
 * Interface for revenue projections data
 */
interface RevenueProjectionsData {
  /**
   * Revenue streams with details
   */
  revenueStreams?: {
    name: string;
    description: string;
    projectedAmount: number;
    timeframe: string;
  }[];
  
  /**
   * Growth assumptions for revenue projections
   */
  growthAssumptions?: string;
  
  /**
   * Market size estimates
   */
  marketSizeEstimates?: string;
  
  /**
   * Pricing strategy details
   */
  pricingStrategy?: string;
  
  /**
   * Sales forecast by period
   */
  salesForecast?: {
    period: string;
    amount: number;
    growthRate?: number;
  }[];
  
  /**
   * Factors affecting seasonal revenue
   */
  seasonalityFactors?: string;
  
  /**
   * Best case scenario for revenue
   */
  bestCaseScenario?: string;
  
  /**
   * Worst case scenario for revenue
   */
  worstCaseScenario?: string;
}

/**
 * Initial system message to guide the conversation
 */
const initialMessage: Message = {
  role: 'system',
  content: `Let's discuss your revenue projections. Accurate revenue forecasting is crucial for your business plan and financial strategy.

Please share details about:
- Your primary revenue streams and how they generate income
- Your pricing strategy and how it positions you in the market
- Your sales forecast for the next 1-3 years
- Growth assumptions and market size estimates
- Seasonal factors that might affect your revenue
- Best and worst case scenarios for your revenue projections

If you're not sure where to start, I can guide you through each aspect.`
};

/**
 * RevenueProjectionsQuestionnaire component
 * 
 * A chat interface for discussing and defining revenue projections
 */
export default function RevenueProjectionsQuestionnaire({ businessPlanId, onComplete }: Props) {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  
  // State for user input
  const [input, setInput] = useState('');
  
  // State for loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // State for revenue projections data
  const [revenueProjectionsData, setRevenueProjectionsData] = useState<RevenueProjectionsData>({});
  
  // State for formatted revenue projections text
  const [formattedRevenueProjectionsText, setFormattedRevenueProjectionsText] = useState('');
  
  // State for help mode
  const [isInHelpMode, setIsInHelpMode] = useState(false);
  
  // Reference to message container for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch existing revenue projections data when component mounts
  useEffect(() => {
    fetchRevenueProjectionsData();
  }, [businessPlanId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  /**
   * Fetch existing revenue projections data from API
   */
  const fetchRevenueProjectionsData = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/revenue-projections`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch revenue projections data');
      }
      
      const data = await response.json();
      
      if (data.revenueProjectionsData) {
        setRevenueProjectionsData(data.revenueProjectionsData);
        
        // Format the revenue projections data into text
        const formattedText = formatRevenueProjectionsText(data.revenueProjectionsData);
        setFormattedRevenueProjectionsText(formattedText);
        
        // Add a message showing the existing data
        if (Object.keys(data.revenueProjectionsData).length > 0) {
          setMessages([
            initialMessage,
            {
              role: 'assistant',
              content: 'I see you already have some revenue projections information. Would you like to review and update it?'
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching revenue projections data:', error);
      // Don't show error toast as this might be the first time setting up revenue projections
    } finally {
      setIsDataLoading(false);
    }
  };
  
  /**
   * Format revenue projections data into readable text
   * 
   * @param data - The revenue projections data to format
   * @returns Formatted markdown text
   */
  const formatRevenueProjectionsText = (data: RevenueProjectionsData): string => {
    let text = '## Revenue Projections\n\n';
    
    if (data.revenueStreams && data.revenueStreams.length > 0) {
      text += '### Revenue Streams\n';
      text += '| Revenue Stream | Description | Projected Amount | Timeframe |\n';
      text += '| -------------- | ----------- | ---------------- | --------- |\n';
      data.revenueStreams.forEach(stream => {
        text += `| ${stream.name} | ${stream.description} | $${stream.projectedAmount.toLocaleString()} | ${stream.timeframe} |\n`;
      });
      text += '\n';
      
      // Calculate total projected revenue
      const totalRevenue = data.revenueStreams.reduce((sum, stream) => sum + stream.projectedAmount, 0);
      text += `**Total Projected Revenue:** $${totalRevenue.toLocaleString()}\n\n`;
    }
    
    if (data.pricingStrategy) {
      text += `### Pricing Strategy\n${data.pricingStrategy}\n\n`;
    }
    
    if (data.salesForecast && data.salesForecast.length > 0) {
      text += '### Sales Forecast\n';
      text += '| Period | Amount | Growth Rate |\n';
      text += '| ------ | ------ | ----------- |\n';
      data.salesForecast.forEach(forecast => {
        text += `| ${forecast.period} | $${forecast.amount.toLocaleString()} | ${forecast.growthRate ? `${forecast.growthRate}%` : 'N/A'} |\n`;
      });
      text += '\n';
    }
    
    if (data.growthAssumptions) {
      text += `### Growth Assumptions\n${data.growthAssumptions}\n\n`;
    }
    
    if (data.marketSizeEstimates) {
      text += `### Market Size Estimates\n${data.marketSizeEstimates}\n\n`;
    }
    
    if (data.seasonalityFactors) {
      text += `### Seasonality Factors\n${data.seasonalityFactors}\n\n`;
    }
    
    if (data.bestCaseScenario) {
      text += `### Best Case Scenario\n${data.bestCaseScenario}\n\n`;
    }
    
    if (data.worstCaseScenario) {
      text += `### Worst Case Scenario\n${data.worstCaseScenario}\n\n`;
    }
    
    return text;
  };
  
  /**
   * Handle form submission to send a message
   * 
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send message to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/revenue-projections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process message');
      }
      
      const data = await response.json();
      
      // Add assistant response to chat
      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update revenue projections data and formatted text
      if (data.revenueProjectionsData) {
        setRevenueProjectionsData(data.revenueProjectionsData);
        setFormattedRevenueProjectionsText(data.revenueProjections || formatRevenueProjectionsText(data.revenueProjectionsData));
      }
      
      // Reset help mode
      setIsInHelpMode(false);
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle "Help me" button click
   */
  const handleNotSure = async () => {
    if (isLoading) return;
    
    setIsInHelpMode(true);
    setIsLoading(true);
    
    try {
      // Send help request to API
      const helpMessage = "I'm not sure how to project my revenue. Can you guide me through the key aspects?";
      
      // Add user message to chat
      const userMessage: Message = { role: 'user', content: helpMessage };
      setMessages(prev => [...prev, userMessage]);
      
      // Send message to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/revenue-projections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: helpMessage }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get help');
      }
      
      const data = await response.json();
      
      // Add assistant response to chat
      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting help:', error);
      toast.error('Failed to get help. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Scroll to the bottom of the message container
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  /**
   * Save the revenue projections data
   */
  const handleSave = () => {
    if (formattedRevenueProjectionsText) {
      onComplete(formattedRevenueProjectionsText, revenueProjectionsData);
      toast.success('Revenue projections saved!');
    } else {
      toast.warning('Please provide some revenue projections information before saving.');
    }
  };
  
  // Show loading indicator while fetching data
  if (isDataLoading) {
    return <LoadingIndicator />;
  }
  
  return (
    <div className="flex gap-6">
      {/* Left side - Chat */}
      <div className="w-1/2 space-y-4">
        <div 
          className="h-[600px] overflow-y-auto p-4 bg-gray-50 rounded-lg scroll-smooth"
        >
          {messages.slice(1).map((message, index) => (
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
          {isLoading && <LoadingIndicator type="dots" />}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={handleNotSure}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Projections Preview</h3>
          
          {formattedRevenueProjectionsText ? (
            <>
              <div className="prose max-w-none mb-6">
                <ReactMarkdown>
                  {formattedRevenueProjectionsText}
                </ReactMarkdown>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                This is a preview of your revenue projections. You can continue the conversation or save this information.
              </div>
              
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Revenue Projections
              </button>
            </>
          ) : (
            <div className="text-gray-500 italic">
              Your revenue projections will appear here as you discuss them in the chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 