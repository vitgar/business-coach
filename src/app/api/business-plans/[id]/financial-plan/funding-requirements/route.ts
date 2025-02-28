import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractStartupCostData, cleanResponse } from '@/lib/utils';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Message interface for chat messages
 */
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * GET handler for fetching funding requirements data
 * 
 * @param req - Next.js request object
 * @param params - Route parameters containing business plan ID
 * @returns Funding requirements data or error response
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlanId = params.id;
    
    // Fetch the business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: {
        id: businessPlanId,
      },
      select: {
        id: true,
        content: true,
      },
    });
    
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      );
    }
    
    // Extract financial plan data from content
    const content = businessPlan.content as any || {};
    const financialPlan = content.financialPlan || {};
    
    // Return the funding requirements data
    return NextResponse.json({
      fundingRequirementsText: financialPlan.fundingRequirements || '',
      fundingData: financialPlan.fundingData || {},
    });
  } catch (error) {
    console.error('Error fetching funding requirements data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST handler for processing funding requirements messages and updating data
 * 
 * @param req - Next.js request object
 * @param params - Route parameters containing business plan ID
 * @returns Updated funding requirements data or error response
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get business plan ID from params
    const businessPlanId = params.id;

    // Parse request body
    const body = await request.json();
    let messageContent = '';
    let isHelpRequest = false;
    
    // Handle different request formats
    if (body.message) {
      // Original format with single message
      messageContent = body.message;
    } else if (body.messages && Array.isArray(body.messages)) {
      // New format from GenericQuestionnaire with messages array
      // Extract the most recent user message
      const userMessages = body.messages.filter((m: { role: string; content: string }) => m.role === 'user');
      if (userMessages.length > 0) {
        messageContent = userMessages[userMessages.length - 1].content;
      }
      
      // Check if this is a help request
      isHelpRequest = body.messages.some((m: { role: string; content: string }) => 
        m.role === 'system' && m.content && m.content.includes('needs help')
      ) || body.isHelpRequest === true;
    }
    
    if (!messageContent) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Fetch the business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: {
        id: businessPlanId,
      },
      select: {
        id: true,
        content: true,
      },
    });
    
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      );
    }
    
    // Extract existing financial plan data
    const content = businessPlan.content as any || {};
    const financialPlan = content.financialPlan || {};
    const existingFundingData = financialPlan.fundingData || {};
    
    // Extract other relevant financial data for context
    const startupCost = financialPlan.startupCost || '';
    const revenueProjections = financialPlan.revenueProjections || '';
    const expenseProjections = financialPlan.expenseProjections || '';
    const breakEvenAnalysis = financialPlan.breakEvenAnalysis || '';
    
    // Construct the system message with context
    let systemMessage = `You are an AI assistant helping a business owner outline funding requirements for their business plan. 
    Your goal is to extract structured information about their funding needs and present it clearly.
    
    If the user asks for help or seems unsure, guide them through the process with simple examples and explanations.
    Focus on extracting or helping the user determine:
    1. Total funding amount needed
    2. Breakdown of how funds will be used
    3. Potential funding sources and their contributions
    4. Funding timeline and milestones
    5. Expected return on investment
    6. Exit strategy for investors
    7. Risks associated with the investment
    8. Contingency plans if full funding is not secured
    
    Relevant financial data from other sections:
    ${startupCost ? '- Startup Costs: ' + startupCost.substring(0, 200) + '...' : ''}
    ${revenueProjections ? '- Revenue Projections: ' + revenueProjections.substring(0, 200) + '...' : ''}
    ${expenseProjections ? '- Expense Projections: ' + expenseProjections.substring(0, 200) + '...' : ''}
    ${breakEvenAnalysis ? '- Break-Even Analysis: ' + breakEvenAnalysis.substring(0, 200) + '...' : ''}
    
    If the user provides enough information, create a JSON structure like this:
    \`\`\`json
    {
      "totalFundingNeeded": 500000,
      "fundingUseBreakdown": [
        {
          "category": "Equipment",
          "amount": 150000,
          "description": "Purchase of manufacturing equipment"
        },
        {
          "category": "Working Capital",
          "amount": 200000,
          "description": "Operating expenses for first 6 months"
        },
        {
          "category": "Marketing",
          "amount": 100000,
          "description": "Initial marketing campaign and brand development"
        },
        {
          "category": "Miscellaneous",
          "amount": 50000,
          "description": "Unexpected expenses and contingency"
        }
      ],
      "fundingSources": [
        {
          "source": "Personal Investment",
          "amount": 100000,
          "terms": "Founder's equity contribution"
        },
        {
          "source": "Angel Investors",
          "amount": 250000,
          "terms": "20% equity stake with 5-year exit plan"
        },
        {
          "source": "Bank Loan",
          "amount": 150000,
          "terms": "5-year term at 7% interest rate"
        }
      ],
      "fundingTimeline": "First round of $250,000 needed by Q1 2024, second round of $250,000 by Q3 2024",
      "expectedROI": "Projected 22% annual return on investment after year 3",
      "exitStrategy": "Acquisition by larger competitor or industry player within 5-7 years",
      "risks": [
        "Market adoption may be slower than anticipated",
        "Regulatory changes could impact business model",
        "Competition may enter market with lower price points"
      ],
      "contingencyPlans": "If we secure only 70% of funding, we will postpone office expansion and reduce marketing budget by 40%"
    }
    \`\`\`
    
    Important: Include JSON only when you have sufficient information to do so. Return this JSON structure embedded in your message, and also include a friendly, conversational response.
    
    Existing funding requirements data (if any):
    ${JSON.stringify(existingFundingData, null, 2)}
    `;
    
    // If this is a help request, provide more structured guidance
    if (isHelpRequest) {
      systemMessage += `
      Since the user is asking for help, provide a clear, step-by-step explanation of funding requirements:
      1. Explain what funding requirements are in simple terms
      2. Guide them through calculating how much total funding they need
      3. Help them break down funding usage by category
      4. Discuss different funding sources and their implications
      5. Explain the importance of a funding timeline
      6. Give practical examples they can relate to
      
      Make your response encouraging and emphasize that this doesn't need to be complex.
      `;
    }
    
    // Build the message array
    const messages: Message[] = [
      { role: 'system', content: systemMessage },
    ];
    
    // Create user message with the user's input
    messages.push({
      role: 'user',
      content: messageContent
    });
    
    // Get response from OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    // Extract the assistant's message
    const assistantMessage = response.choices[0].message.content || '';
    
    // Extract structured data from the response
    const updatedFundingData = extractStartupCostData(assistantMessage, existingFundingData);
    
    // Clean the response to remove JSON and formatting instructions
    const cleanedMessage = cleanResponse(assistantMessage);
    
    // Format the funding requirements text
    const formattedText = formatFundingRequirementsText(updatedFundingData);
    
    // Update the business plan with the new data
    await prisma.businessPlan.update({
      where: {
        id: businessPlanId,
      },
      data: {
        content: {
          ...content,
          financialPlan: {
            ...financialPlan,
            fundingData: updatedFundingData,
            fundingRequirements: formattedText,
          },
        },
      },
    });
    
    // Return the updated data
    return NextResponse.json({
      message: cleanedMessage,
      fundingData: updatedFundingData,
      fundingRequirementsText: formattedText,
    });
  } catch (error) {
    console.error('Error processing funding requirements message:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Format funding requirements data into readable text
 * 
 * @param data - Funding requirements data
 * @returns Formatted text representation
 */
function formatFundingRequirementsText(data: any): string {
  if (!data || Object.keys(data).length === 0) {
    return '';
  }
  
  let text = '## Funding Requirements\n\n';
  
  // Add total funding needed
  if (data.totalFundingNeeded) {
    text += `### Total Funding Needed\n$${data.totalFundingNeeded.toLocaleString()}\n\n`;
  }
  
  // Add funding use breakdown
  if (data.fundingUseBreakdown && data.fundingUseBreakdown.length > 0) {
    text += '### Use of Funds\n';
    text += '| Category | Amount | Description |\n';
    text += '|----------|--------|-------------|\n';
    
    data.fundingUseBreakdown.forEach((item: any) => {
      text += `| ${item.category} | $${item.amount.toLocaleString()} | ${item.description} |\n`;
    });
    
    text += '\n';
  }
  
  // Add funding sources
  if (data.fundingSources && data.fundingSources.length > 0) {
    text += '### Funding Sources\n';
    text += '| Source | Amount | Terms |\n';
    text += '|--------|--------|-------|\n';
    
    data.fundingSources.forEach((source: any) => {
      text += `| ${source.source} | $${source.amount.toLocaleString()} | ${source.terms || 'N/A'} |\n`;
    });
    
    text += '\n';
  }
  
  // Add funding timeline
  if (data.fundingTimeline) {
    text += `### Funding Timeline\n${data.fundingTimeline}\n\n`;
  }
  
  // Add expected ROI
  if (data.expectedROI) {
    text += `### Expected Return on Investment\n${data.expectedROI}\n\n`;
  }
  
  // Add exit strategy
  if (data.exitStrategy) {
    text += `### Exit Strategy\n${data.exitStrategy}\n\n`;
  }
  
  // Add risks
  if (data.risks && data.risks.length > 0) {
    text += '### Investment Risks\n';
    data.risks.forEach((risk: string, index: number) => {
      text += `${index + 1}. ${risk}\n`;
    });
    text += '\n';
  }
  
  // Add contingency plans
  if (data.contingencyPlans) {
    text += `### Contingency Plans\n${data.contingencyPlans}\n\n`;
  }
  
  return text;
} 