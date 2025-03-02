'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { DEV_CONFIG } from '@/config/development'
import { AuthContextType, User } from '@/types/auth'

// Create context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Authentication Provider Component
 * 
 * During development, it uses fixed IDs from DEV_CONFIG.
 * In production, it would connect to real authentication.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // State for authentication
  const [userId, setUserId] = useState<string | null>(
    DEV_CONFIG.useDevAuth ? DEV_CONFIG.userId : null
  )
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null)

  // In development, create a mock user
  useEffect(() => {
    if (DEV_CONFIG.useDevAuth && userId) {
      // Simulate loading user data
      setIsLoading(true)
      
      // Mock user for development
      const mockUser: User = {
        id: userId,
        name: 'Development User',
        email: 'dev@example.com',
        role: 'user'
      }
      
      // Simulate API delay
      setTimeout(() => {
        setUser(mockUser)
        setIsLoading(false)
      }, 500)
    } else {
      setIsLoading(false)
    }
  }, [userId])

  // In development mode, authentication is always true if userId exists
  const isAuthenticated = !!userId

  // Mock login function (will be replaced with real implementation)
  const login = async (email: string, password: string): Promise<boolean> => {
    if (DEV_CONFIG.useDevAuth) {
      // In development mode, always succeed
      setUserId(DEV_CONFIG.userId)
      return true
    }
    
    // Real login implementation would go here
    console.log('Login not implemented in production mode')
    return false
  }

  // Mock logout function
  const logout = async (): Promise<void> => {
    setUserId(null)
    setUser(null)
    setCurrentBusinessId(null)
  }

  // Create context value
  const contextValue: AuthContextType = {
    userId,
    user,
    isAuthenticated,
    isLoading,
    currentBusinessId,
    setCurrentBusinessId,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to use authentication context
 * 
 * Throws an error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Hook to access current business ID
 * 
 * Convenience wrapper around useAuth
 */
export function useCurrentBusiness(): {
  currentBusinessId: string | null;
  setCurrentBusinessId: (id: string) => void;
} {
  const { currentBusinessId, setCurrentBusinessId } = useAuth()
  return { currentBusinessId, setCurrentBusinessId }
} 