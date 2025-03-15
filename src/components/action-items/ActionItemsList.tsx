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
  filter?: (item: ActionItem) => boolean // Optional filter function for items
  onCreateNewItem?: () => void // Optional callback for creating a new item
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
  filter,
  onCreateNewItem
}: ActionItemsListProps) {
  const { userId } = useAuth()
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updateInProgress, setUpdateInProgress] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

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
      
      // Fetch action items from API
      const response = await fetch(`/api/action-items?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch action items')
      }
      
      const data = await response.json()
      setActionItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      console.error('Error fetching action items:', err)
    } finally {
      setIsLoading(false)
    }
  }

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

  // Fetch action items on component mount and when filters change
  useEffect(() => {
    fetchActionItems()
  }, [conversationId, messageId, parentId, rootItemsOnly, userId])

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

  // Render the action items list
  return (
    <div className="space-y-3">
      {actionItems
        // Apply any custom filter function provided as a prop
        .filter(item => filter ? filter(item) : true)
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
                {item.content}
              </p>
              
              {/* Show notes if available */}
              {item.notes && (
                <p className="mt-1 text-sm text-gray-500">
                  {item.notes}
                </p>
              )}
              
              {/* Show metadata for debugging/development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-400">
                  <p>ID: {item.id}</p>
                  <p>Created: {new Date(item.createdAt).toLocaleString()}</p>
                </div>
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