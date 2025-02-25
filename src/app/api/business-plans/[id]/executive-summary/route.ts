import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { BusinessPlanSection } from '@/types/business-plan'

/**
 * Executive Summary API Endpoint
 * 
 * This endpoint handles updates to the executive summary section of a business plan.
 * After schema simplification, executive summary data is stored in the content JSON field
 * of the BusinessPlan model rather than in a separate ExecutiveSummary model.
 */

const requiredFields: BusinessPlanSection[] = [
  'visionAndGoals',
  'productsOrServices',
  'targetMarket',
  'distributionStrategy'
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

    // Prepare the data with validation
    const updateField = Object.keys(updates)[0] as BusinessPlanSection

    if (!requiredFields.includes(updateField)) {
      return NextResponse.json(
        { error: 'Invalid section' },
        { status: 400 }
      )
    }

    // Get current content or initialize if it doesn't exist
    const currentContent = businessPlan.content as Record<string, any> || {}
    console.log('Current content before update:', currentContent);
    
    // Initialize executiveSummary object if it doesn't exist
    if (!currentContent.executiveSummary) {
      currentContent.executiveSummary = {}
    }
    
    // Update the specific field in the executiveSummary object
    currentContent.executiveSummary[updateField] = updates[updateField]
    console.log('Updated content:', currentContent);
    
    // Update the business plan with the new content
    const updatedPlan = await prisma.businessPlan.update({
      where: { id: params.id },
      data: {
        content: currentContent
      }
    })

    // Return the executive summary and vision data in the response
    return NextResponse.json({
      id: updatedPlan.id,
      ...currentContent.executiveSummary,
      visionData: currentContent.vision || null
    })
  } catch (error) {
    console.error('Error updating executive summary:', error)
    return NextResponse.json(
      { error: 'Failed to update executive summary' },
      { status: 500 }
    )
  }
} 