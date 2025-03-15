-- Add listId column to the ActionItem table
ALTER TABLE "ActionItem" ADD COLUMN "listId" TEXT;

-- Add foreign key constraint to reference ActionItemList
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ActionItemList"("id") ON DELETE SET NULL ON UPDATE CASCADE; 