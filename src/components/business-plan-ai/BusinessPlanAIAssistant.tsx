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
  
  // For the dropdown menu
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedMainSection, setSelectedMainSection] = useState<string | null>(null)
  
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
  
  // When component initializes, initialize the menu
  useEffect(() => {
    if (messages.length === 0 && businessPlan?.content) {
      // The menu dropdown will be available but closed initially
      setIsMenuOpen(false);
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
      // Adding contextual navigation responses
      normalizedMessage === 'move on' ||
      normalizedMessage === 'let\'s move on' ||
      normalizedMessage === 'lets move on' ||
      normalizedMessage === 'continue' ||
      normalizedMessage === 'continue to next' ||
      normalizedMessage === 'next' ||
      normalizedMessage === 'next section' ||
      normalizedMessage === 'move to next' ||
      normalizedMessage === 'let\'s continue' ||
      normalizedMessage === 'lets continue' ||
      // Common ways to say "no" to "anything else?" questions (indicating satisfaction)
      normalizedMessage === 'no' ||
      normalizedMessage === 'no thanks' ||
      normalizedMessage === 'nothing else' ||
      normalizedMessage === 'that\'s all' ||
      normalizedMessage === 'thats all' ||
      normalizedMessage === 'it\'s good' ||
      normalizedMessage === 'its good' ||
      normalizedMessage === 'looks fine' ||
      normalizedMessage === 'no changes' ||
      normalizedMessage === 'no changes needed' ||
      normalizedMessage === 'i like it' ||
      normalizedMessage === 'sounds good' ||
      // Handle common phrase starts
      normalizedMessage.startsWith('yes,') ||
      normalizedMessage.startsWith('yeah,') ||
      normalizedMessage.startsWith('correct,') ||
      normalizedMessage.startsWith('approved,') ||
      normalizedMessage.startsWith('looks good,') ||
      normalizedMessage.startsWith('no,') ||
      normalizedMessage.startsWith('no thanks') ||
      normalizedMessage.startsWith('nope') ||
      normalizedMessage.startsWith('looks fine') ||
      normalizedMessage.startsWith('that works') ||
      normalizedMessage.startsWith('i like') ||
      // Adding more contextual navigation phrase starts
      normalizedMessage.startsWith('move on') ||
      normalizedMessage.startsWith('let\'s move') ||
      normalizedMessage.startsWith('lets move') ||
      normalizedMessage.startsWith('continue to')
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
    
    // COMPANY DESCRIPTION FIELDS
    
    // Handle Business Structure field
    if (lowerId === 'businessstructure' || 
        lowerId === 'business structure' || 
        (lowerId.includes('business') && lowerId.includes('structure'))) {
      console.log(`[Field ID Normalization] Normalizing Business Structure field ID: ${id} -> businessStructure`);
      return 'businessStructure';
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
    
    // Handle Company History field
    if (lowerId === 'companyhistory' || 
        lowerId === 'company history' || 
        lowerId.includes('founding') ||
        lowerId.includes('establishment') ||
        lowerId.includes('origin') ||
        (lowerId.includes('company') && (lowerId.includes('history') || lowerId.includes('background')))) {
      console.log(`[Field ID Normalization] Normalizing Company History field ID: ${id} -> companyHistory`);
      return 'companyHistory';
    }
    
    // PRODUCTS AND SERVICES FIELDS
    
    // Handle Overview field
    if (lowerId === 'overview' || 
        (lowerId.includes('product') && lowerId.includes('overview'))) {
      console.log(`[Field ID Normalization] Normalizing Overview field ID: ${id} -> overview`);
      return 'overview';
    }
    
    // Handle Value Proposition field
    if (lowerId === 'valueproposition' || 
        lowerId === 'value proposition' || 
        lowerId === 'valueprop' ||
        lowerId === 'value prop' ||
        (lowerId.includes('value') && lowerId.includes('proposition')) ||
        (lowerId.includes('val') && lowerId.includes('prop'))) {
      console.log(`[Field ID Normalization] Normalizing Value Proposition field ID: ${id} -> valueProposition`);
      // Explicitly ensure we're using the exact format expected by the editor
      return 'valueProposition';
    }
    
    // Handle Intellectual Property field
    if (lowerId === 'intellectualproperty' || 
        lowerId === 'intellectual property' || 
        (lowerId.includes('intellectual') && lowerId.includes('property'))) {
      console.log(`[Field ID Normalization] Normalizing Intellectual Property field ID: ${id} -> intellectualProperty`);
      return 'intellectualProperty';
    }
    
    // Handle Future Products field
    if (lowerId === 'futureproducts' || lowerId === 'future products') {
      console.log(`[Field ID Normalization] Normalizing Future Products field ID: ${id} -> futureProducts`);
      // Return exact camelCase format required by the editor
      return 'futureProducts';
    }
    
    if (lowerId === 'futureproduct' || lowerId === 'future product' || lowerId === 'future services') {
      console.log(`[Field ID Normalization] Normalizing Additional Future Products variants: ${id} -> futureProducts`);
      // Return exact camelCase format required by the editor
      return 'futureProducts';
    }
    
    if ((lowerId.includes('future') && lowerId.includes('product')) || 
        (lowerId.includes('future') && lowerId.includes('service'))) {
      console.log(`[Field ID Normalization] Normalizing Generic Future Products reference: ${id} -> futureProducts`);
      // Return exact camelCase format required by the editor
      return 'futureProducts';
    }
    
    // MARKET ANALYSIS FIELDS
    
    // Handle Industry Overview field
    if (lowerId === 'industryoverview' || 
        lowerId === 'industry overview' || 
        (lowerId.includes('industry') && lowerId.includes('overview'))) {
      console.log(`[Field ID Normalization] Normalizing Industry Overview field ID: ${id} -> industryOverview`);
      return 'industryOverview';
    }
    
    // Handle Target Market field
    if (lowerId === 'targetmarket' || 
        lowerId === 'target market' || 
        (lowerId.includes('target') && lowerId.includes('market'))) {
      console.log(`[Field ID Normalization] Normalizing Target Market field ID: ${id} -> targetMarket`);
      return 'targetMarket';
    }
    
    // Handle Market Segmentation field
    if (lowerId === 'marketsegmentation' || 
        lowerId === 'market segmentation' || 
        (lowerId.includes('market') && lowerId.includes('segment'))) {
      console.log(`[Field ID Normalization] Normalizing Market Segmentation field ID: ${id} -> marketSegmentation`);
      return 'marketSegmentation';
    }
    
    // Handle Competitive Analysis field
    if (lowerId === 'competitiveanalysis' || 
        lowerId === 'competitive analysis' || 
        (lowerId.includes('competitive') && lowerId.includes('analysis'))) {
      console.log(`[Field ID Normalization] Normalizing Competitive Analysis field ID: ${id} -> competitiveAnalysis`);
      return 'competitiveAnalysis';
    }
    
    // Handle SWOT Analysis field
    if (lowerId === 'swotanalysis' || 
        lowerId === 'swot analysis' || 
        lowerId === 'swot') {
      console.log(`[Field ID Normalization] Normalizing SWOT Analysis field ID: ${id} -> swotAnalysis`);
      return 'swotAnalysis';
    }
    
    // MARKETING STRATEGY FIELDS
    
    // Handle Branding field
    if (lowerId === 'branding' || 
        lowerId === 'brand strategy' || 
        lowerId === 'branding strategy') {
      console.log(`[Field ID Normalization] Normalizing Branding field ID: ${id} -> branding`);
      return 'branding';
    }
    
    // Handle Pricing field
    if (lowerId === 'pricing' || 
        lowerId === 'pricing strategy' || 
        (lowerId.includes('price') || lowerId.includes('pricing'))) {
      console.log(`[Field ID Normalization] Normalizing Pricing field ID: ${id} -> pricing`);
      return 'pricing';
    }
    
    // Handle Promotion field
    if (lowerId === 'promotion' || 
        lowerId === 'promotion plan' || 
        lowerId.includes('promot')) {
      console.log(`[Field ID Normalization] Normalizing Promotion field ID: ${id} -> promotion`);
      return 'promotion';
    }
    
    // Handle Sales Strategy field
    if (lowerId === 'salesstrategy' || 
        lowerId === 'sales strategy' || 
        (lowerId.includes('sales') && lowerId.includes('strategy'))) {
      console.log(`[Field ID Normalization] Normalizing Sales Strategy field ID: ${id} -> salesStrategy`);
      return 'salesStrategy';
    }
    
    // Handle Channels field
    if (lowerId === 'channels' || 
        lowerId === 'distribution channels' || 
        lowerId.includes('channel')) {
      console.log(`[Field ID Normalization] Normalizing Channels field ID: ${id} -> channels`);
      return 'channels';
    }
    
    // Handle Customer Retention field
    if (lowerId === 'customerretention' || 
        lowerId === 'customer retention' || 
        (lowerId.includes('customer') && lowerId.includes('retention'))) {
      console.log(`[Field ID Normalization] Normalizing Customer Retention field ID: ${id} -> customerRetention`);
      return 'customerRetention';
    }
    
    // OPERATIONS PLAN FIELDS
    
    // Handle Business Model field
    if (lowerId === 'businessmodel' || 
        lowerId === 'business model' || 
        (lowerId.includes('business') && lowerId.includes('model'))) {
      console.log(`[Field ID Normalization] Normalizing Business Model field ID: ${id} -> businessModel`);
      return 'businessModel';
    }
    
    // Handle Facilities field
    if (lowerId === 'facilities' || 
        lowerId === 'facilities & location' || 
        lowerId.includes('facilit')) {
      console.log(`[Field ID Normalization] Normalizing Facilities field ID: ${id} -> facilities`);
      return 'facilities';
    }
    
    // Handle Technology field
    if (lowerId === 'technology' || 
        lowerId === 'technology requirements' || 
        lowerId.includes('tech')) {
      console.log(`[Field ID Normalization] Normalizing Technology field ID: ${id} -> technology`);
      return 'technology';
    }
    
    // Handle Production Process field
    if (lowerId === 'productionprocess' || 
        lowerId === 'production process' || 
        (lowerId.includes('production') && lowerId.includes('process'))) {
      console.log(`[Field ID Normalization] Normalizing Production Process field ID: ${id} -> productionProcess`);
      return 'productionProcess';
    }
    
    // Handle Quality Control field
    if (lowerId === 'qualitycontrol' || 
        lowerId === 'quality control' || 
        (lowerId.includes('quality') && lowerId.includes('control'))) {
      console.log(`[Field ID Normalization] Normalizing Quality Control field ID: ${id} -> qualityControl`);
      return 'qualityControl';
    }
    
    // Handle Logistics field
    if (lowerId === 'logistics' || 
        lowerId === 'logistics & supply chain' || 
        lowerId.includes('logistic')) {
      console.log(`[Field ID Normalization] Normalizing Logistics field ID: ${id} -> logistics`);
      return 'logistics';
    }
    
    // ORGANIZATION & MANAGEMENT FIELDS
    
    // Handle Structure field
    if (lowerId === 'structure' || 
        lowerId === 'organizational structure' || 
        (lowerId.includes('organizational') && lowerId.includes('structure'))) {
      console.log(`[Field ID Normalization] Normalizing Structure field ID: ${id} -> structure`);
      return 'structure';
    }
    
    // Handle HR Plan field
    if (lowerId === 'hrplan' || 
        lowerId === 'hr plan' || 
        (lowerId.includes('hr') && lowerId.includes('plan'))) {
      console.log(`[Field ID Normalization] Normalizing HR Plan field ID: ${id} -> hrPlan`);
      return 'hrPlan';
    }
    
    // Handle Advisors field
    if (lowerId === 'advisors' || 
        lowerId === 'advisors & board' || 
        lowerId.includes('advisor')) {
      console.log(`[Field ID Normalization] Normalizing Advisors field ID: ${id} -> advisors`);
      return 'advisors';
    }
    
    // FINANCIAL PLAN FIELDS
    
    // Handle Projections field
    if (lowerId === 'projections' || 
        lowerId === 'financial projections' || 
        (lowerId.includes('financial') && lowerId.includes('projection'))) {
      console.log(`[Field ID Normalization] Normalizing Projections field ID: ${id} -> projections`);
      return 'projections';
    }
    
    // Handle Funding Needs field
    if (lowerId === 'fundingneeds' || 
        lowerId === 'funding needs' || 
        lowerId === 'funding requirements' || 
        (lowerId.includes('funding') && (lowerId.includes('needs') || lowerId.includes('requirement')))) {
      console.log(`[Field ID Normalization] Normalizing Funding Needs field ID: ${id} -> fundingNeeds`);
      return 'fundingNeeds';
    }
    
    // Handle Use of Funds field
    if (lowerId === 'useoffunds' || 
        lowerId === 'use of funds' || 
        (lowerId.includes('use') && lowerId.includes('funds'))) {
      console.log(`[Field ID Normalization] Normalizing Use of Funds field ID: ${id} -> useOfFunds`);
      return 'useOfFunds';
    }
    
    // Handle Break-Even Analysis field
    if (lowerId === 'breakevenanalysis' || 
        lowerId === 'break-even analysis' || 
        lowerId === 'breakeven analysis' || 
        (lowerId.includes('break') && lowerId.includes('even'))) {
      console.log(`[Field ID Normalization] Normalizing Break-Even Analysis field ID: ${id} -> breakEvenAnalysis`);
      return 'breakEvenAnalysis';
    }
    
    // Handle Exit Strategy field
    if (lowerId === 'exitstrategy' || 
        lowerId === 'exit strategy' || 
        (lowerId.includes('exit') && lowerId.includes('strategy'))) {
      console.log(`[Field ID Normalization] Normalizing Exit Strategy field ID: ${id} -> exitStrategy`);
      return 'exitStrategy';
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
    const normalizedUserMessage = userMessage.toLowerCase().trim();
    
    // Check if the message contains a section reference for navigation
    const navigatedToSection = processSectionNavigation(userMessage);
    
    // If we didn't navigate to a section, process the message
    if (!navigatedToSection) {
      // Check if this is a "move on" type of response
      const isMoveOnResponse = 
          normalizedUserMessage === 'move on' ||
          normalizedUserMessage === 'let\'s move on' ||
          normalizedUserMessage === 'lets move on' ||
          normalizedUserMessage === 'continue' ||
          normalizedUserMessage === 'next' ||
          normalizedUserMessage === 'next section' ||
          normalizedUserMessage === 'continue to next' ||
          normalizedUserMessage === 'move to next' ||
          normalizedUserMessage.startsWith('move on') ||
          normalizedUserMessage.startsWith('let\'s move') ||
          normalizedUserMessage.startsWith('lets move') ||
          normalizedUserMessage.startsWith('continue to');
      
      // Check the last few messages for section suggestions if this is a "move on" type response
      if (isMoveOnResponse && messages.length > 0) {
        console.log('[Navigation] Processing "move on" response');
        
        // Check the last assistant message for section name mentions
        for (let i = messages.length - 1; i >= Math.max(0, messages.length - 3); i--) {
          const message = messages[i];
          if (message.role === 'assistant') {
            const content = message.content.toLowerCase();
            
            // Look for section mentions in all sections/subsections
            for (const [sectId, sectName] of Object.entries(SECTION_NAMES)) {
              const normalizedSectionName = sectName.toLowerCase();
              
              // Check if the assistant message suggested a section
              if (
                content.includes(`next section is ${normalizedSectionName}`) ||
                content.includes(`next part is ${normalizedSectionName}`) ||
                content.includes(`next section is the ${normalizedSectionName}`) ||
                content.includes(`next part is the ${normalizedSectionName}`) ||
                content.includes(`move on to ${normalizedSectionName}`) ||
                content.includes(`move on to the ${normalizedSectionName}`) ||
                content.includes(`continue to ${normalizedSectionName}`) ||
                content.includes(`continue to the ${normalizedSectionName}`)
              ) {
                if (onSectionChange) {
                  console.log(`[Navigation] Found suggestion for ${sectName} section in assistant message`);
                  
                  // Navigate to the section
                  onSectionChange(sectId);
                  
                  // Add a message for context
                  const assistantMessage: ChatMessage = { 
                    role: 'assistant', 
                    content: `I've navigated to the ${sectName} section for you. How would you like to proceed with this section?`
                  };
                  setMessages([...messages, { role: 'user', content: userMessage }, assistantMessage]);
                  
                  // Reset input and return early
                  setInputValue('');
                  return;
                }
              }
              
              // Also check for subsection mentions
              const subsections = SECTION_SUBSECTIONS[sectId] || [];
              for (const subsection of subsections) {
                const subsectionName = SUBFIELD_NAMES[subsection]?.toLowerCase() || '';
                if (!subsectionName) continue;
                
                // Check for this subsection name in the message
                if (
                  content.includes(`next section is ${subsectionName}`) ||
                  content.includes(`next part is ${subsectionName}`) ||
                  content.includes(`next section is the ${subsectionName}`) ||
                  content.includes(`next part is the ${subsectionName}`) ||
                  content.includes(`move on to ${subsectionName}`) ||
                  content.includes(`move on to the ${subsectionName}`) ||
                  content.includes(`continue to ${subsectionName}`) ||
                  content.includes(`continue to the ${subsectionName}`)
                ) {
                  if (onSectionChange) {
                    console.log(`[Navigation] Found suggestion for ${subsectionName} in ${sectName} section`);
                    
                    // Navigate to the section and field
                    onSectionChange(sectId, subsection);
                    
                    // Add a message for context
                    const assistantMessage: ChatMessage = { 
                      role: 'assistant', 
                      content: `I've navigated to the ${subsectionName} field in the ${sectName} section. How would you like to proceed?`
                    };
                    setMessages([...messages, { role: 'user', content: userMessage }, assistantMessage]);
                    
                    // Reset input and return early
                    setInputValue('');
                    return;
                  }
                }
              }
            }
          }
        }
      }
      
      // Check if this is an approval response and there's a last suggestion to apply
      if (fieldSuggestions.length > 0 && isApprovalResponse(userMessage)) {
        console.log('[Auto-Apply] Detected approval response, applying last suggestion');
        
        // Filter suggestions for the current context
        let suggestionToApply: ExtendedFieldSuggestion | null = null;
        
        // If there's a last shown suggestion, use that
        if (lastShownSuggestion) {
          suggestionToApply = lastShownSuggestion;
          console.log('[Auto-Apply] Using last shown suggestion:', lastShownSuggestion);
        }
        // Otherwise, try to find an appropriate suggestion
        else {
          // Special handling for Ownership Details section
          if (sectionId === 'companyDescription' && currentSubfield === 'ownershipDetails') {
            console.log('[Auto-Apply] In Ownership Details section, searching for matching suggestions');
            
            // Find suggestions that might be related to ownership details
            const ownershipRelatedSuggestions = fieldSuggestions.filter(suggestion => {
              const suggestionFieldId = suggestion.fieldId.toLowerCase();
              return suggestionFieldId.includes('ownership') || 
                     suggestionFieldId.includes('owner') ||
                     suggestionFieldId.includes('detail') || 
                     suggestionFieldId === 'content';
            });
            
            if (ownershipRelatedSuggestions.length > 0) {
              console.log('[Auto-Apply] Found Ownership Details related suggestions:', ownershipRelatedSuggestions);
              suggestionToApply = {
                ...ownershipRelatedSuggestions[0],
                displayFieldId: 'ownershipDetails'
              };
            }
          }
          // Special handling for Company History section
          else if (sectionId === 'companyDescription' && currentSubfield === 'companyHistory') {
            console.log('[Auto-Apply] In Company History section, looking for related suggestions');
            
            // Look for suggestions that might be related to company history
            const companyHistorySuggestions = fieldSuggestions.filter(s => {
              const lowerId = s.fieldId.toLowerCase();
              return lowerId.includes('company') || 
                     lowerId.includes('history') || 
                     lowerId.includes('founding') ||
                     lowerId.includes('background') ||
                     lowerId.includes('establishment') ||
                     lowerId.includes('origin') ||
                     lowerId === 'content';
            });
            
            if (companyHistorySuggestions.length > 0) {
              console.log(`[Auto-Apply] Found ${companyHistorySuggestions.length} Company History related suggestions`);
              suggestionToApply = {
                ...companyHistorySuggestions[0],
                displayFieldId: 'companyHistory'
              };
            }
          }
          
          // If no Company History or Ownership Details suggestion was found, use standard filtering
          if (!suggestionToApply) {
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
              console.log('[Auto-Apply] Found relevant suggestions through normal filtering:', relevantSuggestions);
              suggestionToApply = {
                ...relevantSuggestions[0],
                displayFieldId: currentSubfield || relevantSuggestions[0].fieldId
              };
            }
          }
        }
        
        // If we found a suggestion to apply
        if (suggestionToApply) {
          const fieldIdToUse = suggestionToApply.displayFieldId || suggestionToApply.fieldId;
          console.log('[Auto-Apply] Applying suggestion to field:', fieldIdToUse);
          
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
        } else {
          console.log('[Auto-Apply] Could not find an appropriate suggestion to apply');
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
    
    // Direct fix for Future Products - hardcode when detected
    const lowerFieldId = fieldId.toLowerCase();
    if ((lowerFieldId.includes('future') && (lowerFieldId.includes('product') || lowerFieldId.includes('service'))) ||
        lowerFieldId === 'futureproducts') {
      
      console.log(`[Apply Suggestion Debug] FIX: Directly applying to futureProducts field`);
      
      // Apply suggestion
      onApplySuggestion('futureProducts', content);
      
      // Update tracking
      setCurrentSubfield('futureProducts');
      setLastAppliedSuggestion({ fieldId: 'futureProducts', content });
      setShowSectionPrompt(true);
      
      // Force proper focus
      if (onSectionChange) {
        console.log(`[Apply Suggestion Debug] FIX: Setting focus to futureProducts field`);
        setTimeout(() => {
          onSectionChange('productsAndServices', 'futureProducts');
        }, 100);
      }
      
      // Scroll after applying
      setTimeout(scrollToBottom, 150);
      
      return;
    }

    // Direct fix for Industry Overview - hardcode when detected
    if ((lowerFieldId.includes('industry') && lowerFieldId.includes('overview')) ||
        lowerFieldId === 'industryoverview') {
      
      console.log(`[Apply Suggestion Debug] FIX: Directly applying to industryOverview field`);
      
      // Apply suggestion
      onApplySuggestion('industryOverview', content);
      
      // Update tracking
      setCurrentSubfield('industryOverview');
      setLastAppliedSuggestion({ fieldId: 'industryOverview', content });
      setShowSectionPrompt(true);
      
      // Force proper focus
      if (onSectionChange) {
        console.log(`[Apply Suggestion Debug] FIX: Setting focus to industryOverview field`);
        setTimeout(() => {
          onSectionChange('marketAnalysis', 'industryOverview');
        }, 100);
      }
      
      // Scroll after applying
      setTimeout(scrollToBottom, 150);
      
      return;
    }

    // Direct fix for Target Market - hardcode when detected
    if ((lowerFieldId.includes('target') && lowerFieldId.includes('market')) ||
        lowerFieldId === 'targetmarket' ||
        lowerFieldId === 'target market' ||
        lowerFieldId.includes('target audience') ||
        lowerFieldId.includes('customer segment') ||
        lowerFieldId.includes('demographic') ||
        lowerFieldId.includes('customer base')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to targetMarket field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID
          onApplySuggestion('targetMarket', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to targetMarket`);
          
          // Manually update all tracking state
          setCurrentSubfield('targetMarket');
          setLastAppliedSuggestion({ fieldId: 'targetMarket', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting market analysis section and targetMarket focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              onSectionChange('marketAnalysis', 'targetMarket');
              
              // Double-check focus after a short delay
              setTimeout(() => {
                if (onSectionChange) {
                  onSectionChange('marketAnalysis', 'targetMarket');
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 200);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Target Market handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Target Market override:`, err);
      }
    }
    
    // Direct fix for Market Segmentation - hardcode when detected
    if ((lowerFieldId.includes('market') && lowerFieldId.includes('segment')) ||
        lowerFieldId === 'marketsegmentation' ||
        lowerFieldId === 'market segmentation' ||
        lowerFieldId.includes('customer group') ||
        lowerFieldId.includes('market division') ||
        lowerFieldId.includes('segment')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to marketSegmentation field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID
          onApplySuggestion('marketSegmentation', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to marketSegmentation`);
          
          // Manually update all tracking state
          setCurrentSubfield('marketSegmentation');
          setLastAppliedSuggestion({ fieldId: 'marketSegmentation', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting market analysis section and marketSegmentation focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              onSectionChange('marketAnalysis', 'marketSegmentation');
              
              // Double-check focus after a short delay
              setTimeout(() => {
                if (onSectionChange) {
                  onSectionChange('marketAnalysis', 'marketSegmentation');
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 200);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Market Segmentation handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Market Segmentation override:`, err);
      }
    }
    
    // Direct fix for Competitive Analysis - hardcode when detected
    if ((lowerFieldId.includes('competitive') && lowerFieldId.includes('analysis')) ||
        lowerFieldId === 'competitiveanalysis' ||
        lowerFieldId === 'competitive analysis' ||
        (lowerFieldId.includes('competitor') && lowerFieldId.includes('analysis')) ||
        lowerFieldId.includes('competition analysis') ||
        lowerFieldId.includes('competitor review') ||
        lowerFieldId.includes('market competition') ||
        lowerFieldId.includes('industry competition') ||
        (lowerFieldId.includes('competitor') && lowerFieldId.includes('landscape'))) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to competitiveAnalysis field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID with exact camelCase
          onApplySuggestion('competitiveAnalysis', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to competitiveAnalysis`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('competitiveAnalysis');
          setLastAppliedSuggestion({ fieldId: 'competitiveAnalysis', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting market analysis section and competitiveAnalysis focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('marketAnalysis', 'competitiveAnalysis');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for competitiveAnalysis`);
                  onSectionChange('marketAnalysis', 'competitiveAnalysis');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for competitiveAnalysis`);
                      onSectionChange('marketAnalysis', 'competitiveAnalysis');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Competitive Analysis handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Competitive Analysis override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for SWOT Analysis - hardcode when detected
    if (lowerFieldId === 'swotanalysis' ||
        lowerFieldId === 'swot analysis' ||
        lowerFieldId === 'swot' ||
        (lowerFieldId.includes('swot') && lowerFieldId.includes('analysis')) ||
        (lowerFieldId.includes('strength') && lowerFieldId.includes('weakness')) ||
        (lowerFieldId.includes('strength') && lowerFieldId.includes('threat')) ||
        (lowerFieldId.includes('weakness') && lowerFieldId.includes('opportunity')) ||
        (lowerFieldId.includes('opportunity') && lowerFieldId.includes('threat')) ||
        lowerFieldId.includes('s.w.o.t') ||
        lowerFieldId.includes('s-w-o-t') ||
        lowerFieldId.includes('s w o t')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to swotAnalysis field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID with exact camelCase
          onApplySuggestion('swotAnalysis', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to swotAnalysis`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('swotAnalysis');
          setLastAppliedSuggestion({ fieldId: 'swotAnalysis', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting market analysis section and swotAnalysis focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('marketAnalysis', 'swotAnalysis');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for swotAnalysis`);
                  onSectionChange('marketAnalysis', 'swotAnalysis');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for swotAnalysis`);
                      onSectionChange('marketAnalysis', 'swotAnalysis');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: SWOT Analysis handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in SWOT Analysis override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for Branding Strategy - hardcode when detected
    if ((lowerFieldId.includes('brand') && lowerFieldId.includes('strategy')) ||
        lowerFieldId === 'branding' ||
        lowerFieldId === 'brandingstrategy' ||
        lowerFieldId === 'branding strategy' ||
        lowerFieldId.includes('brand identity') ||
        lowerFieldId.includes('brand positioning') ||
        lowerFieldId.includes('brand voice') ||
        lowerFieldId.includes('brand image') ||
        lowerFieldId.includes('brand development') ||
        lowerFieldId.includes('brand recognition')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to branding field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('branding', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to branding field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('branding');
          setLastAppliedSuggestion({ fieldId: 'branding', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - marketing strategy is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting marketing strategy section and branding focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('marketingStrategy', 'branding');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for branding`);
                  onSectionChange('marketingStrategy', 'branding');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for branding`);
                      onSectionChange('marketingStrategy', 'branding');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Branding Strategy handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Branding Strategy override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for Pricing Strategy - hardcode when detected
    if ((lowerFieldId.includes('price') && lowerFieldId.includes('strategy')) ||
        lowerFieldId === 'pricing' ||
        lowerFieldId === 'pricingstrategy' ||
        lowerFieldId === 'pricing strategy' ||
        lowerFieldId.includes('price model') ||
        lowerFieldId.includes('price point') ||
        lowerFieldId.includes('pricing model') ||
        lowerFieldId.includes('cost strategy') ||
        lowerFieldId.includes('monetization') ||
        lowerFieldId.includes('revenue model') ||
        lowerFieldId.includes('cost structure') ||
        lowerFieldId.includes('margin strategy')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to pricing field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('pricing', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to pricing field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('pricing');
          setLastAppliedSuggestion({ fieldId: 'pricing', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - marketing strategy is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting marketing strategy section and pricing focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('marketingStrategy', 'pricing');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for pricing`);
                  onSectionChange('marketingStrategy', 'pricing');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for pricing`);
                      onSectionChange('marketingStrategy', 'pricing');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Pricing Strategy handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Pricing Strategy override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }

    // Direct fix for Promotion Plan - hardcode when detected
    if ((lowerFieldId.includes('promotion') && lowerFieldId.includes('plan')) ||
        lowerFieldId === 'promotion' ||
        lowerFieldId === 'promotionplan' ||
        lowerFieldId === 'promotion plan' ||
        lowerFieldId.includes('advertising') ||
        lowerFieldId.includes('marketing plan') ||
        lowerFieldId.includes('marketing campaign') ||
        lowerFieldId.includes('promotional strategy') ||
        lowerFieldId.includes('market promotion') ||
        lowerFieldId.includes('customer acquisition') ||
        lowerFieldId.includes('brand promotion') ||
        lowerFieldId.includes('promotional activities')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to promotion field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('promotion', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to promotion field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('promotion');
          setLastAppliedSuggestion({ fieldId: 'promotion', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - marketing strategy is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting marketing strategy section and promotion focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('marketingStrategy', 'promotion');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for promotion`);
                  onSectionChange('marketingStrategy', 'promotion');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for promotion`);
                      onSectionChange('marketingStrategy', 'promotion');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Promotion Plan handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Promotion Plan override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }

    // Direct fix for Sales Strategy - hardcode when detected
    if ((lowerFieldId.includes('sales') && lowerFieldId.includes('strategy')) ||
        lowerFieldId === 'salesstrategy' ||
        lowerFieldId === 'sales strategy' ||
        lowerFieldId.includes('sales plan') ||
        lowerFieldId.includes('sales process') ||
        lowerFieldId.includes('sales approach') ||
        lowerFieldId.includes('sales method') ||
        lowerFieldId.includes('sales funnel') ||
        lowerFieldId.includes('sales cycle') ||
        lowerFieldId.includes('customer conversion') ||
        lowerFieldId.includes('lead generation') ||
        lowerFieldId.includes('revenue generation')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to salesStrategy field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor (note camelCase format)
          onApplySuggestion('salesStrategy', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to salesStrategy field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('salesStrategy');
          setLastAppliedSuggestion({ fieldId: 'salesStrategy', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - marketing strategy is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting marketing strategy section and salesStrategy focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('marketingStrategy', 'salesStrategy');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for salesStrategy`);
                  onSectionChange('marketingStrategy', 'salesStrategy');
                  
                  // Triple-check with extra long delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for salesStrategy`);
                      onSectionChange('marketingStrategy', 'salesStrategy');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Sales Strategy handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Sales Strategy override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }

    // Direct fix for Distribution Channels - hardcode when detected
    if ((lowerFieldId.includes('distribution') && lowerFieldId.includes('channel')) ||
        lowerFieldId === 'channels' ||
        lowerFieldId === 'distributionchannels' ||
        lowerFieldId === 'distribution channels' ||
        lowerFieldId.includes('sales channel') ||
        lowerFieldId.includes('delivery channel') ||
        lowerFieldId.includes('go to market') ||
        lowerFieldId.includes('product distribution') ||
        lowerFieldId.includes('service distribution') ||
        lowerFieldId.includes('market reach') ||
        lowerFieldId.includes('distribution network') ||
        lowerFieldId.includes('channel strategy')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to channels field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('channels', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to channels field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('channels');
          setLastAppliedSuggestion({ fieldId: 'channels', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - marketing strategy is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting marketing strategy section and channels focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('marketingStrategy', 'channels');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for channels`);
                  onSectionChange('marketingStrategy', 'channels');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for channels`);
                      onSectionChange('marketingStrategy', 'channels');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Distribution Channels handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Distribution Channels override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }

    // Direct fix for Customer Retention - hardcode when detected
    if ((lowerFieldId.includes('customer') && lowerFieldId.includes('retention')) ||
        lowerFieldId === 'customerretention' ||
        lowerFieldId === 'customer retention' ||
        lowerFieldId.includes('client retention') ||
        lowerFieldId.includes('customer loyalty') ||
        lowerFieldId.includes('customer satisfaction') ||
        lowerFieldId.includes('churn reduction') ||
        lowerFieldId.includes('repeat business') ||
        lowerFieldId.includes('customer experience') ||
        lowerFieldId.includes('client relationship') ||
        lowerFieldId.includes('customer relationship management') ||
        lowerFieldId.includes('customer service')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to customerRetention field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor (note camelCase format)
          onApplySuggestion('customerRetention', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to customerRetention field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('customerRetention');
          setLastAppliedSuggestion({ fieldId: 'customerRetention', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - marketing strategy is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting marketing strategy section and customerRetention focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('marketingStrategy', 'customerRetention');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for customerRetention`);
                  onSectionChange('marketingStrategy', 'customerRetention');
                  
                  // Triple-check with extra long delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for customerRetention`);
                      onSectionChange('marketingStrategy', 'customerRetention');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Customer Retention handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Customer Retention override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }

    // Direct fix for Business Model - hardcode when detected
    if ((lowerFieldId.includes('business') && lowerFieldId.includes('model')) ||
        lowerFieldId === 'businessmodel' ||
        lowerFieldId === 'business model' ||
        lowerFieldId.includes('revenue model') ||
        lowerFieldId.includes('operating model') ||
        lowerFieldId.includes('business framework') ||
        lowerFieldId.includes('value creation') ||
        lowerFieldId.includes('value delivery') ||
        lowerFieldId.includes('value capture') ||
        lowerFieldId.includes('business operation') ||
        lowerFieldId.includes('business approach') ||
        lowerFieldId.includes('business structure')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to businessModel field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('businessModel', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to businessModel field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('businessModel');
          setLastAppliedSuggestion({ fieldId: 'businessModel', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - operationsPlan is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting operations plan section and businessModel focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('operationsPlan', 'businessModel');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for businessModel`);
                  onSectionChange('operationsPlan', 'businessModel');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for businessModel`);
                      onSectionChange('operationsPlan', 'businessModel');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Business Model handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Business Model override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }

    // Direct fix for Facilities - hardcode when detected
    if ((lowerFieldId.includes('facilities') && lowerFieldId.includes('location')) ||
        lowerFieldId === 'facilities' ||
        lowerFieldId.includes('facility') ||
        lowerFieldId.includes('physical location') ||
        lowerFieldId.includes('business location') ||
        lowerFieldId.includes('office space') ||
        lowerFieldId.includes('physical requirements') ||
        lowerFieldId.includes('warehouse') ||
        lowerFieldId.includes('retail space') ||
        lowerFieldId.includes('manufacturing space') ||
        lowerFieldId.includes('workspace') ||
        lowerFieldId.includes('real estate')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to facilities field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('facilities', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to facilities field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('facilities');
          setLastAppliedSuggestion({ fieldId: 'facilities', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - operationsPlan is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting operations plan section and facilities focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('operationsPlan', 'facilities');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for facilities`);
                  onSectionChange('operationsPlan', 'facilities');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for facilities`);
                      onSectionChange('operationsPlan', 'facilities');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Facilities handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Facilities override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for Technology Requirements - hardcode when detected
    if ((lowerFieldId.includes('technology') && lowerFieldId.includes('requirement')) ||
        lowerFieldId === 'technology' ||
        lowerFieldId.includes('tech requirement') ||
        lowerFieldId.includes('tech infrastructure') ||
        lowerFieldId.includes('tech stack') ||
        lowerFieldId.includes('software') ||
        lowerFieldId.includes('hardware') ||
        lowerFieldId.includes('it infrastructure') ||
        lowerFieldId.includes('technical needs') ||
        lowerFieldId.includes('technical resources') ||
        lowerFieldId.includes('technology needs') ||
        lowerFieldId.includes('digital infrastructure')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to technology field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('technology', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to technology field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('technology');
          setLastAppliedSuggestion({ fieldId: 'technology', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - operationsPlan is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting operations plan section and technology focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('operationsPlan', 'technology');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for technology`);
                  onSectionChange('operationsPlan', 'technology');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for technology`);
                      onSectionChange('operationsPlan', 'technology');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Technology Requirements handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Technology Requirements override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for Production Process - hardcode when detected
    if ((lowerFieldId.includes('production') && lowerFieldId.includes('process')) ||
        lowerFieldId === 'productionprocess' ||
        lowerFieldId === 'production process' ||
        lowerFieldId.includes('manufacturing process') ||
        lowerFieldId.includes('service delivery') ||
        lowerFieldId.includes('operational process') ||
        lowerFieldId.includes('product creation') ||
        lowerFieldId.includes('workflow') ||
        lowerFieldId.includes('process flow') ||
        lowerFieldId.includes('assembly') ||
        lowerFieldId.includes('production method') ||
        lowerFieldId.includes('service process')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to productionProcess field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('productionProcess', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to productionProcess field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('productionProcess');
          setLastAppliedSuggestion({ fieldId: 'productionProcess', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - operationsPlan is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting operations plan section and productionProcess focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('operationsPlan', 'productionProcess');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for productionProcess`);
                  onSectionChange('operationsPlan', 'productionProcess');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for productionProcess`);
                      onSectionChange('operationsPlan', 'productionProcess');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Production Process handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Production Process override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for Quality Control - hardcode when detected
    if ((lowerFieldId.includes('quality') && lowerFieldId.includes('control')) ||
        lowerFieldId === 'qualitycontrol' ||
        lowerFieldId === 'quality control' ||
        lowerFieldId.includes('quality assurance') ||
        lowerFieldId.includes('quality management') ||
        lowerFieldId.includes('qa process') ||
        lowerFieldId.includes('quality standards') ||
        lowerFieldId.includes('quality checks') ||
        lowerFieldId.includes('quality procedures') ||
        lowerFieldId.includes('quality system') ||
        lowerFieldId.includes('quality inspection') ||
        lowerFieldId.includes('quality testing')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to qualityControl field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('qualityControl', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to qualityControl field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('qualityControl');
          setLastAppliedSuggestion({ fieldId: 'qualityControl', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - operationsPlan is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting operations plan section and qualityControl focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('operationsPlan', 'qualityControl');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for qualityControl`);
                  onSectionChange('operationsPlan', 'qualityControl');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for qualityControl`);
                      onSectionChange('operationsPlan', 'qualityControl');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Quality Control handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Quality Control override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for Logistics - hardcode when detected
    if ((lowerFieldId.includes('logistics') && lowerFieldId.includes('supply')) ||
        lowerFieldId === 'logistics' ||
        lowerFieldId.includes('supply chain') ||
        lowerFieldId.includes('inventory management') ||
        lowerFieldId.includes('warehousing') ||
        lowerFieldId.includes('shipping') ||
        lowerFieldId.includes('distribution') ||
        lowerFieldId.includes('order fulfillment') ||
        lowerFieldId.includes('vendor management') ||
        lowerFieldId.includes('supplier') ||
        lowerFieldId.includes('procurement') ||
        lowerFieldId.includes('transportation')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to logistics field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('logistics', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to logistics field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('logistics');
          setLastAppliedSuggestion({ fieldId: 'logistics', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - operationsPlan is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting operations plan section and logistics focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('operationsPlan', 'logistics');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for logistics`);
                  onSectionChange('operationsPlan', 'logistics');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for logistics`);
                      onSectionChange('operationsPlan', 'logistics');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Logistics handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Logistics override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for Organizational Structure - hardcode when detected
    if ((lowerFieldId.includes('organizational') && lowerFieldId.includes('structure')) ||
        lowerFieldId === 'structure' ||
        lowerFieldId === 'org structure' ||
        lowerFieldId === 'organization structure' ||
        lowerFieldId.includes('company structure') ||
        lowerFieldId.includes('business structure') ||
        lowerFieldId.includes('reporting structure') ||
        lowerFieldId.includes('team structure') ||
        lowerFieldId.includes('hierarchy') ||
        lowerFieldId.includes('organizational chart') ||
        lowerFieldId.includes('org chart') ||
        lowerFieldId.includes('management structure')) {
      
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to structure field, bypassing all other logic`);
      
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('structure', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to structure field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('structure');
          setLastAppliedSuggestion({ fieldId: 'structure', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - organizationAndManagement is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting organization and management section and structure focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('organizationAndManagement', 'structure');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for structure`);
                  onSectionChange('organizationAndManagement', 'structure');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for structure`);
                      onSectionChange('organizationAndManagement', 'structure');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Organizational Structure handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Organizational Structure override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for HR Plan - hardcode when detected
    if ((lowerFieldId.includes('hr') && lowerFieldId.includes('plan')) ||
        lowerFieldId === 'hrplan' ||
        lowerFieldId === 'hr plan' ||
        lowerFieldId.includes('human resources') ||
        lowerFieldId.includes('staffing plan') ||
        lowerFieldId.includes('recruitment plan') ||
        lowerFieldId.includes('hiring plan') ||
        lowerFieldId.includes('workforce plan') ||
        lowerFieldId.includes('personnel plan') ||
        lowerFieldId.includes('employee plan') ||
        lowerFieldId.includes('talent management') ||
        lowerFieldId.includes('compensation strategy')) {
    
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to hrPlan field, bypassing all other logic`);
    
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('hrPlan', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to hrPlan field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('hrPlan');
          setLastAppliedSuggestion({ fieldId: 'hrPlan', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - organizationAndManagement is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting organization and management section and hrPlan focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('organizationAndManagement', 'hrPlan');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for hrPlan`);
                  onSectionChange('organizationAndManagement', 'hrPlan');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for hrPlan`);
                      onSectionChange('organizationAndManagement', 'hrPlan');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: HR Plan handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in HR Plan override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for Advisors - hardcode when detected
    if ((lowerFieldId.includes('advisor') && lowerFieldId.includes('board')) ||
        lowerFieldId === 'advisors' ||
        lowerFieldId === 'board of advisors' ||
        lowerFieldId === 'advisory board' ||
        lowerFieldId.includes('mentor') ||
        lowerFieldId.includes('board member') ||
        lowerFieldId.includes('director') ||
        lowerFieldId.includes('advisory team') ||
        lowerFieldId.includes('external expertise') ||
        lowerFieldId.includes('advisory council') ||
        lowerFieldId.includes('board of directors') ||
        lowerFieldId.includes('business advisor')) {
    
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to advisors field, bypassing all other logic`);
    
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('advisors', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to advisors field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('advisors');
          setLastAppliedSuggestion({ fieldId: 'advisors', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - organizationAndManagement is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting organization and management section and advisors focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('organizationAndManagement', 'advisors');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for advisors`);
                  onSectionChange('organizationAndManagement', 'advisors');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for advisors`);
                      onSectionChange('organizationAndManagement', 'advisors');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Advisors handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Advisors override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for Financial Projections - hardcode when detected
    if ((lowerFieldId.includes('financial') && lowerFieldId.includes('projection')) ||
        lowerFieldId === 'projections' ||
        lowerFieldId === 'financial projections' ||
        lowerFieldId.includes('financial forecast') ||
        lowerFieldId.includes('revenue projection') ||
        lowerFieldId.includes('profit forecast') ||
        lowerFieldId.includes('expense projection') ||
        lowerFieldId.includes('pro forma') ||
        lowerFieldId.includes('cash flow projection') ||
        lowerFieldId.includes('income projection') ||
        lowerFieldId.includes('financial model') ||
        lowerFieldId.includes('revenue forecast')) {
    
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to projections field, bypassing all other logic`);
    
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('projections', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to projections field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('projections');
          setLastAppliedSuggestion({ fieldId: 'projections', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - financialPlan is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting financial plan section and projections focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('financialPlan', 'projections');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for projections`);
                  onSectionChange('financialPlan', 'projections');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for projections`);
                      onSectionChange('financialPlan', 'projections');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Financial Projections handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Financial Projections override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for Funding Requirements - hardcode when detected
    if ((lowerFieldId.includes('funding') && lowerFieldId.includes('requirement')) ||
        lowerFieldId === 'fundingneeds' ||
        lowerFieldId === 'funding needs' ||
        lowerFieldId.includes('funding requirements') ||
        lowerFieldId.includes('capital needs') ||
        lowerFieldId.includes('investment needs') ||
        lowerFieldId.includes('financing requirements') ||
        lowerFieldId.includes('capital requirements') ||
        lowerFieldId.includes('startup capital') ||
        lowerFieldId.includes('financial needs') ||
        lowerFieldId.includes('investment requirements') ||
        lowerFieldId.includes('funding request')) {
    
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to fundingNeeds field, bypassing all other logic`);
    
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('fundingNeeds', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to fundingNeeds field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('fundingNeeds');
          setLastAppliedSuggestion({ fieldId: 'fundingNeeds', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - financialPlan is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting financial plan section and fundingNeeds focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('financialPlan', 'fundingNeeds');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for fundingNeeds`);
                  onSectionChange('financialPlan', 'fundingNeeds');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for fundingNeeds`);
                      onSectionChange('financialPlan', 'fundingNeeds');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Funding Requirements handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Funding Requirements override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for Use of Funds - hardcode when detected
    if ((lowerFieldId.includes('use') && lowerFieldId.includes('funds')) ||
        lowerFieldId === 'useoffunds' ||
        lowerFieldId === 'use of funds' ||
        lowerFieldId.includes('fund allocation') ||
        lowerFieldId.includes('capital allocation') ||
        lowerFieldId.includes('fund usage') ||
        lowerFieldId.includes('investment allocation') ||
        lowerFieldId.includes('funding allocation') ||
        lowerFieldId.includes('how funds will be used') ||
        lowerFieldId.includes('spending plan') ||
        lowerFieldId.includes('capital utilization') ||
        lowerFieldId.includes('money allocation')) {
    
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to useOfFunds field, bypassing all other logic`);
    
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('useOfFunds', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to useOfFunds field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('useOfFunds');
          setLastAppliedSuggestion({ fieldId: 'useOfFunds', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - financialPlan is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting financial plan section and useOfFunds focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('financialPlan', 'useOfFunds');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for useOfFunds`);
                  onSectionChange('financialPlan', 'useOfFunds');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for useOfFunds`);
                      onSectionChange('financialPlan', 'useOfFunds');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Use of Funds handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Use of Funds override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for Break-Even Analysis - hardcode when detected
    if ((lowerFieldId.includes('break') && lowerFieldId.includes('even')) ||
        lowerFieldId === 'breakevenanalysis' ||
        lowerFieldId === 'break even analysis' ||
        lowerFieldId === 'breakeven' ||
        lowerFieldId === 'break even' ||
        lowerFieldId.includes('break-even') ||
        lowerFieldId.includes('breakeven point') ||
        lowerFieldId.includes('profitability analysis') ||
        lowerFieldId.includes('cost recovery') ||
        lowerFieldId.includes('profit threshold') ||
        lowerFieldId.includes('profitability threshold') ||
        lowerFieldId.includes('cost coverage')) {
    
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to breakEvenAnalysis field, bypassing all other logic`);
    
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('breakEvenAnalysis', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to breakEvenAnalysis field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('breakEvenAnalysis');
          setLastAppliedSuggestion({ fieldId: 'breakEvenAnalysis', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - financialPlan is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting financial plan section and breakEvenAnalysis focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('financialPlan', 'breakEvenAnalysis');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for breakEvenAnalysis`);
                  onSectionChange('financialPlan', 'breakEvenAnalysis');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for breakEvenAnalysis`);
                      onSectionChange('financialPlan', 'breakEvenAnalysis');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Break-Even Analysis handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Break-Even Analysis override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Direct fix for Exit Strategy - hardcode when detected
    if ((lowerFieldId.includes('exit') && lowerFieldId.includes('strategy')) ||
        lowerFieldId === 'exitstrategy' ||
        lowerFieldId === 'exit strategy' ||
        lowerFieldId.includes('exit plan') ||
        lowerFieldId.includes('business exit') ||
        lowerFieldId.includes('company exit') ||
        lowerFieldId.includes('exit opportunities') ||
        lowerFieldId.includes('liquidity event') ||
        lowerFieldId.includes('exit options') ||
        lowerFieldId.includes('exit scenario') ||
        lowerFieldId.includes('end game') ||
        lowerFieldId.includes('harvest strategy')) {
    
      console.log(`[Apply Suggestion Debug] OVERRIDE: Directly applying to exitStrategy field, bypassing all other logic`);
    
      try {
        // Force direct apply with hardcoded values
        if (onApplySuggestion) {
          // Apply directly to the known correct field ID as specified in the editor
          onApplySuggestion('exitStrategy', content);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Successfully applied content to exitStrategy field`);
          
          // Manually update all tracking state to ensure consistency
          setCurrentSubfield('exitStrategy');
          setLastAppliedSuggestion({ fieldId: 'exitStrategy', content });
          setShowSectionPrompt(true);
          
          // Force section navigation and focus with explicit section ID
          if (onSectionChange) {
            // Ensure we're in the correct section first - financialPlan is the correct section
            console.log(`[Apply Suggestion Debug] OVERRIDE: Force setting financial plan section and exitStrategy focus`);
            
            // Give editor time to update by using a timeout
            setTimeout(() => {
              // First navigation attempt
              onSectionChange('financialPlan', 'exitStrategy');
              
              // Double-check focus with multiple attempts to ensure it takes
              setTimeout(() => {
                if (onSectionChange) {
                  console.log(`[Apply Suggestion Debug] OVERRIDE: Second focus attempt for exitStrategy`);
                  onSectionChange('financialPlan', 'exitStrategy');
                  
                  // Third attempt with longer delay as a failsafe
                  setTimeout(() => {
                    if (onSectionChange) {
                      console.log(`[Apply Suggestion Debug] OVERRIDE: Final focus attempt for exitStrategy`);
                      onSectionChange('financialPlan', 'exitStrategy');
                    }
                  }, 500);
                }
              }, 300);
            }, 100);
          }
          
          // Ensure scroll happens after all updates
          setTimeout(scrollToBottom, 300);
          
          console.log(`[Apply Suggestion Debug] OVERRIDE: Exit Strategy handling complete`);
          return;
        }
      } catch (err) {
        console.error(`[Apply Suggestion Debug] ERROR in Exit Strategy override:`, err);
        // If there's an error, let's still try the standard approach
        console.log(`[Apply Suggestion Debug] Falling back to standard processing after error`);
      }
    }
    
    // Normalize the field ID for other fields
    const normalizedFieldId = normalizeFieldId(fieldId);
    console.log(`[Apply Suggestion Debug] Normalized field ID: ${fieldId} → ${normalizedFieldId}`);
    
    // Special handling for problematic fields
    let finalFieldId = normalizedFieldId;
    
    // Ensure Value Proposition uses the exact casing expected by the editor
    if (normalizedFieldId.toLowerCase() === 'valueproposition') {
      finalFieldId = 'valueProposition';
      console.log(`[Apply Suggestion Debug] Special handling for Value Proposition field: ${normalizedFieldId} → ${finalFieldId}`);
    }
    
    // Ensure Intellectual Property uses the exact casing expected by the editor
    if (normalizedFieldId.toLowerCase() === 'intellectualproperty') {
      finalFieldId = 'intellectualProperty';
      console.log(`[Apply Suggestion Debug] Special handling for Intellectual Property field: ${normalizedFieldId} → ${finalFieldId}`);
    }
    
    // Apply the suggestion with the final field ID
    console.log(`[Apply Suggestion Debug] Applying content to field: ${finalFieldId}`);
    onApplySuggestion(finalFieldId, content);
    
    // Update state tracking
    setCurrentSubfield(finalFieldId);
    setLastAppliedSuggestion({ fieldId: finalFieldId, content });
    setShowSectionPrompt(true);
    
    // Manually focus on the field after applying the suggestion
    if (onSectionChange) {
      console.log(`[Apply Suggestion Debug] Setting focus to field: ${finalFieldId}`);
      // Make sure we never pass null as the field ID
      onSectionChange(sectionId, finalFieldId || '');
    }
    
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
    
    // Special handling for Ownership Details field
    if (sectionId === 'companyDescription' && currentSubfield === 'ownershipDetails') {
      console.log('[Suggestion Debug] In Ownership Details context, looking for related suggestions');
      
      // Look for suggestions that might be related to ownership details
      const ownershipDetailsSuggestions = fieldSuggestions.filter(s => {
        const lowerId = s.fieldId.toLowerCase();
        return lowerId.includes('ownership') || 
               lowerId.includes('owner') ||
               lowerId.includes('detail') || 
               lowerId === 'content';
      });
      
      if (ownershipDetailsSuggestions.length > 0) {
        console.log(`[Suggestion Debug] Found ${ownershipDetailsSuggestions.length} Ownership Details related suggestions`);
        filteredSuggestions = ownershipDetailsSuggestions;
      }
    }
    // Special handling for Company History field
    else if (sectionId === 'companyDescription' && currentSubfield === 'companyHistory') {
      console.log('[Suggestion Debug] In Company History context, looking for related suggestions');
      
      // Look for suggestions that might be related to company history
      const companyHistorySuggestions = fieldSuggestions.filter(s => {
        const lowerId = s.fieldId.toLowerCase();
        return lowerId.includes('company') || 
               lowerId.includes('history') || 
               lowerId.includes('founding') ||
               lowerId.includes('background') ||
               lowerId.includes('establishment') ||
               lowerId.includes('origin') ||
               lowerId === 'content';
      });
      
      if (companyHistorySuggestions.length > 0) {
        console.log(`[Suggestion Debug] Found ${companyHistorySuggestions.length} Company History related suggestions`);
        filteredSuggestions = companyHistorySuggestions;
      }
    }
    /**
     * MARKET OPPORTUNITY SPECIAL HANDLING
     * Check if we're in a context where we should prioritize or explicitly show Market Opportunity content
     */
    else if (currentSubfield === 'marketOpportunity' || 
      (sectionId === 'executiveSummary' && 
       fieldSuggestions.some(s => s.fieldId === 'marketOpportunity' || 
                                  s.fieldId === 'market opportunity' || 
                                  s.fieldId.toLowerCase().includes('market')))) {
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
      
      // Special case for Ownership Details
      if (sectionId === 'companyDescription' && currentSubfield === 'ownershipDetails') {
        normalizedFieldId = 'ownershipDetails';
        console.log(`[Suggestion Mapping] Ensuring Ownership Details is properly mapped: ${suggestion.fieldId} -> ${normalizedFieldId}`);
      }
      // Special case for Company History
      else if (sectionId === 'companyDescription' && currentSubfield === 'companyHistory') {
        normalizedFieldId = 'companyHistory';
        console.log(`[Suggestion Mapping] Ensuring Company History is properly mapped: ${suggestion.fieldId} -> ${normalizedFieldId}`);
      }
      // Special case for Market Opportunity
      else if (suggestion.fieldId.toLowerCase().includes('market') || 
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
      console.log('[Suggestion Debug] Setting last shown suggestion:', mappedSuggestions[0]);
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
            
            // Handle special case for Ownership Details explicitly
            if ((fieldIdToUse.toLowerCase().includes('ownership') && 
                 fieldIdToUse.toLowerCase().includes('detail')) || 
                 (sectionId === 'companyDescription' && currentSubfield === 'ownershipDetails')) {
              fieldIdToUse = 'ownershipDetails';
              console.log(`[Suggestion Rendering] Using explicit ownershipDetails ID for: ${suggestion.fieldId}`);
            }
            // Handle special case for Company History explicitly
            else if ((fieldIdToUse.toLowerCase().includes('company') && 
                 fieldIdToUse.toLowerCase().includes('history')) || 
                 fieldIdToUse.toLowerCase().includes('founding') ||
                 fieldIdToUse.toLowerCase().includes('origin') ||
                 fieldIdToUse.toLowerCase().includes('establishment') ||
                 (fieldIdToUse.toLowerCase().includes('company') && fieldIdToUse.toLowerCase().includes('background')) ||
                 (sectionId === 'companyDescription' && currentSubfield === 'companyHistory')) {
              fieldIdToUse = 'companyHistory';
              console.log(`[Suggestion Rendering] Using explicit companyHistory ID for: ${suggestion.fieldId}`);
            }
            // Handle special case for Market Opportunity explicitly
            else if (fieldIdToUse.toLowerCase().includes('market') && 
                (fieldIdToUse.toLowerCase().includes('opportunit') || 
                 fieldIdToUse === 'market' || 
                 fieldIdToUse === 'opportunity')) {
              fieldIdToUse = 'marketOpportunity';
              console.log(`[Suggestion Rendering] Using explicit marketOpportunity ID for: ${suggestion.fieldId}`);
            }
            
            // Get the proper display name for the field
            let fieldName = '';
            
            // Executive Summary fields
            if (fieldIdToUse === 'businessConcept') {
              fieldName = 'Business Concept';
            } else if (fieldIdToUse === 'missionStatement') {
              fieldName = 'Mission Statement';
            } else if (fieldIdToUse === 'productsOverview') {
              fieldName = 'Products/Services Overview';
            } else if (fieldIdToUse === 'marketOpportunity') {
              fieldName = 'Market Opportunity';
            } else if (fieldIdToUse === 'financialHighlights') {
              fieldName = 'Financial Highlights';
            } 
            // Company Description fields
            else if (fieldIdToUse === 'businessStructure') {
              fieldName = 'Business Structure';
            } else if (fieldIdToUse === 'legalStructure') {
              fieldName = 'Legal Structure';
            } else if (fieldIdToUse === 'ownershipDetails') {
              fieldName = 'Ownership Details';
            } else if (fieldIdToUse === 'companyHistory') {
              fieldName = 'Company History';
            }
            // Products and Services fields
            else if (fieldIdToUse === 'overview') {
              fieldName = 'Overview';
            } else if (fieldIdToUse === 'valueProposition') {
              fieldName = 'Value Proposition';
            } else if (fieldIdToUse === 'intellectualProperty') {
              fieldName = 'Intellectual Property';
            } else if (fieldIdToUse === 'futureProducts') {
              fieldName = 'Future Products';
            }
            // Market Analysis fields
            else if (fieldIdToUse === 'industryOverview') {
              fieldName = 'Industry Overview';
            } else if (fieldIdToUse === 'targetMarket') {
              fieldName = 'Target Market';
            } else if (fieldIdToUse === 'marketSegmentation') {
              fieldName = 'Market Segmentation';
            } else if (fieldIdToUse === 'competitiveAnalysis') {
              fieldName = 'Competitive Analysis';
            } else if (fieldIdToUse === 'swotAnalysis') {
              fieldName = 'SWOT Analysis';
            }
            // Marketing Strategy fields
            else if (fieldIdToUse === 'branding') {
              fieldName = 'Branding';
            } else if (fieldIdToUse === 'pricing') {
              fieldName = 'Pricing';
            } else if (fieldIdToUse === 'promotion') {
              fieldName = 'Promotion';
            } else if (fieldIdToUse === 'salesStrategy') {
              fieldName = 'Sales Strategy';
            } else if (fieldIdToUse === 'channels') {
              fieldName = 'Distribution Channels';
            } else if (fieldIdToUse === 'customerRetention') {
              fieldName = 'Customer Retention';
            }
            // Operations Plan fields
            else if (fieldIdToUse === 'businessModel') {
              fieldName = 'Business Model';
            } else if (fieldIdToUse === 'facilities') {
              fieldName = 'Facilities';
            } else if (fieldIdToUse === 'technology') {
              fieldName = 'Technology';
            } else if (fieldIdToUse === 'productionProcess') {
              fieldName = 'Production Process';
            } else if (fieldIdToUse === 'qualityControl') {
              fieldName = 'Quality Control';
            } else if (fieldIdToUse === 'logistics') {
              fieldName = 'Logistics';
            }
            // Organization & Management fields
            else if (fieldIdToUse === 'structure') {
              fieldName = 'Organizational Structure';
            } else if (fieldIdToUse === 'hrPlan') {
              fieldName = 'HR Plan';
            } else if (fieldIdToUse === 'advisors') {
              fieldName = 'Advisors';
            }
            // Financial Plan fields
            else if (fieldIdToUse === 'projections') {
              fieldName = 'Financial Projections';
            } else if (fieldIdToUse === 'fundingNeeds') {
              fieldName = 'Funding Needs';
            } else if (fieldIdToUse === 'useOfFunds') {
              fieldName = 'Use of Funds';
            } else if (fieldIdToUse === 'breakEvenAnalysis') {
              fieldName = 'Break-Even Analysis';
            } else if (fieldIdToUse === 'exitStrategy') {
              fieldName = 'Exit Strategy';
            }
            // Default to the SUBFIELD_NAMES or the field ID for any field not explicitly handled
            else {
              fieldName = SUBFIELD_NAMES[fieldIdToUse] || fieldIdToUse;
            }
            
            // Don't render suggestions that might not apply to the current context
            // except for fields that we handle specially with proper field name mapping
            if (currentSubfield && 
                fieldIdToUse !== currentSubfield && 
                fieldIdToUse !== 'marketOpportunity' &&
                fieldIdToUse !== 'companyHistory' &&
                fieldIdToUse !== 'businessConcept' &&
                fieldIdToUse !== 'missionStatement' &&
                fieldIdToUse !== 'productsOverview' &&
                fieldIdToUse !== 'financialHighlights' &&
                fieldIdToUse !== 'businessStructure' &&
                fieldIdToUse !== 'legalStructure' &&
                fieldIdToUse !== 'ownershipDetails' &&
                fieldIdToUse !== 'overview' &&
                fieldIdToUse !== 'valueProposition' &&
                fieldIdToUse !== 'intellectualProperty' &&
                fieldIdToUse !== 'futureProducts' &&
                fieldIdToUse !== 'industryOverview' &&
                fieldIdToUse !== 'targetMarket' &&
                fieldIdToUse !== 'marketSegmentation' &&
                fieldIdToUse !== 'competitiveAnalysis' &&
                fieldIdToUse !== 'swotAnalysis' &&
                fieldIdToUse !== 'branding' &&
                fieldIdToUse !== 'pricing' &&
                fieldIdToUse !== 'promotion' &&
                fieldIdToUse !== 'salesStrategy' &&
                fieldIdToUse !== 'channels' &&
                fieldIdToUse !== 'customerRetention' &&
                fieldIdToUse !== 'businessModel' &&
                fieldIdToUse !== 'facilities' &&
                fieldIdToUse !== 'technology' &&
                fieldIdToUse !== 'productionProcess' &&
                fieldIdToUse !== 'qualityControl' &&
                fieldIdToUse !== 'logistics' &&
                fieldIdToUse !== 'structure' &&
                fieldIdToUse !== 'hrPlan' &&
                fieldIdToUse !== 'advisors' &&
                fieldIdToUse !== 'projections' &&
                fieldIdToUse !== 'fundingNeeds' &&
                fieldIdToUse !== 'useOfFunds' &&
                fieldIdToUse !== 'breakEvenAnalysis' &&
                fieldIdToUse !== 'exitStrategy') {
              console.log(`[Suggestion Rendering] Skipping suggestion with field ID ${fieldIdToUse} that doesn't match current subfield ${currentSubfield}`);
              return null;
            }
            
            return (
            <div key={index} className="rounded-md border border-blue-100 bg-blue-50 p-3">
              <div className="text-sm text-blue-700 mb-1 font-medium">
                  {fieldName}
              </div>
              <div className="text-sm text-gray-700 mb-2">{suggestion.content}</div>
              <div className="text-xs text-gray-600 italic mb-1">
                {fieldIdToUse === 'branding' ? 
                  "Does this resonate with your vision for your brand?" :
                 fieldIdToUse === 'valueProposition' ?
                  "Does this value proposition capture what makes your offering unique?" :
                 fieldIdToUse === 'targetMarket' ?
                  "Does this accurately describe your target customers?" :
                 fieldIdToUse === 'competitiveAnalysis' ?
                  "Is this competitive analysis reflective of your market position?" :
                 fieldIdToUse === 'marketSegmentation' ?
                  "Does this segmentation approach make sense for your business?" :
                 fieldIdToUse === 'swotAnalysis' ?
                  "Does this SWOT analysis identify your key factors accurately?" :
                 fieldIdToUse === 'industryOverview' ?
                  "Does this overview capture the key aspects of your industry?" :
                 fieldIdToUse === 'futureProducts' ?
                  "Does this align with your future product roadmap?" :
                 fieldIdToUse === 'intellectualProperty' ?
                  "Is this description of your intellectual property assets accurate?" :
                 fieldIdToUse === 'pricing' ?
                  "Does this pricing strategy align with your business model and market positioning?" :
                 fieldIdToUse === 'promotion' ?
                  "Does this promotion plan effectively address how you'll reach and attract customers?" :
                 fieldIdToUse === 'salesStrategy' ?
                  "Does this sales strategy outline an effective approach to converting leads into customers?" :
                 fieldIdToUse === 'channels' ?
                  "Does this distribution channel strategy effectively cover how your products/services will reach customers?" :
                 fieldIdToUse === 'customerRetention' ?
                  "Does this retention strategy outline how you'll keep customers engaged and coming back?" :
                 fieldIdToUse === 'businessModel' ?
                  "Does this business model accurately describe how your company creates, delivers, and captures value?" :
                 fieldIdToUse === 'facilities' ?
                  "Does this facilities description adequately address your physical location needs?" :
                 fieldIdToUse === 'technology' ?
                  "Does this technology overview properly outline your software, hardware, and tech infrastructure needs?" :
                 fieldIdToUse === 'productionProcess' ?
                  "Does this production process description accurately outline how you'll create and deliver your offerings?" :
                 fieldIdToUse === 'qualityControl' ?
                  "Does this quality control section effectively explain how you'll ensure consistent product/service quality?" :
                 fieldIdToUse === 'logistics' ?
                  "Does this logistics plan effectively outline how you'll manage inventory, shipping, and suppliers?" :
                 fieldIdToUse === 'structure' ?
                  "Does this organizational structure accurately reflect your company's hierarchy and reporting relationships?" :
                 fieldIdToUse === 'hrPlan' ?
                  "Does this HR plan effectively cover your hiring plans, staffing requirements, and compensation strategy?" :
                 fieldIdToUse === 'advisors' ?
                  "Does this advisors section appropriately highlight the external expertise supporting your business?" :
                 fieldIdToUse === 'projections' ?
                  "Do these financial projections effectively forecast your revenue, expenses, and profit for the coming years?" :
                 fieldIdToUse === 'fundingNeeds' ?
                  "Does this funding requirements section clearly outline how much funding you need and why?" :
                 fieldIdToUse === 'useOfFunds' ?
                  "Does this use of funds section clearly detail how the investment will be allocated?" :
                 fieldIdToUse === 'breakEvenAnalysis' ?
                  "Does this break-even analysis effectively show when your business will become profitable?" :
                 fieldIdToUse === 'exitStrategy' ?
                  "Does this exit strategy clearly outline your long-term plans for the business and potential exit opportunities?" :
                  "Would you like to use this suggestion for your business plan?"}
              </div>
              <div className="text-xs text-gray-500">
                Reply "yes" to apply this suggestion, or provide feedback for adjustments.
              </div>
            </div>
            );
          })}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          These suggestions are based on my understanding of your business plan so far.
        </div>
      </div>
    );
  }
  
  /**
   * Handle section selection in the menu
   */
  const handleSelectMainSection = (section: string) => {
    if (selectedMainSection === section) {
      // If clicking the same section again, collapse it
      setSelectedMainSection(null);
    } else {
      // Otherwise, expand to show subsections
      setSelectedMainSection(section);
    }
  };
  
  /**
   * Handle subsection selection in the menu
   */
  const handleSelectSubsection = (mainSection: string, subsection: string) => {
    // Use the existing navigation functionality
    if (onSectionChange) {
      // Add concise navigation messages
      const sectionName = SECTION_NAMES[mainSection];
      const subsectionName = SUBFIELD_NAMES[subsection] || subsection;
      
      // Add user message (short version)
      setMessages((prev) => [...prev, {
        role: 'user',
        content: `Go to ${subsectionName}`
      }]);
      
      // Add assistant response (concise)
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Navigating to ${sectionName} > ${subsectionName}. What would you like to work on in this section? I can help with ideas, step by step guidance, or answering questions.`
      }]);

      // Navigate to the selected section and subsection
      onSectionChange(mainSection, subsection);
      
      // Reset menu state after navigation
      setSelectedMainSection(null);
      setIsMenuOpen(false);
      
      // Set current subfield to ensure proper context
      setTimeout(() => setCurrentSubfield(subsection), 300);
    }
  };
  
  /**
   * Render the section navigation menu dropdown
   */
  const renderSectionMenu = () => {
    if (!isMenuOpen) {
      // When menu is collapsed, just show the dropdown button
    return (
        <div className="border-b border-gray-200 py-1 px-2 bg-white">
                <button 
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center text-xs font-medium text-gray-700 hover:text-blue-600"
                >
            <ChevronRight className="h-3 w-3 mr-1" />
            Menu
                </button>
              </div>
      );
    }
    
    // When menu is open, show the full section navigation
    return (
      <div className="border rounded-md bg-white p-2 text-xs">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-xs font-medium text-gray-700">Business Plan Sections</h4>
                  <button
            onClick={() => setIsMenuOpen(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
                  >
            <X className="h-3 w-3" />
                  </button>
              </div>
        <div className="space-y-1">
              {SECTION_ORDER.map(section => (
            <div key={section} className="rounded border border-gray-200">
                <button
                onClick={() => handleSelectMainSection(section)}
                className={`w-full text-left px-2 py-1 flex justify-between items-center text-xs ${
                  section === sectionId ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <span>{SECTION_NAMES[section]}</span>
                <span>{selectedMainSection === section ? '▼' : '►'}</span>
              </button>
              
              {selectedMainSection === section && SECTION_SUBSECTIONS[section] && (
                <div className="pl-2 pr-1 py-1 bg-gray-50 border-t border-gray-200">
                  {SECTION_SUBSECTIONS[section].map(subsection => (
                    <button
                      key={subsection}
                      onClick={() => handleSelectSubsection(section, subsection)}
                      className={`w-full text-left px-2 py-0.5 my-0.5 text-xs rounded ${
                        currentSubfield === subsection ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                      }`}
                    >
                      {SUBFIELD_NAMES[subsection] || subsection}
                </button>
              ))}
            </div>
          )}
        </div>
          ))}
      </div>
      </div>
    );
  };
  
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
      
      {/* Simplified header */}
      <div className={`flex items-center justify-between border-b ${isCompactMode ? 'p-2' : 'p-3'}`}>
        <div className="flex items-center">
          <MessageSquare className={`text-blue-500 ${isCompactMode ? 'h-4 w-4 mr-1' : 'h-5 w-5 mr-2'}`} />
          <h3 className={`font-medium ${isCompactMode ? 'text-sm' : 'text-base'}`}>
            AI Assistant
          </h3>
        </div>
        
        {/* Just close button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            {isOpen ? <X className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          </button>
      </div>
      
      {/* Adjust the message container to take full height */}
      {isOpen && (
        <div className="flex-grow overflow-hidden flex flex-col">
          <div 
            ref={messagesContainerRef}
            className={`flex-grow overflow-y-auto pt-0 px-3 pb-3 ${
              isCompactMode ? 'max-h-[350px]' : 'max-h-[450px]'
            } ${
              messages.length === 0 ? 'min-h-[200px] empty-state-container' : ''
            }`}
          >
            {/* Always show the menu dropdown at the top */}
            <div className="sticky top-0 z-10 -mx-3 mb-2">
              {renderSectionMenu()}
            </div>
            
            {/* Messages UI */}
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
        </div>
      )}
    </div>
  );
}

/**
 * Handles contextual navigation based on recent conversation
 * @param userMessage The user's message
 * @returns True if navigation was handled
 */
const handleContextualNavigation = (userMessage: string): boolean => {
  // Check if the user's message indicates they want to proceed with a suggestion
  const isNavigationIntent = (
    userMessage.toLowerCase().trim() === 'move on' ||
    userMessage.toLowerCase().trim() === 'let\'s move on' ||
    userMessage.toLowerCase().trim() === 'lets move on' ||
    userMessage.toLowerCase().trim() === 'continue' ||
    userMessage.toLowerCase().trim() === 'next' ||
    userMessage.toLowerCase().trim() === 'next section' ||
    userMessage.toLowerCase().trim() === 'continue to next' ||
    userMessage.toLowerCase().trim() === 'move to next' ||
    userMessage.toLowerCase().trim().startsWith('move on') ||
    userMessage.toLowerCase().trim().startsWith('let\'s move') ||
    userMessage.toLowerCase().trim().startsWith('lets move') ||
    userMessage.toLowerCase().trim().startsWith('continue to')
  );
  
  if (!isNavigationIntent) return false;
  
  // Check the most recent assistant message to see if it mentions moving to a specific section
  const recentMessages = messages.slice(-3); // Get the last 3 messages
  
  // Look for suggestions to move to specific sections in recent messages
  for (const msg of recentMessages) {
    if (msg.role === 'assistant') {
      const content = msg.content.toLowerCase();
      
      // Look for section suggestions in the message
      for (const [sectId, subsections] of Object.entries(SECTION_SUBSECTIONS)) {
        // Skip the current section as we're looking for suggestions to move to a different section
        if (sectId === sectionId) continue;
        
        const sectionName = SECTION_NAMES[sectId]?.toLowerCase();
        if (!sectionName) continue;
        
        // Check if the message suggests moving to this section
        if (content.includes(`next section is ${sectionName}`) || 
            content.includes(`next part is ${sectionName}`) ||
            content.includes(`next section is the ${sectionName}`) ||
            content.includes(`next part is the ${sectionName}`) ||
            content.includes(`move on to ${sectionName}`) ||
            content.includes(`move on to the ${sectionName}`) ||
            content.includes(`continue to ${sectionName}`) ||
            content.includes(`continue to the ${sectionName}`) ||
            content.includes(`move onto ${sectionName}`) ||
            content.includes(`move onto the ${sectionName}`)) {
          
          console.log(`[Contextual Navigation] Found suggestion to move to ${sectionName} section`);
          
          // Navigate to the section
          if (onSectionChange) {
            onSectionChange(sectId);
            
            // Add messages to provide context
            setMessages([
              ...messages,
              { role: 'user', content: userMessage },
              { 
                role: 'assistant', 
                content: `I've navigated to the ${SECTION_NAMES[sectId]} section for you. How would you like to proceed with this section?` 
              }
            ]);
            
            return true;
          }
        }
        
        // Check for subsection suggestions (e.g., "Products Overview", "Mission Statement")
        for (const subsection of subsections) {
          const subsectionName = SUBFIELD_NAMES[subsection]?.toLowerCase();
          if (!subsectionName) continue;
          
          // Check if the message suggests moving to this specific subsection
          if (content.includes(`next section is ${subsectionName}`) || 
              content.includes(`next part is ${subsectionName}`) ||
              content.includes(`next section is the ${subsectionName}`) ||
              content.includes(`next part is the ${subsectionName}`) ||
              content.includes(`move on to ${subsectionName}`) || 
              content.includes(`move on to the ${subsectionName}`) ||
              content.includes(`continue to ${subsectionName}`) ||
              content.includes(`continue to the ${subsectionName}`) ||
              content.includes(`move onto ${subsectionName}`) ||
              content.includes(`move onto the ${subsectionName}`)) {
            
            console.log(`[Contextual Navigation] Found suggestion to move to ${subsectionName} in ${SECTION_NAMES[sectId]} section`);
            
            // Navigate to the section and focus on the specific field
            if (onSectionChange) {
              onSectionChange(sectId, subsection);
              
              // Add messages to provide context
              setMessages([
                ...messages,
                { role: 'user', content: userMessage },
                { 
                  role: 'assistant', 
                  content: `I've navigated to the ${subsectionName} field in the ${SECTION_NAMES[sectId]} section. How would you like to proceed?` 
                }
              ]);
              
              return true;
            }
          }
        }
      }
    }
  }
  
  return false;
};