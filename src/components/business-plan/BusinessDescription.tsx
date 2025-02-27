import React, { useState, useEffect } from 'react';
import CompanyOverviewQuestionnaire from './CompanyOverviewQuestionnaire';
import LegalStructureQuestionnaire from './LegalStructureQuestionnaire';
import LocationFacilitiesQuestionnaire from './LocationFacilitiesQuestionnaire';
import MissionStatementQuestionnaire from './MissionStatementQuestionnaire';

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
 */
export default function BusinessDescription({ 
  businessPlanId, 
  isEditing = false,
  onSave
}: BusinessDescriptionProps) {
  // Company overview content
  const [companyOverview, setCompanyOverview] = useState('');
  
  // Other sections state
  const [legalStructure, setLegalStructure] = useState('');
  const [locationFacilities, setLocationFacilities] = useState('');
  const [missionStatement, setMissionStatement] = useState('');

  // Fetch existing business description data if available
  useEffect(() => {
    // This would fetch data from the API in a future implementation
    // For now, we'll just use the state variables
  }, [businessPlanId]);

  /**
   * Handle completion of the company overview questionnaire
   */
  const handleCompanyOverviewComplete = (overviewText: string) => {
    setCompanyOverview(overviewText);
  };

  /**
   * Handle completion of the legal structure questionnaire
   */
  const handleLegalStructureComplete = (legalStructureText: string) => {
    setLegalStructure(legalStructureText);
  };

  /**
   * Handle completion of the location & facilities questionnaire
   */
  const handleLocationFacilitiesComplete = (locationText: string) => {
    setLocationFacilities(locationText);
  };

  /**
   * Handle completion of the mission statement questionnaire
   */
  const handleMissionStatementComplete = (missionText: string) => {
    setMissionStatement(missionText);
  };

  /**
   * Handle saving all business description data
   */
  const handleSaveAll = async () => {
    if (onSave) {
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
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Business Description</h2>
      
      <div className="prose max-w-none">
        <p className="text-gray-600 mb-4">
          This section provides a detailed overview of your business, including its history, 
          legal structure, location, and overall mission and vision.
        </p>
        
        {isEditing ? (
          <div className="space-y-6">
            {/* Company Overview Section with Chat Interface */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Company Overview
              </label>
              
              {/* CompanyOverviewQuestionnaire is now always shown directly */}
              <CompanyOverviewQuestionnaire 
                businessPlanId={businessPlanId}
                onComplete={handleCompanyOverviewComplete}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Legal Structure
              </label>
              
              {/* Replacing dropdown with LegalStructureQuestionnaire */}
              <LegalStructureQuestionnaire
                businessPlanId={businessPlanId}
                onComplete={handleLegalStructureComplete}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Location & Facilities
              </label>
              
              {/* Replacing textarea with LocationFacilitiesQuestionnaire */}
              <LocationFacilitiesQuestionnaire
                businessPlanId={businessPlanId}
                onComplete={handleLocationFacilitiesComplete}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Mission Statement
              </label>
              
              {/* Replacing textarea with MissionStatementQuestionnaire */}
              <MissionStatementQuestionnaire
                businessPlanId={businessPlanId}
                onComplete={handleMissionStatementComplete}
              />
            </div>
            
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={handleSaveAll}
            >
              Save Business Description
            </button>
          </div>
        ) : (
          <div>
            {companyOverview ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Overview</h3>
                <div className="whitespace-pre-wrap">{companyOverview}</div>
                
                {legalStructure && (
                  <>
                    <h3 className="text-lg font-semibold mt-6">Legal Structure</h3>
                    <div className="whitespace-pre-wrap">{legalStructure}</div>
                  </>
                )}
                
                {locationFacilities && (
                  <>
                    <h3 className="text-lg font-semibold mt-6">Location & Facilities</h3>
                    <div className="whitespace-pre-wrap">{locationFacilities}</div>
                  </>
                )}
                
                {missionStatement && (
                  <>
                    <h3 className="text-lg font-semibold mt-6">Mission Statement</h3>
                    <div className="whitespace-pre-wrap">{missionStatement}</div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                This section will display your saved business description information.
                Switch to Edit mode to add or update your business description.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 