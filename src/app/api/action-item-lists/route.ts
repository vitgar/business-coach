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
  color?: string;
  topicId?: string;
  parentId?: string;
  items: any;
  itemNotes?: any;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GET /api/action-item-lists
 * 
 * Retrieves all action item lists for the current user.
 * For a real application, this would include user authentication.
 */
export async function GET(request: Request) {
  try {
    // In a production app, we would get the user from the session
    // For demo purposes, we'll use a temporary user ID
    let tempUser = await prisma.user.findFirst({
      where: {
        email: 'temp@example.com'
      }
    })

    if (!tempUser) {
      tempUser = await prisma.user.create({
        data: {
          email: 'temp@example.com',
          name: 'Temporary User',
          password: 'temp-password', // In production, this should be properly hashed
        }
      })
    }

    // Fetch all action item lists for this user
    const actionItemLists = await prisma.actionItemList.findMany({
      where: {
        userId: tempUser.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the results to match the expected format in the frontend
    const transformedLists = actionItemLists.map(list => {
      // Cast to our enhanced type to access the JSON fields
      const enhancedList = list as unknown as EnhancedActionItemList;
      const metadata = enhancedList.itemNotes || {};
      
      // Log the parentId for debugging
      if (metadata.parentId) {
        console.log(`List "${enhancedList.title}" has parentId: ${metadata.parentId}`);
      }
      
      return {
        id: enhancedList.id,
        name: enhancedList.title,
        color: metadata.color || 'light-blue',
        topicId: metadata.topicId,
        parentId: metadata.parentId
      };
    })

    // Add default list if none exists
    if (transformedLists.length === 0) {
      transformedLists.push({
        id: 'default',
        name: 'Default Action Items',
        color: 'light-blue'
      } as any) // Type assertion to match the expected shape
    }

    return NextResponse.json(transformedLists)
  } catch (error) {
    console.error('Error fetching action item lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch action item lists', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/action-item-lists
 * 
 * Creates a new action item list.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // In a production app, we would get the user from the session
    // For demo purposes, we'll use a temporary user ID
    let tempUser = await prisma.user.findFirst({
      where: {
        email: 'temp@example.com'
      }
    })

    if (!tempUser) {
      tempUser = await prisma.user.create({
        data: {
          email: 'temp@example.com',
          name: 'Temporary User',
          password: 'temp-password', // In production, this should be properly hashed
        }
      })
    }

    // Create the metadata object that will be stored as JSON
    const metadata = {
      color: body.color || 'light-blue',
      topicId: body.topicId,
      parentId: body.parentId
    };

    // Create a new action item list
    const actionItemList = await prisma.actionItemList.create({
      data: {
        title: body.title,
        items: [], // Initialize with empty items array
        userId: tempUser.id,
        // Store metadata in the itemNotes field as a workaround
        // In a production app, you would add proper schema migrations
        itemNotes: metadata
      }
    })

    // Cast the result to access our custom fields
    const enhancedList = actionItemList as unknown as EnhancedActionItemList;
    // Metadata is stored in itemNotes
    const storedMetadata = enhancedList.itemNotes || {};

    return NextResponse.json({
      id: enhancedList.id,
      title: enhancedList.title,
      color: storedMetadata.color || 'light-blue',
      topicId: storedMetadata.topicId,
      parentId: storedMetadata.parentId
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating action item list:', error)
    return NextResponse.json(
      { error: 'Failed to create action item list', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 