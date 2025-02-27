import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import MarketPositioningQuestionnaire from './MarketPositioningQuestionnaire';
import PricingStrategyQuestionnaire from './PricingStrategyQuestionnaire';
import PromotionalActivitiesQuestionnaire from './PromotionalActivitiesQuestionnaire';
import SalesStrategyQuestionnaire from './SalesStrategyQuestionnaire';

/**
 * Props for the MarketingPlan component
 */
interface MarketingPlanProps {
  businessPlanId: string;
  isEditing?: boolean;
  onSave?: (section: string, content: string) => Promise<void>;
}

/**
 * Interface for marketing plan data
 */
interface MarketingPlanData {
  positioning?: string;
  pricing?: string;
  promotional?: string;
  sales?: string;
}

/**
 * MarketingPlan component
 * 
 * Displays and allows editing of the marketing plan section of the business plan
 * Uses questionnaire components for interactive editing
 */
export default function MarketingPlan({ 
  businessPlanId, 
  isEditing = false,
  onSave
}: MarketingPlanProps) {
  // State for marketing plan data
  const [marketingData, setMarketingData] = useState<MarketingPlanData>({});
  // State for data loading
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Fetch existing marketing plan data on component mount
  useEffect(() => {
    if (businessPlanId) {
      fetchMarketingData();
    }
  }, [businessPlanId]);
  
  /**
   * Fetch existing marketing plan data
   */
  const fetchMarketingData = async () => {
    setIsLoading(true);
    try {
      // Fetch positioning data
      const positioningResponse = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/positioning`);
      const positioningData = await positioningResponse.json();
      
      // Fetch pricing data
      const pricingResponse = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/pricing`);
      const pricingData = await pricingResponse.json();
      
      // Fetch promotional data
      const promotionalResponse = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/promotional`);
      const promotionalData = await promotionalResponse.json();
      
      // Fetch sales data
      const salesResponse = await fetch(`/api/business-plans/${businessPlanId}/marketing-plan/sales`);
      const salesData = await salesResponse.json();
      
      // Update state with fetched data
      setMarketingData({
        positioning: positioningData.positioning || '',
        pricing: pricingData.pricing || '',
        promotional: promotionalData.promotional || '',
        sales: salesData.salesStrategy || ''
      });
      
    } catch (error) {
      console.error('Error fetching marketing plan data:', error);
      toast.error('Failed to load marketing plan data');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle completion of the market positioning questionnaire
   */
  const handlePositioningComplete = (positioningText: string) => {
    setMarketingData(prev => ({
      ...prev,
      positioning: positioningText
    }));
    
    // If onSave callback is provided, save the data
    if (onSave) {
      onSave('marketingPlan.positioning', positioningText)
        .then(() => toast.success('Market positioning saved successfully'))
        .catch(() => toast.error('Failed to save market positioning'));
    }
  };
  
  /**
   * Handle completion of the pricing strategy questionnaire
   */
  const handlePricingComplete = (pricingText: string) => {
    setMarketingData(prev => ({
      ...prev,
      pricing: pricingText
    }));
    
    // If onSave callback is provided, save the data
    if (onSave) {
      onSave('marketingPlan.pricing', pricingText)
        .then(() => toast.success('Pricing strategy saved successfully'))
        .catch(() => toast.error('Failed to save pricing strategy'));
    }
  };

  /**
   * Handle completion of the promotional activities questionnaire
   */
  const handlePromotionalComplete = (promotionalText: string) => {
    setMarketingData(prev => ({
      ...prev,
      promotional: promotionalText
    }));
    
    // If onSave callback is provided, save the data
    if (onSave) {
      onSave('marketingPlan.promotional', promotionalText)
        .then(() => toast.success('Promotional activities saved successfully'))
        .catch(() => toast.error('Failed to save promotional activities'));
    }
  };
  
  /**
   * Handle completion of the sales strategy questionnaire
   */
  const handleSalesComplete = (salesText: string) => {
    setMarketingData(prev => ({
      ...prev,
      sales: salesText
    }));
    
    // If onSave callback is provided, save the data
    if (onSave) {
      onSave('marketingPlan.sales', salesText)
        .then(() => toast.success('Sales strategy saved successfully'))
        .catch(() => toast.error('Failed to save sales strategy'));
    }
  };

  /**
   * Render the appropriate content based on editing state
   */
  const renderContent = () => {
    if (isEditing) {
      // Show questionnaire components in edit mode
      return (
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Market Positioning</h3>
            <MarketPositioningQuestionnaire 
              businessPlanId={businessPlanId}
              onComplete={handlePositioningComplete}
            />
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Pricing Strategy</h3>
            <PricingStrategyQuestionnaire 
              businessPlanId={businessPlanId}
              onComplete={handlePricingComplete}
            />
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Promotional Activities</h3>
            <PromotionalActivitiesQuestionnaire
              businessPlanId={businessPlanId}
              onComplete={handlePromotionalComplete}
            />
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Sales Strategy</h3>
            <SalesStrategyQuestionnaire
              businessPlanId={businessPlanId}
              onComplete={handleSalesComplete}
            />
          </div>
        </div>
      );
    } else {
      // Show view mode with formatted data
      return (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            {marketingData.positioning ? (
              <div className="prose max-w-none">
                <h3 className="text-lg font-medium">Market Positioning</h3>
                <div dangerouslySetInnerHTML={{ __html: marketingData.positioning }} />
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Market positioning information will be displayed here.
                Switch to Edit mode to add or update your market positioning.
              </p>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            {marketingData.pricing ? (
              <div className="prose max-w-none">
                <h3 className="text-lg font-medium">Pricing Strategy</h3>
                <div dangerouslySetInnerHTML={{ __html: marketingData.pricing }} />
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Pricing strategy information will be displayed here.
                Switch to Edit mode to add or update your pricing strategy.
              </p>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            {marketingData.promotional ? (
              <div className="prose max-w-none">
                <h3 className="text-lg font-medium">Promotional Activities</h3>
                <div dangerouslySetInnerHTML={{ __html: marketingData.promotional }} />
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Promotional activities information will be displayed here.
                Switch to Edit mode to add or update your promotional activities.
              </p>
            )}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            {marketingData.sales ? (
              <div className="prose max-w-none">
                <h3 className="text-lg font-medium">Sales Strategy</h3>
                <div dangerouslySetInnerHTML={{ __html: marketingData.sales }} />
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Sales strategy information will be displayed here.
                Switch to Edit mode to add or update your sales strategy.
              </p>
            )}
          </div>
        </div>
      );
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Marketing Plan</h2>
      
      <div className="prose max-w-none">
        <p className="text-gray-600 mb-6">
          This section outlines your marketing strategy, including your target market, 
          positioning, promotional activities, and sales approach.
        </p>
        
        {renderContent()}
      </div>
    </div>
  );
} 