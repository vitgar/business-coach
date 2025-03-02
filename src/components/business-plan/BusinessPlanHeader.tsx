// FILE MARKED FOR REMOVAL
// This component is being replaced as part of the business plan page redesign
// See replacementplan.md for details

/*
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  Check, 
  ChevronDown, 
  DownloadCloud, 
  Edit, 
  Save,
  X
} from 'lucide-react'
import { toast } from 'react-toastify'

interface Props {
  businessPlanId: string
  title: string
  status: string
  lastUpdated: string
}

/**
 * Business Plan Header Component
 * 
 * Provides the title, actions, and status indicator for a business plan.
 * Supports editing the title and displays the last updated timestamp.
 */
export default function BusinessPlanHeader({ 
  businessPlanId, 
  title, 
  status, 
  lastUpdated 
}: Props) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(title)
  const [isSaving, setIsSaving] = useState(false)
  const [isActionsOpen, setIsActionsOpen] = useState(false)

  // Format the last updated date
  const formattedDate = new Date(lastUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  /**
   * Handle saving the edited title
   */
  const handleSaveTitle = async () => {
    if (editedTitle.trim() === '') {
      toast.error('Business plan title cannot be empty')
      return
    }

    if (editedTitle === title) {
      setIsEditing(false)
      return
    }

    try {
      setIsSaving(true)
      
      const response = await fetch(`/api/business-plans/${businessPlanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editedTitle }),
      })

      if (!response.ok) {
        throw new Error('Failed to update title')
      }

      toast.success('Business plan title updated')
      router.refresh()
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating title:', error)
      toast.error('Failed to update business plan title')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Cancel title editing
   */
  const handleCancelEdit = () => {
    setEditedTitle(title)
    setIsEditing(false)
  }

  /**
   * Toggle the status of the business plan between 'in-progress' and 'completed'
   */
  const toggleStatus = async () => {
    const newStatus = status === 'completed' ? 'in-progress' : 'completed'
    
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast.success(`Business plan marked as ${newStatus}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update business plan status')
    }
  }

  /**
   * Handle the export to PDF functionality
   */
  const handleExportPDF = () => {
    toast.info('Export to PDF functionality coming soon!')
    setIsActionsOpen(false)
  }

  /**
   * Handle the export to Word functionality
   */
  const handleExportWord = () => {
    toast.info('Export to Word functionality coming soon!')
    setIsActionsOpen(false)
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
      <div className="flex flex-col gap-1 flex-grow max-w-2xl">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="border rounded px-3 py-2 text-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
              autoFocus
            />
            <button 
              onClick={handleSaveTitle}
              disabled={isSaving}
              className="p-2 text-green-600 hover:text-green-800 disabled:opacity-50"
              aria-label="Save title"
            >
              <Save size={20} />
            </button>
            <button 
              onClick={handleCancelEdit}
              className="p-2 text-red-600 hover:text-red-800"
              aria-label="Cancel editing"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              {title}
            </h1>
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-500 hover:text-gray-700"
              aria-label="Edit title"
            >
              <Edit size={16} />
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>Last updated: {formattedDate}</span>
          <div 
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {status === 'completed' ? 'Completed' : 'In Progress'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          onClick={toggleStatus}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
            status === 'completed'
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-green-100 hover:bg-green-200 text-green-700'
          }`}
        >
          <Check size={16} />
          {status === 'completed' ? 'Mark as In Progress' : 'Mark as Complete'}
        </button>
        
        <div className="relative">
          <button
            onClick={() => setIsActionsOpen(!isActionsOpen)}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
          >
            <BookOpen size={16} />
            Export
            <ChevronDown size={14} />
          </button>
          
          {isActionsOpen && (
            <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <DownloadCloud size={16} />
                  Export as PDF
                </button>
                <button
                  onClick={handleExportWord}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <DownloadCloud size={16} />
                  Export as Word
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
*/

import { FC } from 'react'

// Temporary placeholder component for Business Plan Header
const BusinessPlanHeader: FC<any> = () => {
  return (
    <div className="p-4 border border-gray-300 rounded bg-gray-50">
      <h2 className="text-lg font-medium text-gray-800">Business Plan Header</h2>
      <p className="text-gray-500">This component is being redesigned.</p>
    </div>
  )
}

export default BusinessPlanHeader 