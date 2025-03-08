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
        ];
        
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
        ];
        
      case 'productsAndServices':
        return [
          {
            id: 'overview',
            label: 'Product/Service Overview',
            type: 'textarea',
            placeholder: 'Provide a detailed overview of your products or services...',
            help: 'Comprehensive description of what you offer to customers'
          },
          {
            id: 'valueProposition',
            label: 'Value Proposition',
            type: 'textarea',
            placeholder: 'Describe your unique value proposition...',
            help: 'What makes your products/services valuable to customers and different from competitors'
          },
          {
            id: 'intellectualProperty',
            label: 'Intellectual Property',
            type: 'textarea',
            placeholder: 'Describe any patents, trademarks, copyrights, or other IP...',
            help: 'Detail your intellectual property assets and protection strategy'
          },
          {
            id: 'futureProducts',
            label: 'Future Products/Services',
            type: 'textarea',
            placeholder: 'Outline your future product/service development plans...',
            help: 'Your product roadmap and development timeline'
          }
        ];
        
      case 'marketAnalysis':
        return [
          {
            id: 'industryOverview',
            label: 'Industry Overview',
            type: 'textarea',
            placeholder: 'Provide an overview of your industry...',
            help: 'Size, trends, and growth projections for your industry'
          },
          {
            id: 'targetMarket',
            label: 'Target Market',
            type: 'textarea',
            placeholder: 'Describe your target market in detail...',
            help: 'Demographics, needs, and behaviors of your ideal customers'
          },
          {
            id: 'marketSegmentation',
            label: 'Market Segmentation',
            type: 'textarea',
            placeholder: 'Detail how you segment your market...',
            help: 'How you divide the market into distinct customer groups'
          },
          {
            id: 'competitiveAnalysis',
            label: 'Competitive Analysis',
            type: 'textarea',
            placeholder: 'Analyze your competitors...',
            help: 'Identify main competitors and their strengths/weaknesses'
          },
          {
            id: 'swotAnalysis',
            label: 'SWOT Analysis',
            type: 'textarea',
            placeholder: 'Provide a SWOT analysis for your business...',
            help: 'Strengths, Weaknesses, Opportunities, and Threats'
          }
        ];
        
      case 'marketingStrategy':
        return [
          {
            id: 'branding',
            label: 'Branding Strategy',
            type: 'textarea',
            placeholder: 'Describe your branding strategy...',
            help: 'Your brand identity, voice, and positioning'
          },
          {
            id: 'pricing',
            label: 'Pricing Strategy',
            type: 'textarea',
            placeholder: 'Explain your pricing strategy...',
            help: 'How you price your products/services and why'
          },
          {
            id: 'promotion',
            label: 'Promotion Plan',
            type: 'textarea',
            placeholder: 'Detail your promotion and advertising strategies...',
            help: 'How you\'ll create awareness and attract customers'
          },
          {
            id: 'salesStrategy',
            label: 'Sales Strategy',
            type: 'textarea',
            placeholder: 'Outline your sales process and strategy...',
            help: 'Your approach to converting leads into customers'
          },
          {
            id: 'channels',
            label: 'Distribution Channels',
            type: 'textarea',
            placeholder: 'Describe your distribution channels...',
            help: 'How your products/services reach customers'
          },
          {
            id: 'customerRetention',
            label: 'Customer Retention',
            type: 'textarea',
            placeholder: 'Explain your customer retention strategies...',
            help: 'How you\'ll keep customers coming back'
          }
        ];
        
      case 'operationsPlan':
        return [
          {
            id: 'businessModel',
            label: 'Business Model',
            type: 'textarea',
            placeholder: 'Describe your business model in detail...',
            help: 'How your business creates, delivers, and captures value'
          },
          {
            id: 'facilities',
            label: 'Facilities & Location',
            type: 'textarea',
            placeholder: 'Describe your business facilities and location...',
            help: 'Information about your physical locations and requirements'
          },
          {
            id: 'technology',
            label: 'Technology Requirements',
            type: 'textarea',
            placeholder: 'Detail your technology infrastructure and requirements...',
            help: 'Software, hardware, and other tech needs'
          },
          {
            id: 'productionProcess',
            label: 'Production Process',
            type: 'textarea',
            placeholder: 'Outline your production or service delivery process...',
            help: 'How you create and deliver your products/services'
          },
          {
            id: 'qualityControl',
            label: 'Quality Control',
            type: 'textarea',
            placeholder: 'Describe your quality control procedures...',
            help: 'How you ensure consistent quality'
          },
          {
            id: 'logistics',
            label: 'Logistics & Supply Chain',
            type: 'textarea',
            placeholder: 'Detail your logistics and supply chain management...',
            help: 'How you manage inventory, shipping, and suppliers'
          }
        ];
        
      case 'organizationAndManagement':
        return [
          {
            id: 'structure',
            label: 'Organizational Structure',
            type: 'textarea',
            placeholder: 'Describe your organizational structure...',
            help: 'Your business hierarchy and reporting relationships'
          },
          {
            id: 'managementTeam',
            label: 'Management Team',
            type: 'textarea',
            placeholder: 'Describe your management team and their experience...',
            help: 'Background and qualifications of key team members'
          },
          {
            id: 'advisors',
            label: 'Advisors & Board',
            type: 'textarea',
            placeholder: 'List any advisors, mentors, or board members...',
            help: 'External expertise that supports your business'
          },
          {
            id: 'hrPlan',
            label: 'HR Plan',
            type: 'textarea',
            placeholder: 'Outline your human resources plan...',
            help: 'Hiring plans, staffing requirements, and compensation strategy'
          }
        ];
        
      case 'financialPlan':
        return [
          {
            id: 'projections',
            label: 'Financial Projections',
            type: 'textarea',
            placeholder: 'Provide your financial projections...',
            help: 'Revenue, expenses, and profit forecasts for the next few years'
          },
          {
            id: 'fundingNeeds',
            label: 'Funding Requirements',
            type: 'textarea',
            placeholder: 'Describe your funding requirements...',
            help: 'How much funding you need and what it will be used for'
          },
          {
            id: 'useOfFunds',
            label: 'Use of Funds',
            type: 'textarea',
            placeholder: 'Detail how you will use the funds...',
            help: 'Specific allocation of investment or funding'
          },
          {
            id: 'breakEvenAnalysis',
            label: 'Break-Even Analysis',
            type: 'textarea',
            placeholder: 'Provide a break-even analysis...',
            help: 'When you expect to start covering costs and making a profit'
          },
          {
            id: 'exitStrategy',
            label: 'Exit Strategy',
            type: 'textarea',
            placeholder: 'Describe your exit strategy...',
            help: 'Your long-term plan for the business (acquisition, IPO, etc.)'
          }
        ];
        
      // Default case for any other sections
      default:
        return [
          {
            id: 'content',
            label: `${currentSection} Content`,
            type: 'textarea',
            placeholder: `Enter content for ${currentSection}...`,
            help: 'This section will have more detailed fields in future updates'
          }
        ];
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