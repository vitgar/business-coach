/**
 * DEPRECATED: This component has been replaced by OperationsGeneric.tsx
 * This file is kept for reference purposes only. 
 * DO NOT USE IN PRODUCTION.
 */

import React from 'react';

/**
 * Original Operations component (kept as reference)
 * The complete implementation has been commented out to prevent usage.
 * 
 * This component previously handled:
 * - Production processes
 * - Quality control
 * - Inventory management
 * - KPIs
 * - Technology systems
 * 
 * Please use OperationsGeneric.tsx instead.
 */

// Props interface for type safety
interface OperationsProps {
  businessPlanId: string;
  isEditing?: boolean;
  onSave?: () => void;
}

/**
 * Placeholder component that replaces the original Operations component
 * Returns null and logs a warning when used
 */
const Operations: React.FC<OperationsProps> = () => {
  console.warn('Using deprecated Operations component. Please use OperationsGeneric instead.');
  return null;
};

export default Operations;

/* Original implementation preserved as reference:
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import ProductionProcessQuestionnaire from './ProductionProcessQuestionnaire';
import QualityControlQuestionnaire from './QualityControlQuestionnaire';
import InventoryManagementQuestionnaire from './InventoryManagementQuestionnaire';
import KPIQuestionnaire from './KPIQuestionnaire';
import TechnologyQuestionnaire from './TechnologyQuestionnaire';
import LoadingIndicator from './LoadingIndicator';

// Interface for Operations component props
interface OperationsProps {
  businessPlanId: string;
  isEditing?: boolean;
  onSave?: () => void;
}

// Interface for Operations data
interface OperationsData {
  production?: string;
  productionData?: any;
  qualityControl?: string;
  qualityControlData?: any;
  inventory?: string;
  inventoryData?: any;
  kpis?: string;
  kpiData?: any;
  technology?: string;
  technologyData?: any;
}

// Operations component for displaying and editing operations and control systems
const Operations: React.FC<OperationsProps> = ({ 
  businessPlanId, 
  isEditing = false,
  onSave
}) => {
  // State for operations data
  const [operationsData, setOperationsData] = useState<OperationsData>({});
  
  // State for loading indicator
  const [loading, setLoading] = useState(false);
  
  // States for section expansion
  const [productionExpanded, setProductionExpanded] = useState(false);
  const [qualityControlExpanded, setQualityControlExpanded] = useState(false);
  const [inventoryExpanded, setInventoryExpanded] = useState(false);
  const [kpiExpanded, setKpiExpanded] = useState(false);
  const [technologyExpanded, setTechnologyExpanded] = useState(false);
  
  // State for saving indicator
  const [savingOperations, setSavingOperations] = useState(false);
  
  // Auto-expand sections with content
  useEffect(() => {
    if (operationsData) {
      if (operationsData.production) {
        setProductionExpanded(true);
      }
      
      if (operationsData.qualityControl) {
        setQualityControlExpanded(true);
      }
      
      if (operationsData.inventory) {
        setInventoryExpanded(true);
      }
      
      if (operationsData.kpis) {
        setKpiExpanded(true);
      }
      
      if (operationsData.technology) {
        setTechnologyExpanded(true);
      }
    }
  }, [operationsData]);
  
  // Function to fetch operations data
  const fetchOperationsData = async () => {
    setLoading(true);
    
    try {
      // Fetch production process data
      const productionRes = await fetch(`/api/business-plans/${businessPlanId}/operations/production`);
      const productionData = await productionRes.json();
      
      // Fetch quality control data
      const qualityControlRes = await fetch(`/api/business-plans/${businessPlanId}/operations/quality-control`);
      const qualityControlData = await qualityControlRes.json();
      
      // Fetch inventory management data
      const inventoryRes = await fetch(`/api/business-plans/${businessPlanId}/operations/inventory`);
      const inventoryData = await inventoryRes.json();
      
      // Fetch KPI data
      const kpiRes = await fetch(`/api/business-plans/${businessPlanId}/operations/kpis`);
      const kpiData = await kpiRes.json();
      
      // Fetch technology systems data
      const technologyRes = await fetch(`/api/business-plans/${businessPlanId}/operations/technology`);
      const technologyData = await technologyRes.json();
      
      // Update state with fetched data
      setOperationsData({
        production: productionData.markdown || '',
        productionData: productionData.data || {},
        qualityControl: qualityControlData.markdown || '',
        qualityControlData: qualityControlData.data || {},
        inventory: inventoryData.markdown || '',
        inventoryData: inventoryData.data || {},
        kpis: kpiData.markdown || '',
        kpiData: kpiData.data || {},
        technology: technologyData.markdown || '',
        technologyData: technologyData.data || {},
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching operations data:', error);
      toast.error('Failed to load operations data. Please try again.');
      setLoading(false);
    }
  };
  
  // Fetch operations data on mount
  useEffect(() => {
    if (businessPlanId) {
      fetchOperationsData();
    }
  }, [businessPlanId]);
  
  // Function to handle saving operations data
  const handleSaveOperations = async () => {
    if (onSave) {
      setSavingOperations(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setSavingOperations(false);
      onSave();
    }
  };
  
  // Function to handle section expansion toggle
  const toggleSection = (section: string) => {
    switch (section) {
      case 'production':
        setProductionExpanded(prev => !prev);
        break;
      case 'qualityControl':
        setQualityControlExpanded(prev => !prev);
        break;
      case 'inventory':
        setInventoryExpanded(prev => !prev);
        break;
      case 'kpi':
        setKpiExpanded(prev => !prev);
        break;
      case 'technology':
        setTechnologyExpanded(prev => !prev);
        break;
      default:
        break;
    }
  };
  
  // Functions to handle individual section completion
  const handleProductionComplete = (markdown: string, data: any) => {
    setOperationsData(prev => ({
      ...prev,
      production: markdown,
      productionData: data
    }));
  };
  
  const handleQualityControlComplete = (markdown: string, data: any) => {
    setOperationsData(prev => ({
      ...prev,
      qualityControl: markdown,
      qualityControlData: data
    }));
  };
  
  const handleInventoryComplete = (markdown: string, data: any) => {
    setOperationsData(prev => ({
      ...prev,
      inventory: markdown,
      inventoryData: data
    }));
  };
  
  const handleKpiComplete = (markdown: string, data: any) => {
    setOperationsData(prev => ({
      ...prev,
      kpis: markdown,
      kpiData: data
    }));
  };
  
  const handleTechnologyComplete = (markdown: string, data: any) => {
    setOperationsData(prev => ({
      ...prev,
      technology: markdown,
      technologyData: data
    }));
  };
  
  // If loading, display loading indicator
  if (loading) {
    return <LoadingIndicator />;
  }
  
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-4">Operating & Control Systems</h2>
      
      {/* Production Process Section */}
      <div className="mb-4 border rounded-lg overflow-hidden">
        <div 
          className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('production')}
        >
          <h3 className="text-xl font-semibold">Production Process</h3>
          <button className="text-gray-500">
            {productionExpanded ? (
              <span>▼</span>
            ) : (
              <span>▶</span>
            )}
          </button>
        </div>
        
        {productionExpanded && (
          <div className="p-4">
            {isEditing ? (
              <ProductionProcessQuestionnaire 
                businessPlanId={businessPlanId}
                onComplete={handleProductionComplete}
              />
            ) : (
              <>
                {operationsData.production ? (
                  <ReactMarkdown>{operationsData.production}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500">
                    No production process information available. Switch to edit mode to add details.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Quality Control Section */}
      <div className="mb-4 border rounded-lg overflow-hidden">
        <div 
          className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('qualityControl')}
        >
          <h3 className="text-xl font-semibold">Quality Control</h3>
          <button className="text-gray-500">
            {qualityControlExpanded ? (
              <span>▼</span>
            ) : (
              <span>▶</span>
            )}
          </button>
        </div>
        
        {qualityControlExpanded && (
          <div className="p-4">
            {isEditing ? (
              <QualityControlQuestionnaire 
                businessPlanId={businessPlanId}
                onComplete={handleQualityControlComplete}
              />
            ) : (
              <>
                {operationsData.qualityControl ? (
                  <ReactMarkdown>{operationsData.qualityControl}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500">
                    No quality control information available. Switch to edit mode to add details.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Inventory Management Section */}
      <div className="mb-4 border rounded-lg overflow-hidden">
        <div 
          className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('inventory')}
        >
          <h3 className="text-xl font-semibold">Inventory Management</h3>
          <button className="text-gray-500">
            {inventoryExpanded ? (
              <span>▼</span>
            ) : (
              <span>▶</span>
            )}
          </button>
        </div>
        
        {inventoryExpanded && (
          <div className="p-4">
            {isEditing ? (
              <InventoryManagementQuestionnaire 
                businessPlanId={businessPlanId}
                onComplete={handleInventoryComplete}
              />
            ) : (
              <>
                {operationsData.inventory ? (
                  <ReactMarkdown>{operationsData.inventory}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500">
                    No inventory management information available. Switch to edit mode to add details.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* KPI Section */}
      <div className="mb-4 border rounded-lg overflow-hidden">
        <div 
          className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('kpi')}
        >
          <h3 className="text-xl font-semibold">Key Performance Indicators (KPIs)</h3>
          <button className="text-gray-500">
            {kpiExpanded ? (
              <span>▼</span>
            ) : (
              <span>▶</span>
            )}
          </button>
        </div>
        
        {kpiExpanded && (
          <div className="p-4">
            {isEditing ? (
              <KPIQuestionnaire 
                businessPlanId={businessPlanId}
                onComplete={handleKpiComplete}
              />
            ) : (
              <>
                {operationsData.kpis ? (
                  <ReactMarkdown>{operationsData.kpis}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500">
                    No KPI information available. Switch to edit mode to add details.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Technology Systems Section */}
      <div className="mb-4 border rounded-lg overflow-hidden">
        <div 
          className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
          onClick={() => toggleSection('technology')}
        >
          <h3 className="text-xl font-semibold">Technology Systems</h3>
          <button className="text-gray-500">
            {technologyExpanded ? (
              <span>▼</span>
            ) : (
              <span>▶</span>
            )}
          </button>
        </div>
        
        {technologyExpanded && (
          <div className="p-4">
            {isEditing ? (
              <TechnologyQuestionnaire 
                businessPlanId={businessPlanId}
                onComplete={handleTechnologyComplete}
              />
            ) : (
              <>
                {operationsData.technology ? (
                  <ReactMarkdown>{operationsData.technology}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500">
                    No technology systems information available. Switch to edit mode to add details.
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
            onClick={handleSaveOperations}
            disabled={savingOperations}
          >
            {savingOperations ? 'Saving...' : 'Save Operations & Control Systems'}
          </button>
        </div>
      )}
    </div>
  );
};
*/ 