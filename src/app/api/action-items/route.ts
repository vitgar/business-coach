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
    const limit = parseInt(url.searchParams.get('limit') || '100')
    
    console.log(`GET /api/action-items with params: conversationId=${conversationId}, parentId=${parentId}, messageId=${messageId}, rootItemsOnly=${rootItemsOnly}, listId=${listId}, limit=${limit}`)

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
      console.log(`Filtering by listId: ${listId}`)
      
      // Check if list exists
      if (listId !== 'default') {
        const list = await prisma.actionItemList.findUnique({
          where: { id: listId }
        });
        
        // If list doesn't exist, just return empty array (don't throw error)
        if (!list) {
          console.log(`List with ID ${listId} not found`)
          return NextResponse.json([]);
        }
        
        console.log(`Found list: ${list.title}`)
        
        // Check if we should include items from child lists
        const showChildren = url.searchParams.get('showChildren') === 'true'
        
        if (showChildren) {
          // Find child lists by checking parentId in itemNotes field
          const childLists = await prisma.actionItemList.findMany({
            where: {
              userId: tempUser.id,
              // Check parent ID in the JSON field itemNotes
              itemNotes: {
                path: ['parentId'],
                equals: listId
              }
            }
          });
          
          if (childLists.length > 0) {
            // Include items from all child lists as well as the parent list
            const childListIds = childLists.map(child => child.id);
            console.log(`Including items from ${childLists.length} child lists: ${childListIds.join(', ')}`)
            
            whereClause.listId = {
              in: [listId, ...childListIds]
            };
          } else {
            // Only include items from this specific list if no children found
            whereClause.listId = listId;
          }
        } else {
          // Only include items from this specific list
          whereClause.listId = listId;
        }
      } else {
        whereClause.listId = listId;
      }
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
      },
      take: limit
    })
    
    console.log(`Found ${actionItems.length} action items matching the criteria`)
    
    if (actionItems.length > 0) {
      console.log(`Sample item: ${JSON.stringify(actionItems[0])}`)
    }

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
      const { listId: providedListId, businessId, ...cleanData } = body;
      
      // Ensure ordinal is a number
      const ordinal = typeof body.ordinal === 'number' ? body.ordinal : 0;
      
      // Check if the content has a list prefix like [List Name]
      let listId = providedListId;
      const bracketMatch = body.content.match(/^\s*[\[\{](.*?)[\]\}]/);
      
      if (bracketMatch && bracketMatch[1]) {
        const listTitle = bracketMatch[1].trim();
        
        if (listTitle) {
          // Look for existing list with matching name
          const existingList = await prisma.actionItemList.findFirst({
            where: {
              title: listTitle,
              userId: tempUser.id
            }
          });
          
          if (existingList) {
            // Use the existing list's ID
            console.log(`Found existing list "${listTitle}" with ID ${existingList.id}`);
            listId = existingList.id;
          } else {
            // Create a new list with a proper UUID for this title
            const newList = await prisma.actionItemList.create({
              data: {
                title: listTitle,
                items: [], // Initialize with empty items array
                userId: tempUser.id,
                // Store metadata in the itemNotes field
                itemNotes: {
                  color: 'light-blue', // Default color
                }
              }
            });
            
            console.log(`Created new list "${listTitle}" with ID ${newList.id}`);
            listId = newList.id;
          }
        }
      }
      
      console.log('Creating action item with data:', { 
        ...cleanData, 
        ordinal,
        listId: listId || null 
      });
      
      // Create a single action item
      const actionItem = await prisma.actionItem.create({
        data: {
          ...cleanData,
          userId: tempUser.id,
          ordinal, // Use the validated ordinal value
          // Include the listId in the data if it exists now
          listId: listId || null,
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
            count: createdItems.count
          }, { status: 201 });
        } else {
          // Handle single item creation
          const createdItem = await prisma.actionItem.create({
            data: {
              content: body.content,
              userId: tempUser.id,
              ordinal: body.ordinal ?? 0,
              isCompleted: body.isCompleted ?? false,
              notes: body.notes ?? null,
              parentId: body.parentId ?? null,
              conversationId: body.conversationId ?? null,
              messageId: null // Always set to null to avoid foreign key constraint errors
            }
          });
          
          return NextResponse.json(createdItem, { status: 201 });
        }
      } catch (retryError) {
        console.error('Error in retry attempt:', retryError);
        return NextResponse.json(
          { error: 'Failed to create action item(s) after retry', details: String(retryError) },
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