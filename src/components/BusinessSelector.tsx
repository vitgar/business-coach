'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useCurrentBusiness } from '@/contexts/AuthContext'
import { Briefcase, ChevronDown, PlusCircle, RefreshCw, Check, X } from 'lucide-react'
import { toast } from 'react-toastify'

// Extended interface to include businessName
interface BusinessSummaryExtended {
  id: string;
  title: string;
  businessName: string | null;
  status: 'draft' | 'completed';
  updatedAt: string;
}

/**
 * Business Selector Component
 * 
 * Displays a list of businesses belonging to the current user
 * and allows switching between them.
 */
export default function BusinessSelector() {
  const router = useRouter()
  const { userId, currentBusinessId, setCurrentBusinessId } = useAuth()
  const [businesses, setBusinesses] = useState<BusinessSummaryExtended[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [error, setError] = useState('')
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false)
  const [newBusinessName, setNewBusinessName] = useState('')

  // Fetch user's businesses
  useEffect(() => {
    if (!userId) return
    fetchBusinesses()
  }, [userId])

  // Function to fetch businesses
  const fetchBusinesses = async () => {
    if (!userId) return
    
    try {
      setIsLoading(true)
      setError('')
      const response = await fetch(`/api/users/${userId}/businesses`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch businesses')
      }
      
      const data = await response.json()
      
      // Sort businesses by updatedAt in descending order (most recently updated first)
      const sortedBusinesses = [...data].sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
      setBusinesses(sortedBusinesses)
      
      // If we don't have a currentBusinessId but we have businesses, select the most recent one
      if (!currentBusinessId && sortedBusinesses.length > 0) {
        setCurrentBusinessId(sortedBusinesses[0].id)
      }
    } catch (error) {
      console.error('Error fetching businesses:', error)
      setError('Could not load your businesses. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle business selection
  const handleSelectBusiness = (businessId: string) => {
    setCurrentBusinessId(businessId)
    setIsDropdownOpen(false)
    setIsCreatingBusiness(false)
  }

  // Initialize new business creation
  const handleInitNewBusiness = () => {
    setIsCreatingBusiness(true)
    setNewBusinessName('')
    setIsDropdownOpen(false) // Close dropdown when entering creation mode
  }

  // Cancel new business creation
  const handleCancelNewBusiness = () => {
    setIsCreatingBusiness(false)
  }

  // Create new business
  const handleCreateBusiness = async () => {
    if (!newBusinessName.trim()) {
      toast.error('Please enter a business name')
      return
    }

    try {
      setIsLoading(true)

      // Create a new business plan
      const response = await fetch('/api/business-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newBusinessName.trim()
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create business')
      }

      const data = await response.json()
      setCurrentBusinessId(data.id)
      
      // Refresh the business list
      fetchBusinesses()
      
      // Reset creation state
      setIsCreatingBusiness(false)
      toast.success('Business created successfully')
      
      // Note: We're not redirecting to the business plan page anymore
      // router.push(`/business-plan/${data.id}`)
      
    } catch (error) {
      console.error('Error creating business:', error)
      toast.error('Failed to create business')
    } finally {
      setIsLoading(false)
    }
  }

  // Find the currently selected business
  const currentBusiness = businesses.find(b => b.id === currentBusinessId)

  return (
    <div className="relative">
      {/* Business selector button or edit field */}
      {isCreatingBusiness ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 border border-blue-200 w-full">
          <Briefcase className="h-5 w-5 text-blue-500" />
          <input
            type="text"
            value={newBusinessName}
            onChange={(e) => setNewBusinessName(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-gray-700"
            placeholder="Enter business name..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateBusiness();
              } else if (e.key === 'Escape') {
                handleCancelNewBusiness();
              }
            }}
          />
          <button
            onClick={handleCreateBusiness}
            className="p-1 text-green-600 hover:text-green-800"
            aria-label="Save new business"
          >
            <Check className="h-5 w-5" />
          </button>
          <button
            onClick={handleCancelNewBusiness}
            className="p-1 text-red-600 hover:text-red-800"
            aria-label="Cancel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => isCreatingBusiness ? null : setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 w-full text-left"
        >
          <Briefcase className="h-5 w-5 text-gray-500" />
          <span className="flex-1">
            {isLoading ? (
              <span className="inline-flex items-center">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </span>
            ) : currentBusiness ? (
              <div className="flex flex-col">
                <span className="font-medium truncate">
                  {currentBusiness.businessName || currentBusiness.title}
                </span>
                <span className="text-xs text-gray-500">
                  Last updated: {new Date(currentBusiness.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ) : (
              <span className="text-gray-600">Select or add a business</span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      )}

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          {error && (
            <div className="p-3 text-sm text-red-500 border-b border-gray-200">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading your businesses...
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              <div className="p-1">
                {businesses.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    No businesses found. Add your first business to get started.
                  </div>
                ) : (
                  businesses.map(business => (
                    <button
                      key={business.id}
                      onClick={() => handleSelectBusiness(business.id)}
                      className={`px-4 py-2 rounded-md w-full text-left text-sm flex flex-col ${
                        currentBusinessId === business.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center w-full">
                        <span className="flex-1 font-medium truncate">
                          {business.businessName || business.title}
                        </span>
                        {business.status === 'completed' && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
                            Completed
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        Last updated: {new Date(business.updatedAt).toLocaleDateString(undefined, { 
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </button>
                  ))
                )}
              </div>
              
              <div className="border-t border-gray-200 p-1">
                <button
                  onClick={handleInitNewBusiness}
                  className="px-4 py-2 rounded-md w-full text-left text-sm flex items-center text-blue-600 hover:bg-blue-50 business-selector-create"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Business
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 