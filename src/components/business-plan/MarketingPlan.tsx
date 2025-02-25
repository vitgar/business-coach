import React from 'react';

/**
 * Props for the MarketingPlan component
 */
interface MarketingPlanProps {
  businessPlanId: string;
  isEditing?: boolean;
}

/**
 * MarketingPlan component
 * 
 * Displays and allows editing of the marketing plan section of the business plan
 */
export default function MarketingPlan({ 
  businessPlanId, 
  isEditing = false 
}: MarketingPlanProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Marketing Plan</h2>
      
      <div className="prose max-w-none">
        <p className="text-gray-600 mb-4">
          This section outlines your marketing strategy, including your target market, 
          positioning, promotional activities, and sales approach.
        </p>
        
        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Market Positioning
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Describe how your business is positioned in the market compared to competitors..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pricing Strategy
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Outline your pricing strategy and how it aligns with your market positioning..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Promotional Activities
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Describe your advertising, PR, content marketing, and other promotional activities..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sales Strategy
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Outline your sales process, channels, and team structure..."
              />
            </div>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Save Marketing Plan
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-gray-500 italic">
              This section will display your saved marketing plan information.
              Switch to Edit mode to add or update your marketing plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 