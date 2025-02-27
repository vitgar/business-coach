import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import ProductionProcessQuestionnaire from './ProductionProcessQuestionnaire';
import QualityControlQuestionnaire from './QualityControlQuestionnaire';
import InventoryManagementQuestionnaire from './InventoryManagementQuestionnaire';
import KPIQuestionnaire from './KPIQuestionnaire';
import TechnologyQuestionnaire from './TechnologyQuestionnaire';
import LoadingIndicator from './LoadingIndicator';

/**
 * Interface for Operations component props
 */
interface OperationsProps {
  businessPlanId: string;
  isEditing?: boolean;
  onSave?: () => void;
}

/**
 * Interface for Operations data
 */
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

/**
 * Operations component for displaying and editing operations and control systems
 * 
 * @param businessPlanId - The ID of the business plan
 * @param isEditing - Whether the component is in edit mode
 * @param onSave - Optional callback for when operations data is saved
 */
const Operations: React.FC<OperationsProps> = ({ 
  businessPlanId, 
  isEditing = false,
  onSave
}) => {
  // State for operations data
  const [operationsData, setOperationsData] = useState<OperationsData>({
    production: '',
    productionData: {},
    qualityControl: '',
    qualityControlData: {},
    inventory: '',
    inventoryData: {},
    kpis: '',
    kpiData: {},
    technology: '',
    technologyData: {}
  });
  
  // State for loading indicators
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for form values
  const [formValues, setFormValues] = useState({
    production: '',
    qualityControl: '',
    inventory: '',
    kpis: '',
    technology: ''
  });
  
  // Fetch operations data when component mounts or businessPlanId changes
  useEffect(() => {
    if (businessPlanId) {
      fetchOperationsData();
    }
  }, [businessPlanId]);
  
  /**
   * Fetch operations data from API
   */
  const fetchOperationsData = async () => {
    setIsLoading(true);
    try {
      // Fetch all operations data
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations`);
      if (!response.ok) {
        throw new Error('Failed to fetch operations data');
      }
      
      const data = await response.json();
      const operations = data.operations || {};
      
      // Set operations data
      setOperationsData({
        production: operations.production || '',
        productionData: operations.productionData || {},
        qualityControl: operations.qualityControl || '',
        qualityControlData: operations.qualityControlData || {},
        inventory: operations.inventory || '',
        inventoryData: operations.inventoryData || {},
        kpis: operations.kpis || '',
        kpiData: operations.kpiData || {},
        technology: operations.technology || '',
        technologyData: operations.technologyData || {}
      });
      
      // Set form values
      setFormValues({
        production: operations.production || '',
        qualityControl: operations.qualityControl || '',
        inventory: operations.inventory || '',
        kpis: operations.kpis || '',
        technology: operations.technology || ''
      });
    } catch (error) {
      console.error('Error fetching operations data:', error);
      toast.error('Failed to load operations data');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Handle completion of production process questionnaire
   * 
   * @param production - The production process markdown
   * @param productionData - The structured production data
   */
  const handleProductionComplete = (production: string, productionData: any) => {
    setOperationsData(prev => ({
      ...prev,
      production,
      productionData
    }));
  };
  
  /**
   * Handle completion of quality control questionnaire
   * 
   * @param qualityControl - The quality control markdown
   * @param qualityControlData - The structured quality control data
   */
  const handleQualityControlComplete = (qualityControl: string, qualityControlData: any) => {
    setOperationsData(prev => ({
      ...prev,
      qualityControl,
      qualityControlData
    }));
  };
  
  /**
   * Handle completion of inventory management questionnaire
   * 
   * @param inventory - The inventory management markdown
   * @param inventoryData - The structured inventory data
   */
  const handleInventoryComplete = (inventory: string, inventoryData: any) => {
    setOperationsData(prev => ({
      ...prev,
      inventory,
      inventoryData
    }));
  };
  
  /**
   * Handle completion of KPI questionnaire
   * 
   * @param kpis - The KPIs markdown
   * @param kpiData - The structured KPI data
   */
  const handleKPIComplete = (kpis: string, kpiData: any) => {
    setOperationsData(prev => ({
      ...prev,
      kpis,
      kpiData
    }));
  };
  
  /**
   * Handle completion of technology questionnaire
   * 
   * @param technology - The technology markdown
   * @param technologyData - The structured technology data
   */
  const handleTechnologyComplete = (technology: string, technologyData: any) => {
    setOperationsData(prev => ({
      ...prev,
      technology,
      technologyData
    }));
  };
  
  /**
   * Handle changes in text area fields
   * 
   * @param e - The change event
   */
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  /**
   * Save operations data to the API
   */
  const handleSaveOperations = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/business-plans/${businessPlanId}/operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          production: operationsData.production || formValues.production,
          productionData: operationsData.productionData,
          qualityControl: operationsData.qualityControl || formValues.qualityControl,
          qualityControlData: operationsData.qualityControlData,
          inventory: operationsData.inventory || formValues.inventory,
          inventoryData: operationsData.inventoryData,
          kpis: operationsData.kpis || formValues.kpis,
          kpiData: operationsData.kpiData,
          technology: operationsData.technology || formValues.technology,
          technologyData: operationsData.technologyData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save operations data');
      }

      toast.success('Operations data saved successfully');
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving operations data:', error);
      toast.error('Failed to save operations data');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Show loading indicator while data is being fetched
  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Operating & Control Systems</h2>
        <LoadingIndicator />
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Operating & Control Systems</h2>
      <p className="mb-6 text-gray-600">
        Define how your business will operate on a day-to-day basis, including production processes, 
        quality control measures, inventory management, key performance indicators, and technology systems.
      </p>
      
      {isEditing ? (
        <div className="space-y-8">
          {/* Production Process Questionnaire */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Production Process</h3>
            <ProductionProcessQuestionnaire
              businessPlanId={businessPlanId}
              onComplete={handleProductionComplete}
            />
          </div>
          
          {/* Quality Control Questionnaire */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Quality Control</h3>
            <QualityControlQuestionnaire
              businessPlanId={businessPlanId}
              onComplete={handleQualityControlComplete}
            />
          </div>
          
          {/* Inventory Management Questionnaire */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Inventory Management</h3>
            <InventoryManagementQuestionnaire
              businessPlanId={businessPlanId}
              onComplete={handleInventoryComplete}
            />
          </div>
          
          {/* Key Performance Indicators */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Key Performance Indicators (KPIs)</h3>
            <KPIQuestionnaire
              businessPlanId={businessPlanId}
              onComplete={handleKPIComplete}
            />
          </div>
          
          {/* Technology & Systems */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Technology & Systems</h3>
            <TechnologyQuestionnaire
              businessPlanId={businessPlanId}
              onComplete={handleTechnologyComplete}
            />
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveOperations}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isSaving ? 'Saving...' : 'Save Operations'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Production Process */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Production Process</h3>
            {operationsData.production ? (
              <div className="prose max-w-none">
                <ReactMarkdown>{operationsData.production}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-500 italic">No production process information available. Switch to edit mode to add details.</p>
            )}
          </div>

          {/* Quality Control */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Quality Control</h3>
            {operationsData.qualityControl ? (
              <div className="prose max-w-none">
                <ReactMarkdown>{operationsData.qualityControl}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-500 italic">No quality control information available. Switch to edit mode to add details.</p>
            )}
          </div>

          {/* Inventory Management */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Inventory Management</h3>
            {operationsData.inventory ? (
              <div className="prose max-w-none">
                <ReactMarkdown>{operationsData.inventory}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-500 italic">No inventory management information available. Switch to edit mode to add details.</p>
            )}
          </div>

          {/* Key Performance Indicators */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Key Performance Indicators (KPIs)</h3>
            {operationsData.kpis ? (
              <div className="prose max-w-none">
                <ReactMarkdown>{operationsData.kpis}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-500 italic">No KPI information available. Switch to edit mode to add details.</p>
            )}
          </div>

          {/* Technology & Systems */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Technology & Systems</h3>
            {operationsData.technology ? (
              <div className="prose max-w-none">
                <ReactMarkdown>{operationsData.technology}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-500 italic">No technology information available. Switch to edit mode to add details.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Operations; 