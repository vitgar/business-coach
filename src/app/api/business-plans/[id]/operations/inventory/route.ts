import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { sleep } from '@/lib/utils';

/**
 * Interface for the business plan content structure
 */
interface BusinessPlanContent {
  operations?: {
    production?: string;
    productionThreadId?: string;
    productionData?: any;
    qualityControl?: string;
    qualityControlThreadId?: string;
    qualityControlData?: any;
    inventory?: string;
    inventoryThreadId?: string;
    inventoryData?: {
      inventoryApproach?: string;
      trackingSystems?: string;
      storageSolutions?: string;
      reorderPolicies?: string;
      supplierManagement?: string;
      inventoryTurnover?: string;
      seasonalConsiderations?: string;
    };
    kpis?: string;
    technology?: string;
  };
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

// Rate limiting for OpenAI API calls
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 500; // milliseconds

/**
 * Gets an existing thread ID for inventory management or creates a new one
 * 
 * @param businessPlanId - The ID of the business plan
 * @param content - The business plan content
 * @returns The thread ID
 */
async function getOrCreateThread(businessPlanId: string, content: BusinessPlanContent) {
  try {
    // Check if there's an existing thread ID
    if (content.operations?.inventoryThreadId) {
      return content.operations.inventoryThreadId;
    }
    
    // Create a new thread
    const thread = await openai.beta.threads.create();
    
    // Save the thread ID to the business plan
    await prisma.businessPlan.update({
      where: { id: businessPlanId },
      data: {
        content: {
          ...content,
          operations: {
            ...content.operations,
            inventoryThreadId: thread.id,
          },
        },
      },
    });
    
    return thread.id;
  } catch (error) {
    console.error('Error getting or creating thread:', error);
    throw new Error('Failed to initialize conversation thread');
  }
}

/**
 * Waits for any active runs on the thread to complete
 * 
 * @param threadId - The thread ID
 */
async function waitForActiveRuns(threadId: string) {
  try {
    const runs = await openai.beta.threads.runs.list(threadId);
    const activeRuns = runs.data.filter(run => 
      run.status === 'in_progress' || 
      run.status === 'queued' || 
      run.status === 'cancelling'
    );
    
    for (const run of activeRuns) {
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      while (
        runStatus.status === 'in_progress' || 
        runStatus.status === 'queued' || 
        runStatus.status === 'cancelling'
      ) {
        await sleep(1000);
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }
    }
  } catch (error) {
    console.error('Error waiting for active runs:', error);
  }
}

/**
 * Process a message with the OpenAI assistant
 * 
 * @param threadId - The thread ID
 * @param message - The message to process
 * @returns The assistant's response
 */
async function processWithAssistant(threadId: string, message: string) {
  try {
    // Rate limiting
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_GAP) {
      await sleep(MIN_REQUEST_GAP - (now - lastRequestTime));
    }
    lastRequestTime = Date.now();
    
    // Add the message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
    });
    
    // Create a run with the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID as string,
    });
    
    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    while (
      runStatus.status === 'in_progress' || 
      runStatus.status === 'queued' || 
      runStatus.status === 'cancelling'
    ) {
      await sleep(1000);
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }
    
    // Get the assistant's messages
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Find the most recent assistant message
    const assistantMessages = messages.data
      .filter(msg => msg.role === 'assistant')
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    
    if (assistantMessages.length === 0) {
      throw new Error('No response from assistant');
    }
    
    // Get the content of the assistant's message
    const assistantMessage = assistantMessages[0];
    const content = assistantMessage.content[0];
    
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from assistant');
    }
    
    return cleanResponse(content.text.value);
  } catch (error) {
    console.error('Error processing with assistant:', error);
    throw new Error('Failed to process message with assistant');
  }
}

/**
 * Extract inventory management data from the conversation
 * 
 * @param threadId - The thread ID
 * @returns The extracted inventory management data
 */
async function extractInventoryData(threadId: string) {
  try {
    // Add a special message to extract the inventory management data
    const extractionPrompt = `
    Based on our conversation so far, please provide a summary of the inventory management approach in JSON format.
    
    Include the following sections (if discussed):
    
    1. inventoryApproach: A high-level description of the overall inventory management philosophy
    2. trackingSystems: Description of inventory tracking systems and methods
    3. storageSolutions: Details on storage facilities and solutions
    4. reorderPolicies: Information on reorder points and policies
    5. supplierManagement: Approach to supplier relationships and management
    6. inventoryTurnover: Goals for inventory turnover
    7. seasonalConsiderations: How seasonal fluctuations are managed
    
    Respond ONLY with valid JSON. Format for empty sections as null or empty strings.
    `;
    
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: extractionPrompt,
    });
    
    // Run the extraction request
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID as string,
    });
    
    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    while (
      runStatus.status === 'in_progress' || 
      runStatus.status === 'queued' || 
      runStatus.status === 'cancelling'
    ) {
      await sleep(1000);
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }
    
    // Get the extracted data
    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantMessages = messages.data
      .filter(msg => msg.role === 'assistant')
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    
    if (assistantMessages.length === 0) {
      throw new Error('No response from assistant for extraction');
    }
    
    const assistantMessage = assistantMessages[0];
    const content = assistantMessage.content[0];
    
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from assistant');
    }
    
    const responseText = content.text.value;
    
    // Try to parse the JSON response
    try {
      // Find JSON content (accounting for possible markdown code blocks)
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, responseText];
      
      const jsonContent = jsonMatch[1].trim();
      const inventoryData = JSON.parse(jsonContent);
      
      // Delete the extraction messages to keep the thread clean
      await openai.beta.threads.messages.del(threadId, assistantMessage.id);
      
      return inventoryData;
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      console.error('Response text:', responseText);
      return {}; // Return empty object if parsing fails
    }
  } catch (error) {
    console.error('Error extracting inventory data:', error);
    return {}; // Return empty object on error
  }
}

/**
 * Clean assistant response to remove unwanted formatting
 * 
 * @param response - The raw response from the assistant
 * @returns The cleaned response
 */
function cleanResponse(response: string): string {
  // Remove any json code blocks that might have been added
  return response.replace(/```json[\s\S]*?```/g, '').trim();
}

/**
 * Formats inventory data as markdown
 * @param inventoryData - The inventory management data to format
 * @returns Formatted markdown string
 */
function formatInventoryMarkdown(inventoryData: any): string {
  let inventoryMarkdown = '## Inventory Management\n\n';
  
  if (inventoryData.inventoryApproach) {
    inventoryMarkdown += '### Inventory Management Approach\n';
    inventoryMarkdown += inventoryData.inventoryApproach + '\n\n';
  }
  
  if (inventoryData.trackingSystems) {
    inventoryMarkdown += '### Tracking Systems\n';
    inventoryMarkdown += inventoryData.trackingSystems + '\n\n';
  }
  
  if (inventoryData.storageSolutions) {
    inventoryMarkdown += '### Storage Solutions\n';
    inventoryMarkdown += inventoryData.storageSolutions + '\n\n';
  }
  
  if (inventoryData.reorderPolicies) {
    inventoryMarkdown += '### Reorder Points & Policies\n';
    inventoryMarkdown += inventoryData.reorderPolicies + '\n\n';
  }
  
  if (inventoryData.supplierManagement) {
    inventoryMarkdown += '### Supplier Management\n';
    inventoryMarkdown += inventoryData.supplierManagement + '\n\n';
  }
  
  if (inventoryData.inventoryTurnover) {
    inventoryMarkdown += '### Inventory Turnover Goals\n';
    inventoryMarkdown += inventoryData.inventoryTurnover + '\n\n';
  }
  
  if (inventoryData.seasonalConsiderations) {
    inventoryMarkdown += '### Seasonal Considerations\n';
    inventoryMarkdown += inventoryData.seasonalConsiderations + '\n\n';
  }
  
  return inventoryMarkdown;
}

/**
 * Handle POST requests to process messages and extract inventory management data
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlanId = params.id;
    const requestData = await request.json();
    
    // Handle both single message and messages array formats
    let message: string;
    let isHelpRequest = false;
    
    if (requestData.message) {
      // Handle single message format
      message = requestData.message;
    } else if (Array.isArray(requestData.messages)) {
      // Handle messages array format - get the most recent user message
      const userMessages = requestData.messages.filter(
        (msg: any) => msg.role === 'user'
      );
      message = userMessages.length > 0 
        ? userMessages[userMessages.length - 1].content 
        : '';
        
      // Check if this is a help request
      isHelpRequest = requestData.messages.some(
        (msg: any) => 
          msg.role === 'user' && 
          typeof msg.content === 'string' && 
          msg.content.toLowerCase().includes('help')
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid request format - message or messages required' },
        { status: 400 }
      );
    }
    
    // Validate message content
    if (!message) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }
    
    // Get the business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId },
      select: { content: true },
    });
    
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      );
    }
    
    const content = businessPlan.content as BusinessPlanContent;
    
    // Initialize operations if it doesn't exist
    if (!content.operations) {
      content.operations = {};
    }
    
    // Get or create thread for the conversation
    const threadId = await getOrCreateThread(businessPlanId, content);
    
    // Wait for any active runs
    await waitForActiveRuns(threadId);
    
    // Process the message with the assistant
    const assistantResponse = await processWithAssistant(threadId, message);
    
    let inventoryData: any = {};
    let inventoryMarkdown = '';
    
    // Extract inventory management data only if not a help request
    if (!isHelpRequest) {
      inventoryData = await extractInventoryData(threadId);
      
      // Format inventory data as markdown
      inventoryMarkdown = formatInventoryMarkdown(inventoryData);
      
      // Update the business plan with the extracted data
      await prisma.businessPlan.update({
        where: { id: businessPlanId },
        data: {
          content: {
            ...content,
            operations: {
              ...content.operations,
              inventory: inventoryMarkdown,
              inventoryData: inventoryData,
              inventoryThreadId: threadId
            }
          }
        }
      });
    }
    
    return NextResponse.json({
      response: cleanResponse(assistantResponse),
      inventory: inventoryMarkdown,
      inventoryData: inventoryData
    });
  } catch (error) {
    console.error('Error processing inventory message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests to retrieve inventory management data
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlanId = params.id;
    
    // Get the business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId },
      select: { content: true },
    });
    
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      );
    }
    
    const content = businessPlan.content as BusinessPlanContent;
    
    // Return the inventory management data
    return NextResponse.json({
      inventory: content.operations?.inventory || '',
      inventoryData: content.operations?.inventoryData || {},
    });
  } catch (error) {
    console.error('Error retrieving inventory management data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve inventory management data' },
      { status: 500 }
    );
  }
} 