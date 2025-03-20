/**
 * Authentication Service
 * 
 * Provides methods for managing authentication-related operations:
 * - Sign-in and registration (handled by NextAuth.js)
 * - Password management (change, reset)
 * - Profile management
 * - Email verification
 */

import { signIn, signOut } from 'next-auth/react';

/**
 * Sign in with credentials (email/password)
 * @param email User email
 * @param password User password
 * @returns Promise resolving to the sign-in result
 */
export const signInWithCredentials = async (email: string, password: string) => {
  const response = await signIn('credentials', {
    email,
    password,
    redirect: false,
  });

  if (!response?.ok) {
    throw new Error(response?.error || 'Sign in failed');
  }

  return response;
};

/**
 * Sign in with Google
 * @param callbackUrl URL to redirect to after successful authentication
 */
export const signInWithGoogle = (callbackUrl?: string) => {
  return signIn('google', { callbackUrl });
};

/**
 * Sign in with LinkedIn
 * @param callbackUrl URL to redirect to after successful authentication
 */
export const signInWithLinkedIn = (callbackUrl?: string) => {
  return signIn('linkedin', { callbackUrl });
};

/**
 * Sign out the current user
 * @param callbackUrl URL to redirect to after sign out
 */
export const signOutUser = (callbackUrl?: string) => {
  return signOut({ callbackUrl });
};

/**
 * Update user profile
 * @param data Object containing profile data to update (name, email, image)
 * @returns Promise resolving to the updated profile
 */
export const updateProfile = async (data: { name?: string; email?: string; image?: string }) => {
  const response = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }

  return await response.json();
};

/**
 * Change user password
 * @param data Object containing password data (currentPassword, newPassword, confirmPassword)
 * @returns Promise resolving to the result
 */
export const changePassword = async (data: { 
  currentPassword: string; 
  newPassword: string; 
  confirmPassword: string; 
}) => {
  const response = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change password');
  }

  return await response.json();
};

/**
 * Request password reset
 * @param email User email address
 * @returns Promise resolving to the result
 */
export const requestPasswordReset = async (email: string) => {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request password reset');
  }

  return await response.json();
};

/**
 * Reset password with token
 * @param data Object containing token and new password
 * @returns Promise resolving to the result
 */
export const resetPassword = async (data: { 
  token: string; 
  password: string; 
  confirmPassword: string; 
}) => {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reset password');
  }

  return await response.json();
};

/**
 * Verify email with token
 * @param token Email verification token
 * @returns Promise resolving to the result
 */
export const verifyEmail = async (token: string) => {
  const response = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to verify email');
  }

  return await response.json();
}; 