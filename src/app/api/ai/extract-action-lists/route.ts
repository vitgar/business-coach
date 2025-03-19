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
      You are an AI assistant specialized in analyzing business conversations and extracting structured action lists.
      
      INSTRUCTIONS:
      1. Analyze the provided conversation text to identify action items, tasks, and steps that need to be completed.
      2. Focus on extracting ACTIONABLE items - things that can be completed or checked off.
      3. Organize these items into logical action lists with meaningful titles based on categories or themes.
      4. Identify if any lists are sublists of others (parent-child relationships).
      5. For complex topics, create hierarchical organization with main lists and sublists.
      
      Response format should be JSON with this structure:
      {
        "actionLists": [
          {
            "id": "unique-id-1",
            "title": "Main Action List Title",
            "items": ["Action item 1", "Action item 2", ...],
            "parentId": null
          },
          {
            "id": "unique-id-2",
            "title": "Sublist Title",
            "items": ["Sub-action item 1", "Sub-action item 2", ...],
            "parentId": "unique-id-1"
          }
        ]
      }
      
      Rules:
      - Create meaningful group titles based on the context.
      - Identify parent-child relationships between lists.
      - For top-level lists, omit the parentId property or set it to null.
      - For sublists, include the parentId property with the ID of the parent list.
      - Ensure each action item is clear, specific, and actionable.
      - Convert information into action-oriented tasks that a person can complete.
      - Start with a top-level list for the main topic, then create sublists as needed.
      - Make sure to return a proper JSON object with the "actionLists" key.
      - Always use unique IDs for each list.
      - Keep action items concise but complete - each should be a single task.
    `

    // Call OpenAI to analyze the content
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please analyze the following conversation and extract structured action lists. Focus on creating actionable items that can be completed or checked off:\n\n${content}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Lower temperature for more consistent results
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