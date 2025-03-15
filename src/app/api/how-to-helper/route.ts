import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ActionItem } from '@/types/actionItem'
import OpenAI from 'openai'

/**
 * API response structure for the How To Helper
 */
interface HowToHelperResponse {
  messageContent: string;        // The message text to display
  containsActionItem: boolean;   // Whether this message contains an action item
  actionItem?: {                 // The action item details (if applicable)
    content: string;             // Title/content of the action item
    description?: string;        // Description of the action item
    priorityLevel?: string;      // Priority level (high, medium, low)
    progress?: string;           // Progress status (not started, in progress, complete)
    isChildItem: boolean;        // Whether this is a child of the current action item
    parentId?: string;           // ID of the parent action item (if it's a child)
    stepNumber?: number;         // Step number for sequential tasks
  };
  expectsResponse: boolean;      // Whether the message is a question expecting a response
  conversationContext?: {        // Context information for the conversation
    currentTopicId?: string;     // ID of the current topic being discussed
    currentActionItemId?: string; // ID of the current action item being discussed
    workingOnChildItems: boolean; // Whether we're working on child action items
    completedSteps: number;      // Number of completed steps in the current sequence
    totalSteps?: number;         // Total number of steps in the current sequence (if known)
  };
}

// Initialize OpenAI client
// In production, you would use environment variables for the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', // Use environment variable
});

/**
 * POST /api/how-to-helper
 * 
 * Processes a message from the user and returns a response with possible action items
 * Uses OpenAI API to generate responses based on the conversation context
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { 
      message,              // The user's message
      businessId,           // Optional business ID
      conversationContext,  // Current conversation context
      userId,               // User ID for retrieving user-specific data
      messageHistory = []   // Previous messages in the conversation
    } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    console.log('Processing message:', message);
    console.log('Context:', conversationContext);
    
    // Get user information if userId is provided
    let userInfo = null;
    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true
          }
        });
        userInfo = user;
      } catch (error) {
        // Continue even if user lookup fails
        console.error('Error fetching user info:', error);
      }
    }
    
    // Get business information if businessId is provided
    let businessInfo = null;
    if (businessId) {
      try {
        const business = await prisma.businessPlan.findUnique({
          where: { id: businessId },
          select: {
            id: true,
            title: true
          }
        });
        businessInfo = business;
      } catch (error) {
        // Continue even if business lookup fails
        console.error('Error fetching business info:', error);
      }
    }
    
    // Call the LLM for a response based on the conversation context
    const aiResponse = await callLLM(message, conversationContext, userInfo, businessInfo, messageHistory);
    
    // Return the formatted response
    return NextResponse.json(aiResponse);
    
  } catch (error) {
    console.error('Error in how-to-helper API:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Call an LLM (Language Learning Model) to generate a response
 * 
 * @param message The user message to respond to
 * @param context The current conversation context
 * @param userInfo Optional user information
 * @param businessInfo Optional business information
 * @param messageHistory Previous messages in the conversation
 * @returns A structured response with message content and action items
 */
async function callLLM(
  message: string,
  context: any = {},
  userInfo: any = null,
  businessInfo: any = null,
  messageHistory: any[] = []
): Promise<HowToHelperResponse> {
  try {
    // Build system prompt that explains the assistant's role and capabilities
    const systemPrompt = `You are a business coach and assistant that helps entrepreneurs with specific "how to" questions about running their business.
Your goal is to provide step-by-step guidance on business topics and break complex processes into manageable action items.

You should:
1. Identify the specific business topic or activity the user is asking about
2. Create a main action item for the overall task
3. Break down the process into sequential steps (child action items)
4. Ask follow-up questions to guide the user through each step
5. Maintain context of where the user is in the process

IMPORTANT CONVERSATION FLOW INSTRUCTIONS:
- When the user asks a "how to" question, introduce the topic and ask a specific question about their situation
- When the user says "go on", "continue", or similar phrases, DO NOT give generic responses
- Instead, ask a specific question about the NEXT STEP in the process
- For example, if discussing business registration and they say "go on", ask about business structure: "What type of business structure are you considering (sole proprietorship, LLC, corporation)?"
- Each response should end with a clear, specific question that moves the process forward
- NEVER respond with general acknowledgments like "Great! Let's continue..." without asking a specific question
- If you're unsure what to ask next, ask the user how they want to proceed with a specific option: "Would you like to proceed with [specific next step] or would you prefer to discuss another aspect of business registration?"

ACTION ITEM QUALITY GUIDELINES:
- Each action item should be specific, concrete, and actionable
- Don't create duplicate or very similar action items
- For parent items: use broad task titles (e.g., "Register business", "Create marketing plan")
- For child items: use specific task titles (e.g., "File LLC paperwork with state", "Design company logo")
- Don't repeat information in the content and description fields
- Keep content focused on the task, not explanatory text
- Include only ONE clear action per item

For EACH response, you MUST return a JSON object with the following structure:
{
  "messageContent": "Your actual message to display to the user, ALWAYS ending with a specific question",
  "containsActionItem": boolean,
  "actionItem": {
    "content": "Title of the action item",
    "description": "Detailed description",
    "priorityLevel": "high|medium|low",
    "progress": "not started|in progress|complete",
    "isChildItem": boolean,
    "parentId": "ID of parent item if this is a child",
    "stepNumber": number
  },
  "expectsResponse": true,
  "conversationContext": {
    "currentTopicId": "kebab-case-topic-id",
    "currentActionItemId": "ID of the current action item being worked on",
    "workingOnChildItems": boolean,
    "completedSteps": number,
    "totalSteps": number
  }
}

If the user is asking about a new topic, create a new main action item (isChildItem: false).
If continuing a conversation about a topic, create child items as needed (isChildItem: true).
Every action item you create should be practical, specific, and actionable.`;

    // Prepare messages array for the API call
    const messages: {role: 'system' | 'user' | 'assistant', content: string}[] = [
      {
        role: "system",
        content: systemPrompt
      }
    ];
    
    // Add context about the current topic if available
    if (context?.currentTopicId) {
      messages.push({
        role: "system",
        content: `The current conversation is about "${context.currentTopicId.replace(/-/g, ' ')}". ${
          context.workingOnChildItems ? 'You are currently creating child action items for the main task.' : ''
        } The user has completed ${context.completedSteps || 0} ${
          context.totalSteps ? `out of ${context.totalSteps}` : ''
        } steps.`
      });
      
      if (context.currentActionItemId) {
        messages.push({
          role: "system",
          content: `The current parent action item ID is "${context.currentActionItemId}".`
        });
      }
    }
    
    // Add business context if available
    if (businessInfo) {
      messages.push({
        role: "system",
        content: `The user's business is: ${businessInfo.title || 'Unnamed business'} (ID: ${businessInfo.id})`
      });
    }
    
    // Add previous conversation messages if available
    if (messageHistory && messageHistory.length > 0) {
      // Only include up to the last 10 messages to keep context concise
      const recentMessages = messageHistory.slice(-10);
      recentMessages.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          });
        }
      });
    }
    
    // Add the current user message
    messages.push({
      role: "user",
      content: message
    });
    
    // Call the OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Use the appropriate model - can be changed to match your subscription
      messages: messages,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Extract the response content
    const responseContent = completion.choices[0].message.content;
    console.log('LLM response:', responseContent);
    
    if (!responseContent) {
      throw new Error('Empty response from LLM');
    }
    
    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(responseContent) as HowToHelperResponse;
      
      // If the response contains an action item, validate it
      if (parsedResponse.containsActionItem && parsedResponse.actionItem) {
        // Check if the action item is a duplicate or low quality
        const isWorthAdding = await validateActionItem(
          parsedResponse.actionItem, 
          context, 
          messageHistory
        );
        
        // If the action item isn't worth adding, remove it
        if (!isWorthAdding) {
          console.log('Filtering out low-quality action item:', parsedResponse.actionItem.content);
          parsedResponse.containsActionItem = false;
          parsedResponse.actionItem = undefined;
        }
      }
      
      // Validate the response structure and provide defaults for missing fields
      return {
        messageContent: parsedResponse.messageContent || "I'm not sure how to respond to that. Could you rephrase your question?",
        containsActionItem: parsedResponse.containsActionItem || false,
        actionItem: parsedResponse.containsActionItem ? {
          content: parsedResponse.actionItem?.content || "Unnamed action item",
          description: parsedResponse.actionItem?.description,
          priorityLevel: parsedResponse.actionItem?.priorityLevel || "medium",
          progress: parsedResponse.actionItem?.progress || "not started",
          isChildItem: parsedResponse.actionItem?.isChildItem || false,
          parentId: parsedResponse.actionItem?.parentId,
          stepNumber: parsedResponse.actionItem?.stepNumber
        } : undefined,
        expectsResponse: parsedResponse.expectsResponse !== false, // Default to true
        conversationContext: {
          currentTopicId: parsedResponse.conversationContext?.currentTopicId || context?.currentTopicId,
          currentActionItemId: parsedResponse.conversationContext?.currentActionItemId || context?.currentActionItemId,
          workingOnChildItems: parsedResponse.conversationContext?.workingOnChildItems || false,
          completedSteps: parsedResponse.conversationContext?.completedSteps || context?.completedSteps || 0,
          totalSteps: parsedResponse.conversationContext?.totalSteps || context?.totalSteps
        }
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Raw response:', responseContent);
      
      // Return a fallback response
      return {
        messageContent: "I had trouble processing your request. Could you rephrase your question?",
        containsActionItem: false,
        expectsResponse: true,
        conversationContext: context || { workingOnChildItems: false, completedSteps: 0 }
      };
    }
  } catch (error) {
    console.error('Error calling LLM:', error);
    
    // Return a fallback response
    return {
      messageContent: "I'm having trouble connecting to my knowledge source. Please try again in a moment.",
      containsActionItem: false,
      expectsResponse: true,
      conversationContext: context || { workingOnChildItems: false, completedSteps: 0 }
    };
  }
}

/**
 * Validates an action item to ensure it's not a duplicate and is worth adding
 * 
 * @param actionItem The action item to validate
 * @param context The current conversation context
 * @param messageHistory Previous messages that might contain action items
 * @returns Boolean indicating whether the action item should be added
 */
async function validateActionItem(
  actionItem: any,
  context: any,
  messageHistory: any[]
): Promise<boolean> {
  try {
    // If there's no content, it's not worth adding
    if (!actionItem.content || actionItem.content.trim() === '') {
      return false;
    }
    
    // Check if we've recently added a similar action item by looking at message history
    const recentActionItems = messageHistory
      .filter(msg => msg.role === 'assistant' && msg.content.includes('Create Action Item'))
      .map(msg => msg.content);
    
    // Simple duplicate detection - check if the content is very similar to recent action items
    for (const item of recentActionItems) {
      const similarity = calculateSimilarity(actionItem.content, item);
      if (similarity > 0.7) { // If more than 70% similar, consider it a duplicate
        console.log('Duplicate action item detected:', actionItem.content);
        return false;
      }
    }
    
    // Check for action items that are too vague or not actionable
    if (actionItem.content.length < 10 || 
        isGenericActionItem(actionItem.content) ||
        containsRepeatedInfo(actionItem)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating action item:', error);
    return true; // Default to allowing it in case of error
  }
}

/**
 * Calculate similarity between two strings (simple implementation)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Very simple similarity check - would be enhanced in production
  const words1 = new Set(s1.split(/\W+/).filter(w => w.length > 3));
  const words2 = new Set(s2.split(/\W+/).filter(w => w.length > 3));
  
  let matchCount = 0;
  words1.forEach(word => {
    if (words2.has(word)) matchCount++;
  });
  
  return matchCount / Math.max(words1.size, 1);
}

/**
 * Check if an action item is too generic or not actionable
 */
function isGenericActionItem(content: string): boolean {
  const genericPhrases = [
    'next step',
    'continue',
    'proceed',
    'moving forward',
    'get started',
    'learn more',
    'understand',
    'consider options',
    'research',
    'look into',
    'think about'
  ];
  
  const contentLower = content.toLowerCase();
  return genericPhrases.some(phrase => contentLower.includes(phrase));
}

/**
 * Check if an action item contains repeated information in content and description
 */
function containsRepeatedInfo(actionItem: any): boolean {
  if (!actionItem.description) return false;
  
  const content = actionItem.content.toLowerCase();
  const description = actionItem.description.toLowerCase();
  
  // Check if description is just a rephrasing of the content
  return calculateSimilarity(content, description) > 0.6;
} 