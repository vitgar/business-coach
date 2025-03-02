'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useCurrentBusiness } from '@/contexts/AuthContext'
import { BusinessSummary } from '@/types/auth'
import { PlusCircle, ChevronDown, Briefcase, RefreshCw } from 'lucide-react'
import { toast } from 'react-toastify'

/**
 * Business Selector Component
 * 
 * Displays a list of businesses belonging to the current user
 * and allows switching between them.
 */
export default function BusinessSelector() {
  const router = useRouter()
  const { userId, currentBusinessId, setCurrentBusinessId } = useAuth()
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [error, setError] = useState('')

  // Fetch user's businesses
  useEffect(() => {
    if (!userId) return

    async function fetchBusinesses() {
      try {
        setIsLoading(true)
        setError('')
        const response = await fetch(`/api/users/${userId}/businesses`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch businesses')
        }
        
        const data = await response.json()
        setBusinesses(data)
      } catch (error) {
        console.error('Error fetching businesses:', error)
        setError('Could not load your businesses. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [userId])

  // Handle business selection
  const handleSelectBusiness = (businessId: string) => {
    setCurrentBusinessId(businessId)
    setIsDropdownOpen(false)
    
    // Navigate to business plan page if needed
    // router.push(`/business-plan/${businessId}`)
  }

  // Create new business
  const handleCreateBusiness = async () => {
    try {
      setIsLoading(true)

      // Create a new business plan
      const response = await fetch('/api/business-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: "New Business Plan"
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create business plan')
      }

      const data = await response.json()
      setCurrentBusinessId(data.id)
      router.push(`/business-plan/${data.id}`)
      
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
      {/* Business selector button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 w-full text-left"
      >
        <Briefcase className="h-5 w-5 text-gray-500" />
        <span className="flex-1 truncate">
          {isLoading ? (
            <span className="inline-flex items-center">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </span>
          ) : currentBusiness ? (
            currentBusiness.title
          ) : (
            'Select a business'
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

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
                    No businesses found
                  </div>
                ) : (
                  businesses.map(business => (
                    <button
                      key={business.id}
                      onClick={() => handleSelectBusiness(business.id)}
                      className={`px-4 py-2 rounded-md w-full text-left text-sm flex items-center ${
                        currentBusinessId === business.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex-1 truncate">{business.title}</span>
                      {business.status === 'completed' && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
                          Completed
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
              
              <div className="border-t border-gray-200 p-1">
                <button
                  onClick={handleCreateBusiness}
                  className="px-4 py-2 rounded-md w-full text-left text-sm flex items-center text-blue-600 hover:bg-blue-50 business-selector-create"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Business Plan
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 