/**
 * Test script to verify ActionItem model in Prisma
 * 
 * This script tests if we can properly read and write action items using the Prisma client.
 * Run it with: npx ts-node src/scripts/test-action-items.ts
 */

const { PrismaClient } = require('@prisma/client')

async function main() {
  console.log('Starting ActionItem test script...')

  // Create a new Prisma client
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })

  try {
    // 1. Get or create a test user
    console.log('Finding or creating test user...')
    let testUser = await prisma.user.findFirst({
      where: {
        email: 'test-action-items@example.com'
      }
    })

    if (!testUser) {
      console.log('Creating test user...')
      testUser = await prisma.user.create({
        data: {
          email: 'test-action-items@example.com',
          name: 'Test Action Items User',
          password: 'test-password',
        }
      })
      console.log('Test user created:', testUser.id)
    } else {
      console.log('Found test user:', testUser.id)
    }

    // 2. Create a test conversation
    console.log('Creating test conversation...')
    const conversation = await prisma.conversation.create({
      data: {
        title: 'Test Conversation for Action Items',
        userId: testUser.id,
        messages: {
          create: [
            {
              content: 'This is a test message',
              role: 'user',
            },
            {
              content: 'This is a test response with action items:\n1. First action item\n2. Second action item',
              role: 'assistant',
            }
          ]
        }
      },
      include: {
        messages: true
      }
    })

    console.log('Test conversation created:', conversation.id)
    const messageId = conversation.messages[1].id
    
    // 3. Try to create action items using direct Prisma API
    console.log('Creating action items...')
    try {
      // @ts-ignore - TypeScript might not recognize actionItem yet
      const actionItem1 = await prisma.actionItem.create({
        data: {
          content: 'Test action item 1',
          userId: testUser.id,
          conversationId: conversation.id,
          messageId: messageId,
          ordinal: 0
        }
      })
      console.log('Action item created using Prisma client:', actionItem1.id)
    } catch (error) {
      console.error('Error creating action item with Prisma client:', error)
      
      // 4. If direct method fails, try raw SQL query
      console.log('Trying with raw SQL query...')
      try {
        const result = await prisma.$executeRaw`
          INSERT INTO "ActionItem" (
            "id", "content", "isCompleted", "userId", "conversationId", 
            "messageId", "ordinal", "createdAt", "updatedAt"
          ) VALUES (
            ${'ai_test_' + Date.now()}, 
            ${'Test action item via raw SQL'}, 
            false, 
            ${testUser.id}, 
            ${conversation.id}, 
            ${messageId}, 
            ${1}, 
            ${new Date()}, 
            ${new Date()}
          )
        `
        console.log('Action item created using raw SQL:', result)
      } catch (sqlError) {
        console.error('Error creating action item with raw SQL:', sqlError)
      }
    }
    
    // 5. Try to query action items
    console.log('Querying action items...')
    try {
      // @ts-ignore - TypeScript might not recognize actionItem yet
      const items = await prisma.actionItem.findMany({
        where: {
          conversationId: conversation.id
        }
      })
      console.log(`Found ${items.length} action items:`, items)
    } catch (queryError) {
      console.error('Error querying action items with Prisma client:', queryError)
      
      // 6. If query fails, try raw SQL
      console.log('Trying to query with raw SQL...')
      try {
        const rawItems = await prisma.$queryRaw`
          SELECT * FROM "ActionItem" 
          WHERE "conversationId" = ${conversation.id}
        `
        console.log(`Found ${Array.isArray(rawItems) ? rawItems.length : 0} action items with raw query:`, rawItems)
      } catch (rawQueryError) {
        console.error('Error with raw SQL query:', rawQueryError)
      }
    }

  } catch (error) {
    console.error('Test script error:', error)
  } finally {
    // Clean up
    await prisma.$disconnect()
    console.log('Test script completed')
  }
}

main()
  .catch(e => {
    console.error('Unhandled error in main:', e)
    process.exit(1)
  }) 