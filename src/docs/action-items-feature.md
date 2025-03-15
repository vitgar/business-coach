# Action Items Feature Documentation

## Overview

The Action Items feature allows users to track and manage tasks extracted from their conversations with the AI business coach. The system automatically detects actionable items in the AI's responses and saves them for the user to manage later.

## Key Components

### 1. Action Items Extraction

- Located in `src/lib/action-items-extractor.ts`
- Automatically extracts action items from assistant messages
- Uses regex patterns to identify numbered lists, bulleted lists, and explicit action/task mentions
- Returns an array of action item strings extracted from the message

### 2. API Integration

- The chat API in `src/app/api/chat/route.ts` uses the extractor to process messages
- When action items are detected, they are saved to the database
- The response includes data about extracted action items, including:
  - Whether action items were detected
  - Number of items detected
  - Number of items successfully saved
  - Content of the items

### 3. UI Components

#### ActionItemsList Component

- Located in `src/components/action-items/ActionItemsList.tsx`
- Reusable component for displaying and managing action items
- Features:
  - Marking items as complete/incomplete
  - Adding notes to items
  - Deleting items
  - Support for hierarchical items (parent-child relationships)
  - Filtering capabilities

#### Action Items Page

- Located in `src/app/action-items/page.tsx`
- Provides a dedicated interface for viewing and managing all action items
- Features:
  - Filtering options (completed/incomplete)
  - Manual creation of new action items
  - Refreshing the items list

#### Chat Integration

- The `BusinessCoachMessage` component in `src/components/chat/BusinessCoachMessage.tsx` displays feedback when action items are detected and saved
- Provides a link to view the saved action items

## API Endpoints

The following API endpoints are available for working with action items:

### `/api/action-items`

- **GET**: Retrieve action items with optional filters
  - Query parameters:
    - `conversationId`: Filter by conversation
    - `messageId`: Filter by message source
    - `parentId`: Filter by parent item
    - `rootItemsOnly`: Only return root items (no parents)
  
- **POST**: Create a new action item or batch of items
  - Body format for single item:
    ```json
    {
      "content": "Action item text",
      "conversationId": "optional-conversation-id",
      "messageId": "optional-message-id",
      "parentId": "optional-parent-id",
      "ordinal": 0
    }
    ```
  - Can also accept an array of items for batch creation

### `/api/action-items/[id]`

- **GET**: Retrieve a specific action item by ID
- **PUT**: Update an action item
  - Fields that can be updated: content, isCompleted, notes, ordinal, parentId
- **DELETE**: Delete an action item
  - Query parameters:
    - `deleteChildren`: Set to "true" to delete all child items as well

### `/api/action-items/[id]/children`

- **GET**: Retrieve all children of a specific action item

## Database Model

The `ActionItem` model in `prisma/schema.prisma` includes:

- `id`: Unique identifier
- `content`: The text of the action item
- `isCompleted`: Boolean completion status
- `notes`: Optional user notes about the item
- `parentId` and `parent`: For hierarchical relationships
- `conversationId` and `conversation`: The conversation source
- `messageId` and `message`: The specific message source
- `ordinal`: Position/order in the list
- `userId` and `user`: The owner of the action item
- `createdAt` and `updatedAt`: Timestamps

## Usage Examples

### Extracting Action Items in Code

```typescript
import { extractActionItems, messageContainsActionItems } from '@/lib/action-items-extractor';

// Check if a message likely contains action items
const hasActionItems = messageContainsActionItems(message);

if (hasActionItems) {
  // Extract the action items
  const actionItems = extractActionItems(message);
  
  // Do something with the extracted items
  console.log(`Found ${actionItems.length} action items:`, actionItems);
}
```

### Displaying Action Items

```tsx
import ActionItemsList from '@/components/action-items/ActionItemsList';

// Display action items for a specific conversation
<ActionItemsList conversationId="conversation-id" />

// Display only incomplete action items
<ActionItemsList filter={(item) => !item.isCompleted} />

// Display only root-level items
<ActionItemsList rootItemsOnly={true} />
```

## Future Enhancements

Potential enhancements for the Action Items feature:

1. **Due Dates**: Add due dates and reminders for items
2. **Priority Levels**: Allow users to set priority levels (High, Medium, Low)
3. **Categories/Tags**: Enable categorization and tagging of items
4. **Bulk Actions**: Add support for bulk operations (complete multiple items, delete multiple items)
5. **Export/Import**: Allow exporting and importing action items
6. **Drag-and-Drop Reordering**: Enable reordering of items via drag-and-drop
7. **Custom Views**: Create custom filtered views that users can save 