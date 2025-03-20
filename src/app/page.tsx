'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, BookOpen, DollarSign, LineChart, Settings, User, LogIn } from 'lucide-react'
import ClientLayout from '@/components/ClientLayout'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'

/**
 * Main homepage component
 * 
 * Landing page with options to start a business plan or access other features.
 * Uses auth context to manage business creation.
 * Shows appropriate buttons based on authentication status.
 */
export default function Home() {
  const router = useRouter()
  const { userId, isAuthenticated, currentBusinessId, setCurrentBusinessId } = useAuth()

  // Create a new business plan and redirect to it
  const handleStartBusinessPlan = async () => {
    try {
      const response = await fetch('/api/business-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: "New Business Plan"
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create business plan')
      }

      const data = await response.json()
      
      // Update the current business ID in context
      setCurrentBusinessId(data.id)
      
      // Redirect to the business plan page or dashboard
      router.push(`/business-plan/${data.id}`)
    } catch (error) {
      console.error('Error creating business plan:', error)
      toast.error('Failed to create business plan')
    }
  }

  // Go to dashboard if already authenticated
  const handleGetStarted = () => {
    if (isAuthenticated && currentBusinessId) {
      router.push('/dashboard')
    } else if (isAuthenticated) {
      handleStartBusinessPlan()
    } else {
      // Redirect to sign-in if not authenticated
      router.push('/auth/signin')
    }
  }

  return (
    <ClientLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">
            Step-by-Step Business Guidance for Entrepreneurs
          </h1>
          <p className="text-xl mb-8 max-w-2xl">
            Transform your business idea into reality with our comprehensive coaching platform. 
            Get expert guidance every step of the way.
          </p>
          <div className="space-x-4">
            <button 
              onClick={handleGetStarted}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center"
            >
              {isAuthenticated ? (currentBusinessId ? 'Go to Dashboard' : 'Start Your Business Plan') : 'Get Started'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            
            {!isAuthenticated && (
              <Link
                href="/auth/signin"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </Link>
            )}
            
            <Link
              href="/consultation"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Get Free Business Coaching
            </Link>
          </div>
        </div>
      </section>

      {/* Authentication Section - Only shown for non-authenticated users */}
      {!isAuthenticated && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Join Our Business Coaching Platform</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Create an account to get personalized business guidance, save your progress, and access exclusive resources.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Sign In Card */}
                <div className="bg-gray-50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-2xl font-bold mb-4">Already have an account?</h3>
                  <p className="text-gray-600 mb-6">
                    Sign in to continue working on your business plan and access your saved resources.
                  </p>
                  <Link 
                    href="/auth/signin" 
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
                
                {/* Sign Up Card */}
                <div className="bg-blue-50 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-blue-100">
                  <h3 className="text-2xl font-bold mb-4">New to Business Coach?</h3>
                  <p className="text-gray-600 mb-6">
                    Create a free account to start your business journey with personalized guidance.
                  </p>
                  <ul className="mb-6 space-y-2">
                    <li className="flex items-center text-gray-700">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Create and save business plans
                    </li>
                    <li className="flex items-center text-gray-700">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Get personalized recommendations
                    </li>
                    <li className="flex items-center text-gray-700">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Access business templates and resources
                    </li>
                  </ul>
                  <Link 
                    href="/auth/signup" 
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Create Free Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Overview Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Succeed
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Business Planning */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <BookOpen className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Business Planning</h3>
              <p className="text-gray-600">
                Create comprehensive business plans with our step-by-step guidance
              </p>
            </div>

            {/* Funding & Financials */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <DollarSign className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Funding & Financials</h3>
              <p className="text-gray-600">
                Learn about funding options and manage your business finances
              </p>
            </div>

            {/* Marketing & Growth */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <LineChart className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Marketing & Growth</h3>
              <p className="text-gray-600">
                Develop effective marketing strategies to grow your business
              </p>
            </div>

            {/* Operations & Legal */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Settings className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Operations & Legal</h3>
              <p className="text-gray-600">
                Handle legal requirements and optimize your operations
              </p>
            </div>
          </div>
        </div>
      </section>
    </ClientLayout>
  )
} 