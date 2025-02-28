import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import { HelpCircle, Send } from 'lucide-react';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props for the MissionStatementQuestionnaire component
 */
interface MissionStatementQuestionnaireProps {
  businessPlanId: string;
  onComplete: (missionStatementText: string) => void;
}

/**
 * Interface for chat messages
 */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Interface for structured mission statement data
 */
interface MissionData {
  missionStatement: string;
  vision: string;
  coreValues: string[];
  purpose: string;
}

/**
 * MissionStatementQuestionnaire Component
 * 
 * A chat-based interface for gathering information about the company's mission,
 * vision, values, and purpose.
 */
export default function MissionStatementQuestionnaire({
  businessPlanId,
  onComplete
}: MissionStatementQuestionnaireProps) {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([]);
  // State for user input
  const [input, setInput] = useState('');
  // State for loading indicator
  const [loading, setLoading] = useState(false);
  // State for structured mission data
  const [missionData, setMissionData] = useState<MissionData>({
    missionStatement: '',
    vision: '',
    coreValues: [],
    purpose: ''
  });

  // References
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Questions about mission statement to guide the conversation
  const missionQuestions = [
    "What is the core purpose of your business? Why does it exist beyond making money?",
    "What's your vision for the future? Where do you see your business in 5-10 years?",
    "What are 3-5 core values that guide your business decisions and culture?",
    "How would you articulate your mission statement in one concise sentence?",
    "How do your mission, vision, and values differentiate you from competitors?",
    "How do you plan to communicate your mission and values to customers and employees?",
    "What specific impact do you want your business to have on society or your community?"
  ];

  // Initial message to start the conversation
  const initialMessage: Message = {
    id: 'init',
    role: 'assistant',
    content: `# Let's define your mission, vision, and values

A strong mission statement, vision, and core values will guide your business decisions and help communicate your purpose to customers and employees.

**Please tell me about your company's purpose and what you want to achieve. Consider:**

- Why does your business exist?
- What impact do you want to make?
- What principles guide your decisions?

I'll help you craft a compelling mission statement that captures the essence of your business.`
  };

  // Set initial message when component mounts
  useEffect(() => {
    setMessages([initialMessage]);
  }, []);

  // Scroll to bottom of chat container when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Auto-resize textarea based on content
   */
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'inherit';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  /**
   * Handle sending a message to the AI
   */
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!input.trim() || loading) return;
    
    const userMessage: Message = { 
      id: Date.now().toString(),
      role: 'user', 
      content: input 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      setLoading(true);
      
      // Add context message if this is the first user message
      const isFirstMessage = messages.length === 1;
      const messagePayload = isFirstMessage
        ? [...messages, initialMessage, userMessage]
        : [...messages, userMessage];
      
      const response = await fetch(`/api/business-plans/${businessPlanId}/mission-statement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagePayload,
          isFirstMessage
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      const assistantMessage: Message = { 
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: data.message.content 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update mission data if it was extracted
      if (data.missionData) {
        setMissionData(data.missionData);
      }
      
    } catch (error) {
      console.error('Error in conversation:', error);
      toast.error('Failed to process response');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle help button click
   */
  const handleHelpClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add a help message to the chat
    const helpMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `# Creating a Strong Mission Statement

A mission statement should clearly communicate your business's purpose, values, and goals. Here are some tips:

## Key Elements to Include
- **Purpose**: Why your business exists
- **Values**: Core principles that guide your business
- **Goals**: What you aim to achieve
- **Audience**: Who you serve

## Tips for Writing
- Keep it concise (1-3 sentences)
- Use clear, simple language
- Make it memorable and inspiring
- Ensure it's specific to your business
- Avoid jargon and buzzwords

Would you like me to help you draft a mission statement based on your business idea?`
    };
    
    setMessages(prev => [...prev, helpMessage]);
    
    // Scroll to the bottom of the chat
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  /**
   * Handle save button click
   */
  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const formattedText = formatMissionData(missionData);
    console.log('Saving mission data:', missionData);
    console.log('Formatted mission text:', formattedText);
    onComplete(formattedText);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    handleSendMessage();
  };

  /**
   * Handle key press in the textarea
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (but not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSendMessage();
    }
  };

  /**
   * Format mission data into readable text
   */
  const formatMissionData = (data: MissionData): string => {
    let formattedText = '';
    
    if (data.missionStatement) {
      formattedText += `## Mission Statement\n${data.missionStatement}\n\n`;
    }
    
    if (data.vision) {
      formattedText += `## Vision\n${data.vision}\n\n`;
    }
    
    if (data.coreValues.length > 0) {
      formattedText += `## Core Values\n`;
      data.coreValues.forEach(value => {
        formattedText += `- ${value}\n`;
      });
      formattedText += '\n';
    }
    
    if (data.purpose) {
      formattedText += `## Purpose\n${data.purpose}\n\n`;
    }
    
    return formattedText.trim();
  };

  return (
    <div className="flex gap-6">
      {/* Left side - Chat */}
      <div className="w-1/2 space-y-4">
        <div 
          ref={chatContainerRef}
          className="h-[600px] overflow-y-auto p-4 bg-gray-50 rounded-lg scroll-smooth"
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
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <LoadingIndicator type="spinner" />
          )}
        </div>

        {/* Chat input */}
        <form 
          onSubmit={handleSubmit} 
          className="flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none min-h-[80px] resize-none"
              disabled={loading}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleHelpClick}
              disabled={loading}
              className="flex items-center rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              title="Get help with your mission statement"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help
            </button>
            
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={(e) => {
                e.stopPropagation();
                if (!input.trim() || loading) e.preventDefault();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Right side - Mission Statement Preview */}
      <div className="w-1/2 space-y-4">
        <div 
          className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-medium text-blue-700 mb-4">Mission Statement</h3>
          <div className="prose prose-sm max-w-none mb-4 prose-headings:text-blue-600 prose-headings:font-medium prose-headings:text-base prose-p:text-gray-700 prose-li:text-gray-700">
            <ReactMarkdown>{formatMissionData(missionData)}</ReactMarkdown>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSaveClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Mission Statement
            </button>
          </div>
          
          {/* Show a message if mission data exists */}
          {missionData.missionStatement && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
              <p className="text-sm font-medium">Mission statement is ready to save.</p>
              <p className="text-xs mt-1">You can continue the conversation to refine it, or click "Save Mission Statement" to use the current version.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 