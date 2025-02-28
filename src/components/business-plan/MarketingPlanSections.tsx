import React from 'react';

/**
 * List of available marketing plan sections
 */
export type MarketingPlanSectionType = 
  | 'positioning' 
  | 'pricing' 
  | 'promotional' 
  | 'sales';

/**
 * Props for the MarketingPlanSections component
 */
interface MarketingPlanSectionsProps {
  activeSection: MarketingPlanSectionType;
  onSectionChange: (section: MarketingPlanSectionType) => void;
}

/**
 * MarketingPlanSections component
 * 
 * Provides navigation between different sections of the marketing plan
 */
export default function MarketingPlanSections({ 
  activeSection, 
  onSectionChange 
}: MarketingPlanSectionsProps) {
  
  /**
   * Marketing plan section configuration with labels and descriptions
   */
  const sections = [
    {
      id: 'positioning' as MarketingPlanSectionType,
      label: 'Market Positioning',
      description: 'Define your target audience and how your business stands out from competitors'
    },
    {
      id: 'pricing' as MarketingPlanSectionType,
      label: 'Pricing Strategy',
      description: 'Outline your pricing approach and how it aligns with your business goals'
    },
    {
      id: 'promotional' as MarketingPlanSectionType,
      label: 'Promotional Activities',
      description: 'Detail your advertising, PR, social media, and other promotional efforts'
    },
    {
      id: 'sales' as MarketingPlanSectionType,
      label: 'Sales Strategy',
      description: 'Define your sales process, channels, and conversion metrics'
    }
  ];

  return (
    <div className="mb-6">
      <nav className="flex flex-col space-y-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={`text-left px-4 py-3 rounded-md transition-colors ${
              activeSection === section.id
                ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-600'
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="font-medium">{section.label}</div>
            <div className="text-sm text-gray-600 mt-1">{section.description}</div>
          </button>
        ))}
      </nav>
    </div>
  );
} 