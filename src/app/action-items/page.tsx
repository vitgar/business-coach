'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { ListTodo, RefreshCw, Plus, X, Send, Loader2, TagIcon, BookOpen, Folder, ChevronRight, ListChecks } from 'lucide-react'
import ClientLayout from '@/components/ClientLayout'
import ActionItemsList from '@/components/action-items/ActionItemsList'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import Link from 'next/link'

/**
 * Interface for categorized action items
 */
interface Category {
  name: string;
  count: number;
  completedCount: number; // Number of completed items in this category
  isParent: boolean;
  parentName?: string;
  id: string;
  ordinal?: number;
}

/**
 * Action Items Page
 * 
 * Shows all action items for the user
 * These action items are extracted automatically from assistant messages
 * Users can also manually add new action items
 */
export default function ActionItemsPage() {
  // Add refs to track component lifecycle and prevent excessive renders
  const hasFetchedInitialData = useRef(false)
  const inProgressApiCalls = useRef(new Set())
  
  const { isAuthenticated } = useAuth()
  const [key, setKey] = useState(0) // Used to force re-render of ActionItemsList
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [completedItems, setCompletedItems] = useState(0)
  const [actionLists, setActionLists] = useState<any[]>([])
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({
    allItems: false // Initialize with allItems property
  })
  // Add dropdown state at component level
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Use our custom hook for fetching lists with caching
  const { isFetching, fetchList, fetchMultipleLists, fetchAllLists } = useFetchLists();

  /**
   * Determines if a category name represents a parent category
   */
  const isParentCategory = (name: string): boolean => {
    // Categories that are clearly parent categories
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
   * Finds the best parent match for a virtual category based on semantic matching
   */
  const findBestVirtualParent = (childName: string, parentCategories: Category[]): string | undefined => {
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
      const businessPlanParent = parentCategories.find(parent => 
        parent.name.includes('Business Plan'));
      
      if (businessPlanParent) {
        return businessPlanParent.name;
      }
    }
    
    // If no special case match, use generic semantic matching
    // Look for parent that seems most related to the child
    // For each parent, calculate how relevant it might be to this child
    const scoredParents = parentCategories.map(parent => {
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
      return scoredParents[0].parent.name;
    }
    
    return undefined;
  }

  /**
   * Find parent category by ID
   */
  const findParentById = (parentId: string, categories: Category[]): Category | undefined => {
    return categories.find(cat => cat.id === parentId);
  }

  /**
   * Fetches categories from action items and action lists
   */
  const fetchCategories = async () => {
    if (!isAuthenticated) return;
    
    // Check if we're already fetching categories to prevent duplicate calls
    if (inProgressApiCalls.current.has('fetchCategories')) {
      console.log('Categories fetch already in progress, skipping duplicate call');
      return;
    }
    
    // Mark this API call as in progress
    inProgressApiCalls.current.add('fetchCategories');
    setIsLoadingCategories(true);
    
    try {
      // First fetch all action items to extract virtual categories from bracket prefixes
      const response = await fetch('/api/action-items?limit=1000');
      
      if (!response.ok) {
        throw new Error('Failed to fetch action items');
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.length} action items for categories`);
      
      // Extract categories from bracket prefixes in item content
      const extractedCategories = new Map<string, { count: number, completedCount: number }>();
      
      // Process action items to extract virtual categories
      data.forEach((item: any) => {
        // Check if this item belongs to a specific actionItemList by listId
        if (item.listId) {
          // We'll handle these separately by fetching list data
          return;
        }
        
        // Extract category from bracket prefixes like [Category] or {Category}
        const match = item.content.match(/^\s*[\[\{](.*?)[\]\}]/);
        if (!match) return;
        
        const categoryName = match[1].trim();
        if (!categoryName) return;
        
        // Update or initialize the category
        if (extractedCategories.has(categoryName)) {
          const category = extractedCategories.get(categoryName)!;
          category.count++;
          if (item.isCompleted) {
            category.completedCount++;
          }
        } else {
          extractedCategories.set(categoryName, {
            count: 1,
            completedCount: item.isCompleted ? 1 : 0
          });
        }
      });
      
      // Now fetch all action item lists to include them as categories
      // We can use the direct API response since it now includes parentId
      const listsResponse = await fetch('/api/action-item-lists');
      if (!listsResponse.ok) {
        throw new Error('Failed to fetch action lists');
      }
      const lists = await listsResponse.json();
      console.log(`Fetched ${lists.length} action lists from API with parentId information`);
      
      // Convert to array of Category objects
      const allCategories: Category[] = [];
      
      // First, process the action item lists
      lists.forEach((list: any) => {
        // Skip special lists
        if (list.id === 'default') return;
        
        // Determine if this is a parent or child list based on parentId from API
        // A list is a parent if it has no parentId of its own
        const isParent = !list.parentId;
        
        // Get parent name directly from API data if parentId exists
        const parentName = list.parentId 
          ? lists.find((l: any) => l.id === list.parentId)?.name 
          : undefined;
        
        // Get item count from items associated with this list
        const itemsInList = data.filter((item: any) => item.listId === list.id);
        const count = itemsInList.length;
        const completedCount = itemsInList.filter((item: any) => item.isCompleted).length;
        
        allCategories.push({
          id: list.id,
          name: list.name,
          count,
          completedCount,
          isParent,
          parentName,
          ordinal: list.ordinal || 0 // Include ordinal value
        });
      });
      
      // Next, add the virtual categories extracted from item prefixes
      extractedCategories.forEach((stats, name) => {
        // Skip if we already have this category (real list takes precedence)
        if (allCategories.some(cat => cat.name === name)) return;
        
        // Determine if this is a parent category
        const isParent = isParentCategory(name);
        
        allCategories.push({
          id: `virtual-${name.replace(/\s+/g, '-').toLowerCase()}`,
          name,
          count: stats.count,
          completedCount: stats.completedCount,
          isParent,
          parentName: undefined
        });
      });
      
      // Now assign parent-child relationships for the virtual categories
      const parentCategories = allCategories.filter(cat => cat.isParent);
      
      // Virtual categories (from bracket prefixes) might need parent assignment
      // but real lists already have correct parentId from the API
      allCategories.forEach(category => {
        if (category.id.startsWith('virtual-') && !category.isParent && !category.parentName) {
          // For virtual categories, we'll still use the semantic matching
          // This is only needed for virtual categories extracted from brackets
          const bestParent = findBestVirtualParent(category.name, parentCategories);
          if (bestParent) {
            category.parentName = bestParent;
          }
        }
      });
      
      // Calculate total items and completed items
      const totalItemCount = data.length;
      const completedItemCount = data.filter((item: any) => item.isCompleted).length;
      
      // Batch state updates together to reduce renders
      setTotalItems(totalItemCount);
      setCompletedItems(completedItemCount);
      setCategories(allCategories);
      setActionLists(lists);
      
      console.log(`Processed ${allCategories.length} categories in total`);
      hasFetchedInitialData.current = true;
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoadingCategories(false);
      // Remove this API call from the in-progress set
      inProgressApiCalls.current.delete('fetchCategories');
    }
  }

  // Refresh action items list
  const refreshList = () => {
    setKey(prev => prev + 1);
    fetchCategories();
  }

  // Open the new item form
  const openNewItemForm = () => {
    setIsAddingItem(true)
    setNewItemText('')
  }

  // Close the new item form
  const closeNewItemForm = () => {
    setIsAddingItem(false)
    setNewItemText('')
  }

  // Create a new action item
  const createActionItem = async () => {
    if (!newItemText.trim()) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/action-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newItemText.trim(),
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create action item')
      }
      
      toast.success('Action item created')
      refreshList()
      closeNewItemForm()
    } catch (error) {
      console.error('Error creating action item:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create action item')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle URL parameters
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;
    
    // Avoid re-running this effect if the category was already selected programmatically
    if (selectedCategory !== null) return;
    
    // Extract params from URL
    const params = new URLSearchParams(window.location.search);
    const listId = params.get('listId');
    const showChildren = params.get('showChildren') === 'true';
    
    if (listId) {
      console.log(`URL contains listId=${listId}, showChildren=${showChildren}`);
      
      // If showing a specific list, find the matching category
      const matchingList = actionLists.find(list => list.id === listId);
      if (matchingList) {
        console.log(`Found matching list for ID ${listId}: ${matchingList.name}`);
        // Use a local flag to avoid re-triggering the URL update in selectCategory
        const skipUrlUpdate = true;
        selectCategory(matchingList.name);
      } else {
        console.log(`No matching list found for ID: ${listId}, will fetch details`);
        // Fetch the list details to get the name
        fetchListDetails(listId);
      }
    }
  }, [isAuthenticated, actionLists]);

  /**
   * Selects a category to filter the action items list
   * @param name Category name to filter by
   */
  const selectCategory = (name: string | null) => {
    console.log(`Selecting category: ${name || 'All'}`);
    
    // Only update if the category is actually changing to prevent unnecessary renders
    if (selectedCategory === name) return;
    
    setSelectedCategory(name);
    
    // Special handling for child categories
    if (name !== null) {
      // Check if this is a child category
      const category = categories.find(cat => cat.name === name);
      if (category && category.parentName) {
        // This is a child category, make sure the parent is expanded
        setExpandedParents(prev => ({
          ...prev,
          [category.parentName as string]: true
        }));
        
        // Set flag to show child categories under the parent
        localStorage.setItem('showingParentList', 'true');
      }
    } else {
      // When selecting "All Items", clear the showingParentList flag
      localStorage.removeItem('showingParentList');
      
      // Also clear the listId from URL to avoid confusion when selecting "All Items"
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('listId');
          url.searchParams.delete('category');
          window.history.pushState({}, '', url);
        }, 0);
      }
    }
    
    // Update URLSearchParams without reloading the page
    // Use setTimeout to break the update cycle by deferring the URL update
    if (typeof window !== 'undefined' && name !== null) {
      setTimeout(() => {
        const url = new URL(window.location.href);
        
        // Only update the category param if:
        // 1. We're NOT in a list view (no listId in URL)
        // 2. This is a parent category
        const isParentCategory = categories.find(cat => cat.name === name && cat.isParent);
        const hasListId = url.searchParams.has('listId');
        
        if (isParentCategory || !hasListId) {
          // For parent categories, use category param
          if (name) {
            url.searchParams.set('category', encodeURIComponent(name));
          } else {
            url.searchParams.delete('category');
          }
          
          // For parent categories, we should also clear any listId to avoid confusion
          if (isParentCategory) {
            url.searchParams.delete('listId');
          }
          
          window.history.pushState({}, '', url);
        }
      }, 0);
    }
  };
  
  // Toggle dropdown visibility
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
    
    // When opening/closing dropdown, toggle the allItems expanded state
    setExpandedParents(prev => ({
      ...prev,
      allItems: !prev.allItems
    }));
  }, []);
  
  /**
   * Toggle expansion of parent categories
   */
  const toggleParentExpansion = (categoryName: string) => {
    const isCurrentlyExpanded = expandedParents[categoryName] || false;

    // Set expanded state for this parent
    setExpandedParents(prev => {
      const newState = { 
        ...prev, 
        [categoryName]: !isCurrentlyExpanded 
      };
      return newState;
    });

    // Also update localStorage
    if (!isCurrentlyExpanded) {
      // When expanding, add to list
      const expandedParentsList = JSON.parse(localStorage.getItem('expandedParents') || '[]');
      if (!expandedParentsList.includes(categoryName)) {
        expandedParentsList.push(categoryName);
        localStorage.setItem('expandedParents', JSON.stringify(expandedParentsList));
      }
      
      // When expanding a parent, also set a flag to show child categories
      localStorage.setItem('showingParentList', 'true');
    } else {
      // When collapsing, remove from list
      const expandedParentsList = JSON.parse(localStorage.getItem('expandedParents') || '[]');
      const updatedList = expandedParentsList.filter((name: string) => name !== categoryName);
      localStorage.setItem('expandedParents', JSON.stringify(updatedList));
      
      // If no parents are expanded, remove the child category flag
      if (updatedList.length === 0) {
        localStorage.removeItem('showingParentList');
      }
    }
  };

  // Fetch categories when component mounts
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Only fetch data if we haven't already or if specifically requested via key change
    if (!hasFetchedInitialData.current) {
      console.log('Initial data fetch');
      fetchCategories();
    }
  }, [isAuthenticated]);
  
  /**
   * Fetch details for a specific list by ID
   * @param listId The ID of the list to fetch
   */
  const fetchListDetails = useCallback(async (listId: string) => {
    try {
      // Check if we already have this list in our actionLists state
      const cachedList = actionLists.find(list => list.id === listId);
      if (cachedList) {
        console.log(`Using cached list: ${cachedList.name} with ID ${listId}`);
        selectCategory(cachedList.name);
        return;
      }
      
      // Fetch list details directly from API
      const response = await fetch(`/api/action-item-lists/${listId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load list ${listId}`);
      }
      
      const list = await response.json();
      console.log(`Found list: ${list.name} with ID ${listId}`);
      
      // Update selected category based on list name
      selectCategory(list.name);
      
      // Force refresh the action items list
      setKey(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching list details:', error);
      toast.error('Failed to load the requested list');
    }
  }, [actionLists]); // Only depend on actionLists
  
  // Initialize expanded state based on URL parameters when component mounts
  useEffect(() => {
    if (!isAuthenticated || categories.length === 0 || typeof window === 'undefined') return;
    
    // Only run this once when categories are first loaded
    const expandedStateKey = 'expandedStateInitialized';
    if (sessionStorage.getItem(expandedStateKey)) {
      return;
    }
    sessionStorage.setItem(expandedStateKey, 'true');
    
    // Load previously expanded parents from localStorage
    try {
      const savedExpandedParents = JSON.parse(localStorage.getItem('expandedParents') || '[]');
      
      // Track explicitly collapsed parents (where user has clicked to collapse)
      const explicitlyCollapsed = JSON.parse(localStorage.getItem('collapsedParents') || '[]');
      
      // Start with a fresh state
      const newExpandedState: Record<string, boolean> = {};
      
      // First, get all parent categories
      const parentCategories = categories.filter(cat => cat.isParent).map(cat => cat.name);
      
      // By default, expand ALL parent categories unless they're explicitly collapsed
      parentCategories.forEach(parentName => {
        newExpandedState[parentName] = !explicitlyCollapsed.includes(parentName);
      });
      
      // Then, apply user preferences from localStorage
      savedExpandedParents.forEach((parentName: string) => {
        newExpandedState[parentName] = true;
      });
      
      // If a category is selected, also expand its parent
      if (selectedCategory) {
        const selectedCat = categories.find(cat => cat.name === selectedCategory);
        // If this is a child category, make sure its parent is expanded
        if (selectedCat && selectedCat.parentName) {
          newExpandedState[selectedCat.parentName] = true;
        }
      }
      
      // Update the expanded state
      setExpandedParents(prevState => ({
        ...prevState,
        ...newExpandedState
      }));
      
    } catch (error) {
      console.error('Error initializing expanded state:', error);
    }
  // This effect only needs to run when authentication changes or categories load initially
  }, [isAuthenticated, categories.length]);

  // Hook for parent-dependent memoization
  const useDeepMemo = (factory: () => any, deps: any[]) => useMemo(factory, [JSON.stringify(deps)]);

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page header and list type tabs */}
        <div className="md:flex md:items-start md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
              <ListTodo className="mr-2 text-blue-600" />
              Action Items
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your action items and tasks. Items are automatically categorized by conversation topics.
              <Link href="/action-items/all-items" className="ml-2 text-blue-600 hover:text-blue-800 underline">
                View All Lists & Items
              </Link>
            </p>
          </div>
          <div className="flex gap-2">
            {isAuthenticated && (
              <button
                onClick={openNewItemForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                New Item
              </button>
            )}
            <button
              onClick={refreshList}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* New action item form - only show when authenticated */}
        {isAuthenticated && isAddingItem && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-blue-800">Create New Action Item</h3>
              <button 
                onClick={closeNewItemForm}
                className="text-blue-500 hover:text-blue-700"
                aria-label="Close form"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Enter a new action item..."
                className="flex-1 border border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                onKeyDown={(e) => e.key === 'Enter' && createActionItem()}
              />
              <button
                onClick={createActionItem}
                disabled={!newItemText.trim() || isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Send size={16} />
                )}
                Create
              </button>
            </div>
          </div>
        )}
        
        {/* Authentication check */}
        {!isAuthenticated ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <p className="text-amber-700 mb-4">
              Please sign in to view and manage your action items.
            </p>
            <button
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => {/* Handle sign in */}}
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Categories sidebar */}
            <div className="md:w-64 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-semibold mb-3 text-gray-800">Categories</h2>
                
                {isLoadingCategories ? (
                  <div className="flex justify-center items-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
                    <span className="text-gray-600">Loading...</span>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-gray-500 text-sm p-2">
                    No categories found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* All Items button/dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setExpandedParents(prev => ({
                          ...prev,
                          allItems: !prev.allItems
                        }))}
                        className={`w-full flex items-center justify-between py-2 px-3 text-left rounded-md mb-2 ${
                          !selectedCategory ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500 pl-2' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <ListChecks size={16} />
                          All Items
                        </span>
                        <div className="flex items-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${
                            completedItems === totalItems && totalItems > 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {completedItems}/{totalItems}
                          </span>
                          <svg 
                            className={`w-4 h-4 transition-transform ${expandedParents.allItems ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      
                      {/* Dropdown menu */}
                      {expandedParents.allItems && (
                        <div className="absolute left-0 z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                          {/* All Items option */}
                          <button
                            onClick={() => {
                              selectCategory(null);
                              setExpandedParents(prev => ({ ...prev, allItems: false }));
                            }}
                            className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex justify-between items-center"
                          >
                            <span className="flex items-center gap-2">
                              <ListChecks size={16} />
                              All Items
                            </span>
                          </button>
                          
                          {/* Parent list options */}
                          {categories
                            .filter(cat => cat.isParent)
                            .map(category => (
                              <button
                                key={category.name}
                                onClick={() => {
                                  selectCategory(category.name);
                                  setExpandedParents(prev => ({ 
                                    ...prev, 
                                    allItems: false, 
                                    [category.name]: true 
                                  }));
                                }}
                                className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex justify-between items-center"
                              >
                                <span className="flex items-center gap-2">
                                  <Folder size={16} />
                                  {category.name}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  category.completedCount === category.count && category.count > 0
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {category.completedCount}/{category.count}
                                </span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Parent categories */}
                    {categories
                      .filter(cat => {
                        // Always show "All Items" (it's rendered separately above)
                        if (cat.name === "All Items") return false;
                        
                        // If no category is selected, show all parent categories
                        if (!selectedCategory) return cat.isParent;
                        
                        // If a category is selected, only show:
                        // 1. The selected parent
                        // 2. The parent of the selected child
                        if (cat.isParent) {
                          // This is the selected parent
                          if (cat.name === selectedCategory) return true;
                          
                          // This is the parent of a selected child
                          const hasSelectedChild = categories
                            .some(child => child.parentName === cat.name && child.name === selectedCategory);
                            
                          return hasSelectedChild;
                        }
                        
                        return false;
                      })
                      .map(category => {
                        // Find child categories for this parent
                        const childCategories = categories
                          .filter(cat => cat.parentName === category.name)
                          // Sort child categories by ordinal if available
                          .sort((a, b) => {
                            // If both have ordinals, sort by ordinal
                            if (typeof a.ordinal === 'number' && typeof b.ordinal === 'number') {
                              return a.ordinal - b.ordinal;
                            }
                            // If only one has ordinal, prioritize it
                            if (typeof a.ordinal === 'number') return -1;
                            if (typeof b.ordinal === 'number') return 1;
                            // Fall back to name sorting if no ordinals
                            return a.name.localeCompare(b.name);
                          });
                        const hasChildren = childCategories.length > 0;
                        
                        // Check if this category or any of its children is selected
                        const isActive = selectedCategory === category.name || 
                                        childCategories.some(child => child.name === selectedCategory);
                        
                        // Check if this parent should be expanded - only true if explicitly expanded
                        const isExpanded = expandedParents[category.name] || false;
                        
                        return (
                          <div key={category.name} className={`mb-2 ${isActive ? 'bg-blue-50 bg-opacity-50 rounded-md' : ''}`}>
                            {/* Parent category button with expand arrow */}
                            <div className="flex w-full">
                              {/* Main category button */}
                              <button
                                onClick={() => selectCategory(category.name)}
                                className={`flex-1 flex items-center justify-between py-2 px-3 text-left rounded-md ${
                                  selectedCategory === category.name 
                                    ? 'text-blue-700 font-medium bg-blue-50 border-l-4 border-blue-500 pl-2' 
                                    : hasChildren
                                      ? 'text-gray-700 hover:bg-gray-50 font-medium'
                                      : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <Folder size={16} />
                                  {category.name}
                                </span>
                                <div className="flex items-center">
                                  <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${
                                    category.completedCount === category.count && category.count > 0
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {category.completedCount}/{category.count}
                                  </span>
                                  
                                  {/* Show expand/collapse arrow only if there are children */}
                                  {hasChildren && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleParentExpansion(category.name);
                                      }}
                                      className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-full p-1"
                                      title={isExpanded ? "Collapse" : "Expand"}
                                    >
                                      <svg 
                                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </button>
                            </div>
                            
                            {/* Child categories - only shown when parent is expanded */}
                            {isExpanded && childCategories.length > 0 && (
                              <div className="mt-1 ml-3 pl-2 border-l-2 border-gray-200">
                                {childCategories.map(childCategory => (
                                  <button
                                    key={childCategory.name}
                                    onClick={() => {
                                      // When selecting a child category, we need to:
                                      // 1. Set the selected category to the child
                                      // 2. Set the showingParentList flag in localStorage
                                      // 3. Update the URL with the listId and category

                                      // Store the childCategory ID before any state updates to ensure consistency
                                      const childCategoryId = childCategory.id;
                                      
                                      // Update localStorage first to signal we're showing parent-child relationship
                                      localStorage.setItem('showingParentList', 'true');
                                      
                                      // Set the category first
                                      selectCategory(childCategory.name);
                                      
                                      // Update URL with listId and ensure it's consistent with our selection
                                      // Use setTimeout to break the update cycle
                                      setTimeout(() => {
                                        const url = new URL(window.location.href);
                                        
                                        // Clear any existing parameters to avoid conflicting filters
                                        url.searchParams.delete('category');
                                        
                                        // Set the consistent listId
                                        url.searchParams.set('listId', childCategoryId);
                                        
                                        // Add a timestamp to force refresh and avoid caching issues
                                        url.searchParams.set('t', Date.now().toString());
                                        
                                        window.history.pushState({}, '', url);
                                        
                                        // Force refresh the component after URL update
                                        setKey(prev => prev + 1);
                                        
                                        console.log(`Navigated to child category: ${childCategory.name} with listId: ${childCategoryId}`);
                                      }, 0);
                                    }}
                                    className={`w-full flex items-center justify-between py-1.5 px-3 text-left rounded-md my-1 ${
                                      selectedCategory === childCategory.name 
                                        ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500 pl-2' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2 text-sm">
                                      <TagIcon size={14} />
                                      {typeof childCategory.ordinal === 'number' ? (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full mr-1">
                                          {childCategory.ordinal + 1}
                                        </span>
                                      ) : null}
                                      {childCategory.name}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      childCategory.completedCount === childCategory.count && childCategory.count > 0
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {childCategory.completedCount}/{childCategory.count}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    
                    {/* Uncategorized parent categories */}
                    {categories
                      .filter(cat => !cat.isParent && !cat.parentName)
                      .map(category => (
                        <button
                          key={category.name}
                          onClick={() => selectCategory(category.name)}
                          className={`w-full flex items-center justify-between p-2 rounded-md text-left ${
                            selectedCategory === category.name 
                              ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500 pl-1' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <TagIcon size={16} />
                            {category.name}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            category.completedCount === category.count && category.count > 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {category.completedCount}/{category.count}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action items content */}
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedCategory ? (
                        <>
                          <span>{selectedCategory}</span>
                          <button
                            onClick={() => selectCategory(null)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                            title="Clear filter"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        "All Action Items"
                      )}
                    </h2>
                    {isLoadingCategories && (
                      <RefreshCw size={16} className="animate-spin text-blue-500" />
                    )}
                  </div>
                  
                  {/* Show breadcrumb path for categories with parent relationships */}
                  {selectedCategory && categories.some(cat => cat.name === selectedCategory && cat.parentName) && (
                    <div className="mb-4 text-sm text-gray-500 flex items-center">
                      <span 
                        className="hover:text-blue-600 cursor-pointer"
                        onClick={() => selectCategory(categories.find(cat => cat.name === selectedCategory)?.parentName || null)}
                      >
                        {categories.find(cat => cat.name === selectedCategory)?.parentName}
                      </span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{selectedCategory}</span>
                    </div>
                  )}
                  
                  <ActionItemsList 
                    key={key} 
                    categoryFilter={selectedCategory}
                    rootItemsOnly={true}
                    showChildCategories={typeof window !== 'undefined' && localStorage.getItem('showingParentList') !== null}
                    ignoreParentItems={true}
                    onItemAdded={refreshList}
                    onItemChanged={refreshList}
                    onItemDeleted={refreshList}
                    listId={(() => {
                      // Check for listId in URL first for explicit navigation
                      if (typeof window !== 'undefined') {
                        const urlParams = new URLSearchParams(window.location.search);
                        const explicitListId = urlParams.get('listId');
                        if (explicitListId) {
                          console.log(`Using explicit listId from URL: ${explicitListId}`);
                          return explicitListId;
                        }
                      }
                      
                      // If no explicit listId but we have a selected category, try to find its list ID
                      if (selectedCategory) {
                        // Check if this is a child category
                        const category = categories.find(cat => 
                          cat.name === selectedCategory && cat.parentName
                        );
                        
                        if (category) {
                          console.log(`Found list ID for child category: ${category.id}`);
                          return category.id;
                        }
                        
                        // Check if this is a parent category with its own list ID
                        const parentCategory = categories.find(cat => 
                          cat.name === selectedCategory && cat.isParent
                        );
                        
                        if (parentCategory) {
                          console.log(`Found list ID for parent category: ${parentCategory.id}`);
                          return parentCategory.id;
                        }
                      }
                      
                      // No matching list ID found
                      return null;
                    })()}
                    // If the selected category is a parent category, hide all action items
                    hasAnyItems={!selectedCategory || !categories.find(cat => 
                      cat.name === selectedCategory && cat.isParent && !cat.parentName
                    )}
                    hasCategories={categories.length > 0}
                    sidebarVisible={true}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  )
} 

/**
 * Custom hook for fetching action list data with caching
 * This helps prevent multiple requests for the same data across components
 */
function useFetchLists() {
  const [listsCache, setListsCache] = useState<Record<string, any>>({});
  const [isFetching, setIsFetching] = useState(false);
  const apiCallsInProgress = useRef(new Set<string>());
  
  // Create a global cache if it doesn't exist yet
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.actionListsCache) {
      window.actionListsCache = {};
    }
  }, []);
  
  /**
   * Fetch a single list by ID with caching
   * @param listId The ID of the list to fetch
   * @returns Promise with the list data
   */
  const fetchList = useCallback(async (listId: string, forceFresh = false) => {
    // Don't do anything if we don't have a listId
    if (!listId) return null;
    
    // Prevent duplicate calls for the same list ID
    const cacheKey = `list-${listId}${forceFresh ? '-fresh' : ''}`;
    if (apiCallsInProgress.current.has(cacheKey)) {
      console.log(`Already fetching list ${listId}, using existing request`);
      return window.actionListsCache?.[listId];
    }
    
    // Check if we already have this list in our cache
    if (!forceFresh && window.actionListsCache && window.actionListsCache[listId]) {
      // We already have it cached, return it
      console.log(`Using cached data for list ${listId}`);
      return window.actionListsCache[listId];
    }
    
    // Mark this request as in progress
    apiCallsInProgress.current.add(cacheKey);
    
    try {
      console.log(`Fetching list ${listId} from API`);
      setIsFetching(true);
      const cacheBuster = forceFresh ? `?t=${new Date().getTime()}` : '';
      const response = await fetch(`/api/action-item-lists/${listId}${cacheBuster}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch list ${listId}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      if (window.actionListsCache) {
        window.actionListsCache[listId] = data;
      }
      
      // Only update state if needed to prevent unnecessary re-renders
      setListsCache(prev => {
        // Deep compare the objects to avoid unnecessary state updates
        if (JSON.stringify(prev[listId]) !== JSON.stringify(data)) {
          return { ...prev, [listId]: data };
        }
        return prev;
      });
      
      return data;
    } catch (error) {
      console.error(`Error fetching list ${listId}:`, error);
      return null;
    } finally {
      setIsFetching(false);
      apiCallsInProgress.current.delete(cacheKey);
    }
  }, []); // Empty dependency array as we use refs for mutable state
  
  /**
   * Fetch multiple lists by their IDs
   * @param listIds Array of list IDs to fetch
   * @returns Promise that resolves when all lists are fetched
   */
  const fetchMultipleLists = useCallback(async (listIds: string[], forceFresh = false) => {
    if (!listIds || listIds.length === 0) return {};
    
    // Create a unique key for this batch request
    const batchKey = `batch-${listIds.join('-')}${forceFresh ? '-fresh' : ''}`;
    
    // Check if this exact batch is already being fetched
    if (apiCallsInProgress.current.has(batchKey)) {
      console.log('This batch is already being fetched, skipping duplicate call');
      
      // Return whatever we already have in cache
      const cachedResults: Record<string, any> = {};
      if (window.actionListsCache) {
        listIds.forEach(id => {
          if (window.actionListsCache[id]) {
            cachedResults[id] = window.actionListsCache[id];
          }
        });
      }
      return cachedResults;
    }
    
    // Mark this batch as in progress
    apiCallsInProgress.current.add(batchKey);
    
    // Determine which lists we need to fetch vs. which we have cached
    const needToFetch = forceFresh 
      ? listIds 
      : listIds.filter(id => !window.actionListsCache || !window.actionListsCache[id]);
    
    if (needToFetch.length === 0) {
      console.log(`All ${listIds.length} lists are cached, using cache`);
      
      // Return all cached data
      const result: Record<string, any> = {};
      listIds.forEach(id => {
        if (window.actionListsCache && window.actionListsCache[id]) {
          result[id] = window.actionListsCache[id];
        }
      });
      
      apiCallsInProgress.current.delete(batchKey);
      return result;
    }
    
    console.log(`Fetching ${needToFetch.length} out of ${listIds.length} lists from API`);
    setIsFetching(true);
    
    try {
      // Fetch in batches to not overwhelm the server
      const batchSize = 5;
      const results: Record<string, any> = {};
      
      // First, add any cached results we already have
      listIds.forEach(id => {
        if (!forceFresh && window.actionListsCache && window.actionListsCache[id]) {
          results[id] = window.actionListsCache[id];
        }
      });
      
      // Fetch the remaining lists in batches
      for (let i = 0; i < needToFetch.length; i += batchSize) {
        const batch = needToFetch.slice(i, i + batchSize);
        const batchPromises = batch.map(id => fetchList(id, forceFresh));
        const batchResults = await Promise.all(batchPromises);
        
        // Add results to our collection
        batchResults.forEach((data, index) => {
          if (data) {
            const id = batch[index];
            results[id] = data;
          }
        });
      }
      
      return results;
    } finally {
      setIsFetching(false);
      apiCallsInProgress.current.delete(batchKey);
    }
  }, [fetchList]); // Only depend on fetchList
  
  /**
   * Fetch all lists at once with detailed parentId information
   * @param forceFresh Whether to bypass cache 
   * @returns Promise with all lists including parentId information
   */
  const fetchAllLists = useCallback(async (forceFresh = false) => {
    const cacheKey = `all-lists${forceFresh ? '-fresh' : ''}`;
    
    // Prevent duplicate calls for the same request
    if (apiCallsInProgress.current.has(cacheKey)) {
      console.log('All lists fetch already in progress, skipping duplicate call');
      return [];
    }
    
    // Mark this request as in progress
    apiCallsInProgress.current.add(cacheKey);
    
    try {
      setIsFetching(true);
      const cacheBuster = forceFresh ? `?t=${new Date().getTime()}` : '';
      const response = await fetch(`/api/action-item-lists${cacheBuster}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch action lists');
      }
      
      const lists = await response.json();
      console.log(`Fetched ${lists.length} lists from API with parentId information`);
      
      // Cache the lists if window is available
      if (typeof window !== 'undefined' && window.actionListsCache) {
        lists.forEach((list: any) => {
          window.actionListsCache[list.id] = list;
        });
      }
      
      return lists;
    } catch (error) {
      console.error('Error fetching all lists:', error);
      return [];
    } finally {
      setIsFetching(false);
      apiCallsInProgress.current.delete(cacheKey);
    }
  }, []);
  
  return {
    listsCache,
    isFetching,
    fetchList,
    fetchMultipleLists,
    fetchAllLists
  };
}

// Add to the global Window interface
declare global {
  interface Window {
    listNameCache: Record<string, string>;
    actionListsCache: Record<string, any>;
  }
} 