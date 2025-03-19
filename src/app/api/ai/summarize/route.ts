import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { env } from 'process'

/**
 * POST /api/ai/summarize
 * 
 * Takes detailed content and creates a concise summary of key points
 * 
 * Request body:
 * - content: string - The detailed content to summarize
 * - maxLength: number (optional) - Maximum length of summary (default: 500 characters)
 * 
 * Returns:
 * - summary: string - The summarized content
 */
export async function POST(request: Request) {
  let content = '';
  let maxLength = 500;
  
  try {
    const body = await request.json()
    content = body.content;
    maxLength = body.maxLength || 500;
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    
    // Initialize OpenAI if API key is available
    // In production, use your own API key
    const apiKey = env.OPENAI_API_KEY || 'sk-dummy-key-for-development'
    
    // If using a dummy key for development, return a mock summary
    if (apiKey === 'sk-dummy-key-for-development') {
      console.log('Using mock summary for development')
      const mockSummary = generateMockSummary(content, maxLength)
      return NextResponse.json({ summary: mockSummary })
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey })
    
    // Create a prompt for summarization
    const promptContent = `
    Please create a concise bullet-point summary of the following information.
    Focus ONLY on extracting the key points, important facts, and actionable insights.
    
    Guidelines:
    - Each bullet point should begin with "• " and focus on a single concept
    - Include only the most important information (max 5-7 bullet points)
    - Be specific and informative, not vague
    - Remove any fluff, introductions, or transitions
    - Include numbers and specific data points when present
    - DO NOT include explanatory text, instructions, or commentary
    
    Original content:
    ${content}
    
    Key Points Summary (bullet points):
    `
    
    // Call OpenAI API to summarize using chat completions instead of completions
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise bullet-point summaries of information. Extract only the key points, important facts, and actionable insights."
        },
        {
          role: "user",
          content: promptContent
        }
      ],
      max_tokens: Math.min(maxLength, 2000) / 4, // Estimate of tokens per character
      temperature: 0.5, // Balance between creativity and focus
    })
    
    const summary = response.choices[0]?.message?.content?.trim() || ''
    
    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('Error summarizing content:', error)
    
    // Provide more detailed error messages for common OpenAI API issues
    let errorMessage = 'Failed to summarize content';
    let statusCode = 500;
    
    if (error.status === 401) {
      errorMessage = 'API key is missing or invalid';
      statusCode = 401;
    } else if (error.status === 429) {
      errorMessage = 'Too many requests or exceeded rate limit';
      statusCode = 429;
    } else if (error.status === 404 && error.error?.type === 'invalid_request_error') {
      errorMessage = `Model error: ${error.error?.message || 'The specified model was not found'}`;
      statusCode = 404;
    } else if (error.status === 400) {
      errorMessage = `Bad request: ${error.error?.message || 'Invalid request parameters'}`;
      statusCode = 400;
    }
    
    // Fall back to using mock summaries for known errors
    if (statusCode !== 500) {
      console.log(`OpenAI API error (${statusCode}): ${errorMessage}. Falling back to mock summary.`);
      try {
        // Make sure we have the content and maxLength from parent scope
        const mockSummary = generateMockSummary(content, maxLength);
        return NextResponse.json({ 
          summary: mockSummary,
          notice: 'Generated using fallback method due to API issues'
        });
      } catch (innerError) {
        console.error('Error generating mock summary:', innerError);
        // If even mock generation fails, return the original error
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

/**
 * Generates a mock summary for development environments
 * This helps us test the functionality without using the OpenAI API
 */
function generateMockSummary(content: string, maxLength: number): string {
  // Extract the first sentence from each paragraph
  const paragraphs = content.split('\n\n')
  
  // Get the first sentence from each paragraph
  const keyPoints = paragraphs
    .map(paragraph => {
      const firstSentence = paragraph.split(/\.\s+/)[0]
      return firstSentence ? firstSentence.trim() + '.' : ''
    })
    .filter(sentence => sentence.length > 10) // Filter out very short sentences
  
  // Format as bullet points
  const summary = keyPoints
    .slice(0, 5) // Limit to 5 key points
    .map(point => `• ${point}`)
    .join('\n')
  
  // Ensure the summary doesn't exceed max length
  return summary.length > maxLength 
    ? summary.substring(0, maxLength - 3) + '...' 
    : summary
} 