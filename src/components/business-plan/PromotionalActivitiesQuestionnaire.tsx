import React, { useState, useEffect, useRef } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props for the PromotionalActivitiesQuestionnaire component
 */
interface Props {
  /**
   * The ID of the business plan this questionnaire is for
   */
  businessPlanId: string;
  
  /**
   * Function to call when the questionnaire is completed
   * @param promotionalText - Formatted text content for the promotional activities
   */
  onComplete: (promotionalText: string) => void;
}

/**
 * Message structure for chat interface
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
 * Structure for promotional activities data
 */
interface PromotionalActivitiesData {
  /**
   * Marketing channels to be used
   */
  marketingChannels?: string[];
  
  /**
   * Advertising strategies and planned campaigns
   */
  advertisingStrategy?: string;
  
  /**
   * Content marketing approach
   */
  contentMarketing?: string;
  
  /**
   * Social media strategy
   */
  socialMediaStrategy?: string;
  
  /**
   * Public relations activities
   */
  publicRelations?: string;
  
  /**
   * Promotions, discounts, and special offers
   */
  promotions?: string;
}

/**
 * Initial system message to guide the conversation
 */
const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: `# Let's discuss your promotional activities

I'll help you define your promotional activities strategy. This includes your advertising approach, content marketing, social media strategy, and other promotional efforts.

Let's explore:
* What marketing channels do you plan to use?
* How will you approach advertising?
* What role will content marketing play in your strategy?
* How will you use social media?
* What public relations activities do you have planned?
* What promotions or special offers might you run?

Please share your thoughts or specific questions about your promotional strategy.`
};

/**
 * PromotionalActivitiesQuestionnaire component
 * 
 * Provides a chat interface for discussing and defining promotional activities
 */
export default function PromotionalActivitiesQuestionnaire({ businessPlanId, onComplete }: Props) {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  // State for input value
  const [input, setInput] = useState('');
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  // State for data loading
  const [isDataLoading, setIsDataLoading] = useState(true);
  // State for promotional activities data
  const [promotionalData, setPromotionalData] = useState<PromotionalActivitiesData>({});
  // State for help mode
  const [isInHelpMode, setIsInHelpMode] = useState(false);
  // Reference for chat container for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch existing promotional activities data on component mount
  useEffect(() => {
    if (businessPlanId) {
      fetchPromotionalData();
    }
  }, [businessPlanId]);

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Fetch existing promotional activities data from the API
   */
  const fetchPromotionalData = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/promotional`);
      
      if (!response.ok) {
        // It's okay if the data doesn't exist yet
        setIsDataLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.promotional) {
        // If we have existing data, add it to the messages
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'I found your existing promotional activities strategy. Here is what we have so far:'
          },
          {
            role: 'assistant',
            content: data.promotional
          }
        ]);
      }
      
      setPromotionalData(data.promotionalData || {});
    } catch (error) {
      console.error('Error fetching promotional activities data:', error);
      toast.error('Failed to load existing promotional activities data');
    } finally {
      setIsDataLoading(false);
    }
  };

  /**
   * Format the promotional activities data into a markdown text
   */
  const formatPromotionalText = (data: PromotionalActivitiesData): string => {
    let markdown = '## Promotional Activities Strategy\n\n';
    
    if (data.marketingChannels && data.marketingChannels.length > 0) {
      markdown += '### Marketing Channels\n';
      markdown += data.marketingChannels.map(channel => `- ${channel}`).join('\n');
      markdown += '\n\n';
    }
    
    if (data.advertisingStrategy) {
      markdown += '### Advertising Strategy\n';
      markdown += data.advertisingStrategy + '\n\n';
    }
    
    if (data.contentMarketing) {
      markdown += '### Content Marketing\n';
      markdown += data.contentMarketing + '\n\n';
    }
    
    if (data.socialMediaStrategy) {
      markdown += '### Social Media Strategy\n';
      markdown += data.socialMediaStrategy + '\n\n';
    }
    
    if (data.publicRelations) {
      markdown += '### Public Relations\n';
      markdown += data.publicRelations + '\n\n';
    }
    
    if (data.promotions) {
      markdown += '### Promotions & Special Offers\n';
      markdown += data.promotions + '\n\n';
    }
    
    return markdown;
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
      const response = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/promotional`, {
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
      
      // If promotional data was extracted, update state and preview
      if (data.promotional) {
        setPromotionalData(data.promotionalData || {});
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      setIsInHelpMode(false);
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
      const helpMessage = 'I need help defining my promotional activities. Can you provide some examples and guidance?';
      
      // Add user's help request to messages
      const userMessage: Message = { role: 'user', content: helpMessage };
      setMessages(prev => [...prev, userMessage]);
      
      const response = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/promotional`, {
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
   * Handle save button click
   * Prevents default behavior and stops propagation to avoid scrolling issues
   */
  const handleSave = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const formattedText = formatPromotionalText(promotionalData);
    onComplete(formattedText);
    toast.success('Promotional activities strategy saved!');
  };

  // Generate the formatted promotional text for the preview
  const formattedPromotionalText = formatPromotionalText(promotionalData);

  return (
    <div className="bg-white rounded-lg shadow-sm" onClick={(e) => e.stopPropagation()}>
      {/* Chat container */}
      <div 
        ref={chatContainerRef}
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
      
      {/* Form */}
      <form 
        onSubmit={handleSubmit} 
        className="flex items-start space-x-2"
        onClick={(e) => e.stopPropagation()}
      >
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
      
      {/* Right side - Preview */}
      <div className="w-1/2">
        <div className="h-[600px] overflow-y-auto p-4 bg-white rounded-lg border-l-4 border-blue-600 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Promotional Strategy Preview</h3>
          
          {isDataLoading ? (
            <div className="flex justify-center items-center h-full">
              <LoadingIndicator />
            </div>
          ) : Object.keys(promotionalData).length > 0 ? (
            <>
              <div className="prose max-w-none mb-6">
                <ReactMarkdown>
                  {formattedPromotionalText}
                </ReactMarkdown>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                This is a preview of your promotional activities strategy. You can continue the conversation or save this information.
              </div>
              
              <button
                onClick={handleSave}
                disabled={isLoading || isDataLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Promotional Strategy
              </button>
            </>
          ) : (
            <div className="text-gray-500 italic">
              Your promotional activities strategy will appear here as you discuss it in the chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 