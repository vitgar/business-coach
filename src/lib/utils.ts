import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

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

/**
 * Processes chat content through the Business Plan Creator assistant
 * to generate structured JSON data for the business plan
 * 
 * @param threadId - The OpenAI thread ID for the conversation
 * @param chatContent - The combined chat content to process
 * @param sectionId - The section ID of the business plan being worked on
 * @returns Structured business plan data in JSON format
 * 
 * Example business plan schema structures:
 * 
 * Production Process:
 * {
 *   "processOverview": "Description of the production process",
 *   "processSteps": [
 *     "Step 1: Description",
 *     "Step 2: Description"
 *   ],
 *   "equipmentAndTechnology": "Description of equipment and technology",
 *   "productionTimeline": "Description of timeline",
 *   "capacityManagement": "Description of capacity management",
 *   "outsourcingStrategy": "Description of outsourcing strategy",
 *   "productionCosts": "Description of production costs"
 * }
 * 
 * Quality Control:
 * {
 *   "qualityStandards": "Description of quality standards",
 *   "testingProcedures": "Description of testing procedures",
 *   "qualityMetrics": "Description of quality metrics",
 *   "customerFeedback": "Description of customer feedback process"
 * }
 * 
 * Inventory Management:
 * {
 *   "inventoryStrategy": "Description of inventory strategy",
 *   "supplierRelationships": "Description of supplier relationships",
 *   "inventoryLevels": "Description of inventory levels",
 *   "warehousing": "Description of warehousing"
 * }
 */
export async function processWithBusinessPlanCreator(
  threadId: string,
  chatContent: string,
  sectionId: string
): Promise<any> {
  try {
    // Create a prompt instructing the assistant to generate structured data
    const structuringPrompt = `
Please analyze the conversation about the ${sectionId} section and generate a structured JSON 
representation of the business plan section. Format your response as valid JSON that fits the 
business plan schema for this specific section.

For the "${sectionId}" section, follow this schema structure:

${sectionId === 'production' ? `{
  "processOverview": "Comprehensive overview of the production process",
  "processSteps": [
    "Step 1: Description",
    "Step 2: Description",
    "..."
  ],
  "equipmentAndTechnology": "Details about required equipment and technology",
  "productionTimeline": "Information about production timeline",
  "capacityManagement": "How capacity will be managed",
  "outsourcingStrategy": "Strategy for outsourcing (if applicable)",
  "productionCosts": "Breakdown of production costs"
}` : ''}

${sectionId === 'qualityControl' ? `{
  "qualityStandards": "Standards that will be maintained",
  "testingProcedures": "Procedures for testing quality",
  "qualityMetrics": "Metrics to measure quality",
  "customerFeedback": "Process for handling customer feedback"
}` : ''}

${sectionId === 'inventory' ? `{
  "inventoryStrategy": "Overall inventory management strategy",
  "supplierRelationships": "How supplier relationships will be managed",
  "inventoryLevels": "Optimal inventory levels and why",
  "warehousing": "Warehousing and storage details"
}` : ''}

${sectionId === 'kpis' ? `{
  "financialKPIs": ["KPI 1: Description", "KPI 2: Description"],
  "customerKPIs": ["KPI 1: Description", "KPI 2: Description"],
  "operationalKPIs": ["KPI 1: Description", "KPI 2: Description"],
  "measurementFrequency": "How often KPIs will be measured",
  "responsibleParties": "Who is responsible for tracking KPIs"
}` : ''}

${sectionId === 'technology' ? `{
  "requiredSystems": ["System 1: Description", "System 2: Description"],
  "integrationStrategy": "How systems will integrate",
  "dataSecurity": "Data security measures",
  "maintenanceApproach": "How systems will be maintained",
  "futureUpgrades": "Plan for future technology upgrades"
}` : ''}

Only include the JSON in your response, no other text.
    
Here's the conversation content to analyze:
${chatContent}
`;

    // Add the structuring prompt to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: structuringPrompt,
    });

    // Run the business plan creator assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: process.env.OPENAI_BUSINESS_PLAN_CREATOR_ID as string,
    });

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    while (
      runStatus.status === 'in_progress' || 
      runStatus.status === 'queued' || 
      runStatus.status === 'cancelling'
    ) {
      await sleep(1000);
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantMessages = messages.data
      .filter(msg => msg.role === 'assistant')
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    if (assistantMessages.length === 0) {
      throw new Error('No response from business plan creator assistant');
    }

    const assistantMessage = assistantMessages[0];
    const content = assistantMessage.content[0];

    if (content.type !== 'text') {
      throw new Error('Unexpected response type from assistant');
    }

    const responseText = content.text.value;

    // Try to parse the JSON response
    try {
      // Find JSON content (accounting for possible markdown code blocks)
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, responseText];

      const jsonContent = jsonMatch[1].trim();
      const businessPlanData = JSON.parse(jsonContent);

      // Delete the structuring message to keep the thread clean
      await openai.beta.threads.messages.del(threadId, assistantMessage.id);

      return businessPlanData;
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      console.error('Response text:', responseText);
      return {}; // Return empty object if parsing fails
    }
  } catch (error) {
    console.error('Error processing with business plan creator:', error);
    return {}; // Return empty object on error
  }
} 