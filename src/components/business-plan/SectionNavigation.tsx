import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BusinessPlanSectionType } from './BusinessPlanSidebar';

/**
 * Props for the SectionNavigation component
 */
interface SectionNavigationProps {
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
 * This should match the configuration in BusinessPlanSidebar
 */
const SECTIONS: Array<{ id: BusinessPlanSectionType; name: string }> = [
  { id: 'executive-summary', name: 'Executive Summary' },
  { id: 'business-description', name: 'Business Description' },
  { id: 'marketing-plan', name: 'Marketing Plan' },
  { id: 'operations', name: 'Operating & Control Systems' },
  { id: 'financial-plan', name: 'Financial Plan' },
];

/**
 * SectionNavigation component
 * 
 * Provides Previous and Next buttons for navigating between business plan sections
 */
export default function SectionNavigation({ 
  activeSection, 
  onSectionChange 
}: SectionNavigationProps) {
  // Find the current section index
  const currentIndex = SECTIONS.findIndex(section => section.id === activeSection);
  
  // Determine if we have previous or next sections
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < SECTIONS.length - 1;
  
  // Get the previous and next section IDs if they exist
  const previousSection = hasPrevious ? SECTIONS[currentIndex - 1].id : null;
  const nextSection = hasNext ? SECTIONS[currentIndex + 1].id : null;
  
  // Handle navigation to previous section
  const handlePrevious = () => {
    if (previousSection) {
      onSectionChange(previousSection);
    }
  };
  
  // Handle navigation to next section
  const handleNext = () => {
    if (nextSection) {
      onSectionChange(nextSection);
    }
  };
  
  return (
    <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
      <button
        onClick={handlePrevious}
        disabled={!hasPrevious}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          hasPrevious
            ? 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
        <span>Previous: {hasPrevious ? SECTIONS[currentIndex - 1].name : ''}</span>
      </button>
      
      <button
        onClick={handleNext}
        disabled={!hasNext}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
          hasNext
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <span>Next: {hasNext ? SECTIONS[currentIndex + 1].name : ''}</span>
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
} 