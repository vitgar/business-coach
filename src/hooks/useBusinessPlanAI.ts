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
    
    // Extract anything enclosed in backticks as general suggestions
    const backtickSuggestions: FieldSuggestion[] = []
    const backtickPattern = /`([^`]+)`/g
    let backtickMatch
    
    while ((backtickMatch = backtickPattern.exec(content)) !== null) {
      const extractedContent = backtickMatch[1].trim()
      
      // Only add meaningful suggestions that are more than a few words
      // Enhanced validation to filter out incomplete suggestions
      if (extractedContent.length > 20 && // Ensure it's a substantial suggestion
          !extractedContent.match(/^(here's|statement|example|suggestion|version)/i) && // Skip partial intros
          extractedContent.split(' ').length > 5 && // Has at least 5 words
          !extractedContent.endsWith(':') && // Doesn't end with a colon
          extractedContent.match(/[a-z][.!?]/) && // Contains at least one sentence ending
          !extractedContent.match(/^(what|how|who|why|when|where|describe)/i)) { // Not a question
        
        console.log(`[Field Suggestion Debug] Valid suggestion: "${extractedContent.substring(0, 50)}..."`);
        
        backtickSuggestions.push({
          fieldId: 'content', // Default field ID
          content: extractedContent
        })
      } else {
        console.log(`[Field Suggestion Debug] Filtered out incomplete suggestion: "${extractedContent}"`);
      }
    }
    
    // Try to identify field suggestions based on section type
    const fieldPatterns: Record<string, FieldPattern[]> = {
      executiveSummary: [
        { fieldId: 'businessConcept', pattern: /business concept[:\s]+([\s\S]+?)(?=\n\n|\n[#*]|$)/i },
        { fieldId: 'missionStatement', pattern: /mission statement[:\s]+([\s\S]+?)(?=\n\n|\n[#*]|$)/i },
        { 
          fieldId: 'productsOverview', 
          // Improved pattern that avoids capturing incomplete questions
          pattern: /(?:(?:product(?:s)?(?:\/|\s+|\s+and\s+|\s+&\s+)?(?:service(?:s)?)?|service(?:s)?)(?:\s+overview)?):?\s+((?!what|how|why|when|where|who|describe|explain)[\s\S]+?)(?=\n\n|\n[#*]|$)/i 
        },
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
    const patternSuggestions: FieldSuggestion[] = []
    patterns.forEach(({ fieldId, pattern }) => {
      const match = content.match(pattern)
      if (match && match[1] && match[1].trim()) {
        // For all patterns, we now just use the first capture group
        // and ensure it's a non-empty string after trimming
        const extractedContent = match[1].trim();
        
        // Additional validation to ensure high-quality suggestions
        // Skip suggestions that are questions or too short
        if (extractedContent.length > 10 && 
            !extractedContent.includes("?") &&
            !extractedContent.match(/^(what|how|who|why|when|where|describe)/i)) {
          patternSuggestions.push({
            fieldId,
            content: extractedContent
          });
        }
      }
    })
    
    // Combine suggestions from both approaches
    // First we'll collect all suggestions by fieldId
    const suggestionsByField: Record<string, FieldSuggestion[]> = {};
    
    // Add pattern suggestions
    patternSuggestions.forEach(suggestion => {
      if (!suggestionsByField[suggestion.fieldId]) {
        suggestionsByField[suggestion.fieldId] = [];
      }
      suggestionsByField[suggestion.fieldId].push(suggestion);
    });
    
    // Process backtick suggestions with inference
    backtickSuggestions.forEach(suggestion => {
      // Try to match the suggestion to a field by looking for keywords in the content
      let inferredFieldId = 'content'
      
      // Use a simple keyword matching approach for common fields
      const content = suggestion.content.toLowerCase()
      
      // Debug logging for each suggestion
      console.log(`[Field Suggestion Debug] Processing backtick suggestion: "${suggestion.content.substring(0, 50)}..."`);
      
      if (sectionId === 'executiveSummary') {
        // Check for financial highlights first (most specific financial terms)
        let inferenceReason = '';
        
        if ((content.includes('financial') && (content.includes('highlight') || content.includes('projection')))) {
          inferredFieldId = 'financialHighlights';
          inferenceReason = 'contains "financial" + "highlight/projection"';
        } else if (content.includes('revenue') && !content.includes('product')) {
          inferredFieldId = 'financialHighlights';
          inferenceReason = 'contains "revenue" without "product"';
        } else if (content.includes('profit') && !content.includes('product')) {
          inferredFieldId = 'financialHighlights';
          inferenceReason = 'contains "profit" without "product"';
        } else if (content.includes('cash flow')) {
          inferredFieldId = 'financialHighlights';
          inferenceReason = 'contains "cash flow"';
        } else if (content.includes('break-even')) {
          inferredFieldId = 'financialHighlights';
          inferenceReason = 'contains "break-even"';
        } else if (content.includes('investment')) {
          inferredFieldId = 'financialHighlights';
          inferenceReason = 'contains "investment"';
        } else if (content.includes('funding')) {
          inferredFieldId = 'financialHighlights';
          inferenceReason = 'contains "funding"';
        } else if (content.includes('margin') && !content.includes('product')) {
          inferredFieldId = 'financialHighlights';
          inferenceReason = 'contains "margin" without "product"';
        } else if (content.includes('roi')) {
          inferredFieldId = 'financialHighlights';
          inferenceReason = 'contains "roi"';
        } else if (content.includes('sales forecast')) {
          inferredFieldId = 'financialHighlights';
          inferenceReason = 'contains "sales forecast"';
        } else if (content.includes('earning')) {
          inferredFieldId = 'financialHighlights';
          inferenceReason = 'contains "earning"';
        } else if (content.includes('financial projection')) {
          inferredFieldId = 'financialHighlights';
          inferenceReason = 'contains "financial projection"';
        } else if (content.match(/\$[0-9,]+(\.[0-9]{2})?/)) {
          inferredFieldId = 'financialHighlights';
          inferenceReason = 'contains dollar amounts';
        }
        // Check for market opportunity next
        else if ((content.includes('market') && content.includes('opportunity'))) {
          inferredFieldId = 'marketOpportunity';
          inferenceReason = 'contains "market" + "opportunity"';
        } else if (content.includes('market') && content.includes('size')) {
          inferredFieldId = 'marketOpportunity';
          inferenceReason = 'contains "market" + "size"';
        } else if (content.includes('market') && content.includes('growth')) {
          inferredFieldId = 'marketOpportunity';
          inferenceReason = 'contains "market" + "growth"';
        } else if (content.includes('target market')) {
          inferredFieldId = 'marketOpportunity';
          inferenceReason = 'contains "target market"';
        } else if (content.includes('industry growth')) {
          inferredFieldId = 'marketOpportunity';
          inferenceReason = 'contains "industry growth"';
        } else if (content.includes('sector')) {
          inferredFieldId = 'marketOpportunity';
          inferenceReason = 'contains "sector"';
        } else if (content.includes('market share')) {
          inferredFieldId = 'marketOpportunity';
          inferenceReason = 'contains "market share"';
        } else if (content.includes('market segment')) {
          inferredFieldId = 'marketOpportunity';
          inferenceReason = 'contains "market segment"';
        }
        // Check for mission statement
        else if (content.includes('mission')) {
          inferredFieldId = 'missionStatement';
          inferenceReason = 'contains "mission"';
        } else if (content.includes('purpose')) {
          inferredFieldId = 'missionStatement';
          inferenceReason = 'contains "purpose"';
        } else if (content.match(/our\s+mission/i)) {
          inferredFieldId = 'missionStatement';
          inferenceReason = 'matches "our mission" pattern';
        }
        // Check for products/services
        else if ((content.includes('product') || content.includes('service')) && 
                  !content.includes('financial') && 
                  !content.includes('revenue') && 
                  !content.includes('profit') && 
                  !content.includes('margin')) {
          inferredFieldId = 'productsOverview';
          inferenceReason = 'contains "product"/"service" without financial terms';
        } else if (content.includes('offering')) {
          inferredFieldId = 'productsOverview';
          inferenceReason = 'contains "offering"';
        } else if (content.includes('solution ')) {
          inferredFieldId = 'productsOverview';
          inferenceReason = 'contains "solution"';
        } else if (content.match(/we\s+(?:provide|offer|sell|develop)/i)) {
          inferredFieldId = 'productsOverview';
          inferenceReason = 'matches "we provide/offer/sell/develop" pattern';
        }
        // Default to business concept
        else {
          inferredFieldId = 'businessConcept'; // Default for executive summary
          inferenceReason = 'default categorization';
        }
        
        console.log(`[Field Suggestion Debug] Assigned to: ${inferredFieldId} - Reason: ${inferenceReason}`);
        console.log(`[Field Suggestion Debug] Content snippet: "${content.substring(0, 100)}..."`);
      } else if (sectionId === 'companyDescription') {
        if (content.includes('structure') && content.includes('legal')) {
          inferredFieldId = 'legalStructure'
        } else if (content.includes('structure')) {
          inferredFieldId = 'businessStructure'
        } else if (content.includes('history')) {
          inferredFieldId = 'companyHistory'
        }
      }
      
      // Add the suggestion to the appropriate field
      if (!suggestionsByField[inferredFieldId]) {
        suggestionsByField[inferredFieldId] = [];
      }
      suggestionsByField[inferredFieldId].push({
        ...suggestion,
        fieldId: inferredFieldId
      });
    });
    
    // Now select the best suggestion for each field
    // Prefer longer, more complete suggestions
    const finalSuggestions: FieldSuggestion[] = [];
    
    Object.keys(suggestionsByField).forEach(fieldId => {
      const suggestions = suggestionsByField[fieldId];
      
      if (suggestions.length > 0) {
        // Sort by length (descending) - longer suggestions are likely more detailed
        suggestions.sort((a, b) => b.content.length - a.content.length);
        
        // Take only the best suggestion for each field
        finalSuggestions.push(suggestions[0]);
        
        console.log(`[Field Suggestion Debug] Selected best suggestion for ${fieldId}: "${suggestions[0].content.substring(0, 50)}..."`);
      }
    });
    
    // Update state with final suggestions
    if (finalSuggestions.length > 0) {
      setFieldSuggestions(finalSuggestions);
      console.log(`[Field Suggestion Debug] Final suggestions count: ${finalSuggestions.length}`);
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