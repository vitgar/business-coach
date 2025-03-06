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
   * Focuses ONLY on finding content in backticks (`) to provide as suggestions
   * Content in quotes (") is NEVER extracted
   * 
   * @param content - AI response message content
   */
  const extractFieldSuggestions = (content: string) => {
    // Clear previous suggestions
    setFieldSuggestions([])
    
    console.log(`[Field Extraction Debug] Processing message of length: ${content.length}`);
    console.log('[Field Extraction Debug] CRITICAL: We ONLY extract content in backticks (`), NOT in quotes (")');
    
    // Initialize suggestions array
    const backtickSuggestions: FieldSuggestion[] = [];
    
    // SPECIAL CASE: Dedicated Market Opportunity extraction
    const extractMarketOpportunityContent = () => {
      console.log('[Market Opportunity Debug] Running specialized Market Opportunity extraction');
      
      // CRITICAL: We ONLY want to extract content wrapped in backticks (`), NOT double quotes
      console.log('[Market Opportunity Debug] CRITICALLY CHECKING: Looking ONLY for content in backticks (`), NOT in quotes (")');
      
      // First do a quick check for backticks - if none, don't even try
      if (!content.includes('`')) {
        console.log('[Market Opportunity Debug] NO BACKTICKS FOUND - Aborting Market Opportunity extraction');
        return false;
      }
      
      // Safe extraction function that ensures content is from backticks not quotes
      const safeExtractContent = (match: RegExpExecArray, groupIndex: number): string | null => {
        if (!match || !match[groupIndex]) return null;
        
        const potentialContent = match[groupIndex].trim();
        
        // Check if this content appears anywhere in the text inside quotes instead of backticks
        // This is to prevent extracting content that was actually in quotes
        const quotePattern = new RegExp(`"([^"]*${potentialContent.substring(0, 20)}[^"]*)"`, 'i');
        const quoteMatch = quotePattern.exec(content);
        
        if (quoteMatch) {
          console.log('[Market Opportunity Debug] ALERT: Content appears in quotes, not only in backticks - REJECTING');
          return null;
        }
        
        // Verify the content actually appears inside backticks in the original text
        const backtickPattern = new RegExp(`\`([^\`]*${potentialContent.substring(0, 20)}[^\`]*)\``, 'i');
        const backtickMatch = backtickPattern.exec(content);
        
        if (!backtickMatch) {
          console.log('[Market Opportunity Debug] ALERT: Content not found inside backticks - REJECTING');
          return null;
        }
        
        console.log('[Market Opportunity Debug] VERIFIED: Content is properly inside backticks');
        return potentialContent;
      };
      
      // Define patterns that ONLY match Market Opportunity content that is properly wrapped in backticks
      const marketOpportunityPatterns = [
        // Pattern 1: Standard format with field prefix - "Market Opportunity: `content`"
        /Market Opportunity:?\s*`([^`]+)`/i,
        
        // Pattern 2: Standard suggestion format - "market opportunity suggestion: `content`"
        /market opportunity suggestion:?\s*`([^`]+)`/i,
        
        // Pattern 3: Any pattern with "market opportunity" followed by backticks
        /market opportunity[^`]*`([^`]+)`/i,
        
        // Pattern 4: Field prefix format with hyphen - "- Market Opportunity: `content`"
        /^\s*-\s*Market Opportunity:\s*`([^`]+)`/im,
        
        // Pattern 5: "Here's a market opportunity..." format with backticks
        /here'?s a market opportunity[^`]*`([^`]+)`/i
      ];
      
      // Only search for backtick-enclosed content
      console.log('[Market Opportunity Debug] STRICTLY searching for backtick-enclosed content only');
      
      // Try each pattern in sequence - ONLY checking for backtick-enclosed content
      for (let i = 0; i < marketOpportunityPatterns.length; i++) {
        const pattern = marketOpportunityPatterns[i];
        const match = pattern.exec(content);
        
        if (match && match[1] && match[1].trim().length > 20) {
          // Use the safe extraction function to verify content is from backticks
          const extractedContent = safeExtractContent(match, 1);
          
          if (extractedContent) {
            console.log(`[Market Opportunity Debug] Found backtick-enclosed content with pattern ${i+1}: "${extractedContent.substring(0, 50)}..."`);
            
            // Create a Market Opportunity suggestion
            backtickSuggestions.push({
              fieldId: 'marketOpportunity',
              content: extractedContent
            });
            
            return true; // Successfully extracted Market Opportunity content
          }
        }
      }
      
      // If we reach here, check for any content enclosed in backticks after the words "market opportunity"
      // This is a final fallback to find any backtick content related to market opportunity
      const anyMarketBacktickPattern = /(market\s+opportunit[^`]*)`([^`]+)`/i;
      const anyMarketBacktickMatch = anyMarketBacktickPattern.exec(content);
      
      if (anyMarketBacktickMatch && anyMarketBacktickMatch[2] && anyMarketBacktickMatch[2].trim().length > 20) {
        const extractedContent = anyMarketBacktickMatch[2].trim();
        console.log(`[Market Opportunity Debug] Found backtick content after "market opportunity": "${extractedContent.substring(0, 50)}..."`);
        
        backtickSuggestions.push({
          fieldId: 'marketOpportunity',
          content: extractedContent
        });
        
        return true;
      }
      
      // If no backtick content found, log it clearly
      console.log('[Market Opportunity Debug] NO BACKTICK CONTENT FOUND - Market Opportunity content must be enclosed in backticks (`)');
      return false; // No backtick-enclosed Market Opportunity content found
    };
    
    // SPECIAL CASE: Dedicated Financial Highlights extraction 
    const extractFinancialHighlightsContent = () => {
      console.log('[Financial Highlights Debug] Running specialized Financial Highlights extraction');
      
      // CRITICAL: We ONLY want to extract content wrapped in backticks (`), NOT double quotes
      console.log('[Financial Highlights Debug] CRITICALLY CHECKING: Looking ONLY for content in backticks (`), NOT in quotes (")');
      
      // First do a quick check for backticks - if none, don't even try
      if (!content.includes('`')) {
        console.log('[Financial Highlights Debug] NO BACKTICKS FOUND - Aborting Financial Highlights extraction');
        return false;
      }
      
      // Safe extraction function that ensures content is from backticks not quotes
      const safeExtractContent = (match: RegExpExecArray, groupIndex: number): string | null => {
        if (!match || !match[groupIndex]) return null;
        
        const potentialContent = match[groupIndex].trim();
        
        // Check if this content appears anywhere in the text inside quotes instead of backticks
        // This is to prevent extracting content that was actually in quotes
        const quotePattern = new RegExp(`"([^"]*${potentialContent.substring(0, 20)}[^"]*)"`, 'i');
        const quoteMatch = quotePattern.exec(content);
        
        if (quoteMatch) {
          console.log('[Financial Highlights Debug] ALERT: Content appears in quotes, not only in backticks - REJECTING');
          return null;
        }
        
        // Verify the content actually appears inside backticks in the original text
        const backtickPattern = new RegExp(`\`([^\`]*${potentialContent.substring(0, 20)}[^\`]*)\``, 'i');
        const backtickMatch = backtickPattern.exec(content);
        
        if (!backtickMatch) {
          console.log('[Financial Highlights Debug] ALERT: Content not found inside backticks - REJECTING');
          return null;
        }
        
        console.log('[Financial Highlights Debug] VERIFIED: Content is properly inside backticks');
        return potentialContent;
      };
      
      // Define patterns that ONLY match Financial Highlights content that is properly wrapped in backticks
      const financialHighlightsPatterns = [
        // Pattern 1: Standard format with field prefix - "Financial Highlights: `content`"
        /Financial Highlights:?\s*`([^`]+)`/i,
        
        // Pattern 2: Standard suggestion format - "financial highlights suggestion: `content`"
        /financial highlights suggestion:?\s*`([^`]+)`/i,
        
        // Pattern 3: Any pattern with "financial highlights" followed by backticks
        /financial highlights[^`]*`([^`]+)`/i,
        
        // Pattern 4: Field prefix format with hyphen - "- Financial Highlights: `content`"
        /^\s*-\s*Financial Highlights:\s*`([^`]+)`/im,
        
        // Pattern 5: "Here's a financial highlights..." format with backticks
        /here'?s (?:a|some) financial highlights[^`]*`([^`]+)`/i
      ];
      
      // Only search for backtick-enclosed content
      console.log('[Financial Highlights Debug] STRICTLY searching for backtick-enclosed content only');
      
      // Try each pattern in sequence - ONLY checking for backtick-enclosed content
      for (let i = 0; i < financialHighlightsPatterns.length; i++) {
        const pattern = financialHighlightsPatterns[i];
        const match = pattern.exec(content);
        
        if (match && match[1] && match[1].trim().length > 20) {
          // Use the safe extraction function to verify content is from backticks
          const extractedContent = safeExtractContent(match, 1);
          
          if (extractedContent) {
            console.log(`[Financial Highlights Debug] Found backtick-enclosed content with pattern ${i+1}: "${extractedContent.substring(0, 50)}..."`);
            
            // Create a Financial Highlights suggestion
            backtickSuggestions.push({
              fieldId: 'financialHighlights',
              content: extractedContent
            });
            
            return true; // Successfully extracted Financial Highlights content
          }
        }
      }
      
      // If we reach here, check for any content enclosed in backticks after the words "financial highlights"
      // This is a final fallback to find any backtick content related to financial highlights
      const anyFinancialBacktickPattern = /(financial\s+highlight[^`]*)`([^`]+)`/i;
      const anyFinancialBacktickMatch = anyFinancialBacktickPattern.exec(content);
      
      if (anyFinancialBacktickMatch && anyFinancialBacktickMatch[2] && anyFinancialBacktickMatch[2].trim().length > 20) {
        const extractedContent = anyFinancialBacktickMatch[2].trim();
        console.log(`[Financial Highlights Debug] Found backtick content after "financial highlights": "${extractedContent.substring(0, 50)}..."`);
        
        backtickSuggestions.push({
          fieldId: 'financialHighlights',
          content: extractedContent
        });
        
        return true;
      }
      
      // If no backtick content found, log it clearly
      console.log('[Financial Highlights Debug] NO BACKTICK CONTENT FOUND - Financial Highlights content must be enclosed in backticks (`)');
      return false; // No backtick-enclosed Financial Highlights content found
    };
    
    // First attempt specialized Market Opportunity extraction for backtick content
    const foundMarketOpportunity = extractMarketOpportunityContent();
    
    // If we found Market Opportunity content, set it and return
    if (foundMarketOpportunity && backtickSuggestions.length > 0) {
      console.log(`[Field Extraction Debug] Setting ${backtickSuggestions.length} Market Opportunity suggestion(s) from backticks`);
      setFieldSuggestions(backtickSuggestions);
      return;
    }
    
    // Then try specialized Financial Highlights extraction
    const foundFinancialHighlights = extractFinancialHighlightsContent();
    
    // If we found Financial Highlights content, set it and return
    if (foundFinancialHighlights && backtickSuggestions.length > 0) {
      console.log(`[Field Extraction Debug] Setting ${backtickSuggestions.length} Financial Highlights suggestion(s) from backticks`);
      setFieldSuggestions(backtickSuggestions);
      return;
    }
    
    // If no backtick content found, check for backtick content for all fields
    // Check if there are any backticks in the content at all
    if (!content.includes('`')) {
      console.log('[Field Extraction Debug] No backticks found in message - NO SUGGESTIONS will be extracted');
      return;
    }
    
    // Count backticks for debugging
    const backtickCount = (content.match(/`/g) || []).length;
    console.log(`[Field Extraction Debug] Found ${backtickCount} backticks in message`);
    
    // Safe extraction function that ensures content is from backticks not quotes
    const safeExtractContent = (extractedText: string): string | null => {
      if (!extractedText || extractedText.trim().length < 10) return null;
      
      const potentialContent = extractedText.trim();
      
      // Verify content appears inside backticks in the original text
      try {
        // Try to escape any regex special characters in the content
        const safePrefix = potentialContent.substring(0, 10).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const backtickPattern = new RegExp(`\`([^\`]*${safePrefix}[^\`]*)\``, 'i');
        const backtickMatch = backtickPattern.exec(content);
        
        if (!backtickMatch) {
          console.log('[Field Extraction Debug] ALERT: Content not verified inside backticks - REJECTING');
          return null;
        }
        
        // Check if it might also appear in quotes - if so, be cautious
        const quotePattern = new RegExp(`"([^"]*${safePrefix}[^"]*)"`, 'i');
        const quoteMatch = quotePattern.exec(content);
        
        if (quoteMatch) {
          console.log('[Field Extraction Debug] WARNING: Content appears in quotes as well - checking context');
          // Additional check: is the content more prominently backticked or quoted?
          const backtickContext = content.indexOf('`' + potentialContent);
          const quoteContext = content.indexOf('"' + potentialContent);
          
          if (backtickContext === -1 || (quoteContext !== -1 && quoteContext < backtickContext)) {
            console.log('[Field Extraction Debug] ALERT: Content more prominently in quotes - REJECTING');
            return null;
          }
        }
        
        return potentialContent;
      } catch (e) {
        // If regex fails, fall back to simpler check
        if (content.includes('`' + potentialContent + '`')) {
          return potentialContent;
        }
        return null;
      }
    };
    
    // 1. Standard regex approach for paired backticks - ONLY extract content in backticks
    const backtickPattern = /`([^`]+)`/g;
    let backtickMatch;
    let matchCount = 0;
    
    // Log function that identifies a specific field type
    const identifyField = (fieldId: string, fieldName: string) => {
      console.log(`[Field Extraction Debug] Identified ${fieldName} content in backticks`);
      return { fieldId, fieldName };
    };
    
    while ((backtickMatch = backtickPattern.exec(content)) !== null) {
      matchCount++;
      const rawExtractedContent = backtickMatch[1].trim();
      
      // Verify this is legitimate backtick content and not also in quotes
      const extractedContent = safeExtractContent(rawExtractedContent);
      
      if (extractedContent && extractedContent.length > 0) {
        console.log(`[Field Extraction Debug] VERIFIED Backtick match #${matchCount}: "${extractedContent.substring(0, 50)}..."`);
        
        // Look for fields by pattern matching the context before each backtick
        const contentBeforeMatch = content.substring(0, backtickMatch.index).toLowerCase();
        
        // Check for each field type - prioritize the fields that need special handling
        let fieldInfo = null;
        
        // Special fields that need priority handling - check these first
        if (contentBeforeMatch.includes('market opportunity') || 
            (contentBeforeMatch.includes('market') && contentBeforeMatch.includes('opportunit'))) {
          fieldInfo = identifyField('marketOpportunity', 'Market Opportunity');
        }
        else if (contentBeforeMatch.includes('financial highlight') || 
                (contentBeforeMatch.includes('financial') && contentBeforeMatch.includes('highlight'))) {
          fieldInfo = identifyField('financialHighlights', 'Financial Highlights');
        }
        // Standard fields with normal handling
        else if (contentBeforeMatch.includes('business concept') || 
                (contentBeforeMatch.includes('business') && contentBeforeMatch.includes('concept'))) {
          fieldInfo = identifyField('businessConcept', 'Business Concept');
        }
        else if (contentBeforeMatch.includes('mission statement') || 
                (contentBeforeMatch.includes('mission') && contentBeforeMatch.includes('statement'))) {
          fieldInfo = identifyField('missionStatement', 'Mission Statement');
        }
        else if ((contentBeforeMatch.includes('product') && contentBeforeMatch.includes('service')) || 
                contentBeforeMatch.includes('products overview')) {
          fieldInfo = identifyField('productsOverview', 'Products/Services Overview');
        }
        
        if (fieldInfo) {
          // Add to suggestions with the identified field ID
          backtickSuggestions.push({
            fieldId: fieldInfo.fieldId,
            content: extractedContent
          });
        } else {
          // Add as generic content suggestion if no specific field identified
          console.log(`[Field Extraction Debug] Adding generic backtick content suggestion`);
          backtickSuggestions.push({
            fieldId: 'content',
            content: extractedContent
          });
        }
      } else {
        console.log(`[Field Extraction Debug] REJECTED content from backtick match #${matchCount} - Failed verification`);
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
          
          // Check for Market Opportunity context
          if (i >= 2 && parts[i-1].toLowerCase().includes('market opportunity')) {
            console.log('[Field Extraction Debug] Found Market Opportunity context in alternative extraction');
            backtickSuggestions.push({
              fieldId: 'marketOpportunity',
              content: extractedContent
            });
          } else {
            backtickSuggestions.push({
              fieldId: 'content',
              content: extractedContent
            });
          }
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
    
    // EXTREMELY PERMISSIVE VALIDATION - accept almost anything with minimal cleaning
    
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
      'market opportunity:': 'marketOpportunity',
      'financial highlights:': 'financialHighlights',
      // Products and Services prefixes
      'overview:': 'overview',
      'value proposition:': 'valueProposition',
      'intellectual property:': 'intellectualProperty',
      'future products:': 'futureProducts'
    };
    
    // Check for prefixes (case insensitive)
    const lowerContent = extractedContent.toLowerCase();
    for (const [prefix, fieldId] of Object.entries(prefixFieldMap)) {
      if (lowerContent.startsWith(prefix)) {
        console.log(`[Field Extraction Debug] Found prefix "${prefix}" in content`);
        initialFieldId = fieldId;
        break;
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
    
    // Use the callback to apply the suggestion directly
    if (onSuggestionApplied) {
      onSuggestionApplied(fieldId, content);
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
    setMessages,
    isLoading,
    sendMessage,
    clearConversation,
    fieldSuggestions,
    applySuggestion,
    setFieldSuggestions
  }
} 