import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

/**
 * Business Description API Endpoint
 * 
 * This endpoint handles updates to the business description section of a business plan.
 * The business description data is stored in the content JSON field of the BusinessPlan model.
 * Supports both PUT and POST methods for compatibility with different component implementations.
 */

interface BusinessDescriptionUpdate {
  businessDescription?: Record<string, string>;
  [key: string]: any;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use the same assistant ID as the marketing plan
const BUSINESS_DESCRIPTION_ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || 
                                         process.env.OPENAI_BUSINESS_DESCRIPTION_ASSISTANT_ID || 
                                         'missing_assistant_id';

// Log a warning if we're using the fallback value
if (BUSINESS_DESCRIPTION_ASSISTANT_ID === 'missing_assistant_id') {
  console.error('WARNING: No assistant ID found in environment variables. Please set OPENAI_ASSISTANT_ID or OPENAI_BUSINESS_DESCRIPTION_ASSISTANT_ID.');
}

/**
 * Get or create a thread for the business description conversation
 * 
 * @param businessPlanId - The ID of the business plan
 * @param sectionId - The section ID within business description
 * @returns The thread ID
 */
async function getOrCreateThread(businessPlanId: string, sectionId: string): Promise<string> {
  try {
    // Check if the business plan exists and has a thread ID for this section
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId },
      select: { content: true }
    });

    if (!businessPlan) {
      throw new Error('Business plan not found');
    }

    const content = businessPlan.content as Record<string, any> || {};
    
    // Check if we already have a thread ID for this section
    if (content.threads && content.threads[`businessDescription_${sectionId}`]) {
      return content.threads[`businessDescription_${sectionId}`];
    }
    
    // Create a new thread
    const thread = await openai.beta.threads.create();
    
    // Initialize threads object if it doesn't exist
    if (!content.threads) {
      content.threads = {};
    }
    
    // Save the thread ID
    content.threads[`businessDescription_${sectionId}`] = thread.id;
    
    // Update the business plan with the new thread ID
    await prisma.businessPlan.update({
      where: { id: businessPlanId },
      data: { content }
    });
    
    return thread.id;
  } catch (error) {
    console.error('Error getting or creating thread:', error);
    throw error;
  }
}

/**
 * Process a message with the OpenAI assistant
 * 
 * @param threadId - The thread ID
 * @param message - The user message
 * @param isHelp - Whether this is a help request
 * @returns The assistant's response
 */
async function processWithAssistant(threadId: string, message: string, isHelp: boolean = false): Promise<string> {
  try {
    // Add the user message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    });
    
    // Check if we have a valid assistant ID
    if (BUSINESS_DESCRIPTION_ASSISTANT_ID === 'missing_assistant_id') {
      console.error('Cannot process message: No valid assistant ID configured');
      return isHelp
        ? "I'd be happy to help you with your business description. Could you provide more details about what specific aspect you need help with? For example, are you looking for help with your business model, structure, or something else?"
        : "I've recorded your information. To get more detailed responses, please ask your administrator to configure the OpenAI assistant ID.";
    }
    
    // Create a run with the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: BUSINESS_DESCRIPTION_ASSISTANT_ID,
      instructions: isHelp 
        ? "The user needs help with their business description. Provide 2-3 specific examples and guide them through the process."
        : "Help the user define their business description. Be conversational and helpful."
    });
    
    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    
    // Poll for completion
    while (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }
    
    if (runStatus.status === 'failed') {
      throw new Error(`Run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
    }
    
    // Get the assistant's messages
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Find the most recent assistant message
    const assistantMessages = messages.data.filter(m => m.role === 'assistant');
    if (assistantMessages.length === 0) {
      throw new Error('No assistant message found');
    }
    
    const latestMessage = assistantMessages[0];
    
    // Extract the text content
    let messageContent = '';
    if (latestMessage.content && latestMessage.content.length > 0) {
      const textContent = latestMessage.content.find(c => c.type === 'text');
      if (textContent && 'text' in textContent) {
        messageContent = textContent.text.value;
      }
    }
    
    return messageContent;
  } catch (error) {
    console.error('Error processing message with assistant:', error);
    
    // Provide a helpful fallback response
    return isHelp
      ? "I'd be happy to help you with your business description. Could you provide more details about what specific aspect you need help with? For example, are you looking for help with your business model, structure, or something else?"
      : "Thank you for sharing that information. I've saved it to your business plan. Is there anything specific you'd like to know or discuss about your business description?";
  }
}

/**
 * Extract business description data from the conversation
 * 
 * @param threadId - The thread ID
 * @param sectionId - The section ID
 * @returns The extracted business description data
 */
async function extractBusinessDescriptionData(threadId: string, sectionId: string): Promise<string> {
  try {
    // Check if we have a valid assistant ID
    if (BUSINESS_DESCRIPTION_ASSISTANT_ID === 'missing_assistant_id') {
      console.error('Cannot extract data: No valid assistant ID configured');
      return `Information about ${sectionId.replace(/-/g, ' ')}`;
    }
    
    // Create a run to extract the business description data
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: BUSINESS_DESCRIPTION_ASSISTANT_ID,
      instructions: `Extract the user's business description for the ${sectionId} section. Summarize the key points they've shared about their ${sectionId.replace(/-/g, ' ')} in a clear, concise format.`
    });
    
    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    
    // Poll for completion
    while (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }
    
    if (runStatus.status === 'failed') {
      throw new Error(`Run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
    }
    
    // Get the assistant's messages
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // Find the most recent assistant message
    const assistantMessages = messages.data.filter(m => m.role === 'assistant');
    if (assistantMessages.length === 0) {
      throw new Error('No assistant message found');
    }
    
    const latestMessage = assistantMessages[0];
    
    // Extract the text content
    let messageContent = '';
    if (latestMessage.content && latestMessage.content.length > 0) {
      const textContent = latestMessage.content.find(c => c.type === 'text');
      if (textContent && 'text' in textContent) {
        messageContent = textContent.text.value;
      }
    }
    
    return messageContent;
  } catch (error) {
    console.error('Error extracting business description data:', error);
    // Return the user's message as a fallback
    return `Information about ${sectionId.replace(/-/g, ' ')}`;
  }
}

/**
 * Helper function to sanitize business description data by removing invalid keys
 * 
 * @param businessDescription - The business description object to sanitize
 * @returns A cleaned business description object
 */
function sanitizeBusinessDescription(businessDescription: Record<string, any> = {}): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  // Copy only valid keys (skip undefined, null, empty strings as keys)
  Object.keys(businessDescription).forEach(key => {
    if (key && key !== 'undefined' && key !== 'null') {
      sanitized[key] = businessDescription[key];
    } else {
      console.warn(`Skipping invalid key "${key}" in business description`);
    }
  });
  
  return sanitized;
}

/**
 * POST - Add or update business description data (for compatibility with GenericQuestionnaire)
 * Uses the same implementation as PUT
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Parse the request body
    const body = await request.json();
    let updates: BusinessDescriptionUpdate = {};
    let sectionId = '';
    let userMessage = '';
    let isHelp = body.isHelp || false;
    
    console.log('POST Request body:', body);
    
    // Handle different request formats
    if (body.messages && Array.isArray(body.messages)) {
      // GenericQuestionnaire format - extract the relevant data
      const userMessages = body.messages.filter((m: { role: string; content: string }) => m.role === 'user');
      if (userMessages.length > 0) {
        const lastUserMessage = userMessages[userMessages.length - 1].content;
        userMessage = lastUserMessage;
        
        // Get the section ID from the request - this is provided by GenericQuestionnaire
        sectionId = body.sectionId;
        
        // Validate sectionId
        if (!sectionId || sectionId === 'undefined' || sectionId === 'null') {
          console.error('Invalid or missing sectionId:', sectionId);
          return NextResponse.json(
            { error: 'Valid sectionId is required' },
            { status: 400 }
          );
        }
        
        console.log('Processing section:', sectionId);
        
        // Create the update structure - only update the specific section
        updates = {
          businessDescription: {
            [sectionId]: lastUserMessage
          }
        };
        
        // Include the sectionId in the response for GenericQuestionnaire
        // This allows GenericQuestionnaire to update its state correctly
        updates[sectionId] = {
          content: lastUserMessage
        };
        
        // Check if this is a help request from the system message
        isHelp = isHelp || body.messages.some((m: { role: string; content: string }) => 
          m.role === 'system' && m.content && m.content.includes('needs help')
        );
      } else {
        return NextResponse.json(
          { error: 'No user message found' },
          { status: 400 }
        );
      }
    } else if (body.businessDescription) {
      // Original direct format
      updates = {
        businessDescription: sanitizeBusinessDescription(body.businessDescription)
      };
    } else if (body.sectionId && (body.message || body.content)) {
      // Simple message format
      sectionId = body.sectionId;
      userMessage = body.message || body.content;
      
      // Validate sectionId
      if (!sectionId || sectionId === 'undefined' || sectionId === 'null') {
        console.error('Invalid or missing sectionId:', sectionId);
        return NextResponse.json(
          { error: 'Valid sectionId is required' },
          { status: 400 }
        );
      }
      
      const messageContent = body.message || body.content;
      
      updates = {
        businessDescription: {
          [sectionId]: messageContent
        }
      };
      
      // Include the sectionId in the response
      updates[sectionId] = {
        content: messageContent
      };
    } else {
      // Fallback to treating the whole body as updates
      // But ensure we sanitize any businessDescription data
      if (body.businessDescription) {
        body.businessDescription = sanitizeBusinessDescription(body.businessDescription);
      }
      updates = body;
    }
    
    // Validate the business plan exists
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id }
    })

    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }

    // Get current content or initialize if it doesn't exist
    const currentContent = businessPlan.content as Record<string, any> || {}
    console.log('Current content before update:', currentContent);
    
    // Initialize businessDescription object if it doesn't exist
    if (!currentContent.businessDescription) {
      currentContent.businessDescription = {}
    } else {
      // Clean up any existing invalid keys
      currentContent.businessDescription = sanitizeBusinessDescription(currentContent.businessDescription);
    }
    
    // Update the business description object
    if (updates.businessDescription) {
      // Check for valid keys in businessDescription
      const invalidKeys = Object.keys(updates.businessDescription).filter(
        key => !key || key === 'undefined' || key === 'null'
      );
      
      if (invalidKeys.length > 0) {
        console.error('Invalid keys found in businessDescription:', invalidKeys);
        return NextResponse.json(
          { error: 'Invalid section keys in update' },
          { status: 400 }
        );
      }
      
      // Merge the updates with existing data instead of replacing the entire object
      currentContent.businessDescription = {
        ...currentContent.businessDescription,
        ...updates.businessDescription
      };
    }
    
    console.log('Updated content:', currentContent);
    
    // Update the business plan with the new content
    const updatedPlan = await prisma.businessPlan.update({
      where: { id: params.id },
      data: {
        content: currentContent
      }
    });

    // Process the message with the assistant if we have a user message
    let assistantResponse = '';
    if (userMessage && sectionId) {
      try {
        // Get or create a thread for this section
        const threadId = await getOrCreateThread(params.id, sectionId);
        
        // Process the message with the assistant
        assistantResponse = await processWithAssistant(threadId, userMessage, isHelp);
        
        // Only extract business description data if this is not a help request
        if (!isHelp) {
          try {
            // Extract business description data from the conversation
            const extractedData = await extractBusinessDescriptionData(threadId, sectionId);
            
            // Update the business description with the extracted data
            if (extractedData) {
              currentContent.businessDescription[sectionId] = extractedData;
              
              // Update the business plan with the extracted data
              await prisma.businessPlan.update({
                where: { id: params.id },
                data: {
                  content: currentContent
                }
              });
            }
          } catch (extractError) {
            console.error('Error extracting business description data:', extractError);
            // Continue with the response even if extraction fails
          }
        }
      } catch (error) {
        console.error('Error processing message with assistant:', error);
        // Fall back to a generic response if the assistant fails
        assistantResponse = `I've saved your ${sectionId.replace(/-/g, ' ')} information. You can continue providing details or ask me any questions about this section.`;
      }
    }
    
    // Return the business description data in the response
    // For GenericQuestionnaire compatibility, include both formats
    const responseData: Record<string, any> = {
      id: updatedPlan.id,
      businessDescription: currentContent.businessDescription,
      message: {
        role: 'assistant',
        content: assistantResponse || `I've saved your ${sectionId ? sectionId.replace(/-/g, ' ') : 'business description'} information. You can continue providing details or ask me any questions about this section.`
      }
    };
    
    // Add section-specific data if relevant
    if (sectionId) {
      responseData[sectionId] = {
        content: currentContent.businessDescription[sectionId] || ''
      };
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error updating business description:', error)
    return NextResponse.json(
      { error: 'Failed to update business description' },
      { status: 500 }
    )
  }
}

/**
 * PUT handler - Update business description section data
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Parse the request body
    const body = await request.json();
    let updates: BusinessDescriptionUpdate = {};
    let sectionId = '';
    let userMessage = '';
    let isHelp = body.isHelp || false;
    
    console.log('PUT Request body:', body);
    
    // Handle different request formats
    if (body.messages && Array.isArray(body.messages)) {
      // GenericQuestionnaire format - extract the relevant data
      const userMessages = body.messages.filter((m: { role: string; content: string }) => m.role === 'user');
      if (userMessages.length > 0) {
        const lastUserMessage = userMessages[userMessages.length - 1].content;
        userMessage = lastUserMessage;
        
        // Get the section ID from the request
        sectionId = body.sectionId;
        
        // Validate sectionId
        if (!sectionId || sectionId === 'undefined' || sectionId === 'null') {
          console.error('Invalid or missing sectionId:', sectionId);
          return NextResponse.json(
            { error: 'Valid sectionId is required' },
            { status: 400 }
          );
        }
        
        console.log('Processing section:', sectionId);
        
        // Create the update structure
        updates = {
          businessDescription: {
            [sectionId]: lastUserMessage
          }
        };
        
        // Check if this is a help request from the system message
        isHelp = isHelp || body.messages.some((m: { role: string; content: string }) => 
          m.role === 'system' && m.content && m.content.includes('needs help')
        );
      } else {
        return NextResponse.json(
          { error: 'No user message found' },
          { status: 400 }
        );
      }
    } else if (body.businessDescription) {
      // Original direct format
      updates = {
        businessDescription: sanitizeBusinessDescription(body.businessDescription)
      };
    } else if (body.sectionId && (body.message || body.content)) {
      // Simple message format
      sectionId = body.sectionId;
      userMessage = body.message || body.content;
      
      // Validate sectionId
      if (!sectionId || sectionId === 'undefined' || sectionId === 'null') {
        console.error('Invalid or missing sectionId:', sectionId);
        return NextResponse.json(
          { error: 'Valid sectionId is required' },
          { status: 400 }
        );
      }
      
      const messageContent = body.message || body.content;
      
      updates = {
        businessDescription: {
          [sectionId]: messageContent
        }
      };
    } else if (Object.keys(body).length === 1 && body[Object.keys(body)[0]]) {
      // Special case: direct section update via BusinessPlanPage
      // This is in the format { "businessDescription.sectionId": "content" }
      const key = Object.keys(body)[0];
      if (key.startsWith('businessDescription.')) {
        sectionId = key.split('.')[1];
        if (sectionId) {
          updates = {
            businessDescription: {
              [sectionId]: body[key]
            }
          };
        }
      } else {
        // Fallback to treating the whole body as updates
        updates = body;
      }
    } else {
      // Fallback to treating the whole body as updates
      // But ensure we sanitize any businessDescription data
      if (body.businessDescription) {
        body.businessDescription = sanitizeBusinessDescription(body.businessDescription);
      }
      updates = body;
    }
    
    // Validate the business plan exists
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id }
    })

    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }

    // Get current content or initialize if it doesn't exist
    const currentContent = businessPlan.content as Record<string, any> || {}
    console.log('Current content before update:', currentContent);
    
    // Initialize businessDescription object if it doesn't exist
    if (!currentContent.businessDescription) {
      currentContent.businessDescription = {}
    } else {
      // Clean up any existing invalid keys
      currentContent.businessDescription = sanitizeBusinessDescription(currentContent.businessDescription);
    }
    
    // Update the business description object
    if (updates.businessDescription) {
      // Check for valid keys in businessDescription
      const invalidKeys = Object.keys(updates.businessDescription).filter(
        key => !key || key === 'undefined' || key === 'null'
      );
      
      if (invalidKeys.length > 0) {
        console.error('Invalid keys found in businessDescription:', invalidKeys);
        return NextResponse.json(
          { error: 'Invalid section keys in update' },
          { status: 400 }
        );
      }
      
      // Merge the updates with existing data instead of replacing the entire object
      currentContent.businessDescription = {
        ...currentContent.businessDescription,
        ...updates.businessDescription
      };
    }
    
    console.log('Updated content:', currentContent);
    
    // Update the business plan with the new content
    const updatedPlan = await prisma.businessPlan.update({
      where: { id: params.id },
      data: {
        content: currentContent
      }
    });

    // Process the message with the assistant if we have a user message
    let assistantResponse = '';
    if (userMessage && sectionId) {
      try {
        // Get or create a thread for this section
        const threadId = await getOrCreateThread(params.id, sectionId);
        
        // Process the message with the assistant
        assistantResponse = await processWithAssistant(threadId, userMessage, isHelp);
        
        // Only extract business description data if this is not a help request
        if (!isHelp) {
          try {
            // Extract business description data from the conversation
            const extractedData = await extractBusinessDescriptionData(threadId, sectionId);
            
            // Update the business description with the extracted data
            if (extractedData) {
              currentContent.businessDescription[sectionId] = extractedData;
              
              // Update the business plan with the extracted data
              await prisma.businessPlan.update({
                where: { id: params.id },
                data: {
                  content: currentContent
                }
              });
            }
          } catch (extractError) {
            console.error('Error extracting business description data:', extractError);
            // Continue with the response even if extraction fails
          }
        }
      } catch (error) {
        console.error('Error processing message with assistant:', error);
        // Fall back to a generic response if the assistant fails
        assistantResponse = `I've saved your ${sectionId.replace(/-/g, ' ')} information. You can continue providing details or ask me any questions about this section.`;
      }
    }
    
    // Return the business description data in the response
    // For GenericQuestionnaire compatibility, include both formats
    const responseData: Record<string, any> = {
      id: updatedPlan.id,
      businessDescription: currentContent.businessDescription,
      message: {
        role: 'assistant',
        content: assistantResponse || `I've saved your ${sectionId ? sectionId.replace(/-/g, ' ') : 'business description'} information. You can continue providing details or ask me any questions about this section.`
      }
    };
    
    // Add section-specific data if relevant
    if (sectionId) {
      responseData[sectionId] = {
        content: currentContent.businessDescription[sectionId] || ''
      };
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error updating business description:', error)
    return NextResponse.json(
      { error: 'Failed to update business description' },
      { status: 500 }
    )
  }
}

/**
 * GET - Fetch the business description data for a business plan
 */
export async function GET(
  request: Request,
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

    const content = businessPlan.content as Record<string, any> || {}
    
    // Get business description data or initialize if it doesn't exist
    let businessDescription = content.businessDescription || {}
    
    // Clean up any invalid keys before returning
    businessDescription = sanitizeBusinessDescription(businessDescription);
    
    // If we cleaned up the data, update it in the database
    if (JSON.stringify(businessDescription) !== JSON.stringify(content.businessDescription)) {
      console.log('Cleaning up invalid keys in business description data');
      const updatedContent = { ...content, businessDescription };
      await prisma.businessPlan.update({
        where: { id: params.id },
        data: {
          content: updatedContent
        }
      });
    }

    return NextResponse.json({
      id: businessPlan.id,
      businessDescription,
    })
  } catch (error) {
    console.error('Error fetching business description:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business description' },
      { status: 500 }
    )
  }
} 