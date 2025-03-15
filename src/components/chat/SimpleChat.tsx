'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, User, Bot, PlusCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'

/**
 * Message interface for typing chat messages
 */
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

/**
 * Conversation context for maintaining state with the AI
 */
interface ConversationContext {
  currentTopicId?: string;
  currentActionItemId?: string;
  workingOnChildItems: boolean;
  completedSteps: number;
  totalSteps?: number;
}

/**
 * Action item interface for items extracted from messages
 */
interface ExtractedActionItem {
  content: string;
  description?: string;
  priorityLevel?: string;
  progress?: string;
  isChildItem: boolean;
  parentId?: string;
  stepNumber?: number;
}

/**
 * SimpleChat Component
 * 
 * Provides a basic chat interface for the action items page
 * 
 * @param {Object} props - Component properties
 * @param {string} props.businessId - Optional business ID to associate messages with
 * @param {Function} props.onCreateActionItem - Callback when an action item is created
 * @param {string[]} props.placeholderExamples - Optional array of example questions to rotate in the placeholder
 * @param {string} props.currentListId - Current action item list ID to add items to
 * @param {Array<{id: string, name: string}>} props.actionItemLists - Available action item lists
 * @param {Function} props.onListChange - Callback when the selected list changes
 */
export default function SimpleChat({ 
  businessId,
  onCreateActionItem,
  placeholderExamples = ["Type your message..."],
  currentListId = 'default',
  actionItemLists = [],
  onListChange
}: { 
  businessId?: string;
  onCreateActionItem?: (content: string) => void;
  placeholderExamples?: string[];
  currentListId?: string;
  actionItemLists?: Array<{id: string, name: string}>;
  onListChange?: (listId: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your How To Helper. I can provide step-by-step guidance on business activities. What specific business task would you like help with today? For example, you can ask about registering your business, creating a marketing plan, or setting up your finances.",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(placeholderExamples[0]);
  // Conversation context to maintain state with the AI
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    workingOnChildItems: false,
    completedSteps: 0
  });
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Rotate through placeholder examples
  useEffect(() => {
    if (placeholderExamples.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % placeholderExamples.length;
        setCurrentPlaceholder(placeholderExamples[nextIndex]);
        return nextIndex;
      });
    }, 3000); // Change every 3 seconds
    
    return () => clearInterval(interval);
  }, [placeholderExamples]);
  
  /**
   * Scroll to the bottom of the chat container
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  /**
   * Handle sending a new message
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Prepare message history for the API (last 6 messages)
      const messageHistory = messages.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));
      
      // Call the how-to-helper API with the user's message and current context
      const response = await fetch('/api/how-to-helper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputValue,
          businessId,
          conversationContext,
          userId: undefined, // We could pass user ID if available
          messageHistory    // Pass the conversation history
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }
      
      const data = await response.json();
      
      // Create assistant message from the response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.messageContent,
        role: 'assistant',
        timestamp: new Date()
      };
      
      // Add assistant message to chat
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation context
      if (data.conversationContext) {
        setConversationContext(data.conversationContext);
      }
      
      // If the message contains an action item, create it
      if (data.containsActionItem && data.actionItem && onCreateActionItem) {
        // Format action item content
        const actionItemContent = formatActionItemContent(data.actionItem);
        // Create action item
        createActionItem(actionItemContent);
      }
      
    } catch (error) {
      console.error('Error getting response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I had trouble processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Format action item content from the extracted action item
   */
  const formatActionItemContent = (actionItem: ExtractedActionItem): string => {
    // For child items with step numbers, format as "Step X: Content"
    // For parent items, just use the content
    let content = actionItem.isChildItem && actionItem.stepNumber 
      ? `Step ${actionItem.stepNumber}: ${actionItem.content}`
      : actionItem.content;
    
    // Add description if available, but only if it's not redundant with the content
    if (actionItem.description && !content.includes(actionItem.description)) {
      content += `\n\n${actionItem.description}`;
    }
    
    // Don't include priority and status in the content as they'll be stored as properties
    // and displayed separately in the UI
    
    return content;
  };
  
  /**
   * Handle keyboard events for sending messages
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  /**
   * Create an action item from a message
   */
  const createActionItem = (content: string) => {
    if (onCreateActionItem) {
      onCreateActionItem(content);
      toast.success(`Action item added to "${currentListId}" list`);
    }
  };
  
  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Chat header */}
      <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Bot className="w-5 h-5 mr-2" />
          <h3 className="font-medium">How To Helper</h3>
        </div>
        
        {/* List selector - only show if we have lists */}
        {actionItemLists.length > 1 && (
          <div className="flex items-center">
            <span className="text-xs mr-2">Add to:</span>
            <select 
              value={currentListId}
              onChange={(e) => {
                if (e.target.value === 'new-list') {
                  // Create a new list
                  const listName = prompt('Enter a name for the new list:');
                  if (listName && listName.trim() && onListChange) {
                    const newListId = `list-${Date.now()}`;
                    // We need to notify the parent component to create the new list
                    // This is a basic implementation - in a real app, you'd use a proper function
                    window.dispatchEvent(new CustomEvent('create-list', { 
                      detail: { id: newListId, name: listName.trim() } 
                    }));
                    onListChange(newListId);
                  }
                } else if (onListChange) {
                  onListChange(e.target.value);
                }
              }}
              className="text-xs bg-blue-700 text-white border border-blue-500 rounded px-1 py-0.5"
            >
              {actionItemLists.map(list => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
              <option value="new-list">+ New List</option>
            </select>
          </div>
        )}
      </div>
      
      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white border border-gray-200 shadow-sm rounded-tl-none'
              }`}
            >
              <div className="flex items-center mb-1">
                {message.role === 'assistant' ? (
                  <Bot className="w-4 h-4 mr-1 text-blue-600" />
                ) : (
                  <User className="w-4 h-4 mr-1 text-white" />
                )}
                <span className={`text-xs ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.role === 'assistant' ? 'Helper' : 'You'} • {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`whitespace-pre-wrap ${message.role === 'assistant' ? 'text-gray-800' : ''}`}>
                {message.content}
              </div>
              
              {/* Action item creation button for assistant messages */}
              {message.role === 'assistant' && (
                <div className="mt-2 text-right">
                  <button
                    onClick={() => createActionItem(message.content)}
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                    title={`Add to ${currentListId} list`}
                  >
                    <PlusCircle className="w-3 h-3 mr-1" />
                    Create Action Item
                    <span className="ml-1 text-xs text-gray-500 italic">({currentListId})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center mb-4">
            <div className="bg-white border border-gray-200 rounded-lg p-3 rounded-tl-none shadow-sm">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          </div>
        )}
        
        {/* Conversation status indicator */}
        {conversationContext.currentTopicId && conversationContext.totalSteps && (
          <div className="mb-4 px-3 py-2 bg-blue-50 text-blue-800 text-xs rounded-md">
            <p className="font-medium">
              {conversationContext.workingOnChildItems 
                ? "Creating action items" 
                : conversationContext.currentTopicId.replace(/-/g, ' ')
              }
              {conversationContext.completedSteps > 0 && conversationContext.totalSteps > 0 && (
                <span className="ml-2">
                  (Step {conversationContext.completedSteps} of {conversationContext.totalSteps})
                </span>
              )}
            </p>
          </div>
        )}
        
        {/* Ref for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 p-3 bg-white">
        <div className="flex items-center space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentPlaceholder}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 