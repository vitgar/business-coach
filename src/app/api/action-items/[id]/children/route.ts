import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'

/**
 * GET /api/action-items/[id]/children
 * 
 * Retrieves all children of a specific action item.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate parent action item exists
    const parentItem = await prisma.actionItem.findUnique({
      where: {
        id: params.id
      }
    })

    if (!parentItem) {
      return NextResponse.json(
        { error: 'Parent action item not found' },
        { status: 404 }
      )
    }

    // Get all children of the action item
    const children = await prisma.actionItem.findMany({
      where: {
        parentId: params.id
      },
      orderBy: {
        ordinal: 'asc'
      },
      include: {
        _count: {
          select: {
            children: true
          }
        }
      }
    })

    return NextResponse.json(children)
  } catch (error) {
    console.error('Error fetching action item children:', error)
    return NextResponse.json(
      { error: 'Failed to fetch action item children', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 