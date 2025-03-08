'use client'

import { useState, useEffect, useRef } from 'react'
import { HelpCircle } from 'lucide-react'

/**
 * Business Plan Editor Component Props
 */
interface BusinessPlanEditorProps {
  businessPlan: any
  currentSection: string
  onSave: (sectionData: any) => void
}

/**
 * Field definition for form fields
 */
interface FieldDefinition {
  id: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select'
  placeholder: string
  help?: string
  options?: { value: string, label: string }[] // For select fields
}

/**
 * BusinessPlanEditor Component
 * 
 * Handles editing different sections of the business plan
 * Dynamically renders appropriate form fields based on the section
 * Provides guidance and help text for each field
 */
export default function BusinessPlanEditor({ 
  businessPlan, 
  currentSection,
  onSave
}: BusinessPlanEditorProps) {
  // Manage form state
  const [formData, setFormData] = useState<any>({})
  const [isDirty, setIsDirty] = useState(false)
  const [highlightedField, setHighlightedField] = useState<string | null>(null)
  
  // Create a map of textarea refs
  const textareaRefs = useRef<{[key: string]: HTMLTextAreaElement | null}>({})
  
  // Initialize form data from business plan content when section changes
  useEffect(() => {
    if (businessPlan?.content?.[currentSection]) {
      setFormData(businessPlan.content[currentSection])
    } else {
      // Initialize with empty object if section doesn't exist
      setFormData({})
    }
    
    // Reset dirty state when section changes
    setIsDirty(false)
    
    // Reset any highlighted fields
    setHighlightedField(null)
  }, [businessPlan, currentSection])

  // Get field definitions based on current section
  const getFieldDefinitions = (): FieldDefinition[] => {
    switch (currentSection) {
      case 'executiveSummary':
        return [
          {
            id: 'businessConcept',
            label: 'Business Concept',
            type: 'textarea',
            placeholder: 'Describe your business concept...',
            help: 'Explain what your business does and the problem it solves'
          },
          {
            id: 'missionStatement',
            label: 'Mission Statement',
            type: 'textarea',
            placeholder: 'Enter your mission statement...',
            help: 'What drives your business and what you aim to achieve'
          },
          {
            id: 'productsOverview',
            label: 'Products/Services Overview',
            type: 'textarea',
            placeholder: 'Provide an overview of your products or services...',
            help: 'Brief description of what you offer to customers'
          },
          {
            id: 'marketOpportunity',
            label: 'Market Opportunity',
            type: 'textarea',
            placeholder: 'Describe your market opportunity...',
            help: 'Size of the market and your potential share'
          },
          {
            id: 'financialHighlights',
            label: 'Financial Highlights',
            type: 'textarea',
            placeholder: 'Summarize key financial projections...',
            help: 'Brief overview of expected revenue, costs, and profitability'
          }
        ]
      case 'companyDescription':
        return [
          {
            id: 'businessStructure',
            label: 'Business Structure',
            type: 'select',
            placeholder: 'Select your business structure',
            options: [
              { value: 'Sole Proprietorship', label: 'Sole Proprietorship' },
              { value: 'Partnership', label: 'Partnership' },
              { value: 'LLC', label: 'Limited Liability Company (LLC)' },
              { value: 'Corporation', label: 'Corporation' },
              { value: 'Nonprofit', label: 'Nonprofit Organization' }
            ]
          },
          {
            id: 'legalStructure',
            label: 'Legal Structure Details',
            type: 'textarea',
            placeholder: 'Provide additional details about your legal structure...'
          },
          {
            id: 'ownershipDetails',
            label: 'Ownership Details',
            type: 'textarea',
            placeholder: 'Describe the ownership structure of your company...',
            help: 'Include information about owners, partners, shareholders, or investors and their ownership percentages'
          },
          {
            id: 'companyHistory',
            label: 'Company History',
            type: 'textarea',
            placeholder: 'Describe the history and founding of your company...'
          }
        ]
      // Add cases for other sections
      default:
        return [
          {
            id: 'content',
            label: `${currentSection} Content`,
            type: 'textarea',
            placeholder: `Enter content for ${currentSection}...`,
            help: 'This section will have more detailed fields in future updates'
          }
        ]
    }
  }

  /**
   * Handle input changes and update form data
   * @param fieldId - The field identifier
   * @param value - The new value
   */
  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Mark form as dirty (has unsaved changes)
    setIsDirty(true)
    
    // For textareas, auto-adjust height
    if (textareaRefs.current[fieldId]) {
      const textarea = textareaRefs.current[fieldId];
      
      // Reset height to calculate correct scrollHeight
      textarea!.style.height = 'auto';
      
      // Set the new height based on content, with min and max constraints
      const newHeight = Math.min(Math.max(80, textarea!.scrollHeight + 2), 500);
      textarea!.style.height = `${newHeight}px`;
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    setIsDirty(false)
  }

  // Get section title for display
  const getSectionTitle = (): string => {
    switch (currentSection) {
      case 'executiveSummary': return 'Executive Summary'
      case 'companyDescription': return 'Company Description'
      case 'productsAndServices': return 'Products & Services'
      case 'marketAnalysis': return 'Market Analysis'
      case 'marketingStrategy': return 'Marketing Strategy'
      case 'operationsPlan': return 'Operations Plan'
      case 'organizationAndManagement': return 'Organization & Management'
      case 'financialPlan': return 'Financial Plan'
      default: return currentSection.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }
  }

  /**
   * Handle applying an AI suggestion to a field
   */
  const handleApplySuggestion = (fieldId: string, content: string) => {
    // Update the form data with the suggested content
    handleInputChange(fieldId, content)
    
    // Briefly highlight the field that was updated
    setHighlightedField(fieldId)
    setTimeout(() => {
      setHighlightedField(null)
    }, 3000)
  }

  // Render form fields based on definitions
  const renderFields = () => {
    const fields = getFieldDefinitions()
    
    return fields.map(field => (
      <div key={field.id} className="mb-5 pb-4 border-b border-gray-100">
        <div className="flex items-center mb-1">
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          {field.help && (
            <div className="ml-2 relative group">
              <HelpCircle className="h-4 w-4 text-gray-400" />
              <div className="absolute left-full ml-2 top-0 w-64 bg-white p-2 rounded shadow-lg text-xs border border-gray-200 hidden group-hover:block z-10">
                {field.help}
              </div>
            </div>
          )}
        </div>
        
        {field.type === 'textarea' && (
          <textarea
            id={field.id}
            ref={el => textareaRefs.current[field.id] = el}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border ${
              highlightedField === field.id 
                ? 'border-green-500 bg-green-50 ring-2 ring-green-300' 
                : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none transition-all duration-200`}
          />
        )}
        
        {field.type === 'text' && (
          <input
            type="text"
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border ${
              highlightedField === field.id 
                ? 'border-green-500 bg-green-50 ring-2 ring-green-300' 
                : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        )}
        
        {field.type === 'select' && field.options && (
          <select
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border ${
              highlightedField === field.id 
                ? 'border-green-500 bg-green-50 ring-2 ring-green-300' 
                : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">{field.placeholder}</option>
            {field.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    ))
  }

  // Add useEffect to adjust textarea heights when form data changes 
  // (handles initial load and external changes like AI suggestions)
  useEffect(() => {
    // Wait for the DOM to be updated
    setTimeout(() => {
      // For each field in the form data
      Object.keys(formData).forEach(fieldId => {
        const textarea = textareaRefs.current[fieldId];
        if (textarea) {
          // Reset height
          textarea.style.height = 'auto';
          
          // Set height based on content
          const newHeight = Math.min(Math.max(80, textarea.scrollHeight + 2), 500);
          textarea.style.height = `${newHeight}px`;
        }
      });
    }, 0);
  }, [formData]);

  return (
    <div className="h-full overflow-auto">
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">
              {getSectionTitle()}
            </h2>
            <button
              type="submit"
              disabled={!isDirty}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                isDirty
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>
          {renderFields()}
        </form>
      </div>
    </div>
  )
} 