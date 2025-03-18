'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { HelpCircle, ListTodo, PlusCircle, ChevronLeft, RefreshCw, Palette } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ClientLayout from '@/components/ClientLayout'
import SimpleChat from '@/components/chat/SimpleChat'
import EnhancedActionItemsList from '@/components/action-items/EnhancedActionItemsList'
import { toast } from 'react-toastify'

/**
 * Interface for enhanced action item lists with color and topic tracking
 */
interface EnhancedActionItemList {
  id: string;
  name: string;
  color?: string;
  topicId?: string;
  parentId?: string;
}

// Available colors for lists
const LIST_COLORS = [
  'light-blue',
  'light-green',
  'light-purple',
  'light-orange',
  'light-pink',
  'light-teal',
  'light-yellow',
  'light-red',
];

/**
 * HowToHelper Page (formerly ActionPlanner)
 * 
 * Provides a unified interface with chat on the left and action items on the right.
 * Users can ask specific questions about business activities and get step-by-step guidance.
 * 
 * This component connects to an AI-powered API endpoint that:
 * 1. Analyzes user queries about business-related "how to" questions
 * 2. Generates step-by-step guidance with action items
 * 3. Maintains conversation context for detailed topic assistance
 * 4. Enables hierarchical action item creation (parent-child relationships)
 * 5. Supports multiple action item lists for different topics or projects
 * 6. Tracks topics and creates color-coded lists for different topics
 * 7. Supports sublists for organizing related items
 */
export default function ActionPlannerPage() {
  const { isAuthenticated, currentBusinessId } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)
  const [isMobileChatVisible, setIsMobileChatVisible] = useState(true)
  const [currentActionItemId, setCurrentActionItemId] = useState<string | null>(null)
  
  // State for managing multiple action item lists with enhanced properties
  const [actionItemLists, setActionItemLists] = useState<Array<EnhancedActionItemList>>([
    {id: 'default', name: 'Default Action Items', color: 'light-blue'}
  ])
  const [currentListId, setCurrentListId] = useState('default')
  
  // Load lists from API on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchActionItemLists();
    }
  }, [isAuthenticated]);
  
  /**
   * Fetch action item lists from the API
   */
  const fetchActionItemLists = async () => {
    try {
      const response = await fetch('/api/action-item-lists');
      if (response.ok) {
        const lists = await response.json();
        if (lists.length > 0) {
          setActionItemLists(lists);
          // If no current list is selected, select the first one
          if (currentListId === 'default' && lists.some((list: EnhancedActionItemList) => list.id !== 'default')) {
            setCurrentListId(lists[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching action item lists:', error);
    }
  };
  
  /**
   * Handle list change - sets the current list ID and refreshes the action items
   * Memoized to prevent unnecessary re-renders
   */
  const handleListChange = useCallback((listId: string) => {
    setCurrentListId(listId);
    setRefreshKey(Date.now());
    const listName = actionItemLists.find(list => list.id === listId)?.name || listId;
    toast.info(`Switched to "${listName}" list`);
  }, [actionItemLists]);
  
  /**
   * Create a new action item list
   */
  const createNewList = useCallback(async (
    name: string, 
    color: string = LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)],
    topicId?: string,
    parentId?: string
  ): Promise<string> => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create lists');
      return Promise.reject('Not authenticated');
    }
    
    try {
      const response = await fetch('/api/action-item-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: name,
          color,
          topicId,
          parentId,
          businessId: currentBusinessId || undefined
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create list');
      }
      
      const newList = await response.json();
      
      // Add the new list to our state
      setActionItemLists(prev => [...prev, {
        id: newList.id,
        name: newList.title || name,
        color: newList.color || color,
        topicId: newList.topicId || topicId,
        parentId: newList.parentId || parentId
      }]);
      
      // Set as current list
      setCurrentListId(newList.id);
      
      // Force refresh to reset the action items display when creating a new list
      setRefreshKey(Date.now());
      
      return newList.id;
    } catch (error) {
      console.error('Error creating action item list:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create list');
      return Promise.reject(error);
    }
  }, [isAuthenticated, currentBusinessId]);
  
  /**
   * Create an action item from chat message
   * 
   * This function is called from the SimpleChat component when an action item is detected
   * in a response or when the user manually creates an action item from a message.
   * 
   * @param content - The content of the action item
   * @param listId - Optional list ID to specify which list to add to
   * @param parentId - Optional parent ID if this is a child action item
   * @param callback - Optional callback that receives the created action item ID
   */
  const handleCreateActionItem = async (
    content: string,
    listId?: string,
    parentId?: string, 
    callback?: (id: string) => void
  ) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create action items')
      return
    }
    
    try {
      const response = await fetch('/api/action-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          businessId: currentBusinessId || undefined,
          parentId: parentId || undefined,
          listId: listId || currentListId
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create action item')
      }
      
      const data = await response.json()
      toast.success('Action item created')
      
      // Set the current action item ID if this is a parent item
      if (!parentId && data.id) {
        setCurrentActionItemId(data.id)
      }
      
      // Call the callback with the created item ID if provided
      if (callback && data.id) {
        callback(data.id)
      }
      
      // Refresh the action items list
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error creating action item:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create action item')
    }
  }
  
  /**
   * Handle creating a new list from user input
   */
  const handleCreateNewList = () => {
    const listName = prompt('Enter a name for the new action item list')
    if (listName && listName.trim()) {
      // Choose a random color from our color list
      const randomColor = LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)];
      createNewList(listName.trim(), randomColor)
        .then(() => {
          toast.success(`Created new list: ${listName}`);
        })
        .catch(() => {
          // Error is already handled in createNewList
        });
    }
  }
  
  /**
   * Handle setting a specific color for a list
   */
  const handleSetListColor = () => {
    const currentList = actionItemLists.find(list => list.id === currentListId);
    if (!currentList) return;
    
    // Simple color selection implementation - in a real app you'd use a color picker
    const colorIndex = prompt(`Choose a color number (1-${LIST_COLORS.length}):`);
    const index = parseInt(colorIndex || '1') - 1;
    
    if (isNaN(index) || index < 0 || index >= LIST_COLORS.length) {
      toast.error('Invalid color selection');
      return;
    }
    
    const newColor = LIST_COLORS[index];
    
    // Update the list color on the server
    fetch(`/api/action-item-lists/${currentListId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        color: newColor
      })
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to update list color');
      
      // Update local state
      setActionItemLists(prev => prev.map(list => 
        list.id === currentListId ? {...list, color: newColor} : list
      ));
      
      toast.success(`Updated color for "${currentList.name}"`);
    })
    .catch(error => {
      console.error('Error updating list color:', error);
      toast.error('Failed to update list color');
    });
  }
  
  /**
   * Refresh the action items list
   */
  const refreshActionItems = () => {
    fetchActionItemLists();
    setRefreshKey(prev => prev + 1);
  }
  
  // Find parent lists and child lists for the current list
  const parentLists = actionItemLists.filter(list => !list.parentId);
  const currentListItem = actionItemLists.find(list => list.id === currentListId);
  const childLists = actionItemLists.filter(list => list.parentId === currentListId);
  
  // Use a fixed color for UI elements instead of the list's color
  const fixedUIColor = 'light-blue';
  
  // Example questions for the placeholder rotation
  const placeholderExamples = [
    "How do I do online marketing?",
    "How do I register my business?",
    "How do I create a business plan?",
    "How do I find investors?",
    "How do I set up a website?",
    "How do I hire my first employee?",
    "How do I manage business taxes?",
    "How do I price my products?"
  ]
  
  // Map color names to CSS classes for the UI
  const getColorClass = (color: string) => {
    switch(color) {
      case 'light-blue': return 'bg-blue-600 text-white';
      case 'light-green': return 'bg-green-600 text-white';
      case 'light-purple': return 'bg-purple-600 text-white';
      case 'light-orange': return 'bg-orange-600 text-white';
      case 'light-pink': return 'bg-pink-600 text-white';
      case 'light-teal': return 'bg-teal-600 text-white';
      case 'light-yellow': return 'bg-yellow-600 text-white';
      case 'light-red': return 'bg-red-600 text-white';
      default: return 'bg-blue-600 text-white';
    }
  };
  
  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <HelpCircle className="mr-3 text-blue-600" size={32} />
                How To Helper
              </h1>
              <p className="text-gray-600 mt-2">
                Ask specific questions about how to accomplish different business activities. 
                Get step-by-step guidance and create action items from the answers.
              </p>
            </div>
            
            {/* Mobile view toggle for smaller screens */}
            <div className="md:hidden flex gap-2">
              <button
                onClick={() => setIsMobileChatVisible(!isMobileChatVisible)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                {isMobileChatVisible ? (
                  <>
                    <ListTodo size={16} />
                    View Items
                  </>
                ) : (
                  <>
                    <ChevronLeft size={16} />
                    Back to Chat
                  </>
                )}
              </button>
              
              <button
                onClick={refreshActionItems}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </header>
        
        {/* Authentication check */}
        {!isAuthenticated ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <p className="text-amber-700 mb-4">
              Please sign in to access the How To Helper and manage your action items.
            </p>
            <button
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => {/* Handle sign in */}}
            >
              Sign In
            </button>
          </div>
        ) : (
          /* Main content grid with chat and action items */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chat section - Hidden on mobile when viewing items */}
            <div className={`${!isMobileChatVisible ? 'hidden md:block' : ''} md:h-[calc(100vh-12rem)]`}>
              <SimpleChat 
                businessId={currentBusinessId || undefined}
                onCreateActionItem={handleCreateActionItem}
                placeholderExamples={placeholderExamples}
                currentListId={currentListId}
                actionItemLists={actionItemLists}
                onListChange={handleListChange}
                onCreateList={createNewList}
              />
            </div>
            
            {/* Action items section - Hidden on mobile when viewing chat */}
            <div className={`${isMobileChatVisible ? 'hidden md:block' : ''} md:h-[calc(100vh-12rem)] overflow-y-auto pb-6`}>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full overflow-hidden flex flex-col">
                <div className={`p-4 border-b border-gray-200 flex justify-between items-center ${getColorClass(fixedUIColor)}`}>
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold flex items-center">
                      <ListTodo className="mr-2" size={18} />
                      Action Items
                    </h2>
                    
                    {/* List selector dropdown */}
                    <div className="mt-2 flex items-center">
                      <select
                        value={currentListId}
                        onChange={(e) => setCurrentListId(e.target.value)}
                        className="text-sm bg-white bg-opacity-20 border border-white border-opacity-30 rounded px-2 py-1 mr-2 text-white"
                      >
                        <optgroup label="Main Lists">
                          {parentLists.map(list => (
                            <option key={list.id} value={list.id}>{list.name}</option>
                          ))}
                        </optgroup>
                        
                        {childLists.length > 0 && (
                          <optgroup label="Sublists">
                            {childLists.map(list => (
                              <option key={list.id} value={list.id}>{list.name}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={handleCreateNewList}
                          className="inline-flex items-center gap-1 text-sm bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
                          title="Create a new list"
                        >
                          <PlusCircle size={14} />
                          New List
                        </button>
                        
                        <button
                          onClick={handleSetListColor}
                          className="inline-flex items-center text-sm bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
                          title="Change list color"
                        >
                          <Palette size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Show topic if this is a topic-specific list */}
                    {currentListItem?.topicId && (
                      <div className="mt-1 text-xs bg-white bg-opacity-20 inline-block px-2 py-0.5 rounded">
                        Topic: {currentListItem.topicId.replace(/-/g, ' ')}
                      </div>
                    )}
                  </div>
                  
                  {/* Desktop refresh button */}
                  <div className="hidden md:block">
                    <button
                      onClick={refreshActionItems}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white bg-opacity-20 hover:bg-opacity-30 text-sm"
                    >
                      <RefreshCw size={14} />
                      Refresh
                    </button>
                  </div>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto">
                  {/* Quick action item creation form */}
                  <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Create New Action Item</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter action item..."
                        className="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            handleCreateActionItem(e.currentTarget.value, currentListId);
                            e.currentTarget.value = '';
                            const listName = actionItemLists.find(list => list.id === currentListId)?.name || currentListId;
                            toast.success(`Action item added to "${listName}" list`);
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input && input.value.trim()) {
                            handleCreateActionItem(input.value, currentListId);
                            input.value = '';
                            const listName = actionItemLists.find(list => list.id === currentListId)?.name || currentListId;
                            toast.success(`Action item added to "${listName}" list`);
                          }
                        }}
                        className={`px-3 py-1.5 text-sm rounded hover:bg-opacity-90 ${getColorClass(fixedUIColor)}`}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <EnhancedActionItemsList 
                    key={`${refreshKey}-${currentListId}`}
                    businessId={currentBusinessId || undefined} 
                    listId={currentListId}
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