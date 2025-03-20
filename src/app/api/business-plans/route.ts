import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEV_CONFIG } from '@/config/development'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'

/**
 * GET /api/business-plans
 * 
 * Retrieves all business plans for the currently authenticated user
 * In development mode, returns plans for the development user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from session or use development user in dev mode
    const session = await getServerSession(authOptions)
    const userId = DEV_CONFIG.useDevAuth ? DEV_CONFIG.userId : session?.user?.id
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to view business plans' },
        { status: 401 }
      )
    }
    
    // Fetch business plans for the user
    const businessPlans = await prisma.businessPlan.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(businessPlans)
  } catch (error) {
    console.error('Error fetching business plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business plans' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/business-plans
 * 
 * Creates a new business plan with the provided title
 * In development mode, uses the development user ID
 */
export async function POST(request: NextRequest) {
  try {
    // Get user from session or use development user in dev mode
    const session = await getServerSession(authOptions)
    const userId = DEV_CONFIG.useDevAuth ? DEV_CONFIG.userId : session?.user?.id
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in to create a business plan' },
        { status: 401 }
      )
    }
    
    // Get request body
    const body = await request.json()
    const title = body.title || 'New Business Plan'
    
    // Create new business plan
    const newBusinessPlan = await prisma.businessPlan.create({
      data: {
        title,
        userId,
        status: 'draft',
        // Initialize with basic content structure
        content: {
          coverPage: {
            businessName: title,
            date: new Date().toISOString().split('T')[0]
          }
        }
      }
    })
    
    return NextResponse.json(newBusinessPlan, { status: 201 })
  } catch (error) {
    console.error('Error creating business plan:', error)
    return NextResponse.json(
      { error: 'Failed to create business plan' },
      { status: 500 }
    )
  }
} 