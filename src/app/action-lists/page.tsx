'use client'

import React, { useState, useEffect } from 'react'
import { ListTodo, RefreshCw, Eye, ChevronDown, ChevronRight, Folder, PlusCircle, BookOpen, CheckSquare, TagIcon, HelpCircle, Trash2, Plus } from 'lucide-react'
import ClientLayout from '@/components/ClientLayout'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import Link from 'next/link'

/**
 * Interface for action list data
 */
interface ActionList {
  id: string;
  name: string;
  color: string;
  topicId?: string;
  parentId?: string;
  itemCount?: number;
  isVirtual?: boolean; // Flag for virtual lists created from prefixed items
  userId: string;
  createdAt: string;
}

/**
 * Interface for action item data
 */
interface ActionItem {
  id: string;
  content: string;
  isCompleted: boolean;
  notes?: string;
  ordinal: number;
  createdAt: string;
  updatedAt: string;
  listId?: string;
  noteId?: string;
  lastUpdated: string;
}

/**
 * Action Lists Page
 * 
 * Displays all action lists created by the user and allows viewing the items in each list
 */
export default function ActionListsPage() {
  // State for action lists, items, and UI
  const [isLoading, setIsLoading] = useState(true)
  const [actionLists, setActionLists] = useState<ActionList[]>([])
  const [listItems, setListItems] = useState<Record<string, ActionItem[]>>({})
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({})
  const [subLists, setSubLists] = useState<ActionList[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  // Get the authentication context
  const { isAuthenticated } = useAuth()
  
  /**
   * Determines if a list name represents a parent category
   * @param name The name of the list
   * @returns True if the list should be treated as a parent category
   */
  const isParentCategory = (name: string): boolean => {
    // Lists that are clearly parent categories
    const parentPhrases = [
      'Steps to',
      'How to',
      'Guide to',
      'Process for',
      'Checklist for',
      'Stages of',
      'Phases of'
    ];
    
    // Check for parent phrases
    if (parentPhrases.some(phrase => name.includes(phrase))) {
      return true;
    }
    
    // Business Plan is a special case that should be a parent
    if (name === 'Steps to Create a Business Plan') {
      return true;
    }
    
    return false;
  }
  
  /**
   * Finds the best parent match for a child list
   * @param childName The name of the child list
   * @param parentLists Array of potential parent lists
   * @returns The best matching parent list or null if no match found
   */
  const findBestParentMatch = (childName: string, parentLists: ActionList[]): ActionList | null => {
    // First, check for known business plan sections
    const businessPlanSections = [
      'Executive Summary',
      'Company Description',
      'Market Research',
      'Organization and Management',
      'Products or Services',
      'Marketing and Sales Strategy',
      'Funding Request',
      'Financial Projections',
      'Appendix'
    ];
    
    if (businessPlanSections.includes(childName)) {
      // Look for a business plan parent
      const businessPlanParent = parentLists.find(parent => 
        parent.name.includes('Business Plan'));
      
      if (businessPlanParent) {
        return businessPlanParent;
      }
    }
    
    // If no special case match, use generic semantic matching
    // Look for parent that seems most related to the child
    // For each parent, calculate how relevant it might be to this child
    const scoredParents = parentLists.map(parent => {
      let score = 0;
      
      // If child name appears anywhere in parent name, strong connection
      if (parent.name.includes(childName)) score += 5;
      
      // If parent name appears anywhere in child name, strong connection
      if (childName.includes(parent.name)) score += 5;
      
      // Look for common words (basic semantic matching)
      const parentWords = parent.name.toLowerCase().split(/\s+/);
      const childWords = childName.toLowerCase().split(/\s+/);
      
      for (const word of childWords) {
        if (word.length > 3 && parentWords.includes(word)) {
          score += 2;
        }
      }
      
      return { parent, score };
    });
    
    // Sort parents by score in descending order
    scoredParents.sort((a, b) => b.score - a.score);
    
    // Return the highest scoring parent if it has a minimum relevance score
    if (scoredParents.length > 0 && scoredParents[0].score >= 2) {
      return scoredParents[0].parent;
    }
    
    return null;
  }

  /**
   * Completely refreshes all data, clearing cache
   */
  const forceRefreshData = () => {
    // Display loading spinner
    setIsLoading(true);
    // Clear all cached data
    setActionLists([]);
    setListItems({});
    setExpandedLists({});
    setSubLists([]);
    
    // Show message
    toast.info("Force refreshing all data...", { autoClose: 1500 });
    
    // Delay slightly to ensure UI updates before fetch
    setTimeout(() => {
      fetchActionLists(true);
    }, 100);
  }
  
  /**
   * Fetches all action lists for the current user
   */
  const fetchActionLists = async (isForceRefresh = false) => {
    setIsLoading(true);
    try {
      // Add a cache-busting parameter to force fresh data from API
      const cacheBuster = isForceRefresh ? `?t=${new Date().getTime()}` : '';
      
      // Fetch the user's action lists
      const listsResponse = await fetch(`/api/action-item-lists${cacheBuster}`)
      if (!listsResponse.ok) throw new Error('Failed to fetch action lists')
      const allLists = await listsResponse.json()
      
      // Debug logging - check what lists we're getting from the API
      console.log('API returned action lists:', allLists)
      console.log('Total lists from API:', allLists.length)
      
      // The GET /api/action-item-lists endpoint doesn't return parentId
      // We need to fetch each list individually to get the full details
      const enhancedLists: ActionList[] = [];
      
      // First, normalize all lists with basic properties
      const normalizedLists = allLists.map((list: ActionList) => ({
        ...list,
        isVirtual: list.isVirtual || false,
        parentId: list.parentId || undefined,
        itemCount: list.itemCount || 0,
        userId: list.userId || '' // Ensure userId exists
      }));
      
      // Get full details for each list to find parent-child relationships
      for (const list of normalizedLists) {
        try {
          const detailResponse = await fetch(`/api/action-item-lists/${list.id}`);
          if (detailResponse.ok) {
            const detailedList = await detailResponse.json();
            // Update with full details, especially parentId
            enhancedLists.push({
              ...list,
              parentId: detailedList.parentId || undefined
            });
            
            console.log(`Enhanced list details for "${list.name}": parentId=${detailedList.parentId || 'none'}`);
          } else {
            // If detail fetch fails, use the original list data
            enhancedLists.push(list);
          }
        } catch (err) {
          console.error(`Error fetching details for list ${list.id}:`, err);
          enhancedLists.push(list);
        }
      }
      
      // Process the fetched lists to identify parent/child relationships
      let parentLists: ActionList[] = []
      let childLists: ActionList[] = []
      
      enhancedLists.forEach((list: ActionList) => {
        // Add debug output for each list to see its properties
        console.log(`Processing list: ${list.id}, Name: ${list.name}, ParentId: ${list.parentId}, IsVirtual: ${list.isVirtual}`)
        
        if (list.parentId) {
          childLists.push(list)
        } else {
          parentLists.push(list)
        }
      })
      
      console.log(`Found ${parentLists.length} parent lists and ${childLists.length} child lists`)
      
      // Debug output for parent lists
      console.log('Parent lists:', parentLists.map(list => ({ id: list.id, name: list.name, isVirtual: list.isVirtual })))
      
      // Now fetch all action items to identify virtual lists
      const itemsResponse = await fetch('/api/action-items?limit=1000')
      if (!itemsResponse.ok) throw new Error('Failed to fetch action items')
      const allItems = await itemsResponse.json()
      
      console.log(`Fetched ${allItems.length} action items for processing virtual lists`)
      
      // Virtual lists to be created
      const virtualLists: ActionList[] = []
      const virtualListItems: Record<string, ActionItem[]> = {}
      
      // Group action items by the list name in brackets/braces
      allItems.forEach((item: ActionItem) => {
        // Skip items that already have a listId - they're already associated with a list
        if (item.listId) {
          // If this item already has a list, make sure we have the items for that list
          if (!listItems[item.listId]) {
            // Initialize the list items array if needed
            listItems[item.listId] = [];
          }
          
          // Add item to its list's items
          listItems[item.listId].push(item);
          console.log(`Item with ID ${item.id} already has listId ${item.listId}, adding to list items`);
          return;
        }
        
        const match = item.content.match(/^\s*[\[\{](.*?)[\]\}]/)
        if (!match) return
        
        const listName = match[1].trim()
        if (!listName) return
        
        // Check if a real list with this name already exists
        const existingRealList = enhancedLists.find((l: ActionList) => 
          l.name.toLowerCase() === listName.toLowerCase());
        
        if (existingRealList) {
          // Don't create a virtual list, instead associate this item with the real list
          console.log(`Found matching real list "${listName}" with ID ${existingRealList.id} for item with bracket prefix`);
          
          // Initialize items array for this list if needed
          if (!listItems[existingRealList.id]) {
            listItems[existingRealList.id] = [];
          }
          
          // Add item to the real list's items
          listItems[existingRealList.id].push(item);
          
          // If the item has a listId that doesn't match, this could indicate a data issue
          if (item.listId && item.listId !== existingRealList.id) {
            console.warn(`Item has listId=${item.listId} but matched list name "${listName}" with ID ${existingRealList.id}`);
          }
          
          return; // Skip virtual list creation
        }
        
        // Create virtual list ID
        const listId = `virtual-${listName.toLowerCase().replace(/\s+/g, '-')}`
        
        // Check if we already created this virtual list
        const existingList = virtualLists.find(l => l.id === listId)
        
        if (!existingList) {
          // Create new virtual list
          const newList: ActionList = {
            id: listId,
            name: listName,
            color: 'light-blue',
            isVirtual: true,
            itemCount: 1,
            createdAt: new Date().toISOString(),
            userId: ''
          }
          
          virtualLists.push(newList)
          virtualListItems[listId] = [item]
          console.log(`Created virtual list: ${listName} with ID ${listId}`)
        } else {
          // Add item to existing virtual list
          existingList.itemCount = (existingList.itemCount || 0) + 1
          virtualListItems[listId] = [...(virtualListItems[listId] || []), item]
        }
      })
      
      console.log(`Created ${virtualLists.length} virtual lists from categorized items`)
      
      // Identify parent and child virtual lists
      const virtualParentLists: ActionList[] = []
      const virtualChildLists: ActionList[] = []
      
      virtualLists.forEach(list => {
        if (isParentCategory(list.name)) {
          virtualParentLists.push(list)
        } else {
          virtualChildLists.push(list)
        }
      })
      
      console.log(`Found ${virtualParentLists.length} virtual parent lists and ${virtualChildLists.length} virtual child lists`)
      
      // Assign parent-child relationships for virtual lists
      virtualChildLists.forEach(childList => {
        const parent = findBestParentMatch(childList.name, virtualParentLists)
        if (parent) {
          childList.parentId = parent.id
        }
      })
      
      // Combine all lists (regular and virtual)
      const combinedLists = [...enhancedLists, ...virtualLists]
      console.log(`Combined regular (${enhancedLists.length}) and virtual (${virtualLists.length}) lists for ${combinedLists.length} total lists`)
      
      // Save the lists in state
      setActionLists(combinedLists)
      
      // Set all virtual list items at once
      setListItems(prevItems => ({
        ...prevItems,
        ...virtualListItems
      }))
      
      // Force expand some lists to show hierarchy
      if (virtualParentLists.length > 0) {
        const expandStates: Record<string, boolean> = {}
        
        // Expand the first virtual parent list
        const firstVirtualParentId = virtualParentLists[0].id
        expandStates[firstVirtualParentId] = true
        
        // Also expand any child lists of this parent to demonstrate the hierarchy
        const childrenOfFirst = virtualChildLists
          .filter(list => list.parentId === firstVirtualParentId)
          .slice(0, 2) // Just expand first couple to avoid too much expansion
        
        childrenOfFirst.forEach(child => {
          expandStates[child.id] = true
        })
        
        setExpandedLists(prev => ({
          ...prev,
          ...expandStates
        }))
      }
      
    } catch (error) {
      console.error('Error fetching action lists:', error)
      toast.error('Failed to load action lists')
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Fetches all action items for a specific list
   * @param listId The ID of the list to fetch items for
   * @param forceFresh Whether to bypass cache
   */
  const fetchListItems = async (listId: string, forceFresh = false) => {
    // Skip fetching for virtual lists - we already have their items
    if (listId.startsWith('virtual-')) return
    
    try {
      const cacheBuster = forceFresh ? `&t=${new Date().getTime()}` : '';
      const response = await fetch(`/api/action-items?listId=${listId}${cacheBuster}`)
      if (!response.ok) throw new Error('Failed to fetch list items')
      const items = await response.json()
      
      // Update state with the fetched items
      setListItems(prevItems => ({
        ...prevItems,
        [listId]: items
      }))
    } catch (error) {
      console.error(`Error fetching items for list ${listId}:`, error)
      toast.error('Failed to load list items')
    }
  }
  
  /**
   * Gets child lists for a specific parent list
   * @param parentId ID of the parent list
   * @returns Array of child lists in reverse order (newest first)
   */
  const getChildLists = (parentId: string): ActionList[] => {
    // Filter lists to get only children of the specified parent
    const children = actionLists.filter(list => list.parentId === parentId);
    
    // Sort children by creation date in descending order (newest first)
    return children.sort((a, b) => {
      // Handle missing createdAt dates gracefully
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      
      // Return in reverse order (newest first)
      return dateB - dateA;
    });
  }

  /**
   * Checks if a list has any child lists
   * @param listId ID of the list to check
   * @returns True if the list has children
   */
  const hasChildLists = (listId: string): boolean => {
    return actionLists.some(list => list.parentId === listId);
  }

  /**
   * Toggles the expanded state of a list and all its children
   * @param listId ID of the list to toggle
   * @param expandChildren Whether to expand child lists too
   * @param forceFresh Whether to bypass cache when fetching items
   */
  const toggleListExpanded = (listId: string, expandChildren: boolean = false, forceFresh: boolean = false) => {
    // If we're expanding the list and haven't loaded items yet, fetch them (for non-virtual lists)
    const list = actionLists.find(l => l.id === listId)
    if (!expandedLists[listId] && (!listItems[listId] || forceFresh) && list && !list.isVirtual) {
      fetchListItems(listId, forceFresh)
    }
    
    // Create a new expanded state object
    const newExpandedState: Record<string, boolean> = {
      ...expandedLists,
      [listId]: !expandedLists[listId]
    }
    
    // If expanding the list and expandChildren is true, also expand all child lists
    if (newExpandedState[listId] && expandChildren) {
      const childLists = getChildLists(listId)
      childLists.forEach(childList => {
        newExpandedState[childList.id] = true
        
        // Also load child list items if needed
        if ((!listItems[childList.id] || forceFresh) && !childList.isVirtual) {
          fetchListItems(childList.id, forceFresh)
        }
      })
    }
    
    setExpandedLists(newExpandedState)
  }
  
  /**
   * Navigates to the action items page filtered by the selected list
   * @param listId ID of the list to view in action items page
   * @param showChildren Whether to include child lists in the view
   */
  const viewInActionItems = (listId: string, showChildren: boolean = true) => {
    // Use window.location to navigate to the action items page with this list selected
    window.location.href = `/action-items?listId=${listId}&showChildren=${showChildren}`;
  }
  
  /**
   * Refreshes all data without resetting UI state
   */
  const refreshData = () => {
    toast.info("Refreshing lists...", { autoClose: 1000 });
    fetchActionLists();
    // Don't clear listItems to avoid UI flicker
    setLastUpdated(new Date());
  }
  
  /**
   * Creates a test action item with a bracketed prefix for debugging
   */
  const createTestActionItem = async () => {
    try {
      const response = await fetch('/api/action-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: '[TEST LIST] This is a test action item created for debugging',
          messageId: null // Explicitly set to null to avoid foreign key constraint issues
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create test action item')
      }
      
      toast.success('Test action item created successfully')
      
      // Refresh the lists to pick up the new test item
      setTimeout(() => {
        fetchActionLists()
      }, 500)
    } catch (error) {
      console.error('Error creating test action item:', error)
      toast.error('Failed to create test action item')
    }
  }
  
  /**
   * Deletes an individual action item
   * @param itemId ID of the action item to delete
   * @param itemContent Content of the item for confirmation
   * @param listId ID of the list containing the item
   * @param event React event to prevent propagation
   */
  const deleteActionItem = async (itemId: string, itemContent: string, listId: string, event: React.MouseEvent) => {
    // Stop event propagation to prevent collapsing/expanding the list
    event.stopPropagation();
    
    // Get all items in this list
    const items = listItems[listId] || [];
    
    // Check if this item has child items (items that start with the same content as the parent)
    const cleanContent = cleanItemContent(itemContent, '');
    const childItems = items.filter(item => {
      // Skip the item itself
      if (item.id === itemId) return false;
      
      // Check if this item's content starts with the parent content
      const childCleanContent = cleanItemContent(item.content, '');
      return childCleanContent.startsWith(cleanContent + '.') || // For hierarchical items like "1. Item" -> "1.1 Subitem"
             childCleanContent.startsWith(cleanContent + ' - '); // For bullet-style items
    });
    
    // Prepare confirmation message
    const displayContent = itemContent.length > 40 ? `${itemContent.substring(0, 40)}...` : itemContent;
    let confirmMessage = `Delete action item "${displayContent}"?`;
    
    // If there are child items, include them in the confirmation
    if (childItems.length > 0) {
      confirmMessage += ` This will also delete ${childItems.length} sub-item${childItems.length === 1 ? '' : 's'}.`;
    }
    
    // Confirm deletion
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      // If there are child items, delete them first
      if (childItems.length > 0) {
        // Show a toast for deleting children if there are many
        const loadingToast = childItems.length > 2 ? 
          toast.info(`Deleting ${childItems.length} sub-items...`, { autoClose: false }) : null;
        
        // Delete each child item
        for (const childItem of childItems) {
          await fetch(`/api/action-items/${childItem.id}`, {
            method: 'DELETE'
          });
        }
        
        // Dismiss loading toast if it was shown
        if (loadingToast) toast.dismiss(loadingToast);
      }
      
      // Now delete the parent item
      const response = await fetch(`/api/action-items/${itemId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete action item');
      }
      
      // Show success message including info about sub-items if deleted
      let successMessage = 'Action item deleted successfully';
      if (childItems.length > 0) {
        successMessage += ` along with ${childItems.length} sub-item${childItems.length === 1 ? '' : 's'}`;
      }
      toast.success(successMessage);
      
      // Update the list items to remove the deleted items
      setListItems(prevItems => {
        const newItems = { ...prevItems };
        
        // Find which list this item belongs to and update it
        Object.keys(newItems).forEach(listId => {
          if (newItems[listId]) {
            // Remove the parent and all child items
            const itemsToRemove = [itemId, ...childItems.map(child => child.id)];
            newItems[listId] = newItems[listId].filter(item => !itemsToRemove.includes(item.id));
          }
        });
        
        return newItems;
      });
    } catch (error) {
      console.error('Error deleting action item:', error);
      toast.error('Failed to delete action item');
    }
  };
  
  /**
   * Deletes all action items within a virtual list
   * @param listId ID of the virtual list
   * @param listName Name of the list for confirmation
   * @param event React event to prevent propagation
   */
  const deleteAllItemsInVirtualList = async (listId: string, listName: string, event: React.MouseEvent) => {
    // Stop event propagation so the list doesn't expand/collapse
    event.stopPropagation();
    
    // Get all items in this virtual list
    const items = listItems[listId] || [];
    
    if (items.length === 0) {
      toast.info("This list has no items to delete.");
      return;
    }
    
    // Confirm deletion
    const confirmMessage = `Delete all ${items.length} items in the "${listName}" category? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      // Show loading toast for larger operations
      const loadingToast = items.length > 2 ? 
        toast.info(`Deleting ${items.length} items...`, { autoClose: false }) : null;
      
      // Delete each item
      for (const item of items) {
        await fetch(`/api/action-items/${item.id}`, {
          method: 'DELETE'
        });
      }
      
      // Dismiss loading toast if it was shown
      if (loadingToast) toast.dismiss(loadingToast);
      
      // Show success message
      toast.success(`Deleted all ${items.length} items in "${listName}" category.`);
      
      // Update the list items state without a full refresh
      setListItems(prevItems => ({
        ...prevItems,
        [listId]: []
      }));
      
      // Update the action lists without a full refresh
      setActionLists(prevLists => {
        // Find the virtual list and update its item count
        return prevLists.map(list => {
          if (list.id === listId) {
            return { ...list, itemCount: 0 };
          }
          return list;
        });
      });
      
      // Update the last updated timestamp
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error deleting items:', error);
      toast.error('Failed to delete all items');
    }
  };
  
  // Fetch action lists on component mount and when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchActionLists()
    }
  }, [isAuthenticated])
  
  /**
   * Cleans item content by removing list name prefixes in brackets or braces
   * @param content The original content text
   * @param listName Optional list name to specifically remove (if empty, removes any bracketed prefix)
   * @returns Cleaned content without the brackets/braces prefix
   */
  const cleanItemContent = (content: string, listName: string = ''): string => {
    if (!content) return '';
    
    // If list name is provided, try to remove that specific prefix
    if (listName) {
      // Create regex patterns for different bracket types with the list name
      const patterns = [
        new RegExp(`^\\s*\\[${listName}\\]\\s*`, 'i'),  // [ListName]
        new RegExp(`^\\s*\\{${listName}\\}\\s*`, 'i'),  // {ListName}
      ];
      
      // Try each pattern until one works
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return content.replace(pattern, '').trim();
        }
      }
    }
    
    // If no list name provided or specific prefix not found, try removing any bracketed prefix
    const genericPatterns = [
      /^\s*\[.*?\]\s*/,  // Any [Bracket]
      /^\s*\{.*?\}\s*/   // Any {Bracket}
    ];
    
    for (const pattern of genericPatterns) {
      if (pattern.test(content)) {
        return content.replace(pattern, '').trim();
      }
    }
    
    // If no pattern matched, just return the content
    return content;
  };
  
  /**
   * Deletes an action list by ID along with all its sublists (cascade delete)
   * @param listId ID of the list to delete
   * @param listName Name of the list for confirmation
   * @param isVirtual Whether the list is virtual (cannot be deleted)
   * @param event React event to prevent propagation
   * 
   * This function implements a cascading delete operation:
   * 1. It first identifies all child lists of the parent
   * 2. If the list has children, it warns the user and confirms deletion
   * 3. It deletes all child lists first (to avoid foreign key constraints)
   * 4. Then it deletes the parent list itself
   * 5. Finally, it refreshes the UI to reflect the changes
   */
  const deleteActionList = async (listId: string, listName: string, isVirtual: boolean, event: React.MouseEvent) => {
    // Stop event propagation so the list doesn't expand/collapse
    event.stopPropagation();
    
    // Cannot delete virtual lists
    if (isVirtual) {
      toast.warn("Virtual lists cannot be deleted directly. Remove the items to remove the list.");
      return;
    }
    
    // Find all sublists that would be deleted
    const childLists = getChildLists(listId);
    const childCount = childLists.length;
    
    // Create confirmation message, mentioning sublists if they exist
    let confirmMessage = `Are you sure you want to delete the list "${listName}"?`;
    if (childCount > 0) {
      confirmMessage += ` This will also delete all ${childCount} sublist${childCount === 1 ? '' : 's'} that belong to this list.`;
    }
    confirmMessage += " This action cannot be undone.";
    
    // For parent lists with children, add extra warning
    // Check if current list is a parent list by looking for other lists that have this as parent
    if (childCount > 0 && actionLists.some(list => list.id === listId && !list.parentId)) {
      confirmMessage = `⚠️ WARNING: You are deleting a parent list!\n\n${confirmMessage}`;
    }
    
    // Ask for confirmation before deleting
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      // Delete all child lists first (to avoid foreign key constraints)
      if (childLists.length > 0) {
        // Show loading toast for larger operations
        const loadingToast = childLists.length > 2 ? 
          toast.info(`Deleting ${childLists.length} sublists...`, { autoClose: false }) : null;
        
        // Delete each child list
        for (const childList of childLists) {
          await fetch(`/api/action-item-lists/${childList.id}`, {
            method: 'DELETE',
          });
        }
        
        // Dismiss loading toast if it was shown
        if (loadingToast) toast.dismiss(loadingToast);
      }
      
      // Now delete the parent list
      const response = await fetch(`/api/action-item-lists/${listId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete action list');
      }
      
      // Success message including info about sublists if deleted
      let successMessage = `List "${listName}" has been deleted`;
      if (childCount > 0) {
        successMessage += ` along with ${childCount} sublist${childCount === 1 ? '' : 's'}`;
      }
      toast.success(successMessage);
      
      // Update the lists in state directly instead of refreshing
      setActionLists(prevLists => {
        // Remove the deleted list and its children
        const deletedListIds = [listId, ...childLists.map(child => child.id)];
        return prevLists.filter(list => !deletedListIds.includes(list.id));
      });
      
      // Update last updated timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error deleting action list:', error);
      toast.error('Failed to delete action list or its sublists');
    }
  };
  
  /**
   * Renders an individual action list
   */
  const renderActionList = (list: ActionList) => {
    const isExpanded = expandedLists[list.id] || false
    const items = listItems[list.id] || []
    
    // Sort items by creation date (newest first)
    const sortedItems = [...items].sort((a, b) => {
      // Handle missing createdAt dates gracefully
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      
      // Return in reverse order (newest first)
      return dateB - dateA;
    });
    
    const hasItems = sortedItems.length > 0
    const isLoaded = !!listItems[list.id] || !!list.isVirtual
    const childLists = getChildLists(list.id)
    const hasChildren = childLists.length > 0
    
    // Debug the items for this list (will only show in browser console)
    if (isExpanded) {
      console.log(`Items for list ${list.name}:`, sortedItems)
    }
    
    // Get the background color class based on the list color
    const getColorClass = (color: string) => {
      switch(color) {
        case 'light-blue': return 'bg-blue-100 text-blue-800';
        case 'light-green': return 'bg-green-100 text-green-800';
        case 'light-purple': return 'bg-purple-100 text-purple-800';
        case 'light-orange': return 'bg-orange-100 text-orange-800';
        case 'light-pink': return 'bg-pink-100 text-pink-800';
        case 'light-teal': return 'bg-teal-100 text-teal-800';
        case 'light-yellow': return 'bg-yellow-100 text-yellow-800';
        case 'light-red': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    
    // For virtual lists, generate a consistent color based on the list name
    const getVirtualListColor = (name: string) => {
      const colors = ['light-blue', 'light-green', 'light-purple', 'light-orange', 
                     'light-pink', 'light-teal', 'light-yellow', 'light-red'];
      const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    }
    
    const listColor = list.isVirtual ? getVirtualListColor(list.name) : list.color;
    
    return (
      <div key={list.id} className={`mb-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm ${list.parentId ? 'border-l-4 border-l-blue-300' : ''}`}>
        <div 
          className="flex items-center justify-between p-4 bg-white border-b border-gray-200 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleListExpanded(list.id)}
        >
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500 mr-2" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500 mr-2" />
            )}
            <div className={`h-6 w-1 mr-3 rounded ${getColorClass(listColor)}`}></div>
            <div>
              <span className="font-medium text-gray-800">{list.name}</span>
              {list.parentId && (
                <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                  Sub-list
                </span>
              )}
              {hasChildren && (
                <span className="ml-2 px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">
                  {childLists.length} {childLists.length === 1 ? 'sublist' : 'sublists'}
                </span>
              )}
              {list.topicId && (
                <span className="ml-2 text-xs text-gray-500">
                  (Topic: {list.topicId.replace(/-/g, ' ')})
                </span>
              )}
              {list.isVirtual && list.itemCount && (
                <span className="ml-2 text-xs text-gray-500">
                  ({list.itemCount} items)
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {/* View in Action Items button */}
            <button
              className="p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center mr-2"
              onClick={(e) => {
                e.stopPropagation();
                viewInActionItems(list.id, true);
              }}
              title="View in Action Items page"
            >
              <Eye size={16} className="mr-1" />
              <span className="text-sm">View</span>
            </button>
            
            {/* Refresh this list button */}
            <button
              className="p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-full"
              title="Refresh this list"
              onClick={(e) => {
                e.stopPropagation();
                if (isExpanded) {
                  toggleListExpanded(list.id, hasChildLists(list.id), true);
                  toast.info(`Refreshing "${list.name}" list...`, { autoClose: 1000 });
                } else {
                  toggleListExpanded(list.id, hasChildLists(list.id), true);
                }
              }}
            >
              <RefreshCw size={14} />
            </button>
            
            {list.isVirtual ? (
              <button
                className="flex items-center px-2 py-1 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-md ml-2 
                  border border-red-200"
                title={`Delete all items in this category (${list.itemCount || 0} items)`}
                onClick={(e) => deleteAllItemsInVirtualList(list.id, list.name, e)}
              >
                <Trash2 size={16} />
                <span className="ml-1 text-xs">All Items</span>
              </button>
            ) : (
              <button
                className={`flex items-center px-2 py-1 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-md ml-2 
                  ${hasChildren ? 'border border-red-200 bg-red-50' : ''}`}
                title={hasChildren ? `Delete this list and all its sublists (${childLists.length} sublist${childLists.length === 1 ? '' : 's'})` : 'Delete this list'}
                onClick={(e) => deleteActionList(list.id, list.name, list.isVirtual === true, e)}
              >
                <Trash2 size={16} />
                {hasChildren && (
                  <span className="ml-1 text-xs">+ {childLists.length} sublist{childLists.length === 1 ? '' : 's'}</span>
                )}
              </button>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-4 bg-gray-50">
            {!isLoaded ? (
              <div className="flex justify-center items-center py-4">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-500 mr-2" />
                <span className="text-gray-600">Loading items...</span>
              </div>
            ) : hasItems ? (
              <>
                <div className="mb-3 text-xs text-gray-500">
                  Showing {sortedItems.length} items in this list
                </div>
                <ul className="space-y-2">
                  {sortedItems.map(item => (
                    <li key={item.id} className="flex items-center p-2 border border-gray-200 bg-white rounded-md">
                      <div className={`flex-shrink-0 w-5 h-5 mr-3 ${item.isCompleted ? 'text-green-500' : 'text-gray-300'}`}>
                        {item.isCompleted ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        )}
                      </div>
                      <span className={`flex-1 ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {/* Use the helper function to clean item content */}
                        {cleanItemContent(item.content, list.name)}
                      </span>
                      <button
                        className="p-1 text-gray-400 hover:text-red-500 rounded-full ml-2"
                        onClick={(e) => deleteActionItem(item.id, item.content, list.id, e)}
                        title="Delete Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Folder className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>This list is empty</p>
                <Link 
                  href="/action-items" 
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  <PlusCircle size={14} className="mr-1" />
                  Add items
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
  
  /**
   * Renders a section of lists with appropriate header
   */
  const renderListSection = (title: string, lists: ActionList[], icon: React.ReactNode) => {
    // Debug what lists we're trying to render in each section
    console.log(`Rendering section "${title}" with ${lists.length} lists:`, lists.map(l => ({ id: l.id, name: l.name, parentId: l.parentId, isVirtual: l.isVirtual })));
    
    if (lists.length === 0) return null;
    
    // Sort lists by creation date (newest first)
    const sortedLists = [...lists].sort((a, b) => {
      // Handle missing createdAt dates gracefully
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      
      // Return in reverse order (newest first)
      return dateB - dateA;
    });
    
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            {icon}
            <span className="ml-2">{title}</span>
          </div>
          <span className="text-sm font-normal text-gray-500">
            {lists.length} list{lists.length !== 1 ? 's' : ''}
          </span>
        </h2>
        <div className="space-y-2">
          {sortedLists.map(list => renderListWithChildren(list, 0))}
        </div>
      </div>
    );
  }
  
  /**
   * Renders an action list with all its children
   */
  const renderListWithChildren = (list: ActionList, level: number) => {
    // Get all immediate children of this list
    const children = getChildLists(list.id);
    
    // Debug output to trace rendering of parent-child relationships
    if (children.length > 0) {
      console.log(`List "${list.name}" (${list.id}) has ${children.length} children:`, 
        children.map(child => ({ id: child.id, name: child.name })));
    }
    
    return (
      <div key={list.id} className="mb-2">
        {/* Render this list */}
        <div style={{ marginLeft: `${level * 20}px` }}>
          {renderActionList(list)}
        </div>
        
        {/* If this list is expanded and has children, render them recursively */}
        {expandedLists[list.id] && children.length > 0 && (
          <div className="mt-2">
            {children.map(childList => (
              <div 
                key={childList.id} 
                style={{ marginLeft: `${(level + 1) * 20}px` }}
                className="border-l-2 border-gray-200 pl-3 ml-3"
              >
                {renderListWithChildren(childList, level + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  /**
   * Creates a test parent list with a child list for debugging
   */
  const createTestParentList = async () => {
    try {
      // First create the parent list
      const parentResponse = await fetch('/api/action-item-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Test Parent List ${new Date().toISOString().slice(11, 19)}`,
          color: 'light-purple'
        })
      });
      
      if (!parentResponse.ok) {
        throw new Error('Failed to create parent test list');
      }
      
      const parentList = await parentResponse.json();
      
      // Then create a child list with parentId relationship
      const childResponse = await fetch('/api/action-item-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Child of ${parentList.title}`,
          color: 'light-green',
          parentId: parentList.id // This creates the parent-child relationship
        })
      });
      
      if (!childResponse.ok) {
        throw new Error('Failed to create child test list');
      }
      
      toast.success('Test parent and child lists created successfully');
      
      // Refresh the lists to show the new test lists
      setTimeout(() => {
        fetchActionLists(true);
      }, 500);
    } catch (error) {
      console.error('Error creating test lists:', error);
      toast.error('Failed to create test lists');
    }
  }
  
  return (
    <ClientLayout>
      <main className="flex flex-col min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Action Lists</h1>
              <p className="text-gray-600">
                Manage and view your action lists. Click on a list to see the tasks within it.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={refreshData}
                className="p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center"
                title="Refresh lists"
              >
                <RefreshCw size={16} className="mr-1" />
                <span className="text-sm">Refresh</span>
              </button>
              <button 
                onClick={forceRefreshData}
                className="p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center"
                title="Force refresh all data"
              >
                <RefreshCw size={16} className="mr-1" />
                <span className="text-sm">Force Refresh</span>
              </button>
              <button 
                onClick={createTestParentList}
                className="p-2 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 flex items-center"
                title="Create test parent and child lists"
              >
                <Plus size={16} className="mr-1" />
                <span className="text-sm">Create Test Lists</span>
              </button>
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Authentication check */}
          {!isAuthenticated ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
              <p className="text-amber-700 mb-4">
                Please sign in to view and manage your action lists.
              </p>
              <button
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {/* Handle sign in */}}
              >
                Sign In
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mr-2" />
              <span className="text-gray-600">Loading action lists...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* HowTo Guide Section */}
              {renderListSection(
                "From HowTo Guide",
                actionLists.filter(list => !list.isVirtual && !list.parentId && list.name.includes("HowTo")),
                <BookOpen className="h-5 w-5 text-blue-600" />
              )}
              
              {/* Standard Action Lists - Only show parent lists (no parentId) */}
              {renderListSection(
                "Your Action Lists",
                actionLists.filter(list => 
                  !list.isVirtual && // Not a virtual list
                  !list.parentId &&  // Is a parent list (not a sublist)
                  !list.name.includes("HowTo") && // Not a HowTo guide 
                  list.id !== "default" // Not the default list
                ),
                <ListTodo className="h-5 w-5 text-green-600" />
              )}
              
              {/* Virtual Parent Lists */}
              {renderListSection(
                "Categorized Items",
                actionLists.filter(list => list.isVirtual && !list.parentId),
                <TagIcon className="h-5 w-5 text-purple-600" />
              )}
              
              {/* If no lists at all, show a message */}
              {actionLists.length === 0 && !isLoading && (
                <div className="bg-white rounded-lg p-8 text-center">
                  <ListTodo className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Action Lists Yet</h3>
                  <p className="text-gray-500 mb-4">
                    Create action lists from your conversations or use the HowTo Guide to generate step-by-step action lists automatically.
                  </p>
                  <Link 
                    href="/howto" 
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <HelpCircle className="h-5 w-5 mr-2" />
                    Try the HowTo Guide
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </ClientLayout>
  )
} 