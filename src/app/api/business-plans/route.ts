import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    // First create the user if it doesn't exist
    let user = await prisma.user.findFirst({
      where: {
        email: 'temp@example.com'
      }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'temp@example.com',
          name: 'Temporary User',
          password: 'temp-password', // In production, this should be properly hashed
        }
      })
    }

    // Create the business plan
    const businessPlan = await prisma.businessPlan.create({
      data: {
        title: 'New Business Plan',
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