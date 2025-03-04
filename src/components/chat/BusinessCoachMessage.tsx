import React, { useState, useEffect } from 'react';
import { BookmarkPlus, ListTodo, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { API_ENDPOINTS } from '@/config/constants';

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
}

/**
 * Business Coach Message component
 * 
 * Displays a chat message with buttons for saving actionable items and business insights when available
 */
export default function BusinessCoachMessage({ content, role, contentAnalysis }: BusinessCoachMessageProps) {
  const { userId } = useAuth();
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [isSavingInsight, setIsSavingInsight] = useState(false);
  const [actionSaved, setActionSaved] = useState(false);
  const [insightSaved, setInsightSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug log for contentAnalysis
  useEffect(() => {
    if (role === 'assistant') {
      console.log('Message contentAnalysis:', contentAnalysis);
    }
  }, [role, contentAnalysis]);

  // Style based on message role
  const messageClass = role === 'assistant' 
    ? 'bg-blue-50 border-blue-100' 
    : 'bg-gray-50 border-gray-100 ml-auto';

  /**
   * Handle creating actionable items list
   */
  const handleCreateActionItems = async () => {
    if (!userId) {
      setError('You must be logged in to save action items.');
      return;
    }

    setIsSavingAction(true);
    setError(null);

    try {
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

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${messageClass} max-w-[85%]`}>
      {/* Message content with Markdown rendering */}
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown>
          {content}
        </ReactMarkdown>
      </div>

      {/* Action buttons - only show for assistant messages with content analysis */}
      {role === 'assistant' && contentAnalysis && (
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
          {contentAnalysis.hasActionableItems && (
            <div>
              <button 
                onClick={handleCreateActionItems}
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

          {contentAnalysis.hasBusinessInsight && (
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
            <div className="text-sm text-red-600 mt-2">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 