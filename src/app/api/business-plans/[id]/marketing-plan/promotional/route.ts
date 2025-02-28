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

let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // Minimum 1 second between requests

// Assistant ID for marketing plan
const MARKETING_ASSISTANT_ID = process.env.OPENAI_MARKETING_ASSISTANT_ID || process.env.OPENAI_ASSISTANT_ID!

/**
 * Get or create a thread for the business plan
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
    
    // Check if there's a thread ID in the marketing plan
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
 * Extract promotional activities data from the conversation
 */
async function extractPromotionalData(threadId: string): Promise<string> {
  try {
    // Prepare the prompt for extracting promotional data
    const prompt = `Based on our conversation, please summarize the promotional activities strategy in a detailed, well-structured format. Include the following sections if we've discussed them:

1. Marketing Channels: What channels will be used to reach the target audience
2. Advertising Strategy: Approach to advertising and planned campaigns
3. Content Marketing: Content creation and distribution strategy
4. Social Media Strategy: How social media platforms will be utilized
5. Public Relations: PR activities and media relations
6. Promotions: Special offers, discounts, and promotional events

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
    console.error('Error extracting promotional activities data:', error)
    throw error
  }
}

/**
 * Clean the response to ensure it's valid
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
 * POST - Process a message and extract promotional activities data
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
    let promotional = '';
    if (!isHelp) {
      // Extract promotional activities data
      promotional = await extractPromotionalData(threadId)
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
        promotional
      }
    }
    
    await prisma.businessPlan.update({
      where: { id: params.id },
      data: { content: updatedContent }
    })
    
    return NextResponse.json({
      message: assistantResponse,
      promotional,
      promotionalData: {} // This would contain structured data if needed
    })
  } catch (error) {
    console.error('Error in promotional activities POST handler:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

/**
 * GET - Retrieve promotional activities data
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
    const promotional = content.marketingPlan?.promotional || ''
    
    return NextResponse.json({
      promotional,
      promotionalData: {} // This would contain structured data if needed
    })
  } catch (error) {
    console.error('Error in promotional activities GET handler:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve promotional activities data' },
      { status: 500 }
    )
  }
} 