# Generic Questionnaire System

This directory contains a reusable questionnaire system designed to replace specialized questionnaire components across the Business Coach application while maintaining consistent UI/UX.

## Components and Files

- `GenericQuestionnaire.tsx`: The main component for displaying and handling questionnaire interactions
- `QuestionnaireConfig.ts`: Contains type definitions and configuration options
- `questionnaireUtils.ts`: Utility functions for formatting data and handling API interactions
- `index.ts`: Exports all components and utilities

## Usage

To create a new questionnaire component using the generic system:

1. Import the necessary components and utilities:

```tsx
import { 
  GenericQuestionnaire, 
  createQuestionnaireProps,
  QuestionnaireProps
} from '@/components/generic';
```

2. Define your sections and prompts:

```tsx
const sections = [
  {
    id: 'sectionId',
    title: 'Section Title',
    description: 'Section description',
    prompts: [
      'First prompt question?',
      'Second prompt question?',
      // Add more prompts as needed
    ]
  }
];
```

3. Use the GenericQuestionnaire component:

```tsx
<GenericQuestionnaire
  {...createQuestionnaireProps(
    sectionId, 
    businessPlanId, 
    (formattedText) => handleComplete(sectionId, formattedText)
  )}
  prompts={section.prompts}
/>
```

## Example Components

We've created example implementations using the generic questionnaire system:

- `ExecutiveSummaryGeneric.tsx`: Demonstrates using the generic system for the Executive Summary
- `MarketingPlanGeneric.tsx`: Demonstrates using the generic system for the Marketing Plan

## API

### GenericQuestionnaire Component

The main component for displaying and handling questionnaire interactions.

```tsx
interface QuestionnaireProps {
  sectionId: string;
  businessPlanId: string;
  onComplete: (formattedText: string) => void;
  prompts: string[];
  initialPrompt?: string;
  useHelpButtons?: boolean;
  apiEndpoint?: string;
  showGenerateFromPrompts?: boolean;
}
```

### Utility Functions

- `createQuestionnaireProps`: Helper to create props for the GenericQuestionnaire component
- `cleanResponseContent`: Removes unnecessary characters from AI responses
- `extractSectionData`: Extracts relevant section data from API responses
- `generateHelpPrompt`: Generates help prompts for AI assistance
- `formatCompletePlan`: Formats complete plans for API submission
- `getApiEndpointForSection`: Gets the appropriate API endpoint for a section

## Migration Guide

To migrate an existing specialized questionnaire component to the generic system:

1. Identify the core sections and prompts in the existing component
2. Create a new component using the generic questionnaire system
3. Update any references to the old component
4. Test thoroughly to ensure consistent behavior

## Benefits

- Reduces code duplication
- Maintains consistent UI/UX across questionnaires
- Simplifies maintenance and updates
- Provides a standardized way to handle questionnaire interactions 