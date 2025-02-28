import { NextResponse } from 'next/server'
import { prismaDb } from '@/lib/db-utils'

/**
 * GET /api/todo-list/[id]
 * 
 * Gets a specific todo list by ID with its items
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    const todoList = await prismaDb.todoList.findUnique({
      where: { id },
      include: { items: true }
    })
    
    if (!todoList) {
      return NextResponse.json(
        { error: 'Todo list not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(todoList)
  } catch (error) {
    console.error('Error fetching todo list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todo list', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/todo-list/[id]
 * 
 * Updates a todo list (title, description)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const { title, description } = await request.json()
    
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    
    const todoList = await prismaDb.todoList.update({
      where: { id },
      data: updateData,
      include: { items: true }
    })
    
    return NextResponse.json(todoList)
  } catch (error) {
    console.error('Error updating todo list:', error)
    return NextResponse.json(
      { error: 'Failed to update todo list', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/todo-list/[id]
 * 
 * Deletes a todo list and all its items
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    // Delete the todo list (items will be cascade deleted)
    await prismaDb.todoList.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo list:', error)
    return NextResponse.json(
      { error: 'Failed to delete todo list', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 