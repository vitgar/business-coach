'use client'

import React, { useState, useEffect } from 'react'
import { ListTodo, RefreshCw, Eye, ExternalLink, ChevronDown, ChevronRight, Folder, PlusCircle, BookOpen, CheckSquare, TagIcon, HelpCircle } from 'lucide-react'
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
   * Fetches all action lists for the current user
   */
  const fetchActionLists = async () => {
    setIsLoading(true)
    try {
      // Fetch the user's action lists
      const listsResponse = await fetch('/api/action-item-lists')
      if (!listsResponse.ok) throw new Error('Failed to fetch action lists')
      const allLists = await listsResponse.json()
      
      // Process the fetched lists to identify parent/child relationships
      let parentLists: ActionList[] = []
      let subLists: ActionList[] = []
      
      allLists.forEach((list: ActionList) => {
        if (list.parentId) {
          subLists.push(list)
        } else {
          parentLists.push(list)
        }
      })
      
      // Create virtual lists from action items with bracketed prefixes
      const itemsResponse = await fetch('/api/action-items')
      if (!itemsResponse.ok) throw new Error('Failed to fetch action items')
      const allItems = await itemsResponse.json()
      
      // Log raw items for debugging
      console.log('All action items:', allItems)
      
      // Track virtual lists and their associated items
      const virtualLists: ActionList[] = []
      const virtualListItems: Record<string, ActionItem[]> = {}
      
      // Process all items to detect virtual lists
      allItems.forEach((item: ActionItem) => {
        // Look for patterns like [Title] or {Title} at the beginning of the content
        const bracketMatch = item.content.match(/^\s*[\[\{](.*?)[\]\}]/)
        
        if (bracketMatch) {
          const listName = bracketMatch[1].trim()
          
          // Skip empty list names
          if (!listName) return
          
          // Generate a consistent ID for the virtual list based on its name
          const listId = `virtual-${listName.toLowerCase().replace(/\s+/g, '-')}`
          
          // Check if we already added this virtual list
          const existingList = virtualLists.find(l => l.id === listId)
          
          if (!existingList) {
            // Create a new virtual list
            virtualLists.push({
              id: listId,
              name: listName,
              color: 'light-blue', // Will be replaced with a generated color
              isVirtual: true,
              itemCount: 1,
              createdAt: new Date().toISOString(),
              userId: '',
            })
            // Initialize the items array for this list
            virtualListItems[listId] = [item]
            console.log(`Created virtual list: ${listName} with ID ${listId}`)
          } else {
            // Increment the count for existing virtual list
            existingList.itemCount = (existingList.itemCount || 0) + 1
            // Add this item to the list's items
            virtualListItems[listId] = [...(virtualListItems[listId] || []), item]
            console.log(`Added item to virtual list: ${listName}`)
          }
        }
      })
      
      console.log('Created virtual lists:', virtualLists)
      
      // Categorize virtual lists as parents or children
      const virtualParentLists: ActionList[] = []
      const virtualChildLists: ActionList[] = []
      
      // First pass: Identify parent and child lists
      virtualLists.forEach(list => {
        if (isParentCategory(list.name)) {
          virtualParentLists.push(list)
        } else {
          virtualChildLists.push(list)
        }
      })
      
      console.log('Virtual parent lists:', virtualParentLists)
      console.log('Virtual child lists:', virtualChildLists)
      
      // Second pass: Establish parent-child relationships
      virtualChildLists.forEach(childList => {
        const parent = findBestParentMatch(childList.name, virtualParentLists)
        if (parent) {
          childList.parentId = parent.id
          console.log(`Set list "${childList.name}" as child of "${parent.name}"`)
        }
      })
      
      // Combine all lists: regular parent lists, virtual parent lists, and all sublists/virtual child lists
      const allParentLists = [...parentLists, ...virtualParentLists.filter(l => !l.parentId)]
      const allChildLists = [...subLists, ...virtualChildLists.filter(l => l.parentId)]
      
      // IMPORTANT: Set the state for all lists
      setActionLists([...allParentLists, ...allChildLists])
      setSubLists(allChildLists)
      
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
   */
  const fetchListItems = async (listId: string) => {
    // Skip fetching for virtual lists - we already have their items
    if (listId.startsWith('virtual-')) return
    
    try {
      const response = await fetch(`/api/action-items?listId=${listId}`)
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
   * @returns Array of child lists
   */
  const getChildLists = (parentId: string): ActionList[] => {
    return actionLists.filter(list => list.parentId === parentId);
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
   */
  const toggleListExpanded = (listId: string, expandChildren: boolean = false) => {
    // If we're expanding the list and haven't loaded items yet, fetch them (for non-virtual lists)
    const list = actionLists.find(l => l.id === listId)
    if (!expandedLists[listId] && !listItems[listId] && list && !list.isVirtual) {
      fetchListItems(listId)
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
        if (!listItems[childList.id] && !childList.isVirtual) {
          fetchListItems(childList.id)
        }
      })
    }
    
    setExpandedLists(newExpandedState)
  }
  
  /**
   * Refreshes all data
   */
  const refreshData = () => {
    fetchActionLists()
    setListItems({}) // Clear cached items
    setLastUpdated(new Date())
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
  
  // Fetch action lists on component mount and when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchActionLists()
    }
  }, [isAuthenticated])
  
  // Set up periodic polling to refresh data automatically every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return
    
    // Immediate fetch on first load
    fetchActionLists()
    
    // Set up polling interval
    const pollingInterval = setInterval(() => {
      fetchActionLists()
    }, 30000) // 30 seconds
    
    // Clean up on component unmount
    return () => {
      clearInterval(pollingInterval)
    }
  }, [isAuthenticated])
  
  /**
   * Renders an individual action list
   */
  const renderActionList = (list: ActionList) => {
    const isExpanded = expandedLists[list.id] || false
    const items = listItems[list.id] || []
    const hasItems = items.length > 0
    const isLoaded = !!listItems[list.id] || !!list.isVirtual
    const childLists = getChildLists(list.id)
    const hasChildren = childLists.length > 0
    
    // Debug the items for this list (will only show in browser console)
    if (isExpanded) {
      console.log(`Items for list ${list.name}:`, items)
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
    
    /**
     * Helper function to clean item content for virtual lists
     * Removes the brackets and list name prefix from the beginning of the item
     */
    const cleanItemContent = (content: string, listName: string) => {
      if (!list.isVirtual) return content
      
      // Create regex patterns for different bracket types with the list name
      const patterns = [
        new RegExp(`^\\s*\\[${listName}\\]\\s*`, 'i'),  // [ListName]
        new RegExp(`^\\s*\\{${listName}\\}\\s*`, 'i'),  // {ListName}
        new RegExp(`^\\s*\\[.*?\\]\\s*`, 'i'),          // Any [Bracket]
        new RegExp(`^\\s*\\{.*?\\}\\s*`, 'i')           // Any {Bracket}
      ]
      
      // Try each pattern until one works
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return content.replace(pattern, '').trim()
        }
      }
      
      // If no pattern matched, just return the content
      return content
    }
    
    return (
      <div key={list.id} className={`mb-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm ${list.parentId ? 'border-l-4 border-l-blue-300' : ''}`}>
        <div 
          className="flex items-center justify-between p-4 bg-white border-b border-gray-200 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleListExpanded(list.id, hasChildLists(list.id))}
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
            {list.isVirtual ? (
              <Link 
                href={`/action-items`} 
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"
                title="View All Items"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={16} />
              </Link>
            ) : (
              <Link 
                href={`/action-items?listId=${list.id}`}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"
                title="View in Action Items"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={16} />
              </Link>
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
                  Showing {items.length} items in this list
                </div>
                <ul className="space-y-2">
                  {items.map(item => (
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
    if (lists.length === 0) return null;
    
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </h2>
        <div className="space-y-2">
          {lists.map(list => renderListWithChildren(list, 0))}
        </div>
      </div>
    );
  }
  
  /**
   * Renders an action list with all its children
   */
  const renderListWithChildren = (list: ActionList, level: number) => {
    const children = getChildLists(list.id);
    
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
            <div className="flex flex-col items-end">
              <button 
                onClick={refreshData}
                className="flex items-center px-3 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 mb-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Lists
              </button>
              <button 
                onClick={createTestActionItem}
                className="flex items-center px-3 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 mb-2"
                disabled={isLoading}
              >
                <PlusCircle size={16} className="mr-2" />
                Create Test Item
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
              {/* Debug information - visible always (temporarily) */}
              <div className="bg-gray-100 p-4 rounded-md mb-4 text-xs font-mono">
                <h3 className="font-bold mb-2">Debug Info:</h3>
                <p>Total Action Lists: {actionLists.length}</p>
                <p>Total Sublists: {subLists.length}</p>
                <p>Standard Lists: {actionLists.filter(list => !list.isVirtual && !list.parentId).length}</p>
                <p>Virtual Lists: {actionLists.filter(list => list.isVirtual).length}</p>
                <p>First virtual list: {actionLists.find(list => list.isVirtual)?.name || 'None'}</p>
                <p>List IDs: {actionLists.map(list => list.id).join(', ')}</p>
              </div>
              
              {/* HowTo Guide Section */}
              {renderListSection(
                "From HowTo Guide",
                actionLists.filter(list => !list.isVirtual && !list.parentId && list.name.includes("HowTo")),
                <BookOpen className="h-5 w-5 text-blue-600" />
              )}
              
              {/* Standard Action Lists */}
              {renderListSection(
                "Your Action Lists",
                actionLists.filter(list => !list.isVirtual && !list.parentId && !list.name.includes("HowTo")),
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
                  <ListTodo className="h-12 w-12 mx-auto text-gray-300 mb-4" />
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