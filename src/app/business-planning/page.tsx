import Link from 'next/link'
import { FileText, Target, DollarSign } from 'lucide-react'

// Business Planning page component
export default function BusinessPlanning() {
  const planningTools = [
    {
      icon: FileText,
      title: "Business Plan Generator",
      description: "Create a professional business plan with our interactive step-by-step guide.",
      link: "/business-planning/generator",
      buttonText: "Start Your Plan"
    },
    {
      icon: Target,
      title: "Strategic Plan Guide",
      description: "Develop a clear strategy and roadmap for your business success.",
      link: "/business-planning/strategic",
      buttonText: "Create Strategy"
    },
    {
      icon: DollarSign,
      title: "Financial Projections",
      description: "Build detailed financial forecasts and funding requirements.",
      link: "/business-planning/financials",
      buttonText: "Plan Finances"
    }
  ]

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Business Planning</h1>
          <p className="text-xl text-gray-600 mb-12">
            Create comprehensive plans for your business with our interactive tools and expert guidance.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {planningTools.map((tool, index) => {
              const Icon = tool.icon
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold mb-3">{tool.title}</h2>
                  <p className="text-gray-600 mb-6">{tool.description}</p>
                  <Link
                    href={tool.link}
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    {tool.buttonText}
                  </Link>
                </div>
              )
            })}
          </div>

          <div className="mt-12 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Why You Need a Business Plan</h2>
              <div className="bg-white p-6 rounded-xl">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                    <span>Clear roadmap for business growth and development</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                    <span>Essential for securing funding from investors or lenders</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                    <span>Helps identify potential challenges and opportunities</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                    <span>Sets clear objectives and performance metrics</span>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Expert Support Available</h2>
              <div className="bg-blue-50 p-6 rounded-xl">
                <p className="text-gray-600 mb-4">
                  Need help with your business planning? Our experts are here to guide you through the process.
                </p>
                <Link
                  href="/consultation"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Schedule a Consultation
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
} 