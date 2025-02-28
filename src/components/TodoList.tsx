'use client'

import { useState, useEffect } from 'react'
import { Check, Trash, Edit, Plus, Calendar, Clock, AlertCircle, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { format } from 'date-fns'

/**
 * Interface for a todo item
 */
interface TodoItem {
  id: string
  content: string
  completed: boolean
  dueDate?: string | null
  priority?: 'high' | 'medium' | 'low' | null
  description?: string | null  // Additional details about the task
  categoryTags?: string | null // Comma-separated list of category tags
  checklist?: string | null    // Pipe-separated list of checklist items
  createdAt: string
  updatedAt: string
}

/**
 * Interface for a todo list
 */
interface TodoList {
  id: string
  title: string
  description?: string
  createdAt: string
  updatedAt: string
  conversationId?: string
  items: TodoItem[]
}

/**
 * Props for the TodoList component
 */
interface TodoListProps {
  todoListId?: string
  initialData?: TodoList
  onListUpdated?: (updatedList: TodoList) => void
}

/**
 * TodoList component for displaying and managing todo items
 * Allows creating, editing, and completing todo items
 */
export default function TodoList({ 
  todoListId, 
  initialData,
  onListUpdated 
}: TodoListProps) {
  // State
  const [todoList, setTodoList] = useState<TodoList | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData && !!todoListId)
  const [error, setError] = useState<string | null>(null)
  
  // New item state
  const [newItemContent, setNewItemContent] = useState('')
  const [newItemPriority, setNewItemPriority] = useState<string | null>(null)
  const [newItemDueDate, setNewItemDueDate] = useState<string | null>(null)
  const [newItemDescription, setNewItemDescription] = useState<string | null>(null)
  const [newItemCategoryTags, setNewItemCategoryTags] = useState<string | null>(null)
  const [newItemChecklist, setNewItemChecklist] = useState<string | null>(null)
  const [showNewItemDetails, setShowNewItemDetails] = useState(false)
  
  // Edit state
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editPriority, setEditPriority] = useState<string | null>(null)
  const [editDueDate, setEditDueDate] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState<string | null>(null)
  const [editCategoryTags, setEditCategoryTags] = useState<string | null>(null)
  const [editChecklist, setEditChecklist] = useState<string | null>(null)
  
  // Fetch todo list data if todoListId is provided
  useEffect(() => {
    if (todoListId && !initialData) {
      fetchTodoList()
    }
  }, [todoListId, initialData])
  
  /**
   * Fetches a todo list by ID from the API
   */
  const fetchTodoList = async () => {
    if (!todoListId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/todo-list/${todoListId}`)
      if (!response.ok) throw new Error('Failed to load todo list')
      
      const data = await response.json()
      setTodoList(data)
    } catch (error) {
      console.error('Error fetching todo list:', error)
      toast.error('Failed to load todo list')
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Adds a new todo item to the list
   */
  const addTodoItem = async () => {
    if (!todoList || !newItemContent.trim()) return
    
    try {
      const response = await fetch(`/api/todo-list/${todoList.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newItemContent,
          priority: newItemPriority,
          dueDate: newItemDueDate,
          description: newItemDescription,
          categoryTags: newItemCategoryTags,
          checklist: newItemChecklist
        }),
      })
      
      if (!response.ok) throw new Error('Failed to add todo item')
      
      const newItem = await response.json()
      
      // Update local state
      const updatedList = {
        ...todoList,
        items: [...todoList.items, newItem]
      }
      
      setTodoList(updatedList)
      setNewItemContent('')
      setNewItemPriority(null)
      setNewItemDueDate(null)
      setNewItemDescription(null)
      setNewItemCategoryTags(null)
      setNewItemChecklist(null)
      setShowNewItemDetails(false)
      
      // Notify parent component
      if (onListUpdated) {
        onListUpdated(updatedList)
      }
      
      toast.success('Todo item added')
    } catch (error) {
      console.error('Error adding todo item:', error)
      toast.error('Failed to add todo item')
    }
  }
  
  /**
   * Toggles the completion status of a todo item
   * @param id - ID of the todo item to toggle
   * @param currentStatus - Current completion status
   */
  const toggleItemCompletion = async (id: string, currentStatus: boolean) => {
    if (!todoList) return
    
    try {
      const response = await fetch(`/api/todo-list/${todoList.id}/items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !currentStatus
        }),
      })
      
      if (!response.ok) throw new Error('Failed to update todo item')
      
      // Update local state
      const updatedItems = todoList.items.map(item => 
        item.id === id ? { ...item, completed: !currentStatus } : item
      )
      
      const updatedList = {
        ...todoList,
        items: updatedItems
      }
      
      setTodoList(updatedList)
      
      // Notify parent component
      if (onListUpdated) {
        onListUpdated(updatedList)
      }
    } catch (error) {
      console.error('Error updating todo item:', error)
      toast.error('Failed to update todo item')
    }
  }
  
  /**
   * Deletes a todo item from the list
   * @param id - ID of the todo item to delete
   */
  const deleteTodoItem = async (id: string) => {
    if (!todoList) return
    
    try {
      const response = await fetch(`/api/todo-list/${todoList.id}/items/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete todo item')
      
      // Update local state
      const updatedItems = todoList.items.filter(item => item.id !== id)
      
      const updatedList = {
        ...todoList,
        items: updatedItems
      }
      
      setTodoList(updatedList)
      
      // Notify parent component
      if (onListUpdated) {
        onListUpdated(updatedList)
      }
      
      toast.success('Todo item deleted')
    } catch (error) {
      console.error('Error deleting todo item:', error)
      toast.error('Failed to delete todo item')
    }
  }
  
  /**
   * Starts editing a todo item
   * @param item - The todo item to edit
   */
  const startEditing = (item: TodoItem) => {
    setEditingItem(item.id)
    setEditContent(item.content)
    setEditPriority(item.priority ?? null)
    setEditDueDate(item.dueDate ?? null)
    setEditDescription(item.description ?? null)
    setEditCategoryTags(item.categoryTags ?? null)
    setEditChecklist(item.checklist ?? null)
  }
  
  /**
   * Cancels the current edit operation
   */
  const cancelEdit = () => {
    setEditingItem(null)
    setEditContent('')
    setEditPriority(null)
    setEditDueDate(null)
    setEditDescription(null)
    setEditCategoryTags(null)
    setEditChecklist(null)
  }
  
  /**
   * Saves the edited todo item
   */
  const saveEdit = async () => {
    if (!todoList || !editingItem || !editContent.trim()) return
    
    try {
      const response = await fetch(`/api/todo-list/${todoList.id}/items/${editingItem}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent,
          priority: editPriority,
          dueDate: editDueDate,
          description: editDescription,
          categoryTags: editCategoryTags,
          checklist: editChecklist
        }),
      })
      
      if (!response.ok) throw new Error('Failed to update todo item')
      
      const updatedItem = await response.json()
      
      // Update local state
      const updatedItems = todoList.items.map(item => 
        item.id === editingItem ? updatedItem : item
      )
      
      const updatedList = {
        ...todoList,
        items: updatedItems
      }
      
      setTodoList(updatedList)
      setEditingItem(null)
      
      // Notify parent component
      if (onListUpdated) {
        onListUpdated(updatedList)
      }
      
      toast.success('Todo item updated')
    } catch (error) {
      console.error('Error updating todo item:', error)
      toast.error('Failed to update todo item')
    }
  }
  
  /**
   * Renders a priority badge
   * @param priority - Priority level
   */
  const PriorityBadge = ({ priority }: { priority: string | null | undefined }) => {
    if (!priority) return null
    
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[priority as keyof typeof colors]}`}>
        {priority}
      </span>
    )
  }
  
  // Loading state
  if (loading) {
    return <div className="p-4 text-center">Loading todo list...</div>
  }
  
  // No todo list found
  if (!todoList) {
    return <div className="p-4 text-center">No todo list found</div>
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 bg-blue-50 border-b border-blue-100">
        <h2 className="text-xl font-semibold text-gray-800">{todoList.title}</h2>
        {todoList.description && (
          <p className="text-sm text-gray-600 mt-1">{todoList.description}</p>
        )}
      </div>
      
      {/* Add new todo item */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start gap-2">
          <input
            type="text"
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTodoItem}
            disabled={!newItemContent.trim()}
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <button 
          onClick={() => setShowNewItemDetails(!showNewItemDetails)}
          className="text-xs text-blue-600 mt-2 hover:underline"
        >
          {showNewItemDetails ? 'Hide details' : 'Add details'}
        </button>
        
        {/* Optional metadata for new item */}
        {showNewItemDetails && (
          <div className="mt-2 space-y-3 p-3 bg-gray-50 rounded">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Priority:</span>
                <select
                  value={newItemPriority || ''}
                  onChange={(e) => setNewItemPriority(e.target.value as any || null)}
                  className="text-xs border rounded p-1"
                >
                  <option value="">None</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Due date:</span>
                <input
                  type="date"
                  value={newItemDueDate || ''}
                  onChange={(e) => setNewItemDueDate(e.target.value || null)}
                  className="text-xs border rounded p-1"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs text-gray-500 block mb-1">Description:</label>
              <textarea
                value={newItemDescription || ''}
                onChange={(e) => setNewItemDescription(e.target.value || null)}
                placeholder="Add more details about this task..."
                className="w-full text-sm border rounded p-2 h-20"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-500 block mb-1">Categories (comma-separated):</label>
              <input
                type="text"
                value={newItemCategoryTags || ''}
                onChange={(e) => setNewItemCategoryTags(e.target.value || null)}
                placeholder="e.g. Marketing, Website, Urgent"
                className="w-full text-sm border rounded p-2"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-500 block mb-1">Checklist (one item per line):</label>
              <textarea
                value={newItemChecklist || ''}
                onChange={(e) => setNewItemChecklist(e.target.value ? e.target.value.replace(/\n/g, '|') : null)}
                placeholder="Add steps to complete this task..."
                className="w-full text-sm border rounded p-2 h-20"
              />
              <p className="text-xs text-gray-400 mt-1">Each line will become a checklist item</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Todo items */}
      <ul className="divide-y divide-gray-200">
        {todoList.items.length === 0 ? (
          <li className="p-4 text-center text-gray-500">No tasks yet. Add one above!</li>
        ) : (
          todoList.items.map((item) => (
            <li key={item.id} className="p-3 hover:bg-gray-50">
              {editingItem === item.id ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={saveEdit}
                      disabled={!editContent.trim()}
                      className="text-green-600 hover:text-green-800 p-1"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-gray-600 hover:text-gray-800 p-1"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Priority:</span>
                      <select
                        value={editPriority || ''}
                        onChange={(e) => setEditPriority(e.target.value || null)}
                        className="text-xs border rounded p-1"
                      >
                        <option value="">None</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Due date:</span>
                      <input
                        type="date"
                        value={editDueDate || ''}
                        onChange={(e) => setEditDueDate(e.target.value || null)}
                        className="text-xs border rounded p-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Description:</label>
                    <textarea
                      value={editDescription || ''}
                      onChange={(e) => setEditDescription(e.target.value || null)}
                      className="w-full text-sm border rounded p-2 h-20"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Categories:</label>
                    <input
                      type="text"
                      value={editCategoryTags || ''}
                      onChange={(e) => setEditCategoryTags(e.target.value || null)}
                      className="w-full text-sm border rounded p-2"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Checklist:</label>
                    <textarea
                      value={editChecklist ? editChecklist.replace(/\|/g, '\n') : ''}
                      onChange={(e) => setEditChecklist(e.target.value ? e.target.value.replace(/\n/g, '|') : null)}
                      className="w-full text-sm border rounded p-2 h-20"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggleItemCompletion(item.id, item.completed)}
                    className={`p-1 rounded-md mt-0.5 ${
                      item.completed 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <Check size={16} />
                  </button>
                  
                  <div className="flex-1">
                    <div 
                      className={`${
                        item.completed ? 'line-through text-gray-500' : 'text-gray-800'
                      }`}
                    >
                      {item.content}
                    </div>
                    
                    {/* Task metadata */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      <PriorityBadge priority={item.priority} />
                      
                      {item.dueDate && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      
                      {item.categoryTags && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.categoryTags.split(',').map((tag, index) => (
                            <span 
                              key={index} 
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Description */}
                    {item.description && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {item.description}
                      </div>
                    )}
                    
                    {/* Checklist */}
                    {item.checklist && (
                      <div className="mt-2">
                        <h4 className="text-xs font-medium text-gray-700">Checklist:</h4>
                        <ul className="mt-1 space-y-1">
                          {item.checklist.split('|').map((step, index) => (
                            <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                              <span className="text-gray-400 mt-0.5">•</span>
                              <span>{step.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <button
                      onClick={() => startEditing(item)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteTodoItem(item.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
      
      {/* List summary */}
      <div className="p-3 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
        <div>
          {todoList.items.filter(i => i.completed).length} of {todoList.items.length} tasks completed
        </div>
        <div>
          Created: {new Date(todoList.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
} 