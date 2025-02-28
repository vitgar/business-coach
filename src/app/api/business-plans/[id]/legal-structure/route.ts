import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import type { ChatMessage } from '@/types/chat'
import { ASSISTANT_CONFIG } from '@/config/constants'
import { sleep } from '@/lib/utils'
import { Prisma, BusinessPlan } from '@prisma/client'

/**
 * Type for business plan content
 */
interface BusinessPlanContent {
  threadId?: string;
  legalStructure?: {
    structureType?: string;
    rationale?: string;
    ownershipDetails?: string;
    taxImplications?: string;
    legalRequirements?: string[];
    futurePlans?: string;
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
 * Checks if there are any active runs on a thread and waits for them to complete
 * @param threadId The thread ID to check
 * @returns Promise that resolves when no active runs are found
 */
async function waitForActiveRuns(threadId: string): Promise<void> {
  // List all runs on the thread
  const runs = await openai.beta.threads.runs.list(threadId);
  
  // Find any active runs (not completed or failed)
  const activeRuns = runs.data.filter(run => 
    !['completed', 'failed', 'cancelled', 'expired'].includes(run.status)
  );
  
  // If there are active runs, wait for them to complete
  for (const run of activeRuns) {
    console.log(`Waiting for active run ${run.id} to complete...`);
    
    while (true) {
      const runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      
      if (['completed', 'failed', 'cancelled', 'expired'].includes(runStatus.status)) {
        console.log(`Run ${run.id} is now ${runStatus.status}`);
        break;
      }
      
      await sleep(1000);
    }
  }
}

/**
 * Processes a conversation with an assistant and waits for completion
 * @param threadId The thread ID to use
 * @param assistantId The assistant ID to use
 * @param message The message to send
 * @returns The assistant's response
 */
async function processWithAssistant(threadId: string, assistantId: string, message: string) {
  try {
    // Wait for any active runs to complete before adding new messages
    await waitForActiveRuns(threadId);
    
    // Add message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    });

    // Add example generation instructions if the message indicates help is needed
    const needsExamples = message.toLowerCase().includes('example') || 
                         message.toLowerCase().includes('help') || 
                         message.toLowerCase().includes('not sure') ||
                         message.toLowerCase().includes('guidance');

    // Base instructions to avoid showing JSON or code
    const baseInstructions = `IMPORTANT: Do not include JSON structures, code blocks, or technical formatting in your responses to the user.
    Keep your responses conversational, friendly, and easy to understand.
    If you need to reference structured data, describe it in plain language instead of showing the raw format.
    Never use markdown code blocks, backticks, or JSON syntax in your responses.
    Format your responses as natural language paragraphs and bullet points only.
    
    REMINDER: The user should NEVER see any JSON, code blocks, or technical formatting in your responses.
    This is critical - your response will be shown directly to the user without any processing.
    If you need to work with structured data, do it internally without showing the technical details.`;

    // Run the assistant with appropriate instructions
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      instructions: needsExamples ? 
        `${baseInstructions}
        
        You are helping the user define the legal structure for their business. Provide 2-3 specific, detailed examples in your response. Examples should:
        1. Include concrete details about different legal structures (like sole proprietorship, LLC, corporation)
        2. Explain the pros and cons of each structure
        3. Cover tax implications and liability considerations
        4. Be clearly formatted and numbered
        5. After presenting examples, ask:
           - "Which of these legal structures seems most appropriate for your business?"
           - "Would you like more information about any particular structure?"
           - "Do you have specific questions about ownership, taxes, or liability?"
        
        Keep focused on legal structure types, rationale for choosing them, ownership details, tax implications, legal requirements, and future plans.
        
        Remember: Never include JSON, code blocks, or technical formatting in your responses.` : baseInstructions
    });

    // Wait for completion
    while (true) {
      const runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      if (runStatus.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(threadId);
        return messages.data[0];
      } else if (runStatus.status === 'failed') {
        throw new Error('Assistant run failed');
      }
      await sleep(1000);
    }
  } catch (error) {
    console.error('Error in processWithAssistant:', error);
    throw error;
  }
}

/**
 * Extracts structured legal structure data from conversation
 * @param threadId The thread ID to use
 * @param conversation The conversation history
 * @returns Structured legal structure data
 */
async function extractLegalStructureData(threadId: string, conversation: string): Promise<BusinessPlanContent['legalStructure']> {
  try {
    // Create a separate thread for data extraction to avoid polluting the main conversation
    const extractionThread = await openai.beta.threads.create();
    
    const structuringPrompt = `Based on this conversation about business legal structure, 
    extract and structure the following information in JSON format:
    {
      "structureType": "The type of legal structure chosen (e.g., sole proprietorship, LLC, corporation)",
      "rationale": "Explanation of why this structure was chosen",
      "ownershipDetails": "Description of ownership structure and percentages",
      "taxImplications": "Description of tax implications for this structure",
      "legalRequirements": ["Array of legal requirements and regulations"],
      "futurePlans": "Description of any plans to change the legal structure in the future"
    }
    
    IMPORTANT: Return ONLY the JSON structure without any additional text, explanations, or code formatting.
    Do not include any markdown code blocks or JSON syntax highlighting.
    Do not add new information just retrieve the information from the input.
    If information for a field is not available in the conversation, exclude that field from the JSON.
    Do not hallucinate.
    Do not jump to conclusions.
    Conversation: ${conversation}`;

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
            // Extract JSON from the response text - look for anything that looks like JSON
            const jsonMatch = content.text.value.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            console.warn('No JSON structure found in extraction response');
          } catch (error) {
            console.error('Error parsing legal structure data:', error);
          }
        }
        break;
      } else if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        console.error(`Extraction run failed with status: ${runStatus.status}`);
        throw new Error(`Assistant run failed for data extraction with status: ${runStatus.status}`);
      }
      await sleep(1000);
    }
    
    // If we reach here, we couldn't extract valid JSON data
    console.error('Failed to extract structured legal structure data - no valid JSON found');
    
    // Return a default empty structure rather than throwing an error
    return {
      structureType: "Information not available",
      rationale: "Information not available",
      ownershipDetails: "Information not available",
      taxImplications: "Information not available",
      legalRequirements: [],
      futurePlans: "Information not available"
    };
  } catch (error) {
    console.error('Error in extractLegalStructureData:', error);
    
    // Return a default structure in case of error
    return {
      structureType: "Error extracting information",
      rationale: "Error extracting information",
      ownershipDetails: "Error extracting information",
      taxImplications: "Error extracting information",
      legalRequirements: [],
      futurePlans: "Error extracting information"
    };
  }
}

/**
 * POST - Main API endpoint handler for chat interactions about legal structure
 * 
 * Purpose:
 * - Processes incoming chat messages for business plan legal structure
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
    console.log(`Using thread ID: ${threadId} for business plan: ${params.id}`);
    
    // First, process with general assistant for conversation
    const latestMessage = messages[messages.length - 1]
    console.log(`Processing message: "${latestMessage.content.substring(0, 50)}..." with assistant`);
    
    let conversationResponse;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        conversationResponse = await processWithAssistant(threadId, GENERAL_ASSISTANT_ID, latestMessage.content);
        break; // Success, exit the retry loop
      } catch (error) {
        retryCount++;
        console.error(`Attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          throw error; // Re-throw if we've exhausted retries
        }
        
        // Wait before retrying (exponential backoff)
        const backoffTime = 1000 * Math.pow(2, retryCount);
        console.log(`Retrying in ${backoffTime}ms...`);
        await sleep(backoffTime);
      }
    }
    
    if (!conversationResponse) {
      throw new Error('Failed to get response from assistant after multiple attempts');
    }
    
    // Extract the conversation content
    const conversationContent = conversationResponse.content[0]
    if (!('text' in conversationContent)) {
      throw new Error('Unexpected response format')
    }

    console.log('Successfully received assistant response');
    
    // Get structured legal structure data
    const allMessages = messages.map(m => m.content).join("\n") + "\n" + conversationContent.text.value
    console.log('Extracting structured legal structure data...');
    const legalStructureData = await extractLegalStructureData(threadId, allMessages)
    console.log('Legal structure data extracted successfully');

    // Update business plan with structured data
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id }
    })

    if (businessPlan) {
      console.log('Updating business plan with legal structure data...');
      const content = (businessPlan.content || {}) as BusinessPlanContent
      await prisma.businessPlan.update({
        where: { id: params.id },
        data: {
          content: {
            ...content,
            legalStructure: legalStructureData
          }
        }
      })
      console.log('Business plan updated successfully');
    } else {
      console.warn(`Business plan with ID ${params.id} not found for update`);
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
    
    // Remove any lines that start with quotes and end with comma
    cleanedContent = cleanedContent.replace(/^\s*".*",?\s*$/gm, '');
    
    // Trim any whitespace
    cleanedContent = cleanedContent.trim();
    
    // If we've removed too much content, use the original
    if (cleanedContent.length < 20 && conversationContent.text.value.length > 20) {
      cleanedContent = conversationContent.text.value;
    }

    console.log('Sending successful response');
    return NextResponse.json({
      id: conversationResponse.id,
      model: 'gpt-4',
      message: {
        content: cleanedContent || conversationContent.text.value,
        role: 'assistant'
      },
      legalStructureData,
      finish_reason: 'stop'
    })

  } catch (error) {
    console.error('API error:', error)
    
    // Handle rate limiting errors
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
    
    // Handle thread-related errors
    if (error instanceof Error && 
        (error.message.includes('thread') || 
         error.message.includes('run') || 
         error.message.includes('active'))) {
      return NextResponse.json(
        { 
          error: 'There was an issue with the conversation. Please try again.',
          details: error.message,
          retryAfter: 3
        },
        { 
          status: 503,
          headers: {
            'Retry-After': '3'
          }
        }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat request', 
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Fetch the legal structure data for a business plan
 * 
 * Purpose:
 * - Retrieves the existing legal structure data for a business plan
 * - Used to populate the legal structure questionnaire with existing data
 * 
 * Flow:
 * 1. Fetches the business plan by ID
 * 2. Extracts the legal structure data from the content field
 * 3. Returns the data in the response
 * 
 * @param {Request} request - Incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with legal structure data or error
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id }
    })

    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }

    // Extract the legal structure data from the content field
    const content = (businessPlan.content || {}) as BusinessPlanContent
    const legalStructureData = content.legalStructure || {}

    return NextResponse.json({
      id: businessPlan.id,
      legalStructureData,
    })
  } catch (error) {
    console.error('Error fetching legal structure data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch legal structure data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 