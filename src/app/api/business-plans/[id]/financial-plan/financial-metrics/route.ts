import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OpenAI } from 'openai';

// Define the chat completion message type locally
interface chatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GET handler: Retrieves financial metrics data for a business plan
 * 
 * @param req - The request object
 * @param params - Contains the business plan ID
 * @returns The financial metrics data or an error response
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlanId = params.id;

    // Retrieve the business plan data
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId },
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
    const metricsData = financialPlan.financialMetrics || {};
    const financialMetricsText = financialPlan.financialMetricsText || '';

    return NextResponse.json({
      metricsData,
      financialMetricsText,
    });
  } catch (error) {
    console.error('Error retrieving financial metrics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve financial metrics data' },
      { status: 500 }
    );
  }
}

/**
 * POST handler: Processes messages related to financial metrics and updates the data
 * 
 * @param req - The request object containing the message
 * @param params - Contains the business plan ID
 * @returns The updated financial metrics data or an error response
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlanId = params.id;
    
    // Parse request body
    const body = await req.json();
    let messageContent = '';
    let isHelpRequest = false;
    
    // Handle different request formats
    if (body.message) {
      // Original format with single message
      messageContent = body.message;
      isHelpRequest = body.isHelpRequest || false;
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

    // Retrieve the business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId },
    });

    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      );
    }

    // Extract existing financial data from content
    const content = businessPlan.content as any || {};
    const financialPlan = content.financialPlan || {};
    const existingMetricsData = financialPlan.financialMetrics || {};

    // Construct system message
    const systemMessage = `You are an AI assistant helping a business owner define financial metrics for their business plan. 

Focus on these key areas:
1. Profitability ratios (gross margin, net profit margin, ROI)
2. Liquidity ratios (current ratio, quick ratio)
3. Efficiency ratios (inventory turnover, asset turnover)
4. Growth metrics (revenue growth, customer growth)
5. Customer metrics (acquisition cost, lifetime value)
6. Financial goals
7. Key performance indicators (KPIs)
8. Industry benchmarks

${isHelpRequest ? `
The user has asked for help with financial metrics. Provide a clear, step-by-step explanation of:
- What financial metrics are and why they're important
- The different categories of financial metrics
- How to set appropriate targets based on industry standards
- Examples of common metrics in each category with typical values
- How to use these metrics to monitor business health

Keep your explanation conversational but informative.
` : `
Based on the user's message, extract information about their financial metrics. If they provide specific metrics or targets, include those. If they are asking questions, provide helpful guidance about appropriate financial metrics for their business.

Here's what they've shared so far (if anything):
${JSON.stringify(existingMetricsData, null, 2)}

Respond to their message and then update the financial metrics data in this JSON format:
{
  "profitabilityRatios": [
    {"name": "Gross Profit Margin", "value": "40%", "description": "Percentage of revenue remaining after COGS"}
  ],
  "liquidityRatios": [
    {"name": "Current Ratio", "value": "2:1", "description": "Ability to pay short-term obligations"}
  ],
  "efficiencyRatios": [
    {"name": "Inventory Turnover", "value": "6x annually", "description": "How quickly inventory is sold"}
  ],
  "growthMetrics": [
    {"name": "Revenue Growth Rate", "value": "15% annually", "description": "Year-over-year increase in revenue"}
  ],
  "customerMetrics": [
    {"name": "Customer Acquisition Cost", "value": "$50", "description": "Cost to acquire a new customer"}
  ],
  "financialGoals": "Achieve 20% profit margin within 3 years while maintaining healthy cash reserves",
  "keyPerformanceIndicators": ["Monthly revenue", "Customer retention rate", "Cash flow"],
  "industryBenchmarks": "Industry average profit margin is 15%"
}

Only include data points that have been discussed. Don't make up values unless the user has specifically provided them.
`}`;

    // Build messages array
    const messages: chatCompletionMessage[] = [
      { role: 'system', content: systemMessage },
    ];

    // If it's not a help request, include the existing data context
    if (!isHelpRequest && Object.keys(existingMetricsData).length > 0) {
      messages.push({
        role: 'assistant',
        content: `Based on our previous conversation, I understand you have the following financial metrics in mind:\n\n${formatFinancialMetricsData(existingMetricsData)}`,
      });
    }

    // Add user message
    messages.push({ role: 'user', content: messageContent });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    // Extract assistant message
    const assistantMessage = completion.choices[0].message.content || '';

    // Extract metrics data from response
    let updatedMetricsData = { ...existingMetricsData };
    const jsonMatch = assistantMessage.match(/```json\n([\s\S]*?)\n```/) || 
                       assistantMessage.match(/```\n([\s\S]*?)\n```/) ||
                       assistantMessage.match(/{[\s\S]*?}/);

    if (jsonMatch) {
      try {
        // Clean the JSON string and parse it
        const jsonStr = jsonMatch[0].replace(/```json\n|```\n|```/g, '').trim();
        const extractedData = JSON.parse(jsonStr);
        
        // Merge with existing data
        updatedMetricsData = {
          ...updatedMetricsData,
          ...extractedData,
        };
      } catch (err) {
        console.error('Error parsing JSON from response:', err);
      }
    }

    // Clean response of any JSON and formatting instructions
    const cleanedResponse = assistantMessage
      .replace(/```json\n[\s\S]*?\n```/g, '')
      .replace(/```\n[\s\S]*?\n```/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/Here's the updated JSON:/g, '')
      .replace(/I've updated the financial metrics data:/g, '')
      .trim();

    // Format metrics data into readable text
    const formattedText = formatFinancialMetricsText(updatedMetricsData);

    // Update business plan with new data
    await prisma.businessPlan.update({
      where: { id: businessPlanId },
      data: {
        content: {
          ...content,
          financialPlan: {
            ...financialPlan,
            financialMetrics: updatedMetricsData,
            financialMetricsText: formattedText,
          },
        },
      },
    });

    return NextResponse.json({
      message: cleanedResponse,
      metricsData: updatedMetricsData,
      financialMetricsText: formattedText,
    });
  } catch (error) {
    console.error('Error processing financial metrics request:', error);
    return NextResponse.json(
      { error: 'Failed to process financial metrics request' },
      { status: 500 }
    );
  }
}

/**
 * Formats financial metrics data into a readable string for context
 * 
 * @param data - The financial metrics data object
 * @returns A formatted string describing the metrics
 */
function formatFinancialMetricsData(data: any): string {
  if (!data || Object.keys(data).length === 0) {
    return 'No financial metrics data available.';
  }

  let result = '';

  // Format profitability ratios
  if (data.profitabilityRatios && data.profitabilityRatios.length > 0) {
    result += 'Profitability Ratios:\n';
    data.profitabilityRatios.forEach((ratio: any) => {
      result += `- ${ratio.name}: ${ratio.value} (${ratio.description})\n`;
    });
    result += '\n';
  }

  // Format liquidity ratios
  if (data.liquidityRatios && data.liquidityRatios.length > 0) {
    result += 'Liquidity Ratios:\n';
    data.liquidityRatios.forEach((ratio: any) => {
      result += `- ${ratio.name}: ${ratio.value} (${ratio.description})\n`;
    });
    result += '\n';
  }

  // Format efficiency ratios
  if (data.efficiencyRatios && data.efficiencyRatios.length > 0) {
    result += 'Efficiency Ratios:\n';
    data.efficiencyRatios.forEach((ratio: any) => {
      result += `- ${ratio.name}: ${ratio.value} (${ratio.description})\n`;
    });
    result += '\n';
  }

  // Format growth metrics
  if (data.growthMetrics && data.growthMetrics.length > 0) {
    result += 'Growth Metrics:\n';
    data.growthMetrics.forEach((metric: any) => {
      result += `- ${metric.name}: ${metric.value} (${metric.description})\n`;
    });
    result += '\n';
  }

  // Format customer metrics
  if (data.customerMetrics && data.customerMetrics.length > 0) {
    result += 'Customer Metrics:\n';
    data.customerMetrics.forEach((metric: any) => {
      result += `- ${metric.name}: ${metric.value} (${metric.description})\n`;
    });
    result += '\n';
  }

  // Format financial goals
  if (data.financialGoals) {
    result += `Financial Goals: ${data.financialGoals}\n\n`;
  }

  // Format KPIs
  if (data.keyPerformanceIndicators && data.keyPerformanceIndicators.length > 0) {
    result += 'Key Performance Indicators:\n';
    data.keyPerformanceIndicators.forEach((kpi: string, index: number) => {
      result += `- ${kpi}\n`;
    });
    result += '\n';
  }

  // Format industry benchmarks
  if (data.industryBenchmarks) {
    result += `Industry Benchmarks: ${data.industryBenchmarks}\n`;
  }

  return result;
}

/**
 * Formats financial metrics data into a Markdown format for display
 * 
 * @param data - The financial metrics data to format
 * @returns A formatted string with Markdown formatting
 */
function formatFinancialMetricsText(data: any): string {
  if (!data || Object.keys(data).length === 0) {
    return '';
  }
  
  let text = '## Financial Metrics\n\n';
  
  // Add profitability ratios
  if (data.profitabilityRatios && data.profitabilityRatios.length > 0) {
    text += '### Profitability Ratios\n';
    text += '| Metric | Target | Description |\n';
    text += '|--------|--------|-------------|\n';
    
    data.profitabilityRatios.forEach((metric: any) => {
      text += `| ${metric.name} | ${metric.value} | ${metric.description} |\n`;
    });
    
    text += '\n';
  }
  
  // Add liquidity ratios
  if (data.liquidityRatios && data.liquidityRatios.length > 0) {
    text += '### Liquidity Ratios\n';
    text += '| Metric | Target | Description |\n';
    text += '|--------|--------|-------------|\n';
    
    data.liquidityRatios.forEach((metric: any) => {
      text += `| ${metric.name} | ${metric.value} | ${metric.description} |\n`;
    });
    
    text += '\n';
  }
  
  // Add efficiency ratios
  if (data.efficiencyRatios && data.efficiencyRatios.length > 0) {
    text += '### Efficiency Ratios\n';
    text += '| Metric | Target | Description |\n';
    text += '|--------|--------|-------------|\n';
    
    data.efficiencyRatios.forEach((metric: any) => {
      text += `| ${metric.name} | ${metric.value} | ${metric.description} |\n`;
    });
    
    text += '\n';
  }
  
  // Add growth metrics
  if (data.growthMetrics && data.growthMetrics.length > 0) {
    text += '### Growth Metrics\n';
    text += '| Metric | Target | Description |\n';
    text += '|--------|--------|-------------|\n';
    
    data.growthMetrics.forEach((metric: any) => {
      text += `| ${metric.name} | ${metric.value} | ${metric.description} |\n`;
    });
    
    text += '\n';
  }
  
  // Add customer metrics
  if (data.customerMetrics && data.customerMetrics.length > 0) {
    text += '### Customer Metrics\n';
    text += '| Metric | Target | Description |\n';
    text += '|--------|--------|-------------|\n';
    
    data.customerMetrics.forEach((metric: any) => {
      text += `| ${metric.name} | ${metric.value} | ${metric.description} |\n`;
    });
    
    text += '\n';
  }
  
  // Add financial goals
  if (data.financialGoals) {
    text += `### Financial Goals\n${data.financialGoals}\n\n`;
  }
  
  // Add key performance indicators
  if (data.keyPerformanceIndicators && data.keyPerformanceIndicators.length > 0) {
    text += '### Key Performance Indicators\n';
    data.keyPerformanceIndicators.forEach((kpi: string, index: number) => {
      text += `${index + 1}. ${kpi}\n`;
    });
    text += '\n';
  }
  
  // Add industry benchmarks
  if (data.industryBenchmarks) {
    text += `### Industry Benchmarks\n${data.industryBenchmarks}\n\n`;
  }
  
  return text;
} 