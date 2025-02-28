import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

/**
 * Interface for the business plan content structure
 */
interface BusinessPlanContent {
  threadId?: string;
  locationFacilitiesThreadId?: string;
  products?: any;
  markets?: any;
  legalStructure?: any;
  locationFacilities?: {
    locationType: string;
    locationDetails: string;
    facilities: string;
    locationRationale: string;
    regulatoryRequirements: string;
    expansionPlans: string;
  };
  [key: string]: any;
}

/**
 * Interface for the business plan metadata structure
 */
interface BusinessPlanMetadata {
  productsThreadId?: string;
  marketsThreadId?: string;
  legalStructureThreadId?: string;
  locationFacilitiesThreadId?: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Creates a thread for conversation if one doesn't exist
 * @param businessPlanId - The ID of the business plan
 * @returns The thread ID
 */
async function getOrCreateThreadId(businessPlanId: string): Promise<string> {
  // Get the business plan
  const businessPlan = await prisma.businessPlan.findUnique({
    where: { id: businessPlanId }
  });

  if (!businessPlan) {
    throw new Error('Business plan not found');
  }

  const content = (businessPlan.content || {}) as BusinessPlanContent;
  
  // If thread exists in content, return it
  if (content.locationFacilitiesThreadId) {
    return content.locationFacilitiesThreadId;
  }

  // Create new thread
  const thread = await openai.beta.threads.create();

  // Update business plan with thread ID
  await prisma.businessPlan.update({
    where: { id: businessPlanId },
    data: {
      content: {
        ...content,
        locationFacilitiesThreadId: thread.id
      }
    }
  });

  return thread.id;
}

/**
 * Checks for any active runs on a thread
 * @param threadId - The thread ID to check
 * @returns Whether there is an active run
 */
async function hasActiveRun(threadId: string): Promise<boolean> {
  try {
    const runs = await openai.beta.threads.runs.list(threadId);
    const activeRuns = runs.data.filter(
      (run) => ['in_progress', 'queued', 'cancelling'].includes(run.status)
    );
    return activeRuns.length > 0;
  } catch (error) {
    console.error('Error checking active runs:', error);
    return false;
  }
}

/**
 * Process messages with the assistant
 * @param threadId - The thread ID
 * @param message - The user message
 * @returns Assistant's response
 */
async function processWithAssistant(threadId: string, message: string): Promise<string> {
  // Add the user message to the thread
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: message,
  });

  // Check if there's an active run
  if (await hasActiveRun(threadId)) {
    throw new Error('There is an active run on this thread. Please try again later.');
  }

  // Create a run with the assistant
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: process.env.LOCATION_FACILITIES_ASSISTANT_ID || process.env.ASSISTANT_ID || '',
    instructions: `You are a helpful business planning assistant focused on helping the user define their business location and facilities strategy. 
    Guide the conversation to cover the type of location, details of physical spaces, facilities requirements, rationale for location selection, 
    regulatory considerations, and future expansion plans. Extract structured data from the conversation for the business plan.`,
  });

  // Poll for the run completion
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
  
  // Simple polling mechanism
  while (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
    // Wait for a bit before checking again
    await new Promise((resolve) => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
  }

  if (runStatus.status === 'failed') {
    throw new Error('Assistant run failed: ' + (runStatus.last_error?.message || 'Unknown error'));
  }

  // Retrieve the latest message (the assistant's response)
  const messages = await openai.beta.threads.messages.list(threadId);
  const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
  
  if (assistantMessages.length === 0) {
    throw new Error('No assistant messages found');
  }

  // Get the latest assistant message
  const latestMessage = assistantMessages[0];
  let responseContent = '';

  // Extract text content from the message
  if (latestMessage.content && latestMessage.content.length > 0) {
    const textContent = latestMessage.content.filter(
      (content) => content.type === 'text'
    );
    
    if (textContent.length > 0 && 'text' in textContent[0]) {
      responseContent = textContent[0].text.value;
    }
  }

  return responseContent;
}

/**
 * Extract structured location and facilities data from conversation
 * @param threadId - The thread ID
 * @returns Structured location data
 */
async function extractLocationData(threadId: string): Promise<any> {
  try {
    // Add a system message requesting data extraction
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: `Please extract the structured data about the business location and facilities from our conversation. 
      Include locationType, locationDetails, facilities, locationRationale, regulatoryRequirements, and expansionPlans.
      Format it as valid JSON.`,
    });

    // Run the assistant to process the extraction request
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.LOCATION_FACILITIES_ASSISTANT_ID || process.env.ASSISTANT_ID || '',
      instructions: `Extract structured data about the business location and facilities from the conversation.
      Return a valid JSON object with these fields: locationType, locationDetails, facilities, locationRationale, 
      regulatoryRequirements, and expansionPlans. Use the information provided by the user.`,
    });

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    
    while (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    if (runStatus.status === 'failed') {
      throw new Error('Data extraction failed: ' + (runStatus.last_error?.message || 'Unknown error'));
    }

    // Get the assistant's response with the structured data
    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      throw new Error('No assistant messages found');
    }

    // Extract JSON from the response
    const latestMessage = assistantMessages[0];
    let jsonStr = '';

    if (latestMessage.content && latestMessage.content.length > 0) {
      const textContent = latestMessage.content.filter(content => content.type === 'text');
      
      if (textContent.length > 0 && 'text' in textContent[0]) {
        const text = textContent[0].text.value;
        
        // Try to extract JSON from the text
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                         text.match(/{[\s\S]*}/) ||
                         text.match(/\[\s*{[\s\S]*}\s*\]/);
                         
        if (jsonMatch) {
          jsonStr = jsonMatch[0].replace(/```json\s*/, '').replace(/\s*```/, '');
        } else {
          jsonStr = text;
        }
      }
    }

    try {
      // Try to parse the JSON
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing JSON:', error, 'JSON string:', jsonStr);
      
      // Return a default structure if parsing fails
      return {
        locationType: "",
        locationDetails: "",
        facilities: "",
        locationRationale: "",
        regulatoryRequirements: "",
        expansionPlans: ""
      };
    }
  } catch (error) {
    console.error('Error extracting location data:', error);
    return null;
  }
}

/**
 * Clean the assistant's response for display
 * @param response - The raw response from the assistant
 * @returns Cleaned response
 */
function cleanResponse(response: string): string {
  // Remove any JSON blocks, code blocks, or system instructions
  return response
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[system\][\s\S]*?\[\/system\]/g, '')
    .trim();
}

/**
 * POST handler for the location and facilities API
 * Processes chat messages and updates the business plan with structured data
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlanId = params.id;
    const { message } = await request.json();

    // Validate if the business plan exists
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId }
    });

    if (!businessPlan) {
      return NextResponse.json({ error: 'Business plan not found' }, { status: 404 });
    }

    // Get or create thread ID
    const threadId = await getOrCreateThreadId(businessPlanId);

    // Process the message with the assistant
    const response = await processWithAssistant(threadId, message);

    // Extract structured data from the conversation
    const locationData = await extractLocationData(threadId);

    // If data was successfully extracted, update the business plan
    if (locationData) {
      // Get existing content or initialize empty object
      const content = (businessPlan.content || {}) as BusinessPlanContent;
      
      // Update with new location data
      const updatedContent = {
        ...content,
        locationFacilities: locationData
      };

      // Save updated content to the business plan
      await prisma.businessPlan.update({
        where: { id: businessPlanId },
        data: { content: updatedContent }
      });
    }

    // Return the cleaned response
    return NextResponse.json({
      message: cleanResponse(response),
      locationFacilities: locationData
    });
  } catch (error) {
    console.error('Error processing location and facilities data:', error);
    return NextResponse.json(
      { error: 'Failed to process location and facilities data' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for the location and facilities API
 * Retrieves existing location and facilities data for a business plan
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlanId = params.id;

    // Validate if the business plan exists
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId }
    });

    if (!businessPlan) {
      return NextResponse.json({ error: 'Business plan not found' }, { status: 404 });
    }

    // Extract location and facilities data from the business plan content
    const content = businessPlan.content as BusinessPlanContent || {};
    const locationFacilities = content.locationFacilities || {
      locationType: "",
      locationDetails: "",
      facilities: "",
      locationRationale: "",
      regulatoryRequirements: "",
      expansionPlans: ""
    };

    return NextResponse.json({ locationFacilities });
  } catch (error) {
    console.error('Error retrieving location and facilities data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve location and facilities data' },
      { status: 500 }
    );
  }
} 