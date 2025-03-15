import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'

/**
 * GET /api/action-items
 * 
 * Retrieves all action items, optionally filtered by conversationId, parentId, or messageId.
 * For a real application, this would include user authentication.
 */
export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const conversationId = url.searchParams.get('conversationId')
    const parentId = url.searchParams.get('parentId')
    const messageId = url.searchParams.get('messageId')
    const rootItemsOnly = url.searchParams.get('rootItemsOnly') === 'true'

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

    // Build where clause based on query parameters
    const whereClause: any = {
      userId: tempUser.id
    }

    if (conversationId) {
      whereClause.conversationId = conversationId
    }

    if (messageId) {
      whereClause.messageId = messageId
    }

    // Handle root items vs. items with specific parent
    if (rootItemsOnly) {
      whereClause.parentId = null
    } else if (parentId) {
      whereClause.parentId = parentId
    }

    // Fetch action items
    const actionItems = await prisma.actionItem.findMany({
      where: whereClause,
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

    return NextResponse.json(actionItems)
  } catch (error) {
    console.error('Error fetching action items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch action items', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/action-items
 * 
 * Creates one or more action items.
 * Accepts either a single action item or an array of action items.
 */
export async function POST(request: Request) {
  // Make a copy of the request for error handling
  const requestClone = request.clone();
  
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

    // Parse request body
    const body = await request.json()
    
    // Check if it's a batch operation (array of items) or single item
    const isBatchOperation = Array.isArray(body)
    
    if (isBatchOperation) {
      // Batch creation
      if (!body.length) {
        return NextResponse.json(
          { error: 'No items provided' },
          { status: 400 }
        )
      }

      // Add user ID to each item and safely handle listId
      const itemsWithUserId = body.map((item, index) => {
        // Create a clean copy of the item without listId if schema doesn't support it yet
        const { listId, ...cleanItem } = item;
        return {
          ...cleanItem,
          userId: tempUser.id,
          ordinal: typeof item.ordinal === 'number' ? item.ordinal : index // Prioritize provided ordinal or use index as fallback
        }
      });

      // Log the ordinals for debugging
      console.log('Creating action items with ordinals:', itemsWithUserId.map(item => item.ordinal));

      // Create all items
      const createdItems = await prisma.actionItem.createMany({
        data: itemsWithUserId
      })

      // Return count of created items
      return NextResponse.json({
        success: true,
        count: createdItems.count
      }, { status: 201 })
    } else {
      // Single item creation
      if (!body.content) {
        return NextResponse.json(
          { error: 'Content is required' },
          { status: 400 }
        )
      }

      // Create a clean copy of the item without listId if schema doesn't support it yet
      const { listId, ...cleanData } = body;
      
      // Ensure ordinal is a number
      const ordinal = typeof body.ordinal === 'number' ? body.ordinal : 0;
      
      console.log('Creating action item with data:', { ...cleanData, ordinal });
      
      // Create a single action item
      const actionItem = await prisma.actionItem.create({
        data: {
          ...cleanData,
          userId: tempUser.id,
          ordinal // Use the validated ordinal value
        }
      })

      return NextResponse.json(actionItem, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating action item(s):', error)
    
    // Check if the error is related to the listId field not existing in the database
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("The column `ActionItem.listId` does not exist")) {
      console.warn("Using ActionItem.listId which is not available in the database schema. Please update your database schema.");
      
      try {
        // Get or create the temporary user again for the retry attempt
        let tempUser = await prisma.user.findFirst({
          where: {
            email: 'temp@example.com'
          }
        });
        
        if (!tempUser) {
          tempUser = await prisma.user.create({
            data: {
              email: 'temp@example.com',
              name: 'Temporary User',
              password: 'temp-password',
            }
          });
        }
        
        // Retry the creation without the listId field
        const body = await requestClone.json();
        
        if (Array.isArray(body)) {
          // Handle batch operation
          const itemsWithoutListId = body.map(item => {
            const { listId, ...rest } = item;
            return {
              ...rest,
              userId: tempUser.id,
              ordinal: item.ordinal ?? 0
            };
          });
          
          const createdItems = await prisma.actionItem.createMany({
            data: itemsWithoutListId
          });
          
          return NextResponse.json({
            success: true,
            count: createdItems.count,
            warning: "listId field was ignored because it's not in the database schema"
          }, { status: 201 });
        } else {
          // Handle single item
          const { listId, ...dataWithoutListId } = body;
          
          const actionItem = await prisma.actionItem.create({
            data: {
              ...dataWithoutListId,
              userId: tempUser.id,
              ordinal: body.ordinal ?? 0
            }
          });
          
          return NextResponse.json({
            ...actionItem,
            warning: "listId field was ignored because it's not in the database schema"
          }, { status: 201 });
        }
      } catch (retryError) {
        console.error('Error in retry attempt:', retryError);
        return NextResponse.json(
          { error: 'Failed to create action item(s) even without listId', details: retryError instanceof Error ? retryError.message : String(retryError) },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create action item(s)', details: errorMessage },
      { status: 500 }
    )
  }
} 