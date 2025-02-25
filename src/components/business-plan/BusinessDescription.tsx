import React from 'react';

/**
 * Props for the BusinessDescription component
 */
interface BusinessDescriptionProps {
  businessPlanId: string;
  isEditing?: boolean;
}

/**
 * BusinessDescription component
 * 
 * Displays and allows editing of the business description section of the business plan
 */
export default function BusinessDescription({ 
  businessPlanId, 
  isEditing = false 
}: BusinessDescriptionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Business Description</h2>
      
      <div className="prose max-w-none">
        <p className="text-gray-600 mb-4">
          This section provides a detailed overview of your business, including its history, 
          legal structure, location, and overall mission and vision.
        </p>
        
        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Overview
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Describe your company's history, founding story, and current status..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Structure
              </label>
              <select className="w-full rounded-md border border-gray-300 p-3">
                <option value="">Select legal structure...</option>
                <option value="sole_proprietorship">Sole Proprietorship</option>
                <option value="partnership">Partnership</option>
                <option value="llc">Limited Liability Company (LLC)</option>
                <option value="corporation">Corporation</option>
                <option value="s_corporation">S Corporation</option>
                <option value="nonprofit">Nonprofit</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location & Facilities
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[120px]"
                placeholder="Describe your business location, facilities, and any strategic advantages they provide..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mission Statement
              </label>
              <textarea
                className="w-full rounded-md border border-gray-300 p-3 min-h-[80px]"
                placeholder="Your company's mission statement..."
              />
            </div>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Save Business Description
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-gray-500 italic">
              This section will display your saved business description information.
              Switch to Edit mode to add or update your business description.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 