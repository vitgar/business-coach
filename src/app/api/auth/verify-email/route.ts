/**
 * Email Verification API Route
 * 
 * Validates email verification tokens and marks user emails as verified
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schema for token
const schema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * POST handler - process email verification
 */
export async function POST(request: NextRequest) {
  try {
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
    
    const { token } = validation.data;
    
    // Hash the provided token to match the stored hashed version
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find the token in the database using raw query
    const tokens = await prisma.$queryRaw<{id: string, identifier: string, token: string, expires: Date}[]>`
      SELECT * FROM "VerificationToken"
      WHERE "token" = ${hashedToken}
      AND "expires" > NOW()
      LIMIT 1
    `;
    
    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }
    
    const savedToken = tokens[0];
    
    // Find the user associated with this token
    const user = await prisma.user.findUnique({
      where: {
        email: savedToken.identifier
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update the user's email verification status
    // Use raw query to set emailVerified field directly
    const now = new Date();
    await prisma.$executeRaw`
      UPDATE "User"
      SET "emailVerified" = ${now}
      WHERE "id" = ${user.id}
    `;
    
    // Delete the used token to prevent reuse
    await prisma.$executeRaw`
      DELETE FROM "VerificationToken" 
      WHERE "id" = ${savedToken.id}
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 