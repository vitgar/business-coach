/**
 * useRequireAuth Hook
 * 
 * Custom hook for protecting routes that require authentication
 * Handles redirecting unauthenticated users to the login page
 * Returns session data and loading state for use in protected components
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useRequireAuth() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status when status is no longer loading
    if (status !== 'loading') {
      // If not authenticated, redirect to sign-in page
      if (!session) {
        // Store the current URL to redirect back after login
        const currentPath = window.location.pathname;
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
      } else {
        // Authentication confirmed, stop loading
        setIsLoading(false);
      }
    }
  }, [session, status, router]);

  return {
    session,
    isLoading: status === 'loading' || isLoading,
    isAuthenticated: !!session,
    user: session?.user,
  };
} 