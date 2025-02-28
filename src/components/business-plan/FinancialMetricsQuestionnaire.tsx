'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import LoadingIndicator from './LoadingIndicator';

/**
 * Props interface for the Financial Metrics Questionnaire component
 */
interface FinancialMetricsQuestionnaireProps {
  businessPlanId: string;
  onComplete: (financialMetricsText: string, metricsData: any) => void;
}

/**
 * Interface for chat messages
 */
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Interface for financial metrics data structure
 */
interface FinancialMetricsData {
  profitabilityRatios?: {
    grossMargin?: number;
    operatingMargin?: number;
    netProfitMargin?: number;
    returnOnInvestment?: number;
    returnOnAssets?: number;
    returnOnEquity?: number;
  };
  liquidityRatios?: {
    currentRatio?: number;
    quickRatio?: number;
    cashRatio?: number;
    workingCapital?: number;
  };
  efficiencyRatios?: {
    inventoryTurnover?: number;
    assetTurnover?: number;
    receivablesTurnover?: number;
    payablesTurnover?: number;
    operatingCycle?: number;
  };
  solvencyRatios?: {
    debtToEquity?: number;
    debtToAssets?: number;
    interestCoverageRatio?: number;
  };
  valuationMetrics?: {
    earningsPerShare?: number;
    priceToEarnings?: number;
    priceToSales?: number;
    priceToBookValue?: number;
    enterpriseValue?: number;
    enterpriseValueToRevenue?: number;
    enterpriseValueToEBITDA?: number;
  };
  growthRates?: {
    revenueGrowth?: number;
    profitGrowth?: number;
    customerGrowth?: number;
    marketShareGrowth?: number;
  };
  benchmarks?: {
    industryAverages?: any;
    competitorComparisons?: any;
  };
  notes?: string[];
}

/**
 * Initial system message to guide the AI assistant
 */
const initialSystemMessage: Message = {
  role: 'system',
  content: `You are helping the user determine appropriate financial metrics for their business plan. 
Guide them through identifying and understanding key financial metrics that will measure the success of their business.

Focus on these key areas:
1. Profitability ratios (gross margin, operating margin, net profit margin, ROI, ROA, ROE)
2. Liquidity ratios (current ratio, quick ratio, cash ratio)
3. Efficiency ratios (inventory turnover, asset turnover, etc.)
4. Solvency ratios (debt-to-equity, debt-to-assets, interest coverage)
5. Growth metrics (revenue growth, profit growth, customer growth)
6. Industry-specific KPIs that are relevant to their business type

If they're not sure where to start, guide them through each category step by step.`
};

/**
 * Initial assistant message to start the conversation
 */
const initialAssistantMessage: Message = {
  role: 'assistant',
  content: "Let's discuss the financial metrics you'll use to measure the success of your business. This includes profitability ratios, liquidity measures, efficiency metrics, and other key performance indicators. To get started, could you tell me what type of business you're operating and what financial aspects are most important to you?"
};

/**
 * Financial Metrics Questionnaire component
 * 
 * A chat interface for discussing and defining financial metrics
 */
export default function FinancialMetricsQuestionnaire({
  businessPlanId,
  onComplete,
}: FinancialMetricsQuestionnaireProps) {
  // State for chat messages
  const [messages, setMessages] = useState<Message[]>([initialSystemMessage, initialAssistantMessage]);
  
  // State for user input
  const [input, setInput] = useState('');
  
  // State for loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // State for financial metrics data
  const [metricsData, setMetricsData] = useState<FinancialMetricsData>({});
  
  // State for formatted financial metrics text
  const [formattedMetricsText, setFormattedMetricsText] = useState('');
  
  // State for help mode
  const [isInHelpMode, setIsInHelpMode] = useState(false);
  
  // Reference to message container for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch existing financial metrics data when component mounts
  useEffect(() => {
    fetchFinancialMetricsData();
  }, [businessPlanId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  /**
   * Fetch existing financial metrics data from API
   */
  const fetchFinancialMetricsData = async () => {
    setIsDataLoading(true);
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/financial-metrics`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch financial metrics data');
      }
      
      const data = await response.json();
      
      if (data.metricsData && Object.keys(data.metricsData).length > 0) {
        setMetricsData(data.metricsData);
        
        // Format the financial metrics data into text
        const formattedText = data.financialMetricsText || formatMetricsText(data.metricsData);
        setFormattedMetricsText(formattedText);
      }
    } catch (error) {
      console.error('Error fetching financial metrics data:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  /**
   * Format financial metrics data into readable text
   * 
   * @param data - Financial metrics data
   * @returns Formatted text
   */
  const formatMetricsText = (data: FinancialMetricsData): string => {
    if (!data || Object.keys(data).length === 0) {
      return '';
    }
    
    let text = '## Financial Metrics\n\n';
    
    // Profitability ratios
    if (data.profitabilityRatios && Object.keys(data.profitabilityRatios).length > 0) {
      text += '### Profitability Ratios\n';
      const ratios = data.profitabilityRatios;
      
      if (ratios.grossMargin !== undefined) text += `- Gross Margin: ${ratios.grossMargin.toFixed(2)}%\n`;
      if (ratios.operatingMargin !== undefined) text += `- Operating Margin: ${ratios.operatingMargin.toFixed(2)}%\n`;
      if (ratios.netProfitMargin !== undefined) text += `- Net Profit Margin: ${ratios.netProfitMargin.toFixed(2)}%\n`;
      if (ratios.returnOnInvestment !== undefined) text += `- Return on Investment (ROI): ${ratios.returnOnInvestment.toFixed(2)}%\n`;
      if (ratios.returnOnAssets !== undefined) text += `- Return on Assets (ROA): ${ratios.returnOnAssets.toFixed(2)}%\n`;
      if (ratios.returnOnEquity !== undefined) text += `- Return on Equity (ROE): ${ratios.returnOnEquity.toFixed(2)}%\n`;
      
      text += '\n';
    }
    
    // Liquidity ratios
    if (data.liquidityRatios && Object.keys(data.liquidityRatios).length > 0) {
      text += '### Liquidity Ratios\n';
      const ratios = data.liquidityRatios;
      
      if (ratios.currentRatio !== undefined) text += `- Current Ratio: ${ratios.currentRatio.toFixed(2)}\n`;
      if (ratios.quickRatio !== undefined) text += `- Quick Ratio: ${ratios.quickRatio.toFixed(2)}\n`;
      if (ratios.cashRatio !== undefined) text += `- Cash Ratio: ${ratios.cashRatio.toFixed(2)}\n`;
      if (ratios.workingCapital !== undefined) text += `- Working Capital: $${ratios.workingCapital.toLocaleString()}\n`;
      
      text += '\n';
    }
    
    // Efficiency ratios
    if (data.efficiencyRatios && Object.keys(data.efficiencyRatios).length > 0) {
      text += '### Efficiency Ratios\n';
      const ratios = data.efficiencyRatios;
      
      if (ratios.inventoryTurnover !== undefined) text += `- Inventory Turnover: ${ratios.inventoryTurnover.toFixed(2)}\n`;
      if (ratios.assetTurnover !== undefined) text += `- Asset Turnover: ${ratios.assetTurnover.toFixed(2)}\n`;
      if (ratios.receivablesTurnover !== undefined) text += `- Receivables Turnover: ${ratios.receivablesTurnover.toFixed(2)}\n`;
      if (ratios.payablesTurnover !== undefined) text += `- Payables Turnover: ${ratios.payablesTurnover.toFixed(2)}\n`;
      if (ratios.operatingCycle !== undefined) text += `- Operating Cycle: ${ratios.operatingCycle.toFixed(0)} days\n`;
      
      text += '\n';
    }
    
    // Solvency ratios
    if (data.solvencyRatios && Object.keys(data.solvencyRatios).length > 0) {
      text += '### Solvency Ratios\n';
      const ratios = data.solvencyRatios;
      
      if (ratios.debtToEquity !== undefined) text += `- Debt-to-Equity Ratio: ${ratios.debtToEquity.toFixed(2)}\n`;
      if (ratios.debtToAssets !== undefined) text += `- Debt-to-Assets Ratio: ${ratios.debtToAssets.toFixed(2)}\n`;
      if (ratios.interestCoverageRatio !== undefined) text += `- Interest Coverage Ratio: ${ratios.interestCoverageRatio.toFixed(2)}\n`;
      
      text += '\n';
    }
    
    // Growth rates
    if (data.growthRates && Object.keys(data.growthRates).length > 0) {
      text += '### Growth Rates\n';
      const rates = data.growthRates;
      
      if (rates.revenueGrowth !== undefined) text += `- Revenue Growth: ${rates.revenueGrowth.toFixed(2)}%\n`;
      if (rates.profitGrowth !== undefined) text += `- Profit Growth: ${rates.profitGrowth.toFixed(2)}%\n`;
      if (rates.customerGrowth !== undefined) text += `- Customer Growth: ${rates.customerGrowth.toFixed(2)}%\n`;
      if (rates.marketShareGrowth !== undefined) text += `- Market Share Growth: ${rates.marketShareGrowth.toFixed(2)}%\n`;
      
      text += '\n';
    }
    
    // Notes
    if (data.notes && data.notes.length > 0) {
      text += '### Additional Notes\n';
      data.notes.forEach(note => {
        text += `- ${note}\n`;
      });
      text += '\n';
    }
    
    return text;
  };

  /**
   * Handle form submit to send message
   * 
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send message to API
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/financial-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process message');
      }
      
      const data = await response.json();
      
      // Add assistant response to chat
      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update financial metrics data and formatted text
      if (data.metricsData) {
        setMetricsData(data.metricsData);
        setFormattedMetricsText(data.financialMetricsText || formatMetricsText(data.metricsData));
      }
      
      // Reset help mode
      setIsInHelpMode(false);
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle "Help me" button click
   */
  const handleNotSure = async () => {
    if (isLoading) return;
    
    setIsInHelpMode(true);
    setIsLoading(true);
    
    try {
      // Send help request to API
      const helpMessage = "I'm not sure which financial metrics to include. Can you guide me through the important metrics for my business?";
      
      // Add user help message to chat
      const userMessage: Message = { role: 'user', content: helpMessage };
      setMessages(prev => [...prev, userMessage]);
      
      const response = await fetch(`/api/business-plans/${businessPlanId}/financial-plan/financial-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: helpMessage }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get help');
      }
      
      const data = await response.json();
      
      // Add assistant help response to chat
      const assistantMessage: Message = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update financial metrics data and formatted text if available
      if (data.metricsData) {
        setMetricsData(data.metricsData);
        setFormattedMetricsText(data.financialMetricsText || formatMetricsText(data.metricsData));
      }
    } catch (error) {
      console.error('Error getting help:', error);
      toast.error('Failed to get help. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Scroll to the bottom of the message container
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  /**
   * Save the financial metrics data
   */
  const handleSave = () => {
    if (formattedMetricsText) {
      onComplete(formattedMetricsText, metricsData);
      toast.success('Financial metrics saved!');
    } else {
      toast.warning('Please provide some financial metrics information before saving.');
    }
  };
  
  // Show loading indicator while fetching data
  if (isDataLoading) {
    return <LoadingIndicator />;
  }
  
  return (
    <div className="flex gap-6">
      {/* Left side - Chat */}
      <div className="w-1/2 space-y-4">
        <div 
          className="h-[600px] overflow-y-auto p-4 bg-gray-50 rounded-lg scroll-smooth"
        >
          {messages.filter(m => m.role !== 'system').map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              } mb-4`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm'
                }`}
              >
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && <LoadingIndicator type="dots" />}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={handleNotSure}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
      
      {/* Right side - Preview */}
      <div className="w-1/2">
        <div className="h-[600px] overflow-y-auto p-4 bg-white rounded-lg border-l-4 border-blue-600 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Metrics Preview</h3>
          
          {formattedMetricsText ? (
            <>
              <div className="prose max-w-none mb-6">
                <ReactMarkdown>
                  {formattedMetricsText}
                </ReactMarkdown>
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                This is a preview of your financial metrics. You can continue the conversation or save this information.
              </div>
              
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Save Financial Metrics
              </button>
            </>
          ) : (
            <div className="text-gray-500 italic">
              Your financial metrics will appear here as you discuss them in the chat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 