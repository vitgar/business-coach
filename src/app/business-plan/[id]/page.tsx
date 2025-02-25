'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import ExecutiveSummarySection from '@/components/business-plan/ExecutiveSummary'
import BusinessDescription from '@/components/business-plan/BusinessDescription'
import MarketingPlan from '@/components/business-plan/MarketingPlan'
import Operations from '@/components/business-plan/Operations'
import FinancialPlan from '@/components/business-plan/FinancialPlan'
import BusinessPlanSidebar, { BusinessPlanSectionType } from '@/components/business-plan/BusinessPlanSidebar'
import SectionNavigation from '@/components/business-plan/SectionNavigation'
import type { BusinessPlanSection, ExecutiveSummaryData } from '@/types/business-plan'
import Link from 'next/link'
import Logo from '@/components/Logo'

/**
 * TEMPORARY USER SYSTEM DOCUMENTATION
 * 
 * Current Implementation (Temporary Solution):
 * - Each business plan gets its own temporary user with format: temp_[timestamp]_[randomId]@example.com
 * - This is a stopgap measure until proper user authentication is implemented
 * - Plans created before this system used a single 'temp@example.com' user
 * 
 * Migration Process:
 * - The "Fix Old Plans" button appears when plans are found using the old temp@example.com user
 * - Migration creates new unique temporary users for each old plan
 * - Old plans are marked with "(Migrated [date])" in their titles
 * 
 * TODO: Replace Temporary System
 * This temporary user system should be replaced with proper authentication:
 * 1. Implement user registration and login
 * 2. Migrate all temporary users to real user accounts
 * 3. Remove the temporary user creation in /api/business-plans/route.ts
 * 4. Remove the migration endpoint in /api/business-plans/migrate/route.ts
 * 5. Update this component to work with authenticated users
 * 
 * @see /api/business-plans/route.ts - Temporary user creation
 * @see /api/business-plans/migrate/route.ts - Migration process
 */

interface BusinessPlan {
  id: string
  title: string
  status: 'draft' | 'completed'
  updatedAt: string
  createdAt: string
  tempUserIdentifier: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface BusinessPlanDetails extends BusinessPlan {
  executiveSummary: ExecutiveSummaryData | null
  content: Record<string, unknown>
}

interface VisionData {
  longTermVision?: string;
  yearOneGoals?: string[];
  yearThreeGoals?: string[];
  yearFiveGoals?: string[];
  alignmentExplanation?: string;
}

interface ContentExecutiveSummary {
  visionAndGoals?: string;
  productsOrServices?: string;
  targetMarket?: string;
  distributionStrategy?: string;
}

interface BusinessPlanContent {
  executiveSummary?: ContentExecutiveSummary;
  vision?: VisionData;
  products?: {
    productDescription?: string;
    uniqueSellingPoints?: string[];
    competitiveAdvantages?: string[];
    pricingStrategy?: string;
    futureProductPlans?: string;
  };
  markets?: {
    targetMarket?: string;
    marketSize?: string;
    customerSegments?: string[];
    customerNeeds?: string[];
    marketTrends?: string[];
    competitiveLandscape?: string;
  };
  distribution?: {
    distributionChannels?: string[];
    primaryChannel?: string;
    channelStrategy?: string;
    logisticsApproach?: string;
    partnershipStrategy?: string;
    costStructure?: string;
    innovativeApproaches?: string[];
  };
  [key: string]: any;
}

interface Props {
  params: {
    id: string
  }
}

export default function BusinessPlanPage({ params }: Props) {
  const router = useRouter()
  const [businessPlans, setBusinessPlans] = useState<BusinessPlan[]>([])
  const [businessPlan, setBusinessPlan] = useState<BusinessPlanDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingPlan, setIsLoadingPlan] = useState(true)
  const [isEditing, setIsEditing] = useState(true)
  const [isMigrating, setIsMigrating] = useState(false)
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const [activeSection, setActiveSection] = useState<BusinessPlanSectionType>('executive-summary')

  // Create a new business plan if needed
  const createNewBusinessPlan = async () => {
    try {
      const response = await fetch('/api/business-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to create business plan')
      }

      const data = await response.json()
      router.push(`/business-plan/${data.id}`)
      return data
    } catch (error) {
      console.error('Error creating business plan:', error)
      toast.error('Failed to create business plan')
      return null
    }
  }

  // Fetch business plans list
  const fetchBusinessPlans = async () => {
    try {
      const response = await fetch('/api/business-plans')
      if (!response.ok) throw new Error('Failed to fetch business plans')
      const data = await response.json()
      setBusinessPlans(data)

      // If there are no plans or no ID provided, create a new one
      if (data.length === 0 || !params.id) {
        const newPlan = await createNewBusinessPlan()
        if (newPlan) {
          setBusinessPlans([newPlan])
        }
        return
      }

      // If we have an ID but it's not in the list, create a new plan
      if (params.id && !data.some((plan: BusinessPlan) => plan.id === params.id)) {
        const newPlan = await createNewBusinessPlan()
        if (newPlan) {
          setBusinessPlans([...data, newPlan])
        }
        return
      }
    } catch (error) {
      console.error('Error fetching business plans:', error)
      toast.error('Failed to load business plans')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch business plans list on component mount
  useEffect(() => {
    fetchBusinessPlans()
  }, [params.id])

  // Fetch current business plan details when ID changes
  useEffect(() => {
    const fetchBusinessPlan = async () => {
      try {
        setIsLoadingPlan(true)
        const response = await fetch(`/api/business-plans/${params.id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch business plan')
        }
        
        const data = await response.json()
        console.log('Fetched business plan:', data)
        
        setBusinessPlan(data)
      } catch (error) {
        console.error('Error fetching business plan:', error)
        toast.error('Failed to fetch business plan')
      } finally {
        setIsLoadingPlan(false)
      }
    }

    if (params.id) {
      fetchBusinessPlan()
    }
  }, [params.id])

  const handleSaveSection = async (sectionId: BusinessPlanSection, content: string) => {
    try {
      console.log(`Saving section ${sectionId} to API:`, content);
      const response = await fetch(`/api/business-plans/${params.id}/executive-summary`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [sectionId]: content
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save section')
      }

      toast.success('Section saved successfully')
      
      // Refresh the current plan data
      const updatedPlanResponse = await fetch(`/api/business-plans/${params.id}`)
      if (updatedPlanResponse.ok) {
        const updatedPlanData = await updatedPlanResponse.json()
        console.log('Refreshed plan data after save:', updatedPlanData);
        
        // Extract executive summary from content if it exists
        const updatedContent = updatedPlanData.content as Record<string, unknown> || {}
        const updatedExecutiveSummary = (updatedContent.executiveSummary as ContentExecutiveSummary) || null
        console.log('Updated executive summary:', updatedExecutiveSummary);
        
        // Extract vision data from content if it exists
        const updatedVisionData = (updatedPlanData.visionData as VisionData) || (updatedContent.vision as VisionData) || {} as VisionData
        console.log('Updated vision data:', updatedVisionData);
        
        // Format the vision data into text
        let updatedVisionText = ''
        
        if (updatedVisionData.longTermVision) {
          updatedVisionText += `# Long-Term Vision\n${updatedVisionData.longTermVision}\n\n`
        }
        
        if (updatedVisionData.yearOneGoals && updatedVisionData.yearOneGoals.length > 0) {
          updatedVisionText += `# First Year Goals\n${updatedVisionData.yearOneGoals.map((g: string) => `- ${g}`).join('\n')}\n\n`
        }
        
        if (updatedVisionData.yearThreeGoals && updatedVisionData.yearThreeGoals.length > 0) {
          updatedVisionText += `# Three-Year Goals\n${updatedVisionData.yearThreeGoals.map((g: string) => `- ${g}`).join('\n')}\n\n`
        }
        
        if (updatedVisionData.yearFiveGoals && updatedVisionData.yearFiveGoals.length > 0) {
          updatedVisionText += `# Five-Year Goals\n${updatedVisionData.yearFiveGoals.map((g: string) => `- ${g}`).join('\n')}\n\n`
        }
        
        if (updatedVisionData.alignmentExplanation) {
          updatedVisionText += `# Goal Alignment\n${updatedVisionData.alignmentExplanation}`
        }
        
        console.log('Updated vision text:', updatedVisionText);
        
        // Extract products data from content if it exists
        const updatedProductsData = (updatedPlanData.productsData as BusinessPlanContent['products']) || 
                                   (updatedContent.products as BusinessPlanContent['products']) || 
                                   {} as BusinessPlanContent['products'];
        console.log('Updated products data:', updatedProductsData);
        
        // Format the products data into text
        let updatedProductsText = ''
        
        if (updatedProductsData?.productDescription) {
          updatedProductsText += `# Products/Services Description\n${updatedProductsData.productDescription}\n\n`
        }
        
        if (updatedProductsData?.uniqueSellingPoints && updatedProductsData.uniqueSellingPoints.length > 0) {
          updatedProductsText += `# Unique Selling Points\n${updatedProductsData.uniqueSellingPoints.map((p: string) => `- ${p}`).join('\n')}\n\n`
        }
        
        if (updatedProductsData?.competitiveAdvantages && updatedProductsData.competitiveAdvantages.length > 0) {
          updatedProductsText += `# Competitive Advantages\n${updatedProductsData.competitiveAdvantages.map((a: string) => `- ${a}`).join('\n')}\n\n`
        }
        
        if (updatedProductsData?.pricingStrategy) {
          updatedProductsText += `# Pricing Strategy\n${updatedProductsData.pricingStrategy}\n\n`
        }
        
        if (updatedProductsData?.futureProductPlans) {
          updatedProductsText += `# Future Product Plans\n${updatedProductsData.futureProductPlans}`
        }
        
        console.log('Updated products text:', updatedProductsText);
        
        // Extract markets data from content if it exists
        const updatedMarketsData = (updatedPlanData.marketsData as BusinessPlanContent['markets']) || 
                                  (updatedContent.markets as BusinessPlanContent['markets']) || 
                                  {} as BusinessPlanContent['markets'];
        console.log('Updated markets data:', updatedMarketsData);
        
        // Format the markets data into text
        let updatedMarketsText = ''
        
        if (updatedMarketsData?.targetMarket) {
          updatedMarketsText += `# Target Market\n${updatedMarketsData.targetMarket}\n\n`
        }
        
        if (updatedMarketsData?.marketSize) {
          updatedMarketsText += `# Market Size\n${updatedMarketsData.marketSize}\n\n`
        }
        
        if (updatedMarketsData?.customerSegments && updatedMarketsData.customerSegments.length > 0) {
          updatedMarketsText += `# Customer Segments\n${updatedMarketsData.customerSegments.map((s: string) => `- ${s}`).join('\n')}\n\n`
        }
        
        if (updatedMarketsData?.customerNeeds && updatedMarketsData.customerNeeds.length > 0) {
          updatedMarketsText += `# Customer Needs\n${updatedMarketsData.customerNeeds.map((n: string) => `- ${n}`).join('\n')}\n\n`
        }
        
        if (updatedMarketsData?.marketTrends && updatedMarketsData.marketTrends.length > 0) {
          updatedMarketsText += `# Market Trends\n${updatedMarketsData.marketTrends.map((t: string) => `- ${t}`).join('\n')}\n\n`
        }
        
        if (updatedMarketsData?.competitiveLandscape) {
          updatedMarketsText += `# Competitive Landscape\n${updatedMarketsData.competitiveLandscape}`
        }
        
        console.log('Updated markets text:', updatedMarketsText);
        
        // Extract distribution data from content if it exists
        const updatedDistributionData = (updatedPlanData.distributionData as BusinessPlanContent['distribution']) || 
                                       (updatedContent.distribution as BusinessPlanContent['distribution']) || 
                                       {} as BusinessPlanContent['distribution'];
        console.log('Updated distribution data:', updatedDistributionData);
        
        // Format the distribution data into text
        let updatedDistributionText = ''
        
        if (updatedDistributionData?.distributionChannels && updatedDistributionData.distributionChannels.length > 0) {
          updatedDistributionText += `# Distribution Channels\n${updatedDistributionData.distributionChannels.map((c: string) => `- ${c}`).join('\n')}\n\n`
        }
        
        if (updatedDistributionData?.primaryChannel) {
          updatedDistributionText += `# Primary Distribution Method\n${updatedDistributionData.primaryChannel}\n\n`
        }
        
        if (updatedDistributionData?.channelStrategy) {
          updatedDistributionText += `# Channel Management Strategy\n${updatedDistributionData.channelStrategy}\n\n`
        }
        
        if (updatedDistributionData?.logisticsApproach) {
          updatedDistributionText += `# Logistics and Fulfillment\n${updatedDistributionData.logisticsApproach}\n\n`
        }
        
        if (updatedDistributionData?.partnershipStrategy) {
          updatedDistributionText += `# Partnerships and Intermediaries\n${updatedDistributionData.partnershipStrategy}\n\n`
        }
        
        if (updatedDistributionData?.costStructure) {
          updatedDistributionText += `# Distribution Costs\n${updatedDistributionData.costStructure}\n\n`
        }
        
        if (updatedDistributionData?.innovativeApproaches && updatedDistributionData.innovativeApproaches.length > 0) {
          updatedDistributionText += `# Innovative Distribution Methods\n${updatedDistributionData.innovativeApproaches.map((a: string) => `- ${a}`).join('\n')}\n\n`
        }
        
        console.log('Updated distribution text:', updatedDistributionText);
        
        // Format the plan data to match the expected structure
        const formattedPlan: BusinessPlanDetails = {
          ...updatedPlanData,
          executiveSummary: updatedExecutiveSummary ? {
            id: updatedPlanData.id,
            visionAndGoals: updatedVisionText || updatedExecutiveSummary.visionAndGoals || '',
            productsOrServices: updatedProductsText || updatedExecutiveSummary.productsOrServices || '',
            targetMarket: updatedMarketsText || updatedExecutiveSummary.targetMarket || '',
            distributionStrategy: updatedDistributionText || updatedExecutiveSummary.distributionStrategy || '',
            businessPlanId: updatedPlanData.id
          } : null
        }
        
        setBusinessPlan(formattedPlan)
      }
    } catch (error) {
      console.error('Error saving section:', error)
      toast.error('Failed to save section')
    }
  }

  const handleSaveTitle = async (title: string) => {
    try {
      setIsSavingTitle(true)
      
      const response = await fetch(`/api/business-plans/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update title')
      }
      
      const updatedPlan = await response.json()
      setBusinessPlan(updatedPlan)
      
      toast.success('Title updated successfully')
      
      // Refresh the business plans list
      fetchBusinessPlans()
    } catch (error) {
      console.error('Error updating title:', error)
      toast.error('Failed to update title')
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handlePlanChange = (planId: string) => {
    router.push(`/business-plan/${planId}`)
  }

  const handleMigrate = async () => {
    try {
      setIsMigrating(true)
      const response = await fetch('/api/business-plans/migrate', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Migration failed')
      }

      const data = await response.json()
      toast.success('Migration completed successfully')
      
      // Refresh the business plans list
      const plansResponse = await fetch('/api/business-plans')
      if (plansResponse.ok) {
        const plansData = await plansResponse.json()
        setBusinessPlans(plansData)
      }
    } catch (error) {
      console.error('Error in migration:', error)
      toast.error('Failed to migrate plans')
    } finally {
      setIsMigrating(false)
    }
  }

  // Check if any plans need migration (using old temp@example.com user)
  const hasOldPlans = businessPlans.some((plan: BusinessPlan) => 
    plan.user.email === 'temp@example.com' || 
    !plan.user.email.startsWith('temp_')
  )

  // Handle section change
  const handleSectionChange = (section: BusinessPlanSectionType) => {
    setActiveSection(section);
  };

  // Render the active section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'executive-summary':
        return (
          <ExecutiveSummarySection
            data={businessPlan?.executiveSummary || undefined}
            onSave={handleSaveSection}
            isEditing={isEditing}
            businessPlanId={params.id}
            planTitle={businessPlan?.title}
            onTitleSave={handleSaveTitle}
          />
        );
      case 'business-description':
        return (
          <BusinessDescription
            businessPlanId={params.id}
            isEditing={isEditing}
          />
        );
      case 'marketing-plan':
        return (
          <MarketingPlan
            businessPlanId={params.id}
            isEditing={isEditing}
          />
        );
      case 'operations':
        return (
          <Operations
            businessPlanId={params.id}
            isEditing={isEditing}
          />
        );
      case 'financial-plan':
        return (
          <FinancialPlan
            businessPlanId={params.id}
            isEditing={isEditing}
          />
        );
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p>Select a section from the sidebar to begin.</p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-600 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Logo />
            <div>
              <h1 className="text-2xl font-bold mb-1">Business Plan Builder</h1>
              <p className="text-blue-100 text-sm">
                Create a comprehensive business plan step by step
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">Business Plan</h1>
              {businessPlans.length > 0 && (
                <select
                  value={params.id}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none min-w-[300px]"
                  disabled={isLoading || isMigrating}
                >
                  {isLoading ? (
                    <option>Loading plans...</option>
                  ) : (
                    businessPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.title} - Created: {plan.createdAt} (User: {plan.user.email})
                      </option>
                    ))
                  )}
                </select>
              )}
              <button
                onClick={createNewBusinessPlan}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                New Plan
              </button>
              <Link
                href="/cleanup"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              >
                Cleanup
              </Link>
            </div>
            <div className="flex gap-2">
              {hasOldPlans && (
                <button
                  onClick={handleMigrate}
                  disabled={isMigrating}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isMigrating ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Migrating...</span>
                    </>
                  ) : (
                    'Fix Old Plans'
                  )}
                </button>
              )}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {isEditing ? 'Preview' : 'Edit'}
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {isLoadingPlan ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading business plan...</p>
              </div>
            ) : (
              <div className="flex gap-8">
                {/* Sidebar */}
                <BusinessPlanSidebar 
                  activeSection={activeSection} 
                  onSectionChange={handleSectionChange} 
                />
                
                {/* Main content area */}
                <div className="flex-1">
                  {/* Active section content */}
                  {renderSectionContent()}
                  
                  {/* Section navigation */}
                  <SectionNavigation 
                    activeSection={activeSection} 
                    onSectionChange={handleSectionChange} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 