'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { BookOpen, Calendar, RefreshCw, Trash2, ExternalLink } from 'lucide-react'
import ClientLayout from '@/components/ClientLayout'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-toastify'
import Link from 'next/link'

/**
 * Interface for a highlight summary
 */
interface HighlightSummary {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Summaries Page
 * 
 * Shows all highlights/summaries saved from the How To Guide
 * These highlights are saved by users when they find useful information
 */
export default function SummariesPage() {
  const { isAuthenticated } = useAuth()
  const [summaries, setSummaries] = useState<HighlightSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  /**
   * Fetches all summaries for the current user
   */
  const fetchSummaries = async () => {
    if (!isAuthenticated) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/notes?type=highlights`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch summaries')
      }
      
      const data = await response.json()
      setSummaries(data)
    } catch (error) {
      console.error('Error fetching summaries:', error)
      toast.error('Failed to load summaries')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Deletes a specific summary
   */
  const deleteSummary = async (id: string) => {
    if (!confirm('Are you sure you want to delete this summary?')) return
    
    setIsDeleting(id)
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete summary')
      }
      
      // Update state to remove the deleted summary
      setSummaries(summaries.filter(summary => summary.id !== id))
      toast.success('Summary deleted successfully')
    } catch (error) {
      console.error('Error deleting summary:', error)
      toast.error('Failed to delete summary')
    } finally {
      setIsDeleting(null)
    }
  }

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  /**
   * Effect to load summaries on component mount
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchSummaries()
    }
  }, [isAuthenticated])

  /**
   * Filtered summaries based on current filter
   */
  const filteredSummaries = useMemo(() => {
    if (filter === 'all') return summaries
    return summaries.filter(summary => 
      summary.title.toLowerCase().includes(filter.toLowerCase()) ||
      summary.content.toLowerCase().includes(filter.toLowerCase())
    )
  }, [summaries, filter])

  /**
   * Format content for preview with light markdown support
   */
  const formatContentPreview = (content: string, maxLength: number = 200) => {
    if (!content) return '';
    
    // Remove the header and footer if present
    let cleanContent = content
      .replace(/^# Key Points Summary\n\n/, '')
      .replace(/\n\n---\n\n\*This is an AI-generated summary.*$/g, '');
    
    // Determine if we need to truncate
    const needsTruncation = cleanContent.length > maxLength;
    
    // If no need to truncate, return the formatted content
    if (!needsTruncation) {
      return (
        <div className="summary-preview">
          {formatBulletPoints(cleanContent)}
        </div>
      );
    }
    
    // For truncation, prioritize keeping whole bullet points
    const lines = cleanContent.split('\n');
    let truncatedContent = '';
    let currentLength = 0;
    
    for (const line of lines) {
      if (currentLength + line.length <= maxLength) {
        truncatedContent += line + '\n';
        currentLength += line.length + 1;
      } else {
        // If we're in the middle of a bullet point, try to include a partial bullet
        if (line.startsWith('• ') || line.startsWith('* ')) {
          const remainingLength = maxLength - currentLength;
          if (remainingLength > 10) { // Only add partial bullet if enough space
            truncatedContent += line.substring(0, remainingLength - 3) + '...\n';
          }
        }
        break;
      }
    }
    
    return (
      <div className="summary-preview">
        {formatBulletPoints(truncatedContent)}
        {needsTruncation && (
          <p className="text-sm text-blue-600 mt-1">Read more...</p>
        )}
      </div>
    );
  }
  
  /**
   * Helper function to format bullet points for display
   */
  const formatBulletPoints = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('• ') || line.startsWith('* ')) {
        return (
          <div key={index} className="flex items-start mt-1">
            <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
            <span>{line.substring(2)}</span>
          </div>
        );
      }
      
      // Handle header if present (typically won't be in preview)
      if (line.startsWith('# ')) {
        return (
          <h4 key={index} className="font-semibold text-gray-800 mb-1">
            {line.substring(2)}
          </h4>
        );
      }
      
      // Regular text
      return line ? <p key={index} className="mt-1">{line}</p> : null;
    });
  }

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <BookOpen className="mr-3 text-blue-600" size={32} />
                Your Highlight Summaries
              </h1>
              <p className="text-gray-600 mt-2">
                View and manage the key insights you've saved from the How To Guide.
              </p>
            </div>
            <div className="flex items-center">
              <button
                onClick={fetchSummaries}
                className="flex items-center justify-center text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-md"
                disabled={isLoading}
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
              <Link
                href="/howto"
                className="ml-3 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Go to How To Guide
              </Link>
            </div>
          </div>
        </header>

        {/* Search & filter */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search your summaries..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {/* Summaries list */}
        {isAuthenticated ? (
          <>
            {isLoading ? (
              <div className="flex justify-center items-center h-60">
                <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
            ) : (
              <>
                {filteredSummaries.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSummaries.map((summary) => (
                      <div 
                        key={summary.id} 
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <Link
                            href={`/summaries/${summary.id}`}
                            className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                          >
                            {summary.title.replace('HowTo: ', '')}
                          </Link>
                          <div className="flex items-center">
                            <button
                              onClick={() => deleteSummary(summary.id)}
                              className="text-gray-500 hover:text-red-600 transition-colors"
                              disabled={isDeleting === summary.id}
                            >
                              {isDeleting === summary.id ? (
                                <RefreshCw className="h-5 w-5 animate-spin" />
                              ) : (
                                <Trash2 className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="prose prose-sm text-gray-700">
                            {formatContentPreview(summary.content)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(summary.createdAt)}
                          </div>
                          <Link
                            href={`/summaries/${summary.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Read more
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No summaries found</h3>
                    <p className="text-gray-600 mb-6">
                      {filter !== 'all' 
                        ? "No summaries match your search criteria." 
                        : "You haven't saved any highlights yet. Visit the How To Guide to save some insights!"}
                    </p>
                    <Link
                      href="/howto"
                      className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Go to How To Guide
                    </Link>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Sign in to view your summaries</h3>
            <p className="text-gray-600 mb-6">
              Please sign in or create an account to view and manage your highlight summaries.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </ClientLayout>
  )
} 