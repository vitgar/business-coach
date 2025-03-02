import { NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import type { ChatMessage } from '@/types/chat'
import { ASSISTANT_CONFIG } from '@/config/constants'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
})

// Create a singleton assistant instance
let assistant: any = null

async function getOrCreateAssistant() {
  if (!assistant) {
    try {
      // Create the assistant with instructions in the first message
      assistant = pc.assistant("business-coach")
      await assistant.chat({
        messages: [{
          role: 'user',
          content: ASSISTANT_CONFIG.INSTRUCTIONS
        }]
      })
    } catch (error) {
      console.error('Error getting assistant:', error)
      throw error
    }
  }
  return assistant
}

async function generateTitle(message: string) {
  try {
    const titleAssistant = await pc.assistant("title-generator")
    const response = await titleAssistant.chat({
      messages: [{
        role: 'user',
        content: `Generate a concise, descriptive title (max 40 chars) that captures the main topic from this message: "${message}". Make it clear and specific, avoiding generic phrases.`
      }]
    })

    // Ensure we have a valid response
    if (response?.message?.content) {
      return response.message.content.trim()
    }
    
    // Fallback: Create a title from the first few words of the message
    const words = message.split(' ').slice(0, 5).join(' ').trim()
    return words.length > 40 ? `${words.slice(0, 37)}...` : words
  } catch (error) {
    console.error('Error generating title:', error)
    // Create a title from the first few words of the message as fallback
    const words = message.split(' ').slice(0, 5).join(' ').trim()
    return words.length > 40 ? `${words.slice(0, 37)}...` : words
  }
}

export async function POST(request: Request) {
  try {
    const { messages, isFirstMessage } = await request.json() as { 
      messages: ChatMessage[]
      isFirstMessage?: boolean 
    }
    
    // Filter out system messages and only send user/assistant messages to the API
    const chatMessages = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))

    const businessCoach = await getOrCreateAssistant()
    const response = await businessCoach.chat({
      messages: chatMessages
    })

    // If this is the first message, generate a title
    let title: string | undefined
    if (isFirstMessage) {
      title = await generateTitle(messages[messages.length - 1].content)
    }

    return NextResponse.json({
      id: response.id || Date.now().toString(),
      model: response.model || 'gpt-4',
      message: {
        content: response.message.content,
        role: 'assistant'
      },
      finish_reason: response.finish_reason || 'stop',
      title
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 