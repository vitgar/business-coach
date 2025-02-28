import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ChevronDown, ChevronRight, DollarSign, TrendingUp, TrendingDown, BarChart2, Briefcase, Target } from 'lucide-react';
import { 
  GenericQuestionnaire, 
  createQuestionnaireProps
} from '../generic';
import ReactMarkdown from 'react-markdown';

/**
 * Section interface for financial plan sections
 */
interface Section {
  id: string;
  title: string;
  description: string;
}

/**
 * Sections data for financial plan
 */
const sections: Section[] = [
  {
    id: 'startupCost',
    title: 'Startup Costs',
    description: 'Detail the initial investments required to launch your business',
  },
  {
    id: 'revenueProjections',
    title: 'Revenue Projections',
    description: 'Forecast your business income for the next 1-3 years',
  },
  {
    id: 'expenseProjections',
    title: 'Expense Projections',
    description: 'Outline your anticipated business expenses',
  },
  {
    id: 'breakEvenAnalysis',
    title: 'Break-Even Analysis',
    description: 'Calculate when your business will become profitable',
  },
  {
    id: 'fundingRequirements',
    title: 'Funding Requirements',
    description: 'Specify how much capital you need and how it will be used',
  },
  {
    id: 'financialMetrics',
    title: 'Financial Metrics',
    description: 'Define key performance indicators to track financial success',
  },
];

/**
 * Props for the FinancialPlanGeneric component
 */
interface FinancialPlanGenericProps {
  businessPlanId: string;
  isEditing?: boolean;
  onSave?: (section: string, content: string) => Promise<void>;
}

/**
 * Interface for financial plan data
 */
interface FinancialPlanData {
  startupCost?: string;
  revenueProjections?: string;
  expenseProjections?: string;
  breakEvenAnalysis?: string;
  fundingRequirements?: string;
  financialMetrics?: string;
  startupCostData?: any;
  revenueProjectionsData?: any;
  expenseProjectionsData?: any;
  breakEvenData?: any;
  fundingData?: any;
  metricsData?: any;
}

/**
 * FinancialPlanGeneric component
 * 
 * Displays and allows editing of the financial plan section of the business plan
 * Uses the GenericQuestionnaire component for interactive editing with collapsible sections
 */
export default function FinancialPlanGeneric({ 
  businessPlanId, 
  isEditing = false,
  onSave
}: FinancialPlanGenericProps) {
  // State for financial plan data
  const [financialPlanData, setFinancialPlanData] = useState<FinancialPlanData>({});
  // State for data loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // State for tracking expanded section
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  // State for saving indicator
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch existing financial plan data on component mount
  useEffect(() => {
    if (businessPlanId) {
      fetchFinancialPlanData();
    }
  }, [businessPlanId]);
  
  // Auto-expand the first section with content
  useEffect(() => {
    // Check each section in order and expand the first one with content
    for (const section of sections) {
      if (financialPlanData[section.id as keyof FinancialPlanData] && expandedSection === null) {
        setExpandedSection(section.id);
        break;
      }
    }
  }, [financialPlanData, expandedSection]);
  
  /**
   * Fetch financial plan data from API
   */
  const fetchFinancialPlanData = async () => {
    setIsLoading(true);
    try {
      // Fetch financial plan data from API
      const response = await fetch(`/api/business-plans/${businessPlanId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch financial plan data');
      }
      
      const data = await response.json();
      
      // Extract financial plan data
      const content = data.content || {};
      const financialPlan = content.financialPlan || {};
      
      // Set financial plan data state
      setFinancialPlanData({
        startupCost: financialPlan.startupCost || '',
        revenueProjections: financialPlan.revenueProjections || '',
        expenseProjections: financialPlan.expenseProjections || '',
        breakEvenAnalysis: financialPlan.breakEvenAnalysis || '',
        fundingRequirements: financialPlan.fundingRequirements || '',
        financialMetrics: financialPlan.financialMetrics || '',
        startupCostData: financialPlan.startupCostData || {},
        revenueProjectionsData: financialPlan.revenueProjectionsData || {},
        expenseProjectionsData: financialPlan.expenseProjectionsData || {},
        breakEvenData: financialPlan.breakEvenData || {},
        fundingData: financialPlan.fundingData || {},
        metricsData: financialPlan.metricsData || {}
      });
      
    } catch (error) {
      console.error('Error fetching financial plan data:', error);
      toast.error('Failed to load financial plan data');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Toggle section expansion/collapse
   */
  const toggleSection = (sectionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
    }
  };
  
  /**
   * Handle completion of the Startup Costs questionnaire
   */
  const handleStartupCostComplete = (formattedText: string) => {
    setFinancialPlanData(prev => ({
      ...prev,
      startupCost: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('startupCost', formattedText);
    }
  };
  
  /**
   * Handle completion of the Revenue Projections questionnaire
   */
  const handleRevenueProjectionsComplete = (formattedText: string) => {
    setFinancialPlanData(prev => ({
      ...prev,
      revenueProjections: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('revenueProjections', formattedText);
    }
  };
  
  /**
   * Handle completion of the Expense Projections questionnaire
   */
  const handleExpenseProjectionsComplete = (formattedText: string) => {
    setFinancialPlanData(prev => ({
      ...prev,
      expenseProjections: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('expenseProjections', formattedText);
    }
  };
  
  /**
   * Handle completion of the Break-Even Analysis questionnaire
   */
  const handleBreakEvenAnalysisComplete = (formattedText: string) => {
    setFinancialPlanData(prev => ({
      ...prev,
      breakEvenAnalysis: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('breakEvenAnalysis', formattedText);
    }
  };
  
  /**
   * Handle completion of the Funding Requirements questionnaire
   */
  const handleFundingRequirementsComplete = (formattedText: string) => {
    setFinancialPlanData(prev => ({
      ...prev,
      fundingRequirements: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('fundingRequirements', formattedText);
    }
  };
  
  /**
   * Handle completion of the Financial Metrics questionnaire
   */
  const handleFinancialMetricsComplete = (formattedText: string) => {
    setFinancialPlanData(prev => ({
      ...prev,
      financialMetrics: formattedText
    }));
    
    // Call onSave if provided
    if (onSave) {
      handleSave('financialMetrics', formattedText);
    }
  };
  
  /**
   * Handle saving section data
   */
  const handleSave = async (section: string, content: string) => {
    if (!onSave) return;
    
    try {
      setIsSaving(true);
      await onSave(`financialPlan.${section}`, content);
      toast.success(`${section} saved successfully`);
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      toast.error(`Failed to save ${section}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * Handle saving all financial plan data at once
   */
  const handleSaveAll = async () => {
    if (!onSave) return;
    
    try {
      setIsSaving(true);
      
      // Format all financial plan data into a single string
      const fullFinancialPlan = `
# Startup Costs
${financialPlanData.startupCost || ''}

# Revenue Projections
${financialPlanData.revenueProjections || ''}

# Expense Projections
${financialPlanData.expenseProjections || ''}

# Break-Even Analysis
${financialPlanData.breakEvenAnalysis || ''}

# Funding Requirements
${financialPlanData.fundingRequirements || ''}

# Financial Metrics
${financialPlanData.financialMetrics || ''}
      `.trim();
      
      // Save the complete financial plan
      await onSave('financialPlan', fullFinancialPlan);
      toast.success('Financial plan saved successfully');
    } catch (error) {
      console.error('Error saving financial plan:', error);
      toast.error('Failed to save financial plan');
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      {/* Header section with blue accent */}
      <div className="border-b-2 border-blue-500 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Financial Plan</h2>
        <p className="mt-2 text-gray-600">
          The financial plan outlines the economic feasibility of your business, including startup costs,
          revenue projections, expense forecasts, and when you expect to break even.
        </p>
      </div>
      
      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="border rounded-lg shadow-sm bg-white overflow-hidden">
            <button
              onClick={(e) => toggleSection(section.id, e)}
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
                {section.id === 'startupCost' && (
                  isEditing ? (
                    <GenericQuestionnaire
                      {...createQuestionnaireProps('startupCost', businessPlanId, handleStartupCostComplete)}
                      isEditing={isEditing}
                      initialData={financialPlanData.startupCostData || {}}
                      title="Startup Costs"
                      description="Detail the initial investments required to launch your business"
                      previewTitle="Startup Costs Preview"
                      prompts={[
                        "What are your one-time costs to start your business?",
                        "What equipment or assets do you need to purchase?",
                        "What are your initial inventory requirements?",
                        "What legal and registration fees do you anticipate?",
                        "What are your estimated costs for setting up your location?"
                      ]}
                      apiEndpoint="/financial-plan/startup-costs"
                    />
                  ) : (
                    financialPlanData.startupCost ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {typeof financialPlanData.startupCost === 'string' ? financialPlanData.startupCost : ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Startup Costs information will be displayed here.
                        Switch to Edit mode to add or update this section.
                      </p>
                    )
                  )
                )}
                
                {section.id === 'revenueProjections' && (
                  isEditing ? (
                    <GenericQuestionnaire
                      {...createQuestionnaireProps('revenueProjections', businessPlanId, handleRevenueProjectionsComplete)}
                      isEditing={isEditing}
                      initialData={financialPlanData.revenueProjectionsData || {}}
                      title="Revenue Projections"
                      description="Forecast your business income for the next 1-3 years"
                      previewTitle="Revenue Projections Preview"
                      prompts={[
                        "What are your main revenue streams?",
                        "What are your projected sales for year one?",
                        "How do you expect your revenue to grow in years two and three?",
                        "What assumptions are your revenue projections based on?",
                        "How does seasonality affect your revenue projections?"
                      ]}
                      apiEndpoint="/financial-plan/revenue-projections"
                    />
                  ) : (
                    financialPlanData.revenueProjections ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {typeof financialPlanData.revenueProjections === 'string' ? financialPlanData.revenueProjections : ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Revenue Projections information will be displayed here.
                        Switch to Edit mode to add or update this section.
                      </p>
                    )
                  )
                )}
                
                {section.id === 'expenseProjections' && (
                  isEditing ? (
                    <GenericQuestionnaire
                      {...createQuestionnaireProps('expenseProjections', businessPlanId, handleExpenseProjectionsComplete)}
                      isEditing={isEditing}
                      initialData={financialPlanData.expenseProjectionsData || {}}
                      title="Expense Projections"
                      description="Outline your anticipated business expenses"
                      previewTitle="Expense Projections Preview"
                      prompts={[
                        "What are your fixed monthly expenses?",
                        "What are your variable costs associated with production or service delivery?",
                        "What are your staffing and payroll expenses?",
                        "What marketing and sales expenses do you anticipate?",
                        "How will your expenses change as your business grows?"
                      ]}
                      apiEndpoint="/financial-plan/expense-projections"
                    />
                  ) : (
                    financialPlanData.expenseProjections ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {typeof financialPlanData.expenseProjections === 'string' ? financialPlanData.expenseProjections : ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Expense Projections information will be displayed here.
                        Switch to Edit mode to add or update this section.
                      </p>
                    )
                  )
                )}
                
                {section.id === 'breakEvenAnalysis' && (
                  isEditing ? (
                    <GenericQuestionnaire
                      {...createQuestionnaireProps('breakEvenAnalysis', businessPlanId, handleBreakEvenAnalysisComplete)}
                      isEditing={isEditing}
                      initialData={financialPlanData.breakEvenData || {}}
                      title="Break-Even Analysis"
                      description="Calculate when your business will become profitable"
                      previewTitle="Break-Even Analysis Preview"
                      prompts={[
                        "What is your break-even point in units or revenue?",
                        "How long will it take to reach your break-even point?",
                        "What is your contribution margin per unit or service?",
                        "How can you reduce the time to break-even?",
                        "What factors could delay reaching your break-even point?"
                      ]}
                      apiEndpoint="/financial-plan/break-even-analysis"
                    />
                  ) : (
                    financialPlanData.breakEvenAnalysis ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {typeof financialPlanData.breakEvenAnalysis === 'string' ? financialPlanData.breakEvenAnalysis : ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Break-Even Analysis information will be displayed here.
                        Switch to Edit mode to add or update this section.
                      </p>
                    )
                  )
                )}
                
                {section.id === 'fundingRequirements' && (
                  isEditing ? (
                    <GenericQuestionnaire
                      {...createQuestionnaireProps('fundingRequirements', businessPlanId, handleFundingRequirementsComplete)}
                      isEditing={isEditing}
                      initialData={financialPlanData.fundingData || {}}
                      title="Funding Requirements"
                      description="Specify how much capital you need and how it will be used"
                      previewTitle="Funding Requirements Preview"
                      prompts={[
                        "How much funding do you need to start and grow your business?",
                        "What are the specific uses for the funding?",
                        "What funding sources are you considering?",
                        "What is your timeline for securing funding?",
                        "What is your plan for providing returns to investors?"
                      ]}
                      apiEndpoint="/financial-plan/funding-requirements"
                    />
                  ) : (
                    financialPlanData.fundingRequirements ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {typeof financialPlanData.fundingRequirements === 'string' ? financialPlanData.fundingRequirements : ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Funding Requirements information will be displayed here.
                        Switch to Edit mode to add or update this section.
                      </p>
                    )
                  )
                )}
                
                {section.id === 'financialMetrics' && (
                  isEditing ? (
                    <GenericQuestionnaire
                      {...createQuestionnaireProps('financialMetrics', businessPlanId, handleFinancialMetricsComplete)}
                      isEditing={isEditing}
                      initialData={financialPlanData.metricsData || {}}
                      title="Financial Metrics"
                      description="Define key performance indicators to track financial success"
                      previewTitle="Financial Metrics Preview"
                      prompts={[
                        "What financial KPIs will you track?",
                        "What is your target profit margin?",
                        "What is your projected return on investment?",
                        "How will you monitor cash flow?",
                        "What financial ratios are most important for your business?"
                      ]}
                      apiEndpoint="/financial-plan/financial-metrics"
                    />
                  ) : (
                    financialPlanData.financialMetrics ? (
                      <div className="prose max-w-none">
                        <ReactMarkdown>
                          {typeof financialPlanData.financialMetrics === 'string' ? financialPlanData.financialMetrics : ''}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Financial Metrics information will be displayed here.
                        Switch to Edit mode to add or update this section.
                      </p>
                    )
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Save Button */}
      {isEditing && (
        <div className="mt-8 flex justify-end">
          <button 
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Saving...</span>
              </>
            ) : (
              'Save All Sections'
            )}
          </button>
        </div>
      )}
    </div>
  );
} 