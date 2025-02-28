import React, { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props for the MarketPositioningQuestionnaire component
 */
interface Props {
  /**
   * The ID of the business plan this questionnaire is for
   */
  businessPlanId: string;
  
  /**
   * Function to call when the questionnaire is completed
   * @param positioningText - Formatted text content for the market positioning
   */
  onComplete: (positioningText: string) => void;
}

/**
 * Message interface for chat functionality
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
 * Interface for market positioning data structure
 */
interface MarketPositioningData {
  /**
   * Target audience description
   */
  targetAudience?: string;
  
  /**
   * Specific customer segments
   */
  customerSegments?: string[];
  
  /**
   * Analysis of competitors
   */
  competitiveAnalysis?: string;
  
  /**
   * Positioning statement
   */
  positioningStatement?: string;
  
  /**
   * Unique value proposition
   */
  uniqueValueProposition?: string;
  
  /**
   * Key differentiators in the market
   */
  marketDifferentiators?: string[];
}

/**
 * MarketPositioningQuestionnaire component
 * 
 * Provides a chat interface for discussing and developing market positioning
 * strategy, with a preview of the formatted content
 */
export default function MarketPositioningQuestionnaire({ businessPlanId, onComplete }: Props) {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Let\'s discuss your market positioning strategy. What is your target audience or customer base? (You can also ask for help if you\'re not sure where to start.)'
    }
  ]);
  
  // State for user input
  const [input, setInput] = useState('');
  
  // State for loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // State for market positioning data
  const [positioningData, setPositioningData] = useState<MarketPositioningData>({});
  
  // Reference for auto-scrolling chat
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Effect to load existing data on component mount
  useEffect(() => {
    fetchPositioningData();
  }, [businessPlanId]);
  
  // Effect to scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  /**
   * Fetch existing market positioning data from the API
   */
  const fetchPositioningData = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/positioning`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch market positioning data');
      }
      
      const data = await response.json();
      
      if (data.positioning) {
        setPositioningData(data.positioning);
      }
    } catch (error) {
      console.error('Error fetching market positioning data:', error);
      toast.error('Failed to load your market positioning data');
    } finally {
      setIsDataLoading(false);
    }
  };
  
  /**
   * Format the positioning data into readable text
   */
  const formatPositioningText = (data: MarketPositioningData): string => {
    if (!data || Object.keys(data).length === 0) {
      return '';
    }
    
    let sections = [];
    
    if (data.targetAudience) {
      sections.push(`## Target Audience\n${data.targetAudience}`);
    }
    
    if (data.customerSegments && data.customerSegments.length > 0) {
      sections.push(`## Customer Segments\n${data.customerSegments.map(segment => `- ${segment}`).join('\n')}`);
    }
    
    if (data.positioningStatement) {
      sections.push(`## Positioning Statement\n${data.positioningStatement}`);
    }
    
    if (data.uniqueValueProposition) {
      sections.push(`## Unique Value Proposition\n${data.uniqueValueProposition}`);
    }
    
    if (data.competitiveAnalysis) {
      sections.push(`## Competitive Analysis\n${data.competitiveAnalysis}`);
    }
    
    if (data.marketDifferentiators && data.marketDifferentiators.length > 0) {
      sections.push(`## Market Differentiators\n${data.marketDifferentiators.map(diff => `- ${diff}`).join('\n')}`);
    }
    
    return sections.join('\n\n');
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
      const response = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/positioning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process message');
      }
      
      const data = await response.json();
      
      // Add assistant response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update positioning data if returned
      if (data.positioning) {
        setPositioningData(data.positioning);
      }
      
      // Format the market positioning data
      const formattedText = formatPositioningText(data.positioning);
      
      // Call the onComplete callback with the formatted text
      onComplete(formattedText);
      
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process your message');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle the "Help me" button click to get guidance
   */
  const handleNotSure = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isLoading) return;
    
    setIsLoading(true);
    const helpMessage = "I'm not sure how to approach market positioning. Can you help me understand what it involves?";
    
    // Add user help message to chat
    const userMessage: Message = { role: 'user', content: helpMessage };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Send help request to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/positioning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: helpMessage,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get help');
      }
      
      const data = await response.json();
      
      // Add assistant help response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error getting help:', error);
      toast.error('Failed to get help information');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle saving the final positioning data
   */
  const handleSave = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const formattedText = formatPositioningText(positioningData);
    onComplete(formattedText);
    toast.success('Market positioning information saved');
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm" onClick={(e) => e.stopPropagation()}>
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
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          
          {isLoading && <LoadingIndicator />}
        </div>
        
        <form 
          onSubmit={handleSubmit} 
          className="flex items-start space-x-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
              disabled={isLoading || !input.trim()}
              onClick={(e) => {
                if (!input.trim() || isLoading) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <Send className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              className="bg-gray-200 text-gray-700 p-2 rounded-full hover:bg-gray-300 transition-colors"
              onClick={handleNotSure}
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </form>
      </div>
      
      {/* Right side - Preview */}
      <div className="w-1/2">
        <div className="h-[600px] overflow-y-auto p-4 bg-white rounded-lg border-l-4 border-blue-600 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Market Positioning Preview</h3>
          
          {isDataLoading ? (
            <LoadingIndicator className="justify-center" />
          ) : Object.keys(positioningData).length > 0 ? (
            <>
              <div className="prose max-w-none mb-6">
                <ReactMarkdown>
                  {formatPositioningText(positioningData)}
                </ReactMarkdown>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                This is a preview of your market positioning information. You can continue the conversation or save this information.
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Save Market Positioning
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-500 italic">
              Your market positioning information will appear here as you discuss it in the chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 