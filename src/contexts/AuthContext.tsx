'use client'

/**
 * Authentication Context Provider
 * 
 * Provides authentication state and methods throughout the application
 * Uses NextAuth.js for authentication
 */

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DEV_CONFIG } from '@/config/development'
import { AuthContextType, User } from '@/types/auth'

// Create context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Authentication Provider Component
 * 
 * Wraps the application with authentication context
 * Uses NextAuth session for authentication state
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // State for authentication
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null)

  // Update state based on session
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true)
      return
    }

    if (status === 'authenticated' && session?.user) {
      // Extract user data from session
      setUserId(session.user.id)
      setUser(session.user as User)
      setIsLoading(false)
    } else {
      // Not authenticated
      setUserId(null)
      setUser(null)
      setIsLoading(false)

      // If using dev auth, create a mock user (for development only)
      if (DEV_CONFIG.useDevAuth) {
        setUserId(DEV_CONFIG.userId)
        
        // Mock user for development
        const mockUser: User = {
          id: DEV_CONFIG.userId,
          name: 'Development User',
          email: 'dev@example.com',
          role: 'user'
        }
        
        setUser(mockUser)
      }
    }
  }, [session, status])

  // Load and auto-select the last business when user changes
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

  // Is authenticated if session exists or dev auth is enabled
  const isAuthenticated = status === 'authenticated' || (DEV_CONFIG.useDevAuth && !!userId)

  /**
   * Log in with credentials (email/password)
   * Uses NextAuth signIn function
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    if (DEV_CONFIG.useDevAuth) {
      // In development mode, always succeed
      setUserId(DEV_CONFIG.userId)
      return true
    }
    
    try {
      // Use NextAuth signIn with credentials
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      })
      
      // Return true if signin was successful (no error)
      return !result?.error
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  /**
   * Log out user 
   * Uses NextAuth signOut function and clears local state
   */
  const logout = async (): Promise<void> => {
    try {
      // Clear internal state first
      setUserId(null)
      setUser(null)
      setCurrentBusinessId(null)
      
      // In development mode with mock auth, we can return now
      if (DEV_CONFIG.useDevAuth) {
        // Force a redirect to homepage
        router.push('/')
        return
      }
      
      // Use NextAuth signOut for real authentication
      await signOut({ 
        redirect: true,
        callbackUrl: '/' 
      })
      
      // Note: The redirect option should handle this, but as a fallback:
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Even if there's an error, try to redirect
      router.push('/')
    }
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