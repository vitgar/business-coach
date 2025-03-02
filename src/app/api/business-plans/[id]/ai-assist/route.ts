import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Section-specific instructions for the AI assistant
 */
const SECTION_INSTRUCTIONS: Record<string, string> = {
  executiveSummary: `You are an expert business plan consultant helping with an Executive Summary. 
  Focus on concise overview of business concept, mission, value proposition, and key financial highlights.
  Keep suggestions practical and action-oriented.`,
  
  companyDescription: `You are a business identity specialist helping with a Company Description.
  Guide the user to articulate their business structure, history, mission, and vision.
  Emphasize uniqueness and competitive advantages.`,
  
  productsAndServices: `You are a product development expert helping with Products & Services.
  Focus on clear descriptions, features, benefits, pricing, intellectual property, and product lifecycle.
  Help the user articulate their value proposition.`,
  
  marketAnalysis: `You are a market research specialist helping with Market Analysis.
  Provide guidance on identifying target markets, analyzing competition, and understanding market trends.
  Use specific examples and data-driven approaches.`,
  
  marketingStrategy: `You are a marketing strategist helping with Marketing Strategy.
  Guide on branding, pricing, promotion, sales channels, and customer acquisition & retention.
  Focus on actionable marketing tactics for the business's specific market.`,
  
  operationsPlan: `You are an operations consultant helping with Operations Plan.
  Cover production process, facilities, technology, supply chain, and inventory management.
  Focus on efficiency, quality control, and scalability.`,
  
  organizationAndManagement: `You are an organizational design expert helping with Organization & Management.
  Guide on organizational structure, team roles, advisors, and governance.
  Focus on creating a strong foundation for growth.`,
  
  financialPlan: `You are a financial planner helping with Financial Plan.
  Guide on creating projections, funding needs, use of funds, and break-even analysis.
  Focus on realistic forecasts and sustainability.`
}

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
  
  // Create the messages array for OpenAI
  const messages = [
    { 
      role: "system", 
      content: `${instructions}\n\nIf the user has shared business plan content, use it for context: ${JSON.stringify(businessPlanData || {})}`
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
    const { sectionId, message, conversationHistory } = await request.json()
    
    // Validate inputs
    if (!sectionId || !message) {
      return NextResponse.json(
        { error: 'Section ID and message are required' },
        { status: 400 }
      )
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
    const currentContent = businessPlan.content && 
      (businessPlan.content as any)[sectionId] ? 
      (businessPlan.content as any)[sectionId] : 
      {};
    
    // Generate AI response using OpenAI
    const aiResponse = await generateAIResponse(
      sectionId, 
      message, 
      conversationHistory,
      currentContent
    );
    
    return NextResponse.json({ message: aiResponse })
  } catch (error) {
    console.error('Error in AI assist API:', error)
    return NextResponse.json(
      { error: 'Failed to process AI assistance request' },
      { status: 500 }
    )
  }
} 