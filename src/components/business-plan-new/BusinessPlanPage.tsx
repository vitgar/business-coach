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
      <div className="max-w-6xl mx-auto px-4 py-6 w-full flex flex-col flex-grow">
        {/* Back button */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading business plan...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
              <p className="text-gray-700 mb-6">{error}</p>
              <p className="text-gray-600 mb-6">
                Please try again or return to the dashboard to select a different business plan.
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : businessPlan ? (
          <div className="flex flex-col h-full flex-grow">
            {/* Business Plan Header */}
            <BusinessPlanHeader 
              businessPlan={businessPlan}
              onSave={(title) => handleSaveChanges('coverPage', { ...businessPlan.content?.coverPage, businessName: title })}
              savingStatus={savingStatus}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow h-full overflow-hidden">
              {/* Business Plan Sections Navigation - Fixed Left Sidebar */}
              <div className="lg:col-span-2 lg:sticky lg:top-0 lg:self-start h-auto overflow-auto max-h-[calc(100vh-200px)]">
                <BusinessPlanSections 
                  currentSection={currentSection}
                  onSectionChange={handleSectionChange}
                  businessPlan={businessPlan}
                />
              </div>
              
              {/* Content Area Grid */}
              <div className="lg:col-span-10 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* Business Plan Editor - Scrollable Content Area */}
                <div className="lg:col-span-8 h-[calc(100vh-220px)] overflow-y-auto">
                  <div className="bg-white rounded-lg shadow-md h-full">
                    <BusinessPlanEditor 
                      businessPlan={businessPlan}
                      currentSection={currentSection}
                      onSave={(sectionData) => handleSaveChanges(currentSection, sectionData)}
                    />
                    
                    {/* Business Plan Controls */}
                    <BusinessPlanControls 
                      businessPlan={businessPlan}
                      savingStatus={savingStatus}
                      onSave={() => handleSaveChanges(currentSection, businessPlan.content?.[currentSection])}
                    />
                  </div>
                </div>

                {/* AI Assistant - Fixed Right Sidebar */}
                <div className="lg:col-span-4 h-[calc(100vh-220px)] overflow-hidden">
                  <BusinessPlanAIAssistant
                    businessPlanId={businessPlan.id}
                    sectionId={currentSection}
                    sectionName={getSectionTitle(currentSection)}
                    className="h-full"
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
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">No Business Plan Found</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find a business plan with the ID: {businessPlanId}
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}
        
        {/* Debug information - only shown in development */}
        {businessPlan && process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 border border-gray-300 rounded bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Information</h3>
            <p className="text-xs text-gray-600 mb-2">Business Plan ID: {businessPlanId}</p>
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-600">Business Plan Data</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-64">
                {JSON.stringify(businessPlan, null, 2)}
              </pre>
            </details>
          </div>
        )}
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