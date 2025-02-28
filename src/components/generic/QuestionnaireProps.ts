/**
 * QuestionnaireProps interface
 * 
 * This file defines the interface for the props used by the GenericQuestionnaire component.
 * It's separated to avoid circular dependencies and to make it easier to import in other files.
 */

/**
 * QuestionnaireProps - Props for the GenericQuestionnaire component
 * 
 * @property sectionId - ID of the section being edited
 * @property businessPlanId - ID of the business plan
 * @property onComplete - Callback when the questionnaire is completed
 * @property prompts - Array of prompt questions to help the user
 * @property initialPrompt - Optional initial prompt for the assistant
 * @property useHelpButtons - Whether to show help buttons
 * @property apiEndpoint - API endpoint for saving data
 * @property showGenerateFromPrompts - Whether to show "Generate from prompts" button
 */
export interface QuestionnaireProps {
  sectionId: string;
  businessPlanId: string;
  onComplete: (formattedText: string) => void;
  prompts: string[];
  initialPrompt?: string;
  useHelpButtons?: boolean;
  apiEndpoint?: string;
  showGenerateFromPrompts?: boolean;
}

/**
 * Creates default props for the GenericQuestionnaire component
 * 
 * This helper function makes it easier to create the props for the GenericQuestionnaire
 * component with the required parameters.
 * 
 * @param sectionId - ID of the section being edited
 * @param businessPlanId - ID of the business plan
 * @param onComplete - Callback when the questionnaire is completed
 * @returns Base props for the GenericQuestionnaire component
 */
export function createBasicQuestionnaireProps(
  sectionId: string,
  businessPlanId: string,
  onComplete: (formattedText: string) => void
): QuestionnaireProps {
  return {
    sectionId,
    businessPlanId,
    onComplete,
    prompts: []
  };
} 