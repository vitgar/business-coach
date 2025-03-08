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
  onSectionChange?: (sectionId: string, fieldId?: string) => void;
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
  const [isCompactMode, setIsCompactMode] = useState(window.innerHeight < 800)
  
  // Create refs for the component
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Track the last suggestion shown to the user
  const [lastShownSuggestion, setLastShownSuggestion] = useState<ExtendedFieldSuggestion | null>(null);
  
  // Add resize listener for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsCompactMode(window.innerHeight < 800);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  /**
   * Automatically adjusts the height of the textarea based on its content
   * @param e The change event from the textarea
   */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-adjust height
    if (textareaRef.current) {
      // First reset the height to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      
      // Set the height based on scrollHeight (content height)
      // Add a small buffer to prevent scrollbar flashing
      const newHeight = Math.min(Math.max(60, e.target.scrollHeight + 2), 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }
  
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
  }, [messages, isLoading, fieldSuggestions, showSectionPrompt]);
  
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
  
  // Add an effect to adjust textarea height whenever inputValue changes
  // This handles cases like pasting text or when the app initializes with content
  useEffect(() => {
    if (textareaRef.current && inputValue) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      
      // Set the height based on the content
      const newHeight = Math.min(Math.max(60, textareaRef.current.scrollHeight + 2), 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputValue]);
  
  // When component initializes, show incomplete sections summary
  useEffect(() => {
    // Initialize with a welcome message that includes incomplete sections
    if (messages.length === 0 && businessPlan?.content) {
      // Generate welcome message with incomplete sections information
      const welcomeMessage = generateWelcomeMessageWithIncompleteInfo();
      setMessages([
        { 
          role: 'assistant', 
          content: welcomeMessage
        }
      ]);
    }
  }, [businessPlan]);

  /**
   * Checks if a section is complete based on required fields
   * @param sectionId - The section identifier
   * @param sectionData - The section data object
   * @returns boolean indicating if the section is complete
   */
  const isSectionComplete = (sectionId: string, sectionData: any): boolean => {
    if (!sectionData) return false;
    
    // Define required fields for each section
    const requiredFields: Record<string, string[]> = {
      executiveSummary: ['businessConcept', 'missionStatement', 'productsOverview'],
      companyDescription: ['businessStructure', 'legalStructure', 'ownershipDetails', 'companyHistory'],
      productsAndServices: ['overview', 'valueProposition'],
      marketAnalysis: ['industryOverview', 'targetMarket'],
      marketingStrategy: ['branding', 'pricing', 'promotion', 'salesStrategy'],
      operationsPlan: ['businessModel', 'facilities', 'technology', 'productionProcess'],
      organizationAndManagement: ['structure', 'hrPlan'],
      financialPlan: ['projections', 'fundingNeeds', 'useOfFunds']
    };
    
    // Check if all required fields for this section exist and have content
    const fieldsToCheck = requiredFields[sectionId] || [];
    return fieldsToCheck.every(field => {
      // Handle nested objects like projections
      if (field === 'projections' && sectionData.projections) {
        return sectionData.projections.yearOne && 
               sectionData.projections.yearOne.revenue && 
               sectionData.projections.yearOne.expenses;
      }
      return sectionData[field] && typeof sectionData[field] === 'string' && sectionData[field].trim() !== '';
    });
  }
  
  /**
   * Generates a welcome message that includes information about incomplete sections
   * @returns A formatted welcome message string
   */
  const generateWelcomeMessageWithIncompleteInfo = (): string => {
    const incompleteSections: string[] = [];
    
    // Check each section's completion status
    if (businessPlan?.content) {
      SECTION_ORDER.forEach(section => {
        const sectionData = businessPlan.content?.[section];
        if (!isSectionComplete(section, sectionData)) {
          incompleteSections.push(SECTION_NAMES[section]);
        }
      });
    }
    
    let welcomeMessage = `Hello! I'm your AI business plan assistant. I'm here to help you complete your business plan.`;
    
    if (incompleteSections.length > 0) {
      welcomeMessage += `\n\nBased on my analysis, you still need to complete the following sections:\n`;
      incompleteSections.forEach(section => {
        welcomeMessage += `- ${section}\n`;
      });
      welcomeMessage += `\nYou can tell me which section you'd like to work on, and I'll help you complete it. For example, you can say "Let's work on the ${incompleteSections[0]}" or "Help me with the Products & Services section."`;
    } else {
      welcomeMessage += `\n\nGreat news! It looks like you've completed all the required fields in your business plan. Is there a specific section you'd like to review or enhance? You can simply tell me which section you want to work on.`;
    }
    
    return welcomeMessage;
  }
  
  /**
   * Scrolls the message container to the bottom
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
   * Process message text to extract mentions of sections for navigation
   * @param message The user's message text
   * @returns boolean indicating if a section was identified and navigation occurred
   */
  const processSectionNavigation = (message: string): boolean => {
    const normalizedMessage = message.toLowerCase();
    
    // Check for section mentions
    for (const [sectionId, sectionName] of Object.entries(SECTION_NAMES)) {
      const normalizedSectionName = sectionName.toLowerCase();
      
      // Various ways a user might reference a section
      if (
        normalizedMessage.includes(`work on ${normalizedSectionName}`) ||
        normalizedMessage.includes(`help with ${normalizedSectionName}`) ||
        normalizedMessage.includes(`go to ${normalizedSectionName}`) ||
        normalizedMessage.includes(`switch to ${normalizedSectionName}`) ||
        normalizedMessage.includes(`let's do ${normalizedSectionName}`) ||
        normalizedMessage.includes(`navigate to ${normalizedSectionName}`) ||
        normalizedMessage.includes(`edit ${normalizedSectionName}`) ||
        normalizedMessage.includes(`complete ${normalizedSectionName}`) ||
        normalizedMessage.includes(`work on the ${normalizedSectionName}`) ||
        normalizedMessage.includes(`help me with ${normalizedSectionName}`) ||
        normalizedMessage.includes(`update ${normalizedSectionName}`) ||
        // Also match just the section name if it's specific enough
        (normalizedMessage === normalizedSectionName) ||
        (normalizedMessage === `${normalizedSectionName} section`)
      ) {
        // Check if we're already on this section
        if (sectionId === sectionId) {
          return false; // No navigation needed, but section was mentioned
        }
        
        // Navigate to the mentioned section - pass null for field ID to focus the first field
        if (onSectionChange) {
          onSectionChange(sectionId, undefined);
          
          // Add a custom message to provide context about what happened
          const assistantMessage: ChatMessage = { 
            role: 'assistant', 
            content: `I've navigated to the ${sectionName} section for you. The form is now focused and ready for your input. How would you like to proceed with this section?`
          };
          setMessages([...messages, { role: 'user', content: message }, assistantMessage]);
          
          return true;
        }
      }
      
      // Also check for subsection mentions if in the format "help with mission statement"
      const subsections = SECTION_SUBSECTIONS[sectionId] || [];
      for (const subsection of subsections) {
        const subsectionName = SUBFIELD_NAMES[subsection]?.toLowerCase() || '';
        if (subsectionName && normalizedMessage.includes(subsectionName.toLowerCase())) {
          // Navigate to section and pass the specific subsection field ID
          if (onSectionChange) {
            onSectionChange(sectionId, subsection);
            // Set current subfield after a delay to allow section change to complete
            setTimeout(() => setCurrentSubfield(subsection), 300);
            
            // Add a custom message to provide context about what happened
            const assistantMessage: ChatMessage = { 
              role: 'assistant', 
              content: `I've navigated to the ${sectionName} section and focused on the ${SUBFIELD_NAMES[subsection]} field for you. You can now start typing directly. Would you like some guidance on what to include in this field?`
            };
            setMessages([...messages, { role: 'user', content: message }, assistantMessage]);
            
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Checks if a message is an approval response
   * @param message The message to check
   * @returns True if the message appears to be an approval
   */
  const isApprovalResponse = (message: string): boolean => {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Common approval phrases
    return (
      normalizedMessage === 'yes' ||
      normalizedMessage === 'yeah' ||
      normalizedMessage === 'yep' ||
      normalizedMessage === 'ok' ||
      normalizedMessage === 'okay' ||
      normalizedMessage === 'sure' ||
      normalizedMessage === 'approve' ||
      normalizedMessage === 'approved' ||
      normalizedMessage === 'looks good' ||
      normalizedMessage === 'good' ||
      normalizedMessage === 'that works' ||
      normalizedMessage === 'correct' ||
      normalizedMessage === 'that is correct' ||
      normalizedMessage === 'that\'s correct' ||
      normalizedMessage === 'i approve' ||
      normalizedMessage === 'apply it' ||
      normalizedMessage === 'use it' ||
      normalizedMessage.startsWith('yes,') ||
      normalizedMessage.startsWith('yeah,') ||
      normalizedMessage.startsWith('correct,') ||
      normalizedMessage.startsWith('approved,') ||
      normalizedMessage.startsWith('looks good,') ||
      normalizedMessage.includes('apply this') ||
      normalizedMessage.includes('use this')
    );
  }

  /**
   * Enhanced field ID normalization with specialized handling for various field types
   * @param id The field ID to normalize
   * @returns The normalized field ID
   */
  const normalizeFieldId = (id: string): string => {
    const lowerId = id.toLowerCase();
    
    // EXECUTIVE SUMMARY FIELD MAPPINGS
    // These should follow the same pattern for all Executive Summary fields
    
    // Handle Business Concept field
    if (lowerId === 'businessconcept' || lowerId === 'business concept') {
      console.log(`[Field ID Normalization] Normalizing Business Concept field ID: ${id} -> businessConcept`);
      return 'businessConcept';
    }
    
    // Handle Mission Statement field
    if (lowerId === 'missionstatement' || lowerId === 'mission statement') {
      console.log(`[Field ID Normalization] Normalizing Mission Statement field ID: ${id} -> missionStatement`);
      return 'missionStatement';
    }
    
    // Handle Products/Services Overview field
    if (lowerId.includes('product') && 
        (lowerId.includes('service') || lowerId.includes('overview'))) {
      console.log(`[Field ID Normalization] Normalizing Products/Services field ID: ${id} -> productsOverview`);
      return 'productsOverview';
    }
    
    // Handle Market Opportunity field
    if (lowerId === 'marketopportunity' || 
        lowerId === 'market opportunity' || 
        (lowerId.includes('market') && lowerId.includes('opportunit'))) {
      console.log(`[Field ID Normalization] Normalizing Market Opportunity field ID: ${id} -> marketOpportunity`);
      return 'marketOpportunity';
    }
    
    // Handle Financial Highlights field
    if (lowerId === 'financialhighlights' || 
        lowerId === 'financial highlights' || 
        (lowerId.includes('financial') && lowerId.includes('highlight'))) {
      console.log(`[Field ID Normalization] Normalizing Financial Highlights field ID: ${id} -> financialHighlights`);
      return 'financialHighlights';
    }
    
    // Handle Legal Structure field
    if (lowerId === 'legalstructure' || 
        lowerId === 'legal structure' || 
        (lowerId.includes('legal') && lowerId.includes('structure'))) {
      console.log(`[Field ID Normalization] Normalizing Legal Structure field ID: ${id} -> legalStructure`);
      return 'legalStructure';
    }
    
    // Handle Ownership Details field
    if (lowerId === 'ownershipdetails' || 
        lowerId === 'ownership details' || 
        (lowerId.includes('ownership') && lowerId.includes('detail'))) {
      console.log(`[Field ID Normalization] Normalizing Ownership Details field ID: ${id} -> ownershipDetails`);
      return 'ownershipDetails';
    }
    
    // Handle content field mapping based on context
    if (lowerId === 'content' && currentSubfield) {
      console.log(`[Field ID Normalization] Mapping generic 'content' to ${currentSubfield} based on context`);
      return currentSubfield;
    }
    
    return id;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputValue.trim() || isLoading) return
    
    // Store the user's message
    const userMessage = inputValue.trim();
    
    // Check if the message contains a section reference for navigation
    const navigatedToSection = processSectionNavigation(userMessage);
    
    // If we didn't navigate to a section, process the message
    if (!navigatedToSection) {
      // Check if this is an approval response and there's a last suggestion to apply
      if (fieldSuggestions.length > 0 && isApprovalResponse(userMessage)) {
        console.log('[Auto-Apply] Detected approval response, applying last suggestion');
        
        // Filter suggestions for the current context
        let suggestionToApply: ExtendedFieldSuggestion | null = null;
        
        // If there's a last shown suggestion, use that
        if (lastShownSuggestion) {
          suggestionToApply = lastShownSuggestion;
        }
        // Otherwise, try to find an appropriate suggestion
        else {
          // Get normalized field ID for current subfield
          const fieldId = currentSubfield || '';
          
          // Filter to get suggestions for the current field
          const relevantSuggestions = fieldSuggestions.filter(suggestion => {
            if (!currentSubfield) return true; // If no subfield is selected, all suggestions are relevant
            
            const normalizedSuggestionId = normalizeFieldId(suggestion.fieldId);
            const normalizedCurrentSubfield = normalizeFieldId(currentSubfield);
            
            return normalizedSuggestionId === normalizedCurrentSubfield || 
                   suggestion.fieldId === 'content' || 
                   normalizedSuggestionId === 'content';
          });
          
          // Use the first relevant suggestion if available
          if (relevantSuggestions.length > 0) {
            suggestionToApply = {
              ...relevantSuggestions[0],
              displayFieldId: currentSubfield || relevantSuggestions[0].fieldId
            };
          }
        }
        
        // If we found a suggestion to apply
        if (suggestionToApply) {
          const fieldIdToUse = suggestionToApply.displayFieldId || suggestionToApply.fieldId;
          
          // Send the user message first
          sendMessage(userMessage, currentSectionData);
          
          // Then apply the suggestion
          setTimeout(() => {
            // Apply the suggestion
            handleApplySuggestion(fieldIdToUse, suggestionToApply.content);
            
            // Send a confirmation message
            const fieldName = SUBFIELD_NAMES[fieldIdToUse] || fieldIdToUse.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const confirmationMessage: ChatMessage = {
              role: 'assistant',
              content: `✅ I've applied the suggested content to the ${fieldName} field for you. Is there anything else you'd like help with?`
            };
            
            // Add the confirmation message
            setMessages(prevMessages => [...prevMessages, confirmationMessage]);
            
            // Clear field suggestions after applying
            setFieldSuggestions([]);
            setLastShownSuggestion(null);
          }, 1000); // Small delay to ensure the user message is processed first
          
          // Don't send the message again
          setInputValue('');
          return;
        }
      }
      
      // If it's not a valid approval or no suggestions to apply, send as a regular message
      sendMessage(userMessage, currentSectionData);
    }
    
    setInputValue('');
    
    // Reset height of textarea after clearing
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = '60px';
      }
    }, 0);
  }
  
  /**
   * Handles applying a suggestion to a field
   */
  const handleApplySuggestion = (fieldId: string, content: string) => {
    if (!onApplySuggestion) return
    
    console.log(`[Apply Suggestion Debug] Applying suggestion to field: ${fieldId}`);
    console.log(`[Apply Suggestion Debug] Current section: ${sectionId}, Current subfield: ${currentSubfield}`);
    
    // Normalize the field ID
    const normalizedFieldId = normalizeFieldId(fieldId);
    
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
   * Render field suggestions if available
   */
  const renderFieldSuggestions = () => {
    if (!fieldSuggestions || fieldSuggestions.length === 0) return null
    
    console.log('[Suggestion Debug] Current subfield:', currentSubfield)
    console.log('[Suggestion Debug] Available suggestions:', fieldSuggestions.map(s => s.fieldId))
    
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
    
    // Save the first suggestion as the last shown suggestion for auto-application
    if (mappedSuggestions.length > 0 && !lastShownSuggestion) {
      setLastShownSuggestion(mappedSuggestions[0]);
    }
    
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
        <div className="text-xs text-gray-500 mt-1">
          Tip: Just type "yes" to apply the suggestion.
        </div>
      </div>
    );
  }
  
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
                    {renderFieldSuggestions()}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col space-y-4">
                    {messages.map((message, index) => (
                      <div 
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`px-3 py-1.5 rounded-lg ${
                            message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
                          } ${isCompactMode ? 'text-sm' : 'text-base'} max-w-[85%]`}
                        >
                          {message.role === 'user' ? (
                            <div>{message.content}</div>
                          ) : (
                            <div className="prose max-w-none">
                              {isLoading && messages.length === index + 1 ? (
                                <div className="text-gray-500">Thinking...</div>
                              ) : (
                                <div className="whitespace-pre-wrap">
                                  {message.content}
                                </div>
                              )}
                            </div>
                          )}
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
                  {showSectionPrompt && (
                    <div className="mt-2 border-t border-gray-200 pt-2">
                      {renderFieldSuggestions()}
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
                onChange={handleTextareaChange}
                placeholder="Ask for guidance..."
                disabled={isLoading}
                className="flex-grow py-2 px-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[60px] max-h-[200px] resize-none transition-all duration-100"
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}