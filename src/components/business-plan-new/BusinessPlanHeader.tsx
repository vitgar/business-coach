'use client'

import { useState } from 'react'
import { Check, X, Edit2, Save, AlertCircle, Clock } from 'lucide-react'

/**
 * Business Plan Header Component Props
 */
interface BusinessPlanHeaderProps {
  businessPlan: {
    id: string
    title: string
    status: string
    updatedAt: string
    content?: {
      coverPage?: {
        businessName?: string
      }
    }
  }
  onSave: (title: string) => void
  savingStatus: 'idle' | 'saving' | 'saved' | 'error'
}

/**
 * BusinessPlanHeader Component
 * 
 * Displays the business plan title, status, and last updated date
 * Allows editing the title
 * Shows saving status
 */
export default function BusinessPlanHeader({ 
  businessPlan, 
  onSave,
  savingStatus 
}: BusinessPlanHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(
    businessPlan.content?.coverPage?.businessName || businessPlan.title
  )

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date)
  }

  // Handle title save
  const handleSaveTitle = () => {
    if (title.trim()) {
      onSave(title.trim())
      setIsEditing(false)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setTitle(businessPlan.content?.coverPage?.businessName || businessPlan.title)
    setIsEditing(false)
  }
  
  // Handle key press in input field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex-grow">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                placeholder="Business Plan Title"
              />
              <button
                onClick={handleSaveTitle}
                className="p-2 text-green-600 hover:text-green-800"
                aria-label="Save"
              >
                <Save className="h-5 w-5" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-2 text-red-600 hover:text-red-800"
                aria-label="Cancel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800 mr-2">
                {businessPlan.content?.coverPage?.businessName || businessPlan.title}
              </h1>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-500 hover:text-gray-700"
                aria-label="Edit title"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <div className="text-sm text-gray-500 mt-1">
            Last updated: {formatDate(businessPlan.updatedAt)}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Status Badge */}
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">Status:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              businessPlan.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {businessPlan.status === 'completed' ? 'Completed' : 'In Progress'}
            </span>
          </div>
          
          {/* Saving Status Indicator */}
          <div className="text-sm">
            {savingStatus === 'saving' && (
              <div className="flex items-center text-blue-600">
                <Clock className="h-4 w-4 mr-1 animate-pulse" />
                <span>Saving...</span>
              </div>
            )}
            {savingStatus === 'saved' && (
              <div className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-1" />
                <span>Saved</span>
              </div>
            )}
            {savingStatus === 'error' && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Error saving</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 