// FILE MARKED FOR REMOVAL
// This API route is being replaced as part of the business plan page redesign
// See replacementplan.md for details

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple temporary implementation while we redesign the business plan system
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Basic error checking
    if (!id) {
      return NextResponse.json(
        { error: 'Business plan ID is required' },
        { status: 400 }
      )
    }
    
    // Fetch business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id }
    })
    
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(businessPlan)
  } catch (error) {
    console.error('Error fetching business plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business plan' },
      { status: 500 }
    )
  }
}

// Basic PUT implementation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()
    
    const updatedPlan = await prisma.businessPlan.update({
      where: { id },
      data
    })
    
    return NextResponse.json(updatedPlan)
  } catch (error) {
    console.error('Error updating business plan:', error)
    return NextResponse.json(
      { error: 'Failed to update business plan' },
      { status: 500 }
    )
  }
}

// Basic DELETE implementation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    await prisma.businessPlan.delete({
      where: { id }
    })
    
    return NextResponse.json(
      { message: 'Business plan deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting business plan:', error)
    return NextResponse.json(
      { error: 'Failed to delete business plan' },
      { status: 500 }
    )
  }
} 