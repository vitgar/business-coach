import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Edit2 } from 'lucide-react';
import type { ExecutiveSummaryData, BusinessPlanSection } from '@/types/business-plan';
import { 
  GenericQuestionnaire, 
  createQuestionnaireProps 
} from '../generic';
import ReactMarkdown from 'react-markdown';

/**
 * Section interface for executive summary sections
 */
interface Section {
  id: BusinessPlanSection;
  title: string;
  description: string;
  prompts: string[];
}

/**
 * Sections data for executive summary
 */
const sections: Section[] = [
  {
    id: 'visionAndGoals',
    title: 'Vision and Business Goals',
    description: 'Define the long-term vision and specific goals for one, three, and five years.',
    prompts: [
      'What is the long-term vision of your business?',
      'What are your one-year goals? Can you quantify them?',
      'What are your three-year goals? How will you measure success?',
      'What are your five-year goals? What metrics will you use?',
      'How do these goals align with your overall business strategy?'
    ]
  },
  {
    id: 'productsOrServices',
    title: 'Products/Services Offered',
    description: 'Provide a clear description of your offerings and how they are differentiated from competitors.',
    prompts: [
      'What products or services will your business offer?',
      'How are your offerings different from competitors?',
      'What unique value do your products/services provide to customers?',
      'What is your competitive advantage?',
      'How will you maintain this advantage over time?'
    ]
  },
  {
    id: 'targetMarket',
    title: 'Markets/Customers Served',
    description: 'Identify your target market and customer segments, including their size and demographics.',
    prompts: [
      'Who are your target customers?',
      'What market segments will you serve?',
      'What is the size of your target market?',
      'What are the key demographics of your customers?',
      'How will you reach these customer segments?'
    ]
  },
  {
    id: 'distributionStrategy',
    title: 'Distribution Strategy',
    description: 'Explain how your products or services will reach customers, highlighting any unique methods.',
    prompts: [
      'How will your products/services reach customers?',
      'What distribution channels will you use?',
      'Are there any unique or innovative distribution methods?',
      'How will you manage the distribution process?',
      'What are the costs associated with your distribution strategy?'
    ]
  }
];

/**
 * Props for the ExecutiveSummaryGeneric component
 */
interface Props {
  data?: ExecutiveSummaryData;
  onSave: (sectionId: BusinessPlanSection, content: string) => Promise<void>;
  isEditing?: boolean;
  businessPlanId: string;
  planTitle?: string;
  onTitleSave?: (title: string) => Promise<void>;
}

/**
 * ExecutiveSummaryGeneric component
 * 
 * A version of the ExecutiveSummary component that uses our generic questionnaire
 * All questionnaire functionality is now handled by the GenericQuestionnaire component
 */
export default function ExecutiveSummaryGeneric({ 
  data, 
  onSave, 
  isEditing = false, 
  businessPlanId,
  planTitle = '',
  onTitleSave 
}: Props) {
  // State management
  const [expandedSection, setExpandedSection] = useState<BusinessPlanSection | null>(null);
  const [content, setContent] = useState<Partial<ExecutiveSummaryData>>(data || {});
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(planTitle || '');
  const [isEditingTitle, setIsEditingTitle] = useState(!planTitle);
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // Update content when data prop changes
  useEffect(() => {
    if (data) {
      console.log('ExecutiveSummary received new data:', data);
      setContent(data);
    }
  }, [data]);

  // Update title when planTitle prop changes
  useEffect(() => {
    if (planTitle) {
      setTitle(planTitle);
    }
  }, [planTitle]);

  // Auto-expand the Vision and Goals section if it has content
  useEffect(() => {
    if (content.visionAndGoals && expandedSection === null) {
      console.log('Auto-expanding Vision and Goals section because it has content');
      setExpandedSection('visionAndGoals');
    }
  }, [content.visionAndGoals, expandedSection]);

  // Auto-expand the Products/Services section if it has content
  useEffect(() => {
    if (content.productsOrServices && expandedSection === null && !content.visionAndGoals) {
      console.log('Auto-expanding Products/Services section because it has content');
      setExpandedSection('productsOrServices');
    }
  }, [content.productsOrServices, expandedSection, content.visionAndGoals]);

  // Auto-expand the Markets/Customers section if it has content
  useEffect(() => {
    if (content.targetMarket && expandedSection === null && !content.visionAndGoals && !content.productsOrServices) {
      console.log('Auto-expanding Markets/Customers section because it has content');
      setExpandedSection('targetMarket');
    }
  }, [content.targetMarket, expandedSection, content.visionAndGoals, content.productsOrServices]);

  // Auto-expand the Distribution Strategy section if it has content
  useEffect(() => {
    if (content.distributionStrategy && expandedSection === null && 
        !content.visionAndGoals && !content.productsOrServices && !content.targetMarket) {
      console.log('Auto-expanding Distribution Strategy section because it has content');
      setExpandedSection('distributionStrategy');
    }
  }, [content.distributionStrategy, expandedSection, content.visionAndGoals, content.productsOrServices, content.targetMarket]);

  // Generate a title based on vision data if none is provided
  useEffect(() => {
    if (!title && content.visionAndGoals) {
      // Extract business type from vision data if possible
      const visionText = content.visionAndGoals;
      let generatedTitle = 'Business Plan';
      
      // Try to extract business type from vision text
      if (visionText.includes('tax preparation')) {
        generatedTitle = 'Tax Preparation Business Plan';
      } else if (visionText.toLowerCase().includes('restaurant')) {
        generatedTitle = 'Restaurant Business Plan';
      } else if (visionText.toLowerCase().includes('consulting')) {
        generatedTitle = 'Consulting Business Plan';
      } else if (visionText.toLowerCase().includes('retail')) {
        generatedTitle = 'Retail Business Plan';
      } else if (visionText.toLowerCase().includes('tech')) {
        generatedTitle = 'Technology Business Plan';
      } else if (visionText.toLowerCase().includes('software')) {
        generatedTitle = 'Software Business Plan';
      } else if (visionText.toLowerCase().includes('service')) {
        generatedTitle = 'Service Business Plan';
      }
      
      setTitle(generatedTitle);
    }
  }, [title, content.visionAndGoals]);

  /**
   * Handle saving a section
   */
  const handleSave = async (sectionId: BusinessPlanSection) => {
    try {
      setIsSaving(true);
      console.log(`Saving section ${sectionId}:`, content[sectionId]);
      await onSave(sectionId, content[sectionId] || '');
    } catch (error) {
      console.error('Error saving section:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle saving the business plan title
   */
  const handleTitleSave = async () => {
    if (!onTitleSave) return;
    
    try {
      setIsSavingTitle(true);
      await onTitleSave(title);
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error saving title:', error);
    } finally {
      setIsSavingTitle(false);
    }
  };

  /**
   * Handle completion of a questionnaire
   */
  const handleQuestionnaireComplete = (sectionId: BusinessPlanSection, formattedText: string) => {
    // Update local content state
    setContent(prev => ({
      ...prev,
      [sectionId]: formattedText
    }));
    
    // Call onSave to persist the data
    handleSave(sectionId);
  };

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="mb-6">
        {isEditingTitle ? (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="planTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Business Plan Title
              </label>
              <input
                type="text"
                id="planTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter business plan title..."
              />
            </div>
            <button
              onClick={handleTitleSave}
              disabled={isSavingTitle}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSavingTitle ? 'Saving...' : 'Save Title'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-medium text-gray-800">{title}</h1>
            {isEditing && (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Header section */}
      <div className="border-b-2 border-blue-500 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Executive Summary</h2>
        <p className="mt-2 text-gray-600">
          This is the most important section as it provides a snapshot of your business and captures the reader's attention.
          It should be written last, after completing the other sections.
        </p>
      </div>

      {/* Main content area */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="border rounded-lg shadow-sm bg-white overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
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
                {isEditing ? (
                  // Editing mode - show questionnaires using GenericQuestionnaire
                  <GenericQuestionnaire
                    {...createQuestionnaireProps(
                      section.id, 
                      businessPlanId, 
                      (formattedText) => handleQuestionnaireComplete(section.id, formattedText)
                    )}
                    prompts={section.prompts}
                  />
                ) : (
                  // View mode - display content
                  <div className="prose max-w-none">
                    {content[section.id] ? (
                      <ReactMarkdown>{content[section.id] || ''}</ReactMarkdown>
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