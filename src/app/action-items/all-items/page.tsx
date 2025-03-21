'use client'

import React, { useState, useEffect } from 'react'
import { Trash2, ListTodo, RefreshCw, Loader2, AlertTriangle } from 'lucide-react'
import ClientLayout from '@/components/ClientLayout'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'

/**
 * Interface for action list
 */
interface ActionList {
  id: string;
  name: string;
  color: string;
  parentId?: string;
  items?: ActionItem[];
}

/**
 * Interface for action item
 */
interface ActionItem {
  id: string;
  content: string;
  isCompleted: boolean;
  listId?: string;
}

/**
 * All Action Items Page
 * 
 * A simple page that shows all action item lists, sub-lists and action items in separate sections
 * with buttons to delete all items in each category
 */
export default function AllActionItemsPage() {
  const { isAuthenticated } = useAuth()
  const [lists, setLists] = useState<ActionList[]>([])
  const [allItems, setAllItems] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({})
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all action lists and organize them into parent lists and sublists
   */
  const fetchLists = async () => {
    if (!isAuthenticated) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch all action lists
      const listsResponse = await fetch('/api/action-item-lists')
      if (!listsResponse.ok) {
        throw new Error('Failed to fetch action lists')
      }
      
      const listsData = await listsResponse.json()
      console.log(`Fetched ${listsData.length} action lists`)
      
      // Fetch all action items
      const itemsResponse = await fetch('/api/action-items?limit=1000')
      if (!itemsResponse.ok) {
        throw new Error('Failed to fetch action items')
      }
      
      const itemsData = await itemsResponse.json()
      console.log(`Fetched ${itemsData.length} action items`)
      
      // Assign items to their respective lists
      const listsWithItems = listsData.map((list: ActionList) => {
        const listItems = itemsData.filter((item: ActionItem) => item.listId === list.id)
        return { ...list, items: listItems }
      })
      
      setLists(listsWithItems)
      setAllItems(itemsData)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Delete all action items in a specific list
   */
  const deleteListItems = async (listId: string) => {
    if (!window.confirm('Are you sure you want to delete all items in this list?')) {
      return
    }
    
    setIsDeleting(prev => ({ ...prev, [listId]: true }))
    
    try {
      // Get all items in this list
      const itemsToDelete = allItems.filter(item => item.listId === listId)
      
      // Delete each item
      const deletePromises = itemsToDelete.map(item => 
        fetch(`/api/action-items/${item.id}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      toast.success(`Deleted ${itemsToDelete.length} items from list`)
      
      // Refresh the data
      fetchLists()
    } catch (err) {
      console.error('Error deleting list items:', err)
      toast.error('Failed to delete all items in this list')
    } finally {
      setIsDeleting(prev => ({ ...prev, [listId]: false }))
    }
  }

  /**
   * Delete all items that don't belong to a list
   */
  const deleteOrphanedItems = async () => {
    if (!window.confirm('Are you sure you want to delete all items that don\'t belong to a list?')) {
      return
    }
    
    setIsDeleting(prev => ({ ...prev, orphaned: true }))
    
    try {
      // Get all items that don't have a listId
      const orphanedItems = allItems.filter(item => !item.listId)
      
      // Delete each item
      const deletePromises = orphanedItems.map(item => 
        fetch(`/api/action-items/${item.id}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      toast.success(`Deleted ${orphanedItems.length} orphaned items`)
      
      // Refresh the data
      fetchLists()
    } catch (err) {
      console.error('Error deleting orphaned items:', err)
      toast.error('Failed to delete orphaned items')
    } finally {
      setIsDeleting(prev => ({ ...prev, orphaned: false }))
    }
  }

  /**
   * Delete all action items (with confirmation)
   */
  const deleteAllItems = async () => {
    if (!window.confirm('⚠️ WARNING: Are you sure you want to delete ALL action items? This action cannot be undone.')) {
      return
    }
    
    // Double confirm
    if (!window.confirm('⚠️ FINAL WARNING: This will permanently delete ALL your action items. Proceed?')) {
      return
    }
    
    setIsDeleting(prev => ({ ...prev, all: true }))
    
    try {
      // Delete each item
      const deletePromises = allItems.map(item => 
        fetch(`/api/action-items/${item.id}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      toast.success(`Deleted all ${allItems.length} action items`)
      
      // Refresh the data
      fetchLists()
    } catch (err) {
      console.error('Error deleting all items:', err)
      toast.error('Failed to delete all action items')
    } finally {
      setIsDeleting(prev => ({ ...prev, all: false }))
    }
  }

  /**
   * Delete an action list (and optionally its items)
   */
  const deleteList = async (listId: string, deleteItems: boolean = true) => {
    if (!window.confirm('Are you sure you want to delete this list?')) {
      return
    }
    
    setIsDeleting(prev => ({ ...prev, [`list_${listId}`]: true }))
    
    try {
      // If requested, delete all items in this list first
      if (deleteItems) {
        const itemsToDelete = allItems.filter(item => item.listId === listId)
        
        if (itemsToDelete.length > 0) {
          const deleteItemsPromises = itemsToDelete.map(item => 
            fetch(`/api/action-items/${item.id}`, { method: 'DELETE' })
          )
          
          await Promise.all(deleteItemsPromises)
          console.log(`Deleted ${itemsToDelete.length} items from list ${listId}`)
        }
      }
      
      // Now delete the list itself
      const response = await fetch(`/api/action-item-lists/${listId}`, { 
        method: 'DELETE' 
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete list')
      }
      
      toast.success('List deleted successfully')
      
      // Refresh the data
      fetchLists()
    } catch (err) {
      console.error('Error deleting list:', err)
      toast.error('Failed to delete the list')
    } finally {
      setIsDeleting(prev => ({ ...prev, [`list_${listId}`]: false }))
    }
  }

  /**
   * Effect to fetch lists on component mount
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchLists()
    }
  }, [isAuthenticated])

  /**
   * Get parent lists (lists with no parentId)
   */
  const parentLists = lists.filter(list => !list.parentId)

  /**
   * Get sublists (lists with a parentId)
   */
  const sublists = lists.filter(list => list.parentId)

  /**
   * Get orphaned items (items with no listId)
   */
  const orphanedItems = allItems.filter(item => !item.listId)

  return (
    <ClientLayout>
      <div className="container mx-auto p-4 max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListTodo className="text-blue-600" />
            All Action Items
          </h1>
          <p className="text-gray-600">
            View all action item lists, sublists, and items. You can delete all items in each category.
          </p>
        </header>

        {!isAuthenticated ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center my-8">
            <p className="text-yellow-700 mb-4">Please sign in to view your action items.</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-blue-600 mr-2" size={24} />
                <span>Loading action items...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertTriangle className="text-red-500 mx-auto mb-2" size={32} />
                <p className="text-red-700">{error}</p>
                <button 
                  onClick={fetchLists}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {/* Refresh button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={fetchLists}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <RefreshCw size={16} />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* Delete all items button */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-red-700">Danger Zone</h3>
                      <p className="text-red-600 text-sm">This will delete ALL action items</p>
                    </div>
                    <button
                      onClick={deleteAllItems}
                      disabled={isDeleting.all || allItems.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      {isDeleting.all ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      <span>Delete All ({allItems.length} items)</span>
                    </button>
                  </div>
                </div>

                {/* Parent Lists Section */}
                <section className="border border-gray-200 rounded-lg shadow-sm bg-white">
                  <div className="p-4 border-b border-gray-200 bg-blue-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-blue-800">Parent Lists ({parentLists.length})</h2>
                    {parentLists.length > 0 && (
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ALL ${parentLists.length} parent lists and their items?`)) {
                              parentLists.forEach(list => deleteList(list.id, true))
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
                        >
                          <Trash2 size={14} />
                          <span>Delete All Lists</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {parentLists.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No parent lists found
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {parentLists.map(list => (
                        <div key={list.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium text-gray-800 flex items-center">
                                <div className={`w-3 h-3 rounded-full bg-${list.color} mr-2`}></div>
                                {list.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {list.items?.length || 0} items
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => deleteListItems(list.id)}
                                disabled={isDeleting[list.id] || !list.items?.length}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                              >
                                {isDeleting[list.id] ? (
                                  <Loader2 className="animate-spin" size={14} />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                                <span>Delete Items</span>
                              </button>
                              <button
                                onClick={() => deleteList(list.id)}
                                disabled={isDeleting[`list_${list.id}`]}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:bg-gray-300 disabled:text-gray-500"
                              >
                                {isDeleting[`list_${list.id}`] ? (
                                  <Loader2 className="animate-spin" size={14} />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                                <span>Delete List</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Sublists Section */}
                <section className="border border-gray-200 rounded-lg shadow-sm bg-white">
                  <div className="p-4 border-b border-gray-200 bg-purple-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-purple-800">Sublists ({sublists.length})</h2>
                    {sublists.length > 0 && (
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ALL ${sublists.length} sublists and their items?`)) {
                              sublists.forEach(list => deleteList(list.id, true))
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm"
                        >
                          <Trash2 size={14} />
                          <span>Delete All Sublists</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {sublists.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No sublists found
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {sublists.map(list => {
                        // Find parent list name
                        const parentList = lists.find(l => l.id === list.parentId);
                        return (
                          <div key={list.id} className="p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-medium text-gray-800 flex items-center">
                                  <div className={`w-3 h-3 rounded-full bg-${list.color} mr-2`}></div>
                                  {list.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {parentList ? `Parent: ${parentList.name}` : 'No parent'} • {list.items?.length || 0} items
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => deleteListItems(list.id)}
                                  disabled={isDeleting[list.id] || !list.items?.length}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                  {isDeleting[list.id] ? (
                                    <Loader2 className="animate-spin" size={14} />
                                  ) : (
                                    <Trash2 size={14} />
                                  )}
                                  <span>Delete Items</span>
                                </button>
                                <button
                                  onClick={() => deleteList(list.id)}
                                  disabled={isDeleting[`list_${list.id}`]}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:bg-gray-300 disabled:text-gray-500"
                                >
                                  {isDeleting[`list_${list.id}`] ? (
                                    <Loader2 className="animate-spin" size={14} />
                                  ) : (
                                    <Trash2 size={14} />
                                  )}
                                  <span>Delete List</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Orphaned Items Section */}
                <section className="border border-gray-200 rounded-lg shadow-sm bg-white">
                  <div className="p-4 border-b border-gray-200 bg-amber-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-amber-800">Orphaned Items ({orphanedItems.length})</h2>
                    <button
                      onClick={deleteOrphanedItems}
                      disabled={isDeleting.orphaned || orphanedItems.length === 0}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      {isDeleting.orphaned ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      <span>Delete All Orphaned Items</span>
                    </button>
                  </div>
                  
                  {orphanedItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No orphaned items found
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                      {orphanedItems.map(item => (
                        <div key={item.id} className="p-3 hover:bg-gray-50 text-sm">
                          <div className="flex items-start gap-2">
                            <div className={`flex-shrink-0 w-4 h-4 rounded-full mt-0.5 ${item.isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}></div>
                            <div className="flex-grow">
                              <p className={`${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                {item.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </ClientLayout>
  )
} 