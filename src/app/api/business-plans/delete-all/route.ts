/**
 * WARNING: TEMPORARY ENDPOINT
 * This endpoint is for development/testing purposes only.
 * It should be removed before deploying to production.
 * 
 * Purpose:
 * Deletes all business plans and their associated temporary users.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // First, get all temporary users
    const tempUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { startsWith: 'temp_' } },
          { email: 'temp@example.com' }
        ]
      }
    })

    // Delete all business plans associated with temporary users
    const deletedPlans = await prisma.businessPlan.deleteMany({
      where: {
        userId: {
          in: tempUsers.map(user => user.id)
        }
      }
    })

    // Delete all temporary users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { startsWith: 'temp_' } },
          { email: 'temp@example.com' }
        ]
      }
    })

    return NextResponse.json({
      success: true,
      message: 'All business plans and temporary users deleted',
      deletedPlans: deletedPlans.count,
      deletedUsers: deletedUsers.count
    })
  } catch (error) {
    console.error('Error deleting business plans:', error)
    return NextResponse.json(
      { error: 'Failed to delete business plans', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 