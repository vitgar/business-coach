import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'

/**
 * Custom type for ActionItemList with extra fields
 * This helps with TypeScript typing since we're working with JSON fields
 */
type EnhancedActionItemList = {
  id: string;
  title: string;
  items: any;
  itemNotes?: any;
  userId: string;
  ordinal: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/action-item-lists/[id]
 * 
 * Retrieves a specific action item list by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the action item list
    const actionItemList = await prisma.actionItemList.findUnique({
      where: {
        id: params.id
      }
    })

    if (!actionItemList) {
      return NextResponse.json(
        { error: 'Action item list not found' },
        { status: 404 }
      )
    }

    // Cast to our enhanced type to access metadata stored in itemNotes
    const enhancedList = actionItemList as unknown as EnhancedActionItemList;
    const metadata = enhancedList.itemNotes || {};

    // Transform to expected format
    return NextResponse.json({
      id: enhancedList.id,
      name: enhancedList.title,
      color: metadata.color || 'light-blue',
      topicId: metadata.topicId,
      parentId: metadata.parentId,
      ordinal: enhancedList.ordinal,
      items: enhancedList.items
    })
  } catch (error) {
    console.error('Error fetching action item list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch action item list', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/action-item-lists/[id]
 * 
 * Updates an action item list by ID.
 * Allows updating title, color, and topic ID.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validate the action item list exists
    const existingList = await prisma.actionItemList.findUnique({
      where: {
        id: params.id
      }
    })

    if (!existingList) {
      return NextResponse.json(
        { error: 'Action item list not found' },
        { status: 404 }
      )
    }

    // Cast to our enhanced type
    const enhancedList = existingList as unknown as EnhancedActionItemList;
    // Get existing metadata from itemNotes
    const existingMetadata = enhancedList.itemNotes || {};
    
    // Create update data object
    const updateData: any = {};
    
    // Update title if provided
    if (body.title !== undefined) {
      updateData.title = body.title;
    }
    
    // Update ordinal if provided
    if (typeof body.ordinal === 'number') {
      updateData.ordinal = body.ordinal;
    }
    
    // Update metadata fields
    const newMetadata = {
      ...existingMetadata,
      color: body.color !== undefined ? body.color : existingMetadata.color || 'light-blue',
      topicId: body.topicId !== undefined ? body.topicId : existingMetadata.topicId,
      parentId: body.parentId !== undefined ? body.parentId : existingMetadata.parentId,
    };
    
    // Add metadata to update
    updateData.itemNotes = newMetadata;
    
    // Update the list in the database
    const updatedList = await prisma.actionItemList.update({
      where: {
        id: params.id
      },
      data: updateData
    })

    // Cast to enhanced type
    const enhancedUpdatedList = updatedList as unknown as EnhancedActionItemList;
    const updatedMetadata = enhancedUpdatedList.itemNotes || {};

    // Transform to expected format
    return NextResponse.json({
      id: enhancedUpdatedList.id,
      name: enhancedUpdatedList.title,
      color: updatedMetadata.color || 'light-blue',
      topicId: updatedMetadata.topicId,
      parentId: updatedMetadata.parentId,
      ordinal: enhancedUpdatedList.ordinal
    })
  } catch (error) {
    console.error('Error updating action item list:', error)
    return NextResponse.json(
      { error: 'Failed to update action item list', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/action-item-lists/[id]
 * 
 * Deletes an action item list by ID.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate the action item list exists
    const existingList = await prisma.actionItemList.findUnique({
      where: {
        id: params.id
      }
    })

    if (!existingList) {
      return NextResponse.json(
        { error: 'Action item list not found' },
        { status: 404 }
      )
    }

    // Delete the action item list
    await prisma.actionItemList.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting action item list:', error)
    return NextResponse.json(
      { error: 'Failed to delete action item list', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 