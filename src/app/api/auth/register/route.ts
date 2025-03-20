/**
 * Registration API Route
 * 
 * Handles new user registration with email and password
 * Validates input data, checks for existing users, and creates new accounts
 * Securely hashes passwords before storing
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import z from 'zod';
import { prisma } from '@/lib/prisma';

// Validation schema for registration data
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input data
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { name, email, password } = validationResult.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Set default role (using lowercase to match schema)
        role: 'user',
      },
    });
    
    // Remove sensitive data before returning
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json(
      { message: 'Registration successful', user: userWithoutPassword },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Failed to register user' },
      { status: 500 }
    );
  }
} 