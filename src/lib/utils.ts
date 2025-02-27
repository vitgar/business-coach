/**
 * Utility function to pause execution for a specified duration
 * @param ms - The number of milliseconds to sleep
 * @returns A promise that resolves after the specified duration
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Extracts startup cost data from the assistant's response
 * 
 * @param response - The assistant's response text
 * @param existingData - Existing startup cost data to merge with
 * @returns Extracted startup cost data
 */
export function extractStartupCostData(response: string, existingData: any = {}) {
  try {
    // Look for JSON data in the response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/```\n([\s\S]*?)\n```/) ||
                      response.match(/{[\s\S]*?}/);
    
    if (jsonMatch) {
      // Extract the JSON string
      const jsonString = jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1];
      
      // Parse the JSON string
      const extractedData = JSON.parse(jsonString);
      
      // Merge with existing data
      return {
        ...existingData,
        ...extractedData,
      };
    }
    
    return existingData;
  } catch (error) {
    console.error('Error extracting startup cost data:', error);
    return existingData;
  }
}

/**
 * Cleans the assistant's response by removing JSON and formatting instructions
 * 
 * @param response - The assistant's response text
 * @returns Cleaned response text
 */
export function cleanResponse(response: string) {
  // Remove JSON blocks
  let cleaned = response.replace(/```json\n[\s\S]*?\n```/g, '');
  cleaned = cleaned.replace(/```\n[\s\S]*?\n```/g, '');
  
  // Remove any remaining JSON objects
  cleaned = cleaned.replace(/{[\s\S]*?}/g, '');
  
  // Remove formatting instructions
  cleaned = cleaned.replace(/I'll format this as JSON for you:[\s\S]*?/g, '');
  cleaned = cleaned.replace(/Here's the JSON representation:[\s\S]*?/g, '');
  cleaned = cleaned.replace(/I've updated the JSON with your information:[\s\S]*?/g, '');
  
  // Trim whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
} 