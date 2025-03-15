'use client'

import React, { useState, useEffect } from 'react'
import { HelpCircle, ListTodo, PlusCircle, ChevronLeft, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ClientLayout from '@/components/ClientLayout'
import SimpleChat from '@/components/chat/SimpleChat'
import EnhancedActionItemsList from '@/components/action-items/EnhancedActionItemsList'
import { toast } from 'react-toastify'

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
 */
export default function ActionPlannerPage() {
  const { isAuthenticated, currentBusinessId } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)
  const [isMobileChatVisible, setIsMobileChatVisible] = useState(true)
  const [currentActionItemId, setCurrentActionItemId] = useState<string | null>(null)
  
  // State for managing multiple action item lists
  const [actionItemLists, setActionItemLists] = useState<Array<{id: string, name: string}>>([
    {id: 'default', name: 'Default Action Items'}
  ])
  const [currentListId, setCurrentListId] = useState('default')
  
  // Listen for create-list events from the SimpleChat component
  useEffect(() => {
    const handleCreateList = (event: CustomEvent) => {
      const { id, name } = event.detail;
      createNewList(name, id);
    };
    
    window.addEventListener('create-list', handleCreateList as EventListener);
    
    return () => {
      window.removeEventListener('create-list', handleCreateList as EventListener);
    };
  }, []);
  
  /**
   * Create a new action item list
   * 
   * @param name - The name of the new list
   * @param id - Optional ID for the new list (if not provided, one will be generated)
   */
  const createNewList = (name: string, id?: string) => {
    const newId = id || `list-${Date.now()}`
    setActionItemLists(prev => [...prev, {id: newId, name}])
    setCurrentListId(newId)
  }
  
  /**
   * Create an action item from chat message
   * 
   * This function is called from the SimpleChat component when an action item is detected
   * in a response or when the user manually creates an action item from a message.
   * 
   * @param content - The content of the action item
   * @param parentId - Optional parent ID if this is a child action item
   * @param callback - Optional callback that receives the created action item ID
   * @param listId - Optional list ID to specify which list to add to (defaults to current list)
   */
  const handleCreateActionItem = async (
    content: string, 
    parentId?: string, 
    callback?: (id: string) => void,
    listId?: string
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
      createNewList(listName.trim())
      toast.success(`Created new list: ${listName}`)
    }
  }
  
  /**
   * Refresh the action items list
   */
  const refreshActionItems = () => {
    setRefreshKey(prev => prev + 1)
  }
  
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
                onCreateActionItem={(content) => handleCreateActionItem(content, undefined, undefined, currentListId)}
                placeholderExamples={placeholderExamples}
                currentListId={currentListId}
                actionItemLists={actionItemLists}
                onListChange={(listId) => {
                  setCurrentListId(listId);
                  toast.info(`Switched to "${actionItemLists.find(list => list.id === listId)?.name || listId}" list`);
                }}
              />
            </div>
            
            {/* Action items section - Hidden on mobile when viewing chat */}
            <div className={`${isMobileChatVisible ? 'hidden md:block' : ''} md:h-[calc(100vh-12rem)] overflow-y-auto pb-6`}>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                      <ListTodo className="mr-2 text-blue-600" size={18} />
                      Action Items
                    </h2>
                    
                    {/* List selector dropdown */}
                    <div className="mt-2 flex items-center">
                      <select
                        value={currentListId}
                        onChange={(e) => setCurrentListId(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 mr-2"
                      >
                        {actionItemLists.map(list => (
                          <option key={list.id} value={list.id}>{list.name}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={handleCreateNewList}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <PlusCircle size={14} />
                        New List
                      </button>
                    </div>
                  </div>
                  
                  {/* Desktop refresh button */}
                  <div className="hidden md:block">
                    <button
                      onClick={refreshActionItems}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm"
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
                            handleCreateActionItem(e.currentTarget.value, undefined, undefined, currentListId);
                            e.currentTarget.value = '';
                            toast.success(`Action item added to "${actionItemLists.find(list => list.id === currentListId)?.name || currentListId}" list`);
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input && input.value.trim()) {
                            handleCreateActionItem(input.value, undefined, undefined, currentListId);
                            input.value = '';
                            toast.success(`Action item added to "${actionItemLists.find(list => list.id === currentListId)?.name || currentListId}" list`);
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <EnhancedActionItemsList 
                    key={`${refreshKey}-${currentListId}`}
                    businessId={currentBusinessId || undefined} 
                    showFilters={true}
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