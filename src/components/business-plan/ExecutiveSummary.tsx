'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ExecutiveSummaryData, BusinessPlanSection } from '@/types/business-plan'
import VisionQuestionnaire from './VisionQuestionnaire'

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
}

export default function ExecutiveSummary({ data, onSave, isEditing = false, businessPlanId }: Props) {
  const [expandedSection, setExpandedSection] = useState<BusinessPlanSection | null>(null)
  const [content, setContent] = useState<Partial<ExecutiveSummaryData>>(data || {})
  const [isSaving, setIsSaving] = useState(false)
  const [questionnaireMode, setQuestionnaireMode] = useState<BusinessPlanSection | null>(null)

  const handleSave = async (sectionId: BusinessPlanSection) => {
    try {
      setIsSaving(true)
      await onSave(sectionId, content[sectionId] || '')
    } catch (error) {
      console.error('Error saving section:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleQuestionnaireComplete = async (sectionId: BusinessPlanSection, text: string) => {
    setContent(prev => ({
      ...prev,
      [sectionId]: text
    }))
    setQuestionnaireMode(null)
    await handleSave(sectionId)
  }

  const handleStartQuestionnaire = (sectionId: BusinessPlanSection) => {
    setQuestionnaireMode(sectionId)
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Executive Summary</h2>
        <p className="mt-2 text-gray-600">
          This is the most important section as it provides a snapshot of your business and captures the reader's attention.
          It should be written last, after completing the other sections.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="border rounded-lg shadow-sm bg-white">
              <button
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
                {expandedSection === section.id ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {expandedSection === section.id && (
                <div className="px-4 pb-4">
                  {questionnaireMode === section.id ? (
                    <VisionQuestionnaire
                      businessPlanId={businessPlanId}
                      onComplete={(text) => handleQuestionnaireComplete(section.id, text)}
                    />
                  ) : (
                    <div>
                      <textarea
                        value={content[section.id] || ''}
                        onChange={(e) => setContent(prev => ({ ...prev, [section.id]: e.target.value }))}
                        disabled={!isEditing || isSaving}
                        placeholder={`Enter your ${section.title.toLowerCase()}...`}
                        className="w-full h-40 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {isEditing && (
                        <div className="mt-2 flex justify-end gap-2">
                          {!content[section.id] && (
                            <button
                              onClick={() => handleStartQuestionnaire(section.id)}
                              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
                            >
                              Use Questionnaire
                            </button>
                          )}
                          <button
                            onClick={() => handleSave(section.id)}
                            disabled={isSaving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Prompts sidebar */}
        <div className="lg:col-span-1">
          {expandedSection && !questionnaireMode && (
            <div className="border rounded-lg shadow-sm bg-white p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Guiding Questions</h4>
              <ul className="space-y-3">
                {sections.find(s => s.id === expandedSection)?.prompts.map((prompt, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-gray-600">{prompt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 