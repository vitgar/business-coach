'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import BusinessPlanHeader from './BusinessPlanHeader'
import BusinessPlanSections from './BusinessPlanSections'
import BusinessPlanEditor from './BusinessPlanEditor'
import BusinessPlanControls from './BusinessPlanControls'
import BusinessPlanAIAssistant from '../business-plan-ai/BusinessPlanAIAssistant'

/**
 * BusinessPlanPage Component
 * 
 * Main container for the business plan that:
 * - Fetches business plan data by ID
 * - Handles loading and error states
 * - Coordinates between different business plan components
 * - Manages data flow and state
 * - Uses a fixed sidebar layout with scrollable main content
 */
export default function BusinessPlanPage({ businessPlanId }: { businessPlanId: string }) {
  const router = useRouter()
  const [businessPlan, setBusinessPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSection, setCurrentSection] = useState<string>('executiveSummary')
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Fetch business plan data
  useEffect(() => {
    const fetchBusinessPlan = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/business-plans/${businessPlanId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Business plan not found')
          } else {
            throw new Error('Failed to load business plan')
          }
        }
        
        const data = await response.json()
        setBusinessPlan(data)
        setError(null)
      } catch (err: any) {
        console.error('Error loading business plan:', err)
        setError(err.message || 'Failed to load business plan')
        setBusinessPlan(null)
      } finally {
        setLoading(false)
      }
    }

    fetchBusinessPlan()
  }, [businessPlanId])

  // Save updates to the business plan
  const handleSaveChanges = async (sectionName: string, sectionData: any) => {
    if (!businessPlan) return
    
    try {
      setSavingStatus('saving')
      
      // Create a new content object with the updated section
      const updatedContent = {
        ...(businessPlan.content || {}),
        [sectionName]: sectionData
      }
      
      // Save to the API
      const response = await fetch(`/api/business-plans/${businessPlanId}/section`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: sectionName,
          data: sectionData
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save changes')
      }
      
      // Update local state
      setBusinessPlan({
        ...businessPlan,
        content: updatedContent
      })
      
      setSavingStatus('saved')
      
      // Reset to idle after a delay
      setTimeout(() => setSavingStatus('idle'), 2000)
    } catch (err) {
      console.error('Error saving changes:', err)
      setSavingStatus('error')
      
      // Reset to idle after a delay
      setTimeout(() => setSavingStatus('idle'), 3000)
    }
  }

  // Handle section change
  const handleSectionChange = (sectionName: string) => {
    setCurrentSection(sectionName)
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Compact header with combined elements */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 py-2 w-full flex justify-between items-center">
          <div className="flex items-center">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mr-4 text-sm"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back
            </Link>
            
            {businessPlan && (
              <h1 className="font-medium truncate max-w-md">
                {businessPlan.title || 'Untitled Business Plan'}
              </h1>
            )}
          </div>
          
          {/* Status indicator moved to header */}
          {savingStatus === 'saving' && (
            <span className="text-xs text-yellow-600 flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-1"></div>
              Saving...
            </span>
          )}
          {savingStatus === 'saved' && (
            <span className="text-xs text-green-600 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              Saved
            </span>
          )}
          {savingStatus === 'error' && (
            <span className="text-xs text-red-600 flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              Error saving
            </span>
          )}
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-3 w-full flex flex-col flex-grow">
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-4 mt-3">
            <div className="flex items-center justify-center py-6">
              <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mr-3"></div>
              <p className="text-gray-600">Loading business plan...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-md p-4 mt-3">
            <div className="text-center py-6">
              <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
              <p className="text-gray-700 mb-3">{error}</p>
              <Link
                href="/dashboard"
                className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : businessPlan ? (
          <div className="flex flex-col h-full flex-grow pt-2">
            {/* Business Plan Sections Navigation - Compact horizontal bar */}
            <div className="bg-white rounded-lg shadow-sm p-2 mb-3">
              <BusinessPlanSections 
                currentSection={currentSection}
                onSectionChange={handleSectionChange}
                businessPlan={businessPlan}
              />
            </div>
            
            {/* Content Area Grid - Optimized ratio for 14" screens */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow h-full overflow-hidden">
              {/* Business Plan Editor - Expand height */}
              <div className="lg:col-span-7 h-[calc(100vh-130px)]">
                <div className="bg-white rounded-lg shadow-sm h-full">
                  <BusinessPlanEditor 
                    businessPlan={businessPlan}
                    currentSection={currentSection}
                    onSave={(sectionData) => handleSaveChanges(currentSection, sectionData)}
                  />
                </div>
              </div>

              {/* AI Assistant */}
              <div className="lg:col-span-5 h-[calc(100vh-130px)] overflow-hidden">
                <BusinessPlanAIAssistant
                  businessPlanId={businessPlan.id}
                  sectionId={currentSection}
                  sectionName={getSectionTitle(currentSection)}
                  className="h-full"
                  businessPlan={businessPlan}
                  onSectionChange={handleSectionChange}
                  onApplySuggestion={(fieldId: string, content: string) => {
                    // Find the current section's data
                    const currentSectionData = businessPlan.content?.[currentSection] || {};
                    
                    // Create updated section data with the suggestion
                    const updatedSectionData = {
                      ...currentSectionData,
                      [fieldId]: content
                    };
                    
                    // Save the changes
                    handleSaveChanges(currentSection, updatedSectionData);
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// Helper function to get section title for display
function getSectionTitle(sectionId: string): string {
  switch (sectionId) {
    case 'executiveSummary': return 'Executive Summary'
    case 'companyDescription': return 'Company Description'
    case 'productsAndServices': return 'Products & Services'
    case 'marketAnalysis': return 'Market Analysis'
    case 'marketingStrategy': return 'Marketing Strategy'
    case 'operationsPlan': return 'Operations Plan'
    case 'organizationAndManagement': return 'Organization & Management'
    case 'financialPlan': return 'Financial Plan'
    default: return sectionId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  }
} 