/**
 * Reset Password API Route
 * 
 * Validates password reset tokens and updates user passwords
 * Handles the second step of the password reset flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';

// Validation schema for password reset
const schema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

/**
 * POST handler - process password reset
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
    
    const { token, password } = validation.data;
    
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
        { error: 'Invalid or expired token' },
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
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Update the user's password
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        password: hashedPassword
      }
    });
    
    // Delete the used token to prevent reuse
    await prisma.$executeRaw`
      DELETE FROM "VerificationToken" 
      WHERE "id" = ${savedToken.id}
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 