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

  // Load and auto-select the last business when component mounts
  useEffect(() => {
    const loadLastBusiness = async () => {
      if (!userId) return;
      
      try {
        // Fetch user's businesses
        const response = await fetch(`/api/users/${userId}/businesses`);
        
        if (!response.ok) {
          console.error('Failed to fetch businesses for auto-selection');
          return;
        }
        
        const businesses = await response.json();
        
        // If there are businesses, select the last one (most recently updated)
        if (businesses && businesses.length > 0) {
          // Sort by updatedAt in descending order
          const sortedBusinesses = [...businesses].sort((a, b) => {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
          
          // Select the first business (most recently updated)
          setCurrentBusinessId(sortedBusinesses[0].id);
          console.log('Auto-selected business:', sortedBusinesses[0].title || sortedBusinesses[0].businessName);
        }
      } catch (error) {
        console.error('Error auto-selecting last business:', error);
      }
    };
    
    // Only run this when userId changes to a non-null value
    if (userId) {
      loadLastBusiness();
    }
  }, [userId]);

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