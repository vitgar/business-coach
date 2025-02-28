'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props interface for the Funding Requirements Questionnaire component
 */
interface FundingRequirementsQuestionnaireProps {
  businessPlanId: string;
  onComplete: (fundingRequirementsText: string, fundingData: any) => void;
}

/**
 * Interface for chat messages
 */
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Interface for funding requirements data structure
 */
interface FundingRequirementsData {
  totalFunding?: number;
  usageBreakdown?: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  sources?: {
    source: string;
    amount: number;
    percentage: number;
  }[];
  timeline?: {
    stage: string;
    timeframe: string;
    amount: number;
  }[];
  repaymentTerms?: string;
  equityOffering?: {
    percentage: number;
    valuation: number;
  };
  returnOnInvestment?: {
    estimatedROI: string;
    breakEvenPoint: string;
  };
  notes?: string[];
}

/**
 * Initial system message to guide the AI assistant
 */
const initialSystemMessage: Message = {
  role: 'system',
  content: `You are helping the user determine their funding requirements for their business plan. 
Guide them through understanding how much money they need to start and operate their business, 
where the money will come from, and how it will be used.

Focus on these key areas:
1. Total funding needed
2. Breakdown of how funds will be used (equipment, inventory, marketing, etc.)
3. Sources of funding (personal investment, loans, investors, etc.)
4. Timeline for funding requirements
5. Terms for repayment or equity offering if applicable

If they're not sure where to start, guide them through each aspect step by step.`
};

/**
 * Initial assistant message to start the conversation
 */
const initialAssistantMessage: Message = {
  role: 'assistant',
  content: "Let's discuss your funding requirements. This section will outline how much money you need to start and operate your business, where it will come from, and how you'll use it. To get started, do you have an idea of the total amount of funding you'll need for your business?"
};

/**
 * Funding Requirements Questionnaire component
 * 
 * A chat interface for discussing and defining funding requirements
 */
export default function FundingRequirementsQuestionnaire({
  businessPlanId,
  onComplete,
}: FundingRequirementsQuestionnaireProps) {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([initialSystemMessage, initialAssistantMessage]);
  
  // State for user input
  const [input, setInput] = useState('');
  
  // State for loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // State for funding requirements data
  const [fundingData, setFundingData] = useState<FundingRequirementsData>({});
  
  // State for formatted funding requirements text
  const [formattedFundingText, setFormattedFundingText] = useState('');
  
  // State for help mode
  const [isInHelpMode, setIsInHelpMode] = useState(false);
  
  // Reference to message container for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch existing funding requirements data when component mounts
  useEffect(() => {
    fetchFundingData();
  }, [businessPlanId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  /**
   * Fetch existing funding requirements data from API
   */
  const fetchFundingData = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/funding-requirements`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch funding requirements data');
      }
      
      const data = await response.json();
      
      if (data.fundingData && Object.keys(data.fundingData).length > 0) {
        setFundingData(data.fundingData);
        
        // Format the funding requirements data into text
        const formattedText = data.fundingRequirements || formatFundingText(data.fundingData);
        setFormattedFundingText(formattedText);
      }
    } catch (error) {
      console.error('Error fetching funding requirements data:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  /**
   * Format funding requirements data into readable text
   * 
   * @param data - Funding requirements data
   * @returns Formatted text
   */
  const formatFundingText = (data: FundingRequirementsData): string => {
    if (!data || Object.keys(data).length === 0) {
      return '';
    }
    
    let text = '## Funding Requirements\n\n';
    
    // Total funding
    if (data.totalFunding) {
      text += `### Total Funding Required\n$${data.totalFunding.toLocaleString()}\n\n`;
    }
    
    // Usage breakdown
    if (data.usageBreakdown && data.usageBreakdown.length > 0) {
      text += '### Funding Usage Breakdown\n';
      data.usageBreakdown.forEach(item => {
        text += `- ${item.category}: $${item.amount.toLocaleString()} (${item.percentage}%)\n`;
      });
      text += '\n';
    }
    
    // Sources of funding
    if (data.sources && data.sources.length > 0) {
      text += '### Funding Sources\n';
      data.sources.forEach(source => {
        text += `- ${source.source}: $${source.amount.toLocaleString()} (${source.percentage}%)\n`;
      });
      text += '\n';
    }
    
    // Timeline for funding
    if (data.timeline && data.timeline.length > 0) {
      text += '### Funding Timeline\n';
      data.timeline.forEach(stage => {
        text += `- ${stage.stage} (${stage.timeframe}): $${stage.amount.toLocaleString()}\n`;
      });
      text += '\n';
    }
    
    // Repayment terms
    if (data.repaymentTerms) {
      text += `### Repayment Terms\n${data.repaymentTerms}\n\n`;
    }
    
    // Equity offering
    if (data.equityOffering) {
      text += '### Equity Offering\n';
      text += `- Percentage: ${data.equityOffering.percentage}%\n`;
      text += `- Valuation: $${data.equityOffering.valuation.toLocaleString()}\n\n`;
    }
    
    // Return on investment
    if (data.returnOnInvestment) {
      text += '### Return on Investment\n';
      text += `- Estimated ROI: ${data.returnOnInvestment.estimatedROI}\n`;
      text += `- Break-Even Point: ${data.returnOnInvestment.breakEvenPoint}\n\n`;
    }
    
    // Additional notes
    if (data.notes && data.notes.length > 0) {
      text += '### Additional Notes\n';
      data.notes.forEach(note => {
        text += `- ${note}\n`;
      });
      text += '\n';
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
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/funding-requirements`, {
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
      
      // Update funding requirements data and formatted text
      if (data.fundingData) {
        setFundingData(data.fundingData);
        setFormattedFundingText(data.fundingRequirements || formatFundingText(data.fundingData));
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
      const helpMessage = "I'm not sure how to determine my funding requirements. Can you guide me through it step by step?";
      
      // Add user help message to chat
      const userMessage: Message = { role: 'user', content: helpMessage };
      setMessages(prev => [...prev, userMessage]);
      
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/funding-requirements`, {
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
      
      // Update funding requirements data and formatted text if available
      if (data.fundingData) {
        setFundingData(data.fundingData);
        setFormattedFundingText(data.fundingRequirements || formatFundingText(data.fundingData));
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
   * Save the funding requirements data
   */
  const handleSave = () => {
    if (formattedFundingText) {
      onComplete(formattedFundingText, fundingData);
      toast.success('Funding requirements saved!');
    } else {
      toast.warning('Please provide some funding requirements information before saving.');
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Funding Requirements Preview</h3>
          
          {formattedFundingText ? (
            <>
              <div className="prose max-w-none mb-6">
                <ReactMarkdown>
                  {formattedFundingText}
                </ReactMarkdown>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                This is a preview of your funding requirements. You can continue the conversation or save this information.
              </div>
              
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Funding Requirements
              </button>
            </>
          ) : (
            <div className="text-gray-500 italic">
              Your funding requirements will appear here as you discuss them in the chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 