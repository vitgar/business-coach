import { NextResponse } from 'next/server'
import { extractActionItemsFromText, prepareActionItems } from '@/lib/action-items-extractor'
import { prisma } from '@/lib/prisma'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'

/**
 * POST /api/action-items/bulk-create
 * 
 * Creates multiple action items by extracting them from provided content
 * 
 * Request body:
 * - content: string - The content to extract action items from
 * - conversationId: string (optional) - ID of the conversation
 * - messageId: string (optional) - ID of the message
 * - businessId: string (optional) - ID of the business (IGNORED - not in schema)
 * 
 * Returns:
 * - count: number - Number of action items created
 * - items: Array - The created action items
 */
export async function POST(request: Request) {
  try {
    // In a production app, we would use getServerSession with authOptions
    // For development, we'll use a temporary user
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
    
    // Parse request data
    const data = await request.json()
    const { content, conversationId, messageId, businessId } = data
    
    // Validate required data
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    
    // Extract action items from the content
    const extractedItems = extractActionItemsFromText(content)
    
    // If no items were extracted, return an empty result
    if (!extractedItems.length) {
      return NextResponse.json({ 
        count: 0, 
        items: [] 
      })
    }
    
    // Create a synthetic message ID for internal processing 
    // (this won't be used in the database since we'll remove it later)
    const syntheticMessageId = `synthetic_${Date.now()}`
    
    // Prepare action items for database insertion
    const itemsToCreate = prepareActionItems(
      extractedItems,
      syntheticMessageId,
      conversationId || `synthetic_${Date.now()}`
    )
    
    // Add user ID to each item - NOTE: businessId is NOT included as it's not in the schema
    // Also, remove messageId to avoid foreign key constraint errors
    const itemsWithUserData = itemsToCreate.map((item, index) => ({
      ...item,
      userId: tempUser.id,
      messageId: null, // Set to null to avoid foreign key constraint errors
      ordinal: index // Set ordinal based on the item's position in the list
      // businessId is intentionally not included here
    }))
    
    // Log the ordinals for debugging
    console.log(`Setting ordinals for ${itemsWithUserData.length} bulk-created items`);

    // Create the action items in the database
    const createdItems = await prisma.$transaction(
      itemsWithUserData.map(item => 
        prisma.actionItem.create({
          data: item
        })
      )
    )
    
    // Return success response with created items
    return NextResponse.json({
      count: createdItems.length,
      items: createdItems.map(item => ({
        id: item.id,
        content: item.content
      }))
    })
  } catch (error) {
    console.error('Error creating action items:', error)
    return NextResponse.json(
      { error: 'Failed to create action items' },
      { status: 500 }
    )
  }
} 