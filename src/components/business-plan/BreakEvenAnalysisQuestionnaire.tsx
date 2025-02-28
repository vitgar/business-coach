'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props interface for the Break Even Analysis Questionnaire component
 */
interface BreakEvenAnalysisQuestionnaireProps {
  businessPlanId: string;
  onComplete: (breakEvenAnalysisText: string, breakEvenData: any) => void;
}

/**
 * Interface for chat messages
 */
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Interface for break-even analysis data structure
 */
interface BreakEvenAnalysisData {
  fixedCosts?: {
    amount: number;
    description: string;
  };
  variableCosts?: {
    amount: number;
    description: string;
  };
  unitPrice?: number;
  contributionMargin?: number;
  breakEvenPoint?: {
    units: number;
    revenue: number;
  };
  timeToBreakEven?: string;
  assumptions?: string[];
  sensitivityAnalysis?: string;
  visualizationData?: any;
}

/**
 * Initial system message to guide the AI assistant
 */
const initialSystemMessage: Message = {
  role: 'system',
  content: `You are helping the user develop a break-even analysis for their business plan. 
Guide them through understanding their fixed costs, variable costs, and pricing to calculate when they'll start making a profit.
After gathering information, help them calculate:
1. Contribution margin (unit price - variable cost per unit)
2. Break-even point in units (fixed costs / contribution margin per unit)
3. Break-even point in revenue (break-even units * unit price)
4. Estimated time to break even

If you're not sure where to start, I can guide you through each aspect.`
};

/**
 * Initial assistant message to start the conversation
 */
const initialAssistantMessage: Message = {
  role: 'assistant',
  content: "Let's work on your break-even analysis. This will help you understand when your business will start making a profit. To get started, could you tell me about your fixed costs (rent, salaries, utilities, etc.) and your variable costs per unit?"
};

/**
 * Break Even Analysis Questionnaire component
 * 
 * A chat interface for discussing and defining break-even analysis
 */
export default function BreakEvenAnalysisQuestionnaire({
  businessPlanId,
  onComplete,
}: BreakEvenAnalysisQuestionnaireProps) {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([initialSystemMessage, initialAssistantMessage]);
  
  // State for user input
  const [input, setInput] = useState('');
  
  // State for loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // State for break-even analysis data
  const [breakEvenData, setBreakEvenData] = useState<BreakEvenAnalysisData>({});
  
  // State for formatted break-even analysis text
  const [formattedBreakEvenText, setFormattedBreakEvenText] = useState('');
  
  // State for help mode
  const [isInHelpMode, setIsInHelpMode] = useState(false);
  
  // Reference to message container for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch existing break-even analysis data when component mounts
  useEffect(() => {
    fetchBreakEvenData();
  }, [businessPlanId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  /**
   * Fetch existing break-even analysis data from API
   */
  const fetchBreakEvenData = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/break-even-analysis`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch break-even analysis data');
      }
      
      const data = await response.json();
      
      if (data.breakEvenData && Object.keys(data.breakEvenData).length > 0) {
        setBreakEvenData(data.breakEvenData);
        
        // Format the break-even analysis data into text
        const formattedText = data.breakEvenAnalysis || formatBreakEvenText(data.breakEvenData);
        setFormattedBreakEvenText(formattedText);
      }
    } catch (error) {
      console.error('Error fetching break-even analysis data:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  /**
   * Format break-even analysis data into readable text
   * 
   * @param data - Break-even analysis data
   * @returns Formatted text
   */
  const formatBreakEvenText = (data: BreakEvenAnalysisData): string => {
    if (!data || Object.keys(data).length === 0) {
      return '';
    }
    
    let text = '## Break-Even Analysis\n\n';
    
    // Fixed costs
    if (data.fixedCosts) {
      text += `### Fixed Costs\n${data.fixedCosts.description || 'N/A'}\n`;
      text += `Total: $${data.fixedCosts.amount.toLocaleString()}\n\n`;
    }
    
    // Variable costs
    if (data.variableCosts) {
      text += `### Variable Costs Per Unit\n${data.variableCosts.description || 'N/A'}\n`;
      text += `Amount: $${data.variableCosts.amount.toLocaleString()} per unit\n\n`;
    }
    
    // Unit price
    if (data.unitPrice) {
      text += `### Unit Price\n$${data.unitPrice.toLocaleString()}\n\n`;
    }
    
    // Contribution margin
    if (data.contributionMargin) {
      text += `### Contribution Margin\n$${data.contributionMargin.toLocaleString()} per unit\n\n`;
    }
    
    // Break-even point
    if (data.breakEvenPoint) {
      text += '### Break-Even Point\n';
      text += `Units: ${data.breakEvenPoint.units.toLocaleString()}\n`;
      text += `Revenue: $${data.breakEvenPoint.revenue.toLocaleString()}\n\n`;
    }
    
    // Time to break even
    if (data.timeToBreakEven) {
      text += `### Time to Break Even\n${data.timeToBreakEven}\n\n`;
    }
    
    // Assumptions
    if (data.assumptions && data.assumptions.length > 0) {
      text += '### Key Assumptions\n';
      data.assumptions.forEach(assumption => {
        text += `- ${assumption}\n`;
      });
      text += '\n';
    }
    
    // Sensitivity analysis
    if (data.sensitivityAnalysis) {
      text += `### Sensitivity Analysis\n${data.sensitivityAnalysis}\n\n`;
    }
    
    return text;
  };

  /**
   * Handle form submit to send message
   * 
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send message to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/break-even-analysis`, {
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
      
      // Update break-even analysis data and formatted text
      if (data.breakEvenData) {
        setBreakEvenData(data.breakEvenData);
        setFormattedBreakEvenText(data.breakEvenAnalysis || formatBreakEvenText(data.breakEvenData));
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
      const helpMessage = "I'm not sure how to do a break-even analysis. Can you guide me through it step by step?";
      
      // Add user help message to chat
      const userMessage: Message = { role: 'user', content: helpMessage };
      setMessages(prev => [...prev, userMessage]);
      
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/break-even-analysis`, {
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
      
      // Add assistant help response to chat
      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update break-even analysis data and formatted text if available
      if (data.breakEvenData) {
        setBreakEvenData(data.breakEvenData);
        setFormattedBreakEvenText(data.breakEvenAnalysis || formatBreakEvenText(data.breakEvenData));
      }
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
   * Save the break-even analysis data
   */
  const handleSave = () => {
    if (formattedBreakEvenText) {
      onComplete(formattedBreakEvenText, breakEvenData);
      toast.success('Break-even analysis saved!');
    } else {
      toast.warning('Please provide some break-even analysis information before saving.');
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
          {messages.filter(m => m.role !== 'system').map((message, index) => (
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Break-Even Analysis Preview</h3>
          
          {formattedBreakEvenText ? (
            <>
              <div className="prose max-w-none mb-6">
                <ReactMarkdown>
                  {formattedBreakEvenText}
                </ReactMarkdown>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                This is a preview of your break-even analysis. You can continue the conversation or save this information.
              </div>
              
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Break-Even Analysis
              </button>
            </>
          ) : (
            <div className="text-gray-500 italic">
              Your break-even analysis will appear here as you discuss it in the chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 