export type Role = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: Role
  content: string
  id?: string
}

export interface ChatResponse {
  message: ChatMessage
  id?: string
  title?: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  finish_reason: string
  citations?: Array<{
    position: number
    references: Array<{
      pages: number[]
      file: {
        name: string
        id: string
        metadata: Record<string, string>
        created_on: string
        updated_on: string
        status: string
        percent_done: number
        signed_url: string
        error_message: null | string
        size: number
      }
    }>
  }>
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

// Request types
export interface ChatRequest {
  messages: ChatMessage[]
  isFirstMessage?: boolean
}

export interface SaveConversationRequest {
  title: string
  messages: ChatMessage[]
} 