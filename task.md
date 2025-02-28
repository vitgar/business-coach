# Marketing Plan Implementation Tasks

## Main Implementation Tasks

- [ ] Create base `MarketingPlanQuestionnaire` component with reusable architecture
- [ ] Implement API endpoint for all marketing plan data processing
- [ ] Set up data structures for all marketing plan sections
- [ ] Create shared UI components and styling for consistency
- [ ] Integrate with main business plan page

## Market Positioning Section

### Component Development
- [ ] Create `MarketPositioningQuestionnaire.tsx` component
- [ ] Define interfaces for component props and message structure
- [ ] Create interface for market positioning data:
  ```typescript
  interface MarketPositioningData {
    targetAudience?: string;
    customerSegments?: string[];
    competitiveAnalysis?: string;
    positioningStatement?: string;
    uniqueValueProposition?: string;
    marketDifferentiators?: string[];
  }
  ```
- [ ] Implement state variables for messages, input, loading states, and positioning data
- [ ] Set up two-column layout with chat on left, preview on right

### Chat Functionality
- [ ] Add initial message guiding users about market positioning
- [ ] Implement `handleSubmit` function for sending messages
- [ ] Create `fetchPositioningData` to load existing data
- [ ] Add `handleNotSure` function for help functionality
- [ ] Implement loading indicators and error handling
- [ ] Set up auto-scroll for new messages

### Preview Section
- [ ] Create preview section with blue accent border
- [ ] Implement `formatPositioningText` for structured display
- [ ] Add save button with proper handler
- [ ] Create status message for existing data
- [ ] Style preview consistently with other components

### API Integration
- [ ] Create API endpoint handlers in marketing plan route file
- [ ] Implement thread management for positioning conversations
- [ ] Create data extraction function for positioning information
- [ ] Add proper error handling for API calls
- [ ] Set up data persistence in the business plan content

## Pricing Strategy Section

### Component Development
- [ ] Create `PricingStrategyQuestionnaire.tsx` component
- [ ] Define interfaces for component props and message structure  
- [ ] Create interface for pricing strategy data:
  ```typescript
  interface PricingStrategyData {
    pricingModel?: string;
    pricePoints?: string[];
    competitivePricing?: string;
    pricingRationale?: string;
    discountStrategy?: string;
    profitMargins?: string;
    pricingFlexibility?: string;
  }
  ```
- [ ] Implement state variables for messages, input, loading states, and pricing data
- [ ] Set up two-column layout with chat on left, preview on right

### Chat Functionality
- [ ] Add initial message guiding users about pricing strategy
- [ ] Implement `handleSubmit` function for sending messages
- [ ] Create `fetchPricingData` to load existing data
- [ ] Add `handleNotSure` function for pricing help
- [ ] Implement loading indicators and error handling
- [ ] Set up auto-scroll for new messages

### Preview Section
- [ ] Create preview section with blue accent border
- [ ] Implement `formatPricingText` for structured display
- [ ] Add save button with proper handler
- [ ] Create status message for existing data
- [ ] Style preview consistently with other components

### API Integration
- [ ] Create API endpoint handlers in marketing plan route file
- [ ] Implement thread management for pricing conversations
- [ ] Create data extraction function for pricing information
- [ ] Add proper error handling for API calls
- [ ] Set up data persistence in the business plan content

## Promotional Activities Section

### Component Development
- [ ] Create `PromotionalActivitiesQuestionnaire.tsx` component
- [ ] Define interfaces for component props and message structure
- [ ] Create interface for promotional activities data:
  ```typescript
  interface PromotionalActivitiesData {
    marketingChannels?: string[];
    contentStrategy?: string;
    socialMediaStrategy?: string;
    advertisingPlan?: string;
    publicRelationsApproach?: string;
    promotionalEvents?: string[];
    marketingBudget?: string;
    performanceMetrics?: string[];
  }
  ```
- [ ] Implement state variables for messages, input, loading states, and promotional data
- [ ] Set up two-column layout with chat on left, preview on right

### Chat Functionality
- [ ] Add initial message guiding users about promotional activities
- [ ] Implement `handleSubmit` function for sending messages
- [ ] Create `fetchPromotionalData` to load existing data
- [ ] Add `handleNotSure` function for promotional help
- [ ] Implement loading indicators and error handling
- [ ] Set up auto-scroll for new messages

### Preview Section
- [ ] Create preview section with blue accent border
- [ ] Implement `formatPromotionalText` for structured display
- [ ] Add save button with proper handler
- [ ] Create status message for existing data
- [ ] Style preview consistently with other components

### API Integration
- [ ] Create API endpoint handlers in marketing plan route file
- [ ] Implement thread management for promotional conversations
- [ ] Create data extraction function for promotional information
- [ ] Add proper error handling for API calls
- [ ] Set up data persistence in the business plan content

## Sales Strategies Section

### Component Development
- [ ] Create `SalesStrategiesQuestionnaire.tsx` component
- [ ] Define interfaces for component props and message structure
- [ ] Create interface for sales strategies data:
  ```typescript
  interface SalesStrategiesData {
    salesProcess?: string;
    salesChannels?: string[];
    salesTeamStructure?: string;
    customerAcquisitionStrategy?: string;
    conversionTactics?: string[];
    salesGoals?: string;
    customerRetentionPlan?: string;
    salesMetrics?: string[];
  }
  ```
- [ ] Implement state variables for messages, input, loading states, and sales data
- [ ] Set up two-column layout with chat on left, preview on right

### Chat Functionality
- [ ] Add initial message guiding users about sales strategies
- [ ] Implement `handleSubmit` function for sending messages
- [ ] Create `fetchSalesData` to load existing data
- [ ] Add `handleNotSure` function for sales help
- [ ] Implement loading indicators and error handling
- [ ] Set up auto-scroll for new messages

### Preview Section
- [ ] Create preview section with blue accent border
- [ ] Implement `formatSalesText` for structured display
- [ ] Add save button with proper handler
- [ ] Create status message for existing data
- [ ] Style preview consistently with other components

### API Integration
- [ ] Create API endpoint handlers in marketing plan route file
- [ ] Implement thread management for sales conversations
- [ ] Create data extraction function for sales information
- [ ] Add proper error handling for API calls
- [ ] Set up data persistence in the business plan content

## Integration Tasks

- [ ] Update `MarketingPlan.tsx` to use all four questionnaire components
- [ ] Implement tab or accordion interface to switch between sections
- [ ] Create combined data structure for complete marketing plan
- [ ] Ensure data from all sections is saved correctly
- [ ] Add navigation between marketing plan sections
- [ ] Implement proper state management for section completion
- [ ] Create consolidated preview of entire marketing plan
- [ ] Add progress tracking for marketing plan completion

## Final Testing & Refinement

- [ ] Test chat functionality across all sections
- [ ] Verify data extraction works for each section
- [ ] Test save functionality and persistence for all data
- [ ] Ensure consistent styling across all questionnaires
- [ ] Test responsiveness on different screen sizes
- [ ] Verify error handling in all components
- [ ] Optimize performance for chat interactions
- [ ] Ensure accessibility compliance for all components

# Financial Plan Remaining Sections Implementation

## Overview
This document outlines the implementation plan for the remaining sections of the Financial Plan:
- Revenue Projections
- Expense Projections
- Break-Even Analysis
- Funding Requirements
- Financial Metrics

Each section will follow the same pattern as the Startup Cost questionnaire, using a chat-based interface instead of traditional form inputs.

## Implementation Approach

### 1. Component Structure
For each section, we'll create:
- A questionnaire component with chat interface
- An API endpoint to process messages and extract structured data
- Utility functions to format the data for display

### 2. Data Models

#### Revenue Projections Data
```typescript
interface RevenueProjectionsData {
  revenueStreams?: {
    name: string;
    description: string;
    projectedAmount: number;
    timeframe: string;
  }[];
  growthAssumptions?: string;
  marketSizeEstimates?: string;
  pricingStrategy?: string;
  salesForecast?: {
    period: string;
    amount: number;
    growthRate?: number;
  }[];
  seasonalityFactors?: string;
  bestCaseScenario?: string;
  worstCaseScenario?: string;
}
```

#### Expense Projections Data
```typescript
interface ExpenseProjectionsData {
  fixedExpenses?: {
    category: string;
    monthlyAmount: number;
    description: string;
  }[];
  variableExpenses?: {
    category: string;
    rate: string; // e.g., "10% of revenue"
    description: string;
  }[];
  oneTimeExpenses?: {
    category: string;
    amount: number;
    expectedDate: string;
    description: string;
  }[];
  staffingCosts?: {
    role: string;
    count: number;
    salary: number;
    benefits: number;
  }[];
  costGrowthAssumptions?: string;
  costReductionStrategies?: string;
}
```

#### Break-Even Analysis Data
```typescript
interface BreakEvenAnalysisData {
  fixedCosts?: number;
  variableCostsPerUnit?: number;
  pricePerUnit?: number;
  breakEvenUnits?: number;
  breakEvenRevenue?: number;
  breakEvenTimeframe?: string;
  contributionMargin?: number;
  contributionMarginRatio?: number;
  safetyMargin?: string;
  assumptions?: string;
  sensitivityAnalysis?: string;
}
```

#### Funding Requirements Data
```typescript
interface FundingRequirementsData {
  totalFundingNeeded?: number;
  fundingPurposes?: {
    purpose: string;
    amount: number;
    timeline: string;
  }[];
  fundingSources?: {
    source: string;
    amount: number;
    terms: string;
    probability: string;
  }[];
  equityOffering?: string;
  debtStructure?: string;
  exitStrategy?: string;
  investorReturns?: string;
  contingencyPlans?: string;
}
```

#### Financial Metrics Data
```typescript
interface FinancialMetricsData {
  profitabilityMetrics?: {
    metric: string;
    value: string;
    benchmark: string;
  }[];
  liquidityMetrics?: {
    metric: string;
    value: string;
    benchmark: string;
  }[];
  efficiencyMetrics?: {
    metric: string;
    value: string;
    benchmark: string;
  }[];
  growthMetrics?: {
    metric: string;
    value: string;
    benchmark: string;
  }[];
  valuationEstimates?: string;
  keyRatios?: string;
}
```

## Implementation Steps

### 1. Create Questionnaire Components
For each section, create a component following the pattern of `StartupCostQuestionnaire.tsx`:

1. **RevenueProjectionsQuestionnaire.tsx**
   - Chat interface for discussing revenue streams and projections
   - Preview panel showing formatted revenue projections
   - Save functionality to update the business plan

2. **ExpenseProjectionsQuestionnaire.tsx**
   - Chat interface for discussing expense categories and projections
   - Preview panel showing formatted expense projections
   - Save functionality to update the business plan

3. **BreakEvenAnalysisQuestionnaire.tsx**
   - Chat interface for discussing break-even calculations
   - Preview panel showing formatted break-even analysis
   - Save functionality to update the business plan

4. **FundingRequirementsQuestionnaire.tsx**
   - Chat interface for discussing funding needs and sources
   - Preview panel showing formatted funding requirements
   - Save functionality to update the business plan

5. **FinancialMetricsQuestionnaire.tsx**
   - Chat interface for discussing key financial metrics
   - Preview panel showing formatted financial metrics
   - Save functionality to update the business plan

### 2. Create API Endpoints
For each section, create an API endpoint following the pattern of `startup-costs/route.ts`:

1. **`/api/business-plans/[id]/financial-plan/revenue-projections`**
2. **`/api/business-plans/[id]/financial-plan/expense-projections`**
3. **`/api/business-plans/[id]/financial-plan/break-even-analysis`**
4. **`/api/business-plans/[id]/financial-plan/funding-requirements`**
5. **`/api/business-plans/[id]/financial-plan/financial-metrics`**

Each endpoint should:
- Handle GET requests to retrieve existing data
- Handle POST requests to process messages and extract structured data
- Update the business plan with the new data

### 3. Update FinancialPlan Component
Modify the `FinancialPlan.tsx` component to:
- Add state management for each section's active status
- Integrate each questionnaire component
- Handle completion callbacks from each questionnaire
- Update the display of saved data

```typescript
// Example of updated state in FinancialPlan.tsx
const [activeSection, setActiveSection] = useState<string | null>(null);

// Example of rendering a questionnaire when active
if (activeSection === 'revenueProjections') {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Revenue Projections</h2>
        <button
          onClick={() => setActiveSection(null)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Back to Financial Plan
        </button>
      </div>
      
      <RevenueProjectionsQuestionnaire
        businessPlanId={businessPlanId}
        onComplete={handleRevenueProjectionsComplete}
      />
    </div>
  );
}
```

### 4. Add Utility Functions
Add extraction and formatting functions for each data type:

1. **`extractRevenueProjectionsData`**
2. **`extractExpenseProjectionsData`**
3. **`extractBreakEvenAnalysisData`**
4. **`extractFundingRequirementsData`**
5. **`extractFinancialMetricsData`**

### 5. Testing Plan
For each section:
1. Test data extraction from AI responses
2. Test formatting functions for display
3. Test saving and retrieving data
4. Test the complete user flow from chat to saved data

## Implementation Order
1. Revenue Projections
2. Expense Projections
3. Break-Even Analysis
4. Funding Requirements
5. Financial Metrics

## Estimated Timeline
- 1 day per section (5 days total)
- 1 day for integration and testing
- Total: 6 days

## Success Criteria
- All financial plan sections use chat-based questionnaires
- Data is properly structured and saved to the business plan
- Users can navigate between sections seamlessly
- Preview panels show formatted data in real-time
- All sections maintain consistent UI/UX with the rest of the application 