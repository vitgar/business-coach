import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { ASSISTANT_CONFIG } from '@/config/constants'
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

/**
 * Tools definition for OpenAI function calling
 * These define how to identify actionable items and business insights
 */
const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "identify_content_type",
      description: "Analyze the assistant's response to identify if it contains actionable items or business insights that should be saved",
      parameters: {
        type: "object",
        properties: {
          hasActionableItems: {
            type: "boolean",
            description: "Whether the response contains a list of actionable items, steps, tasks, numbered instructions, or bullet points that could be turned into a to-do list. Look for content with clear steps, lists, or instructions that a user might want to save as tasks to complete later."
          },
          hasBusinessInsight: {
            type: "boolean",
            description: "Whether the response contains valuable business insights, advice, or strategies that would be worth saving as a note"
          },
          actionItemsSummary: {
            type: "string",
            description: "If hasActionableItems is true, provide a brief title/summary for these actionable items (max 50 chars)"
          },
          insightSummary: {
            type: "string", 
            description: "If hasBusinessInsight is true, provide a brief title/summary for this insight (max 50 chars)"
          }
        },
        required: ["hasActionableItems", "hasBusinessInsight"]
      }
    }
  }
];

/**
 * Generate a title for a new conversation
 */
async function generateTitle(message: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: 'user',
        content: `Generate a concise, descriptive title (max 40 chars) that captures the main topic from this message: "${message}". Make it clear and specific, avoiding generic phrases.`
      }],
      max_tokens: 60
    });

    // Ensure we have a valid response
    if (response?.choices?.[0]?.message?.content) {
      return response.choices[0].message.content.trim();
    }
    
    // Fallback: Create a title from the first few words of the message
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
 * POST /api/business-coach/chat
 * Handle chat messages and generate responses
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, isFirstMessage } = await request.json() as { 
      messages: Array<{role: string, content: string}>
      isFirstMessage?: boolean 
    }
    
    // Filter out system messages and convert to proper ChatCompletionMessageParam
    const chatMessages: ChatCompletionMessageParam[] = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

    // Add system message at the beginning
    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: ASSISTANT_CONFIG.INSTRUCTIONS
    };
    
    const openaiMessages: ChatCompletionMessageParam[] = [systemMessage, ...chatMessages];
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: ASSISTANT_CONFIG.MODEL,
      messages: openaiMessages,
      tools: tools,
      tool_choice: "auto",
    });

    // Extract the response content
    const responseMessage = response.choices[0].message;
    let assistantContent = responseMessage.content || "";
    
    // Handle function calling response
    let contentAnalysis = null;
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const functionCall = responseMessage.tool_calls[0];
      if (functionCall.function.name === "identify_content_type") {
        try {
          contentAnalysis = JSON.parse(functionCall.function.arguments);
          // Debug logs
          console.log('Content analysis performed:');
          console.log(JSON.stringify(contentAnalysis, null, 2));
        } catch (e) {
          console.error("Error parsing function arguments:", e);
        }
      }
    }
    
    // Fallback: If no content analysis or if it didn't detect actionable items,
    // check for common patterns that suggest actionable content
    if (!contentAnalysis || contentAnalysis.hasActionableItems === false) {
      const content = assistantContent.toLowerCase();
      const hasNumberedList = /\d+\.\s+[^\n]+\n+\s*\d+\.\s+/m.test(assistantContent);
      const hasBulletPoints = /[\*\-]\s+[^\n]+\n+\s*[\*\-]\s+/m.test(assistantContent);
      const hasStepText = /steps?|tasks?|process|action|todo|checklist/i.test(content);
      
      if ((hasNumberedList || hasBulletPoints) && hasStepText) {
        console.log('Fallback: Detected actionable content pattern');
        contentAnalysis = contentAnalysis || {};
        contentAnalysis.hasActionableItems = true;
        contentAnalysis.actionItemsSummary = contentAnalysis.actionItemsSummary || 
          "Action Items";
      }
    }
    
    // Generate title for first message
    let title: string | undefined;
    if (isFirstMessage) {
      title = await generateTitle(messages[messages.length - 1].content);
    }

    // Save conversation and message to database if needed
    // (This part would integrate with your database to persist conversations)

    return NextResponse.json({
      id: response.id || Date.now().toString(),
      model: response.model || ASSISTANT_CONFIG.MODEL,
      message: {
        content: assistantContent,
        role: 'assistant'
      },
      contentAnalysis: contentAnalysis,
      finish_reason: response.choices[0].finish_reason || 'stop',
      title
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 