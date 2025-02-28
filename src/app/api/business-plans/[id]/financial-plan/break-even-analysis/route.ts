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
 * GET handler for fetching break-even analysis data
 * 
 * @param req - Next.js request object
 * @param params - Route parameters containing business plan ID
 * @returns Break-even analysis data or error response
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
    
    // Return the break-even analysis data
    return NextResponse.json({
      breakEvenAnalysis: financialPlan.breakEvenAnalysis || '',
      breakEvenData: financialPlan.breakEvenData || {},
    });
  } catch (error) {
    console.error('Error fetching break-even analysis data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST handler for processing break-even analysis messages and updating data
 * 
 * @param req - Next.js request object
 * @param params - Route parameters containing business plan ID
 * @returns Updated break-even analysis data or error response
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
    const existingBreakEvenData = financialPlan.breakEvenData || {};
    
    // Extract other relevant financial data for context
    const revenueProjections = financialPlan.revenueProjections || '';
    const expenseProjections = financialPlan.expenseProjections || '';
    const startupCost = financialPlan.startupCost || '';
    
    // Construct the system message with context
    let systemMessage = `You are an AI assistant helping a business owner create a break-even analysis for their business plan. 
    Your goal is to extract structured information about their break-even analysis and present it clearly.
    
    If the user asks for help or seems unsure, guide them through the process with simple examples and explanations.
    Focus on extracting or helping the user determine:
    1. Fixed costs per period (monthly, quarterly, etc.)
    2. Variable costs per unit
    3. Price per unit
    4. Contribution margin per unit (price minus variable cost)
    5. Break-even point in units and revenue
    6. Projected time to break even
    7. Key assumptions made in the analysis
    
    Relevant financial data from other sections:
    ${startupCost ? '- Startup Costs: ' + startupCost.substring(0, 200) + '...' : ''}
    ${revenueProjections ? '- Revenue Projections: ' + revenueProjections.substring(0, 200) + '...' : ''}
    ${expenseProjections ? '- Expense Projections: ' + expenseProjections.substring(0, 200) + '...' : ''}
    
    If the user provides enough information, create a JSON structure like this:
    \`\`\`json
    {
      "fixedCosts": {
        "amount": 5000,
        "description": "Monthly fixed costs including rent, salaries, utilities"
      },
      "variableCosts": {
        "amount": 10,
        "description": "Variable cost per unit"
      },
      "unitPrice": 25,
      "contributionMargin": 15,
      "breakEvenPoint": {
        "units": 334,
        "revenue": 8350
      },
      "timeToBreakEven": "3 months based on projected sales of 150 units per month",
      "assumptions": [
        "Sales volume increases by 10% month-over-month",
        "Fixed costs remain constant",
        "No seasonal fluctuations in demand"
      ],
      "sensitivityAnalysis": "If price decreases by 10%, break-even point increases to 445 units."
    }
    \`\`\`
    
    Important: Include JSON only when you have sufficient information to do so. Return this JSON structure embedded in your message, and also include a friendly, conversational response.
    
    Existing break-even data (if any):
    ${JSON.stringify(existingBreakEvenData, null, 2)}
    `;
    
    // If this is a help request, provide more structured guidance
    if (isHelpRequest) {
      systemMessage += `
      Since the user is asking for help, provide a clear, step-by-step explanation of break-even analysis:
      1. Explain what break-even analysis is in simple terms
      2. Guide them through identifying their fixed costs
      3. Help them calculate variable costs per unit
      4. Show how to determine contribution margin
      5. Explain the formula for break-even point (Fixed costs ÷ Contribution margin)
      6. Give a simple example they can relate to
      
      Make your response encouraging and emphasize that this doesn't need to be complex.
      `;
    }
    
    // Build the message array
    const messages: Message[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: messageContent }
    ];
    
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
    const updatedBreakEvenData = extractStartupCostData(assistantMessage, existingBreakEvenData);
    
    // Clean the response to remove JSON and formatting instructions
    const cleanedMessage = cleanResponse(assistantMessage);
    
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
            breakEvenData: updatedBreakEvenData,
            breakEvenAnalysis: formatBreakEvenText(updatedBreakEvenData),
          },
        },
      },
    });
    
    // Return the updated data
    return NextResponse.json({
      message: cleanedMessage,
      breakEvenData: updatedBreakEvenData,
    });
  } catch (error) {
    console.error('Error processing break-even analysis message:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Format break-even analysis data into readable text
 * 
 * @param data - Break-even analysis data
 * @returns Formatted text representation
 */
function formatBreakEvenText(data: any): string {
  if (!data || Object.keys(data).length === 0) {
    return '';
  }
  
  let text = '## Break-Even Analysis\n\n';
  
  // Add fixed costs
  if (data.fixedCosts) {
    text += `### Fixed Costs\n`;
    text += `$${data.fixedCosts.amount.toLocaleString()} (${data.fixedCosts.description})\n\n`;
  }
  
  // Add variable costs
  if (data.variableCosts) {
    text += `### Variable Costs Per Unit\n`;
    text += `$${data.variableCosts.amount.toLocaleString()} (${data.variableCosts.description})\n\n`;
  }
  
  // Add unit price
  if (data.unitPrice) {
    text += `### Price Per Unit\n`;
    text += `$${data.unitPrice.toLocaleString()}\n\n`;
  }
  
  // Add contribution margin
  if (data.contributionMargin) {
    text += `### Contribution Margin Per Unit\n`;
    text += `$${data.contributionMargin.toLocaleString()}\n\n`;
  }
  
  // Add break-even point
  if (data.breakEvenPoint) {
    text += `### Break-Even Point\n`;
    text += `- Units: ${data.breakEvenPoint.units.toLocaleString()}\n`;
    text += `- Revenue: $${data.breakEvenPoint.revenue.toLocaleString()}\n\n`;
  }
  
  // Add time to break even
  if (data.timeToBreakEven) {
    text += `### Projected Time to Break Even\n`;
    text += `${data.timeToBreakEven}\n\n`;
  }
  
  // Add assumptions
  if (data.assumptions && data.assumptions.length > 0) {
    text += `### Key Assumptions\n`;
    data.assumptions.forEach((assumption: string, index: number) => {
      text += `${index + 1}. ${assumption}\n`;
    });
    text += '\n';
  }
  
  // Add sensitivity analysis
  if (data.sensitivityAnalysis) {
    text += `### Sensitivity Analysis\n`;
    text += `${data.sensitivityAnalysis}\n\n`;
  }
  
  return text;
} 