import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
  GenericQuestionnaire, 
  createQuestionnaireProps 
} from '../generic';
import LoadingIndicator from './LoadingIndicator';

/**
 * Section interface for operations sections
 */
interface Section {
  id: string;
  title: string;
  description: string;
}

/**
 * Sections data for operations
 */
const sections: Section[] = [
  {
    id: 'production',
    title: 'Production Process',
    description: 'Define how your products are manufactured or how your services are delivered.'
  },
  {
    id: 'qualityControl',
    title: 'Quality Control',
    description: 'Outline your approach to ensuring consistent quality in your products or services.'
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    description: 'Describe your approach to managing inventory, supplies, and materials.'
  },
  {
    id: 'kpis',
    title: 'Key Performance Indicators',
    description: 'Define the metrics you will track to measure business performance.'
  },
  {
    id: 'technology',
    title: 'Technology & Systems',
    description: 'Outline the technology and systems you will use to run your business.'
  }
];

/**
 * Props for the OperationsGeneric component
 */
interface OperationsGenericProps {
  businessPlanId: string;
  isEditing?: boolean;
  onSave?: (section: string, content: string) => Promise<void>;
}

/**
 * Interface for operations data
 */
interface OperationsData {
  production?: string;
  qualityControl?: string;
  inventory?: string;
  kpis?: string;
  technology?: string;
}

/**
 * OperationsGeneric component
 * 
 * A version of the Operations component that uses the generic questionnaire system
 * All questionnaire functionality is now handled by the GenericQuestionnaire component
 */
export default function OperationsGeneric({ 
  businessPlanId, 
  isEditing = false,
  onSave 
}: OperationsGenericProps) {
  // State management
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [operationsData, setOperationsData] = useState<OperationsData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch data when component mounts or businessPlanId changes
  useEffect(() => {
    if (businessPlanId) {
      fetchOperationsData();
    }
  }, [businessPlanId]);

  /**
   * Fetch operations data from API
   */
  const fetchOperationsData = async () => {
    setIsLoading(true);
    try {
      // Fetch operations data
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations`);
      if (!response.ok) {
        throw new Error('Failed to fetch operations data');
      }
      
      const data = await response.json();
      const operations = data.operations || {};
      
      // Set operations data
      setOperationsData({
        production: operations.production || '',
        qualityControl: operations.qualityControl || '',
        inventory: operations.inventory || '',
        kpis: operations.kpis || '',
        technology: operations.technology || ''
      });
      
      // Auto-expand first section with content or first section if none have content
      const sectionWithContent = sections.find(section => operations[section.id]);
      if (sectionWithContent) {
        setExpandedSection(sectionWithContent.id);
      } else if (isEditing) {
        setExpandedSection(sections[0].id);
      }
    } catch (error) {
      console.error('Error fetching operations data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle section expansion
   */
  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  /**
   * Handle completion of each section
   */
  const handleSectionComplete = (sectionId: string, formattedText: string) => {
    // Update local state
    setOperationsData(prev => ({
      ...prev,
      [sectionId]: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave(sectionId, formattedText);
    }
  };

  /**
   * Handle saving a section
   */
  const handleSave = async (sectionId: string, content: string) => {
    if (!onSave) return;
    
    try {
      setIsSaving(true);
      await onSave(sectionId, content);
    } catch (error) {
      console.error(`Error saving ${sectionId}:`, error);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading indicator while data is being fetched
  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Operating & Control Systems</h2>
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Operating & Control Systems</h2>
      <p className="mb-6 text-gray-600">
        Define how your business will operate on a day-to-day basis, including production processes, 
        quality control measures, inventory management, key performance indicators, and technology systems.
      </p>
      
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="border rounded-lg shadow-sm bg-white overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
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
                {isEditing ? (
                  // Editing mode - show questionnaires using GenericQuestionnaire
                  <GenericQuestionnaire
                    {...createQuestionnaireProps(
                      section.id, 
                      businessPlanId, 
                      (formattedText) => handleSectionComplete(section.id, formattedText)
                    )}
                  />
                ) : (
                  // View mode - display content
                  <div className="prose max-w-none">
                    {operationsData[section.id as keyof OperationsData] ? (
                      <ReactMarkdown>{operationsData[section.id as keyof OperationsData] || ''}</ReactMarkdown>
                    ) : (
                      <p className="text-gray-500 italic">
                        {section.title} information will be displayed here.
                        Switch to Edit mode to add or update this section.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 