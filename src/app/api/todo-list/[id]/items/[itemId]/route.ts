import { NextResponse } from 'next/server'
import { prismaDb } from '@/lib/db-utils'

/**
 * GET /api/todo-list/[id]/items/[itemId]
 * 
 * Gets a specific todo item
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { id: todoListId, itemId } = params
    
    const todoItem = await prismaDb.todoItem.findUnique({
      where: { 
        id: itemId,
        todoListId
      }
    })
    
    if (!todoItem) {
      return NextResponse.json(
        { error: 'Todo item not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(todoItem)
  } catch (error) {
    console.error('Error fetching todo item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todo item', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/todo-list/[id]/items/[itemId]
 * 
 * Updates a specific todo item
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { id: todoListId, itemId } = params
    const updateData = await request.json()
    
    // Handle date conversion if needed
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate)
    }
    
    const todoItem = await prismaDb.todoItem.update({
      where: { 
        id: itemId
      },
      data: updateData
    })
    
    return NextResponse.json(todoItem)
  } catch (error) {
    console.error('Error updating todo item:', error)
    return NextResponse.json(
      { error: 'Failed to update todo item', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/todo-list/[id]/items/[itemId]
 * 
 * Deletes a specific todo item
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { id: todoListId, itemId } = params
    
    // Delete the todo item
    await prismaDb.todoItem.delete({
      where: { 
        id: itemId
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo item:', error)
    return NextResponse.json(
      { error: 'Failed to delete todo item', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 