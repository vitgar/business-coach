import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEV_CONFIG } from '@/config/development'
import { BusinessSummary } from '@/types/auth'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'

/**
 * GET /api/users/[id]/businesses
 * 
 * Fetch all businesses belonging to a specific user
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Always fetch real business plans from the database, even in development mode
    // This allows creating new business plans while still using the development user
    const businesses = await prisma.businessPlan.findMany({
      where: { 
        userId: params.id 
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        content: true // Include content to extract business name
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Transform the results to include business name if available
    const businessSummaries = businesses.map(business => {
      let content: any = {};
      try {
        // Content is stored as JSON string or JSON object depending on the ORM
        content = typeof business.content === 'string' 
          ? JSON.parse(business.content) 
          : business.content;
      } catch (e) {
        console.error('Error parsing business content:', e);
      }
      
      // Extract business name from content if available
      const businessName = content?.coverPage?.businessName || null;
      
      return {
        id: business.id,
        title: business.title,
        businessName: businessName,
        status: business.status,
        updatedAt: business.updatedAt
      };
    });
    
    // If no business plans exist yet, return an empty array
    // This allows the user to create their first business plan
    return NextResponse.json(businessSummaries)
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    )
  }
} 