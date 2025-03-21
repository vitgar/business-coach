import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: params.id
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { messages, threadId } = await request.json()

    // First, delete existing messages
    await prisma.message.deleteMany({
      where: {
        conversationId: params.id
      }
    })

    // Then create new messages and update threadId if provided
    const updateData: any = {
      messages: {
        create: messages.map((msg: any) => ({
          content: msg.content,
          role: msg.role
        }))
      },
      updatedAt: new Date()
    }

    // Add threadId to update data if provided
    if (threadId) {
      updateData.threadId = threadId;
    }

    const conversation = await prisma.conversation.update({
      where: {
        id: params.id
      },
      data: updateData,
      include: {
        messages: true
      }
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
} 