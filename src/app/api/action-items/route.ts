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
            console.log(`Child list names: ${childLists.map(l => l.title).join(', ')}`)
            
            // Get individual items for debugging
            const parentItems = await prisma.actionItem.findMany({
              where: { listId }
            });
            console.log(`Found ${parentItems.length} items in parent list ${list.title}`);
            
            const childItems = await prisma.actionItem.findMany({
              where: { 
                listId: { in: childListIds }
              }
            });
            console.log(`Found ${childItems.length} total items in child lists`);
            
            whereClause.listId = {
              in: [listId, ...childListIds]
            };
          } else {
            // Only include items from this specific list if no children found
            console.log(`No child lists found for ${list.title}, only showing parent list items`);
            whereClause.listId = listId;
          }
        } else {
          // Only include items from this specific list
          console.log(`showChildren=false, only showing items from list: ${list.title}`);
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
        createdAt: 'desc'
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

      // Group items by listId to assign ordinals correctly within each list
      const itemsByList: { [key: string]: any[] } = {};
      
      // First pass: group items by listId
      body.forEach(item => {
        const listId = item.listId || 'no-list';
        if (!itemsByList[listId]) {
          itemsByList[listId] = [];
        }
        itemsByList[listId].push(item);
      });
      
      // Second pass: prepare all items with appropriate ordinals per list
      const itemsWithUserId: any[] = [];
      
      // Process each list group
      for (const [listId, items] of Object.entries(itemsByList)) {
        // If this is a real list (not our temporary 'no-list' grouping), get the current count
        let startingOrdinal = 0;
        
        if (listId !== 'no-list') {
          try {
            // Count existing items in this list
            const existingItemsCount = await prisma.actionItem.count({
              where: { 
                listId,
                userId: tempUser.id
              }
            });
            startingOrdinal = existingItemsCount;
            console.log(`List ${listId} has ${existingItemsCount} existing items, starting ordinals from ${startingOrdinal}`);
          } catch (error) {
            console.warn(`Error counting items for list ${listId}, using default ordinal 0:`, error);
          }
        }
        
        // Add items with incremented ordinals
        items.forEach((item, index) => {
          const { listId: providedListId, businessId, ...cleanItem } = item;
          
          // Use provided ordinal or calculate based on position in the list
          const ordinal = typeof item.ordinal === 'number' 
            ? item.ordinal 
            : startingOrdinal + index;
          
          itemsWithUserId.push({
            ...cleanItem,
            userId: tempUser.id,
            ordinal,
            listId: providedListId || undefined
          });
        });
      }

      // Log the ordinals for debugging
      console.log('Creating action items with ordinals:', itemsWithUserId.map(item => ({
        content: item.content.substring(0, 20) + '...',
        listId: item.listId || 'none',
        ordinal: item.ordinal
      })));

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
      
      // Default ordinal - will be updated if needed based on list position
      let ordinal = typeof body.ordinal === 'number' ? body.ordinal : 0;
      
      // Log creation attempt for debugging
      console.log(`Attempting to create action item: "${body.content.substring(0, 30)}...", listId: ${providedListId || 'none'}`);

      try {
        // If a listId is provided or will be determined, set the ordinal based on list position
        if (providedListId) {
          // Check if list exists
          const list = await prisma.actionItemList.findUnique({
            where: { id: providedListId }
          });
          
          if (list) {
            console.log(`List found: "${list.title}" (${providedListId}), creating item with this listId`);
            
            // If no explicit ordinal was provided, determine it based on existing items in the list
            if (typeof body.ordinal !== 'number') {
              // Count existing items in this list to determine the next ordinal value
              const existingItemsCount = await prisma.actionItem.count({
                where: { 
                  listId: providedListId,
                  userId: tempUser.id
                }
              });
              
              // Set ordinal to be the next position in the list
              ordinal = existingItemsCount;
              console.log(`Auto-assigning ordinal ${ordinal} based on list position (${existingItemsCount} existing items)`);
            }
            
            // Create common data object for any creation path
            const baseItemData = {
              ...cleanData,
              userId: tempUser.id,
              ordinal,
              listId: providedListId
            };
            
            // Create the action item
            const actionItem = await prisma.actionItem.create({
              data: baseItemData
            });
            
            console.log(`Successfully created action item with ID: ${actionItem.id} and ordinal: ${ordinal}`);
            
            // Return the created item
            return NextResponse.json(actionItem, { status: 201 });
          } else {
            console.warn(`List with ID ${providedListId} not found, creating item without listId`);
            // Continue without listId - don't fail the request
          }
        }
        
        // Continue with existing logic for items without a listId
        // Check if content has a list prefix like [List Name]
        const bracketMatch = body.content.match(/^\s*[\[\{](.*?)[\]\}]/);
        
        if (bracketMatch) {
          const listName = bracketMatch[1].trim();
          console.log(`Content has list prefix: [${listName}]`);
          
          // Look for existing list with this name
          const existingList = await prisma.actionItemList.findFirst({
            where: {
              userId: tempUser.id,
              title: listName
            }
          });
          
          if (existingList) {
            console.log(`Found existing list matching prefix: "${existingList.title}" (${existingList.id})`);
            
            // If no explicit ordinal was provided, determine it based on existing items in the list
            if (typeof body.ordinal !== 'number') {
              // Count existing items in this list to determine the next ordinal value
              const existingItemsCount = await prisma.actionItem.count({
                where: { 
                  listId: existingList.id,
                  userId: tempUser.id
                }
              });
              
              // Set ordinal to be the next position in the list
              ordinal = existingItemsCount;
              console.log(`Auto-assigning ordinal ${ordinal} based on list position (${existingItemsCount} existing items)`);
            }
            
            // Create action item with existing list ID
            const baseItemData = {
              ...cleanData,
              userId: tempUser.id,
              ordinal,
              listId: existingList.id
            };
            
            // Create the action item
            const actionItem = await prisma.actionItem.create({
              data: baseItemData
            });
            
            console.log(`Successfully created action item with ID: ${actionItem.id} and ordinal: ${ordinal}`);
            
            // Return the created item
            return NextResponse.json(actionItem, { status: 201 });
          } else {
            // Create a new list with this name
            try {
              console.log(`Creating new list from bracket prefix: "${listName}"`);
              const newList = await prisma.actionItemList.create({
                data: {
                  title: listName,
                  items: [],
                  userId: tempUser.id,
                  itemNotes: { color: 'light-blue' }
                }
              });
              
              // For a new list, the first item should have ordinal 0
              ordinal = 0;
              console.log(`Auto-assigning ordinal ${ordinal} for first item in new list`);
              
              // Create action item with new list ID
              const baseItemData = {
                ...cleanData,
                userId: tempUser.id,
                ordinal,
                listId: newList.id
              };
              
              // Create the action item
              const actionItem = await prisma.actionItem.create({
                data: baseItemData
              });
              
              console.log(`Successfully created action item with ID: ${actionItem.id} and ordinal: ${ordinal} in new list: ${newList.id}`);
              
              // Return the created item
              return NextResponse.json(actionItem, { status: 201 });
            } catch (listError) {
              console.error('Failed to create list from bracket prefix:', listError);
              // Continue without listId - don't fail the request
            }
          }
        }
        
        // If we get here, create an item without a listId
        const baseItemData = {
          ...cleanData,
          userId: tempUser.id,
          ordinal
        };
        
        // Create the action item
        const actionItem = await prisma.actionItem.create({
          data: baseItemData
        });
        
        console.log(`Successfully created action item with ID: ${actionItem.id}`);
        
        // Return the created item
        return NextResponse.json(actionItem, { status: 201 });
      } catch (itemError) {
        console.error('Error creating action item:', itemError);
        
        // Attempt to log request body for debugging
        try {
          const originalBody = await requestClone.json();
          console.error('Original request body:', JSON.stringify(originalBody).substring(0, 200));
        } catch (logError) {
          console.error('Could not log original request body');
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to create action item', 
            details: itemError instanceof Error ? itemError.message : String(itemError)
          },
          { status: 500 }
        );
      }
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