import type { ChatMessage } from '@/types/chat'

/**
 * Extracts action items from a chat message.
 * 
 * Identifies lists and steps in the assistant's messages to
 * convert them into actionable items.
 * 
 * Enhanced with better pattern recognition to identify:
 * - Numbered and bulleted lists
 * - Section headers and sub-points
 * - Common action verbs and phrases
 * - Steps and process descriptions
 * - Headers with colons followed by content
 * 
 * @param message The chat message to extract action items from
 * @returns Array of extracted action item strings
 */
export function extractActionItems(message: ChatMessage): string[] {
  if (message.role !== 'assistant') {
    return []
  }

  const content = message.content
  const actionItems: string[] = []

  // Extract items from numbered lists (e.g., "1. Do this" or "1) Do this")
  // Enhanced to better handle numbers at start of lines
  const numberedListRegex = /(?:^|\n)\s*(\d+)[\.\)]\s+([^\n]+)/g
  let match: RegExpExecArray | null
  
  while ((match = numberedListRegex.exec(content)) !== null) {
    actionItems.push(match[2].trim())
  }

  // Extract items from bulleted lists (e.g., "• Do this" or "- Do this" or "* Do this")
  const bulletedListRegex = /(?:^|\n)\s*[\-\•\*]\s+([^\n]+)/g
  while ((match = bulletedListRegex.exec(content)) !== null) {
    actionItems.push(match[1].trim())
  }

  // Extract section headers with colons (frequently used in business documents)
  // This captures things like "Research and Planning:" and the content after it
  const sectionHeaderRegex = /(?:^|\n)([A-Z][^:]+):\s*([^\n]+)/g
  while ((match = sectionHeaderRegex.exec(content)) !== null) {
    // Include both the header and the content as one action item
    actionItems.push(`${match[1].trim()}: ${match[2].trim()}`)
  }

  // Extract "Action:" or "Task:" patterns (case insensitive)
  const actionTaskRegex = /\b(Action|Task|To-Do):\s+([^\n\.]+[\.]*)/gi
  while ((match = actionTaskRegex.exec(content)) !== null) {
    actionItems.push(match[2].trim())
  }

  // Extract "Step X:" patterns with their descriptions (more flexible pattern)
  const stepRegex = /\b(?:Step|Phase|Stage|Part)\s+\d+:?\s*([^\n]+)/gi
  while ((match = stepRegex.exec(content)) !== null) {
    actionItems.push(match[1].trim())
  }
  
  // Extract action items from nested lists with common prefixes
  const nestedActionRegex = /(?:Action|Task|Goal|Objective|Activity):\s+([^\n]+)/gi
  while ((match = nestedActionRegex.exec(content)) !== null) {
    actionItems.push(match[1].trim())
  }
  
  // Extract items starting with common business action verbs
  // Expanded from the previous version to include more business-relevant verbs
  const actionVerbMatch = /(?:^|\n)\s*(Create|Develop|Complete|Research|File|Obtain|Set up|Choose|Register|Apply for|Draft|Open|Plan|Consider|Implement|Select|Ensure|Conduct|Define|Establish|Identify|Review|Analyze|Prepare|Submit|Determine|Evaluate)([^:]+)/gi
  
  while ((match = actionVerbMatch.exec(content)) !== null) {
    // Make sure it's a complete thought/sentence
    const actionText = match[0].trim()
    if (actionText.length > 10) {
      actionItems.push(actionText)
    }
  }
  
  // Extract items after explicit action words followed by a colon
  const explicitActionRegex = /(?:^|\n).*?(Complete|Submit|Apply|Schedule|Register|Create|Open|Follow|Review|Prepare|Develop|Analyze)([^:]*?):\s*([^\n]+)/gi
  while ((match = explicitActionRegex.exec(content)) !== null) {
    // Combine the verb, subject, and action into a cohesive item
    actionItems.push(`${match[1]}${match[2]}: ${match[3].trim()}`)
  }
  
  // Look for structured content with clear steps
  // This is particularly useful for business guides and procedural content
  const processContentRegex = /(?:^|\n)(?:To|You should|You need to|You must|It's important to)\s+([^,\.\n]+\s+[^,\.\n]+[^\.]+)/gi
  while ((match = processContentRegex.exec(content)) !== null) {
    const processItem = match[1].trim()
    if (processItem.length > 15) { // Only include substantive items
      actionItems.push(processItem)
    }
  }

  // Remove duplicates, filter out empty strings, and ensure readable items
  return Array.from(new Set(actionItems))
    .filter(item => {
      // Filter criteria for quality action items
      return item.length > 0 && // Not empty
             item.length < 200 && // Not too long
             !/^[A-Za-z]$/.test(item) && // Not just a single letter
             item.split(' ').length > 1; // At least two words
    })
    .map(item => {
      // Clean up any trailing punctuation that shouldn't be there
      return item.replace(/[,;:]$/, '').trim()
    });
}

/**
 * Prepares action items for creation in the database
 * 
 * @param items Array of action item strings
 * @param messageId ID of the message these items were extracted from
 * @param conversationId ID of the conversation
 * @returns Array of action item objects ready for database insertion
 */
export function prepareActionItems(
  items: string[],
  messageId: string,
  conversationId: string
) {
  if (!items.length) return []

  return items.map((content, index) => ({
    content,
    messageId,
    conversationId,
    ordinal: index
  }))
}

/**
 * Organize action items into a hierarchical structure
 * 
 * This helps handle cases where items have clear parent-child relationships
 * 
 * @param items Array of action item content
 * @returns Array of organized items with parent-child relationships
 */
export function organizeActionItemsHierarchy(items: string[]) {
  // Implementation will depend on specific business rules
  // For example, we might treat indented items as children
  // For now, we'll just return the items as is
  return items.map(content => ({ content }))
}

/**
 * Analyzes a message to determine if it likely contains action items
 * 
 * @param message The chat message to analyze
 * @returns Boolean indicating whether the message likely contains action items
 */
export function messageContainsActionItems(message: ChatMessage): boolean {
  if (message.role !== 'assistant') {
    return false
  }
  
  const content = message.content
  
  // Check for numbered lists (enhanced pattern)
  if (/(?:^|\n)\s*\d+[\.\)]\s+[^\n]+/.test(content)) {
    return true
  }
  
  // Check for bulleted lists
  if (/(?:^|\n)\s*[\-\•\*]\s+[^\n]+/.test(content)) {
    return true
  }
  
  // Check for section headers with colons
  if (/(?:^|\n)([A-Z][^:]+):\s*([^\n]+)/.test(content)) {
    return true
  }
  
  // Check for "Action:" or "Task:" patterns (case insensitive)
  if (/\b(Action|Task|To-Do):\s+([^\n\.]+[\.]*)/i.test(content)) {
    return true
  }
  
  // Check for "Step X:" patterns (enhanced with more variations)
  if (/\b(?:Step|Phase|Stage|Part)\s+\d+:?/.test(content)) {
    return true
  }
  
  // Check for title patterns like "Here are some steps:" followed by items
  if (/here are (some|the) (steps|actions|tasks|things to do):/i.test(content)) {
    return true
  }
  
  // Check for business process language
  if (/follow these (steps|procedures|guidelines|general steps)/i.test(content) || 
      /step-(by-)?step (guide|process|procedure)/i.test(content) ||
      /steps to (guide you|follow|complete|implement)/i.test(content)) {
    return true
  }
  
  // Check for structured business content with common phrases
  if (/you (need|should|must|have to) (complete|do|implement|follow)/i.test(content)) {
    return true
  }
  
  // Check for multiple paragraphs that start with action verbs
  const actionVerbParagraphs = content.split('\n\n')
    .filter(para => 
      /^(Create|Develop|Complete|Research|File|Obtain|Set up|Choose|Register|Apply for|Draft|Open|Plan|Consider|Implement)/i.test(para.trim())
    );
    
  if (actionVerbParagraphs.length >= 2) {
    return true
  }
  
  return false
}

/**
 * Manually extract action items from plain text content
 * 
 * This is useful when you need to extract items without a full message object,
 * such as for preview functionality or from external content.
 * 
 * @param text Plain text content to analyze
 * @returns Array of extracted action item strings
 */
export function extractActionItemsFromText(text: string): string[] {
  // Create a dummy message object to use with our existing extractor
  const dummyMessage: ChatMessage = {
    role: 'assistant',
    content: text
  }
  
  return extractActionItems(dummyMessage)
} 