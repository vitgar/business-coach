import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/notes/[id]
 * 
 * Retrieves a specific note by ID
 * 
 * Returns:
 * - Note object if found
 * - 404 error if not found
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // In a production app, we would verify the user has permission
    // to access this specific note
    
    // Find the note
    const note = await prisma.businessNote.findUnique({
      where: {
        id: params.id
      }
    })
    
    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(note)
  } catch (error) {
    console.error('Error fetching note:', error)
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notes/[id]
 * 
 * Deletes a specific note by ID
 * 
 * Returns:
 * - success: boolean - Indicates if the deletion was successful
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // In a production app, we would verify the user has permission
    // to delete this specific note
    
    // Check if the note exists
    const note = await prisma.businessNote.findUnique({
      where: {
        id: params.id
      }
    })
    
    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }
    
    // Delete the note
    await prisma.businessNote.delete({
      where: {
        id: params.id
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    )
  }
} 