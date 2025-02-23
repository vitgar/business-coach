import { Pinecone } from '@pinecone-database/pinecone'
import type { ChatMessage } from '@/types/chat'

// Initialize Pinecone client
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
})

// Singleton assistant instance
let assistant: any = null

export class PineconeService {
  private static instance: PineconeService
  private assistant: any = null

  private constructor() {}

  public static getInstance(): PineconeService {
    if (!PineconeService.instance) {
      PineconeService.instance = new PineconeService()
    }
    return PineconeService.instance
  }

  private async getOrCreateAssistant() {
    if (!this.assistant) {
      try {
        this.assistant = pc.assistant("business-coach")
      } catch (error) {
        console.error('Error getting assistant:', error)
        throw error
      }
    }
    return this.assistant
  }

  public async sendMessage(messages: ChatMessage[]) {
    const businessCoach = await this.getOrCreateAssistant()

    const response = await businessCoach.chat({
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })

    return {
      id: response.id || Date.now().toString(),
      model: response.model || 'gpt-4o',
      message: {
        content: response.message.content,
        role: 'assistant'
      },
      finish_reason: response.finish_reason || 'stop'
    }
  }
} 