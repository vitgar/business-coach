import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'

/**
 * GET /api/action-items/[id]
 * 
 * Retrieves a specific action item by ID.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the action item
    const actionItem = await prisma.actionItem.findUnique({
      where: {
        id: params.id
      },
      include: {
        children: true,
        _count: {
          select: {
            children: true
          }
        }
      }
    })

    if (!actionItem) {
      return NextResponse.json(
        { error: 'Action item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(actionItem)
  } catch (error) {
    console.error('Error fetching action item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch action item', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/action-items/[id]
 * 
 * Updates an action item by ID.
 * Allows updating content, completion status, notes, ordinal, and parent ID.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validate the action item exists
    const existingActionItem = await prisma.actionItem.findUnique({
      where: {
        id: params.id
      }
    })

    if (!existingActionItem) {
      return NextResponse.json(
        { error: 'Action item not found' },
        { status: 404 }
      )
    }

    // Update the action item
    const updatedActionItem = await prisma.actionItem.update({
      where: {
        id: params.id
      },
      data: {
        // Only update fields that are provided
        content: body.content !== undefined ? body.content : undefined,
        isCompleted: body.isCompleted !== undefined ? body.isCompleted : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        ordinal: body.ordinal !== undefined ? body.ordinal : undefined,
        parentId: body.parentId !== undefined ? body.parentId : undefined
      }
    })

    return NextResponse.json(updatedActionItem)
  } catch (error) {
    console.error('Error updating action item:', error)
    return NextResponse.json(
      { error: 'Failed to update action item', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/action-items/[id]
 * 
 * Deletes an action item by ID.
 * Optionally can delete all children as well.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check for query parameter to delete children
    const url = new URL(request.url)
    const deleteChildren = url.searchParams.get('deleteChildren') === 'true'

    // Validate the action item exists
    const existingActionItem = await prisma.actionItem.findUnique({
      where: {
        id: params.id
      },
      include: {
        _count: {
          select: {
            children: true
          }
        }
      }
    })

    if (!existingActionItem) {
      return NextResponse.json(
        { error: 'Action item not found' },
        { status: 404 }
      )
    }

    // If item has children and deleteChildren is false, return error
    if (existingActionItem._count.children > 0 && !deleteChildren) {
      return NextResponse.json(
        { error: 'Cannot delete item with children. Use deleteChildren=true to delete all.' },
        { status: 400 }
      )
    }

    if (deleteChildren && existingActionItem._count.children > 0) {
      // Delete all children recursively
      await deleteActionItemWithChildren(params.id)
    } else {
      // Delete only this item
      await prisma.actionItem.delete({
        where: {
          id: params.id
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting action item:', error)
    return NextResponse.json(
      { error: 'Failed to delete action item', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * Recursively deletes an action item and all its children
 */
async function deleteActionItemWithChildren(id: string) {
  // Find all children
  const children = await prisma.actionItem.findMany({
    where: {
      parentId: id
    },
    select: {
      id: true
    }
  })

  // Recursively delete each child and its children
  for (const child of children) {
    await deleteActionItemWithChildren(child.id)
  }

  // Delete the item itself
  await prisma.actionItem.delete({
    where: {
      id
    }
  })
} 