import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import type { ChatCompletionMessageParam } from 'openai/resources/chat'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

/**
 * Structure for actionable items
 */
interface ActionItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTimeInMinutes?: number;
}

/**
 * POST /api/business-coach/extract-actionable
 * Extract structured actionable items from chat content
 */
export async function POST(request: NextRequest) {
  try {
    const { content, title, userId } = await request.json() as {
      content: string;
      title?: string;
      userId: string;
    };

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Define messages for OpenAI
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a business productivity assistant. Extract actionable items from the following business advice 
        or content. Create a structured list of specific, actionable tasks. For each action item:
        1. Create a clear, concise title
        2. Add a more detailed description if needed
        3. Assign a priority (high, medium, low)
        4. Estimate time to complete in minutes (if possible)

        Format each action item as a clear, specific task that can be completed.`
      },
      {
        role: 'user',
        content: content
      }
    ];

    // Call OpenAI with JSON response format
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    // Parse the JSON response
    const responseContent = response.choices[0].message.content || '{}';
    let actionItems: ActionItem[] = [];
    
    try {
      const parsedResponse = JSON.parse(responseContent);
      
      // Check if the response has the expected structure
      if (Array.isArray(parsedResponse.actionItems)) {
        actionItems = parsedResponse.actionItems;
      } else if (parsedResponse.items && Array.isArray(parsedResponse.items)) {
        actionItems = parsedResponse.items;
      } else if (parsedResponse.tasks && Array.isArray(parsedResponse.tasks)) {
        actionItems = parsedResponse.tasks;
      } else {
        // Try to extract from any array property in the response
        const arrayProps = Object.keys(parsedResponse).filter(key => 
          Array.isArray(parsedResponse[key]) && 
          parsedResponse[key].length > 0 &&
          typeof parsedResponse[key][0] === 'object'
        );
        
        if (arrayProps.length > 0) {
          actionItems = parsedResponse[arrayProps[0]];
        }
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return NextResponse.json(
        { error: 'Failed to parse action items' }, 
        { status: 500 }
      );
    }

    // Create action list in database
    const actionList = await prisma.actionItemList.create({
      data: {
        title: title || 'Action Items',
        userId: userId,
        items: actionItems as any, // Store as JSON
        createdAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      actionList: {
        id: actionList.id,
        title: actionList.title,
        items: actionItems,
        createdAt: actionList.createdAt
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to extract actionable items', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 