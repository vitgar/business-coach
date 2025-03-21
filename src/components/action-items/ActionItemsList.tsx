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
  ignoreParentItems?: boolean; // Whether to hide items from parent categories
  hasAnyItems?: boolean; // Whether to show any items at all (used to hide items for parent lists)
}

// Declare a global interface to add the custom cache property to Window
declare global {
  interface Window {
    listNameCache: Record<string, string>;
  }
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
  onItemDeleted,
  ignoreParentItems = false,
  hasAnyItems = true
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
    // Log parameters to help debug inconsistent filtering
    console.log(`Filtering with params: categoryFilter=${categoryFilter}, listId=${listId}, ignoreParentItems=${ignoreParentItems}, showChildCategories=${showChildCategories}`);
    console.log(`Child categories: ${childCategories.join(', ')}`);
    
    if (categoryFilter === null) {
      // If no category filter, use all items sorted by ordinal
      console.log(`No category filter, showing all ${actionItems.length} items`);
      
      // Sort items by ordinal first and then creation date
      const sortedItems = [...actionItems].sort((a, b) => {
        // First sort by ordinal (ascending)
        if (a.ordinal !== b.ordinal) {
          return a.ordinal - b.ordinal;
        }
        // If ordinals are the same, sort by createdAt (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setFilteredItems(sortedItems);
    } else {
      console.log(`Filtering by category: "${categoryFilter}", showChildCategories=${showChildCategories}`);
      
      // Check if the current category is a parent category
      const isParentCategory = childCategories.length > 0;
      
      // We need a consistent approach for filtering items
      // 1. If listId is provided, prioritize showing items from that list
      if (listId) {
        console.log(`Using listId=${listId} for filtering`);
        
        // First prioritize items that explicitly belong to this list
        const listItems = actionItems.filter(item => item.listId === listId);
        console.log(`Found ${listItems.length} items matching listId ${listId}`);
        
        // If we also need to show child categories, find those items too
        let childCategoryItems: ActionItem[] = [];
        if (showChildCategories && childCategories.length > 0) {
          childCategoryItems = actionItems.filter(item => {
            // Extract category from item
            const categoryMatch = item.content.match(/^\s*\[(.*?)\]|\s*\{(.*?)\}/);
            if (!categoryMatch) return false;
            
            const itemCategory = (categoryMatch[1] || categoryMatch[2]).trim();
            return childCategories.includes(itemCategory);
          });
          console.log(`Found ${childCategoryItems.length} items from child categories`);
        }
        
        // Combine and deduplicate
        const combinedItems = [...listItems];
        childCategoryItems.forEach(item => {
          if (!combinedItems.some(existingItem => existingItem.id === item.id)) {
            combinedItems.push(item);
          }
        });
        
        // Sort the filtered items
        const sortedFiltered = [...combinedItems].sort((a, b) => {
          // First sort by ordinal (ascending)
          if (a.ordinal !== b.ordinal) {
            return a.ordinal - b.ordinal;
          }
          // If ordinals are the same, sort by createdAt (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        console.log(`Showing ${sortedFiltered.length} total items after filtering and sorting`);
        setFilteredItems(sortedFiltered);
      }
      // 2. If no listId but we have a categoryFilter, filter by category content
      else {
        // Filter items that match the specified category
        const filtered = actionItems.filter(item => {
          // Extract the category from the item content
          let itemCategory = '';
          const categoryMatch = item.content.match(/^\s*\[(.*?)\]|\s*\{(.*?)\}/);
          
          if (categoryMatch) {
            // Use the captured group that matched (either [] or {})
            itemCategory = (categoryMatch[1] || categoryMatch[2]).trim();
          }
          
          // If this is a parent category and we don't want to show parent items, skip
          // But we still want to show the actual parent item itself, just not other items in the parent category
          if (isParentCategory && ignoreParentItems && itemCategory === categoryFilter) {
            return false;
          }
          
          // Direct match for the category
          if (itemCategory === categoryFilter) {
            return true;
          }
          
          // If showing child categories and this is one of them
          if (showChildCategories && childCategories.includes(itemCategory)) {
            return true;
          }
          
          return false;
        });
        
        // Sort the filtered items
        const sortedFiltered = [...filtered].sort((a, b) => {
          // First sort by ordinal (ascending)
          if (a.ordinal !== b.ordinal) {
            return a.ordinal - b.ordinal;
          }
          // If ordinals are the same, sort by createdAt (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        console.log(`Showing ${sortedFiltered.length} total items after category filtering and sorting`);
        setFilteredItems(sortedFiltered);
      }
    }
  }, [actionItems, categoryFilter, showChildCategories, childCategories, listId, ignoreParentItems]);

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

  // Fetch action items on component mount and when filters change
  useEffect(() => {
    // Skip loading if we're displaying a parent category with no items
    if (categoryFilter && !hasAnyItems) {
      console.log('Skipping action items fetch for parent category view');
      setIsLoading(false);
      return;
    }
    
    console.log('ActionItemsList: Fetching items due to filter change')
    
    // Add the listId to the logging for debugging
    console.log(`Fetching with: conversationId=${conversationId}, messageId=${messageId}, parentId=${parentId}, rootItemsOnly=${rootItemsOnly}, listId=${listId}`);
    
    // Track the most recent API call to prevent race conditions
    const fetchId = Date.now().toString();
    const controller = new AbortController();
    const signal = controller.signal;
    
    // This variable helps us track if this fetch is still relevant when it completes
    let isMounted = true;
    
    // Function to fetch with abort signal and track state
    const fetchWithSignal = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Construct query parameters
        const params = new URLSearchParams();
        if (conversationId) params.append('conversationId', conversationId);
        if (messageId) params.append('messageId', messageId);
        if (parentId) params.append('parentId', parentId);
        if (rootItemsOnly) params.append('rootItemsOnly', 'true');
        if (listId) params.append('listId', listId);
        
        // Add a larger limit to ensure we get all items
        params.append('limit', '1000');
        
        console.log(`Fetching action items with params: ${params.toString()}, fetchId: ${fetchId}`);
        
        // Fetch action items from API with abort signal
        const response = await fetch(`/api/action-items?${params.toString()}`, { signal });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch action items');
        }
        
        const data = await response.json();
        console.log(`Received ${data.length} action items from API for fetchId: ${fetchId}`);
        
        // Only update state if this component is still mounted and relevant
        if (isMounted) {
          setActionItems(data);
          
          // Process child categories if needed
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
            const potentialChildren = Array.from(categories).filter(cat => {
              if (cat === categoryFilter) return false;
              
              if (cat.includes(categoryFilter)) return true;
              
              if (categoryFilter.includes("Business Plan") && 
                  ["Executive Summary", "Market Analysis", "Company Description", 
                  "Organization", "Products", "Marketing", "Financials"].some(term => 
                  cat.includes(term))) {
                return true;
              }
              
              const parentWords = categoryFilter.toLowerCase().split(/\s+/);
              const childWords = cat.toLowerCase().split(/\s+/);
              let commonWords = 0;
              
              childWords.forEach(word => {
                if (word.length > 3 && parentWords.includes(word)) {
                  commonWords++;
                }
              });
              
              return commonWords >= 1;
            });
            
            setChildCategories(potentialChildren);
            console.log(`Found ${potentialChildren.length} potential child categories for ${categoryFilter}:`, potentialChildren);
          } else {
            setChildCategories([]);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log(`Fetch aborted for fetchId: ${fetchId}`);
          return;
        }
        
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Something went wrong');
          console.error(`Error fetching action items (fetchId: ${fetchId}):`, err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchWithSignal();
    
    // Cleanup function to abort fetch and track mount state
    return () => {
      isMounted = false;
      controller.abort();
      console.log(`Cleaning up fetch with fetchId: ${fetchId}`);
    };
  }, [conversationId, messageId, parentId, rootItemsOnly, listId, categoryFilter, showChildCategories]);
  
  // Fetch list names for any listIds we have
  useEffect(() => {
    // First collect all unique list IDs from our items
    const uniqueListIds = Array.from(new Set(
      actionItems
        .filter(item => !!item.listId)
        .map(item => item.listId as string)
    ));
    
    if (uniqueListIds.length === 0) return;
    
    // Initialize cache if it doesn't exist
    if (!window.listNameCache) {
      window.listNameCache = {};
    }
    
    // Check which lists we need to fetch (not in cache already)
    const listsToFetch = uniqueListIds.filter(id => !window.listNameCache[id]);
    
    // If we already have all the lists in cache, just use those
    if (listsToFetch.length === 0) {
      const cachedNames = uniqueListIds.reduce((acc, id) => {
        acc[id] = window.listNameCache[id];
        return acc;
      }, {} as Record<string, string>);
      
      setListNames(cachedNames);
      console.log(`Using cached names for all ${uniqueListIds.length} lists`);
      return;
    }
    
    console.log(`Fetching ${listsToFetch.length} uncached lists out of ${uniqueListIds.length} total lists`);
    
    // Fetch each list's details to get its name
    const fetchListNames = async () => {
      // Start with existing cached names
      const newNames: Record<string, string> = {};
      
      // Add already cached names first
      uniqueListIds.forEach(id => {
        if (window.listNameCache[id]) {
          newNames[id] = window.listNameCache[id];
        }
      });
      
      // Process in batches to avoid too many concurrent requests
      const batchSize = 5;
      for (let i = 0; i < listsToFetch.length; i += batchSize) {
        const batch = listsToFetch.slice(i, i + batchSize);
        
        const results = await Promise.all(batch.map(async (id) => {
          try {
            const response = await fetch(`/api/action-item-lists/${id}`);
            if (response.ok) {
              const list = await response.json();
              return { id, name: list.name };
            }
          } catch (err) {
            console.error(`Error fetching list name for ${id}:`, err);
          }
          return null;
        }));
        
        // Update names with successful results
        results.forEach(result => {
          if (result) {
            newNames[result.id] = result.name;
            window.listNameCache[result.id] = result.name; // Store in cache for future use
          }
        });
      }
      
      // Set all names at once to avoid multiple state updates
      setListNames(newNames);
    };
    
    fetchListNames();
  }, [actionItems]); // Remove listNames from dependencies

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

  // If we're viewing a parent list and hasAnyItems is false, show a special message
  if (categoryFilter && !hasAnyItems) {
    return (
      <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <p className="text-gray-700 font-medium mb-4">Parent Category View</p>
        <div className="mb-4">
          <svg 
            className="w-16 h-16 mx-auto text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" 
            />
          </svg>
        </div>
        <p className="text-gray-500 mb-2">This is a parent category that contains sub-lists</p>
        <p className="text-sm text-gray-500 mb-4">
          Click the expand arrow <span className="inline-block mx-1">▼</span> next to the category name in the sidebar to view its sub-lists.
        </p>
        <p className="text-sm text-gray-400">
          Action items are organized within the sub-lists, not directly in the parent category.
        </p>
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