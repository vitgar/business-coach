'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { BrainCog, Plus, LayoutDashboard, LogIn, LogOut, User, ChevronDown } from 'lucide-react'
import Logo from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'

/**
 * HeaderBar Component
 * 
 * Displays the blue header bar with AI Business Coach title and tagline.
 * Optionally shows a New Chat button if onNewChat is provided.
 * Shows Dashboard or Sign In buttons based on authentication status.
 * Displays user avatar with dropdown menu for authenticated users.
 */
interface HeaderBarProps {
  onNewChat?: () => void;
  rightContent?: React.ReactNode;
  isOnDashboard?: boolean;
}

export default function HeaderBar({ onNewChat, rightContent, isOnDashboard = false }: HeaderBarProps) {
  // Get authentication state
  const { isAuthenticated, user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Handle user sign out
  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    await logout();
  };

  return (
    <header className="bg-blue-600 text-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Logo />
          <div className="flex flex-grow justify-center md:justify-end items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">AI Business Coach</h1>
              <p className="text-blue-100 text-sm">
                Get instant guidance and answers to your business questions
              </p>
            </div>
            {isAuthenticated ? (
              // Show dashboard link for authenticated users (if not on dashboard)
              !isOnDashboard && (
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded-md"
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
              )
            ) : (
              // Show sign in link for unauthenticated users
              <Link 
                href="/auth/signin" 
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded-md"
              >
                <LogIn size={18} />
                <span>Sign In</span>
              </Link>
            )}
            {onNewChat && (
              <Link 
                href="/consultation"
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded-md"
                onClick={(e) => {
                  if (onNewChat) {
                    e.preventDefault();
                    onNewChat();
                  }
                }}
              >
                <Plus size={18} />
                <span>New Chat</span>
              </Link>
            )}
            {rightContent && (
              <div className="ml-4">
                {rightContent}
              </div>
            )}
            
            {/* User Avatar with Dropdown for authenticated users */}
            {isAuthenticated && user && (
              <div className="relative ml-4" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
                >
                  <div className="h-10 w-10 rounded-full bg-blue-800 flex items-center justify-center overflow-hidden border-2 border-white">
                    {user.image ? (
                      <Image 
                        src={user.image} 
                        alt={user.name || 'User'} 
                        width={40} 
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold">{getUserInitials()}</span>
                    )}
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link 
                        href="/profile" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile
                      </Link>
                      <Link 
                        href="/settings" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 