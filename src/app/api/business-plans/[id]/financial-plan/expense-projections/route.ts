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
 * GET handler for retrieving expense projections data
 * 
 * @param req - The request object
 * @param params - The route parameters, including the business plan ID
 * @returns Response with expense projections data
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
    
    // Return the expense projections data
    return NextResponse.json({
      expenseProjectionsData: financialPlan.expenseProjectionsData || {},
      expenseProjections: financialPlan.expenseProjections || '',
    });
  } catch (error) {
    console.error('Error fetching expense projections data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST handler for processing expense projections messages and saving data
 * 
 * @param req - The request object
 * @param params - The route parameters, including the business plan ID
 * @returns Response with assistant message and updated expense projections data
 */
export async function POST(
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
    
    // Parse request body
    const body = await req.json();
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
    
    // Extract financial plan data from the content
    const content = businessPlan.content as any || {};
    const financialPlan = content.financialPlan || {};
    
    // Get existing expense projections data
    const existingExpenseProjectionsData = financialPlan.expenseProjectionsData || {};
    
    // Construct the system message
    const systemMessage: Message = {
      role: 'system',
      content: `You are a business planning assistant helping with expense projections. 
      
Your task is to help the user develop comprehensive expense projections for their business plan.

Extract the following information from the conversation:
1. Fixed expenses - What are the recurring fixed costs (rent, salaries, insurance, etc.)?
2. Variable expenses - What costs vary with production/sales volume?
3. One-time expenses - What non-recurring expenses are anticipated?
4. Growth assumptions - How will expenses change over time?
5. Cost-saving strategies - How will the business control costs?
6. Expense forecast - Projected expenses for different periods
7. Largest expense categories - What are the most significant costs?
8. Expense management approach - How will expenses be tracked and managed?

Current expense projections data: ${JSON.stringify(existingExpenseProjectionsData)}

For each response:
1. Provide helpful guidance on expense projections
2. Ask follow-up questions to gather missing information
3. Suggest realistic projections based on the business type and industry
4. Update the expense projections data structure with new information

Return your response as a normal message. Also return an updated JSON object with the expense projections data structure.`,
    };
    
    // Construct the messages array
    const messages: Message[] = [
      systemMessage,
    ];
    
    // Add user message to messages array
    messages.push({
      role: 'user',
      content: messageContent
    });
    
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
            name: 'updateExpenseProjectionsData',
            description: 'Update the expense projections data with new information from the conversation',
            parameters: {
              type: 'object',
              properties: {
                fixedExpenses: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string' },
                      description: { type: 'string' },
                      monthlyAmount: { type: 'number' },
                      annualAmount: { type: 'number' },
                    },
                  },
                },
                variableExpenses: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string' },
                      description: { type: 'string' },
                      percentOfRevenue: { type: 'number' },
                      estimatedAmount: { type: 'number' },
                      timeframe: { type: 'string' },
                    },
                  },
                },
                oneTimeExpenses: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string' },
                      description: { type: 'string' },
                      amount: { type: 'number' },
                      expectedDate: { type: 'string' },
                    },
                  },
                },
                growthAssumptions: { type: 'string' },
                costSavingStrategies: { type: 'string' },
                expenseForecast: {
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
                largestExpenseCategories: { type: 'string' },
                expenseManagementApproach: { type: 'string' },
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
    let updatedExpenseProjectionsData = { ...existingExpenseProjectionsData };
    
    if (response.choices[0].message.tool_calls) {
      const functionCall = response.choices[0].message.tool_calls.find(
        (toolCall) => toolCall.function.name === 'updateExpenseProjectionsData'
      );
      
      if (functionCall) {
        try {
          const functionArgs = JSON.parse(functionCall.function.arguments);
          
          // Merge the existing data with the new data
          updatedExpenseProjectionsData = {
            ...existingExpenseProjectionsData,
            ...functionArgs,
          };
        } catch (error) {
          console.error('Error parsing function arguments:', error);
        }
      }
    }
    
    // Format the expense projections data into text
    const formattedExpenseProjections = formatExpenseProjectionsText(updatedExpenseProjectionsData);
    
    // Update the business plan with the finalized data
    await prisma.businessPlan.update({
      where: {
        id: businessPlanId,
      },
      data: {
        content: {
          ...(content as any),
          financialPlan: {
            ...financialPlan,
            expenseProjectionsData: updatedExpenseProjectionsData,
            expenseProjections: formattedExpenseProjections,
          },
        },
      },
    });
    
    // Return the assistant's message and updated expense projections data
    return NextResponse.json({
      message: assistantMessage,
      expenseProjectionsData: updatedExpenseProjectionsData,
      expenseProjections: formattedExpenseProjections,
    });
  } catch (error) {
    console.error('Error processing expense projections message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Format expense projections data into readable text
 * 
 * @param data - The expense projections data to format
 * @returns Formatted markdown text
 */
function formatExpenseProjectionsText(data: any): string {
  let text = '## Expense Projections\n\n';
  
  if (data.fixedExpenses && data.fixedExpenses.length > 0) {
    text += '### Fixed Expenses\n';
    text += '| Category | Description | Monthly Amount | Annual Amount |\n';
    text += '| -------- | ----------- | -------------- | ------------- |\n';
    data.fixedExpenses.forEach((expense: any) => {
      text += `| ${expense.category} | ${expense.description} | $${expense.monthlyAmount.toLocaleString()} | $${expense.annualAmount.toLocaleString()} |\n`;
    });
    text += '\n';
    
    // Calculate total fixed expenses
    const totalMonthly = data.fixedExpenses.reduce((sum: number, expense: any) => sum + expense.monthlyAmount, 0);
    const totalAnnual = data.fixedExpenses.reduce((sum: number, expense: any) => sum + expense.annualAmount, 0);
    text += `**Total Fixed Expenses:** $${totalMonthly.toLocaleString()} monthly / $${totalAnnual.toLocaleString()} annually\n\n`;
  }
  
  if (data.variableExpenses && data.variableExpenses.length > 0) {
    text += '### Variable Expenses\n';
    text += '| Category | Description | % of Revenue | Estimated Amount | Timeframe |\n';
    text += '| -------- | ----------- | ------------ | ---------------- | --------- |\n';
    data.variableExpenses.forEach((expense: any) => {
      text += `| ${expense.category} | ${expense.description} | ${expense.percentOfRevenue ? `${expense.percentOfRevenue}%` : 'N/A'} | $${expense.estimatedAmount.toLocaleString()} | ${expense.timeframe} |\n`;
    });
    text += '\n';
    
    // Calculate total variable expenses
    const totalVariable = data.variableExpenses.reduce((sum: number, expense: any) => sum + expense.estimatedAmount, 0);
    text += `**Total Estimated Variable Expenses:** $${totalVariable.toLocaleString()}\n\n`;
  }
  
  if (data.oneTimeExpenses && data.oneTimeExpenses.length > 0) {
    text += '### One-Time Expenses\n';
    text += '| Category | Description | Amount | Expected Date |\n';
    text += '| -------- | ----------- | ------ | ------------- |\n';
    data.oneTimeExpenses.forEach((expense: any) => {
      text += `| ${expense.category} | ${expense.description} | $${expense.amount.toLocaleString()} | ${expense.expectedDate} |\n`;
    });
    text += '\n';
    
    // Calculate total one-time expenses
    const totalOneTime = data.oneTimeExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
    text += `**Total One-Time Expenses:** $${totalOneTime.toLocaleString()}\n\n`;
  }
  
  if (data.expenseForecast && data.expenseForecast.length > 0) {
    text += '### Expense Forecast\n';
    text += '| Period | Amount | Growth Rate |\n';
    text += '| ------ | ------ | ----------- |\n';
    data.expenseForecast.forEach((forecast: any) => {
      text += `| ${forecast.period} | $${forecast.amount.toLocaleString()} | ${forecast.growthRate ? `${forecast.growthRate}%` : 'N/A'} |\n`;
    });
    text += '\n';
  }
  
  if (data.growthAssumptions) {
    text += `### Growth Assumptions\n${data.growthAssumptions}\n\n`;
  }
  
  if (data.largestExpenseCategories) {
    text += `### Largest Expense Categories\n${data.largestExpenseCategories}\n\n`;
  }
  
  if (data.costSavingStrategies) {
    text += `### Cost-Saving Strategies\n${data.costSavingStrategies}\n\n`;
  }
  
  if (data.expenseManagementApproach) {
    text += `### Expense Management Approach\n${data.expenseManagementApproach}\n\n`;
  }
  
  // Calculate total expenses if we have all categories
  if (
    data.fixedExpenses && data.fixedExpenses.length > 0 &&
    data.variableExpenses && data.variableExpenses.length > 0 &&
    data.oneTimeExpenses && data.oneTimeExpenses.length > 0
  ) {
    const totalFixed = data.fixedExpenses.reduce((sum: number, expense: any) => sum + expense.annualAmount, 0);
    const totalVariable = data.variableExpenses.reduce((sum: number, expense: any) => sum + expense.estimatedAmount, 0);
    const totalOneTime = data.oneTimeExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
    
    const totalExpenses = totalFixed + totalVariable + totalOneTime;
    
    text += `### Total Projected Expenses\n**Total:** $${totalExpenses.toLocaleString()}\n\n`;
  }
  
  return text;
} 