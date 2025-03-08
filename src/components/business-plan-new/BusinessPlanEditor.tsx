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
  // Track the field that should be focused
  const [fieldToFocus, setFieldToFocus] = useState<string | null>(null)
  
  // Create a map of textarea refs
  const textareaRefs = useRef<{[key: string]: HTMLTextAreaElement | null}>({})
  // Create a ref for the form element to use for scrolling
  const formRef = useRef<HTMLFormElement>(null)
  
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
    
    // When section changes, set the first field to be focused
    const fields = getFieldDefinitions()
    if (fields.length > 0) {
      setFieldToFocus(fields[0].id)
    }
  }, [businessPlan, currentSection])
  
  // Effect to focus on a field when fieldToFocus changes
  useEffect(() => {
    if (fieldToFocus) {
      // Wait for the DOM to be fully updated
      setTimeout(() => {
        // Get the textarea element for the field to focus
        const textareaElement = textareaRefs.current[fieldToFocus]
        if (textareaElement) {
          // Focus the element
          textareaElement.focus()
          
          // Scroll the field into view with some padding
          if (formRef.current) {
            const fieldElement = document.getElementById(fieldToFocus)
            if (fieldElement) {
              // Calculate position to scroll to (field position minus some padding)
              const yOffset = -20
              const y = fieldElement.getBoundingClientRect().top + window.pageYOffset + yOffset
              
              // Scroll the form container
              formRef.current.scrollTo({
                top: y - formRef.current.offsetTop,
                behavior: 'smooth'
              })
            }
          }
        }
        
        // Clear the field to focus after focusing
        setFieldToFocus(null)
      }, 100)
    }
  }, [fieldToFocus])
  
  /**
   * Focus on a specific field in the form
   * @param fieldId The ID of the field to focus, or null for the first field
   */
  const focusField = (fieldId: string | null = null) => {
    const fields = getFieldDefinitions()
    if (fields.length === 0) return
    
    // If fieldId is provided and exists in the current section, focus it
    if (fieldId && fields.some(field => field.id === fieldId)) {
      setFieldToFocus(fieldId)
    } else {
      // Otherwise, focus the first field
      setFieldToFocus(fields[0].id)
    }
  }
  
  // Make the focusField function available to the parent component
  useEffect(() => {
    // Attach the focusField function to the window object
    // so the parent component can access it
    // @ts-ignore - Adding custom property to window
    window.businessPlanEditor = window.businessPlanEditor || {}
    // @ts-ignore
    window.businessPlanEditor[currentSection] = {
      focusField
    }
    
    return () => {
      // Clean up when component unmounts
      // @ts-ignore
      if (window.businessPlanEditor && window.businessPlanEditor[currentSection]) {
        // @ts-ignore
        delete window.businessPlanEditor[currentSection]
      }
    }
  }, [currentSection])

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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium text-gray-800">{getSectionTitle()}</h2>
      </div>
      
      <div className="flex-grow overflow-auto p-4">
        <form ref={formRef} onSubmit={handleSubmit}>
          {renderFields()}
          
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={!isDirty}
              className={`px-4 py-2 rounded-md ${
                isDirty 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 