'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-toastify'

/**
 * WARNING: TEMPORARY PAGE
 * This page is for development/testing purposes only.
 * It should be removed before deploying to production.
 * 
 * Purpose:
 * Provides functionality to delete all business plans and temporary users.
 */

export default function CleanupPage() {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleDeleteAll = async () => {
    if (confirmText !== 'DELETE ALL') {
      toast.error('Please type DELETE ALL to confirm')
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch('/api/business-plans/delete-all', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to delete business plans')
      }

      const data = await response.json()
      toast.success(`Successfully deleted ${data.deletedPlans} plans and ${data.deletedUsers} temporary users`)
      router.push('/')
    } catch (error) {
      console.error('Error deleting business plans:', error)
      toast.error('Failed to delete business plans')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Cleanup Page</h1>
            <Link 
              href="/"
              className="px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              Back to Home
            </Link>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-red-700 mb-4">⚠️ Warning</h2>
            <p className="text-red-600 mb-4">
              This action will permanently delete ALL business plans and their associated temporary users.
              This cannot be undone.
            </p>
            <p className="text-red-600 font-medium">
              Type DELETE ALL in the box below to confirm.
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE ALL to confirm"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            <button
              onClick={handleDeleteAll}
              disabled={isDeleting || confirmText !== 'DELETE ALL'}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                'Delete All Business Plans'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 