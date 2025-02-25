import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * TEMPORARY USER SYSTEM - MIGRATION ENDPOINT
 * 
 * WARNING: This is a temporary solution that should be removed when implementing proper authentication.
 * 
 * Purpose:
 * This endpoint migrates business plans from the old single temporary user system
 * to the new system where each plan has its own temporary user.
 * 
 * Current Implementation:
 * - Old system: All plans shared one user (temp@example.com)
 * - New system: Each plan has a unique user (temp_[timestamp]_[randomId]@example.com)
 * 
 * Migration Process:
 * 1. Finds all plans under the old temp@example.com user
 * 2. For each plan:
 *    - Creates a new temporary user with unique timestamp and ID
 *    - Updates the plan to use the new user
 *    - Marks the plan as migrated in its title
 * 3. Deletes the old temporary user if all migrations succeed
 * 
 * TODO: Remove This System
 * This entire endpoint should be removed when implementing proper authentication:
 * 1. Create proper user authentication system
 * 2. Add user registration and login
 * 3. Migrate all temporary users to real user accounts
 * 4. Remove this migration endpoint
 * 5. Remove temporary user creation in /api/business-plans/route.ts
 * 
 * @see /api/business-plans/route.ts - Temporary user creation
 * @see /app/business-plan/[id]/page.tsx - Frontend implementation
 */

export async function POST() {
  try {
    // Find the old temporary user
    const oldTempUser = await prisma.user.findFirst({
      where: {
        email: 'temp@example.com'
      },
      include: {
        businessPlans: true
      }
    })

    if (!oldTempUser) {
      return NextResponse.json({ message: 'No old plans to migrate' })
    }

    // Migrate each plan
    const results = await Promise.all(oldTempUser.businessPlans.map(async (plan) => {
      try {
        // Create new temporary user for this plan
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 15)
        const tempEmail = `temp_${timestamp}_${randomId}@example.com`
        
        const newUser = await prisma.user.create({
          data: {
            email: tempEmail,
            name: `Business Plan ${timestamp}`,
            password: 'temp-password', // WARNING: This is temporary and insecure
          }
        })

        // Update the plan to use the new user
        await prisma.businessPlan.update({
          where: { id: plan.id },
          data: {
            userId: newUser.id,
            title: `${plan.title} (Migrated ${new Date().toLocaleDateString()})`
          }
        })

        return {
          planId: plan.id,
          status: 'success',
          newUserId: newUser.id,
          oldEmail: oldTempUser.email,
          newEmail: tempEmail
        }
      } catch (error) {
        return {
          planId: plan.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }))

    // Delete the old temporary user if all plans were migrated successfully
    if (results.every(r => r.status === 'success')) {
      await prisma.user.delete({
        where: { id: oldTempUser.id }
      })
    }

    return NextResponse.json({
      message: 'Migration completed',
      results,
      warning: 'This is a temporary solution. Implement proper user authentication.'
    })
  } catch (error) {
    console.error('Error in migration:', error)
    return NextResponse.json(
      { error: 'Failed to migrate plans', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 