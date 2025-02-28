import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { rateLimitOpenAI } from '@/lib/rate-limit';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the business plan content interface
interface BusinessPlanContent {
  operations?: {
    technology?: string;
    technologyThreadId?: string;
    technologyData?: {
      softwareSystems?: string[];
      hardwareRequirements?: string[];
      dataManagement?: string;
      cybersecurity?: string;
      techSupport?: string;
      futureUpgrades?: string;
      integrations?: string[];
      trainingNeeds?: string;
      disasterRecovery?: string;
      techBudget?: string;
    };
  };
}

/**
 * Get or create a thread for Technology discussion
 * 
 * @param businessPlanId - The ID of the business plan
 * @returns The thread ID
 */
async function getOrCreateThread(businessPlanId: string): Promise<string> {
  // Get the business plan
  const businessPlan = await prisma.businessPlan.findUnique({
    where: { id: businessPlanId },
    select: { content: true },
  });

  if (!businessPlan) {
    throw new Error('Business plan not found');
  }

  const content = businessPlan.content as BusinessPlanContent;
  
  // Check if thread ID exists
  if (content.operations?.technologyThreadId) {
    return content.operations.technologyThreadId;
  }

  // Create a new thread
  const thread = await openai.beta.threads.create();

  // Save the thread ID to the business plan
  await prisma.businessPlan.update({
    where: { id: businessPlanId },
    data: {
      content: {
        ...(businessPlan.content as object),
        operations: {
          ...(content.operations as object || {}),
          technologyThreadId: thread.id,
        },
      },
    },
  });

  return thread.id;
}

/**
 * Wait for any active runs to complete
 * 
 * @param threadId - The thread ID
 */
async function waitForActiveRuns(threadId: string): Promise<void> {
  // List runs for the thread
  const runs = await openai.beta.threads.runs.list(threadId);
  
  // Check for any active runs
  const activeRun = runs.data.find(run => 
    ['queued', 'in_progress', 'cancelling'].includes(run.status)
  );
  
  if (activeRun) {
    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(
      threadId,
      activeRun.id
    );
    
    while (['queued', 'in_progress', 'cancelling'].includes(runStatus.status)) {
      // Wait for 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(
        threadId,
        activeRun.id
      );
    }
  }
}

/**
 * Process messages with the OpenAI assistant
 * 
 * @param threadId - The thread ID
 * @param message - The user message
 * @returns The assistant's response
 */
async function processWithAssistant(threadId: string, message: string): Promise<string> {
  try {
    // Apply rate limiting
    await rateLimitOpenAI();
    
    // Add the message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message,
    });

    // Create a run with the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_TECHNOLOGY_ASSISTANT_ID || process.env.OPENAI_ASSISTANT_ID || '',
      instructions: `You are a business planning expert helping the user define Technology & Systems for their business. 
      Guide them through identifying relevant technology needs including software systems, hardware requirements, data management, 
      cybersecurity, technical support, future upgrades, system integrations, training needs, disaster recovery, and technology budget.
      Be specific, practical, and tailor your advice to their business type.`,
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    
    while (['queued', 'in_progress'].includes(runStatus.status)) {
      // Wait for 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    // Get the messages from the thread
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Find the latest assistant message
    const assistantMessages = messages.data.filter(
      msg => msg.role === 'assistant'
    );
    
    if (assistantMessages.length > 0) {
      const latestMessage = assistantMessages[0];
      
      if (
        latestMessage.content &&
        latestMessage.content.length > 0 &&
        latestMessage.content[0].type === 'text'
      ) {
        return cleanResponse(latestMessage.content[0].text.value);
      }
    }
    
    return 'I apologize, but I was unable to process your request.';
  } catch (error) {
    console.error('Error processing with assistant:', error);
    return 'An error occurred while processing your message. Please try again.';
  }
}

/**
 * Extract Technology data from the conversation
 * 
 * @param threadId - The thread ID
 * @returns The extracted Technology data and formatted Technology
 */
async function extractTechnologyData(threadId: string): Promise<{ technologyData: any; technology: string }> {
  try {
    // Apply rate limiting
    await rateLimitOpenAI();
    
    // Add a system message to request a summary
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: `Please summarize our discussion about Technology & Systems in a structured JSON format with the following fields:
      - softwareSystems (array of strings): List of software systems discussed
      - hardwareRequirements (array of strings): List of hardware requirements discussed
      - dataManagement (string): Data management and storage solutions
      - cybersecurity (string): Cybersecurity measures and protocols
      - techSupport (string): Technical support and maintenance plans
      - futureUpgrades (string): Future technology upgrades and roadmap
      - integrations (array of strings): System integrations and compatibility
      - trainingNeeds (string): Technology training needs for staff
      - disasterRecovery (string): Disaster recovery and business continuity plans
      - techBudget (string): Technology budget and cost considerations
      
      Only include fields that we've actually discussed. Format your response as valid JSON only, with no additional text.`,
    });

    // Create a run with the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_TECHNOLOGY_ASSISTANT_ID || process.env.OPENAI_ASSISTANT_ID || '',
      instructions: `Extract the Technology & Systems information from the conversation and format it as a valid JSON object. 
      Only include fields that have been discussed. Be accurate and comprehensive.`,
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    
    while (['queued', 'in_progress'].includes(runStatus.status)) {
      // Wait for 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    // Get the messages from the thread
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Find the latest assistant message
    const assistantMessages = messages.data.filter(
      msg => msg.role === 'assistant'
    );
    
    if (assistantMessages.length > 0) {
      const latestMessage = assistantMessages[0];
      
      if (
        latestMessage.content &&
        latestMessage.content.length > 0 &&
        latestMessage.content[0].type === 'text'
      ) {
        const jsonText = cleanResponse(latestMessage.content[0].text.value);
        
        try {
          // Parse the JSON response
          const technologyData = JSON.parse(jsonText);
          
          // Format the Technology data into markdown
          let technology = '## Technology & Systems\n\n';
          
          if (technologyData.softwareSystems && technologyData.softwareSystems.length > 0) {
            technology += '### Software Systems\n';
            technologyData.softwareSystems.forEach((system: string) => {
              technology += `- ${system}\n`;
            });
            technology += '\n';
          }
          
          if (technologyData.hardwareRequirements && technologyData.hardwareRequirements.length > 0) {
            technology += '### Hardware Requirements\n';
            technologyData.hardwareRequirements.forEach((hardware: string) => {
              technology += `- ${hardware}\n`;
            });
            technology += '\n';
          }
          
          if (technologyData.dataManagement) {
            technology += '### Data Management\n';
            technology += technologyData.dataManagement + '\n\n';
          }
          
          if (technologyData.cybersecurity) {
            technology += '### Cybersecurity\n';
            technology += technologyData.cybersecurity + '\n\n';
          }
          
          if (technologyData.techSupport) {
            technology += '### Technical Support\n';
            technology += technologyData.techSupport + '\n\n';
          }
          
          if (technologyData.futureUpgrades) {
            technology += '### Future Technology Upgrades\n';
            technology += technologyData.futureUpgrades + '\n\n';
          }
          
          if (technologyData.integrations && technologyData.integrations.length > 0) {
            technology += '### System Integrations\n';
            technologyData.integrations.forEach((integration: string) => {
              technology += `- ${integration}\n`;
            });
            technology += '\n';
          }
          
          if (technologyData.trainingNeeds) {
            technology += '### Technology Training\n';
            technology += technologyData.trainingNeeds + '\n\n';
          }
          
          if (technologyData.disasterRecovery) {
            technology += '### Disaster Recovery\n';
            technology += technologyData.disasterRecovery + '\n\n';
          }
          
          if (technologyData.techBudget) {
            technology += '### Technology Budget\n';
            technology += technologyData.techBudget + '\n\n';
          }
          
          return { technologyData, technology };
        } catch (error) {
          console.error('Error parsing JSON:', error);
          return { 
            technologyData: {}, 
            technology: '## Technology & Systems\n\nUnable to extract structured Technology data.' 
          };
        }
      }
    }
    
    return { 
      technologyData: {}, 
      technology: '## Technology & Systems\n\nNo Technology data available.' 
    };
  } catch (error) {
    console.error('Error extracting Technology data:', error);
    return { 
      technologyData: {}, 
      technology: '## Technology & Systems\n\nAn error occurred while extracting Technology data.' 
    };
  }
}

/**
 * Clean the response from the assistant
 * 
 * @param response - The response to clean
 * @returns The cleaned response
 */
function cleanResponse(response: string): string {
  // Remove markdown code blocks if present
  return response.replace(/```json\n([\s\S]*?)\n```/g, '$1')
                .replace(/```([\s\S]*?)```/g, '$1')
                .trim();
}

/**
 * POST handler for Technology data
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
    const finalizing = requestData.finalizing || false;
    
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
    
    // Get or create a thread for the Technology discussion
    const threadId = await getOrCreateThread(businessPlanId);
    
    // Wait for any active runs to complete
    await waitForActiveRuns(threadId);
    
    // Process the message with the assistant
    const assistantMessage = await processWithAssistant(threadId, message);
    
    // Extract Technology data if finalizing or not a help request
    let technologyData: any = {};
    let technology = '';
    
    if (finalizing || !isHelpRequest) {
      const extractedData = await extractTechnologyData(threadId);
      technologyData = extractedData.technologyData;
      technology = extractedData.technology;
      
      // Save the Technology data to the business plan
      const businessPlan = await prisma.businessPlan.findUnique({
        where: { id: businessPlanId },
        select: { content: true },
      });
      
      if (businessPlan) {
        const content = businessPlan.content as BusinessPlanContent;
        
        // Initialize operations if it doesn't exist
        if (!content.operations) {
          content.operations = {};
        }
        
        await prisma.businessPlan.update({
          where: { id: businessPlanId },
          data: {
            content: {
              ...(businessPlan.content as object),
              operations: {
                ...content.operations,
                technology,
                technologyData,
                technologyThreadId: threadId,
              },
            },
          },
        });
      }
    }
    
    return NextResponse.json({
      response: cleanResponse(assistantMessage),
      technology,
      technologyData,
    });
  } catch (error) {
    console.error('Error processing technology message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for Technology data
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
    
    // Get the thread ID
    const threadId = content.operations?.technologyThreadId;
    
    // Get messages from the thread if it exists
    let messages: any[] = [];
    
    if (threadId) {
      try {
        // Wait for any active runs to complete
        await waitForActiveRuns(threadId);
        
        // Get messages from the thread
        const threadMessages = await openai.beta.threads.messages.list(threadId);
        
        // Format messages
        messages = threadMessages.data.map(msg => ({
          role: msg.role,
          content: msg.content[0]?.type === 'text' ? msg.content[0].text.value : '',
        }));
        
        // Reverse messages to get chronological order
        messages.reverse();
      } catch (error) {
        console.error('Error getting messages:', error);
      }
    }
    
    return NextResponse.json({
      technology: content.operations?.technology || '',
      technologyData: content.operations?.technologyData || {},
      messages,
    });
  } catch (error) {
    console.error('Error getting Technology data:', error);
    return NextResponse.json(
      { error: 'Failed to get Technology data' },
      { status: 500 }
    );
  }
} 