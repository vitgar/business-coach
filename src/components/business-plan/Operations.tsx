import React from 'react';

/**
 * Props for the Operations component
 */
interface OperationsProps {
  businessPlanId: string;
  isEditing?: boolean;
}

/**
 * Operations component
 * 
 * Displays and allows editing of the operations and control systems section of the business plan
 */
export default function Operations({ 
  businessPlanId, 
  isEditing = false 
}: OperationsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Operating & Control Systems</h2>
      
      <div className="prose max-w-none">
        <p className="text-gray-600 mb-4">
          This section details how your business operates on a day-to-day basis, including 
          production processes, quality control, inventory management, and key operational metrics.
        </p>
        
        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Production Process
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Describe your production or service delivery process in detail..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality Control
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Outline your quality control procedures and standards..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inventory Management
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Describe your inventory management approach and systems..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Performance Indicators
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="List the key metrics you'll track to measure operational performance..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technology & Systems
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Describe the technology and systems you'll use to manage operations..."
              />
            </div>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Save Operations Information
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-gray-500 italic">
              This section will display your saved operations and control systems information.
              Switch to Edit mode to add or update your operations details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 