import { useState } from 'react'

/**
 * Chat message interface
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Field suggestion interface
 */
export interface FieldSuggestion {
  fieldId: string;
  content: string;
}

/**
 * Field pattern interface for extraction
 */
interface FieldPattern {
  fieldId: string;
  pattern: RegExp;
}

/**
 * Custom hook for interacting with the Business Plan AI Assistant
 * 
 * Provides functions to send messages to the AI and manage conversation state
 * 
 * @param businessPlanId - ID of the current business plan
 * @param sectionId - Current section ID (e.g., "executiveSummary")
 * @param onSuggestionApplied - Optional callback when a suggestion is applied to a field
 * @returns Object containing messages, loading state, and functions
 */
export function useBusinessPlanAI(
  businessPlanId: string, 
  sectionId: string,
  onSuggestionApplied?: (fieldId: string, content: string) => void
) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fieldSuggestions, setFieldSuggestions] = useState<FieldSuggestion[]>([])
  
  /**
   * Send a message to the AI assistant
   * 
   * @param message - User's message text
   */
  const sendMessage = async (message: string) => {
    setIsLoading(true)
    
    try {
      // Add user message to history
      const userMessage: ChatMessage = { role: 'user', content: message };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages)
      
      // Send to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/ai-assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionId,
          message,
          conversationHistory: newMessages,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to get AI response')
      
      const data = await response.json()
      
      // Add AI response to messages
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.message };
      setMessages([...newMessages, assistantMessage])
      
      // Extract potential field suggestions
      extractFieldSuggestions(data.message)
    } catch (error) {
      console.error('Error getting AI assistance:', error)
      // Add error message
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error trying to help with that. Please try again or refresh the page.' 
      };
      setMessages([...messages, errorMessage])
      
      // Clear any previous suggestions
      setFieldSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Extract potential field suggestions from AI response
   * Uses pattern matching and heuristics to identify content that might be appropriate for fields
   * 
   * @param content - AI response message content
   */
  const extractFieldSuggestions = (content: string) => {
    // Clear previous suggestions
    setFieldSuggestions([])
    
    // Try to identify field suggestions based on section type
    const fieldPatterns: Record<string, FieldPattern[]> = {
      executiveSummary: [
        { fieldId: 'businessConcept', pattern: /business concept[:\s]+([\s\S]+?)(?=\n\n|\n[#*]|$)/i },
        { fieldId: 'missionStatement', pattern: /mission statement[:\s]+([\s\S]+?)(?=\n\n|\n[#*]|$)/i },
        { fieldId: 'productsOverview', pattern: /products?(\/|\s+)services?[:\s]+([\s\S]+?)(?=\n\n|\n[#*]|$)/i },
        { fieldId: 'marketOpportunity', pattern: /market opportunity[:\s]+([\s\S]+?)(?=\n\n|\n[#*]|$)/i },
        { fieldId: 'financialHighlights', pattern: /financial highlights?[:\s]+([\s\S]+?)(?=\n\n|\n[#*]|$)/i },
      ],
      companyDescription: [
        { fieldId: 'businessStructure', pattern: /business structure[:\s]+([\s\S]+?)(?=\n\n|\n[#*]|$)/i },
        { fieldId: 'legalStructure', pattern: /legal structure[:\s]+([\s\S]+?)(?=\n\n|\n[#*]|$)/i },
        { fieldId: 'companyHistory', pattern: /company history[:\s]+([\s\S]+?)(?=\n\n|\n[#*]|$)/i },
      ],
      // Add patterns for other sections as needed
    }
    
    // Get patterns for this section or default to generic content pattern
    const patterns = fieldPatterns[sectionId] || [
      { fieldId: 'content', pattern: /([\s\S]+)/i }
    ]
    
    // Find matches for each pattern
    const suggestions: FieldSuggestion[] = []
    patterns.forEach(({ fieldId, pattern }) => {
      const match = content.match(pattern)
      if (match && match[1]) {
        suggestions.push({
          fieldId,
          content: match[1].trim()
        })
      }
    })
    
    // Update state with any found suggestions
    if (suggestions.length > 0) {
      setFieldSuggestions(suggestions)
    }
  }
  
  /**
   * Apply a suggestion to a specific form field
   * 
   * @param fieldId - ID of the field to apply the suggestion to
   * @param content - Content to apply to the field
   */
  const applySuggestion = (fieldId: string, content: string) => {
    if (onSuggestionApplied) {
      onSuggestionApplied(fieldId, content)
    }
  }
  
  /**
   * Clear all messages in the conversation
   */
  const clearConversation = () => {
    setMessages([])
    setFieldSuggestions([])
  }
  
  return {
    messages,
    isLoading,
    sendMessage,
    clearConversation,
    fieldSuggestions,
    applySuggestion
  }
} 