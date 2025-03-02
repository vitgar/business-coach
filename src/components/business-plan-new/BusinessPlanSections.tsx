'use client'

import { useState } from 'react'
import { BookOpen, Building, Users, LineChart, TrendingUp, ShoppingBag, Truck, FileText, Info } from 'lucide-react'

/**
 * Section definition for the business plan
 */
interface SectionDefinition {
  id: string
  title: string
  icon: JSX.Element
  description: string
}

/**
 * Business Plan Sections Component Props
 */
interface BusinessPlanSectionsProps {
  currentSection: string
  onSectionChange: (sectionId: string) => void
  businessPlan: any
}

/**
 * BusinessPlanSections Component
 * 
 * Provides navigation between different sections of the business plan
 * Shows visual indicators for completed and current sections
 * Designed to work in a compact sidebar layout with icons and tooltips
 */
export default function BusinessPlanSections({ 
  currentSection, 
  onSectionChange,
  businessPlan 
}: BusinessPlanSectionsProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  
  // Define all available sections
  const sections: SectionDefinition[] = [
    {
      id: 'executiveSummary',
      title: 'Executive Summary',
      icon: <BookOpen className="h-5 w-5" />,
      description: 'Overview of your business plan'
    },
    {
      id: 'companyDescription',
      title: 'Company Description',
      icon: <Building className="h-5 w-5" />,
      description: 'Details about your business'
    },
    {
      id: 'productsAndServices',
      title: 'Products & Services',
      icon: <ShoppingBag className="h-5 w-5" />,
      description: 'What you offer to customers'
    },
    {
      id: 'marketAnalysis',
      title: 'Market Analysis',
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'Target market and competition'
    },
    {
      id: 'marketingStrategy',
      title: 'Marketing Strategy',
      icon: <LineChart className="h-5 w-5" />,
      description: "How you'll reach customers"
    },
    {
      id: 'operationsPlan',
      title: 'Operations Plan',
      icon: <Truck className="h-5 w-5" />,
      description: 'How your business will run'
    },
    {
      id: 'organizationAndManagement',
      title: 'Organization & Team',
      icon: <Users className="h-5 w-5" />,
      description: 'Your team and structure'
    },
    {
      id: 'financialPlan',
      title: 'Financial Plan',
      icon: <FileText className="h-5 w-5" />,
      description: 'Projections and funding needs'
    }
  ]

  // Function to check if a section is complete
  const isSectionComplete = (sectionId: string): boolean => {
    if (!businessPlan?.content) return false
    
    const sectionContent = businessPlan.content[sectionId]
    if (!sectionContent) return false
    
    // Check if the section has at least some content
    return Object.keys(sectionContent).length > 0
  }

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="p-3 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <h2 className="font-medium text-gray-800 text-sm">Sections</h2>
      </div>
      
      <nav className="flex-grow overflow-y-auto p-2">
        <ul className="space-y-1">
          {sections.map((section) => {
            const isComplete = isSectionComplete(section.id)
            const isActive = currentSection === section.id
            const isHovered = hoveredSection === section.id
            
            return (
              <li key={section.id} className="relative">
                <button
                  onClick={() => onSectionChange(section.id)}
                  onMouseEnter={() => setHoveredSection(section.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                  className={`w-full flex items-center justify-center p-3 rounded-md transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  aria-label={section.title}
                >
                  <div className="flex-shrink-0 relative">
                    {section.icon}
                    {isComplete && !isActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" title="Complete"></span>
                    )}
                  </div>
                </button>
                
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute left-full ml-2 top-0 z-20 w-48 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
                    <div className="font-medium mb-1">{section.title}</div>
                    <div className="text-xs text-gray-300">{section.description}</div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
      
      <div className="p-3 bg-blue-50 border-t border-blue-100 sticky bottom-0 z-10 flex justify-center">
        <button
          className="text-blue-700 hover:text-blue-900 rounded-full p-1"
          onMouseEnter={() => setHoveredSection('help')}
          onMouseLeave={() => setHoveredSection(null)}
          title="Help"
        >
          <Info className="h-4 w-4" />
        </button>
        
        {hoveredSection === 'help' && (
          <div className="absolute bottom-full mb-2 z-20 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
            Complete all sections to finalize your business plan.
          </div>
        )}
      </div>
    </div>
  )
} 