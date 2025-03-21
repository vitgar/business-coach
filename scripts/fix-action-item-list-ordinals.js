// Script to fix action item list ordinals
// This script updates the ordinals for all action item lists to ensure proper sequencing within parent lists

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Set to true to sort sublists alphabetically by title instead of by creation date
const SORT_BY_TITLE = false;

async function fixActionItemListOrdinals() {
  console.log('Starting to fix action item list ordinals...');
  console.log(`Sorting method: ${SORT_BY_TITLE ? 'Alphabetical by title' : 'By creation date'}`);
  
  try {
    // Get all action item lists
    const lists = await prisma.actionItemList.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`Found ${lists.length} action item lists`);
    
    // Group lists by parentId
    const groupedLists = {};
    lists.forEach(list => {
      const parentId = list.parentId || 'root';
      if (!groupedLists[parentId]) {
        groupedLists[parentId] = [];
      }
      groupedLists[parentId].push(list);
    });
    
    // Log stats of grouped lists
    console.log(`Parent groups:`);
    Object.keys(groupedLists).forEach(parentId => {
      const childCount = groupedLists[parentId].length;
      console.log(`- ${parentId === 'root' ? 'Root lists' : `Children of ${parentId}`}: ${childCount} lists`);
    });
    
    // Process each group of lists
    for (const [parentId, childLists] of Object.entries(groupedLists)) {
      console.log(`\nProcessing ${childLists.length} lists with parent: ${parentId === 'root' ? 'None (root lists)' : parentId}`);
      
      // Sort lists by title or creation date depending on configuration
      if (SORT_BY_TITLE) {
        childLists.sort((a, b) => a.title.localeCompare(b.title));
        console.log(`Sorted alphabetically by title`);
      } else {
        childLists.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        console.log(`Sorted by creation date (oldest first)`);
      }
      
      // Log the order before updates
      console.log("Order before updates:");
      childLists.forEach((list, index) => {
        console.log(`  ${index}. "${list.title}" (current ordinal: ${list.ordinal})`);
      });
      
      // Keep track of changes
      let changedCount = 0;
      
      // Update ordinals for each list in the group
      for (let i = 0; i < childLists.length; i++) {
        const list = childLists[i];
        
        if (list.ordinal !== i) {
          console.log(`Updating list "${list.title}" from ordinal ${list.ordinal} to ${i}`);
          
          await prisma.actionItemList.update({
            where: { id: list.id },
            data: { ordinal: i }
          });
          
          changedCount++;
        } else {
          console.log(`List "${list.title}" already has correct ordinal ${i}`);
        }
      }
      
      console.log(`Updated ${changedCount} of ${childLists.length} lists in this group`);
    }
    
    console.log('\nAll action item list ordinals have been fixed!');
  } catch (error) {
    console.error('Error fixing action item list ordinals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixActionItemListOrdinals()
  .then(() => console.log('Script completed successfully'))
  .catch(e => {
    console.error('Script failed with error:', e);
    process.exit(1);
  }); 