import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PrismaClient, Prisma } from '@prisma/client'

// Get all conversations
export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        messages: true
      }
    })
    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// Create a new conversation
export async function POST(request: Request) {
  try {
    const { title, messages, threadId } = await request.json()
    
    if (!title || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request data', details: 'Title and messages array are required' },
        { status: 400 }
      )
    }

    // Get or create temporary user
    let tempUser = await prisma.user.findFirst({
      where: {
        email: 'temp@example.com'
      }
    })

    if (!tempUser) {
      try {
        tempUser = await prisma.user.create({
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
    
    try {
      const conversation = await prisma.conversation.create({
        data: {
          title,
          userId: tempUser.id,
          threadId,
          messages: {
            create: messages.map((msg: { content: string; role: string }) => ({
              content: msg.content,
              role: msg.role
            }))
          }
        },
        include: {
          messages: true
        }
      })
      
      return NextResponse.json(conversation)
    } catch (convError) {
      if (convError instanceof Prisma.PrismaClientKnownRequestError) {
        if (convError.code === 'P2002') {
          return NextResponse.json(
            { error: 'Duplicate conversation', details: 'A conversation with this title already exists' },
            { status: 409 }
          )
        }
      }
      console.error('Error creating conversation:', convError)
      return NextResponse.json(
        { error: 'Failed to create conversation', details: convError instanceof Error ? convError.message : String(convError) },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 