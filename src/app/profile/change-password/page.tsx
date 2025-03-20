'use client';

/**
 * Change Password Page
 * 
 * Allows authenticated users to change their password
 * Requires verification of current password for security
 * Protected page - requires authentication
 */

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { changePassword } from '@/services/authService';

export default function ChangePasswordPage() {
  // Protect page with authentication
  const { isLoading } = useRequireAuth();
  const router = useRouter();
  
  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Handle form submission
   * Validates passwords, then sends request to API
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset status messages
    setError(null);
    setSuccess(null);
    
    // Client-side validation
    if (!currentPassword) {
      setError('Current password is required');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      
      setSuccess('Password changed successfully');
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect after a delay
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      console.error('Password change error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display loading state while session is loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Change Password
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Update your account password
        </p>

        <div className="mt-10 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {success && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">{success}</h3>
                </div>
              </div>
            </div>
          )}
          
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
            {/* Current Password Field */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="mt-1">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-70 sm:text-sm"
                />
              </div>
            </div>

            {/* New Password Field */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-70 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
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
                  disabled={isSubmitting}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-70 sm:text-sm"
                />
              </div>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Password Strength</h4>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                  <div 
                    className={`h-full rounded-full ${
                      newPassword.length < 8
                        ? 'w-1/4 bg-red-500'
                        : newPassword.length < 12
                        ? 'w-2/4 bg-yellow-500'
                        : newPassword.match(/[A-Z]/) && newPassword.match(/[a-z]/) && newPassword.match(/[0-9]/)
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

            {/* Submit Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => router.push('/profile')}
                disabled={isSubmitting}
                className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
              >
                {isSubmitting ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 