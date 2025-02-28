import { NextResponse } from 'next/server'
import { prismaDb } from '@/lib/db-utils'
import { PrismaClient, Prisma } from '@prisma/client'

/**
 * GET /api/todo-list
 * 
 * Gets all todo lists for the current user (currently using a temporary user)
 */
export async function GET() {
  try {
    // Get the temporary user for now (in a real app, this would be the authenticated user)
    const tempUser = await prismaDb.user.findFirst({
      where: {
        email: 'temp@example.com'
      }
    })

    if (!tempUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all todo lists for this user
    const todoLists = await prismaDb.todoList.findMany({
      where: {
        userId: tempUser.id
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(todoLists)
  } catch (error) {
    console.error('Error fetching todo lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todo lists', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/todo-list
 * 
 * Creates a new todo list
 */
export async function POST(request: Request) {
  try {
    const { title, description, conversationId, items } = await request.json()
    
    if (!title) {
      return NextResponse.json(
        { error: 'Invalid request data', details: 'Title is required' },
        { status: 400 }
      )
    }

    // Get or create temporary user
    let tempUser = await prismaDb.user.findFirst({
      where: {
        email: 'temp@example.com'
      }
    })

    if (!tempUser) {
      try {
        tempUser = await prismaDb.user.create({
          data: {
            email: 'temp@example.com',
            name: 'Temporary User',
            password: 'temp-password', // In production, this should be properly hashed
          }
        })
      } catch (userError) {
        console.error('Error creating temporary user:', userError)
        return NextResponse.json(
          { error: 'Failed to create temporary user', details: userError instanceof Error ? userError.message : String(userError) },
          { status: 500 }
        )
      }
    }
    
    // Create the todo list with any initial items
    const todoList = await prismaDb.todoList.create({
      data: {
        title,
        description,
        userId: tempUser.id,
        conversationId,
        items: items && items.length > 0 ? {
          create: items.map((item: any) => ({
            content: item.content,
            completed: item.completed || false,
            priority: item.priority,
            dueDate: item.dueDate ? new Date(item.dueDate) : null
          }))
        } : undefined
      },
      include: {
        items: true
      }
    })
    
    return NextResponse.json(todoList)
  } catch (error) {
    console.error('Error creating todo list:', error)
    return NextResponse.json(
      { error: 'Failed to create todo list', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 