import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { extractStartupCostData, cleanResponse } from '@/lib/utils';

/**
 * OpenAI client instance
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GET handler for retrieving startup cost data
 * 
 * @param request - The incoming request
 * @param params - Route parameters including business plan ID
 * @returns Response with startup cost data
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get business plan ID from params
    const businessPlanId = params.id;

    // Fetch the business plan from the database
    const businessPlan = await prisma.businessPlan.findUnique({
      where: {
        id: businessPlanId,
      },
      select: {
        content: true,
      },
    });

    // If no business plan is found, return 404
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      );
    }

    // Extract startup cost data from the content
    const content = businessPlan.content as any || {};
    const financialPlan = content.financialPlan || {};
    const startupCostData = financialPlan.startupCostData || {};
    const startupCost = financialPlan.startupCost || '';

    // Return the startup cost data
    return NextResponse.json({
      startupCostData,
      startupCost,
    });
  } catch (error) {
    console.error('Error fetching startup cost data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch startup cost data' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for processing startup cost messages and updating data
 * 
 * @param request - The incoming request
 * @param params - Route parameters including business plan ID
 * @returns Response with processed message and updated startup cost data
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

    // Fetch the business plan from the database
    const businessPlan = await prisma.businessPlan.findUnique({
      where: {
        id: businessPlanId,
      },
      select: {
        content: true,
      },
    });

    // If no business plan is found, return 404
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      );
    }

    // Extract existing startup cost data
    const content = businessPlan.content as any || {};
    const financialPlan = content.financialPlan || {};
    const existingStartupCostData = financialPlan.startupCostData || {};

    // Create system message for the OpenAI chat
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful business planning assistant focused on helping the user define their startup costs. 
      
Your goal is to help the user identify and quantify all the costs associated with starting their business, including:
- One-time costs (equipment, legal fees, permits, initial inventory, etc.)
- Ongoing monthly expenses (rent, utilities, salaries, etc.)
- Sources of initial funding (personal savings, loans, investors)
- Break-even timeframe
- Any additional financial considerations

Ask clarifying questions to help the user think through all potential costs. Be specific and detailed.

After each user message, you should:
1. Respond helpfully to their question or input
2. Extract any specific startup cost information they've provided
3. Format this information into a structured JSON object

Current startup cost data: ${JSON.stringify(existingStartupCostData)}`,
    };

    // Create user message
    const userMessage = {
      role: 'user' as const,
      content: messageContent,
    };

    // Send messages to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [systemMessage, userMessage],
      temperature: 0.7,
      max_tokens: 1500,
    });

    // Get the assistant's response
    const assistantMessage = response.choices[0].message.content || '';

    // Extract startup cost data from the assistant's response
    const startupCostData = extractStartupCostData(
      assistantMessage,
      existingStartupCostData
    );

    // Clean the response to remove any JSON or formatting instructions
    const cleanedResponse = cleanResponse(assistantMessage);

    // Format the startup cost data into text
    const formattedStartupCostText = formatStartupCostText(startupCostData);

    // Update the business plan with the new startup cost data
    await prisma.businessPlan.update({
      where: {
        id: businessPlanId,
      },
      data: {
        content: {
          ...content,
          financialPlan: {
            ...financialPlan,
            startupCostData,
            startupCost: formattedStartupCostText,
          },
        },
      },
    });

    // Return the assistant's response and the updated startup cost data
    return NextResponse.json({
      message: cleanedResponse,
      startupCostData,
    });
  } catch (error) {
    console.error('Error processing startup cost message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

/**
 * Format startup cost data into readable text
 * 
 * @param data - The startup cost data to format
 * @returns Formatted markdown text
 */
function formatStartupCostText(data: any): string {
  let text = '## Startup Costs\n\n';
  
  if (data.oneTimeCosts && data.oneTimeCosts.length > 0) {
    text += '### One-Time Costs\n';
    text += '| Item | Amount | Description |\n';
    text += '| ---- | ------ | ----------- |\n';
    data.oneTimeCosts.forEach((cost: any) => {
      text += `| ${cost.name} | $${cost.amount.toLocaleString()} | ${cost.description || ''} |\n`;
    });
    text += '\n';
    
    // Calculate total one-time costs
    const totalOneTime = data.oneTimeCosts.reduce((sum: number, cost: any) => sum + cost.amount, 0);
    text += `**Total One-Time Costs:** $${totalOneTime.toLocaleString()}\n\n`;
  }
  
  if (data.monthlyExpenses && data.monthlyExpenses.length > 0) {
    text += '### Monthly Expenses\n';
    text += '| Item | Amount | Description |\n';
    text += '| ---- | ------ | ----------- |\n';
    data.monthlyExpenses.forEach((expense: any) => {
      text += `| ${expense.name} | $${expense.amount.toLocaleString()} | ${expense.description || ''} |\n`;
    });
    text += '\n';
    
    // Calculate total monthly expenses
    const totalMonthly = data.monthlyExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
    text += `**Total Monthly Expenses:** $${totalMonthly.toLocaleString()}\n\n`;
  }
  
  if (data.fundingSources && data.fundingSources.length > 0) {
    text += '### Funding Sources\n';
    text += '| Source | Amount | Description |\n';
    text += '| ------ | ------ | ----------- |\n';
    data.fundingSources.forEach((source: any) => {
      text += `| ${source.name} | $${source.amount.toLocaleString()} | ${source.description || ''} |\n`;
    });
    text += '\n';
    
    // Calculate total funding
    const totalFunding = data.fundingSources.reduce((sum: number, source: any) => sum + source.amount, 0);
    text += `**Total Funding:** $${totalFunding.toLocaleString()}\n\n`;
  }
  
  if (data.totalStartupCost) {
    text += `### Total Startup Cost\n$${data.totalStartupCost.toLocaleString()}\n\n`;
  }
  
  if (data.breakEvenTimeframe) {
    text += `### Break-Even Timeframe\n${data.breakEvenTimeframe}\n\n`;
  }
  
  if (data.additionalNotes) {
    text += `### Additional Notes\n${data.additionalNotes}\n\n`;
  }
  
  return text;
} 