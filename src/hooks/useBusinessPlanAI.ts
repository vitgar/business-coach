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
   * @param currentSectionData - Current data for the active section (if available)
   */
  const sendMessage = async (message: string, currentSectionData?: any) => {
    setIsLoading(true)
    
    try {
      // Add user message to history
      const userMessage: ChatMessage = { role: 'user', content: message };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages)
      
      // Check if the message is a "Let's work on" request and there's existing content
      const isWorkOnRequest = message.toLowerCase().includes("let's work on") || 
                             message.toLowerCase().includes("let us work on") ||
                             message.toLowerCase().includes("work on the");
      
      const hasExistingContent = currentSectionData && 
                               Object.keys(currentSectionData).length > 0 &&
                               Object.values(currentSectionData).some(
                                 value => value && typeof value === 'string' && value.trim() !== ''
                               );
      
      // If it's a "Let's work on" request and there's existing content, provide a custom response
      if (isWorkOnRequest && hasExistingContent) {
        console.log('[BusinessPlanAI] Detected "Let\'s work on" request with existing content');
        
        // Create a custom response acknowledging the existing content
        const assistantMessage: ChatMessage = { 
          role: 'assistant', 
          content: `I see you already have some information in this section. How would you like to proceed? I can help you:\n\n` +
                  `- Review and improve the existing content\n` +
                  `- Add more details to specific areas\n` +
                  `- Start fresh with new ideas\n` +
                  `- Focus on a particular aspect of this section\n\n` +
                  `Let me know what you'd like to do, and I'll help you make this section even better!`
        };
        
        setMessages([...newMessages, assistantMessage]);
        setFieldSuggestions([]);
        setIsLoading(false);
        return;
      }
      
      // Otherwise, proceed with the normal API call
      const response = await fetch(`/api/business-plans/${businessPlanId}/ai-assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionId,
          message,
          conversationHistory: newMessages,
          businessPlanData: currentSectionData // Pass the current section data to the API
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
   * Focuses only on finding content in backticks to provide as suggestions
   * 
   * @param content - AI response message content
   */
  const extractFieldSuggestions = (content: string) => {
    // Clear previous suggestions
    setFieldSuggestions([])
    
    console.log(`[Field Extraction Debug] Processing message of length: ${content.length}`);
    
    // Check if there are any backticks in the content at all
    if (!content.includes('`')) {
      console.log('[Field Extraction Debug] No backticks found in message');
      return;
    }
    
    // Count backticks for debugging
    const backtickCount = (content.match(/`/g) || []).length;
    console.log(`[Field Extraction Debug] Found ${backtickCount} backticks in message`);
    
    // Extract anything enclosed in backticks as general suggestions
    const backtickSuggestions: FieldSuggestion[] = [];
    
    // Try multiple approaches to extract backtick content to ensure we find everything
    
    // 1. Standard regex approach for paired backticks
    const backtickPattern = /`([^`]+)`/g;
    let backtickMatch;
    let matchCount = 0;
    
    while ((backtickMatch = backtickPattern.exec(content)) !== null) {
      matchCount++;
      let extractedContent = backtickMatch[1].trim();
      
      if (extractedContent.length > 0) {
        console.log(`[Field Extraction Debug] Backtick match #${matchCount}: "${extractedContent.substring(0, 50)}..."`);
        
        // Add all backtick content as generic 'content' suggestions
        // We'll map them to specific fields at display time based on current context
        backtickSuggestions.push({
          fieldId: 'content',
          content: extractedContent
        });
      }
    }
    
    // 2. Alternative approach using string splitting if regex fails
    if (matchCount === 0 && backtickCount >= 2) {
      console.log('[Field Extraction Debug] Using alternative backtick extraction');
      
      const parts = content.split('`');
      
      // Odd-indexed parts are inside backticks (1, 3, 5, etc.)
      for (let i = 1; i < parts.length; i += 2) {
        if (parts[i] && parts[i].trim().length > 0) {
          const extractedContent = parts[i].trim();
          console.log(`[Field Extraction Debug] Alternative extraction: "${extractedContent.substring(0, 50)}..."`);
          
          backtickSuggestions.push({
            fieldId: 'content',
            content: extractedContent
          });
        }
      }
    }
    
    console.log(`[Field Extraction Debug] Total suggestions extracted: ${backtickSuggestions.length}`);
    
    // Set field suggestions directly from backtick content
    if (backtickSuggestions.length > 0) {
      setFieldSuggestions(backtickSuggestions);
    }
  }
  
  /**
   * Process extracted backtick content into a field suggestion
   */
  const processExtractedContent = (extractedContent: string, suggestions: FieldSuggestion[]) => {
    // Log the raw extracted content for debugging
    console.log(`[Raw Content] Extracted content to process: "${extractedContent}"`);
    
    // Define section-specific words that might indicate the field type
    const sectionKeywords: Record<string, Record<string, string[]>> = {
      executiveSummary: {
        businessConcept: ['business concept', 'business idea', 'concept'],
        missionStatement: ['mission', 'mission statement'],
        productsOverview: ['products', 'services', 'products overview', 'services overview', 'offerings'],
        marketOpportunity: ['market opportunity', 'opportunity', 'market need'],
        financialHighlights: ['financial', 'financials', 'highlights', 'financial highlights', 'revenue'],
        managementTeam: ['management', 'team', 'management team', 'leadership'],
        milestones: ['milestones', 'timeline', 'achievements', 'goals']
      }
      // Add keywords for other sections as needed
    };
    
    // Check if the extracted content starts with a known section prefix
    // and set an initial fieldId based on that
    let initialFieldId = 'content';
    const prefixFieldMap: Record<string, string> = {
      'ownership details:': 'ownershipDetails',
      'business structure:': 'businessStructure',
      'legal structure:': 'legalStructure',
      'company history:': 'companyHistory',
      'mission statement:': 'missionStatement',
      'business concept:': 'businessConcept',
      'products overview:': 'productsOverview',
      'products/services overview:': 'productsOverview',
      'market opportunity:': 'marketOpportunity',
      'financial highlights:': 'financialHighlights',
      'management team:': 'managementTeam',
      'key milestones:': 'milestones',
      // Products and Services prefixes
      'overview:': 'overview',
      'value proposition:': 'valueProposition',
      'intellectual property:': 'intellectualProperty',
      'future products:': 'futureProducts'
    };
    
    // First, check for exact prefixes (case insensitive)
    const lowerContent = extractedContent.toLowerCase();
    for (const [prefix, fieldId] of Object.entries(prefixFieldMap)) {
      if (lowerContent.startsWith(prefix)) {
        console.log(`[Field Extraction Debug] Found prefix "${prefix}" in content`);
        initialFieldId = fieldId;
        break;
      }
    }
    
    // If no exact prefix match, check if there's a field name in the first few words of the content
    if (initialFieldId === 'content') {
      const firstWords = lowerContent.split(/\s+/).slice(0, 5).join(' ');
      
      // Check if any prefix is contained in the first few words
      for (const [prefix, fieldId] of Object.entries(prefixFieldMap)) {
        const cleanPrefix = prefix.replace(':', '').trim();
        if (firstWords.includes(cleanPrefix)) {
          console.log(`[Field Extraction Debug] Found prefix "${cleanPrefix}" in first words`);
          initialFieldId = fieldId;
          break;
        }
      }
    }
    
    // If still no match, use section-specific keywords to attempt identification
    if (initialFieldId === 'content' && sectionKeywords[sectionId]) {
      const sectionFields = sectionKeywords[sectionId];
      
      // Check each field's keywords
      for (const [fieldId, keywords] of Object.entries(sectionFields)) {
        // Check if any keyword is found in the content
        const keywordFound = keywords.some((keyword: string) => lowerContent.includes(keyword));
        if (keywordFound) {
          console.log(`[Field Extraction Debug] Found keyword match for ${fieldId}`);
          initialFieldId = fieldId;
          break;
        }
      }
    }
    
    // Accept any content that's not completely empty
    if (extractedContent.trim().length > 0) {
      console.log(`[Field Extraction Debug] Adding suggestion for ${initialFieldId}"`);
      
      // Add to suggestions regardless of length or content
      suggestions.push({
        fieldId: initialFieldId,
        content: extractedContent
      });
    } else {
      console.log(`[Field Extraction Debug] Content empty after trimming, skipping`);
    }
  }
  
  /**
   * Apply a field suggestion to update the business plan
   * 
   * @param fieldId - ID of the field to apply the suggestion to
   * @param content - Content to apply to the field
   */
  const applySuggestion = (fieldId: string, content: string) => {
    console.log(`[Apply Suggestion] Applying content to field ${fieldId}: "${content.substring(0, 50)}..."`);
    console.log(`[Apply Suggestion] In section: ${sectionId}`);
    
    // Log the current field that we're working with
    const fieldDisplayName = fieldId === 'content' ? 'Unknown Field' : fieldId;
    console.log(`[Apply Suggestion] Field display name: ${fieldDisplayName}`);
    
    // Use the callback to apply the suggestion directly
    if (onSuggestionApplied) {
      console.log(`[Apply Suggestion] Calling onSuggestionApplied for field: ${fieldId}`);
      onSuggestionApplied(fieldId, content);
    } else {
      console.warn(`[Apply Suggestion] No callback provided for applying suggestion to field: ${fieldId}`);
    }
  }
  
  /**
   * Clear all messages in the conversation
   */
  const clearConversation = () => {
    setMessages([])
    setFieldSuggestions([])
  }
  
  // Return the hook interface
  return {
    messages,
    setMessages, // Expose setMessages function for direct manipulation
    isLoading,
    sendMessage,
    clearConversation,
    fieldSuggestions,
    applySuggestion
  }
} 