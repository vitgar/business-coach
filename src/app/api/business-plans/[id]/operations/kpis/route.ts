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
    kpis?: string;
    kpisThreadId?: string;
    kpiData?: {
      financialKPIs?: string[];
      operationalKPIs?: string[];
      customerKPIs?: string[];
      employeeKPIs?: string[];
      marketingKPIs?: string[];
      measurementFrequency?: string;
      reportingMethods?: string;
      benchmarks?: string;
      responsibleParties?: string;
      improvementProcess?: string;
    };
  };
}

/**
 * Get or create a thread for KPI discussion
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
  if (content.operations?.kpisThreadId) {
    return content.operations.kpisThreadId;
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
          kpisThreadId: thread.id,
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
      assistant_id: process.env.OPENAI_KPI_ASSISTANT_ID || process.env.OPENAI_ASSISTANT_ID || '',
      instructions: `You are a business planning expert helping the user define Key Performance Indicators (KPIs) for their business. 
      Guide them through identifying relevant KPIs across different areas (financial, operational, customer, employee, marketing).
      Also help them determine measurement frequency, reporting methods, benchmarks, responsible parties, and improvement processes.
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
 * Extract KPI data from the conversation
 * 
 * @param threadId - The thread ID
 * @returns The extracted KPI data and formatted KPIs
 */
async function extractKPIData(threadId: string): Promise<{ kpiData: any; kpis: string }> {
  try {
    // Apply rate limiting
    await rateLimitOpenAI();
    
    // Add a system message to request a summary
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: `Please summarize our discussion about KPIs in a structured JSON format with the following fields:
      - financialKPIs (array of strings): List of financial KPIs discussed
      - operationalKPIs (array of strings): List of operational KPIs discussed
      - customerKPIs (array of strings): List of customer KPIs discussed
      - employeeKPIs (array of strings): List of employee KPIs discussed
      - marketingKPIs (array of strings): List of marketing KPIs discussed
      - measurementFrequency (string): How often KPIs will be measured
      - reportingMethods (string): How KPI data will be reported and reviewed
      - benchmarks (string): Industry benchmarks for comparison
      - responsibleParties (string): Who will be responsible for tracking KPIs
      - improvementProcess (string): How KPI data will be used for improvement
      
      Only include fields that we've actually discussed. Format your response as valid JSON only, with no additional text.`,
    });

    // Create a run with the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_KPI_ASSISTANT_ID || process.env.OPENAI_ASSISTANT_ID || '',
      instructions: `Extract the KPI information from the conversation and format it as a valid JSON object. 
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
          const kpiData = JSON.parse(jsonText);
          
          // Format the KPI data into markdown
          let kpis = '## Key Performance Indicators (KPIs)\n\n';
          
          if (kpiData.financialKPIs && kpiData.financialKPIs.length > 0) {
            kpis += '### Financial KPIs\n';
            kpiData.financialKPIs.forEach((kpi: string) => {
              kpis += `- ${kpi}\n`;
            });
            kpis += '\n';
          }
          
          if (kpiData.operationalKPIs && kpiData.operationalKPIs.length > 0) {
            kpis += '### Operational KPIs\n';
            kpiData.operationalKPIs.forEach((kpi: string) => {
              kpis += `- ${kpi}\n`;
            });
            kpis += '\n';
          }
          
          if (kpiData.customerKPIs && kpiData.customerKPIs.length > 0) {
            kpis += '### Customer KPIs\n';
            kpiData.customerKPIs.forEach((kpi: string) => {
              kpis += `- ${kpi}\n`;
            });
            kpis += '\n';
          }
          
          if (kpiData.employeeKPIs && kpiData.employeeKPIs.length > 0) {
            kpis += '### Employee KPIs\n';
            kpiData.employeeKPIs.forEach((kpi: string) => {
              kpis += `- ${kpi}\n`;
            });
            kpis += '\n';
          }
          
          if (kpiData.marketingKPIs && kpiData.marketingKPIs.length > 0) {
            kpis += '### Marketing KPIs\n';
            kpiData.marketingKPIs.forEach((kpi: string) => {
              kpis += `- ${kpi}\n`;
            });
            kpis += '\n';
          }
          
          if (kpiData.measurementFrequency) {
            kpis += '### Measurement Frequency\n';
            kpis += kpiData.measurementFrequency + '\n\n';
          }
          
          if (kpiData.reportingMethods) {
            kpis += '### Reporting Methods\n';
            kpis += kpiData.reportingMethods + '\n\n';
          }
          
          if (kpiData.benchmarks) {
            kpis += '### Industry Benchmarks\n';
            kpis += kpiData.benchmarks + '\n\n';
          }
          
          if (kpiData.responsibleParties) {
            kpis += '### Responsible Parties\n';
            kpis += kpiData.responsibleParties + '\n\n';
          }
          
          if (kpiData.improvementProcess) {
            kpis += '### Improvement Process\n';
            kpis += kpiData.improvementProcess + '\n\n';
          }
          
          return { kpiData, kpis };
        } catch (error) {
          console.error('Error parsing JSON:', error);
          return { 
            kpiData: {}, 
            kpis: '## Key Performance Indicators (KPIs)\n\nUnable to extract structured KPI data.' 
          };
        }
      }
    }
    
    return { 
      kpiData: {}, 
      kpis: '## Key Performance Indicators (KPIs)\n\nNo KPI data available.' 
    };
  } catch (error) {
    console.error('Error extracting KPI data:', error);
    return { 
      kpiData: {}, 
      kpis: '## Key Performance Indicators (KPIs)\n\nAn error occurred while extracting KPI data.' 
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
 * POST handler for KPI data
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
    
    // Get or create a thread for the KPI discussion
    const threadId = await getOrCreateThread(businessPlanId);
    
    // Wait for any active runs to complete
    await waitForActiveRuns(threadId);
    
    // Process the message with the assistant
    const assistantMessage = await processWithAssistant(threadId, message);
    
    // Extract KPI data if finalizing or not a help request
    let kpiData: any = {};
    let kpis = '';
    
    if (finalizing || !isHelpRequest) {
      const extractedData = await extractKPIData(threadId);
      kpiData = extractedData.kpiData;
      kpis = extractedData.kpis;
      
      // Save the KPI data to the business plan
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
                kpis,
                kpiData,
                kpisThreadId: threadId,
              },
            },
          },
        });
      }
    }
    
    return NextResponse.json({
      response: cleanResponse(assistantMessage),
      kpis,
      kpiData,
    });
  } catch (error) {
    console.error('Error processing KPI message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for KPI data
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
    const threadId = content.operations?.kpisThreadId;
    
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
      kpis: content.operations?.kpis || '',
      kpiData: content.operations?.kpiData || {},
      messages,
    });
  } catch (error) {
    console.error('Error getting KPI data:', error);
    return NextResponse.json(
      { error: 'Failed to get KPI data' },
      { status: 500 }
    );
  }
} 