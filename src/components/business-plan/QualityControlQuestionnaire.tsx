import React, { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props for the QualityControlQuestionnaire component
 */
interface Props {
  /**
   * The ID of the business plan this questionnaire is for
   */
  businessPlanId: string;
  
  /**
   * Function to call when the questionnaire is completed
   * @param qualityControlText - Formatted text content for the quality control
   * @param qualityControlData - Structured data for the quality control
   */
  onComplete: (qualityControlText: string, qualityControlData: any) => void;
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
 * Interface for quality control data
 */
interface QualityControlData {
  /**
   * Overall quality control approach
   */
  qualityApproach?: string;
  
  /**
   * Quality standards and certifications
   */
  qualityStandards?: string[];
  
  /**
   * Quality control procedures
   */
  qualityProcedures?: string;
  
  /**
   * Testing and inspection methods
   */
  testingMethods?: string;
  
  /**
   * Customer feedback mechanisms
   */
  feedbackMechanisms?: string;
  
  /**
   * Continuous improvement processes
   */
  continuousImprovement?: string;
  
  /**
   * Quality metrics and KPIs
   */
  qualityMetrics?: string;
}

/**
 * Initial system message to guide the conversation
 */
const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: `# Let's discuss your Quality Control approach

I'll help you define how your business ensures quality in your products or services. This includes your quality standards, testing procedures, feedback mechanisms, and continuous improvement processes.

Let's explore:
* What is your overall approach to quality control?
* Do you follow any specific quality standards or certifications?
* What procedures do you have for quality assurance?
* How do you test and inspect your products/services?
* How do you gather and respond to customer feedback?
* What continuous improvement processes do you have in place?
* What metrics do you use to measure quality?

Please share details about your quality control approach.`
};

/**
 * QualityControlQuestionnaire component
 * 
 * Provides a chat interface for discussing and defining the quality control approach
 */
export default function QualityControlQuestionnaire({ businessPlanId, onComplete }: Props) {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  // State for input value
  const [input, setInput] = useState('');
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  // State for data loading
  const [isDataLoading, setIsDataLoading] = useState(true);
  // State for quality control data
  const [qualityData, setQualityData] = useState<QualityControlData>({});
  // Reference for chat container for auto-scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch existing quality control data on component mount
  useEffect(() => {
    if (businessPlanId) {
      fetchQualityControlData();
    }
  }, [businessPlanId]);

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Fetch existing quality control data from the API
   */
  const fetchQualityControlData = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/quality-control`);
      
      if (!response.ok) {
        // It's okay if the data doesn't exist yet
        setIsDataLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.qualityControl) {
        // If we have existing data, add it to the messages
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'I found your existing quality control information. Here is what we have so far:'
          },
          {
            role: 'assistant',
            content: data.qualityControl
          }
        ]);
        
        // Set the formatted text for preview
        setFormattedQualityControlText(data.qualityControl);
      }
      
      setQualityData(data.qualityControlData || {});
    } catch (error) {
      console.error('Error fetching quality control data:', error);
      toast.error('Failed to load existing quality control data');
    } finally {
      setIsDataLoading(false);
    }
  };

  /**
   * Format the quality control data into a markdown text
   */
  const formatQualityControlText = (data: QualityControlData): string => {
    let markdown = '## Quality Control\n\n';
    
    if (data.qualityApproach) {
      markdown += '### Quality Approach\n';
      markdown += data.qualityApproach + '\n\n';
    }
    
    if (data.qualityStandards && data.qualityStandards.length > 0) {
      markdown += '### Quality Standards & Certifications\n';
      data.qualityStandards.forEach((standard) => {
        markdown += `- ${standard}\n`;
      });
      markdown += '\n';
    }
    
    if (data.qualityProcedures) {
      markdown += '### Quality Procedures\n';
      markdown += data.qualityProcedures + '\n\n';
    }
    
    if (data.testingMethods) {
      markdown += '### Testing & Inspection Methods\n';
      markdown += data.testingMethods + '\n\n';
    }
    
    if (data.feedbackMechanisms) {
      markdown += '### Customer Feedback Mechanisms\n';
      markdown += data.feedbackMechanisms + '\n\n';
    }
    
    if (data.continuousImprovement) {
      markdown += '### Continuous Improvement\n';
      markdown += data.continuousImprovement + '\n\n';
    }
    
    if (data.qualityMetrics) {
      markdown += '### Quality Metrics\n';
      markdown += data.qualityMetrics + '\n\n';
    }
    
    return markdown;
  };

  // Generate the formatted quality control text for the preview
  const [formattedQualityControlText, setFormattedQualityControlText] = useState('');

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
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/quality-control`, {
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
      
      // If quality control data was extracted, update state and preview
      if (data.qualityControl) {
        setQualityData(data.qualityControlData || {});
        setFormattedQualityControlText(data.qualityControl);
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
      const helpMessage = 'I need help describing my quality control approach. Can you provide guidance and examples?';
      
      // Add user's help request to messages
      const userMessage: Message = { role: 'user', content: helpMessage };
      setMessages(prev => [...prev, userMessage]);
      
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations/quality-control`, {
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
   * Handle saving the quality control data
   */
  const handleSave = () => {
    if (formattedQualityControlText) {
      onComplete(formattedQualityControlText, qualityData);
      toast.success('Quality control information saved!');
    } else {
      toast.warning('Please provide quality control details before saving');
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Control Preview</h3>
          
          {isDataLoading ? (
            <div className="flex justify-center items-center h-full">
              <LoadingIndicator />
            </div>
          ) : formattedQualityControlText ? (
            <>
              <div className="prose max-w-none mb-6">
                <ReactMarkdown>
                  {formattedQualityControlText}
                </ReactMarkdown>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                This is a preview of your quality control approach. You can continue the conversation or save this information.
              </div>
              
              <button
                onClick={handleSave}
                disabled={isLoading || isDataLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Quality Control Information
              </button>
            </>
          ) : (
            <div className="text-gray-500 italic">
              Your quality control details will appear here as you discuss them in the chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 