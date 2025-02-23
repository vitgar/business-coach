'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import ExecutiveSummarySection from '@/components/business-plan/ExecutiveSummary'
import type { BusinessPlanSection } from '@/types/business-plan'

interface Props {
  params: {
    id: string
  }
}

export default function BusinessPlanPage({ params }: Props) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(true)

  const handleSaveSection = async (sectionId: BusinessPlanSection, content: string) => {
    try {
      const response = await fetch(`/api/business-plans/${params.id}/executive-summary`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [sectionId]: content
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save section')
      }

      toast.success('Section saved successfully')
    } catch (error) {
      console.error('Error saving section:', error)
      toast.error('Failed to save section')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Business Plan</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {isEditing ? 'Preview' : 'Edit'}
          </button>
        </div>

        <div className="space-y-8">
          <ExecutiveSummarySection
            onSave={handleSaveSection}
            isEditing={isEditing}
            businessPlanId={params.id}
          />
        </div>
      </div>
    </div>
  )
} 