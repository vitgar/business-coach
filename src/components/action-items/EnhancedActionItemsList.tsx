'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import { ActionItem, EnhancedActionItem } from '@/types/actionItem'
import CollapsibleActionItem from './CollapsibleActionItem'

/**
 * EnhancedActionItemsList Component
 * 
 * Displays a list of action items with collapsible interface
 * and enhanced features such as descriptions, priority, progress, etc.
 * 
 * @param {Object} props - Component properties
 * @param {string} props.conversationId - Optional filter by conversation ID
 * @param {string} props.businessId - Optional filter by business ID
 * @param {string} props.listId - Optional filter by list ID
 */
export default function EnhancedActionItemsList({ 
  conversationId,
  businessId,
  listId = 'default'
}: { 
  conversationId?: string;
  businessId?: string;
  listId?: string;
}) {
  const [items, setItems] = useState<EnhancedActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EnhancedActionItem | null>(null);
  const [isAddingSubItem, setIsAddingSubItem] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);

  /**
   * Fetch action items from the API with proper filtering
   * This function fetches root action items and their children,
   * maintaining the parent-child relationship for hierarchical display
   */
  const fetchActionItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (conversationId) params.append('conversationId', conversationId);
      if (businessId) params.append('businessId', businessId);
      if (listId) params.append('listId', listId);
      params.append('rootItemsOnly', 'true');
      
      // Fetch from API
      const response = await fetch(`/api/action-items?${params.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch action items');
      }
      
      const data: ActionItem[] = await response.json();
      
      // Transform standard ActionItems to EnhancedActionItems with their children
      const enhancedItems: EnhancedActionItem[] = await Promise.all(
        data.map(async item => {
          // For each root item, fetch its children
          let subItems: EnhancedActionItem[] = [];
          
          if (item._count && item._count.children > 0) {
            const childParams = new URLSearchParams();
            childParams.append('parentId', item.id);
            
            const childResponse = await fetch(`/api/action-items?${childParams.toString()}`);
            
            if (childResponse.ok) {
              const childData: ActionItem[] = await childResponse.json();
              // Convert child items to EnhancedActionItems
              subItems = childData.map(child => ({
                ...child,
                // Use the data from the database rather than generating random values
                description: child.notes,
                // These fields would come from the database in a real implementation
                // with the How To Helper API data
                priorityLevel: child.notes?.includes('high') ? 'high' : 
                               child.notes?.includes('medium') ? 'medium' : 'low',
                progress: 'not started',
                listId: child.listId || listId
              }));
            }
          }
          
          return {
            ...item,
            // Use the data from the database rather than generating random values
            description: item.notes,
            // These fields would come from the database in a real implementation
            // with the How To Helper API data
            priorityLevel: item.notes?.includes('high') ? 'high' : 
                           item.notes?.includes('medium') ? 'medium' : 'low',
            progress: 'not started',
            subItems,
            listId: item.listId || listId
          };
        })
      );
      
      setItems(enhancedItems);
    } catch (err) {
      console.error('Error fetching action items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load action items');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load and refresh when props change
  useEffect(() => {
    // Clear items first to show loading state and prevent showing stale data
    setItems([]);
    setIsLoading(true);
    fetchActionItems();
  }, [conversationId, businessId, listId]);

  /**
   * Toggle the completion status of an action item
   */
  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/action-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isCompleted: !currentStatus
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update action item');
      }
      
      // Update local state
      setItems(prevItems => 
        updateItemInTree(prevItems, id, item => ({
          ...item,
          isCompleted: !currentStatus
        }))
      );
      
      toast.success(`Item marked as ${!currentStatus ? 'complete' : 'incomplete'}`);
    } catch (err) {
      console.error('Error updating action item:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  /**
   * Delete an action item
   */
  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/action-items/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete action item');
      }
      
      // Remove from local state
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      
      toast.success('Item deleted');
    } catch (err) {
      console.error('Error deleting action item:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  /**
   * Open the edit modal for an action item
   */
  const handleEditItem = (item: EnhancedActionItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  /**
   * Open the modal to add a sub-item
   */
  const handleAddSubItem = (parentId: string) => {
    setParentId(parentId);
    setIsAddingSubItem(true);
  };

  /**
   * Helper function to update an item or any of its children in the tree
   */
  const updateItemInTree = (
    items: EnhancedActionItem[], 
    id: string, 
    updateFn: (item: EnhancedActionItem) => EnhancedActionItem
  ): EnhancedActionItem[] => {
    return items.map(item => {
      if (item.id === id) {
        return updateFn(item);
      }
      
      if (item.subItems && item.subItems.length > 0) {
        return {
          ...item,
          subItems: updateItemInTree(item.subItems, id, updateFn)
        };
      }
      
      return item;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading action items...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p className="font-semibold">Error loading action items</p>
        <p>{error}</p>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    // Extract the list name from the list ID for a more friendly display
    const friendlyListName = listId === 'default' 
      ? "Default" 
      : listId.startsWith('list-') 
        ? `"${listId.replace('list-', 'List ')}"` 
        : `"${listId}"`;
    
    return (
      <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <p className="text-gray-500 mb-2">No action items in this list</p>
        <p className="text-sm text-gray-400 mb-4">
          {listId === 'default' 
            ? "Start by creating some action items from the chat interface."
            : `Start by creating some action items in the ${friendlyListName} list.`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action items list */}
      <div className="space-y-2">
        {items.map(item => (
          <CollapsibleActionItem
            key={item.id}
            item={item}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDeleteItem}
            onEdit={handleEditItem}
            onAddSubItem={handleAddSubItem}
          />
        ))}
      </div>
      
      {/* Edit Modal would go here in a full implementation */}
      {/* <EditItemModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={editingItem}
        onSave={(updatedItem) => {
          // Logic to save the updated item
        }}
      /> */}
      
      {/* Add Sub-item Modal would go here in a full implementation */}
      {/* <AddItemModal 
        isOpen={isAddingSubItem}
        onClose={() => setIsAddingSubItem(false)}
        parentId={parentId}
        onSave={(newItem) => {
          // Logic to save the new sub-item
        }}
      /> */}
    </div>
  );
} 