'use client'

/**
 * Session Provider Component
 * 
 * Wraps the application with NextAuth's SessionProvider
 * Must be used as a client component to prevent server rendering issues
 */

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

interface AuthSessionProviderProps {
  children: ReactNode
}

/**
 * Client component wrapper for NextAuth SessionProvider
 * This is needed because SessionProvider uses client-side hooks
 */
export default function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  return <SessionProvider>{children}</SessionProvider>
} 