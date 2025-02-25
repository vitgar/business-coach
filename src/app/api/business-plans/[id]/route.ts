import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Business Plan API Endpoint
 * 
 * This endpoint handles CRUD operations for business plans.
 * After schema simplification, all business plan content is stored in the content JSON field
 * rather than in separate related models.
 */

/**
 * GET - Fetch a single business plan with all its details
 * 
 * @param {Request} request - The request object
 * @param {Object} params - URL parameters containing the business plan ID
 * @returns {Promise<NextResponse>} JSON response with business plan data or error
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id },
      include: {
        user: true
      }
    })

    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }

    // Extract executive summary from content if it exists
    const content = businessPlan.content as Record<string, any> || {}
    const executiveSummary = content.executiveSummary || null
    const visionData = content.vision || null
    const productsData = content.products || null
    const marketsData = content.markets || null
    const distributionData = content.distribution || null

    // Format the response to match the expected structure
    const formattedPlan = {
      ...businessPlan,
      executiveSummary,
      visionData,
      productsData,
      marketsData,
      distributionData
    }

    console.log('Sending business plan with vision data:', visionData);
    console.log('Sending business plan with markets data:', marketsData);
    console.log('Sending business plan with distribution data:', distributionData);
    return NextResponse.json(formattedPlan)
  } catch (error) {
    console.error('Error fetching business plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business plan' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update a business plan
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    
    const businessPlan = await prisma.businessPlan.update({
      where: { id: params.id },
      data: updates,
      include: {
        user: true
      }
    })

    // Extract executive summary from content if it exists
    const content = businessPlan.content as Record<string, any> || {}
    const executiveSummary = content.executiveSummary || null
    const visionData = content.vision || null
    const productsData = content.products || null
    const marketsData = content.markets || null
    const distributionData = content.distribution || null

    // Format the response to match the expected structure
    const formattedPlan = {
      ...businessPlan,
      executiveSummary,
      visionData,
      productsData,
      marketsData,
      distributionData
    }

    return NextResponse.json(formattedPlan)
  } catch (error) {
    console.error('Error updating business plan:', error)
    return NextResponse.json(
      { error: 'Failed to update business plan' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a business plan
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.businessPlan.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting business plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete business plan' },
      { status: 500 }
    )
  }
} 