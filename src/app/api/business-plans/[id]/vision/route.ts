import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// Import API initialization to ensure development data is seeded
import '@/app/api/_init'

// Helper function to generate AI response for "I'm not sure" cases
async function generateHelp(question: string, conversationHistory: string[] = []) {
  // Define our categories for questions.
  type QuestionCategory = 'vision' | 'metrics' | 'marketing' | 'financials' | 'operations' | 'general';

  // Determine the category based on keywords.
  function getCategory(question: string): QuestionCategory {
    const categories: Record<QuestionCategory, string[]> = {
      vision: ["vision", "goal", "long-term", "mission"],
      metrics: ["profit", "performance", "revenue", "customers"],
      marketing: ["target market", "competition", "customers", "pricing"],
      financials: ["cost", "expenses", "funding", "budget"],
      operations: ["workflow", "suppliers", "employees", "quality control"],
      general: []
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => question.toLowerCase().includes(keyword))) {
        return category as QuestionCategory;
      }
    }
    return "general";
  }

  // Check if the user's input shows uncertainty.
  function isUserUncertain(question: string): boolean {
    const uncertaintyKeywords = ["i don't know", "not sure", "maybe", "uncertain"];
    return uncertaintyKeywords.some(keyword => question.toLowerCase().includes(keyword));
  }

  // Standard starter questions for each category.
  const starters: Record<QuestionCategory, string[]> = {
    vision: [
      "What kind of work excites you?",
      "What problem do you feel passionate about solving?",
      "Who are the people you'd love to help with your business?"
    ],
    metrics: [
      "How many customers would you like to serve each month?",
      "What does a successful day look like for you?",
      "How much time do you want to dedicate to your business each week?"
    ],
    marketing: [
      "Who do you think would benefit most from your product or service?",
      "What do you like or dislike about current market options?",
      "Have you encountered a similar product? What was your experience?"
    ],
    financials: [
      "How much do you think you'll need to get started?",
      "Have you considered pricing? What feels fair to you?",
      "What is the minimum income you'd need to cover expenses?"
    ],
    operations: [
      "How do you envision delivering your product or service?",
      "Will you handle production yourself or use suppliers?",
      "Do you plan on hiring help, or will you manage everything alone initially?"
    ],
    general: [
      "Tell me a bit about what you want to do!",
      "What's your biggest challenge in starting your business?",
      "What inspired you to start this journey?"
    ]
  };

  // Simpler follow-up questions for when the user is uncertain.
  const simplerStarters: Record<QuestionCategory, string[]> = {
    vision: [
      "What's one thing that excites you about this idea?",
      "Can you share one goal you have for your business?"
    ],
    metrics: [
      "Do you have an idea of how many customers you might serve?",
      "What's a small success you can imagine?"
    ],
    marketing: [
      "Who do you think might really enjoy your product?",
      "What's one unique aspect of your idea?"
    ],
    financials: [
      "Do you have a rough idea of your startup cost?",
      "What's one expense that stands out to you?"
    ],
    operations: [
      "How might you deliver your product in a simple way?",
      "What's one step you can take to get started?"
    ],
    general: [
      "What's one thing that comes to mind about your business?",
      "What's the simplest part of your idea you can share?"
    ]
  };

  // Choose a question from the appropriate list that hasn't been asked already.
  function getStarterQuestion(category: QuestionCategory, conversationHistory: string[]): string {
    const availableQuestions = starters[category].filter(q => !conversationHistory.includes(q));
    return availableQuestions.length > 0 ? availableQuestions[0] : starters[category][0];
  }

  function getSimplerQuestion(category: QuestionCategory, conversationHistory: string[]): string {
    const availableQuestions = simplerStarters[category].filter(q => !conversationHistory.includes(q));
    return availableQuestions.length > 0 ? availableQuestions[0] : simplerStarters[category][0];
  }

  const category = getCategory(question);
  let nextQuestion: string;
  
  // Use simpler questions if the user expresses uncertainty.
  if (isUserUncertain(question)) {
    nextQuestion = getSimplerQuestion(category, conversationHistory);
  } else {
    nextQuestion = getStarterQuestion(category, conversationHistory);
  }

  // Use OpenAI directly
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: "user",
          content: `You are an expert business coach with comprehensive knowledge of registering a business, creating a business plan, strategic planning, marketing, SEO, lead generation, customer funneling workflows, and more.
The user said: "${question}".
Based on this, please help guide them by asking this single, focused, and friendly question: "${nextQuestion}"
If the user shows uncertainty or asks for clarification, reply with even simpler, one-question prompts.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    })
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('OpenAI API error:', error)
    throw new Error('Failed to get response from AI')
  }

  const data = await response.json()
  const aiResponse = data.choices[0].message.content

  // Process the response to ensure it contains only one question
  let processedResponse = aiResponse
  
  // If there are multiple question marks, try to extract just the first question
  const questionMarks = (aiResponse.match(/\?/g) || []).length
  if (questionMarks > 1) {
    // Find the first question mark and extract everything up to that point plus a bit more context
    const firstQuestionMarkIndex = aiResponse.indexOf('?')
    if (firstQuestionMarkIndex > 0) {
      // Include the question mark and a bit more context (up to the next period or line break)
      let endIndex = firstQuestionMarkIndex + 1
      const nextPeriod = aiResponse.indexOf('.', endIndex)
      const nextLineBreak = aiResponse.indexOf('\n', endIndex)
      
      if (nextPeriod > 0 && (nextLineBreak < 0 || nextPeriod < nextLineBreak)) {
        endIndex = nextPeriod + 1
      } else if (nextLineBreak > 0) {
        endIndex = nextLineBreak
      }
      
      processedResponse = aiResponse.substring(0, endIndex).trim()
    }
  }
  
  // Return the chosen question.
  return `Let's start here: ${nextQuestion}`;
}

// Helper function to continue the help conversation
async function continueHelp(question: string, context: string[]) {
  // Check if the user is asking for ideas/examples
  const lastResponse = context[context.length - 1].toLowerCase()
  const askingForIdeas = lastResponse.includes('give me ideas') || 
                        lastResponse.includes('like what') || 
                        lastResponse.includes('such as') ||
                        lastResponse.includes('example') ||
                        lastResponse === 'yes' ||
                        (lastResponse.includes('not sure') && lastResponse.includes('can you'))

  // Check if the response is a direct answer about market/industry
  const isMarketResponse = lastResponse.includes('small business') || 
                          lastResponse.includes('healthcare') ||
                          lastResponse.includes('education') ||
                          lastResponse.includes('retail') ||
                          lastResponse.includes('marketing')

  let promptContent = '';

  if (isMarketResponse) {
    promptContent = `The user has identified ${lastResponse} as their target market. Previous responses: ${context.join(' | ')}

Choose ONE specific problem in this market and ask about it. Pick from these examples:

For small businesses:
- "Many small businesses struggle with customer follow-ups. Could you create an automation tool that helps them stay in touch with customers without hiring extra staff?"
- "Small businesses often waste time on manual bookkeeping. How about a tool that automatically categorizes expenses and prepares tax reports?"
- "Local shops need help managing their online presence. What if you built a tool that automatically updates their website and social media?"

For healthcare:
- "Doctors spend hours on patient paperwork. Could you create a system that automates medical record updates?"
- "Patients often miss appointments. How about a smart scheduling system that reduces no-shows?"
- "Medical billing is complex and error-prone. What if you automated insurance claim processing?"

For education:
- "Teachers spend too much time grading. Could you build an AI tool that helps grade assignments?"
- "Students need personalized attention. How about a system that tracks individual progress and suggests study plans?"
- "Schools struggle with attendance tracking. What if you automated attendance and parent notifications?"

Response format:
"Let's focus on a specific problem in [their chosen market]. [Describe ONE problem in detail]. Could you create a solution that [specific outcome]?"

Keep it focused on ONE concrete problem they could solve.`;
  } else if (askingForIdeas) {
    promptContent = `The user is interested in AI automation and needs specific ideas. Previous responses: ${context.join(' | ')}

Let's focus on ONE specific market segment. Choose the most relevant category and provide 3 concrete problems they could solve:

Small Business Solutions:
1. Customer Follow-up System: Automatically track customer interactions, send personalized follow-ups, and maintain relationships without manual work
2. Automated Bookkeeping: Scan receipts, categorize expenses, and prepare tax reports automatically
3. Social Media Manager: Schedule posts, respond to comments, and track engagement automatically

Response format:
"Let me share some specific problems you could solve in [market]:
1. [First problem] - Many businesses struggle with [specific pain point]
2. [Second problem] - This could save them [specific benefit]
3. [Third problem] - This would help them [specific outcome]

Which of these problems interests you most to solve?"

Keep it focused on concrete problems they could start solving immediately.`;
  } else {
    promptContent = `The user is working on this question: "${question}"
Previous responses: ${context.join(' | ')}

Choose ONE clear next step based on their response:

1. If they mentioned a specific interest (e.g., "AI automation"):
   Ask: "What specific problem would you most like to solve with [their interest]?"

2. If they mentioned a market (e.g., "small businesses"):
   Ask: "What's the biggest challenge these businesses face that you could help solve?"

3. If they mentioned a problem (e.g., "customer service"):
   Ask: "How many businesses do you think face this problem each month?"

4. If they seem uncertain:
   Ask: "What's one small problem you've noticed that you'd like to fix?"

Response format:
"I see. [Brief acknowledgment]. [Single focused question]"

Guidelines:
- Ask only ONE question
- Make it specific and concrete
- Focus on problems they could solve
- No long explanations or multiple options`;
  }

  // Use OpenAI directly
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: promptContent
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    })
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('OpenAI API error:', error)
    throw new Error('Failed to get response from AI')
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// Helper function to improve and structure the user's answer
async function improveAnswer(question: string, answer: string) {
  // Check for uncertainty indicators
  const uncertaintyPhrases = ['i don\'t know', 'not sure', 'maybe', 'i guess', 'idk']
  if (uncertaintyPhrases.some(phrase => answer.toLowerCase().includes(phrase))) {
    // If user expresses uncertainty, don't improve the answer, instead return null
    // This will signal to the POST handler to treat this as a needsHelp case
    return null
  }

  // Use OpenAI directly
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Refine this business vision answer while keeping the user's authentic voice:

Question: ${question}
Answer: ${answer}

Guidelines:
1. Start directly with the refined answer - NO meta-commentary or explanations
2. Keep their core message and personal perspective
3. Maintain their original examples and specific details
4. Add business context only where it naturally fits
5. Keep their unique voice and passion
6. Use first person ("I" and "we")
7. NO concluding comments about the refinement

Example format:
I believe [their main point]. Through my experience with [their examples], I've seen [impact/potential]. Looking ahead, I aim to [vision/goal].`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('OpenAI API error:', error)
    throw new Error('Failed to get response from AI')
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// Define the content type to match Prisma's JSON requirements
type BusinessPlanContent = {
  [key: string]: any;
  executiveSummary?: {
    [key: string]: any;
    visionAndGoals?: string;
    productsOrServices?: string;
    targetMarket?: string;
    distributionStrategy?: string;
  }
}

/**
 * POST /api/business-plans/[id]/vision
 * 
 * Handles communication with OpenAI for the vision questionnaire
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { question, answer, needsHelp, previousContext } = body
    
    // Get the business plan to include its details in the prompt
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id },
      select: { title: true, content: true }
    })
    
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }
    
    // Base system prompt for the AI
    const systemPrompt = `You are a business expert guiding users through creating a comprehensive business plan. Use the following sections as a guide/template:

Cover Page
Table of Contents
Executive Summary
Company Description
Products and Services
Market Analysis
Marketing and Sales Strategy
Operations Plan
Organization and Management
Financial Plan
Risk Analysis and Contingency Planning
Implementation Timeline and Milestones
Appendices and Supporting Documents
Document Control and Revision History

For each section, provide structured options and ask specific, step-by-step questions. When working on a section, stay strictly focused on that section and do not deviate until the user indicates they want to move on to another section. Periodically ask if the user wishes to continue with the current section or move on to another.

IMPORTANT: Ask only ONE question at a time and wait for the user's response before proceeding. Never ask multiple questions in a single response. Keep questions short, clear, and focused on the element being worked on. 

IMPORTANT: Do NOT use a fixed list of questions. Instead, generate questions that naturally follow from the user's previous answers. Make each question contextual and relevant to what the user has already shared.

If the user asks for examples, break the process down into clear, focused steps. Be concise, patient, and methodical. NEVER provide source references or mention any external names (such as books, authors, YouTube channels, podcasts, etc.).

ONLY MODIFY THE SPECIFIC SECTION THAT WE ARE WORKING ON

Currently working on: Vision and Business Goals section of the Executive Summary
Business Plan Title: ${businessPlan.title || 'New Business Plan'}
Business Description: ${businessPlan.content || 'No description provided yet'}`

    // Construct the messages array for the API
    const messages = []
    
    // Add system prompt
    messages.push({
      role: 'system',
      content: systemPrompt
    })
    
    // If we're in help mode and have previous context, add it
    if (needsHelp && previousContext) {
      // Add previous context as user and assistant messages
      previousContext.forEach((ctx: string, index: number) => {
        messages.push({
          role: index % 2 === 0 ? 'user' : 'assistant',
          content: ctx
        })
      })
    }
    
    // Add the current question
    messages.push({
      role: 'user',
      content: needsHelp 
        ? `I need help with this question: ${question}`
        : `${question}${answer ? `\n\nMy answer: ${answer}` : ''}\n\nPlease respond with ONLY ONE focused question that naturally follows from my answer. Do not jump to unrelated topics or use hardcoded questions. Make your next question contextual and relevant to what I've shared. If we've covered vision, one-year goals, three-year goals, and five-year goals, you can indicate we're finished with "Perfect! We've covered all the key aspects of your vision and goals."`
    })
    
    // If the user indicates uncertainty, add a specific request for help
    if (needsHelp && !answer) {
      messages.push({
        role: 'user',
        content: "I'm not sure how to answer this question. Can you help me by providing more guidance or examples?"
      })
    }
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', error)
      throw new Error('Failed to get response from AI')
    }
    
    const data = await response.json()
    const aiResponse = data.choices[0].message.content
    
    // Process the response to ensure it contains only one question
    let processedResponse = aiResponse
    
    // If there are multiple question marks, try to extract just the first question
    const questionMarks = (aiResponse.match(/\?/g) || []).length
    if (questionMarks > 1) {
      // Find the first question mark and extract everything up to that point plus a bit more context
      const firstQuestionMarkIndex = aiResponse.indexOf('?')
      if (firstQuestionMarkIndex > 0) {
        // Include the question mark and a bit more context (up to the next period or line break)
        let endIndex = firstQuestionMarkIndex + 1
        const nextPeriod = aiResponse.indexOf('.', endIndex)
        const nextLineBreak = aiResponse.indexOf('\n', endIndex)
        
        if (nextPeriod > 0 && (nextLineBreak < 0 || nextPeriod < nextLineBreak)) {
          endIndex = nextPeriod + 1
        } else if (nextLineBreak > 0) {
          endIndex = nextLineBreak
        }
        
        processedResponse = aiResponse.substring(0, endIndex).trim()
      }
    }
    
    // Return different response formats based on the request type
    if (needsHelp) {
      return NextResponse.json({ help: processedResponse })
    } else {
      // For normal answers, return both the original and an improved version
      return NextResponse.json({ 
        improvedAnswer: processedResponse
      })
    }
  } catch (error) {
    console.error('Error in vision API:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
} 