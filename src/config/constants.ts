export const ASSISTANT_CONFIG = {
  NAME: 'business-coach',
  MODEL: 'gpt-4o',
  INSTRUCTIONS: `You are an expert business coach helping entrepreneurs with their business journey. 
  Your goal is to provide practical, actionable advice based on proven business principles.
  Always be encouraging but realistic, and focus on helping the user take concrete next steps.`,
  MAX_CONTEXT_MESSAGES: 20, // Maximum number of messages to keep in context
  MAX_CONTEXT_LENGTH: 4000, // Maximum total tokens in context
}

export const API_ENDPOINTS = {
  CHAT: '/api/chat'
}

export const INITIAL_MESSAGES = {
  WELCOME: 'Hello! I\'m your AI business coach. How can I help you today?'
} 