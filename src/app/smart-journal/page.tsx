'use client'

import { useState, useEffect } from 'react'
import SmartJournal from '@/components/SmartJournal'
import TodoList from '@/components/TodoList'
import { toast } from 'react-toastify'

/**
 * Smart Journal Page
 * 
 * Combines a chat interface with to-do list extraction capabilities
 * Allows business owners to journal their activities and automatically extract tasks
 */
export default function SmartJournalPage() {
  // State
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [todoLists, setTodoLists] = useState<any[]>([])
  const [selectedTodoList, setSelectedTodoList] = useState<string | null>(null)
  const [showTodoLists, setShowTodoLists] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Load todo lists when the component mounts or when a new list is created
  useEffect(() => {
    fetchTodoLists()
  }, [])
  
  /**
   * Fetches all todo lists from the API
   */
  const fetchTodoLists = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/todo-list')
      if (!response.ok) throw new Error('Failed to load todo lists')
      
      const data = await response.json()
      setTodoLists(data)
      
      // Select the first todo list if there is one and none is selected
      if (data.length > 0 && !selectedTodoList) {
        setSelectedTodoList(data[0].id)
      }
    } catch (error) {
      console.error('Error loading todo lists:', error)
      toast.error('Failed to load todo lists')
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Handles the creation of a new conversation
   * @param id - ID of the newly created conversation
   */
  const handleConversationCreated = (id: string) => {
    setConversationId(id)
  }
  
  /**
   * Handles the creation of a new todo list
   * Called when tasks are extracted from a conversation
   * @param todoList - The newly created todo list
   */
  const handleTodoListCreated = (todoList: any) => {
    // Add the new todo list to the list
    setTodoLists(prev => [todoList, ...prev])
    
    // Select the new todo list
    setSelectedTodoList(todoList.id)
    
    // Show the todo lists panel
    setShowTodoLists(true)
  }
  
  /**
   * Handles updates to a todo list
   * @param updatedList - The updated todo list
   */
  const handleListUpdated = (updatedList: any) => {
    setTodoLists(prev => 
      prev.map(list => list.id === updatedList.id ? updatedList : list)
    )
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800">Smart Business Journal</h1>
          <p className="text-gray-600">Record your business activities and automatically extract tasks</p>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 overflow-hidden">
        <div className="flex h-full gap-4">
          {/* Journal chat */}
          <div className={`flex-1 transition-all duration-200 ${showTodoLists ? 'w-1/2' : 'w-full'}`}>
            <SmartJournal 
              conversationId={conversationId}
              onConversationCreated={handleConversationCreated}
              onTodoListCreated={handleTodoListCreated}
            />
          </div>
          
          {/* Todo lists */}
          <div 
            className={`bg-white rounded-lg shadow-md transition-all duration-200 overflow-hidden ${
              showTodoLists ? 'w-1/2 flex flex-col' : 'w-0'
            }`}
          >
            {showTodoLists && (
              <>
                <div className="p-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">To-Do Lists</h2>
                  <button 
                    onClick={() => setShowTodoLists(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Hide
                  </button>
                </div>
                
                {todoLists.length > 0 ? (
                  <div className="flex flex-col h-full">
                    {/* Todo list selector */}
                    {todoLists.length > 1 && (
                      <div className="p-2 border-b border-gray-200">
                        <select
                          value={selectedTodoList || ''}
                          onChange={(e) => setSelectedTodoList(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded bg-white"
                        >
                          {todoLists.map(list => (
                            <option key={list.id} value={list.id}>
                              {list.title} ({list.items.length} items)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* Selected todo list */}
                    <div className="flex-1 overflow-auto">
                      {selectedTodoList && (
                        <TodoList
                          todoListId={selectedTodoList}
                          initialData={todoLists.find(list => list.id === selectedTodoList)}
                          onListUpdated={handleListUpdated}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {loading ? (
                      'Loading to-do lists...'
                    ) : (
                      'No to-do lists yet. Start a conversation and create tasks!'
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Toggle todo lists button */}
          {!showTodoLists && todoLists.length > 0 && (
            <button
              onClick={() => setShowTodoLists(true)}
              className="flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-md text-blue-600 text-sm font-medium"
            >
              Show To-Do Lists ({todoLists.length})
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 