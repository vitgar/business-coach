'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import dynamic from 'next/dynamic'
import { toast } from 'react-toastify'
import { Clipboard, Save } from 'lucide-react'
// Import React-Quill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css' // Import Quill styles

// Import chat component
const BusinessChat = dynamic(() => import('./BusinessChat'), { ssr: false })

// Define the section structure based on the business plan outline
const SECTION_NAMES = {
  executiveSummary: '1. Executive Summary',
  companyDescription: '2. Company Description',
  productsAndServices: '3. Products and Services',
  marketAnalysis: '4. Market Analysis',
  marketingStrategy: '5. Marketing Strategy',
  operationsPlan: '6. Operations Plan',
  organizationAndManagement: '7. Organization & Management',
  financialPlan: '8. Financial Plan',
  appendix: '9. Appendix'
};

const SECTION_DESCRIPTIONS = {
  executiveSummary: 'An overview of your business and your plans. This section should highlight the key points from each section of your business plan.',
  companyDescription: 'Detailed information about your company and the marketplace needs it addresses.',
  productsAndServices: 'Detailed descriptions of what you sell or provide to customers.',
  marketAnalysis: 'Research about your industry, target market, and competitors.',
  marketingStrategy: 'How you plan to reach and sell to your target customers.',
  operationsPlan: 'How your business will run on a day-to-day basis.',
  organizationAndManagement: 'The structure of your company and who will run it.',
  financialPlan: 'The numbers that drive your business.',
  appendix: 'Additional information that supports your business plan.'
};

// Default business plan template for a new plan
const DEFAULT_BUSINESS_PLAN_TEMPLATE = `<h1 class="ql-align-center">My Business Plan</h1>
<p>Start creating your business plan by editing this template...</p>
`;

/**
 * Helper function to convert structured business plan data to HTML
 * 
 * @param businessPlanData The structured business plan data from the API
 * @returns HTML string representing the business plan
 */
function convertBusinessPlanToHTML(businessPlanData: any): string {
  if (!businessPlanData || !businessPlanData.content) {
    return DEFAULT_BUSINESS_PLAN_TEMPLATE;
  }

  const { content } = businessPlanData;
  let html = `<h1 class="ql-align-center">${businessPlanData.title || 'Business Plan'}</h1>\n\n`;

  // Process each main section
  Object.entries(SECTION_NAMES).forEach(([sectionKey, sectionTitle]) => {
    const sectionData = content[sectionKey] || {};
    
    // Add main section heading
    html += `<h2 class="ql-align-left">${sectionTitle}</h2>\n`;
    
    // Add section description/content if available
    if (sectionData.description) {
      html += `<p>${sectionData.description}</p>\n\n`;
    } else {
      // Default description
      html += `<p>${SECTION_DESCRIPTIONS[sectionKey as keyof typeof SECTION_DESCRIPTIONS] || 'This section needs to be completed.'}</p>\n\n`;
    }
    
    // Add any additional fields for this section
    Object.entries(sectionData).forEach(([fieldKey, fieldValue]) => {
      // Skip the description field as we've already handled it
      if (fieldKey === 'description') return;
      
      // Handle fields that are strings
      if (typeof fieldValue === 'string' && fieldKey !== 'id') {
        html += `<h3>${fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/([A-Z])/g, ' $1')}</h3>\n`;
        html += `<p>${fieldValue}</p>\n\n`;
      }
      
      // Handle fields that are objects with a content property
      if (typeof fieldValue === 'object' && fieldValue !== null && 'content' in fieldValue) {
        const title = fieldValue.title || (fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/([A-Z])/g, ' $1'));
        html += `<h3>${title}</h3>\n`;
        html += `<p>${fieldValue.content || ''}</p>\n\n`;
      }
    });
  });

  return html;
}

/**
 * Helper function to parse HTML and extract structured business plan data
 * 
 * @param html The HTML content from the editor
 * @param existingPlan The existing business plan data to update
 * @returns Structured business plan data for the API
 */
function parseHTMLToBusinessPlan(html: string, existingPlan: any): any {
  // Start with the existing plan structure to preserve data
  const result = {
    ...existingPlan,
    content: { ...existingPlan.content || {} }
  };
  
  // Parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Extract title
  const titleElement = doc.querySelector('h1');
  if (titleElement) {
    result.title = titleElement.textContent || existingPlan.title;
  }
  
  // Function to extract text between elements
  const getTextBetween = (startEl: Element, endEl: Element | null): string => {
    let text = '';
    let current = startEl.nextElementSibling;
    
    while (current && current !== endEl) {
      if (current.tagName !== 'H2' && current.tagName !== 'H3') {
        text += current.textContent + ' ';
      }
      current = current.nextElementSibling;
    }
    
    return text.trim();
  };
  
  // Process main sections (h2 elements)
  const h2Elements = Array.from(doc.querySelectorAll('h2'));
  
  h2Elements.forEach((h2, index) => {
    // Get the section key by matching the section title prefix (e.g., "1. Executive Summary")
    const sectionTitle = h2.textContent || '';
    const sectionNumber = sectionTitle.split('.')[0].trim();
    
    // Find the corresponding section key
    let sectionKey = '';
    Object.entries(SECTION_NAMES).forEach(([key, title]) => {
      if (title.startsWith(sectionNumber) || title === sectionTitle) {
        sectionKey = key;
      }
    });
    
    if (!sectionKey) return;
    
    // Initialize section if needed
    if (!result.content[sectionKey]) {
      result.content[sectionKey] = {};
    }
    
    // Get the next h2 or end of document
    const nextH2 = h2Elements[index + 1] || null;
    
    // Extract section description (content between h2 and first h3)
    const firstH3 = Array.from(doc.querySelectorAll('h3')).find(h3 => {
      return h2.compareDocumentPosition(h3) & Node.DOCUMENT_POSITION_FOLLOWING && 
             (!nextH2 || nextH2.compareDocumentPosition(h3) & Node.DOCUMENT_POSITION_PRECEDING);
    });
    
    if (firstH3) {
      const descriptionText = getTextBetween(h2, firstH3);
      if (descriptionText) {
        result.content[sectionKey].description = descriptionText;
      }
    } else {
      const descriptionText = getTextBetween(h2, nextH2);
      if (descriptionText) {
        result.content[sectionKey].description = descriptionText;
      }
    }
    
    // Process subsections (h3 elements) within this section
    const subsections = Array.from(doc.querySelectorAll('h3')).filter(h3 => {
      return h2.compareDocumentPosition(h3) & Node.DOCUMENT_POSITION_FOLLOWING && 
             (!nextH2 || nextH2.compareDocumentPosition(h3) & Node.DOCUMENT_POSITION_PRECEDING);
    });
    
    subsections.forEach((h3, subIndex) => {
      const subsectionTitle = h3.textContent || '';
      // Convert the title to a camelCase key
      const subsectionKey = subsectionTitle
        .replace(/^\d+\.\d+\s+/, '') // Remove number prefix like "1.1 "
        .toLowerCase()
        .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase()) // Convert to camelCase
        .replace(/^[A-Z]/, c => c.toLowerCase()); // Ensure first character is lowercase
      
      // Get content until next h3 or h2
      const nextSubsection = subsections[subIndex + 1] || nextH2;
      const contentText = getTextBetween(h3, nextSubsection);
      
      if (contentText) {
        result.content[sectionKey][subsectionKey] = contentText;
      }
    });
  });
  
  return result;
}

/**
 * BasicBusinessPlanContent Component
 * 
 * Main content for the Basic Business Plan page:
 * - Left panel: Chat interface for business guidance
 * - Right panel: Rich text editor for the business plan
 * - Loads and saves business plan data for the current business
 * - Allows applying suggestions from chat directly to the editor
 * - Integrates with the existing business plan data structure
 */
export default function BasicBusinessPlanContent() {
  const { currentBusinessId } = useAuth()
  const [businessPlan, setBusinessPlan] = useState<string>(DEFAULT_BUSINESS_PLAN_TEMPLATE)
  const [originalPlanData, setOriginalPlanData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load business plan data for the current business
  useEffect(() => {
    if (!currentBusinessId) return
    
    const fetchBusinessPlan = async () => {
      try {
        setIsLoading(true)
        // Load from the main business plan API
        const response = await fetch(`/api/business-plans/${currentBusinessId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            // If no plan exists yet, initialize with empty template
            setBusinessPlan(DEFAULT_BUSINESS_PLAN_TEMPLATE)
            setOriginalPlanData(null)
            setError(null)
            return
          } else {
            throw new Error('Failed to load business plan')
          }
        }
        
        const data = await response.json()
        setOriginalPlanData(data)
        
        // Convert structured data to HTML for the editor
        const htmlContent = convertBusinessPlanToHTML(data)
        setBusinessPlan(htmlContent)
        setError(null)
      } catch (err: any) {
        console.error('Error loading business plan:', err)
        setError(err.message || 'An error occurred while loading the business plan')
        // Initialize with empty template on error
        setBusinessPlan(DEFAULT_BUSINESS_PLAN_TEMPLATE)
        setOriginalPlanData(null)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchBusinessPlan()
  }, [currentBusinessId])

  // Save the current business plan content
  const handleSave = async () => {
    if (!currentBusinessId) {
      toast.error('No business selected')
      return
    }
    
    try {
      setIsSaving(true)
      
      let planData;
      if (originalPlanData) {
        // Convert HTML back to structured format
        planData = parseHTMLToBusinessPlan(businessPlan, originalPlanData)
      } else {
        // Create a new business plan
        planData = {
          title: 'My Business Plan',
          content: { 
            /* Initial structure will be determined by parseHTMLToBusinessPlan */
          }
        }
        planData = parseHTMLToBusinessPlan(businessPlan, planData)
      }
      
      // Save to the main business plan API
      const response = await fetch(`/api/business-plans/${currentBusinessId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save business plan')
      }
      
      const savedData = await response.json()
      setOriginalPlanData(savedData)
      toast.success('Business plan saved')
    } catch (err: any) {
      console.error('Error saving business plan:', err)
      toast.error(err.message || 'An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle business plan content change
  const handleContentChange = (newContent: string) => {
    setBusinessPlan(newContent)
  }

  // Handle copying content to clipboard
  const handleCopyContent = () => {
    // Create a temporary div to hold HTML content for copying
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = businessPlan
    
    // Get text content (stripping HTML tags)
    const textContent = tempDiv.textContent || tempDiv.innerText || ''
    
    navigator.clipboard.writeText(textContent)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy to clipboard'))
  }

  // Handle applying a suggestion from the chat
  const handleApplySuggestion = (suggestion: string) => {
    // Check if suggestion is HTML
    if (suggestion.trim().startsWith('<') && suggestion.includes('</')) {
      // Append the suggestion to the current content
      setBusinessPlan(prevContent => {
        // For simplicity, we're just appending the content
        // A more sophisticated implementation could insert at cursor position
        return prevContent + '\n' + suggestion
      })
    } else {
      // If not HTML, try to convert from markdown or just append as paragraph
      const formattedSuggestion = `<p>${suggestion.replace(/\n/g, '<br>')}</p>`
      setBusinessPlan(prevContent => prevContent + '\n' + formattedSuggestion)
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      {/* Left sidebar - Chat */}
      <div className="w-1/3 border-r border-gray-200 h-full flex flex-col bg-white overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Business Coach Chat</h2>
          <p className="text-sm text-gray-600">Ask questions or get guidance for your business plan</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <BusinessChat 
            currentBusinessId={currentBusinessId} 
            onApplySuggestion={handleApplySuggestion}
          />
        </div>
      </div>
      
      {/* Main content - Business Plan editor */}
      <div className="w-2/3 h-full flex flex-col overflow-hidden">
        {/* Editor toolbar */}
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Business Plan Editor</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleCopyContent}
              className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
            >
              <Clipboard className="h-4 w-4 mr-1" />
              Copy
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`inline-flex items-center px-3 py-1.5 rounded text-sm ${
                isSaving 
                  ? 'bg-blue-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        
        {/* Editor content */}
        <div className="flex-1 overflow-hidden bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="h-full w-full">
              <QuillEditor
                value={businessPlan}
                onChange={handleContentChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * QuillEditor Component
 * 
 * Rich text editor using React-Quill that:
 * - Provides familiar formatting controls
 * - Shows formatted content while editing
 * - Allows for direct content manipulation
 * - Supports section-based business plan organization
 */
interface QuillEditorProps {
  value: string
  onChange: (value: string) => void
}

function QuillEditor({ value, onChange }: QuillEditorProps) {
  // Configure Quill modules (toolbar options)
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  }
  
  // Configure Quill formats
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'indent',
    'align',
    'color', 'background',
    'link'
  ]
  
  return (
    <div className="h-full w-full quill-container">
      <style jsx global>{`
        .quill-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .quill-container .quill {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .quill-container .ql-container {
          flex: 1;
          overflow: auto;
          font-size: 16px;
          line-height: 1.5;
        }
        .quill-container .ql-editor {
          min-height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
            Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        }
        /* Style headings to stand out */
        .quill-container .ql-editor h1 {
          font-size: 2.25rem;
          margin-top: 2rem;
          margin-bottom: 1.5rem;
          color: #2563eb;
          font-weight: 700;
        }
        .quill-container .ql-editor h2 {
          font-size: 1.75rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e5e7eb;
          color: #1e40af;
          font-weight: 600;
        }
        .quill-container .ql-editor h3 {
          font-size: 1.25rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #374151;
          font-weight: 600;
        }
        /* Better list styling */
        .quill-container .ql-editor ul,
        .quill-container .ql-editor ol {
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .quill-container .ql-editor li {
          margin-bottom: 0.5rem;
        }
        /* Better paragraph spacing */
        .quill-container .ql-editor p {
          margin-bottom: 1rem;
          line-height: 1.625;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="Write your business plan here..."
      />
    </div>
  )
} 