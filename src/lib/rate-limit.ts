/**
 * Simple rate limiting utility for OpenAI API calls
 * Helps prevent exceeding API rate limits by adding delays between calls
 */

// Track the last API call time
let lastCallTime = 0;

// Minimum time between API calls in milliseconds (200ms = 5 calls per second max)
const MIN_TIME_BETWEEN_CALLS = 200;

/**
 * Rate limit OpenAI API calls
 * Ensures a minimum delay between API calls to prevent rate limiting
 * 
 * @returns A promise that resolves when it's safe to make the next API call
 */
export async function rateLimitOpenAI(): Promise<void> {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  // If we've made a call recently, wait until the minimum time has passed
  if (timeSinceLastCall < MIN_TIME_BETWEEN_CALLS) {
    const waitTime = MIN_TIME_BETWEEN_CALLS - timeSinceLastCall;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Update the last call time
  lastCallTime = Date.now();
} 