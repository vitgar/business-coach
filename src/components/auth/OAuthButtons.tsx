'use client';

/**
 * OAuth Buttons Component
 * 
 * Renders OAuth provider buttons for authentication with Google and LinkedIn
 * Used in both sign-in and sign-up flows
 */

import { signIn } from 'next-auth/react';
import { useState } from 'react';

interface OAuthButtonsProps {
  callbackUrl?: string;
  className?: string;
}

export function OAuthButtons({ callbackUrl = '/dashboard', className = '' }: OAuthButtonsProps) {
  // Track loading state for each provider
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);

  /**
   * Handle OAuth sign in via Google
   */
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signIn('google', { callbackUrl });
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /**
   * Handle OAuth sign in via LinkedIn
   */
  const handleLinkedInSignIn = async () => {
    try {
      setIsLinkedInLoading(true);
      await signIn('linkedin', { callbackUrl });
    } catch (error) {
      console.error('LinkedIn sign in error:', error);
    } finally {
      setIsLinkedInLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Google sign in button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
      >
        {isGoogleLoading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-900"></span>
        ) : (
          <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span>{isGoogleLoading ? 'Signing in...' : 'Continue with Google'}</span>
      </button>

      {/* LinkedIn sign in button */}
      <button
        onClick={handleLinkedInSignIn}
        disabled={isLinkedInLoading}
        className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
      >
        {isLinkedInLoading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-900"></span>
        ) : (
          <svg className="h-5 w-5 text-[#0A66C2]" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 00.1.4V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
          </svg>
        )}
        <span>{isLinkedInLoading ? 'Signing in...' : 'Continue with LinkedIn'}</span>
      </button>

      {/* Divider */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or</span>
        </div>
      </div>
    </div>
  );
} 