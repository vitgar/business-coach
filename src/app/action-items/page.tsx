'use client'

import React, { useState, useEffect } from 'react'
import { ListTodo, RefreshCw, Plus, X, Send, Loader2, TagIcon, BookOpen, Folder, ChevronRight } from 'lucide-react'
import ClientLayout from '@/components/ClientLayout'
import ActionItemsList from '@/components/action-items/ActionItemsList'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'

/**
 * Interface for categorized action items
 */
interface Category {
  name: string;
  count: number;
  completedCount: number; // Number of completed items in this category
  isParent: boolean;
  parentName?: string;
}

/**
 * Action Items Page
 * 
 * Shows all action items for the user
 * These action items are extracted automatically from assistant messages
 * Users can also manually add new action items
 */
export default function ActionItemsPage() {
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
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({})

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
   * Finds the best parent match for a child category
   */
  const findBestParentMatch = (childName: string, parentCategories: Category[]): string | undefined => {
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
   * Fetches categories from action items and action lists
   */
  const fetchCategories = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingCategories(true);
    
    try {
      // First fetch all action items to extract virtual categories from bracket prefixes
      const response = await fetch('/api/action-items?limit=1000');
      
      if (!response.ok) {
        throw new Error('Failed to fetch action items');
      }
      
      const items = await response.json();
      
      // Track total and completed items
      let totalCount = 0;
      let completedCount = 0;
      
      // Extract categories from items with bracketed prefixes
      const categoryMap = new Map<string, { total: number, completed: number, isParent: boolean, parentName?: string }>();
      
      items.forEach((item: any) => {
        // Count all items
        totalCount++;
        if (item.isCompleted) {
          completedCount++;
        }
        
        // Look for patterns like [Title] or {Title} at the beginning of the content
        const bracketMatch = item.content.match(/^\s*[\[\{](.*?)[\]\}]/);
        
        if (bracketMatch) {
          const categoryName = bracketMatch[1].trim();
          
          // Skip empty category names
          if (!categoryName) return;
          
          // If category doesn't exist yet, initialize it
          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, { 
              total: 0, 
              completed: 0, 
              isParent: isParentCategory(categoryName),
              parentName: undefined
            });
          }
          
          // Get current counts
          const counts = categoryMap.get(categoryName)!;
          
          // Increment total count
          counts.total += 1;
          
          // Increment completed count if item is completed
          if (item.isCompleted) {
            counts.completed += 1;
          }
          
          // Update the map
          categoryMap.set(categoryName, counts);
        }
      });
      
      // Update total counts
      setTotalItems(totalCount);
      setCompletedItems(completedCount);
      
      // Now, also fetch real action lists to include them as categories
      const listsResponse = await fetch('/api/action-item-lists');
      if (listsResponse.ok) {
        const actionLists = await listsResponse.json();
        console.log(`Fetched ${actionLists.length} action lists for categories`);
        
        // Process each list to get its full details (including parentId)
        for (const list of actionLists) {
          try {
            const listDetailResponse = await fetch(`/api/action-item-lists/${list.id}`);
            if (listDetailResponse.ok) {
              const listDetails = await listDetailResponse.json();
              
              // Add this list as a category if it's not already in our map
              if (!categoryMap.has(list.name)) {
                // Count items in this list
                const listItems = items.filter((item: any) => item.listId === list.id);
                const listCompletedItems = listItems.filter((item: any) => item.isCompleted);
                
                // Create category entry
                categoryMap.set(list.name, {
                  total: listItems.length,
                  completed: listCompletedItems.length,
                  isParent: !listDetails.parentId, // It's a parent if it has no parentId
                  parentName: listDetails.parentId ? 
                    // Find parent list name using the parentId
                    actionLists.find((l: any) => l.id === listDetails.parentId)?.name : 
                    undefined
                });
                
                console.log(`Added real list as category: ${list.name}, isParent: ${!listDetails.parentId}, parentName: ${
                  listDetails.parentId ? 
                    actionLists.find((l: any) => l.id === listDetails.parentId)?.name : 
                    'none'
                }`);
              }
            }
          } catch (err) {
            console.error(`Error getting details for list ${list.id}:`, err);
          }
        }
      }
      
      // Convert to array and identify parent/child relationships
      const categoriesArray: Category[] = Array.from(categoryMap.entries())
        .map(([name, data]) => ({
          name,
          count: data.total,
          completedCount: data.completed,
          isParent: data.isParent,
          parentName: data.parentName
        }));
      
      // Find parent categories
      const parentCategories = categoriesArray.filter(cat => cat.isParent);
      
      // For categories that don't already have a parent assigned, try to find a match
      categoriesArray.forEach(category => {
        if (!category.isParent && !category.parentName) {
          category.parentName = findBestParentMatch(category.name, parentCategories);
        }
      });
      
      console.log(`Processed ${categoriesArray.length} categories: ${categoriesArray.length - parentCategories.length} child categories and ${parentCategories.length} parent categories`);
      
      setCategories(categoriesArray);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load item categories');
    } finally {
      setIsLoadingCategories(false);
    }
  };

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

  // Select a category to filter items
  const selectCategory = (categoryName: string | null) => {
    console.log(`Selecting category: ${categoryName}`);
    
    // If we're selecting a category, check if it's a child category and update URL params
    if (categoryName) {
      // Find the category in our categories list
      const category = categories.find(cat => cat.name === categoryName);
      
      if (category) {
        // If this category has a matching list, get its ID for URL params
        const matchingList = actionLists.find(list => list.name === categoryName);
        
        if (matchingList) {
          console.log(`Found matching list ID: ${matchingList.id} for category: ${categoryName}`);
          
          // Update URL with the new listId without refreshing the page
          const url = new URL(window.location.href);
          url.searchParams.set('listId', matchingList.id);
          url.searchParams.set('showChildren', 'true');
          window.history.pushState({}, '', url.toString());
          
          // Also update localStorage to indicate we're showing a parent with children
          localStorage.setItem('showingParentList', matchingList.id);
        }
      }
    } else {
      // If clearing selection, also clear URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('listId');
      url.searchParams.delete('showChildren');
      window.history.pushState({}, '', url.toString());
      
      // Clear localStorage
      localStorage.removeItem('showingParentList');
    }
    
    setSelectedCategory(categoryName);
    setKey(prev => prev + 1); // Force re-render with new filter
  }

  // Fetch all action lists to use for ID lookup when selecting categories
  useEffect(() => {
    const fetchAllLists = async () => {
      try {
        const response = await fetch('/api/action-item-lists');
        if (response.ok) {
          const lists = await response.json();
          setActionLists(lists);
          
          // Enhance with parent-child relationships
          const enhancedLists = await Promise.all(lists.map(async (list: any) => {
            try {
              const detailResponse = await fetch(`/api/action-item-lists/${list.id}`);
              if (detailResponse.ok) {
                const details = await detailResponse.json();
                return { ...list, ...details };
              }
              return list;
            } catch (error) {
              console.error(`Error fetching details for list ${list.id}:`, error);
              return list;
            }
          }));
          
          setActionLists(enhancedLists);
        }
      } catch (error) {
        console.error('Error fetching action lists:', error);
      }
    };
    
    if (isAuthenticated) {
      fetchAllLists();
    }
  }, [isAuthenticated]);
  
  // Function to toggle expansion of parent categories
  const toggleParentExpanded = (categoryName: string) => {
    console.log(`Toggling expansion for parent category: ${categoryName}`);
    // Update expanded state
    setExpandedParents(prev => {
      const newState = { ...prev };
      newState[categoryName] = !prev[categoryName];
      return newState;
    });
    
    // If we're expanding and this category has a matching list, update URL params
    // but don't change the selected category
    if (!expandedParents[categoryName]) { // Means we're expanding it
      const matchingList = actionLists.find(list => list.name === categoryName);
      if (matchingList) {
        console.log(`Updating URL param for parent: ${categoryName} with ID: ${matchingList.id}`);
        // Update localStorage to indicate we're showing a parent with children
        // but don't change the URL if we already have a different selection
        localStorage.setItem('showingParentList', matchingList.id);
      }
    }
  }

  // Handle URL parameters on component mount
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Check for listId in URL parameters
    const params = new URLSearchParams(window.location.search);
    const listId = params.get('listId');
    const showChildren = params.get('showChildren') === 'true';
    
    console.log(`URL parameters: listId=${listId}, showChildren=${showChildren}`);
    
    if (listId) {
      // Fetch list details to get the name
      const fetchListName = async () => {
        try {
          console.log(`Fetching list details for ID: ${listId}`);
          const response = await fetch(`/api/action-item-lists/${listId}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch list: ${response.status}`);
          }
          
          const list = await response.json();
          console.log('List details received:', list);
          
          if (!list || !list.name) {
            console.error('Invalid list data received:', list);
            toast.error('Could not load the requested list');
            return;
          }
          
          // Set this category as selected
          setSelectedCategory(list.name);
          
          console.log(`Selected list: ${list.name} (${listId}), showing children: ${showChildren}`);
          
          // If this list has a parentId, expand its parent category
          if (list.parentId) {
            // Find the parent list to get its name
            const parentList = actionLists.find(l => l.id === list.parentId);
            if (parentList) {
              console.log(`Auto-expanding parent category: ${parentList.name}`);
              setExpandedParents(prev => ({
                ...prev,
                [parentList.name]: true
              }));
            }
          }
          
          // Always show child categories when viewing a list
          if (showChildren) {
            // Store that we're showing a parent with children
            localStorage.setItem('showingParentList', listId);
            console.log('Stored showingParentList in localStorage:', listId);
            
            // Expand this parent category 
            setExpandedParents(prev => ({
              ...prev,
              [list.name]: true
            }));
            
            // Also fetch child lists if this is a parent list
            const fetchChildLists = async () => {
              try {
                // For simplicity, we'll check for child lists by making another API call
                const childListsResponse = await fetch('/api/action-item-lists');
                if (childListsResponse.ok) {
                  const allLists = await childListsResponse.json();
                  
                  // Look for lists that have this listId as their parentId
                  const childListsPromises = allLists.map(async (childList: any) => {
                    try {
                      const detailResponse = await fetch(`/api/action-item-lists/${childList.id}`);
                      if (!detailResponse.ok) return null;
                      
                      const details = await detailResponse.json();
                      return details.parentId === listId ? childList : null;
                    } catch (error) {
                      console.error(`Error checking childList ${childList.id}:`, error);
                      return null;
                    }
                  });
                  
                  const childListResults = await Promise.all(childListsPromises);
                  const childLists = childListResults.filter(Boolean);
                  
                  console.log(`Found ${childLists.length} child lists for ${list.name}`);
                  
                  // Update categories to include these child lists
                  if (childLists.length > 0) {
                    // Force a refresh of categories to include child lists
                    fetchCategories();
                  }
                }
              } catch (error) {
                console.error('Error fetching child lists:', error);
              }
            };
            
            fetchChildLists();
          } else {
            localStorage.removeItem('showingParentList');
          }
          
          // Force refresh the action items list
          setKey(prev => prev + 1);
        } catch (error) {
          console.error('Error fetching list details:', error);
          toast.error('Failed to load the requested list');
        }
      };
      
      fetchListName();
    } else {
      // Clear selection if no listId in URL
      setSelectedCategory(null);
      localStorage.removeItem('showingParentList');
    }
    
    fetchCategories();
  }, [isAuthenticated, actionLists]);

  // Initialize expanded state based on URL parameters when component mounts
  useEffect(() => {
    if (!isAuthenticated || categories.length === 0) return;
    
    // Find selected category and expand its parent if needed
    if (selectedCategory) {
      const selectedCat = categories.find(cat => cat.name === selectedCategory);
      if (selectedCat && selectedCat.parentName) {
        console.log(`Auto-expanding parent category: ${selectedCat.parentName} for selected: ${selectedCategory}`);
        setExpandedParents(prev => {
          const newState = { ...prev };
          if (selectedCat.parentName) {
            newState[selectedCat.parentName] = true;
          }
          return newState;
        });
      } else if (selectedCat && selectedCat.isParent) {
        // If a parent category is selected, expand it
        console.log(`Auto-expanding selected parent category: ${selectedCategory}`);
        setExpandedParents(prev => {
          const newState = { ...prev };
          newState[selectedCategory] = true;
          return newState;
        });
      }
    }
    
    // Also expand any parent category that has the currently selected list as a child
    const parentCategories = categories.filter(cat => cat.isParent);
    parentCategories.forEach(parent => {
      const childCategories = categories.filter(cat => cat.parentName === parent.name);
      if (childCategories.some(child => child.name === selectedCategory)) {
        console.log(`Auto-expanding parent with selected child: ${parent.name}`);
        setExpandedParents(prev => {
          const newState = { ...prev };
          newState[parent.name] = true;
          return newState;
        });
      }
    });
  }, [isAuthenticated, selectedCategory, categories]);

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold flex items-center text-gray-800">
              <ListTodo className="mr-3 text-blue-600" size={28} />
              Action Items
            </h1>
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
          <p className="text-gray-600">
            Track and manage tasks extracted from your business coach conversations.
          </p>
        </header>

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
                    <button
                      onClick={() => selectCategory(null)}
                      className={`w-full flex items-center justify-between p-2 rounded-md text-left ${
                        selectedCategory === null 
                          ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500 pl-1' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <ListTodo size={16} />
                        All Items
                      </span>
                      {totalItems > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          completedItems === totalItems 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {completedItems}/{totalItems}
                        </span>
                      )}
                    </button>
                    
                    {/* Parent categories */}
                    {categories
                      .filter(cat => cat.isParent)
                      .map(category => {
                        // Check if this category or any of its children is selected
                        const childCategories = categories.filter(cat => cat.parentName === category.name);
                        const isActive = selectedCategory === category.name || 
                                       childCategories.some(child => child.name === selectedCategory);
                        // Check if this parent should be expanded
                        const isExpanded = expandedParents[category.name] || isActive;
                        
                        return (
                          <div key={category.name} className={`space-y-1 ${isActive ? 'bg-blue-50 bg-opacity-50 p-1 rounded-md' : ''}`}>
                            <button
                              onClick={() => {
                                // Toggle expansion first, then select if not already selected
                                toggleParentExpanded(category.name);
                                if (selectedCategory !== category.name) {
                                  selectCategory(category.name);
                                }
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-md text-left ${
                                selectedCategory === category.name 
                                  ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500 pl-1' 
                                  : isActive
                                    ? 'text-blue-600 font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Folder size={16} />
                                {category.name}
                                {/* Add dropdown indicator */}
                                {childCategories.length > 0 && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation(); // Don't select the category
                                      toggleParentExpanded(category.name);
                                    }}
                                    className={`ml-1 p-1 rounded-full hover:bg-blue-100 transition-transform text-blue-500 ${isExpanded ? 'rotate-90' : ''}`}
                                    title={isExpanded ? "Collapse" : "Expand"}
                                  >
                                    <ChevronRight size={14} />
                                  </button>
                                )}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                category.completedCount === category.count && category.count > 0
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {category.completedCount}/{category.count}
                              </span>
                            </button>
                            
                            {/* Child categories for this parent - only show if expanded */}
                            {isExpanded && childCategories.length > 0 && (
                              <div className={`pl-4 border-l-2 ml-2 space-y-1 ${isActive ? 'border-blue-300' : 'border-gray-100'}`}>
                                {childCategories.map(childCategory => (
                                  <button
                                    key={childCategory.name}
                                    onClick={() => selectCategory(childCategory.name)}
                                    className={`w-full flex items-center justify-between p-2 rounded-md text-left ${
                                      selectedCategory === childCategory.name 
                                        ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500 pl-1' 
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span className="flex items-center gap-2 text-sm">
                                      <TagIcon size={14} />
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
                        )
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
                    showChildCategories={localStorage.getItem('showingParentList') !== null}
                    onItemAdded={refreshList}
                    onItemChanged={refreshList}
                    onItemDeleted={refreshList}
                    listId={new URLSearchParams(window.location.search).get('listId')}
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