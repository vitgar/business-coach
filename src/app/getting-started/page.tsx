import { Lightbulb, Search, BarChart3, Scale, Calculator } from 'lucide-react'
import Link from 'next/link'

// Getting Started page component
export default function GettingStarted() {
  const steps = [
    {
      icon: Lightbulb,
      title: "Find Your Business Idea",
      description: "Learn how to identify profitable business opportunities and validate your ideas.",
      link: "/getting-started/business-idea"
    },
    {
      icon: Search,
      title: "Market Research",
      description: "Understand your target market, competitors, and industry trends.",
      link: "/getting-started/market-research"
    },
    {
      icon: BarChart3,
      title: "Choose Your Business Model",
      description: "Select the right business model and structure for your venture.",
      link: "/getting-started/business-model"
    },
    {
      icon: Scale,
      title: "Legal & Registration",
      description: "Navigate the legal requirements and registration process.",
      link: "/getting-started/legal-registration"
    },
    {
      icon: Calculator,
      title: "Financial Planning",
      description: "Plan your startup costs and initial financial strategy.",
      link: "/getting-started/financial-planning"
    }
  ]

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Getting Started</h1>
          <p className="text-xl text-gray-600 mb-12">
            Follow our comprehensive guide to transform your business idea into reality. 
            Each step provides detailed information and actionable tasks.
          </p>

          <div className="space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <Link 
                  key={index}
                  href={step.link}
                  className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{step.title}</h2>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="mt-12 bg-blue-50 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              Our business experts are here to guide you through each step of your journey.
            </p>
            <Link 
              href="/consultation"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Schedule a Free Consultation
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
} 