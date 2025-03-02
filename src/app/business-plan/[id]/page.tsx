'use client'

import BusinessPlanPage from '@/components/business-plan-new/BusinessPlanPage'

/**
 * Business Plan Page
 * 
 * This is the main container for displaying and editing a business plan.
 * It passes the business plan ID to the BusinessPlanPage component which handles data fetching and UI.
 */
export default function BusinessPlanPageContainer({ params }: { params: { id: string } }) {
  return <BusinessPlanPage businessPlanId={params.id} />
} 