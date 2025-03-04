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
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col overflow-x-hidden">
      <div className="py-2 px-1 bg-gray-50 border-b border-gray-200 sticky top-0 z-10 flex justify-center">
        <span className="sr-only">Sections</span>
      </div>
      
      <nav aria-label="Business Plan Sections" className="mb-4">
        <h2 className="sr-only">Business Plan Navigation</h2>
        
        {/* Changed from vertical to horizontal layout */}
        <ul className="flex flex-row space-x-2 overflow-x-auto py-2 px-1 justify-center items-center relative">
          {sections.map(section => {
            const isActive = currentSection === section.id;
            const isHovered = hoveredSection === section.id;
            const isComplete = isSectionComplete(section.id);
            
            return (
              <li key={section.id} className="relative">
                <button
                  onClick={() => onSectionChange(section.id)}
                  onMouseEnter={() => setHoveredSection(section.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : isComplete 
                        ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="relative">
                    {section.icon}
                    {isComplete && !isActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></span>
                    )}
                  </div>
                </button>
                
                {/* Tooltip that now appears below the icon */}
                {isHovered && (
                  <div 
                    className="fixed z-20 whitespace-nowrap bg-gray-800 text-white rounded py-1 px-2 shadow-lg flex flex-col items-start animate-fadeIn"
                    style={{
                      animationDuration: '150ms',
                      left: 'var(--tooltip-left, auto)',
                      top: 'var(--tooltip-top, auto)',
                    }}
                    ref={(el) => {
                      if (el) {
                        // Calculate position relative to the button
                        const button = el.parentElement?.querySelector('button');
                        if (button) {
                          const rect = button.getBoundingClientRect();
                          // Center the tooltip below the button
                          el.style.setProperty('--tooltip-left', `${rect.left + rect.width/2 - el.offsetWidth/2}px`);
                          el.style.setProperty('--tooltip-top', `${rect.bottom + 8}px`);
                        }
                      }
                    }}
                  >
                    <span className="font-medium text-sm">{section.title}</span>
                    <span className="text-xs text-gray-300">{section.description}</span>
                    
                    {/* Triangle pointer now points up instead of left */}
                    <div className="absolute left-1/2 top-0 -translate-y-1 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                  </div>
                )}
              </li>
            )
          })}
          
          {/* Help button moved to right side of top navigation */}
          <li className="absolute right-2">
            <button
              className="text-blue-700 hover:text-blue-900 rounded-full p-1 bg-blue-50"
              onMouseEnter={() => setHoveredSection('help')}
              onMouseLeave={() => setHoveredSection(null)}
              title="Help"
            >
              <Info className="h-4 w-4" />
            </button>
            
            {hoveredSection === 'help' && (
              <div className="fixed z-20 whitespace-nowrap bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg animate-fadeIn"
                style={{
                  animationDuration: '150ms',
                  left: 'var(--tooltip-left, auto)',
                  top: 'var(--tooltip-top, auto)'
                }}
                ref={(el) => {
                  if (el) {
                    // Calculate position relative to the help button
                    const button = el.parentElement?.querySelector('button');
                    if (button) {
                      const rect = button.getBoundingClientRect();
                      el.style.setProperty('--tooltip-left', `${rect.left - 150}px`);
                      el.style.setProperty('--tooltip-top', `${rect.bottom + 8}px`);
                    }
                  }
                }}
              >
                Complete all sections to finalize your business plan.
                {/* Triangle pointer */}
                <div className="absolute top-0 right-4 -translate-y-1 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
              </div>
            )}
          </li>
        </ul>
      </nav>
    </div>
  )
} 