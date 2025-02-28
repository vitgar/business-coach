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
  companyOverview?: {
    businessName?: string;
    foundingStory?: string;
    currentStage?: string;
    coreActivities?: string[];
    keyMilestones?: string[];
    businessModel?: string;
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

  // Base instructions to avoid showing JSON or code
  const baseInstructions = `IMPORTANT: Do not include JSON structures, code blocks, or technical formatting in your responses to the user.
  Keep your responses conversational, friendly, and easy to understand.
  If you need to reference structured data, describe it in plain language instead of showing the raw format.
  Never use markdown code blocks, backticks, or JSON syntax in your responses.
  Format your responses as natural language paragraphs and bullet points only.
  
  REMINDER: The user should NEVER see any JSON, code blocks, or technical formatting in your responses.
  This is critical - your response will be shown directly to the user without any processing.
  If you need to work with structured data, do it internally without showing the technical details.`

  // Run the assistant with appropriate instructions
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    instructions: needsExamples ? 
      `${baseInstructions}
      
      You are helping the user describe their company overview. Provide 2-3 specific examples in your response. Examples should:
      1. Be concrete and specific
      2. Be realistic and diverse
      3. Cover different types of businesses or industries
      4. Be clearly formatted and easy to understand
      5. After presenting examples, ask:
         - "Would you like to use one of these examples as a starting point?"
         - "Or would you prefer to continue describing your own company?"
         - "Or would you like different examples?"
      
      Focus on company overview information like business name, founding story, current stage, core activities, key milestones, and business model.
      
      Remember: Never include JSON, code blocks, or technical formatting in your responses.` : baseInstructions
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
 * Extracts structured company overview data from conversation
 * @param threadId The thread ID to use
 * @param conversation The conversation history
 * @returns Structured company overview data
 */
async function extractCompanyOverviewData(threadId: string, conversation: string): Promise<BusinessPlanContent['companyOverview']> {
  // Create a separate thread for data extraction to avoid polluting the main conversation
  const extractionThread = await openai.beta.threads.create();
  
  const structuringPrompt = `Based on this conversation about a company overview, 
  extract and structure the following information in JSON format:
  {
    "businessName": "The full name of the business",
    "foundingStory": "Brief history of how the business was founded",
    "currentStage": "Current stage of business development (startup, growth, established, etc.)",
    "coreActivities": ["Array of primary business activities or services"],
    "keyMilestones": ["Array of significant achievements or planned milestones"],
    "businessModel": "Summary of how the business generates revenue"
  }
  
  IMPORTANT: Return ONLY the JSON structure without any additional text, explanations, or code formatting.
  Do not include any markdown code blocks or JSON syntax highlighting.
  Do not add new information just retrieve the information from the input.
  If information for a field is not available in the conversation, exclude that field from the JSON.
  Do not hallucinate.
  Do not jump to conclusions.
  Conversation: ${conversation}`

  // Add the message to the extraction thread
  await openai.beta.threads.messages.create(extractionThread.id, {
    role: 'user',
    content: structuringPrompt
  });

  // Run the assistant on the extraction thread
  const run = await openai.beta.threads.runs.create(extractionThread.id, {
    assistant_id: BUSINESS_PLAN_ASSISTANT_ID,
    instructions: "Extract structured data in JSON format only. Do not add any explanatory text."
  });

  // Wait for completion
  while (true) {
    const runStatus = await openai.beta.threads.runs.retrieve(extractionThread.id, run.id);
    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(extractionThread.id);
      const content = messages.data[0].content[0];
      
      if ('text' in content) {
        try {
          // Extract JSON from the response text
          const jsonMatch = content.text.value.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (error) {
          console.error('Error parsing company overview data:', error);
        }
      }
      break;
    } else if (runStatus.status === 'failed') {
      throw new Error('Assistant run failed for data extraction');
    }
    await sleep(1000);
  }
  
  throw new Error('Failed to extract structured company overview data');
}

/**
 * POST - Main API endpoint handler for chat interactions
 * 
 * Purpose:
 * - Processes incoming chat messages for company overview information
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

    // Get structured company overview data
    const allMessages = messages.map(m => m.content).join("\n") + "\n" + conversationContent.text.value
    const companyOverviewData = await extractCompanyOverviewData(threadId, allMessages)

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
            companyOverview: companyOverviewData
          }
        }
      })
    }

    // Clean the response content to remove any JSON structures
    let cleanedContent = conversationContent.text.value;
    
    // More aggressive cleaning of JSON and code blocks
    // Remove markdown code blocks with language specification
    cleanedContent = cleanedContent.replace(/```(?:json|javascript|typescript|js|ts)[\s\S]*?```/g, '');
    
    // Remove any generic code blocks
    cleanedContent = cleanedContent.replace(/```[\s\S]*?```/g, '');
    
    // Remove inline code with backticks
    cleanedContent = cleanedContent.replace(/`[^`]*`/g, '');
    
    // Remove JSON-like structures (anything between curly braces that spans multiple lines or contains quotes and colons)
    cleanedContent = cleanedContent.replace(/\{[\s\S]*?\}/g, '');
    
    // Remove any leftover markdown code block indicators
    cleanedContent = cleanedContent.replace(/```/g, '');
    
    // Clean up any double line breaks that might have been created
    cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Remove any lines that look like JSON properties (e.g., "key": "value")
    cleanedContent = cleanedContent.replace(/^\s*"[^"]+"\s*:\s*"[^"]*"\s*,?\s*$/gm, '');
    cleanedContent = cleanedContent.replace(/^\s*"[^"]+"\s*:\s*\[[^\]]*\]\s*,?\s*$/gm, '');
    
    // Remove any lines with just brackets or braces
    cleanedContent = cleanedContent.replace(/^\s*[\[\]\{\}]\s*$/gm, '');
    
    // Remove any empty lines at start or end
    cleanedContent = cleanedContent.replace(/^\s+|\s+$/g, '');
    
    // If the cleaning made the content too short, revert to original
    if (cleanedContent.length < 10 && conversationContent.text.value.length > 10) {
      cleanedContent = conversationContent.text.value;
    }

    return NextResponse.json({
      threadId,
      model: ASSISTANT_CONFIG.MODEL,
      message: {
        role: 'assistant',
        content: cleanedContent
      },
      companyOverviewData,
      finish_reason: 'stop'
    })
  } catch (error) {
    console.error('Error in company overview API:', error)
    
    // Handle rate limit errors
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a few moments.' },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to process company overview chat', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 