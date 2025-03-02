// FILE MARKED FOR REMOVAL
// This component is being replaced as part of the business plan page redesign
// See replacementplan.md for details

/*
'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, HelpCircle, Clock } from 'lucide-react'
import { toast } from 'react-toastify'

interface Props {
  businessPlanId: string
  onComplete: (visionText: string) => void
  existingContent?: string
}

interface Message {
  role: 'assistant' | 'user'
  content: string
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'assistant',
    content: "Hi there! I'm your business vision assistant. I'll help you craft a strong vision and goals for your business plan. Let's start with the basics - what type of business are you planning to create? Tell me a bit about your business idea."
  }
]

// VisionQuestionnaire Component - Original implementation commented out
// Chat interface that guides users through creating their business vision and goals
// with AI assistance. Helps users articulate their vision more effectively.
*/

import { FC } from 'react'

// Temporary placeholder component for Vision Questionnaire
const VisionQuestionnaire: FC<any> = () => {
  return (
    <div className="p-4 border border-gray-300 rounded bg-gray-50">
      <h2 className="text-lg font-medium text-gray-800">Vision Questionnaire</h2>
      <p className="text-gray-500">This component is being redesigned.</p>
    </div>
  )
}

export default VisionQuestionnaire 