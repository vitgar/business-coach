// FILE MARKED FOR REMOVAL
// This component is being replaced as part of the business plan page redesign
// See replacementplan.md for details

/*
'use client'

import { useState, useEffect } from 'react'
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
    title: 'Target Market',
    description: 'Define your ideal customer and the size/characteristics of your target market.',
    prompts: [
      'Who is your ideal customer? Be as specific as possible.',
      'What is the size of your target market?',
      'What are the key demographics and psychographics of your target market?',
      'What market research supports your target market selection?',
      'How will you reach this market effectively?'
    ]
  },
  {
    id: 'distributionStrategy',
    title: 'Distribution Strategy',
    description: 'Outline how your product or service will reach customers effectively.',
    prompts: [
      'What channels will you use to distribute your products/services?',
      'Why are these channels appropriate for your target market?',
      'What are the costs associated with your distribution strategy?',
      'How will you scale your distribution as your business grows?',
      'What partners or intermediaries might be involved?'
    ]
  },
]

interface Props {
  data?: ExecutiveSummaryData
  onSave: (sectionId: BusinessPlanSection, content: string) => Promise<void>
  isEditing?: boolean
  businessPlanId: string
}

export default function ExecutiveSummary({ data, onSave, isEditing = false, businessPlanId }: Props) {
  const [expandedSection, setExpandedSection] = useState<BusinessPlanSection | null>(null)
  const [sectionContent, setSectionContent] = useState<{[key: string]: string}>({})
  const [isQuestioning, setIsQuestioning] = useState<{
    [key in BusinessPlanSection]?: boolean
  }>({})
  const [isLoading, setIsLoading] = useState(!data)

  // Load executive summary data if not provided
  useEffect(() => {
    if (!data && businessPlanId) {
      const loadExecutiveSummary = async () => {
        try {
          setIsLoading(true)
          const response = await fetch(`/api/business-plans/${businessPlanId}/executive-summary`)
          
          if (!response.ok) {
            throw new Error('Failed to load executive summary')
          }
          
          const summaryData = await response.json()
          
          // Convert the data to the expected format if needed
          const contentObj: {[key: string]: string} = {}
          sections.forEach(section => {
            contentObj[section.id] = summaryData[section.id] || ''
          })
          
          setSectionContent(contentObj)
        } catch (error) {
          console.error('Error loading executive summary:', error)
        } finally {
          setIsLoading(false)
        }
      }
      
      loadExecutiveSummary()
    } else if (data) {
      // Use the provided data
      const contentObj: {[key: string]: string} = {}
      sections.forEach(section => {
        contentObj[section.id] = data[section.id] || ''
      })
      setSectionContent(contentObj)
    }
  }, [data, businessPlanId])

  const handleSave = async (sectionId: BusinessPlanSection) => {
    // Only save if we have content for this section
    if (sectionContent[sectionId]) {
      await onSave(sectionId, sectionContent[sectionId])
    }
    
    // Close the questionnaire after saving
    setIsQuestioning({
      ...isQuestioning,
      [sectionId]: false
    })
  }
  
  const handleQuestionnaireComplete = async (sectionId: BusinessPlanSection, text: string) => {
    // Update local state
    setSectionContent({
      ...sectionContent,
      [sectionId]: text
    })
    
    // Save to API
    await onSave(sectionId, text)
    
    // Close the questionnaire
    setIsQuestioning({
      ...isQuestioning,
      [sectionId]: false
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
      </div>
    )
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Executive Summary</h2>
      
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="flex justify-between items-center w-full px-4 py-3 bg-gray-50 text-left"
            >
              <h3 className="text-lg font-medium">{section.title}</h3>
              {expandedSection === section.id ? 
                <ChevronDown className="h-5 w-5 text-gray-500" /> : 
                <ChevronRight className="h-5 w-5 text-gray-500" />
              }
            </button>
            
            {expandedSection === section.id && (
              <div className="p-4">
                <p className="text-gray-600 mb-4">{section.description}</p>
                
                {isQuestioning[section.id] ? (
                  <div className="mb-4">
                    <VisionQuestionnaire
                      businessPlanId={businessPlanId}
                      onComplete={(text) => handleQuestionnaireComplete(section.id, text)}
                      existingContent={sectionContent[section.id]}
                    />
                  </div>
                ) : (
                  <div className="mb-4">
                    {isEditing ? (
                      <div>
                        <textarea
                          value={sectionContent[section.id] || ''}
                          onChange={(e) => setSectionContent({
                            ...sectionContent,
                            [section.id]: e.target.value
                          })}
                          placeholder={`Enter your ${section.title.toLowerCase()} here...`}
                          className="w-full h-40 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        
                        <div className="flex justify-between mt-3">
                          <button
                            onClick={() => setIsQuestioning({ ...isQuestioning, [section.id]: true })}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Get AI assistance
                          </button>
                          
                          <button
                            onClick={() => handleSave(section.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose max-w-none">
                        {sectionContent[section.id] ? (
                          <div className="whitespace-pre-wrap">{sectionContent[section.id]}</div>
                        ) : (
                          <p className="text-gray-500 italic">No content yet. Click Edit to add content.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {!isQuestioning[section.id] && isEditing && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Suggested Questions:</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600">
                      {section.prompts.map((prompt, idx) => (
                        <li key={idx} className="mb-1">{prompt}</li>
                      ))}
                    </ul>
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
*/

import { FC } from 'react'

// Temporary placeholder component for Executive Summary
const ExecutiveSummary: FC<any> = () => {
  return (
    <div className="p-4 border border-gray-300 rounded bg-gray-50">
      <h2 className="text-lg font-medium text-gray-800">Executive Summary</h2>
      <p className="text-gray-500">This component is being redesigned.</p>
    </div>
  )
}

export default ExecutiveSummary 