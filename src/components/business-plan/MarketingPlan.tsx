/**
 * DEPRECATED: This component has been replaced by MarketingPlanGeneric.tsx
 * This file is kept for reference purposes only. 
 * DO NOT USE IN PRODUCTION.
 */

import React from 'react';

/**
 * Original MarketingPlan component (kept as reference)
 * The complete implementation has been commented out to prevent usage.
 * 
 * This component previously handled:
 * - Market Positioning
 * - Pricing Strategy
 * - Promotional Activities
 * - Sales Strategy
 * 
 * Please use MarketingPlanGeneric.tsx instead.
 */

// Props interface for type safety
interface MarketingPlanProps {
  businessPlanId: string;
  isEditing?: boolean;
  onSave?: () => void;
}

/**
 * Placeholder component that replaces the original MarketingPlan component
 * Returns null and logs a warning when used
 */
const MarketingPlan: React.FC<MarketingPlanProps> = () => {
  console.warn('Using deprecated MarketingPlan component. Please use MarketingPlanGeneric instead.');
  return null;
};

export default MarketingPlan;

/* Original implementation preserved as reference:
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import MarketPositioningQuestionnaire from './MarketPositioningQuestionnaire';
import PricingStrategyQuestionnaire from './PricingStrategyQuestionnaire';
import PromotionalActivitiesQuestionnaire from './PromotionalActivitiesQuestionnaire';
import SalesStrategyQuestionnaire from './SalesStrategyQuestionnaire';
import LoadingIndicator from './LoadingIndicator';

// Interface for section structure
interface Section {
  id: string;
  title: string;
  description: string;
}

// Sections for the marketing plan
const sections: Section[] = [
  {
    id: 'positioning',
    title: 'Market Positioning',
    description: 'Define how your product or service is positioned in the market and your unique value proposition.'
  },
  {
    id: 'pricing',
    title: 'Pricing Strategy',
    description: 'Outline your pricing approach, rationale, and how it aligns with your overall marketing strategy.'
  },
  {
    id: 'promotional',
    title: 'Promotional Activities',
    description: 'Detail the marketing channels, campaigns, and activities you will use to reach your target audience.'
  },
  {
    id: 'sales',
    title: 'Sales Strategy',
    description: 'Describe your sales process, team structure, and methods for converting leads into customers.'
  }
];

// Interface for MarketingPlan props
interface MarketingPlanProps {
  businessPlanId: string;
  isEditing?: boolean;
  onSave?: () => void;
}

// MarketingPlan component
const MarketingPlan: React.FC<MarketingPlanProps> = ({ 
  businessPlanId, 
  isEditing = false,
  onSave
}) => {
  // State for marketing data
  const [marketingData, setMarketingData] = useState<any>({});
  
  // State for loading indicator
  const [loading, setLoading] = useState(false);
  
  // States for section expansion
  const [positioningExpanded, setPositioningExpanded] = useState(false);
  const [pricingExpanded, setPricingExpanded] = useState(false);
  const [promotionalExpanded, setPromotionalExpanded] = useState(false);
  const [salesExpanded, setSalesExpanded] = useState(false);
  
  // State for saving indicator
  const [savingMarketing, setSavingMarketing] = useState(false);
  
  // Auto-expand sections with content
  useEffect(() => {
    if (marketingData) {
      if (marketingData.positioning) {
        setPositioningExpanded(true);
      }
      
      if (marketingData.pricing) {
        setPricingExpanded(true);
      }
      
      if (marketingData.promotional) {
        setPromotionalExpanded(true);
      }
      
      if (marketingData.sales) {
        setSalesExpanded(true);
      }
    }
  }, [marketingData]);
  
  // Function to fetch marketing data
  const fetchMarketingData = async () => {
    setLoading(true);
    
    try {
      // Fetch market positioning data
      const positioningRes = await fetch(`/api/business-plans/${businessPlanId}/marketing/positioning`);
      const positioningData = await positioningRes.json();
      
      // Fetch pricing strategy data
      const pricingRes = await fetch(`/api/business-plans/${businessPlanId}/marketing/pricing`);
      const pricingData = await pricingRes.json();
      
      // Fetch promotional activities data
      const promotionalRes = await fetch(`/api/business-plans/${businessPlanId}/marketing/promotional`);
      const promotionalData = await promotionalRes.json();
      
      // Fetch sales strategy data
      const salesRes = await fetch(`/api/business-plans/${businessPlanId}/marketing/sales`);
      const salesData = await salesRes.json();
      
      // Update state with fetched data
      setMarketingData({
        positioning: positioningData.markdown || '',
        positioningData: positioningData.data || {},
        pricing: pricingData.markdown || '',
        pricingData: pricingData.data || {},
        promotional: promotionalData.markdown || '',
        promotionalData: promotionalData.data || {},
        sales: salesData.markdown || '',
        salesData: salesData.data || {},
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching marketing data:', error);
      toast.error('Failed to load marketing data. Please try again.');
      setLoading(false);
    }
  };
  
  // Fetch marketing data on mount
  useEffect(() => {
    if (businessPlanId) {
      fetchMarketingData();
    }
  }, [businessPlanId]);
  
  // Function to handle saving marketing data
  const handleSaveMarketing = async () => {
    if (onSave) {
      setSavingMarketing(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setSavingMarketing(false);
      onSave();
    }
  };
  
  // Function to handle section expansion toggle
  const toggleSection = (section: string) => {
    switch (section) {
      case 'positioning':
        setPositioningExpanded(prev => !prev);
        break;
      case 'pricing':
        setPricingExpanded(prev => !prev);
        break;
      case 'promotional':
        setPromotionalExpanded(prev => !prev);
        break;
      case 'sales':
        setSalesExpanded(prev => !prev);
        break;
      default:
        break;
    }
  };
  
  // Functions to handle individual section completion
  const handlePositioningComplete = (markdown: string, data: any) => {
    setMarketingData(prev => ({
      ...prev,
      positioning: markdown,
      positioningData: data
    }));
  };
  
  const handlePricingComplete = (markdown: string, data: any) => {
    setMarketingData(prev => ({
      ...prev,
      pricing: markdown,
      pricingData: data
    }));
  };
  
  const handlePromotionalComplete = (markdown: string, data: any) => {
    setMarketingData(prev => ({
      ...prev,
      promotional: markdown,
      promotionalData: data
    }));
  };
  
  const handleSalesComplete = (markdown: string, data: any) => {
    setMarketingData(prev => ({
      ...prev,
      sales: markdown,
      salesData: data
    }));
  };
  
  // If loading, display loading indicator
  if (loading) {
    return <LoadingIndicator />;
  }
  
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-4">Marketing Plan</h2>
      
      {/* Market Positioning Section */}
      <div className="mb-4 border rounded-lg overflow-hidden">
        <div 
          className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('positioning')}
        >
          <h3 className="text-xl font-semibold">Market Positioning</h3>
          <button className="text-gray-500">
            {positioningExpanded ? (
              <ChevronDown size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>
        
        {positioningExpanded && (
          <div className="p-4">
            {isEditing ? (
              <MarketPositioningQuestionnaire 
                businessPlanId={businessPlanId}
                onComplete={handlePositioningComplete}
              />
            ) : (
              <>
                {marketingData.positioning ? (
                  <ReactMarkdown>{marketingData.positioning}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500">
                    No market positioning information available. Switch to edit mode to add details.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Pricing Strategy Section */}
      <div className="mb-4 border rounded-lg overflow-hidden">
        <div 
          className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('pricing')}
        >
          <h3 className="text-xl font-semibold">Pricing Strategy</h3>
          <button className="text-gray-500">
            {pricingExpanded ? (
              <ChevronDown size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>
        
        {pricingExpanded && (
          <div className="p-4">
            {isEditing ? (
              <PricingStrategyQuestionnaire 
                businessPlanId={businessPlanId}
                onComplete={handlePricingComplete}
              />
            ) : (
              <>
                {marketingData.pricing ? (
                  <ReactMarkdown>{marketingData.pricing}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500">
                    No pricing strategy information available. Switch to edit mode to add details.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Promotional Activities Section */}
      <div className="mb-4 border rounded-lg overflow-hidden">
        <div 
          className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('promotional')}
        >
          <h3 className="text-xl font-semibold">Promotional Activities</h3>
          <button className="text-gray-500">
            {promotionalExpanded ? (
              <ChevronDown size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>
        
        {promotionalExpanded && (
          <div className="p-4">
            {isEditing ? (
              <PromotionalActivitiesQuestionnaire 
                businessPlanId={businessPlanId}
                onComplete={handlePromotionalComplete}
              />
            ) : (
              <>
                {marketingData.promotional ? (
                  <ReactMarkdown>{marketingData.promotional}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500">
                    No promotional activities information available. Switch to edit mode to add details.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Sales Strategy Section */}
      <div className="mb-4 border rounded-lg overflow-hidden">
        <div 
          className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('sales')}
        >
          <h3 className="text-xl font-semibold">Sales Strategy</h3>
          <button className="text-gray-500">
            {salesExpanded ? (
              <ChevronDown size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>
        
        {salesExpanded && (
          <div className="p-4">
            {isEditing ? (
              <SalesStrategyQuestionnaire 
                businessPlanId={businessPlanId}
                onComplete={handleSalesComplete}
              />
            ) : (
              <>
                {marketingData.sales ? (
                  <ReactMarkdown>{marketingData.sales}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500">
                    No sales strategy information available. Switch to edit mode to add details.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Save button for editing mode */}
      {isEditing && (
        <div className="mt-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            onClick={handleSaveMarketing}
            disabled={savingMarketing}
          >
            {savingMarketing ? 'Saving...' : 'Save Marketing Plan'}
          </button>
        </div>
      )}
    </div>
  );
};
*/ 