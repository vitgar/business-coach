'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, User, Bot, PlusCircle, Loader2, List } from 'lucide-react'
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
 * Enhanced action item list interface with color and topic information
 */
interface EnhancedActionItemList {
  id: string;
  name: string;
  color?: string;
  topicId?: string;
  parentId?: string;
}

// Available colors for lists
const LIST_COLORS = [
  'light-blue',
  'light-green',
  'light-purple',
  'light-orange',
  'light-pink',
  'light-teal',
  'light-yellow',
  'light-red',
];

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
 * @param {Array<EnhancedActionItemList>} props.actionItemLists - Available action item lists
 * @param {Function} props.onListChange - Callback when the selected list changes
 * @param {Function} props.onCreateList - Callback when a new list is created
 * @param {Function} props.onNewAssistantMessage - Callback when a new assistant message is received
 * @param {Function} props.onUserMessage - Callback when a user message is received
 */
export default function SimpleChat({ 
  businessId,
  onCreateActionItem,
  placeholderExamples = ["Type your message..."],
  currentListId = 'default',
  actionItemLists = [],
  onListChange,
  onCreateList,
  onNewAssistantMessage,
  onUserMessage
}: { 
  businessId?: string;
  onCreateActionItem?: (content: string, listId?: string) => void;
  placeholderExamples?: string[];
  currentListId?: string;
  actionItemLists?: Array<EnhancedActionItemList>;
  onListChange?: (listId: string) => void;
  onCreateList?: (name: string, color: string, topicId?: string, parentId?: string) => Promise<string>;
  onNewAssistantMessage?: (content: string, messageId?: string, conversationId?: string, allMessages?: Array<{role: string; content: string}>, conversationContext?: any) => void;
  onUserMessage?: (content: string) => void;
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
  
  // Store the topic-specific list ID
  const [topicListId, setTopicListId] = useState<string | null>(null);
  
  // Use refs to keep track of the latest values without triggering re-renders
  const actionItemListsRef = useRef(actionItemLists);
  const onCreateListRef = useRef(onCreateList);
  const onListChangeRef = useRef(onListChange);
  
  // Update refs when props change
  useEffect(() => {
    actionItemListsRef.current = actionItemLists;
    onCreateListRef.current = onCreateList;
    onListChangeRef.current = onListChange;
  }, [actionItemLists, onCreateList, onListChange]);
  
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
  
  // Handle topic change and create a list for new topics
  useEffect(() => {
    // Skip if there's no topic ID
    if (!conversationContext.currentTopicId) {
      return;
    }
    
    // Check if we already have a list for this topic
    const existingList = actionItemListsRef.current.find(list => 
      list.topicId === conversationContext.currentTopicId
    );
    
    if (existingList) {
      // If list exists, set it as the current list
      setTopicListId(existingList.id);
      if (onListChangeRef.current) {
        onListChangeRef.current(existingList.id);
      }
    } else if (onCreateListRef.current) {
      // If no list exists for this topic, create one
      const topicName = conversationContext.currentTopicId.replace(/-/g, ' ');
      const randomColor = LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)];
      
      // Create a new list for this topic
      onCreateListRef.current(topicName, randomColor, conversationContext.currentTopicId)
        .then(newListId => {
          setTopicListId(newListId);
          if (onListChangeRef.current) {
            onListChangeRef.current(newListId);
          }
        })
        .catch(err => {
          console.error('Error creating list for topic:', err);
        });
    }
  }, [conversationContext.currentTopicId]); // Only depend on the topic ID changing
  
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
    
    // Call the onUserMessage callback if provided
    if (onUserMessage) {
      onUserMessage(inputValue.trim());
    }
    
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
      
      // Process the response to remove option selection patterns that cause branching
      let processedMessageContent = data.messageContent;
      
      // Remove "Would you like to continue with one of these topics?" pattern
      processedMessageContent = processedMessageContent.replace(
        /Would you like to continue with one of these topics\?[\s\S]*?(I'd like to discuss something else)/g,
        ''
      );
      
      // Remove "Continue with:" options
      processedMessageContent = processedMessageContent.replace(
        /Continue with: [^\n]+\n/g,
        ''
      );
      
      // Create assistant message from the processed response
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: processedMessageContent.trim() || data.messageContent,
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
        // Create action item in the topic-specific list if available
        const listIdToUse = topicListId || currentListId;
        createActionItem(actionItemContent, listIdToUse);
      }
      
      // Check if this is the first message (no existing conversation ID)
      const isFirstMessage = !conversationContext.currentTopicId && messages.length <= 2;
      
      // If this is the first message, save the conversation and use the title
      if (isFirstMessage && data.title) {
        // Create a new conversation with this title
        const newConversationResponse = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: data.title,
            businessId: businessId
          })
        })
        
        if (newConversationResponse.ok) {
          const conversationData = await newConversationResponse.json()
          // Set the current conversation ID
          setConversationContext(prev => ({
            ...prev,
            currentTopicId: conversationData.id
          }))
          
          // If the onNewAssistantMessage callback is provided, call it
          if (onNewAssistantMessage) {
            // Pass all messages for complete history
            const allMessagesHistory = messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }));
            allMessagesHistory.push({
              role: 'assistant',
              content: processedMessageContent
            });
            
            onNewAssistantMessage(
              processedMessageContent, 
              assistantMessage.id, 
              conversationData.id, 
              allMessagesHistory,
              data.conversationContext
            )
          }
        }
      } else {
        // If the onNewAssistantMessage callback is provided, call it
        if (onNewAssistantMessage) {
          // Pass all messages for complete history
          const allMessagesHistory = messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          allMessagesHistory.push({
            role: 'assistant',
            content: processedMessageContent
          });
          
          onNewAssistantMessage(
            processedMessageContent, 
            assistantMessage.id, 
            conversationContext.currentTopicId, 
            allMessagesHistory,
            data.conversationContext
          )
        }
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
   * @param content Content of the action item
   * @param listId Optional list ID to create in (defaults to current list)
   */
  const createActionItem = (content: string, listId?: string) => {
    if (onCreateActionItem) {
      // Use the provided list ID, or fall back to topic list or current list
      const listIdToUse = listId || topicListId || currentListId;
      onCreateActionItem(content, listIdToUse);
      
      // Find the list name for the toast message
      const listName = actionItemListsRef.current.find(list => list.id === listIdToUse)?.name || listIdToUse;
      toast.success(`Action item added to "${listName}" list`);
    }
  };
  
  /**
   * Create a new sublist
   */
  const createNewSublist = () => {
    if (!onCreateListRef.current) return;
    
    const listName = prompt('Enter a name for the new sublist:');
    if (!listName || !listName.trim()) return;
    
    const randomColor = LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)];
    const parentListId = topicListId || currentListId;
    
    onCreateListRef.current(listName.trim(), randomColor, conversationContext.currentTopicId, parentListId)
      .then(newListId => {
        if (onListChangeRef.current) {
          onListChangeRef.current(newListId);
        }
      })
      .catch(err => {
        console.error('Error creating sublist:', err);
        toast.error('Failed to create sublist');
      });
  };
  
  // Use a fixed color for the UI instead of dynamically changing based on list color
  const fixedUIColor = 'light-blue';
  
  // Map color names to actual CSS classes
  const getColorClass = (color: string) => {
    switch(color) {
      case 'light-blue': return 'bg-blue-600';
      case 'light-green': return 'bg-green-600';
      case 'light-purple': return 'bg-purple-600';
      case 'light-orange': return 'bg-orange-600';
      case 'light-pink': return 'bg-pink-600';
      case 'light-teal': return 'bg-teal-600';
      case 'light-yellow': return 'bg-yellow-600';
      case 'light-red': return 'bg-red-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Chat header with fixed color instead of dynamic color */}
      <div className={`${getColorClass(fixedUIColor)} text-white px-4 py-3 flex justify-between items-center`}>
        <div className="flex items-center">
          <Bot className="w-5 h-5 mr-2" />
          <h3 className="font-medium">How To Helper</h3>
          {conversationContext.currentTopicId && (
            <span className="ml-2 text-xs bg-white bg-opacity-20 rounded px-1.5 py-0.5">
              Topic: {conversationContext.currentTopicId.replace(/-/g, ' ')}
            </span>
          )}
        </div>
        
        {/* List selector with create sublist option */}
        <div className="flex items-center">
          <span className="text-xs mr-2">Add to:</span>
          <select 
            value={topicListId || currentListId}
            onChange={(e) => {
              if (e.target.value === 'new-list') {
                // Create a new list
                const listName = prompt('Enter a name for the new list:');
                if (listName && listName.trim() && onCreateListRef.current) {
                  const randomColor = LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)];
                  onCreateListRef.current(listName.trim(), randomColor, conversationContext.currentTopicId)
                    .then(newListId => {
                      if (onListChangeRef.current) {
                        onListChangeRef.current(newListId);
                        setTopicListId(newListId);
                      }
                    });
                }
              } else if (onListChangeRef.current) {
                onListChangeRef.current(e.target.value);
                setTopicListId(e.target.value);
              }
            }}
            className="text-xs bg-opacity-20 bg-white text-white border border-white border-opacity-30 rounded px-1 py-0.5 mr-2"
          >
            {actionItemListsRef.current.map(list => (
              <option key={list.id} value={list.id}>
                {list.name} {list.parentId ? '(sub)' : ''}
              </option>
            ))}
            <option value="new-list">+ New List</option>
          </select>
          
          {/* Create sublist button */}
          {(topicListId || currentListId) && (
            <button 
              onClick={createNewSublist}
              className="text-xs bg-white bg-opacity-20 rounded p-1"
              title="Create a sublist"
            >
              <List size={12} />
            </button>
          )}
        </div>
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
                  ? `${getColorClass(fixedUIColor)} text-white rounded-tr-none`
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
                    title={`Add to ${actionItemListsRef.current.find(list => list.id === (topicListId || currentListId))?.name || 'current'} list`}
                  >
                    <PlusCircle className="w-3 h-3 mr-1" />
                    Create Action Item
                    <span className="ml-1 text-xs text-gray-500 italic">
                      ({actionItemListsRef.current.find(list => list.id === (topicListId || currentListId))?.name || 'current'})
                    </span>
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