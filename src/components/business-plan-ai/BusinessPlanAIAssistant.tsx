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
    
    // Create a more comprehensive context object with relevant data from other sections
    const contextData: Record<string, any> = {
      currentSection: {
        ...currentSectionData
      }
    };
    
    // Add cross-sectional context for specific section relationships
    if (sectionId === 'companyDescription' && currentSubfield === 'legalStructure') {
      // When working on Legal Structure, include the Business Structure information
      const businessStructureData = businessPlan?.content?.companyDescription?.businessStructure;
      if (businessStructureData) {
        contextData.relatedSections = {
          businessStructure: businessStructureData
        };
        console.log('[Context] Adding Business Structure data to Legal Structure context');
      }
    }
    
    // Debug logging to verify data
    console.log('[BusinessPlanAI] Sending message with section data:', {
      sectionId,
      currentSubfield,
      dataAvailable: Object.keys(contextData).length > 0,
      contextKeys: Object.keys(contextData)
    });
    
    // Send the message with enriched context data
    sendMessage(inputValue, contextData)
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
   * Handle suggestion click
   */
  const handleSuggestionClick = (suggestion: string) => {
    // Check if the suggestion includes working on a specific field
    if (suggestion.toLowerCase().includes("let's work on") || 
        suggestion.toLowerCase().includes("specifically")) {
      
      // Try to detect which subfield is being requested
      const subfieldMatch = SECTION_SUBSECTIONS[sectionId]?.find(subfieldId => 
        suggestion.toLowerCase().includes(SUBFIELD_NAMES[subfieldId]?.toLowerCase() || subfieldId.toLowerCase())
      );
      
      if (subfieldMatch) {
        console.log(`[Navigation] Detected work request for subfield: ${subfieldMatch}`);
        setCurrentSubfield(subfieldMatch);
      }
    }
    
    // Send the suggestion as a message with current section data
    const contextData: Record<string, any> = {
      currentSection: {
        ...currentSectionData
      }
    };
    
    // Add related sections data if working on Legal Structure
    if (suggestion.toLowerCase().includes("legal structure") && 
        businessPlan?.content?.companyDescription?.businessStructure) {
      contextData.relatedSections = {
        businessStructure: businessPlan.content.companyDescription.businessStructure
      };
      console.log('[Context] Adding Business Structure data for Legal Structure request');
    }
    
    sendMessage(suggestion, contextData);
    
    // Hide the section prompt if it was showing
    setShowSectionPrompt(false);
    
    // Reset section navigation if open
    setShowSectionNav(false);
    
    // Force scroll after state updates
    setTimeout(scrollToBottom, 100);
  }
  
  /**
   * Handle applying a suggestion to a form field
   */
  const handleApplySuggestion = (fieldId: string, content: string) => {
    // CRITICAL: ONLY apply to the current field the user is working on
    // Ignore the provided fieldId and ALWAYS use currentSubfield
    if (!currentSubfield) {
      console.error("[CRITICAL ERROR] Cannot apply suggestion - no current field selected");
      return; // Prevent application if no field is selected
    }
    
    // Always use the current subfield - NO EXCEPTIONS
    const targetFieldId = currentSubfield;
    
    // Log the field that we're applying this suggestion to
    console.log(`[Apply Suggestion] ONLY applying to current field: ${targetFieldId}`);
    
    // Apply the suggestion to the specified field
    applySuggestion(targetFieldId, content);
    
    // Set the current subfield to track what we just applied
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
        <div className="text-sm text-gray-600 mb-1">
          {currentFieldName 
            ? `Updated: ${currentFieldName}` 
            : 'Section updated successfully'}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleStayOnCurrentSection}
            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 p-2 rounded-md text-sm"
          >
            Continue with current field
          </button>
          
          {showSectionNav ? (
            <button
              onClick={() => setShowSectionNav(false)}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 p-2 rounded-md text-sm"
            >
              Hide section menu
            </button>
          ) : (
            <button
              onClick={() => {
                setShowSectionNav(true);
                setSelectedSection(null);
              }}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 p-2 rounded-md text-sm"
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
    
    // CRITICAL: Only show suggestions for the EXACT field the user is working on
    // If no current subfield is selected, force user to select one first
    if (!currentSubfield) {
      return (
        <div className="mt-4 border-t border-gray-200 pt-3">
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Please select a specific field to apply suggestions:
          </h4>
          
          <div className="mb-4">
            <select 
              id="fieldSelector"
              value=""
              onChange={(e) => {
                const newFieldId = e.target.value;
                if (newFieldId) {
                  setCurrentSubfield(newFieldId);
                  console.log(`[Field Selection Required] User selected: ${newFieldId}`);
                }
              }}
              className="w-full text-md p-2 border border-gray-300 rounded"
            >
              <option value="">Choose a field...</option>
              {SECTION_SUBSECTIONS[sectionId]?.map(fieldId => (
                <option key={fieldId} value={fieldId}>
                  {SUBFIELD_NAMES[fieldId]}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }
    
    // ONLY show suggestions for the EXACT current field - no exceptions
    // No mapping or content detection is used - STRICTLY use currentSubfield
    
    // Filter suggestions to ONLY include ones that will be applied to the current field
    const currentFieldSuggestions = fieldSuggestions.map(suggestion => ({
      ...suggestion,
      displayFieldId: currentSubfield // Force ALL suggestions to apply to current field only
    }));
    
    console.log(`[Suggestions Debug] Found ${currentFieldSuggestions.length} suggestions for current field: ${currentSubfield}`);
    
    // If we have suggestions for the current field, create a simplified UI
    if (currentFieldSuggestions.length > 0) {
      const fieldName = SUBFIELD_NAMES[currentSubfield] || currentSubfield;
      
      return (
        <div className="mt-4 border-t border-gray-200 pt-3">
          <div className="mb-3">
            <div className="text-md text-blue-700 font-medium">
              Currently working on: <span className="font-bold">{fieldName}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {currentFieldSuggestions.map((suggestion, index) => (
              <div key={index} className="rounded-md border border-blue-100 bg-blue-50 p-4">
                <div className="text-md mb-3 text-gray-800">{suggestion.content}</div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApplySuggestion(currentSubfield, suggestion.content)}
                    className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Apply Suggestion
                  </button>
                  <button
                    onClick={() => {
                      // Clear suggestion UI and continue with current field
                      setShowSectionPrompt(false);
                      setShowSectionNav(false);
                      // Send a message about continuing with this field
                      const fieldName = SUBFIELD_NAMES[currentSubfield] || currentSubfield;
                      sendMessage(`Let's continue working on the ${fieldName} field.`);
                    }}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded"
                  >
                    Continue On This Field
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return null;
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
      
      // Prepare context data with the current section data
      const contextData: Record<string, any> = {
        currentSection: businessPlan?.content?.[sectId] || {}
      };
      
      // Special handling for Legal Structure - include Business Structure data
      if (sectId === 'companyDescription' && subsection === 'legalStructure') {
        const businessStructureData = businessPlan?.content?.companyDescription?.businessStructure;
        if (businessStructureData) {
          contextData.relatedSections = {
            businessStructure: businessStructureData
          };
          console.log('[Context] Adding Business Structure data for Legal Structure navigation');
        }
      }
      
      sendMessage(`Let's work on the ${SECTION_NAMES[sectId]} section, specifically the ${subfieldName} part.`, contextData)
    } else {
      console.log(`[Navigation] Clearing current subfield (working on whole section)`);
      setCurrentSubfield(null);
      
      // Just pass the current section data without related sections
      const contextData = {
        currentSection: businessPlan?.content?.[sectId] || {}
      };
      
      sendMessage(`Let's work on the ${SECTION_NAMES[sectId]} section.`, contextData)
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
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((message, index) => (
          <div key={index} className={`max-w-[85%] ${message.role === 'assistant' ? 'ml-0 mr-auto' : 'ml-auto mr-0'}`}>
            <div 
              className={`rounded-lg p-4 ${
                message.role === 'assistant' 
                  ? 'bg-white border border-gray-200' 
                  : 'bg-blue-600 text-white'
              }`}
            >
              <div className="prose max-w-none text-base whitespace-pre-wrap break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />,
                    p: ({node, ...props}) => <p {...props} className="mb-3 last:mb-0" />,
                    ul: ({node, ...props}) => <ul {...props} className="list-disc pl-5 mb-3" />,
                    ol: ({node, ...props}) => <ol {...props} className="list-decimal pl-5 mb-3" />,
                    li: ({node, ...props}) => <li {...props} className="mb-2" />
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
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex items-start">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 min-h-[90px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="ml-2 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <Send className="h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  )
} 