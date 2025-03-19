'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BookOpen, ArrowLeft, Calendar, Trash2, RefreshCw } from 'lucide-react'
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
 * Summary Detail Page
 * 
 * Shows the full content of a single highlight summary
 */
export default function SummaryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const summaryId = params.id as string
  
  const { isAuthenticated } = useAuth()
  const [summary, setSummary] = useState<HighlightSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  /**
   * Fetches the summary details
   */
  const fetchSummary = async () => {
    if (!isAuthenticated || !summaryId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/notes/${summaryId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Summary not found')
          router.push('/summaries')
          return
        }
        throw new Error('Failed to fetch summary')
      }
      
      const data = await response.json()
      setSummary(data)
    } catch (error) {
      console.error('Error fetching summary:', error)
      toast.error('Failed to load summary details')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Deletes the current summary
   */
  const deleteSummary = async () => {
    if (!confirm('Are you sure you want to delete this summary?')) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/notes/${summaryId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete summary')
      }
      
      toast.success('Summary deleted successfully')
      router.push('/summaries')
    } catch (error) {
      console.error('Error deleting summary:', error)
      toast.error('Failed to delete summary')
      setIsDeleting(false)
    }
  }

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  /**
   * Effect to load summary on component mount
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchSummary()
    }
  }, [isAuthenticated, summaryId])

  /**
   * Format the content with markdown support
   */
  const formatContent = (content: string) => {
    if (!content) return null;
    
    // Split the content into lines
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      // Handle headings (# Heading)
      if (line.startsWith('# ')) {
        return (
          <h2 key={index} className="text-xl font-bold text-gray-800 mt-4 mb-2">
            {line.substring(2)}
          </h2>
        );
      }
      
      // Handle subheadings (## Subheading)
      if (line.startsWith('## ')) {
        return (
          <h3 key={index} className="text-lg font-semibold text-gray-800 mt-3 mb-2">
            {line.substring(3)}
          </h3>
        );
      }
      
      // Handle bullet points
      if (line.startsWith('• ') || line.startsWith('* ')) {
        return (
          <div key={index} className="flex items-start mt-1">
            <span className="text-blue-600 mr-2">{line.startsWith('• ') ? '•' : '•'}</span>
            <span>{line.substring(2)}</span>
          </div>
        );
      }
      
      // Handle horizontal rules
      if (line.startsWith('---')) {
        return <hr key={index} className="my-4 border-gray-200" />;
      }
      
      // Handle italic text (wrapped in * or _)
      const italicText = line.replace(
        /(\*|_)([^\*_]+)(\*|_)/g, 
        (match, p1, p2) => `<em>${p2}</em>`
      );
      
      // Handle bold text (wrapped in ** or __)
      const boldAndItalicText = italicText.replace(
        /(\*\*|__)([^\*_]+)(\*\*|__)/g, 
        (match, p1, p2) => `<strong>${p2}</strong>`
      );
      
      // If line is empty, add spacing
      if (!line.trim()) {
        return <div key={index} className="h-4"></div>;
      }
      
      // Regular paragraph
      return (
        <p key={index} className={index > 0 ? 'mt-2' : ''} 
           dangerouslySetInnerHTML={{ __html: boldAndItalicText }}>
        </p>
      );
    });
  }

  /**
   * Get title without prefix
   */
  const getCleanTitle = (title: string) => {
    return title.replace('HowTo: ', '')
  }

  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/summaries"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Summaries
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
          </div>
        ) : summary ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            {/* Header with title and actions */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {getCleanTitle(summary.title)}
                </h1>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(summary.createdAt)}
                </div>
              </div>
              <button
                onClick={deleteSummary}
                className="text-gray-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Summary content */}
            <div className="prose prose-lg prose-blue max-w-none text-gray-700">
              {formatContent(summary.content)}
            </div>

            {/* Footer with link to How To Guide */}
            <div className="mt-8 pt-4 border-t border-gray-100">
              <Link
                href="/howto"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Go to How To Guide
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Summary not found</h3>
            <p className="text-gray-600 mb-6">
              The summary you're looking for doesn't exist or has been deleted.
            </p>
            <Link
              href="/summaries"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Return to Summaries
            </Link>
          </div>
        )}
      </div>
    </ClientLayout>
  )
} 