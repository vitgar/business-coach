import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ChevronDown, ChevronRight, Briefcase, Target, Book, Award } from 'lucide-react';
import { 
  GenericQuestionnaire, 
  createQuestionnaireProps
} from '../generic';
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
    id: 'missionStatement',
    title: 'Mission Statement',
    description: 'Define the core purpose and focus of your business',
  },
  {
    id: 'businessModel',
    title: 'Business Model',
    description: 'Explain how your business will create, deliver, and capture value',
  },
  {
    id: 'businessStructure',
    title: 'Business Structure',
    description: 'Outline the legal and organizational structure of your business',
  },
  {
    id: 'industryBackground',
    title: 'Industry Background',
    description: 'Provide context about the industry your business operates in',
  },
];

/**
 * Props for the BusinessDescriptionGeneric component
 */
interface BusinessDescriptionGenericProps {
  businessPlanId: string;
  isEditing?: boolean;
  onSave?: (section: string, content: string) => Promise<void>;
}

/**
 * Interface for business description data
 */
interface BusinessDescriptionData {
  missionStatement?: string;
  businessModel?: string;
  businessStructure?: string;
  industryBackground?: string;
  missionStatementData?: any;
  businessModelData?: any;
  businessStructureData?: any;
  industryBackgroundData?: any;
}

/**
 * BusinessDescriptionGeneric component
 * 
 * Displays and allows editing of the business description section of the business plan
 * Uses the GenericQuestionnaire component for interactive editing with collapsible sections
 */
export default function BusinessDescriptionGeneric({ 
  businessPlanId, 
  isEditing = false,
  onSave
}: BusinessDescriptionGenericProps) {
  // State for business description data
  const [businessDescriptionData, setBusinessDescriptionData] = useState<BusinessDescriptionData>({});
  // State for data loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // State for tracking expanded section
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  // State for saving indicator
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch existing business description data on component mount
  useEffect(() => {
    if (businessPlanId) {
      fetchBusinessDescriptionData();
    }
  }, [businessPlanId]);
  
  // Auto-expand the first section with content
  useEffect(() => {
    if (businessDescriptionData.missionStatement && expandedSection === null) {
      setExpandedSection('missionStatement');
    } else if (!businessDescriptionData.missionStatement && businessDescriptionData.businessModel && expandedSection === null) {
      setExpandedSection('businessModel');
    } else if (!businessDescriptionData.missionStatement && !businessDescriptionData.businessModel && 
               businessDescriptionData.businessStructure && expandedSection === null) {
      setExpandedSection('businessStructure');
    } else if (!businessDescriptionData.missionStatement && !businessDescriptionData.businessModel && 
               !businessDescriptionData.businessStructure && businessDescriptionData.industryBackground && 
               expandedSection === null) {
      setExpandedSection('industryBackground');
    }
  }, [businessDescriptionData, expandedSection]);
  
  /**
   * Fetch business description data from API
   */
  const fetchBusinessDescriptionData = async () => {
    setIsLoading(true);
    try {
      // Fetch business description data from API
      const response = await fetch(`/api/business-plans/${businessPlanId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch business description data');
      }
      
      const data = await response.json();
      
      // Extract business description data
      const content = data.content || {};
      const businessDescription = content.businessDescription || {};
      
      // Set business description data state
      setBusinessDescriptionData({
        missionStatement: businessDescription.missionStatement || '',
        businessModel: businessDescription.businessModel || '',
        businessStructure: businessDescription.businessStructure || '',
        industryBackground: businessDescription.industryBackground || '',
        missionStatementData: businessDescription.missionStatementData || null,
        businessModelData: businessDescription.businessModelData || null,
        businessStructureData: businessDescription.businessStructureData || null,
        industryBackgroundData: businessDescription.industryBackgroundData || null
      });
      
    } catch (error) {
      console.error('Error fetching business description data:', error);
      toast.error('Failed to load business description data');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Toggle section expansion/collapse
   */
  const toggleSection = (sectionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
    }
  };
  
  /**
   * Handle completion of the Mission Statement questionnaire
   */
  const handleMissionStatementComplete = (formattedText: string) => {
    setBusinessDescriptionData(prev => ({
      ...prev,
      missionStatement: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('missionStatement', formattedText);
    }
  };
  
  /**
   * Handle completion of the Business Model questionnaire
   */
  const handleBusinessModelComplete = (formattedText: string) => {
    setBusinessDescriptionData(prev => ({
      ...prev,
      businessModel: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('businessModel', formattedText);
    }
  };
  
  /**
   * Handle completion of the Business Structure questionnaire
   */
  const handleBusinessStructureComplete = (formattedText: string) => {
    setBusinessDescriptionData(prev => ({
      ...prev,
      businessStructure: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('businessStructure', formattedText);
    }
  };
  
  /**
   * Handle completion of the Industry Background questionnaire
   */
  const handleIndustryBackgroundComplete = (formattedText: string) => {
    setBusinessDescriptionData(prev => ({
      ...prev,
      industryBackground: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('industryBackground', formattedText);
    }
  };
  
  /**
   * Handle saving section data
   */
  const handleSave = async (section: string, content: string) => {
    if (!onSave) return;
    
    try {
      setIsSaving(true);
      await onSave(`businessDescription.${section}`, content);
      toast.success(`${section} saved successfully`);
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      toast.error(`Failed to save ${section}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * Handle saving all business description data at once
   */
  const handleSaveAll = async () => {
    if (!onSave) return;
    
    try {
      setIsSaving(true);
      
      // Format all business description data into a single string
      const fullBusinessDescription = `
# Mission Statement
${businessDescriptionData.missionStatement || ''}

# Business Model
${businessDescriptionData.businessModel || ''}

# Business Structure
${businessDescriptionData.businessStructure || ''}

# Industry Background
${businessDescriptionData.industryBackground || ''}
      `.trim();
      
      // Save the complete business description
      await onSave('businessDescription', fullBusinessDescription);
      toast.success('Business description saved successfully');
    } catch (error) {
      console.error('Error saving business description:', error);
      toast.error('Failed to save business description');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Display loading indicator while data is being fetched
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin w-8 h-8 border-t-2 border-blue-500 border-r-2 rounded-full mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading business description data...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      {/* Header section with blue accent */}
      <div className="border-b-2 border-blue-500 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Business Description</h2>
        <p className="mt-2 text-gray-600">
          This section provides an overview of your business, including your mission statement,
          business model, organizational structure, and industry background.
        </p>
      </div>
      
      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="border rounded-lg shadow-sm bg-white overflow-hidden">
            <button
              onClick={(e) => toggleSection(section.id, e)}
              className="w-full px-6 py-4 flex items-center justify-between text-left bg-blue-50 hover:bg-blue-100 border-b transition-colors"
            >
              <div>
                <h3 className="text-lg font-semibold text-blue-800">{section.title}</h3>
                <p className="text-sm text-blue-600">{section.description}</p>
              </div>
              {expandedSection === section.id ? (
                <ChevronDown className="h-5 w-5 text-blue-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-blue-400" />
              )}
            </button>
            
            {expandedSection === section.id && (
              <div className="px-6 py-5 bg-white">
                {section.id === 'missionStatement' && (
                  isEditing ? (
                    <GenericQuestionnaire
                      {...createQuestionnaireProps('missionStatement', businessPlanId, handleMissionStatementComplete)}
                      isEditing={isEditing}
                      initialData={businessDescriptionData.missionStatementData || {}}
                      title="Mission Statement"
                      description="Define the core purpose and focus of your business"
                      previewTitle="Mission Statement Preview"
                      prompts={[
                        "What is the core purpose of your business?",
                        "What problem does your business solve?",
                        "What are the core values that guide your business?",
                        "What impact do you want to make in your industry or community?",
                        "What is your vision for the future of your business?"
                      ]}
                      apiEndpoint="/business-description"
                    />
                  ) : (
                    businessDescriptionData.missionStatement ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {typeof businessDescriptionData.missionStatement === 'string' ? businessDescriptionData.missionStatement : ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Mission Statement information will be displayed here.
                        Switch to Edit mode to add or update this section.
                      </p>
                    )
                  )
                )}
                
                {section.id === 'businessModel' && (
                  isEditing ? (
                    <GenericQuestionnaire
                      {...createQuestionnaireProps('businessModel', businessPlanId, handleBusinessModelComplete)}
                      isEditing={isEditing}
                      initialData={businessDescriptionData.businessModelData || {}}
                      title="Business Model"
                      description="Explain how your business will create, deliver, and capture value"
                      previewTitle="Business Model Preview"
                      prompts={[
                        "How will your business make money?",
                        "What is your revenue model?",
                        "Who are your key partners or suppliers?",
                        "What are your key activities and resources?",
                        "What is your cost structure?"
                      ]}
                      apiEndpoint="/business-description"
                    />
                  ) : (
                    businessDescriptionData.businessModel ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {typeof businessDescriptionData.businessModel === 'string' ? businessDescriptionData.businessModel : ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Business Model information will be displayed here.
                        Switch to Edit mode to add or update this section.
                      </p>
                    )
                  )
                )}
                
                {section.id === 'businessStructure' && (
                  isEditing ? (
                    <GenericQuestionnaire
                      {...createQuestionnaireProps('businessStructure', businessPlanId, handleBusinessStructureComplete)}
                      isEditing={isEditing}
                      initialData={businessDescriptionData.businessStructureData || {}}
                      title="Business Structure"
                      description="Outline the legal and organizational structure of your business"
                      previewTitle="Business Structure Preview"
                      prompts={[
                        "What is the legal structure of your business?",
                        "Who are the key members of your team?",
                        "What is your management structure?",
                        "How is ownership distributed?",
                        "What are the roles and responsibilities within your organization?"
                      ]}
                      apiEndpoint="/business-description"
                    />
                  ) : (
                    businessDescriptionData.businessStructure ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {typeof businessDescriptionData.businessStructure === 'string' ? businessDescriptionData.businessStructure : ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Business Structure information will be displayed here.
                        Switch to Edit mode to add or update this section.
                      </p>
                    )
                  )
                )}
                
                {section.id === 'industryBackground' && (
                  isEditing ? (
                    <GenericQuestionnaire
                      {...createQuestionnaireProps('industryBackground', businessPlanId, handleIndustryBackgroundComplete)}
                      isEditing={isEditing}
                      initialData={businessDescriptionData.industryBackgroundData || {}}
                      title="Industry Background"
                      description="Provide context about the industry your business operates in"
                      previewTitle="Industry Background Preview"
                      prompts={[
                        "What industry does your business operate in?",
                        "What are the current trends in your industry?",
                        "What is the size and growth rate of your industry?",
                        "Who are the key players in your industry?",
                        "What are the regulatory considerations in your industry?"
                      ]}
                      apiEndpoint="/business-description"
                    />
                  ) : (
                    businessDescriptionData.industryBackground ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {typeof businessDescriptionData.industryBackground === 'string' ? businessDescriptionData.industryBackground : ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Industry Background information will be displayed here.
                        Switch to Edit mode to add or update this section.
                      </p>
                    )
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Save Button */}
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