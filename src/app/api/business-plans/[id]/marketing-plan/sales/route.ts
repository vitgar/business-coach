import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { sleep } from '@/lib/utils'

/**
 * Interface for business plan content structure
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

// Rate limiting configuration
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // Minimum 1 second between requests

// Assistant ID for marketing plan
const MARKETING_ASSISTANT_ID = process.env.OPENAI_MARKETING_ASSISTANT_ID || process.env.OPENAI_ASSISTANT_ID!

/**
 * Get or create a thread for the business plan's sales strategy
 * @param businessPlanId - ID of the business plan
 * @returns Thread ID for the sales strategy conversation
 */
async function getOrCreateThread(businessPlanId: string): Promise<string> {
  try {
    // Find the business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId }
    })

    if (!businessPlan) {
      throw new Error('Business plan not found')
    }

    const content = businessPlan.content as BusinessPlanContent || {}
    
    // Check if there's a thread ID in the marketing plan for sales
    if (content.marketingPlan?.threadId) {
      return content.marketingPlan.threadId
    }
    
    // Create a new thread
    const thread = await openai.beta.threads.create()
    
    // Store the thread ID in the business plan content
    const updatedContent: BusinessPlanContent = {
      ...content,
      marketingPlan: {
        ...(content.marketingPlan || {}),
        threadId: thread.id
      }
    }
    
    await prisma.businessPlan.update({
      where: { id: businessPlanId },
      data: { content: updatedContent }
    })
    
    return thread.id
  } catch (error) {
    console.error('Error getting or creating thread:', error)
    throw error
  }
}

/**
 * Wait for any active runs to complete
 * @param threadId - ID of the thread to check for active runs
 */
async function waitForActiveRuns(threadId: string): Promise<void> {
  try {
    // List all runs for the thread
    const runs = await openai.beta.threads.runs.list(threadId)
    
    // Find any active runs
    const activeRuns = runs.data.filter(run => 
      run.status === 'queued' || 
      run.status === 'in_progress' || 
      run.status === 'requires_action'
    )
    
    // Wait for each active run to complete
    for (const run of activeRuns) {
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
      
      while (
        runStatus.status === 'queued' || 
        runStatus.status === 'in_progress' || 
        runStatus.status === 'requires_action'
      ) {
        await sleep(1000)
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
      }
    }
  } catch (error) {
    console.error('Error waiting for active runs:', error)
    throw error
  }
}

/**
 * Process a message with the OpenAI assistant
 * @param threadId - ID of the thread to process the message in
 * @param message - Message to process
 * @returns The assistant's response
 */
async function processWithAssistant(threadId: string, message: string): Promise<string> {
  try {
    // Rate limiting
    const now = Date.now()
    const timeElapsed = now - lastRequestTime
    if (timeElapsed < MIN_REQUEST_INTERVAL) {
      await sleep(MIN_REQUEST_INTERVAL - timeElapsed)
    }
    lastRequestTime = Date.now()
    
    // Add message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    })
    
    // Create a run with the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: MARKETING_ASSISTANT_ID
    })
    
    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
    
    while (
      runStatus.status === 'queued' || 
      runStatus.status === 'in_progress' || 
      runStatus.status === 'requires_action'
    ) {
      await sleep(1000)
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
    }
    
    if (runStatus.status !== 'completed') {
      throw new Error(`Run failed with status: ${runStatus.status}`)
    }
    
    // Get the latest message from the assistant
    const messages = await openai.beta.threads.messages.list(threadId)
    const latestMessage = messages.data
      .filter(msg => msg.role === 'assistant')
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
    
    if (!latestMessage || !latestMessage.content || latestMessage.content.length === 0) {
      throw new Error('No response from assistant')
    }
    
    // Check if the content is text type
    const textContent = latestMessage.content[0]
    if (textContent.type !== 'text') {
      throw new Error('Expected text response from assistant')
    }
    
    return textContent.text.value
  } catch (error) {
    console.error('Error processing with assistant:', error)
    throw error
  }
}

/**
 * Extract sales strategy data from the conversation
 * @param threadId - ID of the thread to extract data from
 * @returns Formatted sales strategy text
 */
async function extractSalesData(threadId: string): Promise<string> {
  try {
    // Prepare the prompt for extracting sales data
    const prompt = `Based on our conversation, please summarize the sales strategy in a detailed, well-structured format. Include the following sections if we've discussed them:

1. Sales Channels: How and where products/services will be sold
2. Sales Process: The steps in the sales cycle
3. Sales Team: Team structure, roles, and responsibilities
4. Customer Acquisition Metrics: CAC, sales cycles, and key metrics
5. Sales Tools & Technology: CRM and other tools
6. Sales Goals & Targets: Revenue targets and objectives

Format the response as markdown with clear headings and bullet points where appropriate. If we haven't discussed a particular aspect, please mention that it needs further consideration. Focus on being comprehensive while maintaining specificity to the business.`

    // Add the extraction message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: prompt
    })
    
    // Create a run with the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: MARKETING_ASSISTANT_ID
    })
    
    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
    
    while (
      runStatus.status === 'queued' || 
      runStatus.status === 'in_progress' || 
      runStatus.status === 'requires_action'
    ) {
      await sleep(1000)
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id)
    }
    
    if (runStatus.status !== 'completed') {
      throw new Error(`Run failed with status: ${runStatus.status}`)
    }
    
    // Get the latest message from the assistant
    const messages = await openai.beta.threads.messages.list(threadId)
    const latestMessage = messages.data
      .filter(msg => msg.role === 'assistant')
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
    
    if (!latestMessage || !latestMessage.content || latestMessage.content.length === 0) {
      throw new Error('No response from assistant')
    }
    
    // Check if the content is text type
    const textContent = latestMessage.content[0]
    if (textContent.type !== 'text') {
      throw new Error('Expected text response from assistant')
    }
    
    return textContent.text.value
  } catch (error) {
    console.error('Error extracting sales strategy data:', error)
    throw error
  }
}

/**
 * Clean the response to ensure it's valid
 * @param response - Response to clean
 * @returns Cleaned response
 */
function cleanResponse(response: string): string {
  // Remove any potential markdown code blocks or JSON syntax
  let cleaned = response
    .replace(/```(?:json)?/g, '')
    .replace(/```/g, '')
    .trim()
  
  return cleaned
}

/**
 * POST - Process a message and extract sales strategy data
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
        { error: 'Message is required' },
        { status: 400 }
      )
    }
    
    // Get or create a thread
    const threadId = await getOrCreateThread(params.id)
    
    // Wait for any active runs to complete
    await waitForActiveRuns(threadId)
    
    // Process the message with the assistant
    const assistantResponse = await processWithAssistant(threadId, messageContent)
    
    // Only extract data if not a help request
    let salesStrategy = '';
    if (!isHelp) {
      // Extract sales strategy data
      salesStrategy = await extractSalesData(threadId)
    }
    
    // Update the business plan with the extracted data
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id }
    })
    
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }
    
    const content = businessPlan.content as BusinessPlanContent || {}
    
    const updatedContent: BusinessPlanContent = {
      ...content,
      marketingPlan: {
        ...(content.marketingPlan || {}),
        threadId,
        sales: salesStrategy
      }
    }
    
    await prisma.businessPlan.update({
      where: { id: params.id },
      data: { content: updatedContent }
    })
    
    return NextResponse.json({
      message: assistantResponse,
      salesStrategy,
      salesData: {} // This would contain structured data if needed
    })
  } catch (error) {
    console.error('Error in sales strategy POST handler:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

/**
 * GET - Retrieve sales strategy data
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id }
    })
    
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }
    
    const content = businessPlan.content as BusinessPlanContent || {}
    const salesStrategy = content.marketingPlan?.sales || ''
    
    return NextResponse.json({
      salesStrategy,
      salesData: {} // This would contain structured data if needed
    })
  } catch (error) {
    console.error('Error in sales strategy GET handler:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve sales strategy data' },
      { status: 500 }
    )
  }
} 