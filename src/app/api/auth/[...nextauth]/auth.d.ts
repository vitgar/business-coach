/**
 * NextAuth.js Type Declarations
 * 
 * This file extends the NextAuth types to include custom properties 
 * like user role and user ID in the session.
 */

import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Extends the built-in session types
   */
  interface Session {
    user: {
      /** The user's unique identifier */
      id: string
      /** The user's role (user, admin, etc.) */
      role: string
    } & DefaultSession["user"]
  }

  /**
   * Extends the built-in JWT types
   */
  interface JWT {
    /** The user's role */
    role?: string
  }
} 