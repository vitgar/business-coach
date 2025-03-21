// Script to fix action item ordinals
// This script updates the ordinals for all action items to ensure proper sequencing within each list

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixActionItemOrdinals() {
  console.log('Starting to fix action item ordinals...');
  
  try {
    // Get all unique listIds
    const lists = await prisma.actionItemList.findMany({
      select: {
        id: true,
        title: true,
      }
    });
    
    console.log(`Found ${lists.length} action item lists`);
    
    // Process each list
    for (const list of lists) {
      console.log(`\nProcessing list: "${list.title}" (${list.id})`);
      
      // Get all items for this list
      const items = await prisma.actionItem.findMany({
        where: { 
          listId: list.id 
        },
        orderBy: { 
          createdAt: 'asc' // Order by creation date to maintain original intended sequence
        },
        select: {
          id: true,
          content: true,
          ordinal: true,
          createdAt: true
        }
      });
      
      console.log(`Found ${items.length} items in this list`);
      
      // Check if any items have duplicate ordinals
      const ordinalCounts = {};
      let hasDuplicates = false;
      
      items.forEach(item => {
        if (!ordinalCounts[item.ordinal]) {
          ordinalCounts[item.ordinal] = 1;
        } else {
          ordinalCounts[item.ordinal]++;
          hasDuplicates = true;
        }
      });
      
      if (!hasDuplicates && items.length > 0) {
        console.log('No duplicate ordinals found, skipping this list');
        continue;
      }
      
      // Update each item with new ordinal
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.ordinal !== i) {
          console.log(`Updating item "${item.content.substring(0, 30)}..." from ordinal ${item.ordinal} to ${i}`);
          
          await prisma.actionItem.update({
            where: { id: item.id },
            data: { ordinal: i }
          });
        }
      }
      
      console.log(`Successfully updated ordinals for list "${list.title}"`);
    }
    
    // Now handle items without a listId
    console.log('\nProcessing items without a listId');
    
    const orphanedItems = await prisma.actionItem.findMany({
      where: { 
        listId: null 
      },
      orderBy: { 
        createdAt: 'asc'
      },
      select: {
        id: true,
        content: true,
        ordinal: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${orphanedItems.length} items without a listId`);
    
    // Update each orphaned item with new ordinal
    for (let i = 0; i < orphanedItems.length; i++) {
      const item = orphanedItems[i];
      
      if (item.ordinal !== i) {
        console.log(`Updating orphaned item "${item.content.substring(0, 30)}..." from ordinal ${item.ordinal} to ${i}`);
        
        await prisma.actionItem.update({
          where: { id: item.id },
          data: { ordinal: i }
        });
      }
    }
    
    console.log('\nAll action item ordinals have been fixed!');
  } catch (error) {
    console.error('Error fixing action item ordinals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixActionItemOrdinals()
  .then(() => console.log('Script completed successfully'))
  .catch(error => console.error('Script failed:', error)); 