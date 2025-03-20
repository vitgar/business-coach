'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard } from 'lucide-react'
import Navigation from './Navigation'
import HeaderBar from './layout/HeaderBar'

/**
 * Client Layout Component
 * 
 * Provides a consistent layout for client-side pages,
 * including navigation and common UI elements.
 */
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if we're on the dashboard page
  const pathname = usePathname();
  const isOnDashboard = pathname === '/dashboard';

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderBar 
        isOnDashboard={isOnDashboard}
      />
      <div className="flex-grow">
        {children}
      </div>
      <footer className="bg-gray-100 py-6">
        <div className="container mx-auto px-4 text-sm text-gray-600">
          <p className="text-center">© {new Date().getFullYear()} Business Coach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
} 