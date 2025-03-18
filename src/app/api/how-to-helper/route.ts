import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

/**
 * API handler for the How-To Helper 
 * This service processes user messages and provides step-by-step guidance on various business topics
 * It maintains conversation context and can extract action items from responses
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, businessId, conversationContext, messageHistory = [] } = body
    
    // Initialize OpenAI client (using demo API key for development)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'demo-api-key-for-development'
    })
    
    // Use existing conversation context or create a new one
    const currentContext = conversationContext || {
      workingOnChildItems: false,
      completedSteps: 0
    }
    
    // Format conversation history for the API
    const formattedHistory = messageHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }))
    
    // Build the system prompt to guide the model's behavior
    const systemPrompt = `
You are a business coach assistant that helps entrepreneurs and small business owners accomplish specific business tasks step-by-step.
Your name is "How To Helper" and you focus on practical, actionable guidance.

IMPORTANT: Keep your responses focused on the specific topic at hand. Do not branch into too many subtopics.
Provide complete guidance on the current topic before moving to a related topic.

When a user asks about how to accomplish a specific business task:
1. Identify the specific business task or goal
2. Provide a simple, clear overview of the main steps
3. Focus on explaining ONE step at a time in detail
4. Ask clarifying questions when needed
5. Provide practical, actionable advice

RESPONSE FORMAT:
1. Keep responses concise but informative
2. Use bullet points and numbered lists for clarity
3. End your response with a natural follow-up question that continues the current topic
4. Do not offer multiple branching options for the next steps

CONVERSATION CONTEXT:
${currentContext.currentTopicId ? `Current Topic: ${currentContext.currentTopicId}` : 'No specific topic identified yet'}
${currentContext.completedSteps ? `Steps completed: ${currentContext.completedSteps}` : ''}
${currentContext.totalSteps ? `Total steps: ${currentContext.totalSteps}` : ''}
${currentContext.workingOnChildItems ? 'Currently creating action items for this topic' : ''}

EXTRACTION INFORMATION:
If your response contains a clear action item that would be helpful for the user to save, I'll extract it.
An action item should be a specific, actionable task the user needs to accomplish.
`

    // Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 800
    })
    
    // Get the AI response
    const messageContent = response.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.'
    
    // Extract the topic from the message if we don't have one yet
    let newContext = { ...currentContext }
    if (!newContext.currentTopicId) {
      // Simple heuristic to extract a topic from the initial query
      const topicMatch = message.toLowerCase().match(/how (do|to|can) (i|we) (.+?)(\?|$)/)
      if (topicMatch) {
        newContext.currentTopicId = topicMatch[3].trim().replace(/\s+/g, '-')
        
        // Set an initial estimate of total steps based on the complexity of the task
        const complexity = topicMatch[3].split(' ').length
        newContext.totalSteps = Math.max(3, Math.min(7, complexity))
      }
    }
    
    // Update step count - increment completed steps if this is an ongoing conversation
    if (newContext.currentTopicId && messageHistory.length > 1) {
      newContext.completedSteps = (newContext.completedSteps || 0) + 1
    }
    
    // Simple heuristic to detect if the response contains an action item
    const containsActionItem = 
      messageContent.includes('Step ') || 
      messageContent.includes('**') || 
      messageContent.includes('- [ ]') ||
      messageContent.includes('Task:')
    
    // Extract the main action item using a simple heuristic
    let actionItem = null
    if (containsActionItem) {
      actionItem = {
        content: newContext.currentTopicId || 'General task',
        description: messageContent.split('\n').slice(0, 3).join(' ').substring(0, 150) + '...',
        priorityLevel: 'medium',
        progress: 'not started',
        isChildItem: newContext.workingOnChildItems,
        parentId: newContext.currentActionItemId,
        stepNumber: newContext.completedSteps
      }
      
      // If this is the first action item for a topic, mark future items as children
      if (!newContext.workingOnChildItems && !newContext.currentActionItemId) {
        newContext.workingOnChildItems = true
      }
    }
    
    return NextResponse.json({
      messageContent,
      conversationContext: newContext,
      containsActionItem,
      actionItem
    })
    
  } catch (error) {
    console.error('Error in how-to-helper API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
} 