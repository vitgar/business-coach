'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Loader2, ArrowRight, Plus, Trash2, MessageSquare, Save, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Interface for action item properties received from API
interface ActionItem {
  id: string
  content: string
  isCompleted: boolean
  conversationId: string
  messageId: string
  createdAt: string
  updatedAt: string
  notes?: string
  ordinal: number
  listId?: string // ID of the action list this item belongs to
  _count?: {
    children: number
  }
}

// Props for the ActionItemsList component
interface ActionItemsListProps {
  conversationId?: string // Optional filter by conversation
  messageId?: string // Optional filter by message
  parentId?: string // Optional filter by parent action item 
  rootItemsOnly?: boolean // Only show root items (no parents)
  categoryFilter?: string | null // Filter by category prefix like [Category]
  showChildCategories?: boolean // Whether to show items from child categories of the selected category
  listId?: string | null // The ID of the list to filter items by
  hasCategories?: boolean // Whether there are categories available in the sidebar
  sidebarVisible?: boolean // Whether the categories sidebar is visible
  onCreateNewItem?: () => void // Optional callback for creating a new item
  onItemStatusChange?: () => void // Optional callback for when item status changes
  onItemAdded?: () => void // Callback when item is added
  onItemChanged?: () => void // Callback when item is changed
  onItemDeleted?: () => void // Callback when item is deleted
}

/**
 * ActionItemsList Component
 * 
 * Displays a list of action items with the ability to mark them as complete/incomplete
 * and potentially add new items or delete existing ones.
 * 
 * @param {ActionItemsListProps} props - Component properties including optional filters
 */
export default function ActionItemsList({ 
  conversationId, 
  messageId,
  parentId,
  rootItemsOnly = true,
  categoryFilter = null,
  showChildCategories = false,
  listId,
  hasCategories,
  sidebarVisible,
  onCreateNewItem,
  onItemStatusChange,
  onItemAdded,
  onItemChanged,
  onItemDeleted
}: ActionItemsListProps) {
  const { userId } = useAuth()
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updateInProgress, setUpdateInProgress] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [childCategories, setChildCategories] = useState<string[]>([])
  const [listNames, setListNames] = useState<Record<string, string>>({})

  /**
   * Fetches action items from the API based on provided filters
   */
  const fetchActionItems = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Construct query parameters
      const params = new URLSearchParams()
      if (conversationId) params.append('conversationId', conversationId)
      if (messageId) params.append('messageId', messageId)
      if (parentId) params.append('parentId', parentId)
      if (rootItemsOnly) params.append('rootItemsOnly', 'true')
      if (listId) params.append('listId', listId)
      
      // Add a larger limit to ensure we get all items
      params.append('limit', '1000')
      
      console.log(`Fetching action items with params: ${params.toString()}`)
      
      // Fetch action items from API
      const response = await fetch(`/api/action-items?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch action items')
      }
      
      const data = await response.json()
      console.log(`Received ${data.length} action items from API`)
      
      // Log the first few items for debugging
      if (data.length > 0) {
        console.log('Sample action items:', data.slice(0, 3))
      }
      
      setActionItems(data)
      
      // If we need to support child categories, identify them for filtering
      if (showChildCategories && categoryFilter) {
        // Extract all categories from items
        const categories = new Set<string>();
        data.forEach((item: ActionItem) => {
          const bracketMatch = item.content.match(/^\s*[\[\{](.*?)[\]\}]/);
          if (bracketMatch) {
            categories.add(bracketMatch[1].trim());
          }
        });
        
        // Use a simplified approach to identify potential child categories
        // based on common naming patterns
        const potentialChildren = Array.from(categories).filter(cat => {
          if (cat === categoryFilter) return false; // Skip the parent category itself
          
          // Check if this category is related to the parent category
          // This is a simplified approach - in a real app, you'd use a more robust method
          
          // 1. Check if category contains the parent name
          if (cat.includes(categoryFilter)) return true;
          
          // 2. Check if it's a common subcategory pattern (e.g., "Business Plan > Executive Summary")
          if (categoryFilter.includes("Business Plan") && 
              ["Executive Summary", "Market Analysis", "Company Description", 
               "Organization", "Products", "Marketing", "Financials"].some(term => 
              cat.includes(term))) {
            return true;
          }
          
          // 3. Look for other semantic connections (very simplified)
          const parentWords = categoryFilter.toLowerCase().split(/\s+/);
          const childWords = cat.toLowerCase().split(/\s+/);
          let commonWords = 0;
          
          childWords.forEach(word => {
            if (word.length > 3 && parentWords.includes(word)) {
              commonWords++;
            }
          });
          
          return commonWords >= 1; // At least one meaningful common word
        });
        
        setChildCategories(potentialChildren);
        console.log(`Found ${potentialChildren.length} potential child categories for ${categoryFilter}:`, potentialChildren);
      } else {
        setChildCategories([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      console.error('Error fetching action items:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Filters action items based on the category filter
   */
  useEffect(() => {
    if (categoryFilter === null) {
      // If no category filter, use all items
      console.log(`No category filter, showing all ${actionItems.length} items`)
      setFilteredItems(actionItems)
    } else {
      console.log(`Filtering by category: "${categoryFilter}", showChildCategories: ${showChildCategories}`)
      console.log(`Child categories: ${childCategories.join(', ')}`)
      
      // Filter items that match the specified category
      const filtered = actionItems.filter(item => {
        // If we have a listId and the item has a matching listId, include it
        if (listId && item.listId === listId) {
          console.log(`Found listId match for item: ${item.content.substring(0, 50)}...`)
          return true;
        }
        
        // First look for category in bracketed prefix
        const bracketMatch = item.content.match(/^\s*[\[\{](.*?)[\]\}]/);
        
        if (bracketMatch) {
          const itemCategory = bracketMatch[1].trim();
          
          // For debugging
          if (itemCategory === categoryFilter) {
            console.log(`Found direct match for item: ${item.content.substring(0, 50)}...`)
          }
          
          // Include exact category match
          if (itemCategory === categoryFilter) return true;
          
          // If showing child categories, include those too
          if (showChildCategories && childCategories.includes(itemCategory)) {
            console.log(`Found child category match (${itemCategory}) for item: ${item.content.substring(0, 50)}...`)
            return true;
          }
        }
        
        return false;
      });
      
      console.log(`Filtered to ${filtered.length} items`)
      setFilteredItems(filtered);
    }
  }, [actionItems, categoryFilter, showChildCategories, childCategories, listId]);

  /**
   * Toggles the completion status of an action item
   * @param {string} id - ID of the action item to toggle
   * @param {boolean} currentStatus - Current completion status
   */
  const toggleItemCompletion = async (id: string, currentStatus: boolean) => {
    setUpdateInProgress(id)
    
    try {
      const response = await fetch(`/api/action-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isCompleted: !currentStatus
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update action item')
      }
      
      // Update local state
      setActionItems(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, isCompleted: !currentStatus } 
            : item
        )
      )
      
      // Notify parent component about the status change
      if (onItemStatusChange) {
        onItemStatusChange()
      }
      
      // Call the more specific callback if provided
      if (onItemChanged) {
        onItemChanged()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
      console.error('Error updating action item:', err)
    } finally {
      setUpdateInProgress(null)
    }
  }

  /**
   * Delete an action item
   * @param {string} id - ID of the action item to delete
   */
  const deleteActionItem = async (id: string) => {
    setUpdateInProgress(id)
    
    try {
      const response = await fetch(`/api/action-items/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete action item')
      }
      
      // Remove item from local state
      setActionItems(prev => prev.filter(item => item.id !== id))
      
      // Notify parent component about the change
      if (onItemStatusChange) {
        onItemStatusChange()
      }
      
      // Call the more specific callback if provided
      if (onItemDeleted) {
        onItemDeleted()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
      console.error('Error deleting action item:', err)
    } finally {
      setUpdateInProgress(null)
    }
  }

  /**
   * Update the note for an action item
   * @param {string} id - ID of the action item to update
   */
  const updateItemNote = async (id: string) => {
    if (!noteText.trim()) {
      // If note is empty, treat it as removing the note
      setEditingNoteId(null)
      return
    }
    
    setUpdateInProgress(id)
    
    try {
      const response = await fetch(`/api/action-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: noteText.trim()
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update note')
      }
      
      // Update local state
      setActionItems(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, notes: noteText.trim() } 
            : item
        )
      )
      
      // Close the note editor
      setEditingNoteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note')
      console.error('Error updating note:', err)
    } finally {
      setUpdateInProgress(null)
    }
  }

  /**
   * Start editing notes for an action item
   * @param {ActionItem} item - The action item to edit notes for
   */
  const startEditingNote = (item: ActionItem) => {
    setNoteText(item.notes || '')
    setEditingNoteId(item.id)
  }

  /**
   * Cancel editing notes
   */
  const cancelEditingNote = () => {
    setEditingNoteId(null)
    setNoteText('')
  }

  /**
   * Cleans action item content by removing the category prefix if it matches the current filter
   * @param content The original content text
   * @returns Cleaned content with category prefix removed if appropriate
   */
  const getDisplayContent = (content: string): string => {
    if (!categoryFilter) return content;
    
    // If we're filtering by a category, remove that prefix from the content
    const prefixPattern = new RegExp(`^\\s*\\[${categoryFilter}\\]\\s*|^\\s*\\{${categoryFilter}\\}\\s*`, 'i');
    return content.replace(prefixPattern, '').trim();
  }

  // Fetch action items on component mount
  useEffect(() => {
    fetchActionItems()
  }, [conversationId, messageId, parentId, rootItemsOnly, showChildCategories, listId])

  // Fetch list names for any listIds we have
  useEffect(() => {
    // First collect all unique list IDs from our items
    const uniqueListIds = Array.from(new Set(
      actionItems
        .filter(item => !!item.listId)
        .map(item => item.listId as string)
    ));
    
    if (uniqueListIds.length === 0) return;
    
    console.log(`Fetching names for ${uniqueListIds.length} lists`);
    
    // Fetch each list's details to get its name
    const fetchListNames = async () => {
      const nameMap: Record<string, string> = {};
      
      for (const id of uniqueListIds) {
        try {
          const response = await fetch(`/api/action-item-lists/${id}`);
          if (response.ok) {
            const list = await response.json();
            nameMap[id] = list.name;
          }
        } catch (err) {
          console.error(`Error fetching list name for ${id}:`, err);
        }
      }
      
      setListNames(nameMap);
    };
    
    fetchListNames();
  }, [actionItems]);

  // If loading, show loading indicator
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading action items...</span>
      </div>
    )
  }

  // If error, show error message
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p className="font-semibold">Error loading action items</p>
        <p>{error}</p>
      </div>
    )
  }

  // If no action items, show empty state
  if (actionItems.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <p className="text-gray-500 mb-2">No action items found</p>
        <p className="text-sm text-gray-400 mb-4">
          Action items will appear here when they are created from chat messages.
        </p>
        
        {onCreateNewItem && (
          <button
            onClick={onCreateNewItem}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 mt-2"
          >
            <Plus size={16} />
            Create New Action Item
          </button>
        )}
      </div>
    )
  }
  
  // If filtered items are empty but we have action items, show empty state for the filter
  if (filteredItems.length === 0 && actionItems.length > 0) {
    return (
      <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <p className="text-gray-500 mb-2">No matching action items found</p>
        <p className="text-sm text-gray-400 mb-4">
          There are no action items in the selected category.
        </p>
        
        {onCreateNewItem && (
          <button
            onClick={onCreateNewItem}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 mt-2"
          >
            <Plus size={16} />
            Create New Action Item
          </button>
        )}
      </div>
    )
  }

  // Render the action items list
  return (
    <div className={`space-y-3 ${sidebarVisible && hasCategories ? 'pl-0' : 'pl-0'}`}>
      {filteredItems
        .map(item => (
        <div 
          key={item.id} 
          className={`p-4 rounded-lg border ${
            item.isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-blue-300'
          } transition-colors`}
        >
          <div className="flex items-start gap-3">
            {/* Completion toggle button */}
            <button
              onClick={() => toggleItemCompletion(item.id, item.isCompleted)}
              disabled={updateInProgress === item.id}
              className={`mt-0.5 flex-shrink-0 focus:outline-none ${
                updateInProgress === item.id ? 'opacity-50' : ''
              }`}
              aria-label={item.isCompleted ? "Mark as incomplete" : "Mark as complete"}
            >
              {updateInProgress === item.id ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              ) : item.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {/* Action item content */}
            <div className="flex-1">
              <p className={`${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                {getDisplayContent(item.content)}
              </p>
              
              {/* Show list name if we're in "All Items" view and not showing by category already */}
              {!categoryFilter && item.listId && (
                <div className="mt-1 text-xs bg-blue-50 text-blue-600 inline-block px-2 py-0.5 rounded-full">
                  {listNames[item.listId] || item.listId}
                </div>
              )}
              
              {/* Show notes if available */}
              {item.notes && (
                <p className="mt-1 text-sm text-gray-500">
                  {item.notes}
                </p>
              )}
              
              {/* Show metadata for debugging/development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-400">
                  <p>ID: {item.id}</p>
                  <p>Created: {new Date(item.createdAt).toLocaleString()}</p>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              {/* Note button */}
              <button
                onClick={() => startEditingNote(item)}
                disabled={updateInProgress === item.id}
                className={`text-gray-400 hover:text-blue-500 focus:outline-none ${
                  item.notes ? 'text-blue-400' : ''
                }`}
                aria-label={item.notes ? "Edit note" : "Add note"}
              >
                <MessageSquare size={16} />
              </button>
              
              {/* Show child items button if children exist */}
              {item._count && item._count.children > 0 && (
                <button 
                  className="text-sm inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                  onClick={() => {/* Navigate to child items */}}
                >
                  <span>{item._count.children}</span>
                  <ArrowRight size={14} />
                </button>
              )}
              
              {/* Delete button */}
              <button
                onClick={() => deleteActionItem(item.id)}
                disabled={updateInProgress === item.id}
                className="text-gray-400 hover:text-red-500 focus:outline-none"
                aria-label="Delete action item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          {/* Note editor */}
          {editingNoteId === item.id && (
            <div className="mt-3 border-t pt-3 border-gray-200">
              <div className="flex flex-col space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add notes about this action item..."
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={2}
                  disabled={updateInProgress === item.id}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEditingNote}
                    className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800 focus:outline-none inline-flex items-center gap-1"
                    disabled={updateInProgress === item.id}
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    onClick={() => updateItemNote(item.id)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none inline-flex items-center gap-1"
                    disabled={updateInProgress === item.id}
                  >
                    {updateInProgress === item.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 