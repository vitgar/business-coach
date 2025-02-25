import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import type { ChatMessage } from '@/types/chat'
import { ASSISTANT_CONFIG } from '@/config/constants'
import { sleep } from '@/lib/utils'
import { Prisma, BusinessPlan } from '@prisma/client'

// Type for business plan content
interface BusinessPlanContent {
  threadId?: string;
  vision?: {
    longTermVision?: string;
    yearOneGoals?: string[];
    yearThreeGoals?: string[];
    yearFiveGoals?: string[];
    alignmentExplanation?: string;
  };
  [key: string]: any;
}

/**
 * Initialize OpenAI client with API key from environment variables
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // Minimum 1 second between requests

// Assistant IDs for different purposes
const GENERAL_ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID!
const BUSINESS_PLAN_ASSISTANT_ID = process.env.OPENAI_BUSINESS_PLAN_ASSISTANT_ID!

/**
 * Creates or retrieves a thread for the conversation
 * @param businessPlanId The ID of the business plan
 * @returns The thread ID
 */
async function getOrCreateThread(businessPlanId: string): Promise<string> {
  // Get the business plan
  const businessPlan = await prisma.businessPlan.findUnique({
    where: { id: businessPlanId }
  })

  if (!businessPlan) {
    throw new Error('Business plan not found')
  }

  const content = (businessPlan.content || {}) as BusinessPlanContent
  
  // If thread exists in content, return it
  if (content.threadId) {
    return content.threadId
  }

  // Create new thread
  const thread = await openai.beta.threads.create()

  // Update business plan with thread ID
  await prisma.businessPlan.update({
    where: { id: businessPlanId },
    data: {
      content: {
        ...content,
        threadId: thread.id
      }
    }
  })

  return thread.id
}

/**
 * Processes a conversation with an assistant and waits for completion
 * @param threadId The thread ID to use
 * @param assistantId The assistant ID to use
 * @param message The message to send
 * @returns The assistant's response
 */
async function processWithAssistant(threadId: string, assistantId: string, message: string) {
  // Add message to thread
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: message
  })

  // Add example generation instructions if the message indicates help is needed
  const needsExamples = message.toLowerCase().includes('example') || 
                       message.toLowerCase().includes('help') || 
                       message.toLowerCase().includes('not sure') ||
                       message.toLowerCase().includes('guidance')

  // Run the assistant with appropriate instructions
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    instructions: needsExamples ? 
      `Provide 2-3 specific, measurable examples in your response. Examples should:
      1. Include concrete numbers and metrics
      2. Be realistic and achievable
      3. Cover different aspects or approaches
      4. Be clearly formatted and numbered
      5. After presenting examples, ask:
         - "Would you like to use one of these examples as your [vision/goal]?"
         - "Or would you prefer to modify your current one with some ideas from these examples?"
         - "Or would you like different examples?"
      
      Keep focused on vision and goals, avoid implementation details.` : undefined
  })

  // Wait for completion
  while (true) {
    const runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId)
      return messages.data[0]
    } else if (runStatus.status === 'failed') {
      throw new Error('Assistant run failed')
    }
    await sleep(1000)
  }
}

/**
 * Extracts structured vision data from conversation
 * @param conversation The conversation history
 * @returns Structured vision data
 */
async function extractVisionData(threadId: string, conversation: string): Promise<BusinessPlanContent['vision']> {
  const structuringPrompt = `Based on this conversation about business vision and goals, 
  extract and structure the following information in JSON format:
  {
    "longTermVision": "The overall long-term vision statement",
    "yearOneGoals": ["Array of specific, measurable first-year goals"],
    "yearThreeGoals": ["Array of specific three-year goals"],
    "yearFiveGoals": ["Array of specific five-year goals"],
    "alignmentExplanation": "Explanation of how these goals align with the vision"
  }
  Do not add new information just retrieve the information from the input.
  Do not hallucinate.
  Do not jump to conclusions.
  Conversation: ${conversation}`

  const response = await processWithAssistant(threadId, BUSINESS_PLAN_ASSISTANT_ID, structuringPrompt)
  const content = response.content[0]
  
  if ('text' in content) {
    try {
      // Extract JSON from the response text
      const jsonMatch = content.text.value.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Error parsing vision data:', error)
    }
  }
  
  throw new Error('Failed to extract structured vision data')
}

/**
 * POST - Main API endpoint handler for chat interactions
 * 
 * Purpose:
 * - Processes incoming chat messages for business plan vision
 * - Manages conversation flow with the OpenAI assistant
 * - Handles conversation state through OpenAI threads
 * 
 * Request body:
 * - messages: Array of ChatMessage objects containing conversation history
 * - isFirstMessage: Boolean flag indicating if this is the start of a new conversation
 * 
 * Flow:
 * 1. Gets or creates OpenAI thread for the conversation
 * 2. Optimizes message payload
 * 3. Sends message to OpenAI
 * 4. Waits for and returns response
 * 
 * @param {Request} request - Incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with chat result or error
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { messages } = await request.json() as { 
      messages: ChatMessage[]
      isFirstMessage?: boolean 
    }
    
    // Get or create thread
    const threadId = await getOrCreateThread(params.id)
    
    // First, process with general assistant for conversation
    const latestMessage = messages[messages.length - 1]
    const conversationResponse = await processWithAssistant(threadId, GENERAL_ASSISTANT_ID, latestMessage.content)
    
    // Extract the conversation content
    const conversationContent = conversationResponse.content[0]
    if (!('text' in conversationContent)) {
      throw new Error('Unexpected response format')
    }

    // Get structured vision data
    const allMessages = messages.map(m => m.content).join("\n") + "\n" + conversationContent.text.value
    const visionData = await extractVisionData(threadId, allMessages)

    // Update business plan with structured data
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id }
    })

    if (businessPlan) {
      const content = (businessPlan.content || {}) as BusinessPlanContent
      await prisma.businessPlan.update({
        where: { id: params.id },
        data: {
          content: {
            ...content,
            vision: visionData
          }
        }
      })
    }

    return NextResponse.json({
      id: conversationResponse.id,
      model: 'gpt-4',
      message: {
        content: conversationContent.text.value,
        role: 'assistant'
      },
      visionData,
      finish_reason: 'stop'
    })

  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json(
        { 
          error: 'Service is currently busy. Please try again in a few moments.',
          retryAfter: 5
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '5'
          }
        }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 