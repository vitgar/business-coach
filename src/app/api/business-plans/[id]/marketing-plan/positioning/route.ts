import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { sleep } from '@/lib/utils'

/**
 * Interface for business plan content
 */
interface BusinessPlanContent {
  threadId?: string;
  marketingPlan?: {
    threadId?: string;
    positioning?: string;
    pricing?: string;
    promotional?: string;
    sales?: string;
  };
  [key: string]: any; // Allow additional properties
}

/**
 * Initialize OpenAI client with API key from environment variables
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

// Assistant ID for marketing plan
const MARKETING_ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID!

// Minimum time between requests to prevent rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // Minimum 1 second between requests

/**
 * Get or create a thread for the conversation about market positioning
 * @param businessPlanId - ID of the business plan
 * @returns Thread ID
 */
async function getOrCreateThread(businessPlanId: string): Promise<string> {
  // Get the business plan
  const businessPlan = await prisma.businessPlan.findUnique({
    where: { id: businessPlanId },
    select: { content: true }
  })

  if (!businessPlan) {
    throw new Error('Business plan not found')
  }

  // Parse the content
  const content = businessPlan.content as BusinessPlanContent || {}
  
  // Check if we already have a thread ID for marketing plan
  if (content.marketingPlan?.threadId) {
    return content.marketingPlan.threadId
  }

  // Create a new thread
  const thread = await openai.beta.threads.create()
  
  // Initialize marketing plan structure if it doesn't exist
  if (!content.marketingPlan) {
    content.marketingPlan = {}
  }
  
  // Save the thread ID
  content.marketingPlan.threadId = thread.id
  
  // Update the business plan with the new thread ID
  await prisma.businessPlan.update({
    where: { id: businessPlanId },
    data: { content }
  })

  return thread.id
}

/**
 * Wait for any active runs on the thread to complete
 * @param threadId - Thread ID to check
 */
async function waitForActiveRuns(threadId: string): Promise<void> {
  // List runs to check for any that are active
  const runs = await openai.beta.threads.runs.list(threadId)
  
  // Filter for in-progress runs
  const activeRuns = runs.data.filter(run => 
    ['in_progress', 'queued', 'cancelling'].includes(run.status)
  )
  
  // If there are active runs, wait for them to complete
  for (const run of activeRuns) {
    let runStatus = await openai.beta.threads.runs.retrieve(
      threadId,
      run.id
    )
    
    while (['in_progress', 'queued', 'cancelling'].includes(runStatus.status)) {
      await sleep(1000) // Wait 1 second before checking again
      runStatus = await openai.beta.threads.runs.retrieve(
        threadId,
        run.id
      )
    }
  }
}

/**
 * Process a message with the assistant
 * @param threadId - Thread ID for the conversation
 * @param message - User message to process
 * @returns Assistant's response
 */
async function processWithAssistant(threadId: string, message: string): Promise<string> {
  // Wait for any rate limits
  const now = Date.now()
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    await sleep(MIN_REQUEST_INTERVAL - (now - lastRequestTime))
  }
  lastRequestTime = Date.now()
  
  // Wait for any active runs to complete
  await waitForActiveRuns(threadId)
  
  // Add the user message to the thread
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: message
  })
  
  // Run the assistant on the thread
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: MARKETING_ASSISTANT_ID,
    instructions: `You are an expert in business marketing strategies, helping entrepreneurs define their market positioning.
    
    Please help the user develop a clear market positioning strategy based on their business. 
    Extract key information about their target audience, customer segments, positioning statement, 
    unique value proposition, competitive analysis, and market differentiators.
    
    Provide helpful, specific advice tailored to their business context. Ask clarifying questions
    when needed to develop a comprehensive positioning strategy.
    
    Keep your responses conversational and easy to understand.`
  })
  
  // Wait for the run to complete
  let runStatus = await openai.beta.threads.runs.retrieve(
    threadId,
    run.id
  )
  
  while (runStatus.status !== 'completed') {
    // Handle errors or cancellations
    if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
      throw new Error(`Run ${runStatus.status}: ${runStatus.last_error?.message || 'Unknown error'}`)
    }
    
    // Wait before checking again
    await sleep(1000)
    runStatus = await openai.beta.threads.runs.retrieve(
      threadId,
      run.id
    )
  }
  
  // Get the assistant's messages, sorted with newest first
  const messages = await openai.beta.threads.messages.list(threadId)
  
  // Find the newest assistant message
  const assistantMessages = messages.data.filter(msg => msg.role === 'assistant')
  if (assistantMessages.length === 0) {
    throw new Error('No response from assistant')
  }
  
  // Get the content from the newest message
  const latestMessage = assistantMessages[0]
  const messageContent = latestMessage.content[0]
  
  if (messageContent.type !== 'text') {
    throw new Error('Unexpected message format')
  }
  
  return messageContent.text.value
}

/**
 * Extract structured market positioning data from the conversation
 * @param threadId - Thread ID for the conversation
 * @returns Structured market positioning data
 */
async function extractPositioningData(threadId: string): Promise<BusinessPlanContent['marketingPlan']['positioning']> {
  // Get all messages from the thread
  const messages = await openai.beta.threads.messages.list(threadId, {
    order: 'asc'
  })
  
  // Combine messages into a conversation string
  const conversation = messages.data.map(msg => {
    const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1)
    const content = msg.content[0].type === 'text' 
      ? msg.content[0].text.value 
      : '[Non-text content]'
    
    return `${role}: ${content}`
  }).join('\n\n')
  
  // Create a new thread for the extraction to avoid polluting the main conversation
  const extractionThread = await openai.beta.threads.create()
  
  // Add the conversation as context
  await openai.beta.threads.messages.create(extractionThread.id, {
    role: 'user',
    content: `Based on this conversation about market positioning, extract the key details into a structured format:
    
    ${conversation}
    
    Extract the following information:
    1. Target audience
    2. Customer segments (as a list)
    3. Positioning statement
    4. Unique value proposition
    5. Competitive analysis
    6. Market differentiators (as a list)
    
    Format your response as valid JSON with these fields: targetAudience, customerSegments, positioningStatement, uniqueValueProposition, competitiveAnalysis, marketDifferentiators.`
  })
  
  // Run the assistant to extract data
  const run = await openai.beta.threads.runs.create(extractionThread.id, {
    assistant_id: MARKETING_ASSISTANT_ID,
    instructions: `You are a helpful assistant that extracts structured data from conversations.
    
    Your task is to extract market positioning information from the conversation and format it as clean JSON.
    
    Only include fields that have meaningful content. Do not invent or assume information not present in the conversation.
    Use proper JSON syntax with correctly escaped quotation marks and no trailing commas.
    
    Important: Your entire response should be only the JSON object, nothing else.`
  })
  
  // Wait for the extraction to complete
  let runStatus = await openai.beta.threads.runs.retrieve(
    extractionThread.id,
    run.id
  )
  
  while (runStatus.status !== 'completed') {
    if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
      throw new Error(`Data extraction failed: ${runStatus.last_error?.message || 'Unknown error'}`)
    }
    
    await sleep(1000)
    runStatus = await openai.beta.threads.runs.retrieve(
      extractionThread.id,
      run.id
    )
  }
  
  // Get the extraction response
  const extractionMessages = await openai.beta.threads.messages.list(extractionThread.id)
  const assistantMessages = extractionMessages.data.filter(msg => msg.role === 'assistant')
  
  if (assistantMessages.length === 0) {
    throw new Error('No extraction result')
  }
  
  // Get the JSON content
  const latestMessage = assistantMessages[0]
  const messageContent = latestMessage.content[0]
  
  if (messageContent.type !== 'text') {
    throw new Error('Unexpected extraction result format')
  }
  
  // Parse the JSON response
  try {
    // Clean the response to ensure it's valid JSON
    const cleanedResponse = cleanResponse(messageContent.text.value)
    return JSON.parse(cleanedResponse)
  } catch (error) {
    console.error('Failed to parse extracted data:', error)
    console.error('Raw response:', messageContent.text.value)
    return {} // Return empty object if parsing fails
  }
}

/**
 * Clean the response to ensure it's valid JSON
 * @param response - Raw response from the assistant
 * @returns Cleaned JSON string
 */
function cleanResponse(response: string): string {
  // Remove any markdown code block markers
  let cleaned = response.replace(/```json/g, '').replace(/```/g, '')
  
  // Trim whitespace
  cleaned = cleaned.trim()
  
  // If response starts with a non-JSON character, try to find where JSON begins
  if (!cleaned.startsWith('{')) {
    const jsonStart = cleaned.indexOf('{')
    if (jsonStart !== -1) {
      cleaned = cleaned.substring(jsonStart)
    }
  }
  
  // If response includes text after the JSON, truncate it
  const jsonEnd = cleaned.lastIndexOf('}')
  if (jsonEnd !== -1 && jsonEnd < cleaned.length - 1) {
    cleaned = cleaned.substring(0, jsonEnd + 1)
  }
  
  return cleaned
}

/**
 * POST handler for processing messages about market positioning
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Update to handle both single message and messages array formats
    const requestData = await request.json();
    let messageContent = '';
    let isHelp = requestData.isHelp || false;
    
    // Handle different request formats
    if (requestData.message) {
      // Original format with single message
      messageContent = requestData.message;
    } else if (requestData.messages && Array.isArray(requestData.messages)) {
      // New format from GenericQuestionnaire with messages array
      // Extract the most recent user message
      const userMessages = requestData.messages.filter((m: { role: string; content: string }) => m.role === 'user');
      if (userMessages.length > 0) {
        messageContent = userMessages[userMessages.length - 1].content;
      }
      
      // Check if this is a help request
      const isHelpMessage = requestData.messages.some((m: { role: string; content: string }) => 
        m.role === 'system' && m.content && m.content.includes('needs help')
      );
      isHelp = isHelp || isHelpMessage || requestData.isFirstMessage === false;
    } else {
      return NextResponse.json(
        { error: 'Invalid request: missing message or messages array' },
        { status: 400 }
      );
    }
    
    if (!messageContent) {
      return NextResponse.json(
        { error: 'Invalid request: empty message content' },
        { status: 400 }
      );
    }
    
    // Validate the business plan exists
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id }
    })

    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }
    
    // Get or create a thread for the conversation
    const threadId = await getOrCreateThread(params.id)
    
    // Process the message with the assistant
    const assistantResponse = await processWithAssistant(threadId, messageContent)
    
    // Only extract positioning data if this is not a help request
    let positioningData = null;
    if (!isHelp) {
      // Extract positioning data from the conversation
      positioningData = await extractPositioningData(threadId)
    }
    
    // Update the business plan with the positioning data
    const content = businessPlan.content as BusinessPlanContent || {}
    
    // Initialize marketing plan and positioning if they don't exist
    if (!content.marketingPlan) {
      content.marketingPlan = {}
    }
    
    content.marketingPlan.positioning = positioningData
    
    // Save the updated content
    await prisma.businessPlan.update({
      where: { id: params.id },
      data: { content }
    })
    
    // Return the assistant's response and the extracted data
    return NextResponse.json({
      message: assistantResponse,
      positioning: positioningData
    })
    
  } catch (error) {
    console.error('Error processing market positioning message:', error)
    return NextResponse.json(
      { error: 'Failed to process message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET handler for retrieving the market positioning data
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id },
      select: {
        content: true,
      },
    });

    if (!businessPlan) {
      return new NextResponse(
        JSON.stringify({ error: 'Business plan not found' }),
        { status: 404 }
      );
    }

    const content = businessPlan.content as any;
    
    // Extract and return the market positioning data
    // If it doesn't exist yet, return an empty object
    return new NextResponse(
      JSON.stringify({
        positioning: content?.marketingPlan?.positioning ?? ''
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching market positioning data:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch market positioning data' }),
      { status: 500 }
    );
  }
} 