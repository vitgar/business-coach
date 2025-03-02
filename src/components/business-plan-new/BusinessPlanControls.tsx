'use client'

import { Save, Download, Share2, AlertCircle, Clock, Check } from 'lucide-react'

/**
 * Business Plan Controls Component Props
 */
interface BusinessPlanControlsProps {
  businessPlan: any
  savingStatus: 'idle' | 'saving' | 'saved' | 'error'
  onSave: () => void
}

/**
 * BusinessPlanControls Component
 * 
 * Provides controls for saving, exporting, and sharing the business plan
 * Shows saving status and feedback
 */
export default function BusinessPlanControls({ 
  businessPlan, 
  savingStatus,
  onSave
}: BusinessPlanControlsProps) {
  // Calculate completion percentage
  const calculateCompletionPercentage = (): number => {
    if (!businessPlan?.content) return 0
    
    // Define all required sections
    const requiredSections = [
      'executiveSummary',
      'companyDescription',
      'productsAndServices',
      'marketAnalysis',
      'marketingStrategy',
      'operationsPlan',
      'organizationAndManagement',
      'financialPlan'
    ]
    
    // Count completed sections
    let completedSections = 0
    
    for (const section of requiredSections) {
      if (businessPlan.content[section] && Object.keys(businessPlan.content[section]).length > 0) {
        completedSections++
      }
    }
    
    // Calculate percentage
    return Math.round((completedSections / requiredSections.length) * 100)
  }

  // Handle export to PDF (placeholder)
  const handleExportPDF = () => {
    alert('Export to PDF functionality coming soon')
  }
  
  // Handle export to Word (placeholder)
  const handleExportWord = () => {
    alert('Export to Word functionality coming soon')
  }
  
  // Handle share (placeholder)
  const handleShare = () => {
    alert('Share functionality coming soon')
  }

  // Get status message and icon
  const getStatusInfo = () => {
    switch (savingStatus) {
      case 'saving':
        return { 
          icon: <Clock className="h-5 w-5 animate-pulse" />, 
          text: 'Saving...', 
          color: 'text-blue-600' 
        }
      case 'saved':
        return { 
          icon: <Check className="h-5 w-5" />, 
          text: 'Saved', 
          color: 'text-green-600' 
        }
      case 'error':
        return { 
          icon: <AlertCircle className="h-5 w-5" />, 
          text: 'Error saving', 
          color: 'text-red-600' 
        }
      default:
        return null
    }
  }

  const statusInfo = getStatusInfo()
  const completionPercentage = calculateCompletionPercentage()

  return (
    <div className="border-t border-gray-200 p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-center">
      {/* Progress indicator */}
      <div className="mb-4 sm:mb-0 w-full sm:w-auto">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">Completion:</span>
          <div className="w-40 bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <span className="ml-2 text-sm text-gray-600">{completionPercentage}%</span>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Save status message */}
        {statusInfo && (
          <div className={`flex items-center ${statusInfo.color} text-sm mr-4`}>
            {statusInfo.icon}
            <span className="ml-1">{statusInfo.text}</span>
          </div>
        )}
        
        {/* Save button */}
        <button
          type="button"
          onClick={onSave}
          disabled={savingStatus === 'saving'}
          className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium shadow-sm
            ${savingStatus === 'saving' 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          <Save className="h-4 w-4 mr-1" />
          Save
        </button>
        
        {/* Export buttons */}
        <button
          type="button"
          onClick={handleExportPDF}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
        >
          <Download className="h-4 w-4 mr-1" />
          PDF
        </button>
        
        <button
          type="button"
          onClick={handleExportWord}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
        >
          <Download className="h-4 w-4 mr-1" />
          Word
        </button>
        
        {/* Share button */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
        >
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </button>
      </div>
    </div>
  )
} 