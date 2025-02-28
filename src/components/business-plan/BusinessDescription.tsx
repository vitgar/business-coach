import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import CompanyOverviewQuestionnaire from './CompanyOverviewQuestionnaire';
import LegalStructureQuestionnaire from './LegalStructureQuestionnaire';
import LocationFacilitiesQuestionnaire from './LocationFacilitiesQuestionnaire';
import MissionStatementQuestionnaire from './MissionStatementQuestionnaire';
import ReactMarkdown from 'react-markdown';

/**
 * Section interface for business description sections
 */
interface Section {
  id: string;
  title: string;
  description: string;
}

/**
 * Sections data for business description
 */
const sections: Section[] = [
  {
    id: 'companyOverview',
    title: 'Company Overview',
    description: 'Provide a clear description of your business, its history, and current status.',
  },
  {
    id: 'legalStructure',
    title: 'Legal Structure',
    description: 'Define the legal structure of your business and explain why you chose it.',
  },
  {
    id: 'locationFacilities',
    title: 'Location & Facilities',
    description: 'Describe your business location, facilities, and why they are suitable for your operations.',
  },
  {
    id: 'missionStatement',
    title: 'Mission Statement',
    description: 'Articulate your business mission, vision, and core values.',
  },
];

/**
 * Props for the BusinessDescription component
 */
interface BusinessDescriptionProps {
  businessPlanId: string;
  isEditing?: boolean;
  onSave?: (section: string, content: string) => Promise<void>;
}

/**
 * BusinessDescription component
 * 
 * Displays and allows editing of the business description section of the business plan
 * with collapsible sections and improved UI/UX
 */
export default function BusinessDescription({ 
  businessPlanId, 
  isEditing = false,
  onSave
}: BusinessDescriptionProps) {
  // Track which section is expanded
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Section content states
  const [companyOverview, setCompanyOverview] = useState('');
  const [legalStructure, setLegalStructure] = useState('');
  const [locationFacilities, setLocationFacilities] = useState('');
  const [missionStatement, setMissionStatement] = useState('');
  
  // Loading state
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing business description data if available
  useEffect(() => {
    const fetchBusinessDescriptionData = async () => {
      try {
        const response = await fetch(`/api/business-plans/${businessPlanId}`);
        if (!response.ok) throw new Error('Failed to fetch business plan');
        
        const data = await response.json();
        console.log('Fetched business plan data:', data);
        
        // Check for business description data in the response
        if (data.content?.businessDescription) {
          // Parse the content if needed
          // For now, we'll just log it
          console.log('Found existing business description data:', data.content.businessDescription);
          
          // You would parse the content and set individual section states here
          // This is a placeholder for future implementation
        }
      } catch (error) {
        console.error('Error fetching business description data:', error);
      }
    };
    
    fetchBusinessDescriptionData();
  }, [businessPlanId]);

  // Auto-expand the first section with content
  useEffect(() => {
    if (companyOverview && expandedSection === null) {
      setExpandedSection('companyOverview');
    } else if (!companyOverview && legalStructure && expandedSection === null) {
      setExpandedSection('legalStructure');
    } else if (!companyOverview && !legalStructure && locationFacilities && expandedSection === null) {
      setExpandedSection('locationFacilities');
    } else if (!companyOverview && !legalStructure && !locationFacilities && missionStatement && expandedSection === null) {
      setExpandedSection('missionStatement');
    } else if (expandedSection === null) {
      // If no content exists, default to opening the first section
      setExpandedSection('companyOverview');
    }
  }, [companyOverview, legalStructure, locationFacilities, missionStatement, expandedSection]);

  /**
   * Handle completion of the company overview questionnaire
   */
  const handleCompanyOverviewComplete = (overviewText: string) => {
    setCompanyOverview(overviewText);
    if (onSave) {
      onSave('companyOverview', overviewText);
    }
  };

  /**
   * Handle completion of the legal structure questionnaire
   */
  const handleLegalStructureComplete = (legalStructureText: string) => {
    setLegalStructure(legalStructureText);
    if (onSave) {
      onSave('legalStructure', legalStructureText);
    }
  };

  /**
   * Handle completion of the location & facilities questionnaire
   */
  const handleLocationFacilitiesComplete = (locationText: string) => {
    setLocationFacilities(locationText);
    if (onSave) {
      onSave('locationFacilities', locationText);
    }
  };

  /**
   * Handle completion of the mission statement questionnaire
   */
  const handleMissionStatementComplete = (missionText: string) => {
    setMissionStatement(missionText);
    if (onSave) {
      onSave('missionStatement', missionText);
    }
  };

  /**
   * Handle saving all business description data
   */
  const handleSaveAll = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        // Format all business description data into a single string
        const fullDescription = `
# Company Overview
${companyOverview}

# Legal Structure
${legalStructure}

# Location & Facilities
${locationFacilities}

# Mission Statement
${missionStatement}
        `.trim();
        
        await onSave('businessDescription', fullDescription);
      } catch (error) {
        console.error('Error saving business description:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  /**
   * Toggle section expansion with proper event handling
   */
  const toggleSection = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-blue-500 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Business Description</h2>
        <p className="mt-2 text-gray-600">
          This section provides a detailed overview of your business, including its history, 
          legal structure, location, and overall mission and vision.
        </p>
      </div>

      {/* Main content area with collapsible sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="border rounded-lg shadow-sm bg-white overflow-hidden">
            <button
              onClick={(e) => toggleSection(e, section.id)}
              className="w-full px-6 py-4 flex items-center justify-between text-left bg-gradient-to-r from-gray-50 to-white border-b transition-colors hover:bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
              {expandedSection === section.id ? (
                <ChevronDown className="h-5 w-5 text-blue-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSection === section.id && (
              <div className="px-6 py-5 bg-white">
                {section.id === 'companyOverview' && (
                  <CompanyOverviewQuestionnaire
                    businessPlanId={businessPlanId}
                    onComplete={handleCompanyOverviewComplete}
                  />
                )}
                
                {section.id === 'legalStructure' && (
                  <LegalStructureQuestionnaire
                    businessPlanId={businessPlanId}
                    onComplete={handleLegalStructureComplete}
                  />
                )}
                
                {section.id === 'locationFacilities' && (
                  <LocationFacilitiesQuestionnaire
                    businessPlanId={businessPlanId}
                    onComplete={handleLocationFacilitiesComplete}
                  />
                )}
                
                {section.id === 'missionStatement' && (
                  <MissionStatementQuestionnaire
                    businessPlanId={businessPlanId}
                    onComplete={handleMissionStatementComplete}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save All Button */}
      {isEditing && (
        <div className="mt-8 flex justify-end">
          <button 
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Saving...</span>
              </>
            ) : (
              'Save All Sections'
            )}
          </button>
        </div>
      )}
    </div>
  );
} 