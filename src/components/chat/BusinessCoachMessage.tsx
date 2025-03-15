import React, { useState, useEffect } from 'react';
import { BookmarkPlus, ListTodo, ArrowRight, Check, Loader2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { API_ENDPOINTS } from '@/config/constants';
import PreviewActionItemsModal from '@/components/action-items/PreviewActionItemsModal';

// Add interface for action item objects
interface ActionItem {
  content: string;
  ordinal: number;
}

// Add interface for action items data
interface ActionItemsData {
  hasActionItems: boolean;
  items: string[];
  count: number;
  saved: boolean;
  savedCount: number;
  simulatedOnly?: boolean;
  disabled?: boolean;  // Added to indicate if automatic extraction is disabled
}

interface ContentAnalysis {
  hasActionableItems: boolean;
  hasBusinessInsight: boolean;
  actionItemsSummary?: string;
  insightSummary?: string;
}

interface BusinessCoachMessageProps {
  content: string;
  role: 'user' | 'assistant';
  contentAnalysis?: ContentAnalysis | null;
  actionItemsData?: ActionItemsData; // Add actionItemsData prop
  messageId?: string; // Add messageId for saving action items
  conversationId?: string; // Add conversationId for saving action items
}

/**
 * Business Coach Message component
 * 
 * Displays a chat message with buttons for saving actionable items and business insights when available
 * Now also supports automatically detected and saved action items with preview functionality
 */
export default function BusinessCoachMessage({ 
  content, 
  role, 
  contentAnalysis, 
  actionItemsData,
  messageId = `msg_${Date.now()}`, // Default value if not provided
  conversationId
}: BusinessCoachMessageProps) {
  const { userId } = useAuth();
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [isSavingInsight, setIsSavingInsight] = useState(false);
  const [actionSaved, setActionSaved] = useState(false);
  const [insightSaved, setInsightSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [manualDetection, setManualDetection] = useState(false);

  // Debug log for contentAnalysis
  useEffect(() => {
    if (role === 'assistant') {
      console.log('Message contentAnalysis:', contentAnalysis);
    }
  }, [role, contentAnalysis]);

  // Debug log for action items data
  useEffect(() => {
    if (role === 'assistant' && actionItemsData) {
      console.log('Message actionItemsData:', actionItemsData);
    }
  }, [role, actionItemsData]);

  // Style based on message role
  const messageClass = role === 'assistant' 
    ? 'bg-blue-50 border-blue-100' 
    : 'bg-gray-50 border-gray-100 ml-auto';

  /**
   * Handle showing preview modal for action items
   */
  const handlePreviewActionItems = () => {
    // We'll use either the auto-detected items or attempt to extract them manually
    if (!actionItemsData?.items?.length && !manualDetection) {
      // Manually attempt to extract action items
      setManualDetection(true);
      
      // This will trigger a re-render with manualDetection set to true
      // which will then attempt to extract items from the content
      return;
    }
    
    setShowPreviewModal(true);
  };

  /**
   * Handle creating actionable items list directly (without preview)
   */
  const handleCreateActionItems = async () => {
    if (!userId) {
      setError('You must be logged in to save action items.');
      return;
    }

    setIsSavingAction(true);
    setError(null);

    try {
      // If we have actionItemsData, use those items directly
      if (actionItemsData && actionItemsData.items && actionItemsData.items.length > 0) {
        // Create action items directly from the extracted items
        // Ensure the ordinal is explicitly set based on array position
        const response = await fetch('/api/action-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            actionItemsData.items.map((content, index) => ({
              content,
              ordinal: index // Explicitly set ordinal to match array index
            }))
          ),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create action items');
        }

        // Mark as saved and show success message
        setActionSaved(true);
        setTimeout(() => setActionSaved(false), 3000); // Reset after 3 seconds
        return;
      }

      // Fall back to the previous implementation using the API_ENDPOINTS.EXTRACT_ACTIONABLE
      const response = await fetch(API_ENDPOINTS.EXTRACT_ACTIONABLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          title: contentAnalysis?.actionItemsSummary || 'Action Items',
          userId
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create action items');
      }

      setActionSaved(true);
      setTimeout(() => setActionSaved(false), 3000); // Reset after 3 seconds
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create action items');
    } finally {
      setIsSavingAction(false);
    }
  };

  /**
   * Handle saving action items from the preview modal
   */
  const handleSaveFromPreview = async (items: ActionItem[]) => {
    if (!userId) {
      throw new Error('You must be logged in to save action items.');
    }

    // Make sure the items have ordinal values that match their position in the array
    const itemsWithOrdinals = items.map((item, index) => ({
      ...item,
      ordinal: index // Ensure ordinal matches the item's position in the array
    }));

    // Save the items to the database
    const response = await fetch('/api/action-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemsWithOrdinals),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create action items');
    }

    return response.json();
  };

  /**
   * Handle success after saving from preview
   */
  const handlePreviewSaveSuccess = () => {
    setShowPreviewModal(false);
    setActionSaved(true);
    setTimeout(() => setActionSaved(false), 3000);
  };

  /**
   * Handle saving business insight
   */
  const handleSaveInsight = async () => {
    if (!userId) {
      setError('You must be logged in to save insights.');
      return;
    }

    setIsSavingInsight(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.SAVE_INSIGHT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          title: contentAnalysis?.insightSummary || 'Business Insight',
          userId
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save insight');
      }

      setInsightSaved(true);
      setTimeout(() => setInsightSaved(false), 3000); // Reset after 3 seconds
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save insight');
    } finally {
      setIsSavingInsight(false);
    }
  };

  /**
   * Manual extraction of action items for cases where automatic detection fails
   * This provides a fallback method to identify potential action items
   */
  const manuallyExtractActionItems = (): string[] => {
    // No need to extract if we're not dealing with an assistant message
    if (role !== 'assistant') return [];
    
    const items: string[] = [];
    
    // Split the content into lines
    const lines = content.split('\n');
    
    // Process line by line while preserving order
    lines.forEach((line, index) => {
      // Check for numbered or bulleted items
      const numberedMatch = line.match(/^\s*(\d+)[\.\)]\s+(.+)$/);
      const bulletedMatch = line.match(/^\s*[\-\•\*]\s+(.+)$/);
      
      // Section headers or major points (often end with a colon)
      const sectionMatch = line.trim().match(/^([A-Z][^:]+):$/);
      
      // Common action verbs at the start of a sentence
      const actionVerbMatch = line.trim().match(/^(Create|Develop|Complete|Research|File|Obtain|Set up|Choose|Register|Apply for|Draft|Open|Plan|Consider|Implement|Select|Ensure|Conduct)([^:]+)/i);
      
      if (numberedMatch) {
        items.push(numberedMatch[2].trim());
      } else if (bulletedMatch) {
        items.push(bulletedMatch[1].trim());
      } else if (sectionMatch && index < lines.length - 1) {
        // If it's a section header, look at the next line for potential content
        const nextLine = lines[index + 1].trim();
        if (nextLine && !nextLine.match(/^\s*(\d+)[\.\)]\s+/) && !nextLine.match(/^\s*[\-\•\*]\s+/)) {
          items.push(`${sectionMatch[1]}: ${nextLine}`);
        } else {
          items.push(sectionMatch[1]);
        }
      } else if (actionVerbMatch) {
        items.push(actionVerbMatch[0].trim());
      }
    });
    
    // Remove duplicates and empty items while preserving original order
    const uniqueItems: string[] = [];
    items.forEach(item => {
      if (item.trim().length > 0 && !uniqueItems.includes(item)) {
        uniqueItems.push(item);
      }
    });
    
    return uniqueItems;
  };

  // Determine which items to display
  const displayItems = (actionItemsData?.items?.length ? 
    actionItemsData.items : 
    (manualDetection ? manuallyExtractActionItems() : [])
  );

  // Determine if we have potential action items to show
  const hasDisplayItems = displayItems.length > 0;

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${messageClass} max-w-[85%]`}>
      {/* Message content with Markdown rendering */}
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </div>

      {/* Action buttons - only show for assistant messages with content analysis */}
      {role === 'assistant' && (
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
          {/* Display action items notification when detected */}
          {(actionItemsData?.hasActionItems || hasDisplayItems) && (
            <div className={`mb-3 p-3 rounded-lg ${actionItemsData?.saved || actionSaved 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-blue-50 border border-blue-200 animate-pulse'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`text-sm font-medium flex items-center gap-1.5 
                  ${actionItemsData?.saved || actionSaved 
                    ? 'text-green-700' 
                    : 'text-blue-700'
                  }`}
                >
                  <ListTodo size={18} />
                  {actionItemsData?.saved || actionSaved ? (
                    <span>Action items saved successfully!</span>
                  ) : (
                    <span>Action items {actionItemsData?.hasActionItems ? 'detected' : 'identified'} in this message</span>
                  )}
                </div>
                {actionSaved && (
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    <Check size={12} className="inline mr-1" /> Saved
                  </div>
                )}
              </div>
              
              {/* Always show detected action items in a list */}
              <div className="mt-3 pl-4 border-l-2 border-blue-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {displayItems.length} Action Item{displayItems.length !== 1 ? 's' : ''}:
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  {displayItems.slice(0, 5).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                  {displayItems.length > 5 && (
                    <li className="italic text-gray-500">
                      And {displayItems.length - 5} more items...
                    </li>
                  )}
                </ul>
              </div>
              
              {/* Action buttons for items */}
              <div className="mt-3 flex flex-wrap gap-3">
                {/* Preview button */}
                {!actionItemsData?.saved && !actionSaved && (
                  <button
                    onClick={handlePreviewActionItems}
                    disabled={isSavingAction || !userId}
                    className="text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    <Eye size={16} />
                    Preview & Edit
                  </button>
                )}

                {/* Link to view all action items */}
                <a 
                  href="/action-items" 
                  className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100"
                >
                  <ListTodo size={16} />
                  View All Action Items
                  <ArrowRight size={14} />
                </a>

                {/* Save button - only show if not already saved */}
                {!actionItemsData?.saved && !actionSaved && (
                  <button
                    onClick={handleCreateActionItems}
                    disabled={isSavingAction || !userId}
                    className="text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                  >
                    {isSavingAction ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Save Action Items
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {/* Success message when saved */}
              {actionSaved && (
                <div className="mt-2 text-sm text-green-600 flex items-center gap-1.5">
                  <Check size={16} /> 
                  Action items saved successfully!
                </div>
              )}
            </div>
          )}

          {/* Show existing action button if no auto-detection or manual detection found items */}
          {(contentAnalysis?.hasActionableItems || actionItemsData?.disabled) && !actionItemsData?.hasActionItems && !hasDisplayItems && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 mb-2">
                <ListTodo size={16} className="inline mr-1 mb-1" />
                {actionItemsData?.disabled 
                  ? "You can create action items from this message."
                  : "This message contains actionable steps you can save."}
              </p>
              <button 
                onClick={handlePreviewActionItems}
                disabled={isSavingAction || actionSaved}
                className={`text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md 
                  ${actionSaved 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
              >
                {actionSaved ? (
                  <>Action items saved</>
                ) : (
                  <>
                    <ListTodo size={16} />
                    {isSavingAction ? 'Creating...' : 'Create action items'}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Add a manual save button if nothing else is shown but it's an assistant message */}
          {role === 'assistant' && !contentAnalysis?.hasActionableItems && !actionItemsData?.hasActionItems && !actionItemsData?.disabled && !hasDisplayItems && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <ListTodo size={16} className="inline mr-1 mb-1" />
                Do you want to create action items from this message?
              </p>
              <button 
                onClick={handlePreviewActionItems}
                disabled={isSavingAction || actionSaved}
                className={`text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md 
                  ${actionSaved 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {actionSaved ? (
                  <>Action items saved</>
                ) : (
                  <>
                    <ListTodo size={16} />
                    {isSavingAction ? 'Creating...' : 'Create action items'}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Business insight button remains unchanged */}
          {contentAnalysis?.hasBusinessInsight && (
            <div>
              <button 
                onClick={handleSaveInsight}
                disabled={isSavingInsight || insightSaved}
                className={`text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md 
                  ${insightSaved 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
              >
                {insightSaved ? (
                  <>Insight saved</>
                ) : (
                  <>
                    <BookmarkPlus size={16} />
                    {isSavingInsight ? 'Saving...' : 'Save as business note'}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-100">
              {error}
            </div>
          )}
        </div>
      )}
      
      {/* Preview modal */}
      {showPreviewModal && (
        <PreviewActionItemsModal
          items={displayItems}
          messageId={messageId}
          conversationId={conversationId || ''}
          onClose={() => setShowPreviewModal(false)}
          onSave={handleSaveFromPreview}
          onSuccess={handlePreviewSaveSuccess}
        />
      )}
    </div>
  );
} 