/**
 * ActionItem Types
 * 
 * This file contains interfaces related to action items in the application.
 */

/**
 * Basic ActionItem interface that matches the database schema
 */
export interface ActionItem {
  id: string;
  content: string;
  isCompleted: boolean;
  conversationId?: string;
  messageId?: string;
  notes?: string;
  parentId?: string | null;
  listId?: string;          // ID of the list this action item belongs to
  ordinal: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    children: number;
  };
}

/**
 * Enhanced ActionItem interface with additional fields for the action items page
 * Includes description, priority level, progress tracking, and step number
 */
export interface EnhancedActionItem extends ActionItem {
  description?: string;       // Detailed description of the action item
  priorityLevel?: string;     // Priority level (e.g., "high", "medium", "low")
  progress?: string;          // Progress status ("not started", "in progress", "complete")
  stepNumber?: number;        // Optional step number for sequential tasks
  subItems?: EnhancedActionItem[]; // Nested action items
  listId?: string;            // ID of the list this action item belongs to
}

/**
 * Props for the ActionItemsList component
 */
export interface ActionItemsListProps {
  conversationId?: string;       // Optional filter by conversation
  messageId?: string;            // Optional filter by message
  parentId?: string;             // Optional filter by parent action item 
  rootItemsOnly?: boolean;       // Only show root items (no parents)
  filter?: (item: ActionItem) => boolean; // Optional filter function for items
  onCreateNewItem?: () => void;  // Optional callback for creating a new item
} 