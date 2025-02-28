import { QuestionnaireProps, createQuestionnaireProps } from './QuestionnaireConfig';
import { BusinessPlanSection } from '@/types/business-plan';

/**
 * Utility functions to help migrate from specialized questionnaire components 
 * to the generic questionnaire system
 */

/**
 * Creates props for GenericQuestionnaire from legacy data
 *
 * @param sectionId - ID of the section
 * @param businessPlanId - ID of the business plan
 * @param onComplete - Callback function when questionnaire is completed
 * @param legacyPrompts - Legacy prompts data
 * @param transformPrompts - Function to transform legacy prompts to the new format
 * @returns Props for the GenericQuestionnaire component
 */
export function createQuestionnairePropsFromLegacy(
  sectionId: BusinessPlanSection,
  businessPlanId: string,
  onComplete: (formattedText: string) => void,
  legacyPrompts: any,
  transformPrompts?: (legacy: any) => string[]
): QuestionnaireProps {
  const baseProps = createQuestionnaireProps(
    sectionId,
    businessPlanId,
    onComplete
  );
  
  return {
    ...baseProps,
    prompts: transformPrompts ? transformPrompts(legacyPrompts) : legacyPrompts
  };
}

/**
 * Transforms data from the old format to the new format
 *
 * @param oldData - Legacy data object
 * @param mappings - Object mapping old keys to new keys
 * @returns Transformed data object
 */
export function transformLegacyData(
  oldData: Record<string, any>,
  mappings: Record<string, BusinessPlanSection>
): Record<string, any> {
  if (!oldData) return {};
  
  const result: Record<string, any> = {};
  
  Object.entries(mappings).forEach(([oldKey, newKey]) => {
    if (oldData[oldKey] !== undefined) {
      result[newKey] = oldData[oldKey];
    }
  });
  
  return result;
}

/**
 * Creates a migration guide string with instructions
 *
 * @param componentName - Name of the component to migrate
 * @returns String with migration instructions
 */
export function getMigrationGuide(componentName: string): string {
  return `
Migration Guide for ${componentName}

1. Create a new file: ${componentName}Generic.tsx
2. Import the generic questionnaire components:
   import { GenericQuestionnaire, createQuestionnaireProps } from '@/components/generic';
3. Define your sections with prompts
4. Replace specialized questionnaire components with GenericQuestionnaire
5. Update data handling to work with the generic format
6. Test thoroughly
`;
}

/**
 * Example usage:
 * 
 * // Transform legacy data
 * const oldData = { vision: "Our company vision...", products: "Our products..." };
 * const mappings = { 
 *   vision: 'visionAndGoals' as BusinessPlanSection,
 *   products: 'productsOrServices' as BusinessPlanSection
 * };
 * const newData = transformLegacyData(oldData, mappings);
 * 
 * // Get migration guide
 * console.log(getMigrationGuide('ExecutiveSummary'));
 */ 