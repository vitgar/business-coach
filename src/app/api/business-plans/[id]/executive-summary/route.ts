import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { BusinessPlanSection } from '@/types/business-plan'

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
      where: { id: params.id },
      include: { executiveSummary: true }
    })

    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }

    // Prepare the data with validation
    const updateData: Record<string, string> = {}
    const updateField = Object.keys(updates)[0] as BusinessPlanSection

    if (!requiredFields.includes(updateField)) {
      return NextResponse.json(
        { error: 'Invalid section' },
        { status: 400 }
      )
    }

    updateData[updateField] = updates[updateField]

    if (businessPlan.executiveSummary) {
      // Update existing summary
      const summary = await prisma.executiveSummary.update({
        where: {
          businessPlanId: params.id
        },
        data: updateData
      })
      return NextResponse.json(summary)
    } else {
      // Create new summary with required fields initialized as empty strings
      const initialData = requiredFields.reduce((acc, field) => ({
        ...acc,
        [field]: field === updateField ? updates[field] : ''
      }), {})

      const summary = await prisma.executiveSummary.create({
        data: {
          ...initialData,
          businessPlan: {
            connect: {
              id: params.id
            }
          }
        }
      })
      return NextResponse.json(summary)
    }
  } catch (error) {
    console.error('Error updating executive summary:', error)
    return NextResponse.json(
      { error: 'Failed to update executive summary' },
      { status: 500 }
    )
  }
} 