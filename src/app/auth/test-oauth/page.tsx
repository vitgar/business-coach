/**
 * OAuth Test Page
 * 
 * Simple test page to try different OAuth providers
 * without going through the standard sign-in form
 */

'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function TestOAuth() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const handleSignIn = async (provider: string) => {
    setStatus(`Signing in with ${provider}...`);
    setError(null);
    
    try {
      // Trigger sign-in with specific provider
      const result = await signIn(provider, { 
        redirect: false,
        callbackUrl: '/dashboard' 
      });
      
      if (result?.error) {
        setError(result.error);
        setStatus(`Failed to sign in with ${provider}`);
      } else if (result?.url) {
        setStatus(`Redirecting to ${provider}...`);
        window.location.href = result.url;
      }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      setError(error instanceof Error ? error.message : String(error));
      setStatus(`Error occurred with ${provider}`);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">OAuth Test Page</h1>
        
        <div className="mb-8 space-y-4">
          <button
            onClick={() => handleSignIn('google')}
            className="flex w-full items-center justify-center rounded-md bg-white px-4 py-2 text-gray-700 shadow hover:bg-gray-50"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
          
          <button
            onClick={() => handleSignIn('linkedin')}
            className="flex w-full items-center justify-center rounded-md bg-[#0077B5] px-4 py-2 text-white shadow hover:bg-[#006699]"
          >
            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            Sign in with LinkedIn
          </button>
          
          <div className="mt-4">
            <a 
              href="/api/auth/test-linkedin" 
              className="inline-block w-full rounded-md bg-gray-800 px-4 py-2 text-center font-semibold text-white hover:bg-gray-700 mb-2"
            >
              Test LinkedIn API Directly
            </a>
            
            <a 
              href={`https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || '86phkvueohp0ql'}&redirect_uri=${encodeURIComponent('http://localhost:3000/api/auth/linkedin-callback')}&state=debug123&scope=r_liteprofile%20r_emailaddress`}
              className="inline-block w-full rounded-md bg-blue-600 px-4 py-2 text-center font-semibold text-white hover:bg-blue-700 mt-2"
            >
              LinkedIn OAuth with Debug
            </a>
          </div>
        </div>
        
        {status && (
          <div className="mb-4 rounded bg-blue-50 p-3 text-blue-700">
            {status}
          </div>
        )}
        
        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-red-700">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <a href="/auth/signin" className="text-blue-500 hover:underline">
            Return to Sign In Page
          </a>
        </div>
      </div>
    </div>
  );
} 