'use client';

/**
 * Authentication Form Container
 * 
 * A common layout wrapper for all authentication-related forms
 * Provides consistent styling and layout for auth pages
 */

import Link from 'next/link';
import Logo from '../Logo';

interface AuthFormContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerText?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
}

export function AuthFormContainer({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthFormContainerProps) {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
        </div>
        
        {/* Header */}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{title}</h2>
        {subtitle && <p className="mt-2 text-center text-sm text-gray-600">{subtitle}</p>}
      </div>

      {/* Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Form Content */}
          {children}
          
          {/* Footer Link */}
          {footerText && footerLinkText && footerLinkHref && (
            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                {footerText}{' '}
                <Link href={footerLinkHref} className="font-medium text-blue-600 hover:text-blue-500">
                  {footerLinkText}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 