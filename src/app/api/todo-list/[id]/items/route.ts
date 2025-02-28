import { NextResponse } from 'next/server'
import { prismaDb } from '@/lib/db-utils'

/**
 * POST /api/todo-list/[id]/items
 * 
 * Adds a new item to a specific todo list
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const todoListId = params.id
    const { content, completed, priority, dueDate, description, categoryTags, checklist } = await request.json()
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }
    
    // Check if the todo list exists
    const todoList = await prismaDb.todoList.findUnique({
      where: { id: todoListId }
    })
    
    if (!todoList) {
      return NextResponse.json(
        { error: 'Todo list not found' },
        { status: 404 }
      )
    }
    
    // Create the todo item
    const todoItem = await prismaDb.todoItem.create({
      data: {
        content,
        completed: completed ?? false,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        description,
        categoryTags,
        checklist,
        todoListId
      }
    })
    
    return NextResponse.json(todoItem)
  } catch (error) {
    console.error('Error creating todo item:', error)
    return NextResponse.json(
      { error: 'Failed to create todo item', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/todo-list/[id]/items
 * 
 * Gets all items for a specific todo list
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const todoListId = params.id
    
    // Check if the todo list exists
    const todoList = await prismaDb.todoList.findUnique({
      where: { id: todoListId }
    })
    
    if (!todoList) {
      return NextResponse.json(
        { error: 'Todo list not found' },
        { status: 404 }
      )
    }
    
    // Get all items for this todo list
    const todoItems = await prismaDb.todoItem.findMany({
      where: { todoListId },
      orderBy: { createdAt: 'asc' }
    })
    
    return NextResponse.json(todoItems)
  } catch (error) {
    console.error('Error fetching todo items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todo items', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 