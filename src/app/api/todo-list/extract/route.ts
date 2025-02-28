import { NextResponse } from 'next/server'
import { prismaDb } from '@/lib/db-utils'
import OpenAI from 'openai'
import { rateLimitOpenAI } from '@/lib/rate-limit'
import { sleep } from '@/lib/utils'

/**
 * OpenAI client for task extraction
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

/**
 * Check if required API keys are available
 */
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. Task extraction functionality will not work.');
}

if (!process.env.OPENAI_BUSINESS_TODO_LIST_CREATOR_ID) {
  console.warn('OPENAI_BUSINESS_TODO_LIST_CREATOR_ID is not set. Todo list extraction functionality will not work.');
}

/**
 * Todo item schema definition
 * This defines the structure of each todo item
 */
interface TodoItem {
  task_title: string;
  priority_level: 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'In Progress' | 'Completed';
  category_tags: string[];
  description_notes: string;
  checklist: string[];
}

/**
 * Todo list schema definition
 * This defines the structure of the todo list
 */
interface TodoListSchema {
  title: string;
  items: TodoItem[];
}

/**
 * System prompt for todo extraction
 * This is used as instructions for the assistant
 */
const TODO_LIST_INSTRUCTIONS = `
You are a specialized assistant that extracts actionable tasks from business conversations.
Analyze the conversation and identify specific tasks, action items, or to-dos mentioned.

Your response must be in JSON format with the following structure:
{
  "title": "A descriptive title for this todo list based on the conversation context",
  "items": [
    {
      "task_title": "A short and clear description of the task",
      "priority_level": "High|Medium|Low",
      "status": "Not Started|In Progress|Completed",
      "category_tags": ["tag1", "tag2", ...],
      "description_notes": "Additional details about the task",
      "checklist": ["Step 1", "Step 2", ...]
    },
    ...
  ]
}

For each task you identify:
1. Extract a clear task_title that summarizes the task
2. Determine a priority_level (High, Medium, Low) based on context and urgency
3. Set the status to "Not Started" for new tasks unless explicitly mentioned otherwise
4. Identify appropriate category_tags based on the task type (e.g., "Marketing", "Finance", "Operations")
5. Include any additional details in description_notes
6. Break down the task into smaller steps in the checklist array when possible

If there are no clear tasks in the conversation, return an empty items array.
`;

/**
 * Processes a conversation with the OpenAI assistant specialized for todo list creation
 * 
 * @param {string} conversationContent - The conversation content to analyze
 * @returns {Promise<TodoListSchema>} The assistant's response in JSON format
 */
async function processWithTodoAssistant(conversationContent: string): Promise<TodoListSchema> {
  // Create a temporary thread for this extraction
  const thread = await openai.beta.threads.create();
  
  // Add the conversation content as a message
  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: `Please create a todo list from the following conversation:\n\n${conversationContent}\n\nI need a clear, structured todo list with priorities, categories, and checklists.`
  });

  // Run the assistant with the todo list creator ID
  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: process.env.OPENAI_BUSINESS_TODO_LIST_CREATOR_ID!,
    instructions: TODO_LIST_INSTRUCTIONS
  });

  // Wait for completion
  while (true) {
    const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(thread.id);
      const responseMessage = messages.data[0];
      
      // Extract the content
      if (responseMessage.role === 'assistant' && responseMessage.content.length > 0) {
        const content = responseMessage.content[0];
        if ('text' in content) {
          // Try to extract JSON from the response
          const jsonMatch = content.text.value.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as TodoListSchema;
          }
          
          // If no JSON found, return an error
          throw new Error('No valid JSON found in assistant response');
        }
      }
      
      throw new Error('Unexpected response format from assistant');
    } else if (runStatus.status === 'failed') {
      throw new Error('Assistant run failed');
    }
    
    await sleep(1000);
  }
}

/**
 * Maps the TodoItem schema to the database schema
 * @param item - The TodoItem from the assistant
 * @returns The database-compatible todo item
 */
function mapTodoItemToDbSchema(item: TodoItem) {
  return {
    content: item.task_title,
    completed: item.status === 'Completed',
    priority: item.priority_level.toLowerCase(),
    dueDate: null, // We don't have due dates in the new schema
    description: item.description_notes,
    categoryTags: item.category_tags.join(','),
    checklist: item.checklist.join('|')
  };
}

/**
 * POST /api/todo-list/extract
 * 
 * Extracts todo items from conversation content using AI
 */
export async function POST(request: Request) {
  try {
    const { conversationId, conversationContent } = await request.json();
    
    if (!conversationContent) {
      return NextResponse.json(
        { error: 'Missing conversation content' },
        { status: 400 }
      );
    }
    
    // Apply rate limiting
    await rateLimitOpenAI();
    
    // Extract tasks using the specialized todo list assistant
    const extractedData = await processWithTodoAssistant(conversationContent);
    
    // Get or create temporary user
    let tempUser = await prismaDb.user.findFirst({
      where: {
        email: 'temp@example.com'
      }
    });

    if (!tempUser) {
      tempUser = await prismaDb.user.create({
        data: {
          email: 'temp@example.com',
          name: 'Temporary User',
          password: 'temp-password',
        }
      });
    }
    
    // Map the extracted items to the database schema
    const processedItems = extractedData.items.map(mapTodoItemToDbSchema);
    
    // Create a new TodoList with the extracted items
    const todoList = await prismaDb.todoList.create({
      data: {
        title: extractedData.title || 'Extracted Tasks',
        description: 'Automatically extracted from conversation',
        userId: tempUser.id,
        conversationId,
        items: {
          create: processedItems.map(item => ({
            content: item.content,
            completed: item.completed,
            priority: item.priority,
            dueDate: item.dueDate,
            description: item.description,
            categoryTags: item.categoryTags,
            checklist: item.checklist
          }))
        }
      },
      include: {
        items: true
      }
    });
    
    return NextResponse.json(todoList);
  } catch (error) {
    console.error('Error extracting tasks:', error);
    return NextResponse.json(
      { error: 'Failed to extract tasks', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 