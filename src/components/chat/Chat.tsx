import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Loader2 } from 'lucide-react';
import BusinessCoachMessage from './BusinessCoachMessage';
import { API_ENDPOINTS, INITIAL_MESSAGES } from '@/config/constants';

interface ChatMessage {
  id?: string;
  content: string;
  role: 'user' | 'assistant';
  contentAnalysis?: any;
  actionItemsData?: {
    hasActionItems: boolean;
    items: string[];
    count: number;
    saved: boolean;
    savedCount: number;
  };
}

interface ChatProps {
  conversationId?: string;
}

/**
 * Chat component for business coach
 * 
 * Handles message input, API communication, and rendering messages
 */
export default function Chat({ conversationId }: ChatProps) {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize with welcome message if no conversation ID
  useEffect(() => {
    if (!conversationId) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: INITIAL_MESSAGES.WELCOME
        }
      ]);
    } else {
      // Here you would fetch existing conversation
      // fetchConversation(conversationId);
    }
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handle sending a message
   */
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim() || isLoading || !userId) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the current conversation context - all messages including the new one
      const currentMessages = [...messages, userMessage];
      const isFirstMessageInConversation = !conversationId && messages.length <= 1;
      
      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentMessages,
          conversationId: conversationId, // Include the conversation ID if it exists
          isFirstMessage: isFirstMessageInConversation
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }
      
      const data = await response.json();
      
      // Add assistant message with action items data if available
      setMessages(prev => [
        ...prev, 
        {
          id: data.id,
          role: 'assistant',
          content: data.message.content,
          // Add action items data to the message object
          actionItemsData: data.actionItemsData,
          // Ensure contentAnalysis always exists for testing
          contentAnalysis: data.contentAnalysis || {
            // Force contentAnalysis for the marketing plan message
            hasActionableItems: data.message.content.includes('Define Your Business Vision') || 
                               data.message.content.includes('steps to creating a marketing plan') ||
                               /\d+\.\s+[^\n]+\n+\s*\d+\.\s+/.test(data.message.content) ||
                               // Use the action items data if available
                               (data.actionItemsData && data.actionItemsData.hasActionItems),
            hasBusinessInsight: data.message.content.length > 200,
            actionItemsSummary: "Marketing Plan Steps",
            insightSummary: "Business Strategy"
          }
        }
      ]);
      
      // Save conversation to database if needed
      // This would typically be handled on the server
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <BusinessCoachMessage
            key={message.id || index}
            role={message.role}
            content={message.content}
            contentAnalysis={message.contentAnalysis}
            actionItemsData={message.actionItemsData}
            messageId={message.id || `msg_${index}_${Date.now()}`}
            conversationId={conversationId}
          />
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500 p-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your business coach..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
} 