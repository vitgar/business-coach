import { NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import type { ChatMessage } from '@/types/chat'
import { ASSISTANT_CONFIG } from '@/config/constants'
import { extractActionItems, messageContainsActionItems, prepareActionItems } from '@/lib/action-items-extractor'
import { prisma } from '@/lib/prisma'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'

// Define the return type for saveActionItems
interface ActionItemSaveResult {
  count: number;
  success: boolean;
  error?: string;
  simulatedOnly?: boolean;
  disabled?: boolean;
}

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
})

// Create a singleton assistant instance
let assistant: any = null

async function getOrCreateAssistant() {
  if (!assistant) {
    try {
      // Create the assistant with instructions in the first message
      assistant = pc.assistant("business-coach")
      await assistant.chat({
        messages: [{
          role: 'user',
          content: ASSISTANT_CONFIG.INSTRUCTIONS
        }]
      })
    } catch (error) {
      console.error('Error getting assistant:', error)
      throw error
    }
  }
  return assistant
}

async function generateTitle(message: string) {
  try {
    const titleAssistant = await pc.assistant("title-generator")
    const response = await titleAssistant.chat({
      messages: [{
        role: 'user',
        content: `Generate a concise, descriptive title (max 40 chars) that captures the main topic from this message: "${message}". Make it clear and specific, avoiding generic phrases.`
      }]
    })

    // Ensure we have a valid response
    if (response?.message?.content) {
      return response.message.content.trim()
    }
    
    // Fallback: Create a title from the first few words of the message
    const words = message.split(' ').slice(0, 5).join(' ').trim()
    return words.length > 40 ? `${words.slice(0, 37)}...` : words
  } catch (error) {
    console.error('Error generating title:', error)
    // Create a title from the first few words of the message as fallback
    const words = message.split(' ').slice(0, 5).join(' ').trim()
    return words.length > 40 ? `${words.slice(0, 37)}...` : words
  }
}

/**
 * Saves extracted action items to the database
 * @param items Array of action item strings
 * @param messageId ID of the message source
 * @param conversationId ID of the conversation
 * @returns Object with success status and count
 */
async function saveActionItems(items: string[], messageId: string, conversationId: string): Promise<ActionItemSaveResult> {
  if (!items.length) return { count: 0, success: true }
  
  try {
    // Get or create temporary user for demo purposes
    // In a production app, this would use the authenticated user
    let tempUser = await prisma.user.findFirst({
      where: {
        email: 'temp@example.com'
      }
    })

    if (!tempUser) {
      tempUser = await prisma.user.create({
        data: {
          email: 'temp@example.com',
          name: 'Temporary User',
          password: 'temp-password',
        }
      })
    }
    
    let successCount = 0;
    
    // Process each action item individually
    for (const content of items) {
      try {
        // @ts-ignore - TypeScript might not recognize actionItem yet
        const actionItem = await prisma.actionItem.create({
          data: {
            content,
            userId: tempUser.id,
            conversationId,
            messageId,
            ordinal: successCount,
            isCompleted: false
          }
        });
        
        successCount++;
      } catch (itemError) {
        console.error('Error saving individual action item:', itemError);
      }
    }
    
    return { 
      count: successCount, 
      success: successCount > 0 
    }
  } catch (error) {
    console.error('Error saving action items:', error)
    return { count: 0, success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function POST(request: Request) {
  try {
    const { messages, isFirstMessage, conversationId } = await request.json() as { 
      messages: ChatMessage[]
      isFirstMessage?: boolean 
      conversationId?: string
    }
    
    console.log('Chat API processing request:', { 
      messageCount: messages.length,
      isFirstMessage, 
      hasConversationId: !!conversationId
    });
    
    // Filter out system messages and only send user/assistant messages to the API
    const chatMessages = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))

    const businessCoach = await getOrCreateAssistant()
    const response = await businessCoach.chat({
      messages: chatMessages
    })

    // If this is the first message, generate a title
    let title: string | undefined
    if (isFirstMessage) {
      title = await generateTitle(messages[messages.length - 1].content)
    }

    // Prepare the assistant's response
    const assistantMessage: ChatMessage = {
      content: response.message.content,
      role: 'assistant'
    }

    // Generate a unique ID for this message
    const messageId = response.id || Date.now().toString()

    // DISABLED: Automatic action item extraction
    // Feature has been disabled as per request
    // To re-enable: remove the conditional block below and uncomment the original code
    
    // Set empty values for action items data to maintain API response format compatibility
    const hasActionItems = false;
    const actionItems: string[] = [];
    const savedActionItems: ActionItemSaveResult = { count: 0, success: false, disabled: true };
    
    /* ORIGINAL CODE - DISABLED
    // Check if the response contains potential action items
    const hasActionItems = messageContainsActionItems(assistantMessage)
    
    console.log('Action items detection result:', { hasActionItems });
    
    // Extract potential action items from the response
    let actionItems: string[] = []
    if (hasActionItems) {
      actionItems = extractActionItems(assistantMessage)
      console.log('Extracted action items:', actionItems);
    } else {
      // Even if our pattern detection failed, try extraction anyway
      // This helps catch edge cases our patterns might miss
      const forcedExtraction = extractActionItems(assistantMessage)
      if (forcedExtraction.length > 0) {
        console.log('Force-extracted action items despite pattern miss:', forcedExtraction);
        actionItems = forcedExtraction
      }
    }
    
    // Save action items if any were found
    let savedActionItems: ActionItemSaveResult = { count: 0, success: false }
    if (actionItems.length > 0) {
      // If we have a conversation ID, use it to save the items
      if (conversationId) {
        savedActionItems = await saveActionItems(actionItems, messageId, conversationId)
        console.log('Saved action items result:', savedActionItems);
      } else if (isFirstMessage) {
        // For first messages without a conversation ID yet,
        // we'll still extract the action items but mark them as simulatedOnly
        // They'll be properly saved when the conversation is created
        savedActionItems = { 
          count: actionItems.length, 
          success: true, 
          simulatedOnly: true 
        }
        console.log('Simulated action items for first message without conversationId');
      }
    }
    */

    return NextResponse.json({
      id: messageId,
      model: response.model || 'gpt-4',
      message: {
        content: response.message.content,
        role: 'assistant'
      },
      finish_reason: response.finish_reason || 'stop',
      title,
      // Include action item data in the response
      actionItemsData: {
        hasActionItems,
        items: actionItems,
        count: actionItems.length,
        saved: savedActionItems.success,
        savedCount: savedActionItems.count,
        simulatedOnly: savedActionItems.simulatedOnly,
        disabled: savedActionItems.disabled
      },
      conversationId
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 