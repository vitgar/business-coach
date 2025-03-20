'use client';

/**
 * User Profile Page
 * 
 * Allows users to view and update their profile information
 * Protected page - requires authentication
 */

import { useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { updateProfile } from '@/services/authService';

export default function ProfilePage() {
  // Protect page with authentication
  const { session, isLoading } = useRequireAuth();
  const { update: updateSession } = useSession();
  
  // Form state
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [image, setImage] = useState(session?.user?.image || '');
  
  // UI state
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset status messages
    setError(null);
    setSuccess(null);
    
    try {
      setIsUpdating(true);
      
      // Only include fields that have changed
      const updateData: any = {};
      if (name !== session?.user?.name) updateData.name = name;
      if (email !== session?.user?.email) updateData.email = email;
      if (image !== session?.user?.image) updateData.image = image;
      
      // Update profile if there are changes
      if (Object.keys(updateData).length > 0) {
        const result = await updateProfile(updateData);
        
        // Update session with new user data
        await updateSession({
          user: {
            ...session?.user,
            ...updateData
          }
        });
        
        setSuccess('Profile updated successfully');
      } else {
        setSuccess('No changes to save');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Display loading state while session is loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Your Profile
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Update your account information
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
            {/* Profile Image */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-gray-200">
                  {image ? (
                    <img src={image} alt={name || 'User'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500">
                      {name ? name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isUpdating}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-70 sm:text-sm"
                />
              </div>
            </div>

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isUpdating}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-70 sm:text-sm"
                />
              </div>
              {email !== session?.user?.email && (
                <p className="mt-1 text-xs text-amber-600">
                  Changing your email will require verification of the new address.
                </p>
              )}
            </div>

            {/* Image URL Field */}
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                Profile Picture URL
              </label>
              <div className="mt-1">
                <input
                  id="image"
                  name="image"
                  type="url"
                  value={image || ''}
                  onChange={(e) => setImage(e.target.value)}
                  disabled={isUpdating}
                  placeholder="https://example.com/your-image.jpg"
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-70 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter a URL for your profile picture (optional)
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdating}
                className="flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Change Password Link */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Password</h3>
            <div className="mt-4">
              <a 
                href="/profile/change-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Change your password
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 