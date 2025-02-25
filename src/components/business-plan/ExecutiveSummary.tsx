'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Edit2 } from 'lucide-react'
import type { ExecutiveSummaryData, BusinessPlanSection } from '@/types/business-plan'
import VisionQuestionnaire from './VisionQuestionnaire'
import ProductsQuestionnaire from './ProductsQuestionnaire'
import MarketsQuestionnaire from './MarketsQuestionnaire'
import DistributionQuestionnaire from './DistributionQuestionnaire'
import ReactMarkdown from 'react-markdown'

interface Section {
  id: BusinessPlanSection
  title: string
  description: string
  prompts: string[]
}

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
]

interface Props {
  data?: ExecutiveSummaryData
  onSave: (sectionId: BusinessPlanSection, content: string) => Promise<void>
  isEditing?: boolean
  businessPlanId: string
  planTitle?: string
  onTitleSave?: (title: string) => Promise<void>
}

export default function ExecutiveSummary({ 
  data, 
  onSave, 
  isEditing = false, 
  businessPlanId,
  planTitle = '',
  onTitleSave 
}: Props) {
  const [expandedSection, setExpandedSection] = useState<BusinessPlanSection | null>(null)
  const [content, setContent] = useState<Partial<ExecutiveSummaryData>>(data || {})
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState(planTitle || '')
  const [isEditingTitle, setIsEditingTitle] = useState(!planTitle)
  const [isSavingTitle, setIsSavingTitle] = useState(false)

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

  const handleSave = async (sectionId: BusinessPlanSection) => {
    try {
      setIsSaving(true)
      console.log(`Saving section ${sectionId}:`, content[sectionId]);
      await onSave(sectionId, content[sectionId] || '')
    } catch (error) {
      console.error('Error saving section:', error)
    } finally {
      setIsSaving(false)
    }
  }

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
  }

  const handleQuestionnaireComplete = async (sectionId: BusinessPlanSection, text: string) => {
    console.log(`Questionnaire complete for section ${sectionId}:`, text);
    setContent(prev => ({
      ...prev,
      [sectionId]: text
    }))
    await handleSave(sectionId)
  }

  return (
    <div className="space-y-6">
      {/* Business Plan Title Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        {isEditingTitle ? (
          <div className="space-y-3">
            <label htmlFor="business-plan-title" className="block text-sm font-medium text-gray-700">
              Business Plan Title
            </label>
            <input
              id="business-plan-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your business plan"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex justify-end">
              <button
                onClick={handleTitleSave}
                disabled={isSavingTitle || !title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSavingTitle ? 'Saving...' : 'Save Title'}
              </button>
            </div>
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

      <div className="border-b-2 border-blue-500 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Executive Summary</h2>
        <p className="mt-2 text-gray-600">
          This is the most important section as it provides a snapshot of your business and captures the reader's attention.
          It should be written last, after completing the other sections.
        </p>
        
        {/* Debug display - hidden */}
        {false && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <details>
              <summary>Debug: Content State</summary>
              <pre className="overflow-auto max-h-40">
                {JSON.stringify(content, null, 2)}
              </pre>
            </details>
            <details className="mt-2">
              <summary>Debug: Vision and Goals Content</summary>
              <div className="mt-2 p-2 bg-white rounded">
                <h4 className="font-bold">Raw Content:</h4>
                <pre className="overflow-auto max-h-40 mt-1">
                  {content.visionAndGoals || 'No vision and goals data'}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Main content area - now full width */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="border rounded-lg shadow-sm bg-white overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
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
                {section.id === 'visionAndGoals' ? (
                  <>
                    {/* Hide the duplicate vision content display */}
                    {false && content.visionAndGoals && (
                      <div className="mt-3">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{content.visionAndGoals}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    <VisionQuestionnaire
                      businessPlanId={businessPlanId}
                      onComplete={(text) => handleQuestionnaireComplete(section.id, text)}
                    />
                  </>
                ) : section.id === 'productsOrServices' ? (
                  <>
                    {/* Hide the duplicate products content display */}
                    {false && content.productsOrServices && (
                      <div className="mt-3">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{content.productsOrServices}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    <ProductsQuestionnaire
                      businessPlanId={businessPlanId}
                      onComplete={(text) => handleQuestionnaireComplete(section.id, text)}
                    />
                  </>
                ) : section.id === 'targetMarket' ? (
                  <>
                    {/* Hide the duplicate markets content display */}
                    {false && content.targetMarket && (
                      <div className="mt-3">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{content.targetMarket}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    <MarketsQuestionnaire
                      businessPlanId={businessPlanId}
                      onComplete={(text) => handleQuestionnaireComplete(section.id, text)}
                    />
                  </>
                ) : section.id === 'distributionStrategy' ? (
                  <>
                    {/* Hide the duplicate distribution content display */}
                    {false && content.distributionStrategy && (
                      <div className="mt-3">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{content.distributionStrategy}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    <DistributionQuestionnaire
                      businessPlanId={businessPlanId}
                      onComplete={(text) => handleQuestionnaireComplete(section.id, text)}
                    />
                  </>
                ) : (
                  <div>
                    <textarea
                      value={content[section.id] || ''}
                      onChange={(e) => setContent(prev => ({ ...prev, [section.id]: e.target.value }))}
                      disabled={!isEditing || isSaving}
                      placeholder={`Enter your ${section.title.toLowerCase()}...`}
                      className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-800"
                    />
                    {isEditing && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleSave(section.id)}
                          disabled={isSaving}
                          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            'Save'
                          )}
                        </button>
                      </div>
                    )}
                    
                    {/* Debug display for this section */}
                    {false && (
                      <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                        <details>
                          <summary>Debug: Section Content</summary>
                          <pre className="overflow-auto max-h-40 mt-1">
                            {JSON.stringify(content[section.id] || 'No content for this section', null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 