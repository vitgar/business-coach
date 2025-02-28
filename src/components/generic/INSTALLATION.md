# Generic Questionnaire System Installation Guide

This guide will help you install and set up the generic questionnaire system in your Business Coach application.

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- React 17.x or higher
- TypeScript 4.x or higher

## Installation Steps

1. **Copy the Generic Questionnaire Files**

If you're starting from scratch, follow these steps to set up the generic questionnaire system:

```bash
# Create the generic directory
mkdir -p src/components/generic

# Copy the files
cp -r /path/to/example/generic/* src/components/generic/
```

2. **Install Required Dependencies**

```bash
# Using npm
npm install react-markdown lucide-react @headlessui/react

# Using yarn
yarn add react-markdown lucide-react @headlessui/react
```

3. **Update Import Paths**

Make sure all import paths are correct for your project structure. You may need to update paths like:

```tsx
// From
import { GenericQuestionnaire } from '@/components/generic';

// To (if your project structure is different)
import { GenericQuestionnaire } from '../components/generic';
```

4. **Create Required Types**

Make sure your project has the necessary types defined, particularly the `BusinessPlanSection` type. If not, create a file at `src/types/business-plan.ts` with:

```typescript
export type BusinessPlanSection = 
  'visionAndGoals' | 
  'productsOrServices' | 
  'targetMarket' | 
  'distributionStrategy' | 
  'legalStructure' |
  'positioning' |
  'pricing' |
  'promotional' |
  'sales';

export interface ExecutiveSummaryData {
  visionAndGoals?: string;
  productsOrServices?: string;
  targetMarket?: string;
  distributionStrategy?: string;
}

// Add other interfaces as needed
```

## Verifying Installation

To verify that the installation was successful, create a simple test component:

```tsx
import { GenericQuestionnaire, createQuestionnaireProps } from '@/components/generic';

export default function TestQuestionnaire() {
  const handleComplete = (formattedText: string) => {
    console.log('Questionnaire completed:', formattedText);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Questionnaire</h1>
      <GenericQuestionnaire
        {...createQuestionnaireProps(
          'testSection',
          'test-business-plan-id',
          handleComplete
        )}
        prompts={[
          'What is your business vision?',
          'What are your primary goals?'
        ]}
      />
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Import Errors**

   If you see errors related to imports, double-check your path aliases and tsconfig.json configuration.

2. **Missing Dependencies**

   Make sure all required dependencies are installed. You can run:

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Type Errors**

   Ensure that all necessary types are properly defined and imported.

### Support Resources

For more information, refer to:

- README.md - General documentation
- migrationGuide.md - Guide for migrating existing components
- Example implementations in the src/components/business-plan directory 