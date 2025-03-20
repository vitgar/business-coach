/**
 * User Profile API Route
 * 
 * Handles user profile information updates
 * Requires authentication to access
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { authOptions } from '../../auth/[...nextauth]/route';

// Validation schema for profile updates
const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  image: z.string().url('Invalid image URL').optional(),
});

/**
 * GET handler - fetch current user profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user from the database (to ensure we have the most up-to-date data)
    // Use raw query to get all fields including emailVerified
    const users = await prisma.$queryRaw<any[]>`
      SELECT 
        "id", "name", "email", "image", "emailVerified", 
        "role", "createdAt", "updatedAt"
      FROM "User"
      WHERE "id" = ${session.user.id}
      LIMIT 1
    `;
    
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get the first (and only) user
    const user = users[0];
    
    return NextResponse.json(user);
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler - update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate input data
    const validation = schema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { name, email, image } = validation.data;
    
    // If email is being updated, check if it's already in use by another user
    if (email && email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email
        }
      });
      
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 409 }
        );
      }
    }
    
    // Prepare update data (only include fields that were provided)
    const updateData = {} as any;
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    
    // Handle email updates separately since they should reset email verification
    if (email && email !== session.user.email) {
      updateData.email = email;
      
      // Use raw query to reset emailVerified to null when email changes
      if (Object.keys(updateData).length > 0) {
        // Update fields except emailVerified
        await prisma.user.update({
          where: { id: session.user.id },
          data: updateData
        });
        
        // Reset emailVerified to null using raw query
        await prisma.$executeRaw`
          UPDATE "User"
          SET "emailVerified" = NULL
          WHERE "id" = ${session.user.id}
        `;
      }
    } else if (Object.keys(updateData).length > 0) {
      // Update other fields normally if not changing email
      await prisma.user.update({
        where: { id: session.user.id },
        data: updateData
      });
    }
    
    // Get updated user data
    const users = await prisma.$queryRaw<any[]>`
      SELECT 
        "id", "name", "email", "image", "emailVerified", 
        "role", "updatedAt"
      FROM "User"
      WHERE "id" = ${session.user.id}
      LIMIT 1
    `;
    
    const updatedUser = users[0];
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 