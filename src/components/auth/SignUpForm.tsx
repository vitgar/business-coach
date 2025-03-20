'use client';

/**
 * Sign Up Form Component
 * 
 * Handles new user registration with email and password
 * Validates inputs and sends data to registration API
 */

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OAuthButtons } from './OAuthButtons';

interface SignUpFormProps {
  callbackUrl?: string;
}

export function SignUpForm({ callbackUrl = '/dashboard' }: SignUpFormProps) {
  const router = useRouter();
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validates the form input values
   * @returns boolean indicating if form is valid
   */
  const validateForm = () => {
    // Reset error state
    setError(null);
    
    // Validate name
    if (!name || name.length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }
    
    // Validate email format (basic check)
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Validate password length
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Validate terms agreement
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return false;
    }
    
    return true;
  };

  /**
   * Handle form submission
   * Registers user and signs them in upon success
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Send registration data to API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });
      
      const data = await response.json();
      
      // Handle registration errors
      if (!response.ok) {
        setError(data.error || 'An error occurred during registration');
        return;
      }
      
      // On successful registration, sign in the user
      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (signInResult?.error) {
        setError('Registration successful, but there was an error signing in');
        return;
      }
      
      // Redirect to callback URL
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* OAuth Buttons */}
      <OAuthButtons callbackUrl={callbackUrl} />
      
      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <div className="mt-1">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
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
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-70 sm:text-sm"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
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
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-70 sm:text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
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
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-70 sm:text-sm"
            />
          </div>
        </div>

        {/* Terms of Service */}
        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
            I agree to the{' '}
            <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>

      {/* Sign In Link */}
      <div className="text-sm text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
} 