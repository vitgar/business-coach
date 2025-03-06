'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, X, Lightbulb, MessageSquare, Clipboard, ArrowDown, ArrowRight, ChevronRight, BookOpen } from 'lucide-react'
import { useBusinessPlanAI, ChatMessage, FieldSuggestion } from '@/hooks/useBusinessPlanAI'

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
  // Add state for compact mode
  const [isCompactMode, setIsCompactMode] = useState(window.innerHeight < 800)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  
  // Create refs for the component
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Add resize listener for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsCompactMode(window.innerHeight < 800);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Get current section data if available
  const currentSectionData = businessPlan?.content?.[sectionId] || {};
  
  const { 
    messages, 
    setMessages,
    isLoading, 
    sendMessage,
    clearConversation,
    fieldSuggestions,
    applySuggestion,
    setFieldSuggestions
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
    // Use a short timeout to ensure DOM is updated before scrolling
    const scrollTimer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(scrollTimer);
  }, [messages, isLoading, fieldSuggestions, showSectionPrompt, showSectionNav]);
  
  // Add an effect to scroll when messages change
  useEffect(() => {
    // Only scroll if there are messages
    if (messages.length > 0) {
      console.log('[Message Update] Messages changed, scrolling to bottom');
      // Use a timeout to ensure the DOM has updated
      setTimeout(scrollToBottom, 200);
    }
  }, [messages]);
  
  // Add an effect to scroll when field suggestions change
  useEffect(() => {
    // Only scroll if there are field suggestions
    if (fieldSuggestions.length > 0) {
      console.log('[Suggestions Update] Suggestions changed, scrolling to bottom');
      // Use a timeout to ensure the DOM has updated with the new suggestions
      setTimeout(scrollToBottom, 200);
    }
  }, [fieldSuggestions]);
  
  // Add effect to scroll to the section navigation menu on initial page load
  useEffect(() => {
    // This effect runs once on component mount
    console.log('[Initial Load] Component mounted, ensuring section menu is visible');
    
    // Wait for DOM to be fully rendered
    const initialScrollTimer = setTimeout(() => {
      // If there are no messages, we're in the empty state with the section menu
      if (messages.length === 0) {
        console.log('[Initial Load] Empty state detected, scrolling to section menu');
        
        // Try to find and scroll to the section navigation
        const sectionNavElement = document.querySelector('.border-t.border-gray-200.pt-2');
        if (sectionNavElement) {
          console.log('[Initial Load] Found section navigation element, scrolling into view');
          sectionNavElement.scrollIntoView({ behavior: 'auto', block: 'center' });
        } else {
          console.log('[Initial Load] Section navigation element not found, using fallback scrolling');
          // Fallback: scroll the container to show as much content as possible
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight / 2;
          }
        }
      }
    }, 500); // Longer delay to ensure everything is rendered
    
    return () => clearTimeout(initialScrollTimer);
  }, []); // Empty dependency array means this runs once on mount
  
  /**
   * Scroll to the bottom of the messages container
   * Enhanced with multiple fallback methods to ensure reliable scrolling
   */
  const scrollToBottom = () => {
    console.log('[Scroll Debug] Attempting to scroll to bottom');
    
    // Try multiple approaches to ensure reliable scrolling
    
    // Method 1: Use the messagesEndRef if available
    if (messagesEndRef.current) {
      console.log('[Scroll Debug] Using messagesEndRef.scrollIntoView()');
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    
    // Method 2: Use the messagesContainer if available
    if (messagesContainerRef.current) {
      console.log('[Scroll Debug] Using messagesContainerRef.scrollTop');
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
    
    // Method 3: Fallback to window scrolling if all else fails
    setTimeout(() => {
      if (messagesEndRef.current) {
        console.log('[Scroll Debug] Final fallback - direct scrollIntoView');
        messagesEndRef.current.scrollIntoView({ block: 'end' });
        window.scrollTo(0, document.body.scrollHeight);
      }
    }, 100);
  };
  
  /**
   * Process chat message text to make subsection names clickable
   * This allows users to navigate directly to subsections by clicking on them in the chat
   */
  const processMessageWithSubsectionLinks = (messageText: string) => {
    // Regular expression to find subsection references with bullet points
    const subsectionPattern = /• ([^•\n]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Clone the text so we can search in it
    const text = messageText;
    
    // Look for subsection patterns in the text
    while ((match = subsectionPattern.exec(text)) !== null) {
      // Add the text before the match
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
      }
      
      // Extract the subsection name without the bullet
      const subsectionName = match[1].trim();
      
      // Find the corresponding subsection ID
      let subsectionId = null;
      for (const [id, name] of Object.entries(SUBFIELD_NAMES)) {
        if (name === subsectionName) {
          subsectionId = id;
          break;
        }
      }
      
      // If we found a matching subsection ID, make it a clickable link
      if (subsectionId) {
        // Find the parent section ID
        let parentSectionId = sectionId; // Default to current section
        for (const [sectId, subsections] of Object.entries(SECTION_SUBSECTIONS)) {
          if (subsections.includes(subsectionId)) {
            parentSectionId = sectId;
            break;
          }
        }
        
        parts.push(
          <span key={`bullet-${match.index}`}>• </span>
        );
        
        parts.push(
          <button
            key={`link-${match.index}`}
            onClick={() => handleNavigateToSection(parentSectionId, subsectionId)}
            className="inline text-blue-600 hover:underline"
          >
            {subsectionName}
          </button>
        );
      } else {
        // If no matching subsection, leave the text as-is
        parts.push(<span key={`text-${match.index}`}>{match[0]}</span>);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
    }
    
    return <>{parts}</>;
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
   * Handle applying a suggestion to a field
   */
  const handleApplySuggestion = (fieldId: string, content: string) => {
    if (!onApplySuggestion) return
    
    console.log(`[Apply Suggestion Debug] Applying suggestion to field: ${fieldId}`);
    console.log(`[Apply Suggestion Debug] Current section: ${sectionId}, Current subfield: ${currentSubfield}`);
    
    // Executive Summary field normalization
    let normalizedFieldId = fieldId;
    
    if (sectionId === 'executiveSummary') {
      const lowerId = fieldId.toLowerCase();
      
      // Business Concept normalization
      if (lowerId === 'businessconcept' || 
          lowerId === 'business concept' || 
          lowerId.includes('business') && lowerId.includes('concept')) {
        normalizedFieldId = 'businessConcept';
        console.log(`[Apply Suggestion Debug] Normalized Business Concept field ID to: ${normalizedFieldId}`);
      }
      
      // Mission Statement normalization
      else if (lowerId === 'missionstatement' || 
               lowerId === 'mission statement' || 
               (lowerId.includes('mission') && lowerId.includes('statement'))) {
        normalizedFieldId = 'missionStatement';
        console.log(`[Apply Suggestion Debug] Normalized Mission Statement field ID to: ${normalizedFieldId}`);
      }
      
      // Products Overview normalization
      else if (lowerId.includes('product') && 
               (lowerId.includes('service') || lowerId.includes('overview'))) {
        normalizedFieldId = 'productsOverview';
        console.log(`[Apply Suggestion Debug] Normalized Products Overview field ID to: ${normalizedFieldId}`);
      }
      
      // Market Opportunity normalization
      else if (lowerId === 'marketopportunity' || 
               lowerId === 'market opportunity' || 
               (lowerId.includes('market') && lowerId.includes('opportunit'))) {
        normalizedFieldId = 'marketOpportunity';
        console.log(`[Apply Suggestion Debug] Normalized Market Opportunity field ID to: ${normalizedFieldId}`);
      }
      
      // Financial Highlights normalization
      else if (lowerId === 'financialhighlights' || 
               lowerId === 'financial highlights' || 
               (lowerId.includes('financial') && lowerId.includes('highlight'))) {
        normalizedFieldId = 'financialHighlights';
        console.log(`[Apply Suggestion Debug] Normalized Financial Highlights field ID to: ${normalizedFieldId}`);
      }
      
      // If current subfield is set and fieldId is generic 'content', use the current subfield
      else if (lowerId === 'content' && currentSubfield) {
        normalizedFieldId = currentSubfield;
        console.log(`[Apply Suggestion Debug] Using current subfield ${currentSubfield} for generic content`);
      }
    }
    
    // Apply the suggestion with the normalized field ID
    onApplySuggestion(normalizedFieldId, content);
    
    // Update state tracking
    setCurrentSubfield(normalizedFieldId);
    setLastAppliedSuggestion({ fieldId: normalizedFieldId, content });
    setShowSectionPrompt(true);
    
    // Force scroll after applying suggestion
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
    if (!fieldSuggestions || fieldSuggestions.length === 0) return null
    
    console.log('[Suggestion Debug] Current subfield:', currentSubfield)
    console.log('[Suggestion Debug] Available suggestions:', fieldSuggestions.map(s => s.fieldId))
    
    /**
     * Enhanced field ID normalization with specialized Market Opportunity handling
     */
    const normalizeFieldId = (id: string): string => {
      const lowerId = id.toLowerCase();
      
      // EXECUTIVE SUMMARY FIELD MAPPINGS
      // These should follow the same pattern for all Executive Summary fields
      
      // Handle Business Concept field
      if (lowerId === 'businessconcept' || lowerId === 'business concept') {
        console.log(`[Suggestion Debug] Normalizing Business Concept field ID: ${id} -> businessConcept`);
        return 'businessConcept';
      }
      
      // Handle Mission Statement field
      if (lowerId === 'missionstatement' || lowerId === 'mission statement') {
        console.log(`[Suggestion Debug] Normalizing Mission Statement field ID: ${id} -> missionStatement`);
        return 'missionStatement';
      }
      
      // Handle Products/Services Overview field
      if (lowerId.includes('product') && 
          (lowerId.includes('service') || lowerId.includes('overview'))) {
        console.log(`[Suggestion Debug] Normalizing Products/Services field ID: ${id} -> productsOverview`);
        return 'productsOverview';
      }
      
      // Handle Market Opportunity field - using same pattern as other fields
      if (lowerId === 'marketopportunity' || 
          lowerId === 'market opportunity' || 
          (lowerId.includes('market') && lowerId.includes('opportunit'))) {
        console.log(`[Suggestion Debug] Normalizing Market Opportunity field ID: ${id} -> marketOpportunity`);
        return 'marketOpportunity';
      }
      
      // Handle Financial Highlights field
      if (lowerId === 'financialhighlights' || 
          lowerId === 'financial highlights' || 
          (lowerId.includes('financial') && lowerId.includes('highlight'))) {
        console.log(`[Suggestion Debug] Normalizing Financial Highlights field ID: ${id} -> financialHighlights`);
        return 'financialHighlights';
      }
      
      // Handle content field mapping based on context
      if (lowerId === 'content' && currentSubfield) {
        console.log(`[Suggestion Debug] Mapping generic 'content' to ${currentSubfield} based on context`);
        return currentSubfield;
      }
      
      return id;
    };
    
    // Only show suggestions for the current subfield if one is selected
    let filteredSuggestions = fieldSuggestions
    
    /**
     * MARKET OPPORTUNITY SPECIAL HANDLING
     * Check if we're in a context where we should prioritize or explicitly show Market Opportunity content
     */
    const shouldIncludeMarketOpportunity = currentSubfield === 'marketOpportunity' || 
      (sectionId === 'executiveSummary' && 
       fieldSuggestions.some(s => s.fieldId === 'marketOpportunity' || 
                                  s.fieldId === 'market opportunity' || 
                                  s.fieldId.toLowerCase().includes('market')));
    
    if (shouldIncludeMarketOpportunity) {
      console.log('[Market Opportunity Debug] Detected Market Opportunity context, prioritizing those suggestions');
      
      // If we're on Market Opportunity subfield, filter to only those suggestions
      if (currentSubfield === 'marketOpportunity') {
        const marketSuggestions = fieldSuggestions.filter(s => 
          s.fieldId === 'marketOpportunity' || 
          s.fieldId === 'market opportunity' ||
          s.fieldId.toLowerCase().includes('market') ||
          s.fieldId === 'content' // Include generic content suggestions which we'll normalize later
        );
        
        if (marketSuggestions.length > 0) {
          filteredSuggestions = marketSuggestions;
          console.log(`[Market Opportunity Debug] Filtered to ${filteredSuggestions.length} suggestions for Market Opportunity`);
        } else {
          // If no specific market suggestions, include generic content suggestions
          filteredSuggestions = fieldSuggestions.filter(s => s.fieldId === 'content');
          console.log(`[Market Opportunity Debug] No specific Market Opportunity suggestions, using ${filteredSuggestions.length} generic content suggestions`);
        }
      } 
      // Otherwise, include Market Opportunity suggestions along with others for the current subfield
      else if (currentSubfield) {
        const marketOpportunitySuggestions = fieldSuggestions.filter(s => 
          s.fieldId === 'marketOpportunity' || 
          s.fieldId === 'market opportunity' ||
          s.fieldId.toLowerCase().includes('market'));
          
        const otherSuggestions = fieldSuggestions.filter(s => {
          const normalizedSuggestionId = normalizeFieldId(s.fieldId);
          const normalizedCurrentSubfield = normalizeFieldId(currentSubfield);
          return normalizedSuggestionId === normalizedCurrentSubfield;
        });
        
        // Combine both sets, putting Market Opportunity first
        filteredSuggestions = [...marketOpportunitySuggestions, ...otherSuggestions];
        console.log(`[Market Opportunity Debug] Combined ${marketOpportunitySuggestions.length} Market Opportunity suggestions with ${otherSuggestions.length} ${currentSubfield} suggestions`);
      }
    }
    // Standard filtering logic for other contexts
    else if (currentSubfield) {
      console.log(`[Suggestion Debug] Filtering suggestions for subfield: ${currentSubfield}`)
      
      // Add enhanced debugging for field matching
      filteredSuggestions = fieldSuggestions.filter(suggestion => {
        const normalizedSuggestionId = normalizeFieldId(suggestion.fieldId);
        const normalizedCurrentSubfield = normalizeFieldId(currentSubfield);
        
        const isMatch = normalizedSuggestionId === normalizedCurrentSubfield;
        console.log(`[Suggestion Debug] Comparing ${suggestion.fieldId} (${normalizedSuggestionId}) with ${currentSubfield} (${normalizedCurrentSubfield}): ${isMatch ? 'MATCH' : 'NO MATCH'}`);
        
        return isMatch;
      });
      
      console.log(`[Suggestion Debug] Filtered to ${filteredSuggestions.length} suggestions`)
    }
    
    // Map suggestions to include displayFieldId for consistent handling
    const mappedSuggestions: ExtendedFieldSuggestion[] = filteredSuggestions.map(suggestion => {
      // First normalize the field ID if needed
      let normalizedFieldId = normalizeFieldId(suggestion.fieldId);
      
      // Special case for Market Opportunity: ensure it's properly mapped
      if (suggestion.fieldId.toLowerCase().includes('market') || 
          (currentSubfield && currentSubfield.toLowerCase().includes('market'))) {
        normalizedFieldId = 'marketOpportunity';
        console.log(`[Suggestion Mapping] Ensuring Market Opportunity is properly mapped: ${suggestion.fieldId} -> ${normalizedFieldId}`);
      }
      
      // Return the suggestion with normalized display field ID
      return {
        ...suggestion,
        displayFieldId: normalizedFieldId === 'content' ? (currentSubfield || normalizedFieldId) : normalizedFieldId
      };
    });
    
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-zinc-300">
          Suggestions
        </h4>
        <div className="space-y-2">
          {mappedSuggestions.map((suggestion, index) => {
            // Get the appropriate field ID for display and application
            let fieldIdToUse = suggestion.displayFieldId || suggestion.fieldId;
            
            // Handle special case for Market Opportunity explicitly
            if (fieldIdToUse.toLowerCase().includes('market') && 
                (fieldIdToUse.toLowerCase().includes('opportunit') || 
                 fieldIdToUse === 'market' || 
                 fieldIdToUse === 'opportunity')) {
              fieldIdToUse = 'marketOpportunity';
              console.log(`[Suggestion Rendering] Using explicit marketOpportunity ID for: ${suggestion.fieldId}`);
            }
            
            // Special case for productsOverview
            let fieldName = '';
            if (fieldIdToUse === 'productsOverview') {
              fieldName = 'Products/Services Overview';
            } else if (fieldIdToUse === 'marketOpportunity') {
              fieldName = 'Market Opportunity';
            } else {
              fieldName = SUBFIELD_NAMES[fieldIdToUse] || fieldIdToUse;
            }
            
            // Don't render suggestions that might not apply to the current context
            // (except for Market Opportunity which we handle specially)
            if (currentSubfield && 
                fieldIdToUse !== currentSubfield && 
                fieldIdToUse !== 'marketOpportunity') {
              console.log(`[Suggestion Rendering] Skipping suggestion with field ID ${fieldIdToUse} that doesn't match current subfield ${currentSubfield}`);
              return null;
            }
            
            return (
            <div key={index} className="rounded-md border border-blue-100 bg-blue-50 p-3">
              <div className="text-sm text-blue-700 mb-1 font-medium">
                  {fieldName}
              </div>
              <div className="text-sm text-gray-700 mb-2">{suggestion.content}</div>
              <button
                  onClick={() => handleApplySuggestion(fieldIdToUse, suggestion.content)}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
              >
                Apply to field
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
    
    // Log pre-navigation state
    console.log(`[Navigation Debug] PRE-NAVIGATION - Current subfield: ${currentSubfield}, Section ID: ${sectionId}`);
    console.log(`[Navigation Debug] NAVIGATING TO - Section: ${sectId}, Subsection: ${subsection || 'none'}`);
    
    // MARKET OPPORTUNITY SPECIAL HANDLING
    // Check multiple variations and patterns to ensure Market Opportunity is correctly identified
    const isMarketOpportunitySubsection = subsection && (
      // Direct match
      subsection === 'marketOpportunity' ||
      subsection === 'marketopportunity' ||
      subsection === 'Market Opportunity' ||
      
      // Content-based identification
      (subsection.toLowerCase().includes('market') && 
       (subsection.toLowerCase().includes('opportunit') || 
        subsection.toLowerCase().includes('analysis'))) ||
      
      // Partial matches
      subsection === 'market' || 
      subsection === 'opportunity'
    );
    
    // Fix for Market Opportunity field
    if (isMarketOpportunitySubsection) {
      subsection = 'marketOpportunity';
      console.log(`[Market Opportunity Debug] FIXING Market Opportunity field ID to: ${subsection}`);
    }
    // Fix for Products Services Overview field
    else if (subsection === 'Products Services Overview' || 
          subsection === 'ProductsServicesOverview' || 
          subsection === 'productsServicesOverview') {
      subsection = 'productsOverview';
      console.log(`[Navigation Debug] FIXING Products Services Overview field ID to: ${subsection}`);
    }
    
    // Clear previous state
    setCurrentSubfield(null);
    
    onSectionChange(sectId)
    
    if (subsection) {
      const subfieldName = SUBFIELD_NAMES[subsection] || subsection
      
      // Set the current subfield with explicit logging
      console.log(`[Navigation Debug] Setting current subfield to: "${subsection}" (${subfieldName})`);
      setCurrentSubfield(subsection);
      
      // Log the field map for debugging
      console.log('[Navigation Debug] Current SUBFIELD_NAMES:', SUBFIELD_NAMES);
      
      // Special handling for Market Opportunity to ensure consistent messaging to AI
      if (subsection === 'marketOpportunity') {
        console.log(`[Market Opportunity Debug] Sending specialized Market Opportunity prompt to AI`);
        sendMessage(`Let's work on the ${SECTION_NAMES[sectId]} section, specifically the Market Opportunity part.`);
      } else {
        sendMessage(`Let's work on the ${SECTION_NAMES[sectId]} section, specifically the ${subfieldName} part.`);
      }
    } else {
      console.log(`[Navigation Debug] Clearing current subfield (working on whole section)`);
      setCurrentSubfield(null);
      
      // Show subsections in the chat when a section is selected without specifying a subsection
      const subsectionList = SECTION_SUBSECTIONS[sectId] || [];
      if (subsectionList.length > 0) {
        // Format the subsections into a bulleted list for the chat
        const formattedSubsections = subsectionList
          .map(sub => `• ${SUBFIELD_NAMES[sub] || sub}`)
          .join('\n');
        
        // Send a message showing the available subsections for this section
        sendMessage(
          `Let's work on the ${SECTION_NAMES[sectId]} section. This section contains the following subsections:\n\n${formattedSubsections}\n\nWhich part would you like to focus on first?`
        );
      } else {
        // If no subsections are defined, just use the original message
        sendMessage(`Let's work on the ${SECTION_NAMES[sectId]} section.`);
      }
    }
    
    // Clear any active suggestions
    setFieldSuggestions([]);
    
    // Close section navigation after selecting a section
    setShowSectionNav(false);
    // Also reset selectedSection when navigating to a section
    setSelectedSection(null);
    
    // Log post-navigation state
    console.log(`[Navigation Debug] POST-NAVIGATION - Current subfield: ${subsection || 'none'}, Section ID: ${sectId}`);
    
    // Force scroll after state updates with longer delay to ensure UI has updated
    setTimeout(() => {
      // First try to scroll the main messages container to the bottom
      scrollToBottom();
      
      // Then make sure the content is visible by scrolling the entire chat into view
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
      
      // As a final fallback, ensure the messages end ref is in view
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
      
      console.log(`[Navigation Debug] Scrolled to bottom after section selection`);
    }, 300); // Longer delay to ensure the new content has rendered
  }
  
  /**
   * Render section navigation UI
   */
  const renderSectionNavigation = () => {
    return (
      <div className="mt-2">
        <h4 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
          <ChevronRight className="h-3 w-3 mr-1" />
          {selectedSection ? 'Choose a subsection:' : 'Choose a section to work on:'}
        </h4>
        <div className="space-y-1">
          {selectedSection ? (
            // Show subsections of selected section
            <>
              <div className="mb-1 flex items-center">
                <button 
                  onClick={() => setSelectedSection(null)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-1 py-1 rounded mr-1 flex items-center"
                >
                  <ArrowRight className="h-3 w-3 rotate-180 mr-1" />
                  Back
                </button>
                <span className="text-xs font-medium">{SECTION_NAMES[selectedSection]} subsections:</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
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
            // Show all available sections in a grid layout
            <div className="grid grid-cols-2 gap-1">
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
                  className={`text-left p-1 border rounded flex justify-between items-center text-xs ${
                    section === sectionId 
                      ? 'bg-blue-100 text-blue-700 border-blue-200' 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{SECTION_NAMES[section]}</span>
                  {SECTION_SUBSECTIONS[section]?.length > 0 && (
                    <ChevronRight className="h-3 w-3" />
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
      
      // Scroll to make section navigation visible after a slight delay
      setTimeout(() => {
        if (messagesContainerRef.current) {
          // Set initial scroll position to show the navigation menu
          messagesContainerRef.current.scrollTop = 0;
        }
      }, 50);
    }
  }, [messages.length]);
  
  // Add a manual scroll trigger when section navigation is toggled
  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      scrollToBottom();
    }, 150); // Slightly longer delay for section navigation which adds more content
    
    return () => clearTimeout(scrollTimer);
  }, [showSectionNav, selectedSection]);
  
  // Modify the render function to include the compact mode class
  return (
    <div className={`flex flex-col bg-white border rounded-lg shadow-sm ${isCompactMode ? 'compact-assistant' : ''} ${className}`}>
      {/* Add custom styles for the empty state */}
      <style jsx>{`
        .empty-state-container {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }
      `}</style>
      
      {/* Header - make more compact when in compact mode */}
      <div className={`flex items-center justify-between border-b ${isCompactMode ? 'p-2' : 'p-3'}`}>
        <div className="flex items-center">
          <MessageSquare className={`text-blue-500 ${isCompactMode ? 'h-4 w-4 mr-1' : 'h-5 w-5 mr-2'}`} />
          <h3 className={`font-medium ${isCompactMode ? 'text-sm' : 'text-base'}`}>
            AI Assistant: {sectionName}
          </h3>
        </div>
        
        <div className="flex space-x-1">
          {/* Add button to toggle compact mode */}
          <button
            onClick={() => setIsCompactMode(!isCompactMode)}
            className="text-gray-500 hover:text-gray-700 p-1"
            title={isCompactMode ? "Expand view" : "Compact view"}
          >
            {isCompactMode ? 
              <ArrowDown className="h-4 w-4" /> : 
              <ArrowRight className="h-4 w-4" />
            }
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            {isOpen ? <X className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {/* Adjust the message container max-height based on compact mode */}
      {isOpen && (
        <>
          <div 
            ref={messagesContainerRef}
            className={`flex-grow overflow-y-auto p-3 ${
              isCompactMode ? 'max-h-[350px]' : 'max-h-[450px]'
            } ${
              messages.length === 0 ? 'min-h-[200px] empty-state-container' : ''
            }`}
          >
            <div className="flex-grow">
              {messages.length === 0 ? (
                <div className="text-center py-2 text-gray-500">
                  {/* Render section navigation immediately in empty state, without any messages */}
                  <div className="mt-1">
                    {renderSectionNavigation()}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-lg max-w-[85%] ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">
                            {message.role === 'assistant' 
                              ? processMessageWithSubsectionLinks(message.content)
                              : message.content
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
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
                    <div className="mt-2 border-t border-gray-200 pt-2">
                      {renderSectionNavigation()}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Input area - make more compact when needed */}
          <div className={`border-t ${isCompactMode ? 'p-2 mt-2' : 'p-3 mt-3'}`}>
            <form onSubmit={handleSubmit} className="flex items-center">
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
            </form>
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
          </div>
        </>
      )}
    </div>
  );
}