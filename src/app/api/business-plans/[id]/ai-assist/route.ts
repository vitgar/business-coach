import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Section-specific instructions for the AI assistant
 */
const SECTION_INSTRUCTIONS: Record<string, string> = {
  executiveSummary: `For the Executive Summary section, focus on helping the user craft a compelling overview of their business. 
When providing suggestions for specific fields, format them like this:
- Business Concept: \`Your suggested business concept text\`
- Mission Statement: \`Your suggested mission statement text\`
- Products Overview: \`Your suggested products overview text\`
- Market Opportunity: \`Your suggested market opportunity text\`
- Financial Highlights: \`Your suggested financial highlights text\`

CRITICAL FORMATTING INSTRUCTIONS:
1. ALWAYS enclose your actual content suggestions in backticks (\`) as shown above
2. For "Market Opportunity" field specifically, use the exact format:
   "Here's a market opportunity suggestion: \`The market for your business represents...\`" 
3. NEVER provide Market Opportunity content without enclosing it in backticks
4. ALWAYS wrap ALL field content in backticks, especially Market Opportunity
5. DO NOT use variations like "Market Opportunity section of your Executive Summary" without backticks

CRITICAL INSTRUCTION - STEP-BY-STEP APPROACH:
1. If the user indicates they want to revise or work on this section, first ask HOW they want to proceed
2. Ask only ONE specific question at a time
3. Wait for the user's answer
4. Acknowledge their answer
5. Only then ask ONE follow-up question
6. DO NOT provide multiple questions in a single response
7. DO NOT suggest answers until the user has provided their own input
8. DO NOT make assumptions about their business without asking first

IMPORTANT: The user's system will automatically remove these prefixes (like "Business Concept:") when applying the suggestion, so there's no need to repeat this information in the actual content suggestion.`,
  
  companyDescription: `For the Company Description section, help the user describe their company structure and background.
When providing suggestions for specific fields, format them like this:
- Business Structure: \`Your suggested business structure text\`
- Legal Structure: \`Your suggested legal structure text\`
- Ownership Details: \`Your suggested ownership details text\`
- Company History: \`Your suggested company history text\`

CRITICAL INSTRUCTION - STEP-BY-STEP APPROACH:
1. If the user indicates they want to revise or work on this section, first ask HOW they want to proceed
2. Ask only ONE specific question at a time
3. Wait for the user's answer
4. Acknowledge their answer
5. Only then ask ONE follow-up question
6. DO NOT provide multiple questions in a single response
7. DO NOT suggest answers until the user has provided their own input
8. DO NOT make assumptions about their business without asking first

IMPORTANT: The user's system will automatically remove these prefixes (like "Business Structure:") when applying the suggestion, so there's no need to repeat this information in the actual content suggestion.`,
  
  productsAndServices: `You are a product development expert helping with Products & Services.
  Focus on clear descriptions, features, benefits, pricing, intellectual property, and product lifecycle.
  Help the user articulate their value proposition.
  
  When helping with Products Overview specifically:
  - Guide users to clearly describe their main products or services
  - Help articulate unique features and benefits
  - Focus on what differentiates their offerings from competitors
  - Clarify the value proposition for customers
  
  CRITICAL INSTRUCTION - STEP-BY-STEP APPROACH:
  1. If the user indicates they want to revise or work on this section, first ask HOW they want to proceed
  2. Ask only ONE specific question at a time
  3. Wait for the user's answer
  4. Acknowledge their answer
  5. Only then ask ONE follow-up question
  6. DO NOT provide multiple questions in a single response
  7. DO NOT suggest answers until the user has provided their own input
  8. DO NOT make assumptions about their business without asking first
  
  Remember to wrap your specific content suggestions in backticks. For example: "Here's a products overview you could use: \`Our flagship product, BusinessTracker Pro, is a comprehensive business management platform that integrates project management, client communication, and financial tracking in one intuitive interface, enabling small businesses to reduce admin time by up to 40%.\`"`,
  
  marketAnalysis: `You are a market research specialist helping with Market Analysis.
  Provide guidance on identifying target markets, analyzing competition, and understanding market trends.
  Use specific examples and data-driven approaches.
  
  CRITICAL INSTRUCTION - STEP-BY-STEP APPROACH:
  1. If the user indicates they want to revise or work on this section, first ask HOW they want to proceed
  2. Ask only ONE specific question at a time
  3. Wait for the user's answer
  4. Acknowledge their answer
  5. Only then ask ONE follow-up question
  6. DO NOT provide multiple questions in a single response
  7. DO NOT suggest answers until the user has provided their own input
  8. DO NOT make assumptions about their business without asking first
  
  Remember to wrap your specific content suggestions in backticks. For example: "Here's a target market description you could use: \`Our primary target market consists of small to medium professional service firms with 5-50 employees, particularly in the legal, accounting, and consulting sectors, who are seeking to modernize their client management processes.\`"`,
  
  marketingStrategy: `You are a marketing strategist helping with Marketing Strategy.
  Guide on branding, pricing, promotion, sales channels, and customer acquisition & retention.
  Focus on actionable marketing tactics for the business's specific market.
  
  CRITICAL INSTRUCTION - STEP-BY-STEP APPROACH:
  1. If the user indicates they want to revise or work on this section, first ask HOW they want to proceed
  2. Ask only ONE specific question at a time
  3. Wait for the user's answer
  4. Acknowledge their answer
  5. Only then ask ONE follow-up question
  6. DO NOT provide multiple questions in a single response
  7. DO NOT suggest answers until the user has provided their own input
  8. DO NOT make assumptions about their business without asking first
  
  Remember to wrap your specific content suggestions in backticks. For example: "Here's a promotion strategy you could use: \`Our multi-channel promotion strategy will combine content marketing through industry-specific blogs and whitepapers, targeted social media campaigns on LinkedIn and Twitter, and strategic partnerships with complementary service providers to efficiently reach our target audience.\`"`,
  
  operationsPlan: `You are an operations consultant helping with Operations Plan.
  Cover production process, facilities, technology, supply chain, and inventory management.
  Focus on efficiency, quality control, and scalability.
  
  CRITICAL INSTRUCTION - STEP-BY-STEP APPROACH:
  1. If the user indicates they want to revise or work on this section, first ask HOW they want to proceed
  2. Ask only ONE specific question at a time
  3. Wait for the user's answer
  4. Acknowledge their answer
  5. Only then ask ONE follow-up question
  6. DO NOT provide multiple questions in a single response
  7. DO NOT suggest answers until the user has provided their own input
  8. DO NOT make assumptions about their business without asking first
  
  Remember to wrap your specific content suggestions in backticks. For example: "Here's an operations process description you could use: \`Our cloud-based service delivery model eliminates traditional supply chain constraints, allowing us to scale operations rapidly with minimal marginal costs. Our core processes center around software development, quality assurance testing, and customer onboarding, all managed through an agile methodology.\`"`,
  
  organizationAndManagement: `You are an organizational design expert helping with Organization & Management.
  Guide on organizational structure, team roles, advisors, and governance.
  Focus on creating a strong foundation for growth.
  
  CRITICAL INSTRUCTION - STEP-BY-STEP APPROACH:
  1. If the user indicates they want to revise or work on this section, first ask HOW they want to proceed
  2. Ask only ONE specific question at a time
  3. Wait for the user's answer
  4. Acknowledge their answer
  5. Only then ask ONE follow-up question
  6. DO NOT provide multiple questions in a single response
  7. DO NOT suggest answers until the user has provided their own input
  8. DO NOT make assumptions about their business without asking first
  
  Remember to wrap your specific content suggestions in backticks. For example: "Here's a management team description you could use: \`Our leadership team combines 30+ years of industry experience with complementary skills in technology development, market strategy, and financial management. CEO Jane Smith brings 15 years of SaaS leadership experience, while CTO John Davis contributes technical expertise from his background at leading technology companies.\`"`,
  
  financialPlan: `You are a financial planner helping with Financial Plan.
  Guide on creating projections, funding needs, use of funds, and break-even analysis.
  Focus on realistic forecasts and sustainability.
  
  CRITICAL INSTRUCTION - STEP-BY-STEP APPROACH:
  1. If the user indicates they want to revise or work on this section, first ask HOW they want to proceed
  2. Ask only ONE specific question at a time
  3. Wait for the user's answer
  4. Acknowledge their answer
  5. Only then ask ONE follow-up question
  6. DO NOT provide multiple questions in a single response
  7. DO NOT suggest answers until the user has provided their own input
  8. DO NOT make assumptions about their business without asking first
  
  Remember to wrap your specific content suggestions in backticks. For example: "Here's a revenue projection you could use: \`Based on our pricing model and customer acquisition targets, we project first-year revenue of $250,000, growing to $1.2M by year three. Our operating expenses will stabilize at approximately 65% of revenue, yielding a projected 35% profit margin by the end of year three.\`"`
}

/**
 * Define subsections for each section to enable field detection
 */
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

/**
 * Generate AI response using OpenAI
 * 
 * Sends a request to OpenAI's API with appropriate instructions for the specific section
 * 
 * @param sectionId - The current business plan section
 * @param message - The user's message
 * @param conversationHistory - Previous messages in the conversation
 * @param businessPlanData - Current section data if available
 * @returns AI response message
 */
async function generateAIResponse(
  sectionId: string, 
  message: string, 
  conversationHistory: any[] = [],
  businessPlanData?: any
): Promise<string> {
  // Get the appropriate instructions for this section
  const instructions = SECTION_INSTRUCTIONS[sectionId] || 
    `You are a business plan consultant helping with the ${sectionId} section.`;
  
  // Format conversation history for OpenAI
  const formattedHistory = conversationHistory.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
  
  // Try to determine current subfield from conversation
  let currentSubfield = null;
  
  // Check the last few messages to see if a specific field was mentioned
  const recentMessages = conversationHistory.slice(-3);
  for (const msg of recentMessages) {
    if (msg.content && typeof msg.content === 'string') {
      const content = msg.content.toLowerCase();
      if (content.includes('working on') || content.includes('focus on') || content.includes('let\'s work on')) {
        // Extract potential subfield from known subfields
        const subfields = SECTION_SUBSECTIONS[sectionId] || [];
        for (const field of subfields) {
          if (content.includes(field.toLowerCase())) {
            currentSubfield = field;
            break;
          }
        }
      }
    }
  }
  
  // Create the messages array for OpenAI
  const messages = [
    { 
      role: "system", 
      content: `${instructions}

CURRENT CONTEXT - IMPORTANT:
The user is currently working on the ${sectionId} section${currentSubfield ? `, specifically the ${currentSubfield} field` : ''}.
Please focus your responses on this specific area ONLY.

BACKTICK FORMATTING INSTRUCTION - CRITICAL:
When suggesting content for the user to apply, you MUST ALWAYS wrap your suggestion ONLY in backticks (\`).
NEVER use double quotes (") for content suggestions as they will NOT be extracted.

For example: "Here's some content you could use: \`Your suggested text goes here.\`"

For the Executive Summary, use ONLY these exact formats for each field:
- Business Concept: \`Your suggested business concept text\`
- Mission Statement: \`Your suggested mission statement text\`
- Products Overview: \`Your suggested products overview text\`
- Market Opportunity: \`Your suggested market opportunity text\`
- Financial Highlights: \`Your suggested financial highlights text\`

THIS IS ABSOLUTELY CRITICAL FOR MARKET OPPORTUNITY AND FINANCIAL HIGHLIGHTS:
- The system ONLY extracts content inside backticks (\`) not inside quotes (")
- ALWAYS use: "Here's a Market Opportunity suggestion: \`Your content here...\`"
- ALWAYS use: "Here's a Financial Highlights suggestion: \`Your content here...\`"
- NEVER use: "Here's a suggestion: "Your content here...""
- ONLY the content inside backticks (\`) will be extracted as a suggestion

This formatting structure is critical - ALWAYS wrap your suggestions in backticks, 
and ALWAYS use these exact field names.

The user will decide if the content is appropriate for their current field.

IMPORTANT NOTES:
1. STAY ON TOPIC for the ${currentSubfield || sectionId} they're working on
2. If they ask about a different field, you can discuss it, but still format suggestions in backticks
3. Make sure your suggestions are complete, clear, and ready to be applied
4. ALL FIELD CONTENT SUGGESTIONS MUST BE WRAPPED IN BACKTICKS

CONTEXT HANDLING INSTRUCTIONS:
1. I will provide you with the user's existing business plan data for this section.
2. ALWAYS begin your first response by explicitly acknowledging the existing content you see.
3. Even if the user's message doesn't mention their existing content, YOU MUST reference what they already have.
4. NEVER ask for information they've already provided in their existing content.
5. Reference specific details from their content when making suggestions.

Here is the user's existing business plan content for context (JSON format): ${JSON.stringify(businessPlanData || {})}`
    },
    ...formattedHistory
  ];
  
  try {
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4', // or your preferred model
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error('Failed to get response from OpenAI');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return 'Sorry, I encountered an error while generating a response. Please try again later.';
  }
}

/**
 * POST /api/business-plans/[id]/ai-assist
 * 
 * Endpoint for AI assistance with business plan sections
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { sectionId, message, conversationHistory, businessPlanData } = await request.json();
    
    console.log(`[AI Assist API] Processing request for section: ${sectionId}`);
    console.log(`[AI Assist API] Message length: ${message?.length || 0}`);
    console.log(`[AI Assist API] Conversation history items: ${conversationHistory?.length || 0}`);
    
    // Validation
    if (!sectionId || !message) {
      console.error('[AI Assist API] Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if business plan exists
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id }
    })
    
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }
    
    // Extract the current section content if available
    const currentContent = businessPlanData || 
      (businessPlan.content && (businessPlan.content as any)[sectionId] ? 
      (businessPlan.content as any)[sectionId] : 
      {});
    
    // Generate AI response using OpenAI
    const aiResponse = await generateAIResponse(
      sectionId, 
      message, 
      conversationHistory || [],
      currentContent
    );
    
    // Log if there are any suggestions (content in backticks)
    const backtickPattern = /`([^`]+)`/g;
    const suggestions = [];
    let match;
    while ((match = backtickPattern.exec(aiResponse)) !== null) {
      suggestions.push(match[1].trim());
    }
    
    console.log(`[AI Assist API] Response generated. Length: ${aiResponse.length}`);
    console.log(`[AI Assist API] Found ${suggestions.length} backtick-enclosed suggestions`);
    if (suggestions.length > 0) {
      console.log(`[AI Assist API] First suggestion: "${suggestions[0].substring(0, 30)}..."`);
    }
    
    return NextResponse.json({ message: aiResponse });
  } catch (error) {
    console.error('[AI Assist API] Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' }, 
      { status: 500 }
    );
  }
} 