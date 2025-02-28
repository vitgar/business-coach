import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ChevronDown, ChevronRight, Target, Users, BarChart2, Award } from 'lucide-react';
import { 
  GenericQuestionnaire, 
  createQuestionnaireProps,
  MarketPositioningData,
  PricingStrategyData,
  PromotionalActivitiesData,
  SalesStrategyData
} from '../generic';
import ReactMarkdown from 'react-markdown';

/**
 * Section interface for marketing plan sections
 */
interface Section {
  id: string;
  title: string;
  description: string;
}

/**
 * Sections data for marketing plan
 */
const sections: Section[] = [
  {
    id: 'positioning',
    title: 'Market Positioning',
    description: 'Define your target audience and how your business stands out from competitors',
  },
  {
    id: 'pricing',
    title: 'Pricing Strategy',
    description: 'Outline your pricing approach and how it aligns with your business goals',
  },
  {
    id: 'promotional',
    title: 'Promotional Activities',
    description: 'Detail your advertising, PR, social media, and other promotional efforts',
  },
  {
    id: 'sales',
    title: 'Sales Strategy',
    description: 'Define your sales process, channels, and conversion metrics',
  },
];

/**
 * Props for the MarketingPlanGeneric component
 */
interface MarketingPlanGenericProps {
  businessPlanId: string;
  isEditing?: boolean;
  onSave?: (section: string, content: string) => Promise<void>;
}

/**
 * Interface for marketing plan data
 */
interface MarketingPlanData {
  positioning?: string;
  pricing?: string;
  promotional?: string;
  sales?: string;
  positioningData?: MarketPositioningData | null;
  pricingData?: PricingStrategyData | null;
}

/**
 * Props for the MarketPositioningPreview component
 */
interface MarketPositioningPreviewProps {
  content?: string; 
  positioningData?: MarketPositioningData | null;
}

/**
 * MarketPositioningPreview component for displaying positioning data in a visually appealing way
 * 
 * @param content - The positioning content as a markdown string
 * @param positioningData - Optional structured positioning data
 * @returns A structured preview of the positioning data
 */
function MarketPositioningPreview({ content, positioningData }: MarketPositioningPreviewProps) {
  // Parse out structured data if possible
  const [parsedData, setParsedData] = useState<MarketPositioningData | null>(null);
  
  // Try to extract structured data from the markdown content
  useEffect(() => {
    if (positioningData) {
      setParsedData(positioningData);
      return;
    }
    
    if (!content) return;
    
    try {
      // Simple parsing to extract key elements from the markdown
      // This is a basic implementation - a more robust parser could be developed
      const targetAudience = content.match(/target audience[:\s]+(.*?)(?=\n\n|\n#|\n\*\*|$)/i)?.[1]?.trim();
      const uniqueValue = content.match(/unique value proposition[:\s]+(.*?)(?=\n\n|\n#|\n\*\*|$)/i)?.[1]?.trim();
      const competitiveAnalysis = content.match(/competitive analysis[:\s]+(.*?)(?=\n\n|\n#|\n\*\*|$)/i)?.[1]?.trim();
      
      // Extract segments from lists
      const segmentRegex = /customer segments[:\s]+(?:\n\s*[-*]\s*(.*?))+/i;
      const segmentMatch = content.match(segmentRegex);
      const segments: string[] = [];
      
      if (segmentMatch) {
        const segmentSection = segmentMatch[0];
        const segmentItems = segmentSection.match(/[-*]\s*(.*?)(?=\n[-*]|\n\n|$)/g);
        if (segmentItems) {
          segmentItems.forEach(item => {
            const cleanItem = item.replace(/[-*]\s*/, '').trim();
            if (cleanItem) segments.push(cleanItem);
          });
        }
      }
      
      // Extract differentiators from lists
      const diffRegex = /market differentiators[:\s]+(?:\n\s*[-*]\s*(.*?))+/i;
      const diffMatch = content.match(diffRegex);
      const differentiators: string[] = [];
      
      if (diffMatch) {
        const diffSection = diffMatch[0];
        const diffItems = diffSection.match(/[-*]\s*(.*?)(?=\n[-*]|\n\n|$)/g);
        if (diffItems) {
          diffItems.forEach(item => {
            const cleanItem = item.replace(/[-*]\s*/, '').trim();
            if (cleanItem) differentiators.push(cleanItem);
          });
        }
      }
      
      setParsedData({
        targetAudience: targetAudience || '',
        customerSegments: segments,
        competitiveAnalysis: competitiveAnalysis || '',
        uniqueValueProposition: uniqueValue || '',
        marketDifferentiators: differentiators
      });
      
    } catch (error) {
      console.error('Error parsing positioning data:', error);
      // Fall back to just displaying the raw content
      setParsedData(null);
    }
  }, [content, positioningData]);
  
  // If parsing failed or no content, just display the raw markdown
  if (!parsedData && !content) {
    return (
      <p className="text-gray-500 italic">
        Market Positioning information will be displayed here.
        Switch to Edit mode to add or update this section.
      </p>
    );
  }

  // If parsing failed but we have content, fall back to displaying raw markdown
  if (!parsedData && content) {
    return (
      <div className="prose max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }
  
  // Render the structured preview with the parsed data
  return (
    <div className="space-y-6">
      {/* Target Audience Section */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-center gap-3 mb-2">
          <Target className="h-5 w-5 text-blue-600" />
          <h3 className="text-md font-medium text-blue-800">Target Audience</h3>
        </div>
        <p className="text-gray-700">
          {parsedData?.targetAudience || 'No target audience defined'}
        </p>
      </div>
      
      {/* Customer Segments */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-5 w-5 text-green-600" />
          <h3 className="text-md font-medium text-green-800">Customer Segments</h3>
        </div>
        {parsedData?.customerSegments && parsedData.customerSegments.length > 0 ? (
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            {parsedData.customerSegments.map((segment, index) => (
              <li key={index}>{segment}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700">No customer segments defined</p>
        )}
      </div>
      
      {/* Unique Value Proposition */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
        <div className="flex items-center gap-3 mb-2">
          <Award className="h-5 w-5 text-purple-600" />
          <h3 className="text-md font-medium text-purple-800">Unique Value Proposition</h3>
        </div>
        <p className="text-gray-700">
          {parsedData?.uniqueValueProposition || 'No unique value proposition defined'}
        </p>
      </div>
      
      {/* Competitive Analysis */}
      {parsedData?.competitiveAnalysis && (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <div className="flex items-center gap-3 mb-2">
            <BarChart2 className="h-5 w-5 text-amber-600" />
            <h3 className="text-md font-medium text-amber-800">Competitive Analysis</h3>
          </div>
          <p className="text-gray-700">{parsedData.competitiveAnalysis}</p>
        </div>
      )}
      
      {/* Market Differentiators */}
      {parsedData?.marketDifferentiators && parsedData.marketDifferentiators.length > 0 && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-5 w-5 text-red-600" />
            <h3 className="text-md font-medium text-red-800">Market Differentiators</h3>
          </div>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            {parsedData.marketDifferentiators.map((diff, index) => (
              <li key={index}>{diff}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * MarketingPlanGeneric component
 * 
 * Displays and allows editing of the marketing plan section of the business plan
 * Uses the GenericQuestionnaire component for interactive editing with collapsible sections
 */
export default function MarketingPlanGeneric({ 
  businessPlanId, 
  isEditing = false,
  onSave
}: MarketingPlanGenericProps) {
  // State for marketing plan data
  const [marketingData, setMarketingData] = useState<MarketingPlanData>({});
  // State for data loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // State for tracking expanded section (single value, not array)
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  // State for saving indicator
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch existing marketing plan data on component mount
  useEffect(() => {
    if (businessPlanId) {
      fetchMarketingData();
    }
  }, [businessPlanId]);
  
  // Auto-expand the first section (positioning) if it has content
  useEffect(() => {
    if (marketingData.positioning && expandedSection === null) {
      setExpandedSection('positioning');
    }
  }, [marketingData.positioning, expandedSection]);
  
  // Auto-expand the second section (pricing) if first has no content
  useEffect(() => {
    if (marketingData.pricing && expandedSection === null && !marketingData.positioning) {
      setExpandedSection('pricing');
    }
  }, [marketingData.pricing, expandedSection, marketingData.positioning]);
  
  // Auto-expand the third section (promotional) if first two have no content
  useEffect(() => {
    if (marketingData.promotional && expandedSection === null && 
        !marketingData.positioning && !marketingData.pricing) {
      setExpandedSection('promotional');
    }
  }, [marketingData.promotional, expandedSection, marketingData.positioning, marketingData.pricing]);
  
  // Auto-expand the fourth section (sales) if first three have no content
  useEffect(() => {
    if (marketingData.sales && expandedSection === null && 
        !marketingData.positioning && !marketingData.pricing && !marketingData.promotional) {
      setExpandedSection('sales');
    }
  }, [marketingData.sales, expandedSection, marketingData.positioning, marketingData.pricing, marketingData.promotional]);
  
  /**
   * Fetch marketing plan data from API
   */
  const fetchMarketingData = async () => {
    setIsLoading(true);
    try {
      // Fetch marketing plan data from API
      const response = await fetch(`/api/business-plans/${businessPlanId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch marketing plan data');
      }
      
      const data = await response.json();
      
      // Extract marketing plan data
      const content = data.content || {};
      const marketingPlan = content.marketingPlan || {};
      
      // Try to get structured data if available
      const positioningData: MarketPositioningData | null = marketingPlan.positioningData || null;
      const pricingData: PricingStrategyData | null = marketingPlan.pricingData || null;
      
      // Set marketing data state
      setMarketingData({
        positioning: marketingPlan.positioning || '',
        pricing: marketingPlan.pricing || '',
        promotional: marketingPlan.promotional || '',
        sales: marketingPlan.sales || '',
        positioningData,
        pricingData
      });
      
    } catch (error) {
      console.error('Error fetching marketing plan data:', error);
      toast.error('Failed to load marketing plan data');
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
   * Handle completion of the Market Positioning questionnaire
   */
  const handlePositioningComplete = (formattedText: string) => {
    setMarketingData(prev => ({
      ...prev,
      positioning: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('positioning', formattedText);
    }
  };
  
  /**
   * Handle completion of the Pricing Strategy questionnaire
   */
  const handlePricingComplete = (formattedText: string) => {
    setMarketingData(prev => ({
      ...prev,
      pricing: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('pricing', formattedText);
    }
  };
  
  /**
   * Handle completion of the Promotional Activities questionnaire
   */
  const handlePromotionalComplete = (formattedText: string) => {
    setMarketingData(prev => ({
      ...prev,
      promotional: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('promotional', formattedText);
    }
  };
  
  /**
   * Handle completion of the Sales Strategy questionnaire
   */
  const handleSalesComplete = (formattedText: string) => {
    setMarketingData(prev => ({
      ...prev,
      sales: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('sales', formattedText);
    }
  };
  
  /**
   * Handle saving section data
   */
  const handleSave = async (section: string, content: string) => {
    if (!onSave) return;
    
    try {
      setIsSaving(true);
      await onSave(`marketingPlan.${section}`, content);
      toast.success(`${section} saved successfully`);
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      toast.error(`Failed to save ${section}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * Handle saving all marketing plan data at once
   */
  const handleSaveAll = async () => {
    if (!onSave) return;
    
    try {
      setIsSaving(true);
      
      // Format all marketing plan data into a single string
      const fullMarketingPlan = `
# Market Positioning
${marketingData.positioning || ''}

# Pricing Strategy
${marketingData.pricing || ''}

# Promotional Activities
${marketingData.promotional || ''}

# Sales Strategy
${marketingData.sales || ''}
      `.trim();
      
      // Save the complete marketing plan
      await onSave('marketingPlan', fullMarketingPlan);
      toast.success('Marketing plan saved successfully');
    } catch (error) {
      console.error('Error saving marketing plan:', error);
      toast.error('Failed to save marketing plan');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      {/* Header section with blue accent */}
      <div className="border-b-2 border-blue-500 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Marketing Plan</h2>
        <p className="mt-2 text-gray-600">
          This section outlines your marketing strategy, including your target market, 
          positioning, promotional activities, and sales approach.
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
                {section.id === 'positioning' && (
                  <GenericQuestionnaire
                    {...createQuestionnaireProps('positioning', businessPlanId, handlePositioningComplete)}
                    isEditing={isEditing}
                    initialData={marketingData.positioningData || {}}
                    title="Market Positioning"
                    description="Define your target audience and how your business stands out from competitors"
                    previewTitle="Market Positioning Preview"
                    prompts={[
                      "What is your target audience or customer base?",
                      "What are your key customer segments?",
                      "What is your unique value proposition?",
                      "How do you differentiate from competitors?",
                      "What is your competitive advantage in the market?"
                    ]}
                  />
                )}
                
                {section.id === 'pricing' && (
                  <GenericQuestionnaire
                    {...createQuestionnaireProps('pricing', businessPlanId, handlePricingComplete)}
                    isEditing={isEditing}
                    initialData={marketingData.pricingData || {}}
                    title="Pricing Strategy"
                    description="Outline your pricing approach and how it aligns with your business goals"
                    previewTitle="Pricing Strategy Preview"
                    prompts={[
                      "What pricing model will you use?",
                      "How does your pricing compare to competitors?",
                      "What pricing tiers or packages will you offer?",
                      "What is your profit margin strategy?",
                      "How will you handle discounts or promotions?"
                    ]}
                  />
                )}
                
                {section.id === 'promotional' && (
                  isEditing ? (
                    <GenericQuestionnaire
                      {...createQuestionnaireProps('promotional', businessPlanId, handlePromotionalComplete)}
                    />
                  ) : (
                    marketingData.promotional ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {typeof marketingData.promotional === 'string' ? marketingData.promotional : ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Promotional Activities information will be displayed here.
                        Switch to Edit mode to add or update this section.
                      </p>
                    )
                  )
                )}
                
                {section.id === 'sales' && (
                  isEditing ? (
                    <GenericQuestionnaire
                      {...createQuestionnaireProps('sales', businessPlanId, handleSalesComplete)}
                    />
                  ) : (
                    marketingData.sales ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {typeof marketingData.sales === 'string' ? marketingData.sales : ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Sales Strategy information will be displayed here.
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