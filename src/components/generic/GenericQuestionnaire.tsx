import React, { useState, useEffect, useRef } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import { EnhancedLoadingIndicator } from './LoadingIndicators';

/**
 * Interface for message objects in the chat
 */
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Props for the GenericQuestionnaire component
 * This interface provides all configuration options for the questionnaire
 */
interface GenericQuestionnaireProps {
  // Required core props
  businessPlanId: string;
  sectionId: string; // Identifier for this section type
  onComplete: (formattedText: string) => void;
  
  // Configuration props
  apiEndpoint: string; // API path for this section
  assistantId?: string; // Optional OpenAI assistant ID override
  initialMessage: string; // Starting message for conversation
  systemPrompt: string; // System instructions for the assistant
  
  // UI customization
  title?: string;
  description?: string;
  prompts?: string[]; // Suggested prompts/questions
  helpMessage?: string;
  previewTitle?: string;
  
  // Data handling
  dataFormatter: (data: any) => string; // Function to format data to markdown
  dataParser?: (content: string) => any; // Optional function to parse markdown to structured data
  
  // State control
  isEditing?: boolean;
  initialData?: any;
}

/**
 * GenericQuestionnaire component
 * 
 * A flexible, configurable questionnaire component that can be used for any section
 * of the business plan. It provides a chat interface for user interaction and a preview
 * panel for formatted content.
 */
export default function GenericQuestionnaire({
  businessPlanId,
  sectionId,
  onComplete,
  apiEndpoint,
  assistantId,
  initialMessage,
  systemPrompt,
  title = 'Questionnaire',
  description,
  prompts = [],
  helpMessage,
  previewTitle,
  dataFormatter,
  dataParser,
  isEditing = true,
  initialData = {}
}: GenericQuestionnaireProps) {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialMessage }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data state
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [sectionData, setSectionData] = useState<any>(initialData);
  const [formattedContent, setFormattedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // UI refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * System message to keep responses focused on the current section
   */
  const FOCUS_REMINDER: Message = {
    role: 'system',
    content: systemPrompt
  };

  /**
   * Fetch existing section data when component mounts
   */
  useEffect(() => {
    if (businessPlanId) {
      fetchSectionData();
    }
  }, [businessPlanId]);

  /**
   * Update formatted content when section data changes
   */
  useEffect(() => {
    if (Object.keys(sectionData).length > 0) {
      try {
        const formatted = dataFormatter(sectionData);
        setFormattedContent(formatted);
      } catch (error) {
        console.error(`Error formatting ${sectionId} data:`, error);
      }
    }
  }, [sectionData, dataFormatter]);

  /**
   * Scroll to bottom whenever messages change or loading state changes
   */
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isLoading]);

  /**
   * Fetch existing section data from the API
   */
  const fetchSectionData = async () => {
    setIsDataLoading(true);
    try {
      // Determine the appropriate endpoint based on section configuration
      const endpoint = `/api/business-plans/${businessPlanId}${apiEndpoint}`;
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${sectionId} data`);
      }
      
      const data = await response.json();
      
      // Extract the section data based on the section ID
      // This handles different API response structures
      let sectionContent = {};
      
      if (data[sectionId]) {
        // Format 1: Direct section data
        sectionContent = data[sectionId];
      } else if (data.businessDescription && data.businessDescription[sectionId]) {
        // Format 2: Nested within businessDescription (common for business-description endpoints)
        sectionContent = { content: data.businessDescription[sectionId] };
      } else if (data.content && data.content[sectionId]) {
        // Format 3: Nested within content object
        sectionContent = data.content[sectionId];
      } else {
        // Fallback to old behavior
        sectionContent = data[sectionId] || data.content?.[sectionId] || {};
      }
      
      console.log(`Fetched ${sectionId} data:`, sectionContent);
      setSectionData(sectionContent);
      
      // Format the data if it exists
      if (Object.keys(sectionContent).length > 0) {
        // For string data, convert to object with content property
        const dataToFormat = typeof sectionContent === 'string' ? { content: sectionContent } : sectionContent;
        
        const formatted = dataFormatter(dataToFormat);
        setFormattedContent(formatted);
      }
    } catch (error) {
      console.error(`Error fetching ${sectionId} data:`, error);
      toast.error(`Failed to load ${sectionId} data`);
    } finally {
      setIsDataLoading(false);
    }
  };

  /**
   * Handle form submission to send user message
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!input.trim() || isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Add user message to chat
      const userMessage: Message = { role: 'user', content: input };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      
      // Prepare API request with current messages and system prompt
      const endpoint = `/api/business-plans/${businessPlanId}${apiEndpoint}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, FOCUS_REMINDER, userMessage],
          isFirstMessage: messages.length === 1,
          assistantId: assistantId, // Pass custom assistant ID if provided
          sectionId: sectionId // Include the sectionId in the request
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to process ${sectionId} message`);
      }
      
      const data = await response.json();
      
      // Add assistant response to messages
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message?.content || data.message 
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update section data if returned in response
      // Handle multiple possible response formats
      let updatedData = null;
      
      // Check for businessPlanData in the response first (from OPENAI_BUSINESS_PLAN_CREATOR_ID)
      if (data.businessPlanData && Object.keys(data.businessPlanData).length > 0) {
        console.log(`Received business plan data for ${sectionId}:`, data.businessPlanData);
        updatedData = data.businessPlanData;
      } else if (data[sectionId]) {
        // Format 1: Direct section data
        console.log(`Received ${sectionId} data from API:`, data[sectionId]);
        updatedData = data[sectionId];
      } else if (data.businessDescription && data.businessDescription[sectionId]) {
        // Format 2: Nested within businessDescription
        console.log(`Received ${sectionId} data from businessDescription:`, data.businessDescription[sectionId]);
        updatedData = { content: data.businessDescription[sectionId] };
      } else if (data.content && data.content[sectionId]) {
        // Format 3: Nested within content
        console.log(`Received ${sectionId} data from content:`, data.content[sectionId]);
        updatedData = data.content[sectionId];
      }
      
      // If we have data in any format, update the section data and formatted content
      if (updatedData) {
        setSectionData(updatedData);
        
        // For string data, convert to object with content property
        const dataToFormat = typeof updatedData === 'string' ? { content: updatedData } : updatedData;
        
        const formatted = dataFormatter(dataToFormat);
        setFormattedContent(formatted);
      }
    } catch (error) {
      console.error(`Error sending ${sectionId} message:`, error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle help button click to get assistance
   */
  const handleNotSure = async () => {
    try {
      setIsLoading(true);
      
      // Create a help message that maintains focus on the current section
      const helpSystemMessage: Message = {
        role: 'system',
        content: helpMessage || `The user needs help defining their ${sectionId}. Break down the current task into simpler parts and provide 2-3 specific examples.`
      };
      
      const helpUserMessage: Message = { 
        role: 'user', 
        content: "I need some examples to help me think about this." 
      };
      
      // Send help request to API
      const endpoint = `/api/business-plans/${businessPlanId}${apiEndpoint}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, helpSystemMessage, helpUserMessage],
          isFirstMessage: false,
          isHelp: true,
          assistantId: assistantId,
          sectionId: sectionId // Include the sectionId in the request for consistency
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get help');
      }
      
      const data = await response.json();
      
      // Add assistant response to messages
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message?.content || data.message 
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update section data if returned in response
      // Handle multiple possible response formats
      let updatedData = null;
      
      if (data[sectionId]) {
        // Format 1: Direct section data
        console.log(`Received ${sectionId} data from API:`, data[sectionId]);
        updatedData = data[sectionId];
      } else if (data.businessDescription && data.businessDescription[sectionId]) {
        // Format 2: Nested within businessDescription
        console.log(`Received ${sectionId} data from businessDescription:`, data.businessDescription[sectionId]);
        updatedData = { content: data.businessDescription[sectionId] };
      } else if (data.content && data.content[sectionId]) {
        // Format 3: Nested within content
        console.log(`Received ${sectionId} data from content:`, data.content[sectionId]);
        updatedData = data.content[sectionId];
      }
      
      // If we have data in any format, update the section data and formatted content
      if (updatedData) {
        setSectionData(updatedData);
        
        // For string data, convert to object with content property
        const dataToFormat = typeof updatedData === 'string' ? { content: updatedData } : updatedData;
        
        // Update formatted content
        const formatted = dataFormatter(dataToFormat);
        setFormattedContent(formatted);
      }
    } catch (error) {
      console.error('Error getting help:', error);
      toast.error('Failed to get help');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle save button click to save the current data
   */
  const handleSave = () => {
    try {
      setIsSaving(true);
      console.log(`Saving ${sectionId} data:`, sectionData);
      console.log(`Formatted ${sectionId} text:`, formattedContent);
      
      // Call the onComplete callback with the formatted content
      onComplete(formattedContent);
      
      toast.success(`${title} saved successfully`);
    } catch (error) {
      console.error(`Error saving ${sectionId}:`, error);
      toast.error(`Failed to save ${sectionId}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left side - Chat interface */}
        <div className="flex-1 border rounded-lg shadow-sm bg-white overflow-hidden">
          <div className="p-6">
            {/* Chat messages container */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 border-b border-gray-200"
              style={{ maxHeight: '500px' }}
            >
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div 
                    className={`max-w-3/4 rounded-lg p-3 ${
                      message.role === 'assistant' 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator for messages */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-3/4 rounded-lg">
                    <EnhancedLoadingIndicator 
                      isLoading={isLoading}
                      sectionId={sectionId}
                      businessPlanId={businessPlanId}
                      sectionName={title}
                    />
                  </div>
                </div>
              )}
              
              {/* Reference for auto-scrolling */}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Suggested prompts - Dropdown implementation */}
            {prompts.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="relative">
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        setInput(e.target.value);
                        // Reset the select after selection
                        e.target.value = "";
                      }
                    }}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md bg-white text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a suggested question...</option>
                    {prompts.map((prompt, index) => (
                      <option key={index} value={prompt}>
                        {prompt}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            {/* Input form */}
            <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
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
          </div>
        </div>

        {/* Right side - Preview panel */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-lg font-medium text-gray-800">{previewTitle || `${title} Preview`}</h3>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
            {isDataLoading ? (
              <div className="flex items-center justify-center h-full">
                <EnhancedLoadingIndicator 
                  isLoading={isDataLoading}
                  sectionId={sectionId}
                  businessPlanId={businessPlanId}
                  sectionName={title}
                />
              </div>
            ) : (
              <>
                {formattedContent ? (
                  <div className="prose prose-sm max-w-none mb-4 prose-headings:text-blue-600 prose-headings:font-medium prose-headings:text-base prose-p:text-gray-700 prose-li:text-gray-700">
                    <ReactMarkdown>{formattedContent}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    {`${title} information will be displayed here. Continue the conversation to generate content.`}
                  </p>
                )}
              </>
            )}
          </div>
          
          {/* Save button */}
          <div className="p-4 border-t flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving || !formattedContent}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Saving...</span>
                </>
              ) : (
                `Save ${title}`
              )}
            </button>
          </div>
          
          {/* Status message if data exists */}
          {Object.keys(sectionData).length > 0 && (
            <div className="px-4 pb-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
                <p className="text-sm font-medium">{title} data is loaded and ready to save.</p>
                <p className="text-xs mt-1">You can continue the conversation to refine it, or click "Save {title}" to use the current data.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 