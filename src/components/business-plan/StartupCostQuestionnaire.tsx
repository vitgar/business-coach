import React, { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props for the StartupCostQuestionnaire component
 */
interface Props {
  /**
   * The ID of the business plan this questionnaire is for
   */
  businessPlanId: string;
  
  /**
   * Function to call when the questionnaire is completed
   * @param startupCostText - Formatted text content for the startup costs
   * @param startupCostData - Structured data for the startup costs
   */
  onComplete: (startupCostText: string, startupCostData: any) => void;
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
 * Interface for startup cost data
 */
interface StartupCostData {
  /**
   * One-time costs to start the business
   */
  oneTimeCosts?: {
    name: string;
    amount: number;
    description?: string;
  }[];
  
  /**
   * Ongoing monthly expenses
   */
  monthlyExpenses?: {
    name: string;
    amount: number;
    description?: string;
  }[];
  
  /**
   * Sources of initial funding
   */
  fundingSources?: {
    name: string;
    amount: number;
    description?: string;
  }[];
  
  /**
   * Total startup cost
   */
  totalStartupCost?: number;
  
  /**
   * Months until break-even
   */
  breakEvenTimeframe?: string;
  
  /**
   * Additional notes about startup costs
   */
  additionalNotes?: string;
}

/**
 * Initial system message to guide the conversation
 */
const initialMessage: Message = {
  role: 'system',
  content: `Let's discuss your startup costs. Understanding your initial investment needs is crucial for planning your business finances.

Please share details about:
- One-time costs to start your business (equipment, legal fees, etc.)
- Ongoing monthly expenses (rent, utilities, salaries, etc.)
- Sources of initial funding (personal savings, loans, investors)
- Your estimated break-even timeframe
- Any additional financial considerations for startup

If you're not sure where to start, I can guide you through each aspect.`
};

/**
 * StartupCostQuestionnaire component
 * 
 * A chat interface for discussing and defining the startup costs
 */
export default function StartupCostQuestionnaire({ businessPlanId, onComplete }: Props) {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  
  // State for user input
  const [input, setInput] = useState('');
  
  // State for loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // State for startup cost data
  const [startupCostData, setStartupCostData] = useState<StartupCostData>({});
  
  // State for formatted startup cost text
  const [formattedStartupCostText, setFormattedStartupCostText] = useState('');
  
  // State for help mode
  const [isInHelpMode, setIsInHelpMode] = useState(false);
  
  // Reference to message container for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch existing startup cost data when component mounts
  useEffect(() => {
    fetchStartupCostData();
  }, [businessPlanId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  /**
   * Fetch existing startup cost data from API
   */
  const fetchStartupCostData = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/startup-costs`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch startup cost data');
      }
      
      const data = await response.json();
      
      if (data.startupCostData) {
        setStartupCostData(data.startupCostData);
        
        // Format the startup cost data into text
        const formattedText = formatStartupCostText(data.startupCostData);
        setFormattedStartupCostText(formattedText);
        
        // Add a message showing the existing data
        if (Object.keys(data.startupCostData).length > 0) {
          setMessages([
            initialMessage,
            {
              role: 'assistant',
              content: 'I see you already have some startup cost information. Would you like to review and update it?'
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching startup cost data:', error);
      // Don't show error toast as this might be the first time setting up startup costs
    } finally {
      setIsDataLoading(false);
    }
  };
  
  /**
   * Format startup cost data into readable text
   * 
   * @param data - The startup cost data to format
   * @returns Formatted markdown text
   */
  const formatStartupCostText = (data: StartupCostData): string => {
    let text = '## Startup Costs\n\n';
    
    if (data.oneTimeCosts && data.oneTimeCosts.length > 0) {
      text += '### One-Time Costs\n';
      text += '| Item | Amount | Description |\n';
      text += '| ---- | ------ | ----------- |\n';
      data.oneTimeCosts.forEach(cost => {
        text += `| ${cost.name} | $${cost.amount.toLocaleString()} | ${cost.description || ''} |\n`;
      });
      text += '\n';
      
      // Calculate total one-time costs
      const totalOneTime = data.oneTimeCosts.reduce((sum, cost) => sum + cost.amount, 0);
      text += `**Total One-Time Costs:** $${totalOneTime.toLocaleString()}\n\n`;
    }
    
    if (data.monthlyExpenses && data.monthlyExpenses.length > 0) {
      text += '### Monthly Expenses\n';
      text += '| Item | Amount | Description |\n';
      text += '| ---- | ------ | ----------- |\n';
      data.monthlyExpenses.forEach(expense => {
        text += `| ${expense.name} | $${expense.amount.toLocaleString()} | ${expense.description || ''} |\n`;
      });
      text += '\n';
      
      // Calculate total monthly expenses
      const totalMonthly = data.monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      text += `**Total Monthly Expenses:** $${totalMonthly.toLocaleString()}\n\n`;
    }
    
    if (data.fundingSources && data.fundingSources.length > 0) {
      text += '### Funding Sources\n';
      text += '| Source | Amount | Description |\n';
      text += '| ------ | ------ | ----------- |\n';
      data.fundingSources.forEach(source => {
        text += `| ${source.name} | $${source.amount.toLocaleString()} | ${source.description || ''} |\n`;
      });
      text += '\n';
      
      // Calculate total funding
      const totalFunding = data.fundingSources.reduce((sum, source) => sum + source.amount, 0);
      text += `**Total Funding:** $${totalFunding.toLocaleString()}\n\n`;
    }
    
    if (data.totalStartupCost) {
      text += `### Total Startup Cost\n$${data.totalStartupCost.toLocaleString()}\n\n`;
    }
    
    if (data.breakEvenTimeframe) {
      text += `### Break-Even Timeframe\n${data.breakEvenTimeframe}\n\n`;
    }
    
    if (data.additionalNotes) {
      text += `### Additional Notes\n${data.additionalNotes}\n\n`;
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
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/startup-costs`, {
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
      
      // Update startup cost data and formatted text
      if (data.startupCostData) {
        setStartupCostData(data.startupCostData);
        setFormattedStartupCostText(data.startupCost || formatStartupCostText(data.startupCostData));
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
      const helpMessage = "I'm not sure what to include in my startup costs. Can you guide me through the key aspects?";
      
      // Add user message to chat
      const userMessage: Message = { role: 'user', content: helpMessage };
      setMessages(prev => [...prev, userMessage]);
      
      // Send message to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/startup-costs`, {
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
   * Save the startup cost data
   */
  const handleSave = () => {
    if (formattedStartupCostText) {
      onComplete(formattedStartupCostText, startupCostData);
      toast.success('Startup cost information saved!');
    } else {
      toast.warning('Please provide some startup cost information before saving.');
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Startup Costs Preview</h3>
          
          {formattedStartupCostText ? (
            <>
              <div className="prose max-w-none mb-6">
                <ReactMarkdown>
                  {formattedStartupCostText}
                </ReactMarkdown>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                This is a preview of your startup costs. You can continue the conversation or save this information.
              </div>
              
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Startup Costs
              </button>
            </>
          ) : (
            <div className="text-gray-500 italic">
              Your startup cost details will appear here as you discuss them in the chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 