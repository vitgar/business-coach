/**
 * Utility functions for questionnaire components
 * This file contains helper functions used by the generic questionnaire component
 * and related components.
 */

/**
 * Clean API response content
 * Removes JSON structures and code blocks from the response content
 * 
 * @param content - The content to clean
 * @returns The cleaned content
 */
export function cleanResponseContent(content: string): string {
  let cleanedContent = content;
  
  // Remove markdown code blocks with language specification
  cleanedContent = cleanedContent.replace(/```(?:json|javascript|typescript|js|ts)[\s\S]*?```/g, '');
  
  // Remove any generic code blocks
  cleanedContent = cleanedContent.replace(/```[\s\S]*?```/g, '');
  
  // Remove inline code with backticks
  cleanedContent = cleanedContent.replace(/`[^`]*`/g, '');
  
  return cleanedContent;
}

/**
 * Extract section data from a complete business plan
 * 
 * @param businessPlanData - The complete business plan data
 * @param sectionId - The ID of the section to extract
 * @returns The extracted section data or an empty object
 */
export function extractSectionData(businessPlanData: any, sectionId: string): any {
  if (!businessPlanData) return {};
  
  // Try direct section data
  if (businessPlanData[sectionId]) {
    return businessPlanData[sectionId];
  }
  
  // Try content field
  if (businessPlanData.content?.[sectionId]) {
    return businessPlanData.content[sectionId];
  }
  
  // Try specialized data fields (for backward compatibility)
  const legacyFieldMappings: Record<string, string> = {
    'visionAndGoals': 'visionData',
    'productsOrServices': 'productsData',
    'targetMarket': 'marketsData',
    'distributionStrategy': 'distributionData',
    'legalStructure': 'legalStructureData'
  };
  
  const legacyField = legacyFieldMappings[sectionId];
  if (legacyField && businessPlanData[legacyField]) {
    return businessPlanData[legacyField];
  }
  
  // Check for marketing plan sections
  if (businessPlanData.marketingPlan) {
    const marketingPlanSections = ['positioning', 'pricing', 'promotional', 'sales'];
    if (marketingPlanSections.includes(sectionId) && businessPlanData.marketingPlan[sectionId]) {
      return businessPlanData.marketingPlan[sectionId];
    }
  }
  
  return {};
}

/**
 * Generate a system prompt for help based on section ID
 * 
 * @param sectionId - The ID of the section
 * @returns A tailored system prompt for help
 */
export function generateHelpPrompt(sectionId: string): string {
  const basePrompt = `The user needs help defining their ${sectionId}. Break down the current question into simpler parts and provide 2-3 specific examples. Format your response as:

"Let me help you with some examples:

1. [Specific example with concrete details]
2. [Specific example with concrete details]
3. [Specific example with concrete details]

Would you like to:
- Use one of these examples as your starting point?
- Modify your current approach with some ideas from these examples?
- See different examples?

Keep examples concrete and measurable.`;

  // Add section-specific guidance
  const additionalGuidance: Record<string, string> = {
    'visionAndGoals': 'Focus on creating a vision that inspires and goals that are SMART (Specific, Measurable, Achievable, Relevant, Time-bound).',
    'productsOrServices': 'Focus on unique selling points and competitive advantages.',
    'targetMarket': 'Focus on specific demographic, psychographic, and behavioral characteristics.',
    'distributionStrategy': 'Focus on efficient channels that reach the target market effectively.',
    'positioning': 'Focus on unique value proposition and market differentiation.',
    'pricing': 'Focus on value-based pricing and competitive analysis.',
    'promotional': 'Focus on cost-effective channels that reach the target audience.',
    'sales': 'Focus on defined processes and measurable conversion metrics.',
    'legalStructure': 'Focus on liability protection and tax advantages.'
  };
  
  if (additionalGuidance[sectionId]) {
    return `${basePrompt} ${additionalGuidance[sectionId]}`;
  }
  
  return basePrompt;
}

/**
 * Format a complete business plan based on compiled sections
 * 
 * @param sections - Object containing formatted content for each section
 * @returns Formatted business plan markdown
 */
export function formatCompletePlan(sections: Record<string, string>): string {
  const parts = [];
  
  // Define section order and titles
  const sectionOrder = [
    { id: 'visionAndGoals', title: '# Vision and Business Goals' },
    { id: 'productsOrServices', title: '# Products/Services Offered' },
    { id: 'targetMarket', title: '# Markets/Customers Served' },
    { id: 'distributionStrategy', title: '# Distribution Strategy' },
    { id: 'legalStructure', title: '# Legal Structure' },
    { id: 'positioning', title: '# Market Positioning' },
    { id: 'pricing', title: '# Pricing Strategy' },
    { id: 'promotional', title: '# Promotional Activities' },
    { id: 'sales', title: '# Sales Strategy' }
  ];
  
  // Add sections in order if they exist
  for (const section of sectionOrder) {
    if (sections[section.id]) {
      parts.push(`${section.title}\n\n${sections[section.id]}\n\n`);
    }
  }
  
  // Add any additional sections that might not be in the predefined order
  for (const [id, content] of Object.entries(sections)) {
    if (!sectionOrder.some(s => s.id === id) && content) {
      // Convert sectionId from camelCase to Title Case
      const title = id
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      
      parts.push(`# ${title}\n\n${content}\n\n`);
    }
  }
  
  return parts.join('');
}

/**
 * Get appropriate API endpoint based on section ID
 * 
 * @param sectionId - The ID of the section
 * @returns The API endpoint path
 */
export function getSectionApiEndpoint(sectionId: string): string {
  const endpointMap: Record<string, string> = {
    'visionAndGoals': '/vision',
    'productsOrServices': '/products',
    'targetMarket': '/markets',
    'distributionStrategy': '/distribution',
    'legalStructure': '/legal-structure',
    'positioning': '/marketing-plan/positioning',
    'pricing': '/marketing-plan/pricing',
    'promotional': '/marketing-plan/promotional',
    'sales': '/marketing-plan/sales'
  };
  
  return endpointMap[sectionId] || `/${sectionId.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
} 