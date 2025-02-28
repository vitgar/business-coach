import React, { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props for the InventoryManagementQuestionnaire component
 */
interface Props {
  /**
   * The ID of the business plan this questionnaire is for
   */
  businessPlanId: string;
  
  /**
   * Function to call when the questionnaire is completed
   * @param inventoryText - Formatted text content for the inventory management
   * @param inventoryData - Structured data for the inventory management
   */
  onComplete: (inventoryText: string, inventoryData: any) => void;
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
 * Interface for inventory management data
 */
interface InventoryManagementData {
  /**
   * Overall inventory management approach
   */
  inventoryApproach?: string;
  
  /**
   * Inventory tracking systems and methods
   */
  trackingSystems?: string;
  
  /**
   * Inventory storage solutions
   */
  storageSolutions?: string;
  
  /**
   * Reorder points and policies
   */
  reorderPolicies?: string;
  
  /**
   * Supplier management approach
   */
  supplierManagement?: string;
  
  /**
   * Inventory turnover goals
   */
  inventoryTurnover?: string;
  
  /**
   * Seasonal inventory considerations
   */
  seasonalConsiderations?: string;
}

/**
 * Initial system message to guide the conversation
 */
const initialMessage: Message = {
  role: 'system',
  content: `Let's discuss your inventory management approach. This is an important part of your operations that affects cash flow, customer satisfaction, and overall efficiency.

Please share details about:
- How you plan to track and manage inventory
- Your storage solutions and facilities
- Reorder points and policies
- Supplier relationships and management
- Inventory turnover goals
- Any seasonal considerations

If you're not sure where to start, I can guide you through each aspect.`
};

/**
 * InventoryManagementQuestionnaire component
 * 
 * A chat interface for discussing and defining the inventory management approach
 */
export default function InventoryManagementQuestionnaire({ businessPlanId, onComplete }: Props) {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  
  // State for user input
  const [input, setInput] = useState('');
  
  // State for loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // State for inventory data
  const [inventoryData, setInventoryData] = useState<InventoryManagementData>({});
  
  // State for formatted inventory text
  const [formattedInventoryText, setFormattedInventoryText] = useState('');
  
  // State for help mode
  const [isInHelpMode, setIsInHelpMode] = useState(false);
  
  // Reference to message container for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch existing inventory data when component mounts
  useEffect(() => {
    fetchInventoryData();
  }, [businessPlanId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  /**
   * Fetch existing inventory management data from API
   */
  const fetchInventoryData = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/inventory`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory data');
      }
      
      const data = await response.json();
      
      if (data.inventoryData) {
        setInventoryData(data.inventoryData);
        
        // Format the inventory data into text
        const formattedText = formatInventoryText(data.inventoryData);
        setFormattedInventoryText(formattedText);
        
        // Add a message showing the existing data
        if (Object.keys(data.inventoryData).length > 0) {
          setMessages([
            initialMessage,
            {
              role: 'assistant',
              content: 'I see you already have some inventory management information. Would you like to review and update it?'
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      // Don't show error toast as this might be the first time setting up inventory
    } finally {
      setIsDataLoading(false);
    }
  };
  
  /**
   * Format inventory data into readable text
   * 
   * @param data - The inventory management data to format
   * @returns Formatted markdown text
   */
  const formatInventoryText = (data: InventoryManagementData): string => {
    let text = '## Inventory Management\n\n';
    
    if (data.inventoryApproach) {
      text += '### Inventory Management Approach\n';
      text += data.inventoryApproach + '\n\n';
    }
    
    if (data.trackingSystems) {
      text += '### Tracking Systems\n';
      text += data.trackingSystems + '\n\n';
    }
    
    if (data.storageSolutions) {
      text += '### Storage Solutions\n';
      text += data.storageSolutions + '\n\n';
    }
    
    if (data.reorderPolicies) {
      text += '### Reorder Points & Policies\n';
      text += data.reorderPolicies + '\n\n';
    }
    
    if (data.supplierManagement) {
      text += '### Supplier Management\n';
      text += data.supplierManagement + '\n\n';
    }
    
    if (data.inventoryTurnover) {
      text += '### Inventory Turnover Goals\n';
      text += data.inventoryTurnover + '\n\n';
    }
    
    if (data.seasonalConsiderations) {
      text += '### Seasonal Considerations\n';
      text += data.seasonalConsiderations + '\n\n';
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
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/inventory`, {
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
      
      // Update inventory data and formatted text
      if (data.inventoryData) {
        setInventoryData(data.inventoryData);
        setFormattedInventoryText(data.inventory || formatInventoryText(data.inventoryData));
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
      const helpMessage = "I'm not sure what to include in my inventory management approach. Can you guide me through the key aspects?";
      
      // Add user message to chat
      const userMessage: Message = { role: 'user', content: helpMessage };
      setMessages(prev => [...prev, userMessage]);
      
      // Send message to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/inventory`, {
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
   * Save the inventory management data
   */
  const handleSave = () => {
    if (formattedInventoryText) {
      onComplete(formattedInventoryText, inventoryData);
      toast.success('Inventory management information saved!');
    } else {
      toast.warning('Please provide some inventory management information before saving.');
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Management Preview</h3>
          
          {formattedInventoryText ? (
            <>
              <div className="prose max-w-none mb-6">
                <ReactMarkdown>
                  {formattedInventoryText}
                </ReactMarkdown>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                This is a preview of your inventory management approach. You can continue the conversation or save this information.
              </div>
              
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Inventory Management
              </button>
            </>
          ) : (
            <div className="text-gray-500 italic">
              Your inventory management details will appear here as you discuss them in the chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 