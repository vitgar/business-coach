import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { BusinessPlanSection, BusinessPlanContentSection } from '@/types/business-plan'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'

// Legacy fields for backward compatibility
const legacyFields: BusinessPlanSection[] = [
  'visionAndGoals',
  'productsOrServices',
  'targetMarket',
  'distributionStrategy'
]

// New executive summary fields
const executiveSummaryFields = [
  'businessConcept',
  'missionStatement',
  'productsOverview',
  'marketOpportunity',
  'financialHighlights',
  'managementTeam',
  'milestones'
]

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    
    // Validate the business plan exists
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id }
    })

    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }

    // Get the current content or initialize it
    const content = businessPlan.content as Record<string, any> || {}
    
    // Check if we're dealing with a legacy field or new structure
    const updateField = Object.keys(updates)[0]
    
    if (legacyFields.includes(updateField as BusinessPlanSection)) {
      // Handle legacy fields for backward compatibility
      // Initialize executiveSummary if it doesn't exist
      if (!content.executiveSummary) {
        content.executiveSummary = {}
      }
      
      // Update the specific legacy field
      content.executiveSummary[updateField] = updates[updateField]
    } else if (executiveSummaryFields.includes(updateField)) {
      // Handle new structure fields
      // Initialize executiveSummary if it doesn't exist
      if (!content.executiveSummary) {
        content.executiveSummary = {}
      }
      
      // Update the specific field in the new structure
      content.executiveSummary[updateField] = updates[updateField]
    } else if (updateField === 'executiveSummary' && typeof updates.executiveSummary === 'object') {
      // Handle updating the entire executive summary section
      content.executiveSummary = {
        ...content.executiveSummary,
        ...updates.executiveSummary
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid section or field' },
        { status: 400 }
      )
    }

    // Update the business plan with the new content
    const updatedBusinessPlan = await prisma.businessPlan.update({
      where: { id: params.id },
      data: { content }
    })

    // Return just the executive summary part
    return NextResponse.json(content.executiveSummary)
  } catch (error) {
    console.error('Error updating executive summary:', error)
    return NextResponse.json(
      { error: 'Failed to update executive summary' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve the executive summary
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id }
    })

    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }

    const content = businessPlan.content as Record<string, any> || {}
    
    // Return the executive summary if it exists, or an empty object
    return NextResponse.json(content.executiveSummary || {})
  } catch (error) {
    console.error('Error fetching executive summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch executive summary' },
      { status: 500 }
    )
  }
} 