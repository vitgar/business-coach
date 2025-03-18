import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'

/**
 * POST /api/notes
 * 
 * Creates a new note/highlight entry
 * 
 * Request body:
 * - content: string - The content to save as a note
 * - title: string - Title for the note
 * - businessId: string (optional) - ID of the business
 * - conversationId: string (optional) - ID of the conversation
 * - type: string (optional) - Type of note (e.g., 'highlights', 'summary')
 * 
 * Returns:
 * - id: string - ID of the created note
 * - title: string - Title of the note
 * - createdAt: string - Creation timestamp
 */
export async function POST(request: Request) {
  try {
    // In a production app, we would get the user from the session
    // For demo purposes, we'll use a temporary user ID
    let tempUser = await prisma.user.findFirst({
      where: {
        email: 'temp@example.com'
      }
    })

    if (!tempUser) {
      tempUser = await prisma.user.create({
        data: {
          email: 'temp@example.com',
          name: 'Temporary User',
          password: 'temp-password', // In production, this should be properly hashed
        }
      })
    }
    
    // Parse request body
    const body = await request.json()
    const { content, title, businessId, conversationId, type = 'note' } = body
    
    // Validate required fields
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    
    // Create the note - using businessNote model from schema
    const note = await prisma.businessNote.create({
      data: {
        title,
        content,
        category: type, // Use category field for type
        userId: tempUser.id,
        // Note: businessId and conversationId aren't in the schema for BusinessNote
        // so we won't save them
      }
    })
    
    return NextResponse.json({
      id: note.id,
      title: note.title,
      createdAt: note.createdAt
    })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notes
 * 
 * Retrieves all notes for the current user, optionally filtered
 * 
 * Query parameters:
 * - businessId: string (optional) - Filter by business ID
 * - type: string (optional) - Filter by note type
 */
export async function GET(request: Request) {
  try {
    // In a production app, we would get the user from the session
    // For demo purposes, we'll use a temporary user ID
    let tempUser = await prisma.user.findFirst({
      where: {
        email: 'temp@example.com'
      }
    })

    if (!tempUser) {
      return NextResponse.json([]) // No user means no notes
    }
    
    // Get query parameters
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    
    // Build where clause based on query parameters
    const whereClause: any = {
      userId: tempUser.id
    }
    
    // Use category field for type filtering
    if (type) {
      whereClause.category = type
    }
    
    // Fetch notes - using businessNote model from schema
    const notes = await prisma.businessNote.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
} 