/**
 * Forgot Password API Route
 * 
 * Handles requests to send password reset emails
 * Generates a secure reset token and sends an email with reset link
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

// Validation schema for email
const schema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * POST handler - process password reset request
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
    
    const { email } = validation.data;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    // We don't want to reveal if a user exists or not for security reasons
    // So we return success even if the user doesn't exist
    if (!user) {
      // In production, log this for monitoring but return success to the client
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({ 
        success: true,
        message: 'If your email is in our system, we have sent a password reset link' 
      });
    }
    
    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token expiration to 1 hour from now
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1);
    
    // Save the reset token in the database
    // Access the verificationToken model directly through the prisma client
    await prisma.$executeRaw`
      INSERT INTO "VerificationToken" ("identifier", "token", "expires")
      VALUES (${email}, ${hashedToken}, ${tokenExpiry})
    `;
    
    // Generate reset link
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}`;
    
    // Here you would send an email with the reset link
    // For this implementation, we'll just log it
    console.log('Password reset link:', resetUrl);
    
    // In production, you would use an email service like:
    /*
    await sendEmail({
      to: email,
      subject: 'Reset Your Password',
      text: `Click the following link to reset your password: ${resetUrl}`,
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
    });
    */
    
    return NextResponse.json({
      success: true,
      message: 'If your email is in our system, we have sent a password reset link'
    });
    
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 