import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { sleep, processWithBusinessPlanCreator } from '@/lib/utils';

/**
 * Interface for the business plan content structure
 */
interface BusinessPlanContent {
  operations?: {
    production?: string;
    productionThreadId?: string;
    productionData?: {
      processOverview?: string;
      processSteps?: string[];
      equipmentAndTechnology?: string;
      productionTimeline?: string;
      capacityManagement?: string;
      outsourcingStrategy?: string;
      productionCosts?: string;
    };
    qualityControl?: string;
    inventory?: string;
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
 * Gets an existing thread ID for production process or creates a new one
 * 
 * @param businessPlanId - The ID of the business plan
 * @param content - The business plan content
 * @returns The thread ID
 */
async function getOrCreateThread(businessPlanId: string, content: BusinessPlanContent) {
  try {
    // Check if there's an existing thread ID
    if (content.operations?.productionThreadId) {
      return content.operations.productionThreadId;
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
            productionThreadId: thread.id,
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
 * Extract production process data from the conversation
 * 
 * @param threadId - The thread ID
 * @returns The extracted production process data
 */
async function extractProductionData(threadId: string) {
  try {
    // Add a special message to extract the production data
    const extractionPrompt = `
    Based on our conversation so far, please provide a summary of the production process in JSON format.
    
    Include the following sections (if discussed):
    
    1. processOverview: A high-level description of how products/services are created
    2. processSteps: An array of key steps in the production/service delivery process
    3. equipmentAndTechnology: Description of key equipment and technology used
    4. productionTimeline: Details on production scheduling and timelines
    5. capacityManagement: How production capacity is managed
    6. outsourcingStrategy: Any outsourcing or partnerships for production
    7. productionCosts: Overview of production costs
    
    Respond ONLY with valid JSON. Format for empty sections as null or empty strings/arrays.
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
      const productionData = JSON.parse(jsonContent);
      
      // Delete the extraction messages to keep the thread clean
      await openai.beta.threads.messages.del(threadId, assistantMessage.id);
      
      return productionData;
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      console.error('Response text:', responseText);
      return {}; // Return empty object if parsing fails
    }
  } catch (error) {
    console.error('Error extracting production data:', error);
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
 * Handle POST requests to process messages and extract production data
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlanId = params.id;
    
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
    const assistantResponse = await processWithAssistant(threadId, messageContent);
    
    // Only extract data if not a help request
    let productionData: any = {};
    let productionMarkdown = '';
    let businessPlanData: any = {};
    
    if (!isHelp) {
      // First extract production data from the conversation using the existing method
      productionData = await extractProductionData(threadId);
      
      // Then process the entire chat content with the business plan creator assistant
      // Get all messages from the thread to provide context
      const messages = await openai.beta.threads.messages.list(threadId);
      const chatContent = messages.data
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content[0].type === 'text' ? msg.content[0].text.value : ''}`)
        .join('\n\n');
      
      // Process the chat content to get structured business plan data
      businessPlanData = await processWithBusinessPlanCreator(threadId, chatContent, 'production');
      
      // Format the production data as markdown (using the existing process)
      productionMarkdown = '## Production Process\n\n';
      
      if (productionData.processOverview) {
        productionMarkdown += '### Process Overview\n';
        productionMarkdown += productionData.processOverview + '\n\n';
      }
      
      if (productionData.processSteps && productionData.processSteps.length > 0) {
        productionMarkdown += '### Production Steps\n';
        productionData.processSteps.forEach((step: string, index: number) => {
          productionMarkdown += `${index + 1}. ${step}\n`;
        });
        productionMarkdown += '\n';
      }
      
      if (productionData.equipmentAndTechnology) {
        productionMarkdown += '### Equipment & Technology\n';
        productionMarkdown += productionData.equipmentAndTechnology + '\n\n';
      }
      
      if (productionData.productionTimeline) {
        productionMarkdown += '### Production Timeline\n';
        productionMarkdown += productionData.productionTimeline + '\n\n';
      }
      
      if (productionData.capacityManagement) {
        productionMarkdown += '### Capacity Management\n';
        productionMarkdown += productionData.capacityManagement + '\n\n';
      }
      
      if (productionData.outsourcingStrategy) {
        productionMarkdown += '### Outsourcing Strategy\n';
        productionMarkdown += productionData.outsourcingStrategy + '\n\n';
      }
      
      if (productionData.productionCosts) {
        productionMarkdown += '### Production Costs\n';
        productionMarkdown += productionData.productionCosts + '\n\n';
      }
      
      // Update the business plan with the extracted data
      const updatedContent = {
        ...content,
        operations: {
          ...content.operations,
          production: productionMarkdown,
          productionData
        }
      };
      
      await prisma.businessPlan.update({
        where: { id: businessPlanId },
        data: { content: updatedContent }
      });
    }
    
    return NextResponse.json({
      message: assistantResponse,
      productionData,
      businessPlanData, // Include the structured business plan data in the response
      // Add the production data in the format expected by GenericQuestionnaire
      production: {
        content: productionMarkdown,
        data: productionData
      }
    });
  } catch (error) {
    console.error('Error processing production message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests to retrieve production process data
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
    
    // Return the production data in the format expected by GenericQuestionnaire
    return NextResponse.json({
      production: {
        content: content.operations?.production || '',
        data: content.operations?.productionData || {}
      },
      productionData: content.operations?.productionData || {}
    });
  } catch (error) {
    console.error('Error retrieving production data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve production data' },
      { status: 500 }
    );
  }
} 