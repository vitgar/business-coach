'use client'

import { Save, Download, Share2, AlertCircle, Clock, Check, Printer } from 'lucide-react'

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

  // Handle print business plan
  /**
   * Handles printing the business plan with only populated fields
   * Creates a new window with formatted content and triggers print dialog
   */
  const handlePrintBusinessPlan = () => {
    if (!businessPlan?.content) {
      console.error('No business plan data available to print');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print your business plan');
      return;
    }

    // Helper function to check if a section has any values
    const sectionHasValues = (section: any) => {
      if (!section) return false;
      return Object.values(section).some(value => 
        value && typeof value === 'string' && value.trim() !== ''
      );
    };

    // Build the HTML content for printing
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${businessPlan.title || 'Business Plan'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { font-size: 24px; color: #2563eb; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
          h2 { font-size: 18px; color: #4b5563; margin-top: 25px; }
          p { margin-bottom: 16px; }
          .section { margin-bottom: 30px; }
          @media print {
            body { padding: 0; }
            h1 { break-after: avoid; }
            h2 { break-after: avoid; }
            .section { break-inside: avoid-page; }
          }
        </style>
      </head>
      <body>
        <h1 style="font-size: 28px; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 30px;">
          ${businessPlan.content.coverPage?.businessName || businessPlan.title || 'Business Plan'}
        </h1>
    `;

    // Define all sections in display order
    const sections = [
      { id: 'executiveSummary', title: 'Executive Summary' },
      { id: 'companyDescription', title: 'Company Description' },
      { id: 'productsAndServices', title: 'Products & Services' },
      { id: 'marketAnalysis', title: 'Market Analysis' },
      { id: 'marketingStrategy', title: 'Marketing Strategy' },
      { id: 'operationsPlan', title: 'Operations Plan' },
      { id: 'organizationAndManagement', title: 'Organization & Management' },
      { id: 'financialPlan', title: 'Financial Plan' }
    ];

    // Add each section that has content
    sections.forEach(section => {
      const sectionData = businessPlan.content[section.id];
      
      if (sectionHasValues(sectionData)) {
        htmlContent += `<div class="section"><h1>${section.title}</h1>`;
        
        // Add each field that has content
        Object.entries(sectionData).forEach(([fieldId, value]) => {
          if (value && typeof value === 'string' && value.trim() !== '') {
            // Convert field ID to a readable title
            const fieldTitle = fieldId
              .replace(/([A-Z])/g, ' $1') // Add space before capital letters
              .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
            
            htmlContent += `<h2>${fieldTitle}</h2><p>${value.replace(/\n/g, '<br>')}</p>`;
          }
        });
        
        htmlContent += `</div>`;
      }
    });

    // Close the HTML document
    htmlContent += `
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    // Write to the new window and trigger print
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

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
      <div className="flex items-center space-x-2">
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
        
        {/* Print button */}
        <button
          type="button"
          onClick={handlePrintBusinessPlan}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
        >
          <Printer className="h-4 w-4 mr-1" />
          Print
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