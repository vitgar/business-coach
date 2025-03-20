'use client';

/**
 * Reset Password Page
 * 
 * Allows users to reset their password using a valid token
 * Validates token and provides form for entering new password
 */

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/services/authService';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      setError('Invalid password reset link');
    }
  }, [token]);

  /**
   * Handle form submission
   * Validates input and calls reset password API
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset error state
    setError(null);
    
    // Form validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Call reset password API
      await resetPassword({
        token,
        password,
        confirmPassword
      });
      
      // Show success state
      setIsSuccess(true);
      
      // Clear form
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
      
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // Show success message after password reset
  if (isSuccess) {
    return (
      <AuthFormContainer
        title="Password Reset Successful"
        subtitle="Your password has been updated"
      >
        <div className="rounded-md bg-green-50 p-6 text-center">
          <div className="flex flex-col items-center">
            <div className="mb-4 rounded-full bg-green-100 p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-green-800">Password reset successful!</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Your password has been reset. You'll be redirected to the sign-in page shortly.
              </p>
            </div>
            <div className="mt-6">
              <Link 
                href="/auth/signin" 
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign in now
              </Link>
            </div>
          </div>
        </div>
      </AuthFormContainer>
    );
  }

  // Show invalid token error
  if (!isTokenValid) {
    return (
      <AuthFormContainer
        title="Invalid Reset Link"
        subtitle="The password reset link is invalid or has expired"
      >
        <div className="rounded-md bg-red-50 p-6 text-center">
          <div className="flex flex-col items-center">
            <div className="mb-4 rounded-full bg-red-100 p-3">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800">Password reset link invalid</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                {error || 'The password reset link is invalid or has expired.'}
              </p>
            </div>
            <div className="mt-6 flex space-x-4">
              <Link 
                href="/auth/forgot-password" 
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Request new link
              </Link>
              <Link 
                href="/auth/signin" 
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </AuthFormContainer>
    );
  }

  // Show password reset form
  return (
    <AuthFormContainer
      title="Reset Your Password"
      subtitle="Create a new password for your account"
    >
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* New Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-75 sm:text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Password must be at least 8 characters
          </p>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <div className="mt-1">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-75 sm:text-sm"
            />
          </div>
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <div>
            <h4 className="text-sm font-medium text-gray-700">Password Strength</h4>
            <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
              <div 
                className={`h-full rounded-full ${
                  password.length < 8
                    ? 'w-1/4 bg-red-500'
                    : password.length < 12
                    ? 'w-2/4 bg-yellow-500'
                    : password.match(/[A-Z]/) && password.match(/[a-z]/) && password.match(/[0-9]/)
                    ? 'w-full bg-green-500'
                    : 'w-3/4 bg-blue-500'
                }`}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              For best security, use a mix of uppercase, lowercase, numbers, and special characters
            </p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-75"
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </AuthFormContainer>
  );
} 