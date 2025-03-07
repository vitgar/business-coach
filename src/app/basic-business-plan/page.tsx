'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BasicBusinessPlanContent from '@/components/basic-business-plan/BasicBusinessPlanContent'
import { useAuth } from '@/contexts/AuthContext'

/**
 * BasicBusinessPlan Page
 * 
 * A simplified business plan interface with:
 * - Chat component on the left for guidance
 * - Editable markdown text component on the right
 * - Loads the business plan for the current business 
 */
export default function BasicBusinessPlanPage() {
  const router = useRouter()
  const { currentBusinessId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Set loading to false after component mounts
  useEffect(() => {
    setLoading(false)
  }, [])
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 ml-6">Basic Business Plan</h1>
        </div>
      </div>
      
      {/* Main Content - flex-1 ensures it takes remaining height */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <BasicBusinessPlanContent />
        )}
      </div>
    </div>
  )
} 