import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OpenAI } from 'openai';

/**
 * OpenAI client instance
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Message interface for chat
 */
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * GET handler for retrieving revenue projections data
 * 
 * @param req - The request object
 * @param params - The route parameters, including the business plan ID
 * @returns Response with revenue projections data
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
        content: true,
        userId: true,
      },
    });
    
    if (!businessPlan) {
      return NextResponse.json({ error: 'Business plan not found' }, { status: 404 });
    }
    
    // Extract financial plan data from the content
    const content = businessPlan.content as any || {};
    const financialPlan = content.financialPlan || {};
    
    // Return the revenue projections data
    return NextResponse.json({
      revenueProjectionsData: financialPlan.revenueProjectionsData || {},
      revenueProjections: financialPlan.revenueProjections || '',
    });
  } catch (error) {
    console.error('Error fetching revenue projections data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST handler for processing revenue projections messages and saving data
 * 
 * @param req - The request object
 * @param params - The route parameters, including the business plan ID
 * @returns Response with assistant message and updated revenue projections data
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
        userId: true,
      },
    });
    
    if (!businessPlan) {
      return NextResponse.json({ error: 'Business plan not found' }, { status: 404 });
    }
    
    // Extract financial plan data from the content
    const content = businessPlan.content as any || {};
    const financialPlan = content.financialPlan || {};
    
    // Get existing revenue projections data
    const existingRevenueProjectionsData = financialPlan.revenueProjectionsData || {};
    
    // Construct the system message
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful business planning assistant focused on helping the user define their revenue projections.
      
Your task is to help the user develop comprehensive revenue projections for their business plan.

Extract the following information from the conversation:
1. Revenue streams - What are the main ways the business will generate revenue?
2. Pricing strategy - How will products/services be priced?
3. Sales forecast - Projected sales for different periods (monthly, quarterly, yearly)
4. Growth assumptions - What growth rate is expected and why?
5. Market size estimates - How big is the total addressable market?
6. Seasonality factors - How will seasonal changes affect revenue?
7. Best and worst case scenarios - What are the optimistic and pessimistic projections?

Current revenue projections data: ${JSON.stringify(existingRevenueProjectionsData)}

For each response:
1. Provide helpful guidance on revenue projections
2. Ask follow-up questions to gather missing information
3. Suggest realistic projections based on the business type and market
4. Update the revenue projections data structure with new information

Return your response as a normal message. Also return an updated JSON object with the revenue projections data structure.`,
    };
    
    // Construct the messages array
    const messages: Message[] = [
      systemMessage,
      { role: 'user', content: messageContent },
    ];
    
    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1500,
      tools: [
        {
          type: 'function',
          function: {
            name: 'updateRevenueProjectionsData',
            description: 'Update the revenue projections data with new information from the conversation',
            parameters: {
              type: 'object',
              properties: {
                revenueStreams: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      projectedAmount: { type: 'number' },
                      timeframe: { type: 'string' },
                    },
                  },
                },
                growthAssumptions: { type: 'string' },
                marketSizeEstimates: { type: 'string' },
                pricingStrategy: { type: 'string' },
                salesForecast: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      period: { type: 'string' },
                      amount: { type: 'number' },
                      growthRate: { type: 'number' },
                    },
                  },
                },
                seasonalityFactors: { type: 'string' },
                bestCaseScenario: { type: 'string' },
                worstCaseScenario: { type: 'string' },
              },
              required: [],
            },
          },
        },
      ],
    });
    
    // Extract the assistant's message
    const assistantMessage = response.choices[0].message.content || '';
    
    // Extract the function call if available
    let updatedRevenueProjectionsData = { ...existingRevenueProjectionsData };
    
    if (response.choices[0].message.tool_calls) {
      const functionCall = response.choices[0].message.tool_calls.find(
        (toolCall) => toolCall.function.name === 'updateRevenueProjectionsData'
      );
      
      if (functionCall) {
        try {
          const functionArgs = JSON.parse(functionCall.function.arguments);
          
          // Merge the existing data with the new data
          updatedRevenueProjectionsData = {
            ...existingRevenueProjectionsData,
            ...functionArgs,
          };
        } catch (error) {
          console.error('Error parsing function arguments:', error);
        }
      }
    }
    
    // Format the revenue projections data into text
    const formattedRevenueProjections = formatRevenueProjectionsText(updatedRevenueProjectionsData);
    
    // Update the business plan with the new financial plan data
    await prisma.businessPlan.update({
      where: {
        id: businessPlanId,
      },
      data: {
        content: {
          ...(content as any),
          financialPlan: {
            ...financialPlan,
            revenueProjectionsData: updatedRevenueProjectionsData,
            revenueProjections: formattedRevenueProjections,
          },
        },
      },
    });
    
    // Return the assistant's message and updated revenue projections data
    return NextResponse.json({
      message: assistantMessage,
      revenueProjectionsData: updatedRevenueProjectionsData,
      revenueProjections: formattedRevenueProjections,
    });
  } catch (error) {
    console.error('Error processing revenue projections message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Format revenue projections data into readable text
 * 
 * @param data - The revenue projections data to format
 * @returns Formatted markdown text
 */
function formatRevenueProjectionsText(data: any): string {
  let text = '## Revenue Projections\n\n';
  
  if (data.revenueStreams && data.revenueStreams.length > 0) {
    text += '### Revenue Streams\n';
    text += '| Revenue Stream | Description | Projected Amount | Timeframe |\n';
    text += '| -------------- | ----------- | ---------------- | --------- |\n';
    data.revenueStreams.forEach((stream: any) => {
      text += `| ${stream.name} | ${stream.description} | $${stream.projectedAmount.toLocaleString()} | ${stream.timeframe} |\n`;
    });
    text += '\n';
    
    // Calculate total projected revenue
    const totalRevenue = data.revenueStreams.reduce((sum: number, stream: any) => sum + stream.projectedAmount, 0);
    text += `**Total Projected Revenue:** $${totalRevenue.toLocaleString()}\n\n`;
  }
  
  if (data.pricingStrategy) {
    text += `### Pricing Strategy\n${data.pricingStrategy}\n\n`;
  }
  
  if (data.salesForecast && data.salesForecast.length > 0) {
    text += '### Sales Forecast\n';
    text += '| Period | Amount | Growth Rate |\n';
    text += '| ------ | ------ | ----------- |\n';
    data.salesForecast.forEach((forecast: any) => {
      text += `| ${forecast.period} | $${forecast.amount.toLocaleString()} | ${forecast.growthRate ? `${forecast.growthRate}%` : 'N/A'} |\n`;
    });
    text += '\n';
  }
  
  if (data.growthAssumptions) {
    text += `### Growth Assumptions\n${data.growthAssumptions}\n\n`;
  }
  
  if (data.marketSizeEstimates) {
    text += `### Market Size Estimates\n${data.marketSizeEstimates}\n\n`;
  }
  
  if (data.seasonalityFactors) {
    text += `### Seasonality Factors\n${data.seasonalityFactors}\n\n`;
  }
  
  if (data.bestCaseScenario) {
    text += `### Best Case Scenario\n${data.bestCaseScenario}\n\n`;
  }
  
  if (data.worstCaseScenario) {
    text += `### Worst Case Scenario\n${data.worstCaseScenario}\n\n`;
  }
  
  return text;
} 