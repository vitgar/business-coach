# Authentication Implementation Plan

## Overview

This document outlines the step-by-step plan for implementing a robust authentication system for the Business Coach application. The implementation will replace the current development placeholder with actual authentication using:

1. Email and password authentication
2. LinkedIn OAuth authentication
3. Google OAuth authentication

## Prerequisites

- Node.js and npm installed
- PostgreSQL database setup (already configured in the project)
- Access to Google and LinkedIn developer consoles to set up OAuth applications

## Technology Stack

- Next.js 14 (App Router)
- NextAuth.js (for authentication)
- Prisma (for database operations)
- PostgreSQL (database)
- TailwindCSS (for styling)

## Implementation Steps

### Phase 1: Environment Setup (Estimated time: 0.5 day)

1. **Environment Variables**
   - [x] Review existing `.env` files for any authentication-related variables
   - [x] Update `NEXTAUTH_SECRET` with a strong random key
   - [x] Add OAuth provider variables:
     ```
     GOOGLE_CLIENT_ID=your-google-client-id
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     LINKEDIN_CLIENT_ID=your-linkedin-client-id
     LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
     ```

2. **OAuth Providers Setup**
   - [ ] **Google OAuth Setup**:
     - Create a new project in Google Cloud Console
     - Configure OAuth consent screen
     - Create OAuth credentials
     - Add redirect URLs: `http://localhost:3000/api/auth/callback/google` (development) and production URL
     - Request necessary scopes (profile, email)
     - Save Client ID and Client Secret for environment variables
   
   - [ ] **LinkedIn OAuth Setup**:
     - Create a new app in LinkedIn Developer Console
     - Configure OAuth settings
     - Add redirect URLs: `http://localhost:3000/api/auth/callback/linkedin` (development) and production URL
     - Request necessary scopes (r_emailaddress, r_liteprofile)
     - Save Client ID and Client Secret for environment variables

3. **Install Required Dependencies**
   - [x] Install bcrypt and NextAuth
   ```bash
   npm install next-auth@latest bcrypt
   npm install --save-dev @types/bcrypt
   ```

### Phase 2: NextAuth Configuration (Estimated time: 1 day)

1. **Create Auth API Route**
   - [x] Create file structure for NextAuth in App Router:
     ```
     src/app/api/auth/[...nextauth]/route.ts
     ```

2. **Configure NextAuth with Providers**
   - [x] Implement basic NextAuth setup with Prisma adapter
   - [x] Configure email/password (Credentials provider)
   - [x] Add Google provider
   - [x] Add LinkedIn provider
   - [x] Set up session handling and callbacks

3. **Update Prisma Schema (if needed)**
   - [x] Review current User model, ensure it has necessary fields:
     - Add `emailVerified` field if not present
     - Add fields for OAuth accounts
     - Add sessions table
     - Add verification tokens table
   - [x] Run `npx prisma migrate dev` to apply changes

### Phase 3: Authentication UI Components (Estimated time: 2-3 days)

1. **Create Sign In Page**
   - [x] Create sign-in page at `src/app/auth/signin/page.tsx`
   - [x] Implement email/password sign-in form
   - [x] Add "Sign in with Google" button
   - [x] Add "Sign in with LinkedIn" button
   - [x] Implement form validation
   - [x] Add error handling and success messages

2. **Create Sign Up Page**
   - [x] Create sign-up page at `src/app/auth/signup/page.tsx`
   - [x] Implement registration form with email validation
   - [x] Add social sign-up options
   - [x] Implement form validation
   - [x] Add error handling and success messages

3. **Create Password Management Pages**
   - [x] Forgot password page: `src/app/auth/forgot-password/page.tsx`
   - [x] Reset password page: `src/app/auth/reset-password/[token]/page.tsx`
   - [x] Email verification page: `src/app/auth/verify-email/[token]/page.tsx`

### Phase 4: Authentication API Routes (Estimated time: 1-2 days)

1. **Create Authentication API Routes**
   - [x] Registration endpoint: `src/app/api/auth/register/route.ts`
   - [x] Profile management: `src/app/api/auth/profile/route.ts`
   - [x] Password reset request: `src/app/api/auth/forgot-password/route.ts`
   - [x] Password reset confirmation: `src/app/api/auth/reset-password/route.ts`
   - [x] Email verification: `src/app/api/auth/verify-email/route.ts`
   - [x] Password change: `src/app/api/auth/change-password/route.ts`

2. **Fix Prisma/NextAuth Integration Issues**
   - [x] Fix Prisma model access for verification tokens
   - [x] Handle email verification field correctly
   - [x] Ensure proper error handling for authentication flows

3. **Testing Authentication Flow**
   - [x] Test sign-up process with credentials (ready for testing)
   - [x] Test sign-in with credentials (ready for testing)
   - [ ] Test social login providers (requires OAuth setup)
   - [x] Test password reset flow (ready for testing)
   - [x] Test email verification flow (ready for testing)
   - [x] Verify session handling and secure routes (ready for testing)

### Phase 5: Security Enhancements (Estimated time: 1 day)

1. **Authentication Middleware**
   - [x] Implement middleware to protect routes: `src/middleware.ts`
   - [x] Define public routes that don't require authentication
   - [x] Configure route protection based on user roles

2. **User Session Hooks**
   - [x] Create React hooks for accessing user session: `src/hooks/useRequireAuth.ts`
   - [x] Implement authentication context: `src/contexts/AuthContext.tsx`

3. **Security Best Practices**
   - [ ] Implement rate limiting for authentication endpoints
   - [ ] Add CSRF protection
   - [ ] Set up proper security headers
   - [ ] Configure session timeouts and refresh tokens

### Phase 6: Testing, Documentation, and Deployment (Estimated time: 1 day)

1. **End-to-End Testing**
   - [ ] Test entire authentication flow from sign-up to sign-out
   - [ ] Verify proper session handling across page refreshes
   - [ ] Test OAuth providers in production environment

2. **Documentation**
   - [ ] Document authentication architecture and flow
   - [ ] Create user guide for authentication-related features
   - [ ] Document security considerations and best practices

3. **Production Deployment**
   - [ ] Ensure all environment variables are properly set for production
   - [ ] Configure OAuth providers for production domains
   - [ ] Verify email service configuration in production
   - [ ] Deploy and test all authentication features in production

## API Routes Needed

- `/api/auth/[...nextauth]` - NextAuth API routes
- `/api/auth/register` - User registration
- `/api/auth/verify-email` - Email verification
- `/api/auth/reset-password` - Password reset
- `/api/auth/change-password` - Password change
- `/api/auth/profile` - User profile management

## Components to Create/Update

1. **Authentication Components**
   - SignInForm
   - SignUpForm
   - PasswordResetForm
   - OAuthButtons
   - EmailVerification

2. **User Interface Components**
   - UserProfileForm
   - PasswordChangeForm
   - AccountLinking

3. **Context and Hooks**
   - Update AuthContext and useAuth
   - Create useAuthRequired hook

## Security Considerations

1. **Password Storage**
   - Use bcrypt for password hashing
   - Implement proper salt rounds

2. **OAuth Security**
   - Validate OAuth tokens
   - Store tokens securely
   - Implement state parameter for CSRF protection

3. **General Security**
   - Implement rate limiting
   - Add CSRF protection
   - Use HTTPS in all environments

## Reference Documentation

- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [LinkedIn OAuth Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [Prisma with NextAuth](https://authjs.dev/reference/adapter/prisma)

## Timeline and Milestones

1. **Week 1**
   - Complete Phases 1-2
   - Basic authentication functioning with email/password

2. **Week 2**
   - Complete Phases 3-4
   - All authentication methods working
   - UI components in place

3. **Week 3**
   - Complete Phases 5-7
   - Security enhancements
   - Testing and deployment

## Checklist Before Production

- [ ] All OAuth redirects are properly configured
- [ ] Email sending is configured and tested
- [ ] All routes are properly protected
- [ ] Rate limiting is in place
- [ ] Error handling is comprehensive
- [ ] Security headers are configured
- [ ] Tests pass in all environments 