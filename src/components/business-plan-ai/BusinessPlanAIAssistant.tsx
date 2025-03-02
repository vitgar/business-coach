'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, X, Lightbulb, MessageSquare, Clipboard, ArrowDown, ArrowRight, ChevronRight } from 'lucide-react'
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
  companyDescription: ['businessStructure', 'legalStructure', 'companyHistory'],
  // Add subsections for other sections as needed
};

// Map subfield IDs to display names
const SUBFIELD_NAMES: Record<string, string> = {
  businessConcept: 'Business Concept',
  missionStatement: 'Mission Statement',
  productsOverview: 'Products/Services Overview',
  marketOpportunity: 'Market Opportunity',
  financialHighlights: 'Financial Highlights',
  businessStructure: 'Business Structure',
  legalStructure: 'Legal Structure Details',
  companyHistory: 'Company History',
  // Add names for other fields as needed
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
  onApplySuggestion,
  onSectionChange
}: BusinessPlanAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(!collapsed)
  const [inputValue, setInputValue] = useState('')
  const [showSectionPrompt, setShowSectionPrompt] = useState(false)
  const [lastAppliedSuggestion, setLastAppliedSuggestion] = useState<{fieldId: string, content: string} | null>(null)
  const [currentSubfield, setCurrentSubfield] = useState<string | null>(null)
  
  // Create a ref for the messages container to enable auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearConversation,
    fieldSuggestions,
    applySuggestion
  } = useBusinessPlanAI(businessPlanId, sectionId, (fieldId, content) => {
    if (onApplySuggestion) {
      onApplySuggestion(fieldId, content);
      setLastAppliedSuggestion({ fieldId, content });
      setCurrentSubfield(fieldId);
      setShowSectionPrompt(true);
    }
  })
  
  // Reset section prompt when section changes
  useEffect(() => {
    setShowSectionPrompt(false);
    setLastAppliedSuggestion(null);
    setCurrentSubfield(null);
  }, [sectionId]);
  
  // Auto-scroll to bottom when messages change or during loading
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, fieldSuggestions, showSectionPrompt]);
  
  /**
   * Scroll to the bottom of the messages container
   */
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  /**
   * Get suggested prompts based on section
   */
  const getSuggestedPrompts = () => {
    const suggestionMap: Record<string, string[]> = {
      executiveSummary: [
        "How do I write a compelling business summary?",
        "What should I include in my mission statement?",
        "Help me highlight my business value proposition"
      ],
      companyDescription: [
        "What should I include in my company background?",
        "How do I articulate my company's mission and vision?",
        "Help me describe my company's legal structure"
      ],
      productsAndServices: [
        "How should I describe my product's features and benefits?",
        "What makes a strong value proposition?",
        "Help me explain my competitive advantage"
      ],
      marketAnalysis: [
        "How do I identify my target market?",
        "What should my competitor analysis include?",
        "Help me analyze market trends for my industry"
      ],
      marketingStrategy: [
        "What marketing channels should I consider?",
        "How do I develop a pricing strategy?",
        "Help me create a customer acquisition plan"
      ],
      operationsPlan: [
        "What should I include in my operations workflow?",
        "How do I describe my supply chain?",
        "Help me outline my quality control process"
      ],
      organizationAndManagement: [
        "How should I structure my management team?",
        "What roles are critical for my business?",
        "Help me create an organizational chart"
      ],
      financialPlan: [
        "What financial projections should I include?",
        "How do I calculate my startup costs?",
        "Help me create a break-even analysis"
      ]
    }
    
    return suggestionMap[sectionId] || [
      "Help me write this section",
      "What should I include here?",
      "Give me examples for this section"
    ]
  }
  
  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim())
      setInputValue('')
      setShowSectionPrompt(false)
    }
  }
  
  /**
   * Handle clicking a suggestion prompt
   */
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
    setShowSectionPrompt(false)
  }
  
  /**
   * Handle applying a suggestion to a form field
   */
  const handleApplySuggestion = (fieldId: string, content: string) => {
    applySuggestion(fieldId, content)
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
  }
  
  /**
   * Handle staying on the current section
   */
  const handleStayOnCurrentSection = () => {
    sendMessage("Let's continue working on this section.");
    setShowSectionPrompt(false);
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
          <Clipboard className="h-4 w-4 mr-1" />
          Suggestions Available
        </h4>
        <div className="space-y-2">
          {fieldSuggestions.map((suggestion, index) => (
            <div key={index} className="bg-blue-50 p-2 rounded-md text-sm">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-blue-700">
                  {suggestion.fieldId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
                <button
                  onClick={() => handleApplySuggestion(suggestion.fieldId, suggestion.content)}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center min-w-[70px] justify-center"
                >
                  <ArrowDown className="h-3 w-3 mr-1" />
                  Apply
                </button>
              </div>
              <p className="text-blue-900 line-clamp-2">{suggestion.content}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
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
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-blue-200 transition-colors"
          aria-label="Close AI Assistant"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Messages Container - Fixed height with overflow scroll */}
      <div 
        ref={messagesContainerRef}
        className="flex-grow p-3 overflow-y-auto h-[calc(100%-120px)] space-y-4 scrollbar-thin"
        style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex-grow">
          {messages.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ask for help with your {sectionName.toLowerCase()}</p>
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
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-blue-100 text-blue-900 ml-auto'
                      : 'bg-gray-100 text-gray-800'
                  }`}
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
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg max-w-[85%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-200"></div>
                  </div>
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
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask for guidance..."
            disabled={isLoading}
            className="flex-grow py-2 px-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 text-white py-2 px-4 rounded-r-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        {messages.length > 0 && (
          <div className="text-xs text-right mt-1">
            <button
              type="button"
              onClick={clearConversation}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear conversation
            </button>
          </div>
        )}
      </form>
    </div>
  )
} 