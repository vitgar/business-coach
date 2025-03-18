import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'

/**
 * GET /api/action-items
 * 
 * Retrieves all action items, optionally filtered by conversationId, parentId, messageId, or listId.
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
    const listId = url.searchParams.get('listId')

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
    
    // Add listId filter if provided
    if (listId) {
      // Check if list exists
      if (listId !== 'default') {
        const list = await prisma.actionItemList.findUnique({
          where: { id: listId }
        });
        
        // If list doesn't exist, just return empty array (don't throw error)
        if (!list) {
          return NextResponse.json([]);
        }
      }
      
      whereClause.listId = listId;
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
        // Create a clean copy of the item without fields not in schema
        const { listId, businessId, ...cleanItem } = item;
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

      // Remove fields that don't exist in the schema
      const { listId, businessId, ...cleanData } = body;
      
      // Ensure ordinal is a number
      const ordinal = typeof body.ordinal === 'number' ? body.ordinal : 0;
      
      console.log('Creating action item with data:', { ...cleanData, ordinal });
      
      // Create a single action item
      const actionItem = await prisma.actionItem.create({
        data: {
          ...cleanData,
          userId: tempUser.id,
          ordinal, // Use the validated ordinal value
          // Include the listId in the data if provided and if the schema supports it
          ...(body.listId ? { listId: body.listId } : {}),
          conversationId: body.conversationId ?? null,
          messageId: null // Always set to null to avoid foreign key constraint errors
        }
      })

      return NextResponse.json(actionItem, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating action item(s):', error)
    
    // Check if the error is related to the listId field not existing in the database
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Handle the case where fields don't exist in the schema
    if (errorMessage.includes("Unknown argument")) {
      console.warn("Schema mismatch detected. Retrying with only supported fields.");
      
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
        
        // Retry the creation with only the minimum required fields
        const body = await requestClone.json();
        
        if (Array.isArray(body)) {
          // Handle batch operation
          const itemsWithMinimalFields = body.map(item => {
            // Keep only fields we know are in the schema
            return {
              content: item.content,
              userId: tempUser.id,
              ordinal: item.ordinal ?? 0,
              isCompleted: item.isCompleted ?? false,
              notes: item.notes ?? null,
              parentId: item.parentId ?? null,
              conversationId: item.conversationId ?? null,
              messageId: item.messageId ?? null
            };
          });
          
          const createdItems = await prisma.actionItem.createMany({
            data: itemsWithMinimalFields
          });
          
          return NextResponse.json({
            success: true,
            count: createdItems.count,
            warning: "Some fields were ignored because they're not in the database schema"
          }, { status: 201 });
        } else {
          // Handle single item with only known schema fields
          const item = {
            content: body.content,
            userId: tempUser.id,
            ordinal: body.ordinal ?? 0,
            isCompleted: body.isCompleted ?? false,
            notes: body.notes ?? null,
            parentId: body.parentId ?? null,
            conversationId: body.conversationId ?? null,
            messageId: null // Always set to null to avoid foreign key constraint errors
          };
          
          const actionItem = await prisma.actionItem.create({
            data: item
          });
          
          return NextResponse.json({
            ...actionItem,
            warning: "Some fields were ignored because they're not in the database schema"
          }, { status: 201 });
        }
      } catch (retryError) {
        console.error('Error in retry attempt:', retryError);
        return NextResponse.json(
          { error: 'Failed to create action item(s) even with schema-compatible fields', details: String(retryError) },
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