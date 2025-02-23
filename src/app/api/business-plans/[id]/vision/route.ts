import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Pinecone } from '@pinecone-database/pinecone'

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
})

// Create a singleton assistant instance
let assistant: any = null

async function getOrCreateAssistant() {
  if (!assistant) {
    try {
      assistant = pc.assistant("business-coach")
    } catch (error) {
      console.error('Error getting assistant:', error)
      throw error
    }
  }
  return assistant
}

// Helper function to generate AI response for "I'm not sure" cases
async function generateHelp(question: string, conversationHistory: string[] = []) {
  const businessCoach = await getOrCreateAssistant();

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

  // Engage the business coach with context, so they know to guide the conversation one question at a time.
  await businessCoach.chat({
    messages: [
      {
        role: "user",
        content: `You are an expert business coach with comprehensive knowledge of registering a business, creating a business plan, strategic planning, marketing, SEO, lead generation, customer funneling workflows, and more.
The user said: "${question}".
Based on this, please help guide them by asking this single, focused, and friendly question: "${nextQuestion}"
If the user shows uncertainty or asks for clarification, reply with even simpler, one-question prompts.`
      }
    ]
  });

  // Return the chosen question.
  return `Let's start here: ${nextQuestion}`;
}


// Helper function to continue the help conversation
async function continueHelp(question: string, context: string[]) {
  const businessCoach = await getOrCreateAssistant()
  
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

  if (isMarketResponse) {
    const response = await businessCoach.chat({
      messages: [{
        role: 'user',
        content: `The user has identified ${lastResponse} as their target market. Previous responses: ${context.join(' | ')}

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

Keep it focused on ONE concrete problem they could solve.`
      }]
    })
    return response.message.content
  }

  if (askingForIdeas) {
    const response = await businessCoach.chat({
      messages: [{
        role: 'user',
        content: `The user is interested in AI automation and needs specific ideas. Previous responses: ${context.join(' | ')}

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

Keep it focused on concrete problems they could start solving immediately.`
      }]
    })
    return response.message.content
  }

  const response = await businessCoach.chat({
    messages: [{
      role: 'user',
      content: `The user is working on this question: "${question}"
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
- No long explanations or multiple options`
    }]
  })

  return response.message.content
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

  const businessCoach = await getOrCreateAssistant()
  const response = await businessCoach.chat({
    messages: [{
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
    }]
  })

  return response.message.content
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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { question, answer, needsHelp, previousContext } = body

    // If explicitly asking for help or if the answer indicates uncertainty
    if (needsHelp || answer.toLowerCase().includes('i don\'t know')) {
      // If we have previous context, continue the help conversation
      const helpResponse = previousContext?.length > 0 
        ? await continueHelp(question, previousContext)
        : await generateHelp(question)
      return NextResponse.json({ help: helpResponse })
    }

    const improvedAnswer = await improveAnswer(question, answer)
    
    // If improveAnswer returns null, it means we detected uncertainty
    // and should switch to help mode
    if (improvedAnswer === null) {
      const helpResponse = await generateHelp(question)
      return NextResponse.json({ help: helpResponse })
    }
    
    // Get the current business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: params.id }
    })

    if (!businessPlan) {
      throw new Error('Business plan not found')
    }

    // Get current content or initialize it
    const content = (businessPlan.content as BusinessPlanContent) || {}
    
    // Update the vision in the content
    const updatedContent: BusinessPlanContent = {
      ...content,
      executiveSummary: {
        ...(content.executiveSummary || {}),
        visionAndGoals: improvedAnswer
      }
    }

    // Update the business plan
    const updatedPlan = await prisma.businessPlan.update({
      where: { id: params.id },
      data: {
        content: updatedContent
      }
    })

    return NextResponse.json({ 
      success: true, 
      improvedAnswer,
      businessPlan: updatedPlan
    })
  } catch (error) {
    console.error('Error processing vision request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
} 