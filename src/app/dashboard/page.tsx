'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, Target, Settings, 
  ChevronRight, BarChart2, Users, DollarSign 
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import BusinessSelector from '@/components/BusinessSelector'

/**
 * Dashboard Page
 * 
 * Central hub for managing businesses and accessing various features
 */
export default function Dashboard() {
  const router = useRouter()
  const { isAuthenticated, currentBusinessId } = useAuth()
  
  // Check authentication
  useEffect(() => {
    // In production, redirect to login if not authenticated
    // if (!isAuthenticated) {
    //   router.push('/login')
    // }
  }, [isAuthenticated, router])
  
  // Quick links for selected business
  const businessLinks = [
    {
      title: 'Business Plan',
      icon: FileText,
      description: 'Edit and manage your business plan',
      href: `/business-plan/${currentBusinessId}`,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Strategic Planning',
      icon: Target,
      description: 'Define your business strategy and goals',
      href: `/strategic-plan/${currentBusinessId}`,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Financial Projections',
      icon: DollarSign,
      description: 'Manage financial forecasts and budgets',
      href: `/financials/${currentBusinessId}`,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      title: 'Market Analysis',
      icon: BarChart2,
      description: 'Analyze your target market and competition',
      href: `/market-analysis/${currentBusinessId}`,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Team Management',
      icon: Users,
      description: 'Plan your organizational structure',
      href: `/team/${currentBusinessId}`,
      color: 'bg-red-100 text-red-600'
    },
    {
      title: 'Business Settings',
      icon: Settings,
      description: 'Configure business details and preferences',
      href: `/settings/${currentBusinessId}`,
      color: 'bg-gray-100 text-gray-600'
    }
  ]
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="font-semibold text-gray-800 mb-3">Your Businesses</h2>
              <BusinessSelector />
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-800 mb-3">Quick Access</h2>
              <nav className="space-y-1">
                <Link 
                  href="/resources" 
                  className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <FileText className="h-5 w-5 mr-3 text-gray-500" />
                  Resources
                </Link>
                <Link 
                  href="/templates" 
                  className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <FileText className="h-5 w-5 mr-3 text-gray-500" />
                  Templates
                </Link>
                <Link 
                  href="/account" 
                  className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <Settings className="h-5 w-5 mr-3 text-gray-500" />
                  Account Settings
                </Link>
              </nav>
            </div>
          </div>
          
          {/* Main content */}
          <div className="col-span-9">
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
                {currentBusinessId ? (
                  <p className="text-gray-600">
                    Manage your business and access key tools and resources.
                  </p>
                ) : (
                  <p className="text-gray-600">
                    Select a business or create a new one to get started.
                  </p>
                )}
              </div>
            </div>
            
            {currentBusinessId ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {businessLinks.map((link, index) => (
                  <Link 
                    key={index} 
                    href={link.href}
                    className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start">
                        <div className={`rounded-full p-3 ${link.color}`}>
                          <link.icon className="h-6 w-6" />
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">{link.title}</h3>
                          <p className="text-gray-600 mt-1">{link.description}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="text-center">
                  <h2 className="text-lg font-semibold mb-2">No Business Selected</h2>
                  <p className="text-gray-600 mb-6">
                    Select an existing business from the sidebar or create a new one to get started.
                  </p>
                  <button
                    onClick={() => document.querySelector<HTMLButtonElement>('.business-selector-create')?.click()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Create New Business Plan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 