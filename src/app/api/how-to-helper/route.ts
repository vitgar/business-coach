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
      completedSteps: 0,
      mainTopic: null,
      currentSubtopic: null,
      subtopicDepth: 0,
      stepInCurrentTopic: 0
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

IMPORTANT INSTRUCTIONS:
1. Structure your responses in a clear, sequential step-by-step format
2. Number each step explicitly (Step 1:, Step 2:, etc.)
3. Focus on ONE step at a time in detail before moving to the next
4. Keep your responses focused on the specific topic at hand
5. Don't overwhelm the user with too much information at once

SUBTOPIC HANDLING:
- If the user asks about a subtopic related to the main topic, track this as a subtopic
- When in a subtopic (depth > 0), occasionally ask if the user wants to return to the main topic
- Example: "Would you like to continue exploring [subtopic] or shall we return to discussing [main topic]?"
- Only offer this option after providing complete information on the current subtopic step

RESPONSE FORMAT:
1. Start with a clear heading or introduction of what you're explaining
2. Use numbered steps (Step 1:, Step 2:, etc.) for procedural guidance
3. Use bullet points for lists of options or considerations
4. End each response with a question about the NEXT logical step
5. Maintain a conversational, helpful tone throughout

CONVERSATION CONTEXT:
${currentContext.mainTopic ? `Main Topic: ${currentContext.mainTopic}` : 'No main topic identified yet'}
${currentContext.currentSubtopic ? `Current Subtopic: ${currentContext.currentSubtopic}` : ''}
${currentContext.subtopicDepth ? `Subtopic Depth: ${currentContext.subtopicDepth}` : 'Subtopic Depth: 0'}
${currentContext.completedSteps ? `Steps completed: ${currentContext.completedSteps}` : ''}
${currentContext.stepInCurrentTopic ? `Current step in topic: ${currentContext.stepInCurrentTopic}` : ''}
${currentContext.totalSteps ? `Total steps: ${currentContext.totalSteps}` : ''}
${currentContext.workingOnChildItems ? 'Currently creating action items for this topic' : ''}

EXTRACTION INFORMATION:
If your response contains a clear action item that would be helpful for the user to save, I'll extract it.
An action item should be a specific, actionable task the user needs to accomplish.
`

    // Make the API call to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // Using GPT-4o for better step-by-step guidance
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
    
    // Initial topic identification
    if (!newContext.mainTopic) {
      // Simple heuristic to extract a topic from the initial query
      const topicMatch = message.toLowerCase().match(/how (do|to|can) (i|we) (.+?)(\?|$)/)
      if (topicMatch) {
        const topic = topicMatch[3].trim()
        newContext.mainTopic = topic
        newContext.currentTopicId = topic.replace(/\s+/g, '-')
        
        // Set an initial estimate of total steps based on the complexity of the task
        const complexity = topic.split(' ').length
        newContext.totalSteps = Math.max(3, Math.min(7, complexity))
        newContext.stepInCurrentTopic = 1
        newContext.subtopicDepth = 0
      }
    } else {
      // Analyze if the user is asking about a subtopic
      const isAskingSubtopic = message.toLowerCase().includes('what about') ||
                              message.toLowerCase().includes('how about') ||
                              message.toLowerCase().includes('tell me more about') ||
                              message.toLowerCase().includes('explain');
                              
      const isReturningToMain = message.toLowerCase().includes('back to') ||
                               message.toLowerCase().includes('return to main') ||
                               message.toLowerCase().includes('main topic');
                               
      if (isAskingSubtopic && !isReturningToMain) {
        // Extract potential subtopic from the message
        const subtopicMatch = message.match(/(what|how) about (.+?)(\?|$)/) || 
                             message.match(/tell me more about (.+?)(\?|$)/) ||
                             message.match(/explain (.+?)(\?|$)/);
                             
        if (subtopicMatch) {
          const subtopic = subtopicMatch[subtopicMatch.length - 2].trim();
          newContext.currentSubtopic = subtopic;
          newContext.subtopicDepth = newContext.subtopicDepth + 1;
          newContext.stepInCurrentTopic = 1; // Reset steps for new subtopic
        }
      } else if (isReturningToMain) {
        // User wants to return to main topic
        newContext.currentSubtopic = null;
        newContext.subtopicDepth = 0;
        
        // Don't reset step in current topic if they're returning to main
        // Just increment it as we're providing the next piece of information
        newContext.stepInCurrentTopic += 1;
      } else {
        // Regular follow-up question - increment the step
        newContext.stepInCurrentTopic += 1;
      }
    }
    
    // Update the overall step count
    if (newContext.mainTopic && messageHistory.length > 1) {
      newContext.completedSteps = (newContext.completedSteps || 0) + 1
    }
    
    // Determine if the response should offer to return to the main topic
    const shouldOfferReturnToMain = 
      newContext.subtopicDepth > 0 && 
      newContext.stepInCurrentTopic >= 2 &&  // At least provided some info on subtopic
      Math.random() < 0.4;  // 40% chance to offer return to main, so it's not on every message
    
    // Append return to main topic question if appropriate
    let finalMessageContent = messageContent;
    if (shouldOfferReturnToMain && newContext.mainTopic && newContext.currentSubtopic) {
      finalMessageContent += `\n\nWould you like to continue exploring more about "${newContext.currentSubtopic}" or shall we return to our main discussion about "${newContext.mainTopic}"?`;
    }
    
    // Simple heuristic to detect if the response contains an action item
    const containsActionItem = 
      finalMessageContent.includes('Step ') || 
      finalMessageContent.includes('**') || 
      finalMessageContent.includes('- [ ]') ||
      finalMessageContent.includes('Task:')
    
    // Extract the main action item using a simple heuristic
    let actionItem = null
    if (containsActionItem) {
      actionItem = {
        content: newContext.currentTopicId || 'General task',
        description: finalMessageContent.split('\n').slice(0, 3).join(' ').substring(0, 150) + '...',
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
      messageContent: finalMessageContent,
      conversationContext: newContext,
      containsActionItem,
      actionItem,
      title: newContext.mainTopic ? `How to ${newContext.mainTopic}` : null
    })
    
  } catch (error) {
    console.error('Error in how-to-helper API:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
} 