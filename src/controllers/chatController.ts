import type { ChatMessage } from '@/types/chat'
import { PineconeService } from '@/services/pinecone'

export class ChatController {
  private pineconeService: PineconeService

  constructor() {
    this.pineconeService = PineconeService.getInstance()
  }

  async handleChatMessage(messages: ChatMessage[]) {
    try {
      const response = await this.pineconeService.sendMessage(messages)
      return response
    } catch (error) {
      console.error('Controller error:', error)
      throw error
    }
  }
} 