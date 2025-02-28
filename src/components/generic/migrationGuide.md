# Migration Guide for Generic Questionnaire System

This guide provides step-by-step instructions for migrating specialized questionnaire components to the new generic questionnaire system.

## Migration Steps

1. **Create a new component file**
   - Name it with the original component name plus "Generic" (e.g., `ExecutiveSummaryGeneric.tsx`)

2. **Import necessary components**
   ```tsx
   import { 
     GenericQuestionnaire, 
     createQuestionnaireProps 
   } from '@/components/generic';
   ```

3. **Define sections and prompts**
   ```tsx
   const sections = [
     {
       id: 'sectionId',
       title: 'Section Title',
       description: 'Description text',
       prompts: [
         'First prompt question?',
         'Second prompt question?'
       ]
     },
     // Additional sections...
   ];
   ```

4. **Update state management**
   - Keep the same state structure for compatibility
   - Update data transformation as needed

5. **Replace specialized questionnaire with GenericQuestionnaire**
   ```tsx
   <GenericQuestionnaire
     {...createQuestionnaireProps(
       section.id,
       businessPlanId,
       (formattedText) => handleQuestionnaireComplete(section.id, formattedText)
     )}
     prompts={section.prompts}
   />
   ```

6. **Test thoroughly**
   - Ensure all functionality works as expected
   - Compare with the original component

## Mapping Data

When migrating, you may need to map old data formats to new ones:

```typescript
// Example data mapping
const oldData = { 
  vision: "Our company vision...", 
  products: "Our products..." 
};

// Map to new format
const newData = {
  visionAndGoals: oldData.vision,
  productsOrServices: oldData.products
};
```

## Example Migration

See the following files for complete examples:
- `ExecutiveSummaryGeneric.tsx`
- `MarketingPlanGeneric.tsx`

These demonstrate how to migrate different types of questionnaire components.

## Common Issues

- **Missing data**: Ensure all data fields are properly mapped
- **API endpoints**: Update API endpoints to match the new component
- **Event handlers**: Update event handlers to work with the generic system
- **UI differences**: Adjust styling as needed to maintain consistency

## Best Practices

- Maintain consistent naming conventions
- Add detailed comments to explain the migration
- Test each section thoroughly
- Keep the UI/UX as close to the original as possible 