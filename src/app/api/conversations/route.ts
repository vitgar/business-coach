import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PrismaClient, Prisma } from '@prisma/client'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { DEV_CONFIG } from '@/config/development'

// Get all conversations for the current user
export async function GET() {
  try {
    // Get user from session or use development user in dev mode
    const session = await getServerSession(authOptions)
    const userId = DEV_CONFIG.useDevAuth ? DEV_CONFIG.userId : session?.user?.id
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to view conversations' },
        { status: 401 }
      )
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId },
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
export async function POST(request: NextRequest) {
  try {
    // Get user from session or use development user in dev mode
    const session = await getServerSession(authOptions)
    const userId = DEV_CONFIG.useDevAuth ? DEV_CONFIG.userId : session?.user?.id
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to create a conversation' },
        { status: 401 }
      )
    }

    const { title, messages } = await request.json()
    
    if (!title || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request data', details: 'Title and messages array are required' },
        { status: 400 }
      )
    }
    
    try {
      const conversation = await prisma.conversation.create({
        data: {
          title,
          userId,
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