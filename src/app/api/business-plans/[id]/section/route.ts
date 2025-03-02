import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { BusinessPlanContentSection } from '@/types/business-plan'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'

/**
 * GET /api/business-plans/[id]/section?section=sectionName
 * 
 * Retrieves a specific section of a business plan
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the section name from the query parameters
    const url = new URL(request.url)
    const sectionName = url.searchParams.get('section')
    
    if (!sectionName) {
      return NextResponse.json(
        { error: 'Section name is required' },
        { status: 400 }
      )
    }

    // Fetch the business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id }
    })

    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }

    // Get the content or initialize it
    const content = businessPlan.content as Record<string, any> || {}
    
    // Return the requested section or an empty object
    return NextResponse.json(content[sectionName] || {})
  } catch (error) {
    console.error(`Error fetching business plan section:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch business plan section' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/business-plans/[id]/section
 * 
 * Updates a specific section of a business plan
 * Request body should be: { section: "sectionName", data: { ... section data ... } }
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { section, data } = await request.json()
    
    if (!section || !data) {
      return NextResponse.json(
        { error: 'Section name and data are required' },
        { status: 400 }
      )
    }

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
    
    // Update the specific section
    content[section] = {
      ...(content[section] || {}),
      ...data
    }

    // Update the business plan with the new content
    const updatedBusinessPlan = await prisma.businessPlan.update({
      where: { id: params.id },
      data: { content }
    })

    // Return the updated section
    return NextResponse.json(content[section])
  } catch (error) {
    console.error('Error updating business plan section:', error)
    return NextResponse.json(
      { error: 'Failed to update business plan section' },
      { status: 500 }
    )
  }
} 