/**
 * Generic Questionnaire System
 * 
 * This module exports components and utilities for the generic questionnaire system.
 * See README.md and migrationGuide.md for documentation and migration instructions.
 */

// Export the main questionnaire component
export { default as GenericQuestionnaire } from './GenericQuestionnaire';

// Export QuestionnaireProps interface and helper function
export {
  type QuestionnaireProps,
  createBasicQuestionnaireProps
} from './QuestionnaireProps';

// Export types, interfaces and helper functions from QuestionnaireConfig
export {
  createQuestionnaireProps,
  type Message,
  type SectionConfig,
  type VisionData,
  type ProductsData,
  type MarketPositioningData,
  type PricingStrategyData,
  type PromotionalActivitiesData,
  type SalesStrategyData,
  type LegalStructureData
} from './QuestionnaireConfig';

// Export utility functions
export {
  cleanResponseContent,
  extractSectionData,
  generateHelpPrompt,
  formatCompletePlan,
  getSectionApiEndpoint
} from './questionnaireUtils';

// References to documentation:
// - For general documentation, see README.md
// - For migration instructions, see migrationGuide.md
// - For example implementations, see:
//   - src/components/business-plan/ExecutiveSummaryGeneric.tsx
//   - src/components/business-plan/MarketingPlanGeneric.tsx 
