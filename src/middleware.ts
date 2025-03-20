/**
 * Authentication Middleware
 * 
 * Middleware to protect routes that require authentication
 * Redirects unauthenticated users to the login page
 * Defines public routes that don't require authentication
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/api/auth/verify-email',
  '/api/auth/reset-password',
];

// Routes that start with these paths don't require authentication
const publicPathStarts = [
  '/auth/reset-password/',
  '/auth/verify-email/',
  '/api/auth/',
  '/_next/',
  '/favicon',
  '/images/',
];

/**
 * Check if a route is public (doesn't require authentication)
 * @param path URL path to check
 * @returns Boolean indicating if the route is public
 */
function isPublicRoute(path: string): boolean {
  // Check exact routes
  if (publicRoutes.includes(path)) {
    return true;
  }
  
  // Check path starts
  return publicPathStarts.some(start => path.startsWith(start));
}

/**
 * Middleware handler function
 * Protects routes based on authentication status
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip middleware for public routes
  if (isPublicRoute(path)) {
    return NextResponse.next();
  }
  
  // Get the NextAuth session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // Redirect to login if not authenticated
  if (!token) {
    const url = new URL('/auth/signin', request.url);
    // Add the current path as callbackUrl for redirecting back after login
    url.searchParams.append('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // User is authenticated, proceed
  return NextResponse.next();
}

// Configure paths to run middleware on
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes that don't require auth (handled within API routes)
     * 2. /_next (Next.js internals)
     * 3. /fonts, /images (static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|fonts/|images/).*)',
  ],
}; 