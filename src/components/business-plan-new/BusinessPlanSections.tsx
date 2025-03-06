'use client'

import React, { useState } from 'react'
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
 * Icon-only navigation with tooltips for maximum space efficiency
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
    <div className="bg-white rounded-md h-full">
      <nav aria-label="Business Plan Sections">
        <h2 className="sr-only">Business Plan Navigation</h2>
        
        {/* Horizontal compact layout with smaller icons */}
        <ul className="flex flex-row space-x-1 overflow-x-auto py-1 items-center justify-start">
          {sections.map(section => {
            const isActive = currentSection === section.id;
            const isHovered = hoveredSection === section.id;
            const isComplete = isSectionComplete(section.id);
            
            return (
              <li key={section.id} className="flex-shrink-0">
                <button
                  onClick={() => onSectionChange(section.id)}
                  onMouseEnter={() => setHoveredSection(section.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-md text-xs transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : isComplete 
                        ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  title={section.title}
                >
                  <div className="relative">
                    {React.cloneElement(section.icon, { className: 'h-4 w-4' })}
                    {isComplete && !isActive && (
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-500 rounded-full" aria-hidden="true"></span>
                    )}
                  </div>
                </button>
                
                {/* Simplified tooltip */}
                {isHovered && (
                  <div 
                    className="absolute z-20 bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg mt-1"
                    style={{
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="font-medium mb-0.5">{section.title}</div>
                    <div className="text-gray-300 text-xs">{section.description}</div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
} 