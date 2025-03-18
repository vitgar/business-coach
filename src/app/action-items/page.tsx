'use client'

import React, { useState, useEffect } from 'react'
import { ListTodo, RefreshCw, Plus, X, Send, Loader2, TagIcon, BookOpen, Folder } from 'lucide-react'
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
   * Fetches categories from action items
   */
  const fetchCategories = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingCategories(true);
    
    try {
      // Fetch all action items to extract categories
      const response = await fetch('/api/action-items');
      
      if (!response.ok) {
        throw new Error('Failed to fetch action items');
      }
      
      const items = await response.json();
      
      // Track total and completed items
      let totalCount = 0;
      let completedCount = 0;
      
      // Extract categories from items with bracketed prefixes
      const categoryMap = new Map<string, { total: number, completed: number }>();
      
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
            categoryMap.set(categoryName, { total: 0, completed: 0 });
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
      
      // Convert to array and identify parent/child relationships
      const categoriesArray: Category[] = Array.from(categoryMap.entries())
        .map(([name, counts]) => ({
          name,
          count: counts.total,
          completedCount: counts.completed,
          isParent: isParentCategory(name),
          parentName: undefined
        }));
      
      // Find parent categories
      const parentCategories = categoriesArray.filter(cat => cat.isParent);
      
      // Establish parent-child relationships
      categoriesArray.forEach(category => {
        if (!category.isParent) {
          category.parentName = findBestParentMatch(category.name, parentCategories);
        }
      });
      
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
    setSelectedCategory(categoryName);
    setKey(prev => prev + 1); // Force re-render with new filter
  }

  // Fetch categories on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

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
                          ? 'bg-blue-50 text-blue-700' 
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
                      .map(category => (
                        <div key={category.name} className="space-y-1">
                          <button
                            onClick={() => selectCategory(category.name)}
                            className={`w-full flex items-center justify-between p-2 rounded-md text-left ${
                              selectedCategory === category.name 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
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
                          
                          {/* Child categories for this parent */}
                          <div className="pl-4 border-l-2 border-gray-100 ml-2 space-y-1">
                            {categories
                              .filter(cat => cat.parentName === category.name)
                              .map(childCategory => (
                                <button
                                  key={childCategory.name}
                                  onClick={() => selectCategory(childCategory.name)}
                                  className={`w-full flex items-center justify-between p-2 rounded-md text-left ${
                                    selectedCategory === childCategory.name 
                                      ? 'bg-blue-50 text-blue-700' 
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
                        </div>
                      ))}
                    
                    {/* Uncategorized parent categories */}
                    {categories
                      .filter(cat => !cat.isParent && !cat.parentName)
                      .map(category => (
                        <button
                          key={category.name}
                          onClick={() => selectCategory(category.name)}
                          className={`w-full flex items-center justify-between p-2 rounded-md text-left ${
                            selectedCategory === category.name 
                              ? 'bg-blue-50 text-blue-700' 
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
                  <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                    {selectedCategory ? (
                      <>
                        <span className="flex items-center gap-2">
                          <TagIcon size={18} className="text-blue-500" />
                          {selectedCategory}
                        </span>
                        <button 
                          onClick={() => selectCategory(null)}
                          className="ml-2 text-xs text-blue-500 hover:text-blue-700"
                        >
                          (view all)
                        </button>
                      </>
                    ) : (
                      "All Action Items"
                    )}
                  </h2>
                  
                  {/* The action items list component with category filter */}
                  <ActionItemsList 
                    key={key} 
                    rootItemsOnly={true}
                    onCreateNewItem={openNewItemForm}
                    categoryFilter={selectedCategory}
                    onItemStatusChange={fetchCategories}
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