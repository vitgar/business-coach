import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'

/**
 * Interface for representing an action list
 */
interface ActionList {
  id: string;
  title: string;
  items: string[];
  parentId?: string;
}

/**
 * POST /api/ai/extract-action-lists
 * 
 * Analyzes conversation text using AI to extract structured action lists
 * and identify their hierarchical relationships
 * 
 * Request body:
 * - content: string - The conversation text to analyze
 * 
 * Returns:
 * - actionLists: ActionList[] - Array of extracted action lists with hierarchical relationships
 */
export async function POST(request: Request) {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Parse request data
    const data = await request.json()
    const { content } = data
    
    // Validate required data
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Define the prompt for extracting action lists with hierarchy
    const systemPrompt = `
      You are an AI assistant specialized in analyzing business conversations and extracting DETAILED and COMPREHENSIVE structured action lists.
      
      INSTRUCTIONS:
      1. Analyze the provided conversation text to identify action items, tasks, steps, and processes that need to be completed.
      2. Create DETAILED and SPECIFIC action items from the conversation - be granular and thorough, not high-level.
      3. When the conversation contains step-by-step guides, convert each substep and action into individual actionable items.
      4. Organize these items into logical action lists with meaningful titles based on categories, phases or themes.
      5. Identify hierarchical relationships between lists (parent-child). Create main categories and subcategories.
      6. IMPORTANT: Break down high-level steps into specific, actionable subtasks that can be individually checked off.
      7. Extract ALL relevant action items, not just a high-level summary. Be comprehensive.
      8. Each action item should be self-contained and describe a single, concrete task.
      
      Response format should be JSON with this structure:
      {
        "actionLists": [
          {
            "id": "unique-id-1",
            "title": "Main Action List Title",
            "items": ["Specific action item 1", "Specific action item 2", ...],
            "parentId": null
          },
          {
            "id": "unique-id-2",
            "title": "Sublist Title",
            "items": ["Detailed sub-action item 1", "Detailed sub-action item 2", ...],
            "parentId": "unique-id-1"
          }
        ]
      }
      
      Rules and Guidelines:
      - Create meaningful and specific group titles that clearly describe the category of tasks.
      - Identify parent-child relationships between lists to create a hierarchical structure.
      - For top-level lists, omit the parentId property or set it to null.
      - For sublists, include the parentId property with the ID of the parent list.
      - CRITICAL: Make each action item specific, detailed, and actionable - avoid vague or general statements.
      - When there's a detailed process explained, extract EACH STEP as a separate action item.
      - Convert ALL instructions and guidance into concrete, actionable tasks.
      - When a step has sub-steps, create a separate list for those sub-steps with a parent-child relationship.
      - If the conversation includes numeric steps or bullet points, preserve this structure in your action items.
      - Start each action item with a verb to make it action-oriented.
      - Make sure to return a proper JSON object with the "actionLists" key.
      - Always use unique IDs for each list.
      - For complex topics with multiple subtopics, create a separate list for each subtopic.
      - When examples are provided, convert them to relevant actionable items if they imply tasks to be done.
      - When the conversation discusses step 1, step 2, step 3, etc., ensure EACH step and substep appears as a separate action item.
    `

    // Call OpenAI to analyze the content
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please analyze the following conversation and extract DETAILED, SPECIFIC, and COMPREHENSIVE structured action lists. Focus on creating actionable items that can be completed or checked off. Be thorough and include ALL relevant steps mentioned in the conversation, not just high-level summaries:\n\n${content}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Lower temperature for more consistent results
      max_tokens: 4096 // Increase token limit to allow for more detailed response
    })

    // Extract the response content
    const responseContent = completion.choices[0].message.content

    // Parse the JSON response
    let actionLists: ActionList[] = []
    try {
      const parsedResponse = JSON.parse(responseContent || '{"actionLists": []}')
      actionLists = parsedResponse.actionLists || []
      
      // Create a mapping between original IDs and new UUIDs
      const idMapping: Record<string, string> = {};
      
      // First pass: Generate new UUIDs for all lists
      actionLists = actionLists.map(list => {
        const originalId = list.id;
        const newId = uuidv4(); // Generate a proper UUID
        
        // Store the mapping
        idMapping[originalId] = newId;
        
        return {
          ...list,
          id: newId,
          // Don't set parentId yet - we'll update it in the second pass
          parentId: list.parentId || undefined
        };
      });
      
      // Second pass: Update parentId references using the mapping
      actionLists = actionLists.map(list => {
        if (list.parentId && idMapping[list.parentId]) {
          // Replace the original parentId with the new UUID
          return {
            ...list,
            parentId: idMapping[list.parentId]
          };
        }
        return list;
      });
      
      // Post-process to improve quality
      actionLists = actionLists
        // Filter out empty lists or lists with no title
        .filter(list => list.title && list.items && list.items.length > 0)
        // Ensure all items are strings and trim whitespace
        .map(list => ({
          ...list,
          items: list.items
            .filter(item => item && typeof item === 'string')
            .map(item => item.trim())
            .filter(item => item.length > 0)
        }))
        // Remove lists that ended up with empty items after filtering
        .filter(list => list.items.length > 0);
    } catch (error) {
      console.error('Error parsing AI response:', error)
      return NextResponse.json({ 
        error: 'Failed to parse AI response',
        aiResponse: responseContent
      }, { status: 500 })
    }

    // Return the extracted action lists
    return NextResponse.json({ actionLists })
  } catch (error) {
    console.error('Error extracting action lists:', error)
    return NextResponse.json(
      { error: 'Failed to extract action lists' },
      { status: 500 }
    )
  }
} 