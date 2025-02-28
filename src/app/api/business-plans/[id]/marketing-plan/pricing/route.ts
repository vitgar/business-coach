import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { sleep } from '@/lib/utils';

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
});

// Set constants for API rate limiting and assistant ID
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests
const PRICING_ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID!;
let lastRequestTime = 0;

/**
 * Get or create a thread for the business plan
 */
async function getOrCreateThread(businessPlanId: string): Promise<string> {
  try {
    // Get the business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId },
      select: {
        content: true
      }
    });

    if (!businessPlan) {
      throw new Error('Business plan not found');
    }

    // Parse the content
    const content = businessPlan.content as any || {};
    
    // Check if we have a pricing thread ID
    if (content.marketingPlan?.threadId) {
      return content.marketingPlan.threadId;
    }
    
    // Create a new thread
    const thread = await openai.beta.threads.create();
    
    // Initialize marketingPlan if it doesn't exist
    if (!content.marketingPlan) {
      content.marketingPlan = {};
    }
    
    // Save the thread ID to the business plan
    content.marketingPlan.threadId = thread.id;
    
    await prisma.businessPlan.update({
      where: { id: businessPlanId },
      data: {
        content: content
      }
    });
    
    return thread.id;
  } catch (error) {
    console.error('Error getting or creating thread:', error);
    throw error;
  }
}

/**
 * Wait for active runs to complete
 */
async function waitForActiveRuns(threadId: string): Promise<void> {
  try {
    const runs = await openai.beta.threads.runs.list(threadId);
    
    const activeRun = runs.data.find(run => 
      ['in_progress', 'queued', 'cancelling'].includes(run.status)
    );
    
    if (activeRun) {
      // Wait for the run to complete
      let runStatus = await openai.beta.threads.runs.retrieve(
        threadId,
        activeRun.id
      );
      
      while (['in_progress', 'queued', 'cancelling'].includes(runStatus.status)) {
        await sleep(1000);
        runStatus = await openai.beta.threads.runs.retrieve(
          threadId,
          activeRun.id
        );
      }
    }
  } catch (error) {
    console.error('Error waiting for active runs:', error);
    throw error;
  }
}

/**
 * Process a message with the OpenAI assistant
 */
async function processWithAssistant(threadId: string, message: string): Promise<string> {
  try {
    // Rate limiting
    const now = Date.now();
    const timeElapsed = now - lastRequestTime;
    
    if (timeElapsed < MIN_REQUEST_INTERVAL) {
      await sleep(MIN_REQUEST_INTERVAL - timeElapsed);
    }
    
    lastRequestTime = Date.now();
    
    // Add the message to the thread
    await openai.beta.threads.messages.create(
      threadId,
      {
        role: 'user',
        content: message
      }
    );
    
    // Wait for any active runs to complete
    await waitForActiveRuns(threadId);
    
    // Create a run
    const run = await openai.beta.threads.runs.create(
      threadId,
      {
        assistant_id: PRICING_ASSISTANT_ID
      }
    );
    
    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(
      threadId,
      run.id
    );
    
    while (['in_progress', 'queued'].includes(runStatus.status)) {
      await sleep(1000);
      runStatus = await openai.beta.threads.runs.retrieve(
        threadId,
        run.id
      );
    }
    
    // Get the messages
    const messages = await openai.beta.threads.messages.list(
      threadId
    );
    
    // Return the latest assistant message
    const assistantMessages = messages.data.filter(m => m.role === 'assistant');
    
    if (assistantMessages.length > 0) {
      const latestMessage = assistantMessages[0];
      return latestMessage.content[0].type === 'text' 
        ? latestMessage.content[0].text.value 
        : 'Assistant response was not text';
    }
    
    return 'No response from assistant';
  } catch (error) {
    console.error('Error processing with assistant:', error);
    throw error;
  }
}

/**
 * Extract pricing strategy data from the conversation
 */
async function extractPricingData(threadId: string): Promise<string> {
  try {
    // Get the conversation
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Extract message contents
    const conversation = messages.data.map(message => {
      const content = message.content[0].type === 'text' 
        ? message.content[0].text.value 
        : '';
      
      return `${message.role.toUpperCase()}: ${content}`;
    }).join('\n\n');
    
    // Ask the assistant to extract structured data
    const promptForExtraction = `
      Based on our conversation, please summarize the pricing strategy for this business.
      Structure your response with clear sections for:
      
      - Overall pricing approach (premium, budget, value-based)
      - Specific pricing models used (subscription, one-time, freemium, etc)
      - How prices were determined
      - Competitive price analysis
      - Discount strategy
      - Timeline for price changes
      
      Format your response as a clean markdown document that can be inserted directly into a business plan.
      Use markdown headings (##) for each section and include bullet points for lists.
    `;
    
    // Add the extraction prompt
    await openai.beta.threads.messages.create(
      threadId,
      {
        role: 'user',
        content: promptForExtraction
      }
    );
    
    // Wait for any active runs to complete
    await waitForActiveRuns(threadId);
    
    // Create a run for extraction
    const run = await openai.beta.threads.runs.create(
      threadId,
      {
        assistant_id: PRICING_ASSISTANT_ID
      }
    );
    
    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(
      threadId,
      run.id
    );
    
    while (['in_progress', 'queued'].includes(runStatus.status)) {
      await sleep(1000);
      runStatus = await openai.beta.threads.runs.retrieve(
        threadId,
        run.id
      );
    }
    
    // Get the messages
    const extractionMessages = await openai.beta.threads.messages.list(
      threadId
    );
    
    // Return the latest assistant message
    const assistantMessages = extractionMessages.data.filter(m => m.role === 'assistant');
    
    if (assistantMessages.length > 0) {
      const latestMessage = assistantMessages[0];
      return latestMessage.content[0].type === 'text' 
        ? cleanResponse(latestMessage.content[0].text.value) 
        : '';
    }
    
    return '';
  } catch (error) {
    console.error('Error extracting pricing data:', error);
    throw error;
  }
}

/**
 * Clean the response to ensure it's valid
 */
function cleanResponse(response: string): string {
  // Remove code blocks and JSON formatting if present
  return response
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
}

/**
 * POST handler for processing messages and extracting pricing strategy data
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
    
    // Get or create a thread
    const threadId = await getOrCreateThread(params.id);
    
    // Process the message with the assistant
    const assistantResponse = await processWithAssistant(
      threadId,
      messageContent
    );
    
    // Extract pricing data if this is not a help request
    let pricingData = '';
    if (!isHelp) {
      pricingData = await extractPricingData(threadId);
    }
    
    // Save the pricing data to the business plan if extracted
    if (pricingData) {
      const businessPlan = await prisma.businessPlan.findUnique({
        where: { id: params.id },
        select: {
          content: true
        }
      });
      
      if (businessPlan) {
        const content = businessPlan.content as any || {};
        
        // Initialize marketingPlan if it doesn't exist
        if (!content.marketingPlan) {
          content.marketingPlan = {};
        }
        
        // Save the pricing data
        content.marketingPlan.pricing = pricingData;
        
        await prisma.businessPlan.update({
          where: { id: params.id },
          data: {
            content: content
          }
        });
      }
    }
    
    return NextResponse.json({
      message: assistantResponse,
      pricing: pricingData
    });
  } catch (error) {
    console.error('Error processing pricing strategy message:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process message', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for retrieving the pricing strategy data
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
    
    // Extract and return the pricing strategy data
    return new NextResponse(
      JSON.stringify({
        pricing: content?.marketingPlan?.pricing ?? ''
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching pricing strategy data:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch pricing strategy data' }),
      { status: 500 }
    );
  }
} 