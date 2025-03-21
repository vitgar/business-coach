/**
 * Authentication Error Page
 * 
 * Displays error messages during authentication
 * Helps users understand what went wrong and how to resolve it
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [errorDescription, setErrorDescription] = useState<string | null>(null);

  useEffect(() => {
    // Get error details from URL params
    const errorParam = searchParams.get('error');
    
    setError(errorParam);

    // Set human-readable error description based on error code
    if (errorParam === 'AccessDenied') {
      setErrorDescription('You do not have permission to sign in.');
    } else if (errorParam === 'OAuthSignin') {
      setErrorDescription('Error in the OAuth sign-in process. Please try again.');
    } else if (errorParam === 'OAuthCallback') {
      setErrorDescription('Error in the OAuth callback. This could be due to an incorrect configuration.');
    } else if (errorParam === 'Configuration') {
      setErrorDescription('There is a problem with the server configuration. Please contact support.');
    } else if (errorParam === 'Default') {
      setErrorDescription('An unknown error occurred. Please try again or use a different sign-in method.');
    } else {
      setErrorDescription('An unexpected error occurred. Please try again later.');
    }

    // Log complete search params for debugging
    console.log('Auth error search params:', Object.fromEntries(searchParams.entries()));
  }, [searchParams]);

  return (
    <div className="flex h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-red-600">Authentication Error</h1>
        
        {error && (
          <div className="mb-4 rounded bg-red-50 p-4">
            <p className="font-semibold">Error Type: {error}</p>
            {errorDescription && <p className="mt-2 text-gray-700">{errorDescription}</p>}
          </div>
        )}
        
        <div className="mt-6">
          <h2 className="mb-2 font-medium">What can you do?</h2>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>Try signing in with a different method</li>
            <li>Clear your browser cookies and cache</li>
            <li>Check if you're using the correct credentials</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </div>
        
        <div className="mt-8 flex justify-center">
          <Link 
            href="/auth/signin" 
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
} 