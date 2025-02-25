import React from 'react';

/**
 * Props for the FinancialPlan component
 */
interface FinancialPlanProps {
  businessPlanId: string;
  isEditing?: boolean;
}

/**
 * FinancialPlan component
 * 
 * Displays and allows editing of the financial plan section of the business plan
 */
export default function FinancialPlan({ 
  businessPlanId, 
  isEditing = false 
}: FinancialPlanProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Plan</h2>
      
      <div className="prose max-w-none">
        <p className="text-gray-600 mb-4">
          This section outlines your financial projections, funding requirements, and key financial metrics.
          It demonstrates the financial viability and potential return on investment for your business.
        </p>
        
        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Startup Costs
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Detail your initial startup costs and capital requirements..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revenue Projections
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Outline your revenue projections for the next 3-5 years..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Projections
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Detail your expected expenses by category for the next 3-5 years..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Break-Even Analysis
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Describe your break-even point and how you calculated it..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Funding Requirements
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Outline your funding needs, sources, and use of funds..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Financial Metrics
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="List key financial metrics like ROI, profit margins, etc..."
              />
            </div>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Save Financial Plan
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-gray-500 italic">
              This section will display your saved financial plan information.
              Switch to Edit mode to add or update your financial projections and metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 