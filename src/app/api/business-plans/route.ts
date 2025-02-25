import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    // Generate a unique temporary user for each business plan
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const tempEmail = `temp_${timestamp}_${randomId}@example.com`
    
    // Create a new temporary user
    const user = await prisma.user.create({
      data: {
        email: tempEmail,
        name: `Business Plan ${timestamp}`,
        password: 'temp-password', // In production, this should be properly hashed
      }
    })

    // Create the business plan with a more descriptive title
    const businessPlan = await prisma.businessPlan.create({
      data: {
        title: `Business Plan ${new Date().toLocaleDateString()}`,
        status: 'draft',
        userId: user.id,
        description: null,
        content: {} // Initialize with empty object for JSON field
      }
    })

    return NextResponse.json(businessPlan)
  } catch (error) {
    console.error('Error creating business plan:', error)
    return NextResponse.json(
      { error: 'Failed to create business plan' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch all business plans with their temporary user info
export async function GET() {
  try {
    const businessPlans = await prisma.businessPlan.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Format the response to be more user-friendly
    const formattedPlans = businessPlans.map(plan => ({
      ...plan,
      createdAt: new Date(plan.updatedAt).toLocaleDateString(),
      tempUserIdentifier: plan.user.email.split('@')[0].replace('temp_', '')
    }))

    return NextResponse.json(formattedPlans)
  } catch (error) {
    console.error('Error fetching business plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business plans' },
      { status: 500 }
    )
  }
} 