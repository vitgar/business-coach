'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Menu, User, LogOut, ChevronDown, 
  Grid, FileText, Settings, ListTodo, BookOpen
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import BusinessSelector from '@/components/BusinessSelector'

/**
 * Navigation Component
 * 
 * Main navigation bar for the application.
 * Includes business selector and user account menu.
 */
export default function Navigation() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // Handle user logout
  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-blue-600 font-bold text-xl">BusinessCoach</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <Grid className="h-5 w-5 inline-block mr-1" />
                Dashboard
              </Link>
              <Link
                href="/action-items"
                className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <ListTodo className="h-5 w-5 inline-block mr-1" />
                Action Items
              </Link>
              <Link
                href="/summaries"
                className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <BookOpen className="h-5 w-5 inline-block mr-1" />
                Summaries
              </Link>
              <Link
                href="/resources"
                className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <FileText className="h-5 w-5 inline-block mr-1" />
                Resources
              </Link>
            </div>
          </div>

          {/* Right side menu items */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Business Selector */}
            {isAuthenticated && (
              <div className="relative inline-block text-left mr-2 w-56">
                <BusinessSelector />
              </div>
            )}

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <span className="ml-2 mr-1">
                  {user?.name || 'Guest'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* User dropdown menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 inline-block mr-2" />
                      Account Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 inline-block mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/dashboard"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/action-items"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Action Items
            </Link>
            <Link
              href="/summaries"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Summaries
            </Link>
            <Link
              href="/resources"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Resources
            </Link>
            
            {/* Mobile business selector */}
            {isAuthenticated && (
              <div className="px-3 py-2">
                <p className="text-xs text-gray-500 mb-1">Your Business</p>
                <BusinessSelector />
              </div>
            )}
            
            <Link
              href="/account"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Account Settings
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
} 