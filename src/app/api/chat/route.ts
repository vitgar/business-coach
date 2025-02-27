import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ChatMessage } from '@/types/chat'
import { ASSISTANT_CONFIG } from '@/config/constants'
import { sleep } from '@/lib/utils'

/**
 * Initialize OpenAI client with API key from environment variables
 * This is used for AI assistant interactions
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

// Check if OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. Chat functionality will not work.');
}

// Check if assistant IDs are available
if (!process.env.OPENAI_ASSISTANT_ID) {
  console.warn('OPENAI_ASSISTANT_ID is not set. Chat functionality will not work.');
}

if (!process.env.OPENAI_SMART_JOURNAL_ASSISTANT_ID) {
  console.warn('OPENAI_SMART_JOURNAL_ASSISTANT_ID is not set. Smart Journal functionality will not work.');
}

// Store thread IDs for conversations
const threadMap = new Map<string, string>();

/**
 * getOrCreateThread - Gets an existing thread or creates a new one
 * 
 * Purpose:
 * - Manages conversation threads with the OpenAI assistant
 * - Creates a new thread if one doesn't exist for the conversation
 * 
 * @param {string} conversationId - The ID of the conversation
 * @returns {Promise<string>} The thread ID
 */
async function getOrCreateThread(conversationId: string): Promise<string> {
  // If we have a thread ID for this conversation, return it
  if (threadMap.has(conversationId)) {
    return threadMap.get(conversationId)!;
  }
  
  // Create a new thread
  const thread = await openai.beta.threads.create();
  
  // Store the thread ID for future use
  threadMap.set(conversationId, thread.id);
  
  return thread.id;
}

/**
 * processWithAssistant - Processes a conversation with the OpenAI assistant
 * 
 * Purpose:
 * - Sends messages to the OpenAI assistant
 * - Waits for the assistant to respond
 * - Returns the assistant's response
 * 
 * @param {string} threadId - The thread ID to use
 * @param {ChatMessage[]} messages - The messages to process
 * @param {boolean} isJournalMode - Whether to use the Smart Journal assistant
 * @returns {Promise<any>} The assistant's response
 */
async function processWithAssistant(threadId: string, messages: ChatMessage[], isJournalMode: boolean = false) {
  // Get the latest user message
  const latestUserMessage = messages.filter(msg => msg.role === 'user').pop();
  
  if (!latestUserMessage) {
    throw new Error('No user message found');
  }
  
  // Add message to thread
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: latestUserMessage.content
  });

  // Base instructions to avoid showing JSON or code
  const baseInstructions = `${ASSISTANT_CONFIG.INSTRUCTIONS}
  
  REMINDER: The user should NEVER see any JSON, code blocks, or technical formatting in your responses.
  This is critical - your response will be shown directly to the user without any processing.
  If you need to work with structured data, do it internally without showing the technical details.`;

  // Select the appropriate assistant ID based on the mode
  const assistantId = isJournalMode 
    ? process.env.OPENAI_SMART_JOURNAL_ASSISTANT_ID!
    : process.env.OPENAI_ASSISTANT_ID!;

  // Run the assistant
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    instructions: baseInstructions
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
}

/**
 * generateTitle - Creates a concise title from a chat message
 * 
 * Purpose:
 * - Generates a descriptive title for chat conversations
 * - Used for organizing and identifying chat threads
 * 
 * @param {string} message - The chat message to generate title from
 * @param {boolean} isJournalMode - Whether to use the Smart Journal assistant
 * @returns {Promise<string>} Generated title (max 40 chars)
 */
async function generateTitle(message: string, isJournalMode: boolean = false): Promise<string> {
  try {
    // Create a temporary thread for title generation
    const thread = await openai.beta.threads.create();
    
    // Add the title generation prompt
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `Generate a concise, descriptive title (max 40 chars) that captures the main topic from this message: "${message}". Make it clear and specific, avoiding generic phrases.`
    });
    
    // Select the appropriate assistant ID based on the mode
    const assistantId = isJournalMode 
      ? process.env.OPENAI_SMART_JOURNAL_ASSISTANT_ID!
      : process.env.OPENAI_ASSISTANT_ID!;
    
    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      instructions: "Generate a short, descriptive title only. No explanations or additional text."
    });
    
    // Wait for completion
    while (true) {
      const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (runStatus.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const content = messages.data[0].content[0];
        
        if ('text' in content) {
          // Clean up the title - remove quotes and trim
          let title = content.text.value.trim();
          title = title.replace(/^["']|["']$/g, '');
          return title.length > 40 ? title.substring(0, 37) + '...' : title;
        }
        break;
      } else if (runStatus.status === 'failed') {
        throw new Error('Title generation failed');
      }
      await sleep(1000);
    }
    
    // Fallback to using first few words
    const words = message.split(' ').slice(0, 5).join(' ').trim();
    return words.length > 40 ? `${words.slice(0, 37)}...` : words;
  } catch (error) {
    console.error('Error generating title:', error);
    // Create a title from the first few words of the message as fallback
    const words = message.split(' ').slice(0, 5).join(' ').trim();
    return words.length > 40 ? `${words.slice(0, 37)}...` : words;
  }
}

/**
 * POST - Main API endpoint handler for chat interactions
 * 
 * Purpose:
 * - Processes incoming chat messages
 * - Manages conversation flow with the OpenAI assistant
 * - Handles title generation for new conversations
 * 
 * Request body:
 * - messages: Array of ChatMessage objects containing conversation history
 * - isFirstMessage: Boolean flag indicating if this is the start of a new conversation
 * - conversationId: String identifier for the conversation
 * - isJournalMode: Boolean flag indicating if this is a Smart Journal conversation
 * 
 * Flow:
 * 1. Gets or creates OpenAI thread for the conversation
 * 2. Processes chat request
 * 3. Generates title if it's the first message
 * 4. Returns formatted response
 * 
 * @param {Request} request - Incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with chat result or error
 */
export async function POST(request: Request) {
  try {
    const { messages, isFirstMessage, conversationId = Date.now().toString(), isJournalMode = false } = await request.json() as { 
      messages: ChatMessage[]
      isFirstMessage?: boolean
      conversationId?: string
      isJournalMode?: boolean
    }
    
    // Get or create thread for this conversation
    const threadId = await getOrCreateThread(conversationId);
    
    // Process the conversation with the assistant
    const response = await processWithAssistant(threadId, messages, isJournalMode);
    
    // Extract the response content
    const responseContent = response.content[0];
    if (!('text' in responseContent)) {
      throw new Error('Unexpected response format');
    }
    
    // Clean the response content to remove any JSON structures
    let cleanedContent = responseContent.text.value;
    
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
    if (cleanedContent.length < 20 && responseContent.text.value.length > 20) {
      cleanedContent = responseContent.text.value;
    }

    // If this is the first message, generate a title
    let title: string | undefined;
    if (isFirstMessage) {
      title = await generateTitle(messages[messages.length - 1].content, isJournalMode);
    }

    return NextResponse.json({
      id: response.id || Date.now().toString(),
      model: 'gpt-4',
      message: {
        content: cleanedContent,
        role: 'assistant'
      },
      finish_reason: 'stop',
      title,
      threadId
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 