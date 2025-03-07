'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, X, Lightbulb, MessageSquare, Clipboard, ArrowDown, ArrowRight, ChevronRight, BookOpen } from 'lucide-react'
import { useBusinessPlanAI, ChatMessage, FieldSuggestion } from '@/hooks/useBusinessPlanAI'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Extended field suggestion with optional display field ID
interface ExtendedFieldSuggestion extends FieldSuggestion {
  displayFieldId?: string;
}

/**
 * Business Plan AI Assistant Props Interface
 */
interface BusinessPlanAIAssistantProps {
  businessPlanId: string;
  sectionId: string;
  sectionName: string;
  className?: string;
  collapsed?: boolean;
  businessPlan?: any;
  onApplySuggestion?: (fieldId: string, content: string) => void;
  onSectionChange?: (sectionId: string) => void;
}

// Define the section order for navigation
const SECTION_ORDER = [
  'executiveSummary',
  'companyDescription',
  'productsAndServices',
  'marketAnalysis',
  'marketingStrategy',
  'operationsPlan',
  'organizationAndManagement',
  'financialPlan'
];

// Define subsections for each section to enable navigation within a section
const SECTION_SUBSECTIONS: Record<string, string[]> = {
  executiveSummary: ['businessConcept', 'missionStatement', 'productsOverview', 'marketOpportunity', 'financialHighlights'],
  companyDescription: ['legalStructure', 'ownershipDetails', 'companyHistory'],
  productsAndServices: ['overview', 'valueProposition', 'intellectualProperty', 'futureProducts'],
  marketAnalysis: ['industryOverview', 'targetMarket', 'marketSegmentation', 'competitiveAnalysis', 'swotAnalysis'],
  marketingStrategy: ['branding', 'pricing', 'promotion', 'salesStrategy', 'channels', 'customerRetention'],
  operationsPlan: ['businessModel', 'facilities', 'technology', 'productionProcess', 'qualityControl', 'logistics'],
  organizationAndManagement: ['structure', 'managementTeam', 'advisors', 'hrPlan'],
  financialPlan: ['projections', 'fundingNeeds', 'useOfFunds', 'breakEvenAnalysis', 'exitStrategy'],
};

// Map subfield IDs to display names
const SUBFIELD_NAMES: Record<string, string> = {
  // Executive Summary subsections
  businessConcept: 'Business Concept',
  missionStatement: 'Mission Statement',
  productsOverview: 'Products/Services Overview',
  marketOpportunity: 'Market Opportunity',
  financialHighlights: 'Financial Highlights',
  managementTeam: 'Management Team',
  milestones: 'Key Milestones',
  
  // Company Description subsections
  businessStructure: 'Business Structure',
  legalStructure: 'Legal Structure Details',
  ownershipDetails: 'Ownership Details',
  companyHistory: 'Company History',
  
  // Products and Services subsections
  overview: 'Product/Service Overview',
  valueProposition: 'Value Proposition',
  intellectualProperty: 'Intellectual Property',
  futureProducts: 'Future Products/Services',
  
  // Market Analysis subsections
  industryOverview: 'Industry Overview',
  targetMarket: 'Target Market',
  marketSegmentation: 'Market Segmentation',
  competitiveAnalysis: 'Competitive Analysis',
  swotAnalysis: 'SWOT Analysis',
  
  // Marketing Strategy subsections
  branding: 'Branding Strategy',
  pricing: 'Pricing Strategy',
  promotion: 'Promotion Plan',
  salesStrategy: 'Sales Strategy',
  channels: 'Distribution Channels',
  customerRetention: 'Customer Retention',
  
  // Operations Plan subsections
  businessModel: 'Business Model',
  facilities: 'Facilities & Location',
  technology: 'Technology Requirements',
  productionProcess: 'Production Process',
  qualityControl: 'Quality Control',
  logistics: 'Logistics & Supply Chain',
  
  // Organization & Management subsections
  structure: 'Organizational Structure',
  hrPlan: 'HR Plan',
  advisors: 'Advisors & Board',
  governance: 'Governance Structure',
  
  // Financial Plan subsections
  projections: 'Financial Projections',
  fundingNeeds: 'Funding Requirements',
  useOfFunds: 'Use of Funds',
  breakEvenAnalysis: 'Break-Even Analysis',
  exitStrategy: 'Exit Strategy'
};

// Map section IDs to display names
const SECTION_NAMES: Record<string, string> = {
  executiveSummary: 'Executive Summary',
  companyDescription: 'Company Description',
  productsAndServices: 'Products & Services',
  marketAnalysis: 'Market Analysis',
  marketingStrategy: 'Marketing Strategy',
  operationsPlan: 'Operations Plan',
  organizationAndManagement: 'Organization & Management',
  financialPlan: 'Financial Plan'
};

/**
 * Business Plan AI Assistant Component
 * 
 * A reusable chat interface that provides context-specific AI assistance
 * for each section of the business plan.
 * Designed to work in a fixed sidebar layout.
 */
export default function BusinessPlanAIAssistant({
  businessPlanId,
  sectionId,
  sectionName,
  className = '',
  collapsed = false,
  businessPlan,
  onApplySuggestion,
  onSectionChange
}: BusinessPlanAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(!collapsed)
  const [inputValue, setInputValue] = useState('')
  const [showSectionPrompt, setShowSectionPrompt] = useState(false)
  const [lastAppliedSuggestion, setLastAppliedSuggestion] = useState<{fieldId: string, content: string} | null>(null)
  const [currentSubfield, setCurrentSubfield] = useState<string | null>(null)
  const [showSectionNav, setShowSectionNav] = useState(false)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  
  // Create a ref for the messages container to enable auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  // Get current section data if available
  const currentSectionData = businessPlan?.content?.[sectionId] || {};
  
  const { 
    messages, 
    isLoading, 
    sendMessage,
    clearConversation,
    fieldSuggestions,
    applySuggestion,
    setMessages
  } = useBusinessPlanAI(businessPlanId, sectionId, (fieldId, content) => {
    if (onApplySuggestion) {
      onApplySuggestion(fieldId, content);
      setLastAppliedSuggestion({ fieldId, content });
      setCurrentSubfield(fieldId);
      setShowSectionPrompt(true);
    }
  })
  
  // Initialize the conversation with context if there's existing data and no messages yet
  useEffect(() => {
    if (messages.length === 0 && Object.keys(currentSectionData).length > 0) {
      // Filter out empty values and create formatted data summary
      const existingData = Object.entries(currentSectionData)
        .filter(([key, value]) => value && typeof value === 'string' && value.trim() !== '')
        .map(([key, value]) => {
          const fieldName = SUBFIELD_NAMES[key] || key;
          return `**${fieldName}**: ${typeof value === 'string' ? value.substring(0, 150) + (value.length > 150 ? '...' : '') : JSON.stringify(value)}`;
        });
      
      if (existingData.length > 0) {
        // Create a more distinctive initial message
        const initialMessage: ChatMessage = {
          role: 'assistant',
          content: `📋 **I've analyzed your existing ${sectionName} content:**\n\n${existingData.join('\n\n')}\n\n💡 How would you like to improve or expand on this content? I can help refine specific sections or suggest additions.`
        };
        
        // Use a custom initial message instead of sending an actual AI request
        setTimeout(() => {
          setMessages([initialMessage]);
        }, 500);
      }
    }
  }, [sectionId, currentSectionData, messages.length, sectionName, setMessages]);
  
  // Reset section prompt when section changes
  useEffect(() => {
    setShowSectionPrompt(false);
    setLastAppliedSuggestion(null);
    setCurrentSubfield(null);
  }, [sectionId]);
  
  // Auto-scroll to bottom when messages change or during loading
  useEffect(() => {
    // Use a short timeout to ensure DOM is updated before scrolling
    const scrollTimer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(scrollTimer);
  }, [messages, isLoading, fieldSuggestions, showSectionPrompt, showSectionNav]);
  
  /**
   * Scroll to the bottom of the messages container
   */
  const scrollToBottom = () => {
    // Try to scroll messagesEndRef into view first
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } 
    // Fallback: directly scroll the container to the bottom
    else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };
  
  /**
   * Get suggested prompts based on section
   */
  const getSuggestedPrompts = () => {
    // All help questions removed at client's request
    const suggestionMap: Record<string, string[]> = {
      executiveSummary: [],
      companyDescription: [],
      productsAndServices: [],
      marketAnalysis: [],
      marketingStrategy: [],
      operationsPlan: [],
      organizationAndManagement: [],
      financialPlan: []
    }
    
    // Return empty array for any section
    return []
  }
  
  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return
    
    // Debug logging to verify data
    console.log('[BusinessPlanAI] Sending message with section data:', {
      sectionId,
      dataAvailable: Object.keys(currentSectionData).length > 0,
      keys: Object.keys(currentSectionData)
    });
    
    // Send the message with current section data
    sendMessage(inputValue, currentSectionData)
    setInputValue('')
    
    // Hide the section prompt if it was showing
    setShowSectionPrompt(false)
    
    // Reset the section navigation state
    if (showSectionNav) {
      setShowSectionNav(false)
      setSelectedSection(null)
    }
    
    // Force scroll after sending message
    setTimeout(scrollToBottom, 100)
    
    // Maintain focus on the textarea
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }
  
  /**
   * Handle clicking on a suggested prompt
   */
  const handleSuggestionClick = (suggestion: string) => {
    // Send the suggestion as a message with current section data
    sendMessage(suggestion, currentSectionData)
    
    // Hide the section prompt if it was showing
    setShowSectionPrompt(false)
    
    // Reset section navigation if open
    setShowSectionNav(false)
    
    // Force scroll after state updates
    setTimeout(scrollToBottom, 100)
  }
  
  /**
   * Handle applying a suggestion to a form field
   */
  const handleApplySuggestion = (fieldId: string, content: string) => {
    // Handle the case when the fieldId is generic 'content'
    let targetFieldId = fieldId;
    
    // For generic 'content' suggestions, use the currently selected field if available
    if (targetFieldId === 'content') {
      if (currentSubfield) {
        targetFieldId = currentSubfield;
        console.log(`[Apply Suggestion] Using current subfield (${currentSubfield}) for content suggestion`);
      } else {
        // Default to a section-specific field if no current subfield
        if (sectionId === 'executiveSummary') {
          targetFieldId = 'businessConcept';
        } else {
          // Use first subfield of current section
          const firstSubfield = SECTION_SUBSECTIONS[sectionId]?.[0];
          if (firstSubfield) {
            targetFieldId = firstSubfield;
          }
        }
        console.log(`[Apply Suggestion] No current subfield, defaulting to ${targetFieldId}`);
      }
    }
    
    // Log the field that we're applying this suggestion to
    console.log(`[Apply Suggestion] Applying suggestion to field: ${targetFieldId}`);
    
    // Apply the suggestion to the specified field
    applySuggestion(targetFieldId, content);
    
    // Set the current subfield to track what we just applied
    setCurrentSubfield(targetFieldId);
    setLastAppliedSuggestion({ fieldId: targetFieldId, content });
    
    // Show section prompt AND section navigation
    setShowSectionPrompt(true);
    setShowSectionNav(true);
    setSelectedSection(null); // Show top-level sections
    
    // Force scroll after applying suggestion since it will show section prompt
    setTimeout(scrollToBottom, 150);
  }
  
  /**
   * Get the next section ID based on current section
   */
  const getNextSectionId = (currentSectionId: string): string | null => {
    const currentIndex = SECTION_ORDER.indexOf(currentSectionId);
    if (currentIndex < 0 || currentIndex >= SECTION_ORDER.length - 1) {
      return null;
    }
    return SECTION_ORDER[currentIndex + 1];
  }
  
  /**
   * Handle navigation to the next section
   */
  const handleMoveToNextSection = () => {
    if (!onSectionChange) return;
    
    const nextSectionId = getNextSectionId(sectionId);
    if (nextSectionId) {
      onSectionChange(nextSectionId);
      sendMessage(`Let's move on to the ${SECTION_NAMES[nextSectionId]} section.`);
    } else {
      sendMessage("Great job! You've completed all sections of your business plan.");
    }
    setShowSectionPrompt(false);
    // Force scroll after section change
    setTimeout(scrollToBottom, 100)
  }
  
  /**
   * Handle staying on the current section
   */
  const handleStayOnCurrentSection = () => {
    sendMessage("Let's continue working on this section.");
    setShowSectionPrompt(false);
    // Force scroll after adding new message
    setTimeout(scrollToBottom, 100)
  }
  
  /**
   * Get the next subfield ID based on current subfield
   */
  const getNextSubfield = (currentFieldId: string): string | null => {
    const subsections = SECTION_SUBSECTIONS[sectionId];
    if (!subsections) return null;
    
    const currentIndex = subsections.indexOf(currentFieldId);
    if (currentIndex < 0 || currentIndex >= subsections.length - 1) {
      return null;
    }
    return subsections[currentIndex + 1];
  }
  
  /**
   * Render section/field navigation prompt after applying a suggestion
   */
  const renderSectionNavigationPrompt = () => {
    // Get the last message to analyze
    const lastMessage = messages[messages.length - 1];
    const lastMessageIsAssistant = lastMessage?.role === 'assistant';
    
    // Only show the prompt after an assistant message
    if (!lastMessageIsAssistant || !showSectionPrompt) {
      return null;
    }
    
    // Get the name for the current field if set
    const currentFieldName = currentSubfield ? SUBFIELD_NAMES[currentSubfield] || currentSubfield : null;
    
    return (
      <div className="mt-2 border-t border-gray-200 pt-2">
        <div className="text-xs text-gray-600 mb-1">
          {currentFieldName 
            ? `Updated: ${currentFieldName}` 
            : 'Section updated successfully'}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleStayOnCurrentSection}
            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 p-1 rounded-md text-xs"
          >
            Continue with current field
          </button>
          
          {showSectionNav ? (
            <button
              onClick={() => setShowSectionNav(false)}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 p-1 rounded-md text-xs"
            >
              Hide section menu
            </button>
          ) : (
            <button
              onClick={() => {
                setShowSectionNav(true);
                setSelectedSection(null);
              }}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 p-1 rounded-md text-xs"
            >
              Select different section
            </button>
          )}
        </div>
      </div>
    );
  };
  
  /**
   * Render field suggestions if available
   */
  const renderFieldSuggestions = () => {
    console.log(`[Suggestions Debug] All suggestions:`, fieldSuggestions);
    console.log(`[Suggestions Debug] Current subfield:`, currentSubfield);
    
    if (fieldSuggestions.length === 0) {
      console.log('[Suggestions Debug] No suggestions available');
      return null;
    }
    
    // Map suggestions to specific fields based on content or current context
    let mappedSuggestions = fieldSuggestions.map(suggestion => {
      // If the fieldId is generic 'content', try to map it to a specific field
      if (suggestion.fieldId === 'content') {
        // If we have a current subfield, use that instead of generic 'content'
        const targetField = currentSubfield || (
          // Default to specific fields based on section
          sectionId === 'executiveSummary' ? 'businessConcept' : sectionId
        );
        
        return {
          ...suggestion,
          displayFieldId: targetField
        };
      }
      
      // Otherwise keep the original fieldId
      return {
        ...suggestion,
        displayFieldId: suggestion.fieldId
      };
    });
    
    console.log(`[Suggestions Debug] Mapped ${mappedSuggestions.length} suggestions`);
    
    return (
      <div className="mt-4 border-t border-gray-200 pt-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <ChevronRight className="h-4 w-4 mr-1" />
          Suggested content to apply:
        </h4>
        
        {/* Field selector dropdown for better targeting */}
        <div className="mb-3">
          <label htmlFor="fieldSelector" className="block text-xs text-gray-600 mb-1">
            Select target field:
          </label>
          <select 
            id="fieldSelector"
            value={currentSubfield || ''}
            onChange={(e) => {
              const newFieldId = e.target.value;
              if (newFieldId) {
                setCurrentSubfield(newFieldId);
                console.log(`[Field Selector] User selected: ${newFieldId}`);
              } else {
                setCurrentSubfield(null);
                console.log(`[Field Selector] User cleared selection`);
              }
            }}
            className="w-full text-sm p-1 border border-gray-300 rounded"
          >
            <option value="">Choose target field...</option>
            {SECTION_SUBSECTIONS[sectionId]?.map(fieldId => (
              <option key={fieldId} value={fieldId}>
                {SUBFIELD_NAMES[fieldId]}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          {mappedSuggestions.map((suggestion, index) => {
            // Get the display field name from the suggestion's fieldId
            const displayFieldId = suggestion.displayFieldId;
            const fieldName = SUBFIELD_NAMES[displayFieldId] || displayFieldId;
            
            return (
              <div key={index} className="rounded-md border border-blue-100 bg-blue-50 p-3">
                <div className="text-sm text-blue-700 mb-1 font-medium">
                  {/* Show which field this will apply to */}
                  Suggestion for: {fieldName}
                </div>
                <div className="text-sm text-gray-700 mb-2">{suggestion.content}</div>
                <button
                  onClick={() => handleApplySuggestion(displayFieldId, suggestion.content)}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                >
                  Apply to {fieldName}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  /**
   * Toggle section navigation visibility
   */
  const handleShowSectionNav = () => {
    setShowSectionNav(!showSectionNav)
    setSelectedSection(null)
    setShowSectionPrompt(false)
  }
  
  /**
   * Navigate to a specific section/subsection
   */
  const handleNavigateToSection = (sectId: string, subsection?: string) => {
    if (!onSectionChange) return
    
    // Clear previous state
    setCurrentSubfield(null);
    
    onSectionChange(sectId)
    
    if (subsection) {
      const subfieldName = SUBFIELD_NAMES[subsection] || subsection
      
      // Set the current subfield with explicit logging
      console.log(`[Navigation] Setting current subfield to: "${subsection}" (${subfieldName})`);
      setCurrentSubfield(subsection);
      
      sendMessage(`Let's work on the ${SECTION_NAMES[sectId]} section, specifically the ${subfieldName} part.`)
    } else {
      console.log(`[Navigation] Clearing current subfield (working on whole section)`);
      setCurrentSubfield(null);
      
      sendMessage(`Let's work on the ${SECTION_NAMES[sectId]} section.`)
    }
    
    setShowSectionNav(false)
    setSelectedSection(null)
    // Force scroll after navigation
    setTimeout(scrollToBottom, 100)
  }
  
  /**
   * Render section navigation UI
   */
  const renderSectionNavigation = () => {
    return (
      <div className="mt-2">
        <h4 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
          <ChevronRight className="h-3 w-3 mr-1" />
          {selectedSection ? 'Choose a subsection:' : 'Select section to work on:'}
        </h4>
        <div className="space-y-1">
          {selectedSection ? (
            // Show subsections of selected section
            <>
              <div className="mb-1 flex items-center">
                <button 
                  onClick={() => setSelectedSection(null)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-1 py-0.5 rounded mr-1 flex items-center"
                >
                  <ArrowRight className="h-3 w-3 rotate-180 mr-0.5" />
                  Back
                </button>
                <span className="text-xs font-medium">{SECTION_NAMES[selectedSection]} subsections:</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {SECTION_SUBSECTIONS[selectedSection]?.map(subsection => (
                  <button
                    key={subsection}
                    onClick={() => handleNavigateToSection(selectedSection, subsection)}
                    className="text-left p-1 border border-gray-200 rounded hover:bg-blue-50 text-xs text-gray-700"
                  >
                    {SUBFIELD_NAMES[subsection] || subsection.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </button>
                ))}
              </div>
            </>
          ) : (
            // Show all top-level sections
            <div className="grid grid-cols-2 gap-1">
              {SECTION_ORDER.map(sectionId => (
                <button
                  key={sectionId}
                  onClick={() => setSelectedSection(sectionId)}
                  className={`text-left p-1 border rounded text-xs ${
                    sectionId === selectedSection 
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {SECTION_NAMES[sectionId]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // When component initializes, set showSectionNav to true when in empty state
  useEffect(() => {
    // Initialize section navigation to true in empty state
    if (messages.length === 0) {
      setShowSectionNav(true);
    }
  }, [messages.length]);
  
  // Add a manual scroll trigger when section navigation is toggled
  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      scrollToBottom();
    }, 150); // Slightly longer delay for section navigation which adds more content
    
    return () => clearTimeout(scrollTimer);
  }, [showSectionNav, selectedSection]);
  
  // Create a ref for the textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // If collapsed, show only the button to open
  if (!isOpen) {
    return (
      <div className="sticky top-4 right-4 z-10 flex justify-end">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Open AI Assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      </div>
    )
  }
  
  return (
    <div className={`flex flex-col border border-gray-200 rounded-lg bg-white shadow-md h-full ${className}`}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 flex justify-between items-center sticky top-0 z-10">
        <h3 className="font-medium flex items-center">
          <Lightbulb className="h-5 w-5 mr-2" />
          AI Assistant: {sectionName}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleShowSectionNav}
            className="text-white hover:text-blue-200 transition-colors"
            aria-label="Navigate to section"
            title="Navigate to section"
          >
            <BookOpen className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-blue-200 transition-colors"
            aria-label="Close AI Assistant"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Messages Container - Fixed height with overflow scroll */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`max-w-[85%] ${message.role === 'assistant' ? 'ml-0 mr-auto' : 'ml-auto mr-0'}`}>
            <div 
              className={`rounded-lg p-3 ${
                message.role === 'assistant' 
                  ? 'bg-white border border-gray-200' 
                  : 'bg-blue-600 text-white'
              }`}
            >
              <div className="prose max-w-none text-sm whitespace-pre-wrap break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />,
                    p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />,
                    ul: ({node, ...props}) => <ul {...props} className="list-disc pl-4 mb-2" />,
                    ol: ({node, ...props}) => <ol {...props} className="list-decimal pl-4 mb-2" />,
                    li: ({node, ...props}) => <li {...props} className="mb-1" />
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        
        {/* Render suggestion options if available */}
        {renderFieldSuggestions()}
        
        {/* Render section prompt */}
        {renderSectionNavigationPrompt()}
        
        {/* Render section navigation if activated */}
        {showSectionNav && renderSectionNavigation()}
        
        {/* Show loader when waiting for response */}
        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <div className="w-6 h-6 rounded-full border-2 border-t-blue-500 border-r-blue-500 border-b-gray-200 border-l-gray-200 animate-spin"></div>
            <span>Thinking...</span>
          </div>
        )}
        
        {/* Invisible element for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 sticky bottom-0 bg-white z-10">
        <div className="flex items-center">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask for guidance..."
            disabled={isLoading}
            className="flex-grow py-2 px-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[60px] resize-y"
            onKeyDown={(e) => {
              // Submit on Enter without Shift key
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 text-white py-2 px-4 rounded-r-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 h-[60px]"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="flex justify-between items-center text-xs mt-1">
          <div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearConversation}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear conversation
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleShowSectionNav}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <BookOpen className="h-3 w-3 mr-1" /> 
            {showSectionNav ? 'Hide section navigation' : 'Show section navigation'}
          </button>
        </div>
      </form>
    </div>
  )
} 