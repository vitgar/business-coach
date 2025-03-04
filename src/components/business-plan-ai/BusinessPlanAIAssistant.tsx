'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, X, Lightbulb, MessageSquare, Clipboard, ArrowDown, ArrowRight, ChevronRight, BookOpen } from 'lucide-react'
import { useBusinessPlanAI, ChatMessage, FieldSuggestion } from '@/hooks/useBusinessPlanAI'

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
    applySuggestion(fieldId, content)
    // Force scroll after applying suggestion since it will show section prompt
    setTimeout(scrollToBottom, 150)
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
   * Render section navigation prompt
   */
  const renderSectionNavigationPrompt = () => {
    if (!showSectionPrompt || !currentSubfield) return null;
    
    // Check if there's a next subfield in the current section
    const nextSubfield = getNextSubfield(currentSubfield);
    const nextSubfieldName = nextSubfield ? SUBFIELD_NAMES[nextSubfield] : null;
    
    // If no next subfield, consider next major section
    const nextSectionId = nextSubfield ? null : getNextSectionId(sectionId);
    const nextSectionName = nextSectionId ? SECTION_NAMES[nextSectionId] : null;
    
    return (
      <div className="mt-4 border-t border-gray-200 pt-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <ChevronRight className="h-4 w-4 mr-1" />
          Great! Where would you like to go next?
        </h4>
        <div className="space-y-2">
          {nextSubfieldName && (
            <button
              onClick={() => {
                setShowSectionPrompt(false);
                sendMessage(`Let's work on the ${nextSubfieldName} field now.`);
              }}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 p-2 rounded-md text-sm flex items-center justify-between"
            >
              <span>Continue with {nextSubfieldName}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          
          {nextSectionName && (
            <button
              onClick={handleMoveToNextSection}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 p-2 rounded-md text-sm flex items-center justify-between"
            >
              <span>Move to {nextSectionName} section</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={handleStayOnCurrentSection}
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 p-2 rounded-md text-sm"
          >
            Continue working on current field
          </button>
          
          <div className="mt-2">
            <div className="text-xs text-gray-500 mb-1">Or select a specific field:</div>
            <div className="grid grid-cols-1 gap-1">
              {SECTION_SUBSECTIONS[sectionId]?.map(fieldId => (
                <button
                  key={fieldId}
                  onClick={() => {
                    setShowSectionPrompt(false);
                    sendMessage(`Let's work on the ${SUBFIELD_NAMES[fieldId]} field now.`);
                  }}
                  className={`text-xs p-1 rounded text-left ${
                    fieldId === currentSubfield 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {SUBFIELD_NAMES[fieldId]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  /**
   * Render field suggestions if available
   */
  const renderFieldSuggestions = () => {
    if (fieldSuggestions.length === 0) return null;
    
    return (
      <div className="mt-4 border-t border-gray-200 pt-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <ChevronRight className="h-4 w-4 mr-1" />
          Suggested content to apply:
        </h4>
        <div className="space-y-2">
          {fieldSuggestions.map((suggestion, index) => (
            <div key={index} className="rounded-md border border-blue-100 bg-blue-50 p-3">
              <div className="text-sm text-blue-700 mb-1 font-medium">
                {SUBFIELD_NAMES[suggestion.fieldId] || suggestion.fieldId}
              </div>
              <div className="text-sm text-gray-700 mb-2">{suggestion.content}</div>
              <button
                onClick={() => handleApplySuggestion(suggestion.fieldId, suggestion.content)}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
              >
                Apply to field
              </button>
            </div>
          ))}
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
    
    onSectionChange(sectId)
    
    if (subsection) {
      const subfieldName = SUBFIELD_NAMES[subsection] || subsection
      sendMessage(`Let's work on the ${SECTION_NAMES[sectId]} section, specifically the ${subfieldName} part.`)
    } else {
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
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <ChevronRight className="h-4 w-4 mr-1" />
          {selectedSection ? 'Choose a subsection:' : 'Choose a section to work on:'}
        </h4>
        <div className="space-y-3">
          {selectedSection ? (
            // Show subsections of selected section
            <>
              <div className="mb-2 flex items-center">
                <button 
                  onClick={() => setSelectedSection(null)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded mr-2 flex items-center"
                >
                  <ArrowRight className="h-3 w-3 rotate-180 mr-1" />
                  Back
                </button>
                <span className="text-sm font-medium">{SECTION_NAMES[selectedSection]} subsections:</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {SECTION_SUBSECTIONS[selectedSection]?.map(subsection => (
                  <button
                    key={subsection}
                    onClick={() => handleNavigateToSection(selectedSection, subsection)}
                    className="text-left p-2 border border-gray-200 rounded hover:bg-blue-50 text-sm text-gray-700"
                  >
                    {SUBFIELD_NAMES[subsection] || subsection.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </button>
                ))}
              </div>
            </>
          ) : (
            // Show all available sections
            <div className="grid grid-cols-1 gap-1">
              {SECTION_ORDER.map(section => (
                <button
                  key={section}
                  onClick={() => {
                    if (SECTION_SUBSECTIONS[section]?.length > 0) {
                      setSelectedSection(section)
                    } else {
                      handleNavigateToSection(section)
                    }
                  }}
                  className={`text-left p-2 border rounded flex justify-between items-center ${
                    section === sectionId 
                      ? 'bg-blue-100 text-blue-700 border-blue-200' 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{SECTION_NAMES[section]}</span>
                  {SECTION_SUBSECTIONS[section]?.length > 0 && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
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
      <div 
        ref={messagesContainerRef}
        className="flex-grow p-3 overflow-y-auto h-[calc(100%-120px)] space-y-4 scrollbar-thin"
        style={{ 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 220px)'  // Ensure it doesn't grow too large
        }}
      >
        <div className="flex-grow">
          {messages.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {/* Message icon and header text removed from all sections */}
              {/* Only render buttons container if there are prompts (there shouldn't be any now) */}
              {getSuggestedPrompts().length > 0 && (
                <div className="mt-4 space-y-2">
                  {getSuggestedPrompts().map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(prompt)}
                      className="w-full text-left p-2 border border-gray-200 rounded hover:bg-gray-50 text-sm text-gray-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Show section navigation directly in empty state */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                {renderSectionNavigation()}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-blue-100 text-blue-900 ml-auto'
                      : 'bg-gray-100 text-gray-800'
                  } ${index > 0 ? 'mt-2' : ''}`}
                >
                  {message.content}
                  {message.role === 'assistant' && index === messages.length - 1 && (
                    <>
                      {renderFieldSuggestions()}
                      {showSectionPrompt && renderSectionNavigationPrompt()}
                    </>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="bg-gray-100 text-gray-800 p-2 rounded-lg max-w-[85%] mt-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-200"></div>
                  </div>
                </div>
              )}
              
              {/* Show section navigation if enabled */}
              {showSectionNav && (
                <div className="mt-4 border-t border-gray-200 pt-3">
                  {renderSectionNavigation()}
                </div>
              )}
              
              {/* Invisible element at the bottom for auto-scrolling */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
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