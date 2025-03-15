'use client'

import React, { useState } from 'react'
import { ListTodo, Filter, RefreshCw, Plus, X, Send, Loader2 } from 'lucide-react'
import ClientLayout from '@/components/ClientLayout'
import ActionItemsList from '@/components/action-items/ActionItemsList'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'

/**
 * Action Items Page
 * 
 * Shows all action items for the user with filtering options
 * These action items are extracted automatically from assistant messages
 * Users can also manually add new action items
 */
export default function ActionItemsPage() {
  const { isAuthenticated } = useAuth()
  const [showCompleted, setShowCompleted] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [key, setKey] = useState(0) // Used to force re-render of ActionItemsList
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Refresh action items list
  const refreshList = () => {
    setKey(prev => prev + 1)
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

        {/* Filters section */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>
          
          {/* Show/hide completed items */}
          <div className="flex items-center">
            <label htmlFor="show-completed" className="flex items-center cursor-pointer">
              <input
                id="show-completed"
                type="checkbox"
                checked={showCompleted}
                onChange={() => setShowCompleted(!showCompleted)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="ml-2 text-sm text-gray-700">Show completed items</span>
            </label>
          </div>
          
          {/* Conversation filter - would be populated from API in a full implementation */}
          {/*
          <div className="flex-1 min-w-[200px]">
            <select 
              value={selectedConversation || ''}
              onChange={(e) => setSelectedConversation(e.target.value || null)}
              className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All conversations</option>
              <option value="conversation1">Marketing Plan</option>
              <option value="conversation2">Business Strategy</option>
            </select>
          </div>
          */}
        </div>
        
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
          /* Action items content */
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Action Items</h2>
              
              {/* The action items list component */}
              <ActionItemsList 
                key={key} 
                conversationId={selectedConversation || undefined}
                rootItemsOnly={true}
                filter={showCompleted ? undefined : (item => !item.isCompleted)}
                onCreateNewItem={openNewItemForm}
              />
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  )
} 