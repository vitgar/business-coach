import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { sleep } from '@/lib/utils'

/**
 * Interface for business plan content including mission statement data
 */
interface BusinessPlanContent {
  missionStatement?: {
    missionStatement: string;
    vision: string;
    coreValues: string[];
    purpose: string;
    threadId?: string;
  };
  [key: string]: any;
}

/**
 * Initialize OpenAI client with API key from environment variables
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

/**
 * Constants
 */
const ASSISTANT_ID = process.env.MISSION_STATEMENT_ASSISTANT_ID || 'asst_mission'

/**
 * Get or create a thread ID for the conversation
 */
async function getOrCreateThreadId(businessPlanId: string): Promise<string> {
  try {
    // Attempt to get existing business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId },
      select: { id: true, content: true }
    });

    if (!businessPlan) {
      throw new Error('Business plan not found');
    }

    // Extract the content as BusinessPlanContent
    const content = businessPlan.content as BusinessPlanContent || {};
    
    // Check if there's already a thread ID for mission statement
    if (content.missionStatement?.threadId) {
      return content.missionStatement.threadId;
    }
    
    // Create a new thread
    const thread = await openai.beta.threads.create();
    
    // Update the business plan with the new thread ID
    await prisma.businessPlan.update({
      where: { id: businessPlanId },
      data: {
        content: {
          ...content,
          missionStatement: {
            ...(content.missionStatement || {}),
            threadId: thread.id
          }
        }
      }
    });
    
    return thread.id;
  } catch (error) {
    console.error('Error in getOrCreateThreadId:', error);
    throw error;
  }
}

/**
 * Check if there's an active run for the thread
 */
async function hasActiveRun(threadId: string): Promise<boolean> {
  try {
    const runs = await openai.beta.threads.runs.list(threadId);
    const activeRuns = runs.data.filter(run => 
      ['queued', 'in_progress', 'requires_action'].includes(run.status)
    );
    return activeRuns.length > 0;
  } catch (error) {
    console.error('Error checking active runs:', error);
    return false;
  }
}

/**
 * Process the message with the assistant
 */
async function processWithAssistant(threadId: string, message: string): Promise<string> {
  try {
    // First check if there's an active run
    const isActive = await hasActiveRun(threadId);
    if (isActive) {
      return "I'm still processing your previous message. Please wait a moment and try again.";
    }

    // Add the user message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    });

    // Create a new run
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID
    });

    // Poll for the run to complete
    let completedRun;
    let attempts = 0;
    const maxAttempts = 30; // Adjust as needed
    const delay = 1000; // 1 second delay between checks

    while (attempts < maxAttempts) {
      const runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      
      if (runStatus.status === 'completed') {
        completedRun = runStatus;
        break;
      } else if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
        throw new Error(`Run failed with status: ${runStatus.status}`);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
    }

    if (!completedRun) {
      throw new Error('Run did not complete in the allowed time');
    }

    // Get the assistant's messages
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Find the most recent assistant message
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      return "I couldn't generate a response. Please try again.";
    }
    
    // Get the most recent message content
    const latestMessage = assistantMessages[0];
    
    // Extract the text content
    const textContent = latestMessage.content
      .filter(content => content.type === 'text')
      .map(content => (content as any).text.value)
      .join('\n\n');
    
    return textContent;
  } catch (error) {
    console.error('Error processing with assistant:', error);
    throw new Error('Failed to process message with assistant');
  }
}

/**
 * Extract mission statement data from the conversation
 */
async function extractMissionData(threadId: string): Promise<BusinessPlanContent['missionStatement']> {
  try {
    // Create a run to analyze the conversation
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
      instructions: `Analyze the conversation so far and extract the following information into a structured format:
        1. Mission Statement: The core purpose of the business in one or two sentences
        2. Vision: The long-term vision for the business
        3. Core Values: A list of principles that guide the business
        4. Purpose: Why the business exists beyond making money

        Format your response as clean JSON with these exact keys: missionStatement, vision, coreValues (as an array), purpose.
        Only include information that has been clearly provided by the user.`
    });

    // Poll for the run to complete
    let completedRun;
    let attempts = 0;
    const maxAttempts = 30;
    const delay = 1000;

    while (attempts < maxAttempts) {
      const runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      
      if (runStatus.status === 'completed') {
        completedRun = runStatus;
        break;
      } else if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
        throw new Error(`Run failed with status: ${runStatus.status}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
    }

    if (!completedRun) {
      throw new Error('Run did not complete in the allowed time');
    }

    // Get the messages
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Find the most recent assistant message
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      throw new Error('No assistant messages found');
    }
    
    // Get the most recent message content
    const latestMessage = assistantMessages[0];
    
    // Extract the text content
    const textContent = latestMessage.content
      .filter(content => content.type === 'text')
      .map(content => (content as any).text.value)
      .join('\n\n');
    
    // Parse the JSON response
    const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/) || 
                      textContent.match(/{[\s\S]*}/);
    
    if (!jsonMatch) {
      // If no JSON is found, try to extract information manually
      return {
        missionStatement: '',
        vision: '',
        coreValues: [],
        purpose: '',
        threadId
      };
    }
    
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    
    try {
      const missionData = JSON.parse(jsonStr);
      return {
        ...missionData,
        threadId
      };
    } catch (e) {
      console.error('Error parsing JSON from assistant response:', e);
      return {
        missionStatement: '',
        vision: '',
        coreValues: [],
        purpose: '',
        threadId
      };
    }
  } catch (error) {
    console.error('Error extracting mission data:', error);
    throw new Error('Failed to extract mission data');
  }
}

/**
 * Clean the response for better readability
 */
function cleanResponse(response: string): string {
  // Remove code blocks, JSON formatting, etc.
  return response
    .replace(/```json\n[\s\S]*?\n```/g, '') // Remove JSON code blocks
    .replace(/```[\s\S]*?```/g, '')         // Remove any other code blocks
    .trim();
}

/**
 * GET - Retrieve mission statement data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlanId = params.id;
    
    // Get the business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId },
      select: { content: true }
    });
    
    if (!businessPlan) {
      return NextResponse.json({ error: 'Business plan not found' }, { status: 404 });
    }
    
    // Extract the content
    const content = businessPlan.content as BusinessPlanContent || {};
    
    // Extract mission statement data from content
    const missionStatementData = content.missionStatement || {
      missionStatement: '',
      vision: '',
      coreValues: [],
      purpose: ''
    };
    
    return NextResponse.json({ missionStatement: missionStatementData });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve mission statement data' },
      { status: 500 }
    );
  }
}

/**
 * POST - Process message and extract mission statement data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlanId = params.id;
    
    // Parse request body
    const body = await request.json();
    let messageContent = '';
    let isHelpRequest = false;
    
    // Handle different request formats
    if (body.message) {
      // Original format with single message
      messageContent = body.message;
    } else if (body.messages && Array.isArray(body.messages)) {
      // New format from GenericQuestionnaire with messages array
      // Extract the most recent user message
      const userMessages = body.messages.filter((m: { role: string; content: string }) => m.role === 'user');
      if (userMessages.length > 0) {
        messageContent = userMessages[userMessages.length - 1].content;
      }
      
      // Check if this is a help request
      isHelpRequest = body.messages.some((m: { role: string; content: string }) => 
        m.role === 'system' && m.content && m.content.includes('needs help')
      ) || body.isHelpRequest === true;
    }
    
    if (!messageContent) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Get or create a thread ID for the conversation
    const threadId = await getOrCreateThreadId(businessPlanId);
    
    // Process the message with the assistant
    const response = await processWithAssistant(threadId, messageContent);
    
    // Extract updated mission data from the conversation
    const updatedMissionData = await extractMissionData(threadId);
    
    // Get the current business plan content
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId },
      select: { content: true }
    });
    
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      );
    }
    
    // Update the business plan with the new mission data
    const content = businessPlan.content as BusinessPlanContent || {};
    
    await prisma.businessPlan.update({
      where: { id: businessPlanId },
      data: {
        content: {
          ...content,
          missionStatement: updatedMissionData
        }
      }
    });
    
    // Clean the response for better readability
    const cleanedResponse = cleanResponse(response);
    
    return NextResponse.json({
      response: cleanedResponse,
      missionStatement: updatedMissionData
    });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
} 