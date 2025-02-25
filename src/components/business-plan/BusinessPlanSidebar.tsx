import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Business plan section types
 */
export type BusinessPlanSectionType = 
  | 'executive-summary'
  | 'business-description'
  | 'marketing-plan'
  | 'operations'
  | 'financial-plan';

/**
 * Props for the BusinessPlanSidebar component
 */
interface BusinessPlanSidebarProps {
  /**
   * Currently active section
   */
  activeSection: BusinessPlanSectionType;
  
  /**
   * Function to handle section change
   */
  onSectionChange: (section: BusinessPlanSectionType) => void;
}

/**
 * Section configuration with display names and identifiers
 */
const SECTIONS: Array<{ id: BusinessPlanSectionType; name: string }> = [
  { id: 'executive-summary', name: 'Executive Summary' },
  { id: 'business-description', name: 'Business Description' },
  { id: 'marketing-plan', name: 'Marketing Plan' },
  { id: 'operations', name: 'Operating & Control Systems' },
  { id: 'financial-plan', name: 'Financial Plan' },
];

/**
 * BusinessPlanSidebar component
 * 
 * Provides navigation between different sections of the business plan
 */
export default function BusinessPlanSidebar({ 
  activeSection, 
  onSectionChange 
}: BusinessPlanSidebarProps) {
  return (
    <div className="w-64 bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
      <div className="p-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <h2 className="font-semibold text-lg">Business Plan Sections</h2>
      </div>
      
      <nav className="py-2">
        <ul>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => onSectionChange(section.id)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between transition-all ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:border-l-4 hover:border-blue-200'
                }`}
              >
                <span>{section.name}</span>
                {activeSection === section.id && (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 bg-gray-50 border-t">
        <p className="text-xs text-gray-500">
          Complete each section to build your comprehensive business plan.
        </p>
      </div>
    </div>
  );
} 