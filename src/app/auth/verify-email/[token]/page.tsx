'use client';

/**
 * Email Verification Page
 * 
 * Verifies a user's email address using the provided token
 * Displays appropriate success/error message based on verification result
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import Link from 'next/link';
import { verifyEmail } from '@/services/authService';

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verify email on component mount
  useEffect(() => {
    const verifyEmailToken = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Call the actual verification API
        if (!token) {
          throw new Error('Invalid verification token');
        }
        
        await verifyEmail(token);
        setIsVerified(true);
      } catch (err: any) {
        console.error('Email verification error:', err);
        setError(err.message || 'An error occurred while verifying your email');
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token) {
      verifyEmailToken();
    } else {
      setError('Invalid verification link');
      setIsLoading(false);
    }
  }, [token]);

  return (
    <AuthFormContainer
      title="Email Verification"
      subtitle="We're verifying your email address"
    >
      {isLoading ? (
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900"></div>
          </div>
          <p className="text-gray-600">Verifying your email address...</p>
        </div>
      ) : isVerified ? (
        <div className="rounded-md bg-green-50 p-6 text-center">
          <div className="flex flex-col items-center">
            <div className="mb-4 rounded-full bg-green-100 p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-green-800">Email verified!</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Your email has been successfully verified.
                You can now sign in to your account.
              </p>
            </div>
            <div className="mt-6">
              <Link 
                href="/auth/signin" 
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign in to your account
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-red-50 p-6 text-center">
          <div className="flex flex-col items-center">
            <div className="mb-4 rounded-full bg-red-100 p-3">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800">Verification failed</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                {error || 'The verification link is invalid or has expired.'}
              </p>
            </div>
            <div className="mt-6 flex space-x-4">
              <Link 
                href="/auth/signin" 
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign in
              </Link>
              <Link 
                href="/" 
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Return to home
              </Link>
            </div>
          </div>
        </div>
      )}
    </AuthFormContainer>
  );
} 