'use client';

/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset link
 * Validates email and sends reset link via API
 */

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/services/authService';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';

export default function ForgotPasswordPage() {
  // Form state
  const [email, setEmail] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle form submission
   * Validates email and sends reset request
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset error state
    setError(null);
    
    // Form validation
    if (!email) {
      setError('Email is required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Call the password reset request API
      await requestPasswordReset(email);
      
      // Show success message
      setIsSuccess(true);
      
      // Clear form
      setEmail('');
      
    } catch (err: any) {
      console.error('Password reset request error:', err);
      setError(err.message || 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormContainer
      title="Forgot your password?"
      subtitle="Enter your email address and we'll send you a reset link"
    >
      {isSuccess ? (
        <div className="rounded-md bg-green-50 p-6 text-center">
          <div className="flex flex-col items-center">
            <div className="mb-4 rounded-full bg-green-100 p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-green-800">Check your email</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                If {email} is registered with us, we've sent a password reset link.
                Please check your email inbox and spam folder.
              </p>
            </div>
            <div className="mt-6 flex space-x-4">
              <Link 
                href="/auth/signin" 
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Back to sign in
              </Link>
              <button
                onClick={() => setIsSuccess(false)}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try another email
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-75 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Back to sign in
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75"
            >
              {isLoading ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </div>
        </form>
      )}
    </AuthFormContainer>
  );
} 