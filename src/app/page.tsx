'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, BookOpen, DollarSign, LineChart, Settings, Book } from 'lucide-react'
import ClientLayout from '@/components/ClientLayout'
import { toast } from 'react-toastify'

// Main homepage component
export default function Home() {
  const router = useRouter()

  const handleStartBusinessPlan = async () => {
    try {
      const response = await fetch('/api/business-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to create business plan')
      }

      const data = await response.json()
      router.push(`/business-plan/${data.id}`)
    } catch (error) {
      console.error('Error creating business plan:', error)
      toast.error('Failed to create business plan')
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
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleStartBusinessPlan}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center"
            >
              Start Your Business Plan
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <Link
              href="/consultation"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Get Free Business Coaching
            </Link>
            <Link
              href="/smart-journal"
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors inline-flex items-center"
            >
              Open Smart Journal
              <Book className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Overview Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Succeed
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {/* Business Planning */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <BookOpen className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Business Planning</h3>
              <p className="text-gray-600">
                Create comprehensive business plans with our step-by-step guidance
              </p>
            </div>

            {/* Smart Journal */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Book className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Journal</h3>
              <p className="text-gray-600">
                Keep track of your business activities, create to-do lists, and get AI-powered insights
              </p>
              <Link 
                href="/smart-journal" 
                className="mt-4 text-green-600 inline-flex items-center hover:text-green-700"
              >
                Try Smart Journal
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
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