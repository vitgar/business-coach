'use client'

import React from 'react'
import { BookOpen, ArrowLeft, Star, ListTodo, FileText, CheckCircle } from 'lucide-react'
import ClientLayout from '@/components/ClientLayout'
import Link from 'next/link'

/**
 * How To Guide Help Page
 * 
 * Explains how to use the features of the How To Guide, 
 * including how to save highlights and create action items
 */
export default function HowToGuidePage() {
  return (
    <ClientLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/howto"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to How To Guide
          </Link>
        </div>

        {/* Page content */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center mb-6">
            <BookOpen className="mr-3 text-blue-600" size={32} />
            How To Use the Guide
          </h1>

          <div className="prose prose-lg prose-blue max-w-none">
            <p>
              The How To Guide is your personal business coach that provides step-by-step guidance on various business topics. 
              Here's how to get the most out of it:
            </p>

            <h2 className="flex items-center mt-8 mb-4">
              <CheckCircle className="mr-2 text-green-600" size={24} />
              Asking Questions
            </h2>
            <p>
              Start by asking specific questions about business activities you want to accomplish. For example:
            </p>
            <ul>
              <li>"How do I create a marketing plan for my small business?"</li>
              <li>"What are the steps to register a new business entity?"</li>
              <li>"How can I improve my business's cash flow?"</li>
            </ul>
            <p>
              The more specific your question, the more tailored the response will be.
            </p>

            <h2 className="flex items-center mt-8 mb-4">
              <Star className="mr-2 text-amber-500" size={24} />
              Saving Highlights
            </h2>
            <p>
              When you receive a helpful response, you can save a concise AI-generated summary for future reference:
            </p>
            <ol>
              <li>Click the "Save Highlights Summary" button below the response</li>
              <li>Our AI will automatically extract the key points as bullet points</li>
              <li>The condensed summary will be saved to your Summaries collection</li>
              <li>Access saved highlights anytime from the Summaries page in the navigation menu</li>
            </ol>
            <p>
              The AI-powered summary focuses on the most important information, removing any fluff or redundant content.
              This makes it easier to review later when you need to quickly recall the essential points.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 my-3">
              <p className="text-blue-800 text-sm">
                <strong>Pro Tip:</strong> Summary highlights are perfect for preserving actionable insights and key concepts 
                without needing to review the entire conversation later.
              </p>
            </div>

            <h2 className="flex items-center mt-8 mb-4">
              <ListTodo className="mr-2 text-blue-600" size={24} />
              Creating Action Items
            </h2>
            <p>
              Turn the guidance into actionable tasks:
            </p>
            <ol>
              <li>Click the "Extract Action Items" button below a response</li>
              <li>The system will analyze the content and create a structured list of tasks</li>
              <li>Review the extracted action items</li>
              <li>Click "Save Action Lists" to add them to your Action Items section</li>
            </ol>
            <p>
              This feature helps you convert advice into a practical to-do list that you can track and complete.
            </p>

            <h2 className="flex items-center mt-8 mb-4">
              <FileText className="mr-2 text-purple-600" size={24} />
              Following Up
            </h2>
            <p>
              You can continue the conversation by:
            </p>
            <ul>
              <li>Asking follow-up questions to explore topics in more detail</li>
              <li>Requesting clarification on specific points</li>
              <li>Using the "Return to Main Topic" button if the conversation has branched</li>
            </ul>
            <p>
              The guide maintains context of your conversation, so you can build upon previous questions.
            </p>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Pro Tip</h3>
              <p className="text-blue-800">
                For the best experience, start with a clear main topic, then explore subtopics as needed. 
                Save highlights for reference material and create action items for tasks you'll need to complete.
              </p>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/howto"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors"
              >
                Start Using the How To Guide
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
} 