import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import StartupCostQuestionnaire from './StartupCostQuestionnaire';
import RevenueProjectionsQuestionnaire from './RevenueProjectionsQuestionnaire';
import ExpenseProjectionsQuestionnaire from './ExpenseProjectionsQuestionnaire';
import BreakEvenAnalysisQuestionnaire from './BreakEvenAnalysisQuestionnaire';
import FundingRequirementsQuestionnaire from './FundingRequirementsQuestionnaire';
import FinancialMetricsQuestionnaire from './FinancialMetricsQuestionnaire';

/**
 * Props for the FinancialPlan component
 */
interface FinancialPlanProps {
  businessPlanId: string;
  isEditing?: boolean;
}

/**
 * Data structure for the Financial Plan
 */
interface FinancialPlanData {
  startupCost?: string;
  startupCostData?: any;
  revenueProjections?: string;
  revenueProjectionsData?: any;
  expenseProjections?: string;
  expenseProjectionsData?: any;
  breakEvenAnalysis?: string;
  breakEvenData?: any;
  fundingRequirements?: string;
  fundingData?: any;
  financialMetrics?: string;
  metricsData?: any;
}

/**
 * Section type for financial plan sections
 */
type FinancialPlanSection = 
  | 'startupCost'
  | 'revenueProjections'
  | 'expenseProjections'
  | 'breakEvenAnalysis'
  | 'fundingRequirements'
  | 'financialMetrics';

/**
 * Section definition interface
 */
interface Section {
  id: FinancialPlanSection;
  title: string;
  description: string;
  hasContent: boolean;
  content: string;
}

/**
 * Financial plan sections configuration
 */
const sections: Section[] = [
  {
    id: 'startupCost',
    title: 'Startup Costs',
    description: 'Detail your initial investment needs, one-time costs, and ongoing expenses to launch your business',
    hasContent: true,
    content: '',
  },
  {
    id: 'revenueProjections',
    title: 'Revenue Projections',
    description: 'Forecast your sales and revenue streams over the next 1-3 years',
    hasContent: true,
    content: '',
  },
  {
    id: 'expenseProjections',
    title: 'Expense Projections',
    description: 'Estimate your fixed and variable costs for operating the business',
    hasContent: true,
    content: '',
  },
  {
    id: 'breakEvenAnalysis',
    title: 'Break-Even Analysis',
    description: 'Calculate when your business will become profitable by analyzing your fixed costs, variable costs, and unit prices.',
    hasContent: true,
    content: '',
  },
  {
    id: 'fundingRequirements',
    title: 'Funding Requirements',
    description: 'Detail how much funding your business needs, what it will be used for, and potential funding sources.',
    hasContent: true,
    content: '',
  },
  {
    id: 'financialMetrics',
    title: 'Financial Metrics',
    description: 'Define key financial metrics and ratios to track the success and health of your business.',
    hasContent: true,
    content: '',
  }
];

/**
 * FinancialPlan component
 * 
 * A comprehensive financial planning section for the business plan
 */
export default function FinancialPlan({ 
  businessPlanId, 
  isEditing = false 
}: FinancialPlanProps) {
  // State for financial plan data
  const [financialPlanData, setFinancialPlanData] = useState<FinancialPlanData>({});
  
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(true);
  
  // State for expanded section
  const [expandedSection, setExpandedSection] = useState<FinancialPlanSection | null>(null);

  // Fetch financial plan data when component mounts
  useEffect(() => {
    if (businessPlanId) {
      fetchFinancialPlanData();
    }
  }, [businessPlanId]);

  // Auto-expand the first section that has content when data loads
  useEffect(() => {
    if (!isLoading && !expandedSection) {
      // Check sections in order and expand the first one with content
      for (const section of sections) {
        if (financialPlanData[section.id]) {
          setExpandedSection(section.id);
          break;
        }
      }
    }
  }, [isLoading, financialPlanData, expandedSection]);
  
  /**
   * Fetch financial plan data from API
   */
  const fetchFinancialPlanData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch business plan data');
      }
      
      const data = await response.json();
      
      // Extract financial plan data from the business plan content
      const content = data.content || {};
      const financialPlan = content.financialPlan || {};
      
      setFinancialPlanData({
        startupCost: financialPlan.startupCost || '',
        startupCostData: financialPlan.startupCostData || {},
        revenueProjections: financialPlan.revenueProjections || '',
        revenueProjectionsData: financialPlan.revenueProjectionsData || {},
        expenseProjections: financialPlan.expenseProjections || '',
        expenseProjectionsData: financialPlan.expenseProjectionsData || {},
        breakEvenAnalysis: financialPlan.breakEvenAnalysis || '',
        breakEvenData: financialPlan.breakEvenData || {},
        fundingRequirements: financialPlan.fundingRequirements || '',
        fundingData: financialPlan.fundingData || {},
        financialMetrics: financialPlan.financialMetrics || '',
        metricsData: financialPlan.metricsData || {},
      });
    } catch (error) {
      console.error('Error fetching financial plan data:', error);
      toast.error('Failed to load financial plan data');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle startup cost questionnaire completion
   * 
   * @param startupCostText - Formatted startup cost text
   * @param startupCostData - Structured startup cost data
   */
  const handleStartupCostComplete = async (startupCostText: string, startupCostData: any) => {
    try {
      const updatedData = {
        ...financialPlanData,
        startupCost: startupCostText,
        startupCostData,
      };
      
      setFinancialPlanData(updatedData);
      
      // Save to API
      await saveFinancialPlanData(updatedData);
      
      toast.success('Startup costs saved successfully!');
    } catch (error) {
      console.error('Error saving startup costs:', error);
      toast.error('Failed to save startup costs');
    }
  };
  
  /**
   * Handle revenue projections questionnaire completion
   * 
   * @param revenueProjectionsText - Formatted revenue projections text
   * @param revenueProjectionsData - Structured revenue projections data
   */
  const handleRevenueProjectionsComplete = async (revenueProjectionsText: string, revenueProjectionsData: any) => {
    try {
      const updatedData = {
        ...financialPlanData,
        revenueProjections: revenueProjectionsText,
        revenueProjectionsData,
      };
      
      setFinancialPlanData(updatedData);
      
      // Save to API
      await saveFinancialPlanData(updatedData);
      
      toast.success('Revenue projections saved successfully!');
    } catch (error) {
      console.error('Error saving revenue projections:', error);
      toast.error('Failed to save revenue projections');
    }
  };
  
  /**
   * Handle expense projections questionnaire completion
   * 
   * @param expenseProjectionsText - Formatted expense projections text
   * @param expenseProjectionsData - Structured expense projections data
   */
  const handleExpenseProjectionsComplete = async (expenseProjectionsText: string, expenseProjectionsData: any) => {
    try {
      const updatedData = {
        ...financialPlanData,
        expenseProjections: expenseProjectionsText,
        expenseProjectionsData,
      };
      
      setFinancialPlanData(updatedData);
      
      // Save to API
      await saveFinancialPlanData(updatedData);
      
      toast.success('Expense projections saved successfully!');
    } catch (error) {
      console.error('Error saving expense projections:', error);
      toast.error('Failed to save expense projections');
    }
  };

  /**
   * BreakEvenAnalysisQuestionnaire completion handler
   * @param breakEvenAnalysisText - The formatted text content
   * @param breakEvenData - The structured data
   */
  const handleBreakEvenAnalysisComplete = (breakEvenAnalysisText: string, breakEvenData: any) => {
    setExpandedSection(null);
    
    // Create a new financial plan data object with updated break-even analysis
    const updatedFinancialPlanData = {
      ...financialPlanData,
      breakEvenAnalysis: breakEvenAnalysisText,
      breakEvenData,
    };
    
    // Update the state and save to API
    updateFinancialPlanData(updatedFinancialPlanData);
  };

  /**
   * FundingRequirementsQuestionnaire completion handler
   * @param fundingRequirementsText - The formatted text content
   * @param fundingData - The structured data
   */
  const handleFundingRequirementsComplete = (fundingRequirementsText: string, fundingData: any) => {
    const updatedFinancialPlanData = {
      ...financialPlanData,
      fundingRequirements: fundingRequirementsText,
      fundingData,
    };
    setFinancialPlanData(updatedFinancialPlanData);
    saveFinancialPlanData(updatedFinancialPlanData);
    toast.success('Funding requirements saved successfully!');
  };

  /**
   * FinancialMetricsQuestionnaire completion handler
   * @param financialMetricsText - The formatted text content
   * @param metricsData - The structured data
   */
  const handleFinancialMetricsComplete = (financialMetricsText: string, metricsData: any) => {
    const updatedFinancialPlanData = {
      ...financialPlanData,
      financialMetrics: financialMetricsText,
      metricsData,
    };
    setFinancialPlanData(updatedFinancialPlanData);
    saveFinancialPlanData(updatedFinancialPlanData);
    toast.success('Financial metrics saved successfully!');
  };
  
  /**
   * Save financial plan data to API
   * 
   * @param data - Financial plan data to save
   */
  const saveFinancialPlanData = async (data: FinancialPlanData) => {
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: {
            financialPlan: data,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save financial plan data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving financial plan data:', error);
      throw error;
    }
  };
  
  /**
   * Update financial plan data
   * 
   * @param data - Partial financial plan data to update
   */
  const updateFinancialPlanData = async (data: Partial<FinancialPlanData>) => {
    try {
      const updatedData = {
        ...financialPlanData,
        ...data,
      };
      
      setFinancialPlanData(updatedData);
      
      // Save to API
      await saveFinancialPlanData(updatedData);
    } catch (error) {
      console.error('Error updating financial plan data:', error);
      throw error;
    }
  };
  
  // Display loading indicator while data is being fetched
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin w-8 h-8 border-t-2 border-blue-500 border-r-2 rounded-full mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading financial plan data...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="border-b-2 border-blue-500 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Financial Plan</h2>
        <p className="mt-2 text-gray-600">
          The financial plan outlines the economic feasibility of your business, including startup costs,
          revenue projections, expense forecasts, and when you expect to break even.
        </p>
      </div>

      {/* Financial Plan Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="border rounded-lg shadow-sm bg-white overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="w-full px-6 py-4 flex items-center justify-between text-left bg-gradient-to-r from-gray-50 to-white border-b transition-colors hover:bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
              {expandedSection === section.id ? (
                <ChevronDown className="h-5 w-5 text-blue-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedSection === section.id && (
              <div className="px-6 py-5 bg-white">
                {section.id === 'startupCost' ? (
                  <div>
                    {financialPlanData.startupCost && !isEditing ? (
                      <div className="mb-4 prose prose-sm max-w-none">
                        <ReactMarkdown>{financialPlanData.startupCost}</ReactMarkdown>
                      </div>
                    ) : (
                      <StartupCostQuestionnaire
                        businessPlanId={businessPlanId}
                        onComplete={handleStartupCostComplete}
                      />
                    )}
                  </div>
                ) : section.id === 'revenueProjections' ? (
                  <div>
                    {financialPlanData.revenueProjections && !isEditing ? (
                      <div className="mb-4 prose prose-sm max-w-none">
                        <ReactMarkdown>{financialPlanData.revenueProjections}</ReactMarkdown>
                      </div>
                    ) : (
                      <RevenueProjectionsQuestionnaire
                        businessPlanId={businessPlanId}
                        onComplete={handleRevenueProjectionsComplete}
                      />
                    )}
                  </div>
                ) : section.id === 'expenseProjections' ? (
                  <div>
                    {financialPlanData.expenseProjections && !isEditing ? (
                      <div className="mb-4 prose prose-sm max-w-none">
                        <ReactMarkdown>{financialPlanData.expenseProjections}</ReactMarkdown>
                      </div>
                    ) : (
                      <ExpenseProjectionsQuestionnaire
                        businessPlanId={businessPlanId}
                        onComplete={handleExpenseProjectionsComplete}
                      />
                    )}
                  </div>
                ) : section.id === 'breakEvenAnalysis' ? (
                  <div>
                    {financialPlanData.breakEvenAnalysis && !isEditing ? (
                      <div className="mb-4 prose prose-sm max-w-none">
                        <ReactMarkdown>{financialPlanData.breakEvenAnalysis}</ReactMarkdown>
                      </div>
                    ) : (
                      <BreakEvenAnalysisQuestionnaire
                        businessPlanId={businessPlanId}
                        onComplete={handleBreakEvenAnalysisComplete}
                      />
                    )}
                  </div>
                ) : section.id === 'fundingRequirements' ? (
                  <div>
                    {financialPlanData.fundingRequirements && !isEditing ? (
                      <div className="mb-4 prose prose-sm max-w-none">
                        <ReactMarkdown>{financialPlanData.fundingRequirements}</ReactMarkdown>
                      </div>
                    ) : (
                      <FundingRequirementsQuestionnaire
                        businessPlanId={businessPlanId}
                        onComplete={handleFundingRequirementsComplete}
                      />
                    )}
                  </div>
                ) : section.id === 'financialMetrics' ? (
                  <div>
                    {financialPlanData.financialMetrics && !isEditing ? (
                      <div className="mb-4 prose prose-sm max-w-none">
                        <ReactMarkdown>{financialPlanData.financialMetrics}</ReactMarkdown>
                      </div>
                    ) : (
                      <FinancialMetricsQuestionnaire
                        businessPlanId={businessPlanId}
                        onComplete={handleFinancialMetricsComplete}
                      />
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 