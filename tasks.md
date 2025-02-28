# Business Plan Implementation Tasks

## Completed Tasks
### Products/Services Offered Implementation
- [x] 1. Create a ProductsQuestionnaire component
  - [x] 1.1. Design the component structure
  - [x] 1.2. Implement the chat interface
  - [x] 1.3. Add data fetching for existing products data
  - [x] 1.4. Implement save functionality

- [x] 2. Create API endpoint for products data
  - [x] 2.1. Create route handler for products data
  - [x] 2.2. Implement data extraction and structuring
  - [x] 2.3. Ensure proper data storage in the business plan

- [x] 3. Update ExecutiveSummary component for products
  - [x] 3.1. Modify to use ProductsQuestionnaire for the productsOrServices section
  - [x] 3.2. Add auto-expand functionality for products section
  - [x] 3.3. Ensure proper display of products data

- [x] 4. Update business plan page for products
  - [x] 4.1. Ensure proper refresh of products data after saving
  - [x] 4.2. Add logging for debugging

- [x] 5. Testing and refinement for products
  - [x] 5.1. Test the complete flow
  - [x] 5.2. Fix any issues
  - [x] 5.3. Clean up debug code

## Current Tasks
### Markets/Customers Served Implementation

- [x] Create `MarketsQuestionnaire` component
  - [x] Define interface for markets data
  - [x] Create questionnaire UI similar to ProductsQuestionnaire
  - [x] Implement chat functionality
  - [x] Add formatting for markets data display

- [x] Create API endpoint for markets data
  - [x] Implement POST handler for chat interactions
  - [x] Add data extraction functionality
  - [x] Ensure proper storage in business plan content
  - [x] Add content cleaning for responses

- [x] Update ExecutiveSummary component for markets
  - [x] Add MarketsQuestionnaire to the markets section
  - [x] Implement auto-expand functionality for markets section
  - [x] Ensure proper display of markets data

- [x] Update business plan page for markets
  - [x] Add markets data handling
  - [x] Format markets data for display
  - [x] Ensure proper refresh after saving

- [ ] Testing and refinement for markets
  - [ ] Test the complete flow from questionnaire to display
  - [ ] Fix any bugs or issues
  - [ ] Optimize performance if needed

## Products/Services Offered Implementation (Completed)

- [x] Create `ProductsQuestionnaire` component
  - [x] Define interface for products data
  - [x] Create questionnaire UI
  - [x] Implement chat functionality
  - [x] Add formatting for products data display

- [x] Create API endpoint for products data
  - [x] Implement POST handler for chat interactions
  - [x] Add data extraction functionality
  - [x] Ensure proper storage in business plan content
  - [x] Add content cleaning for responses

- [x] Update ExecutiveSummary component for products
  - [x] Add ProductsQuestionnaire to the products section
  - [x] Implement auto-expand functionality for products section
  - [x] Ensure proper display of products data

- [x] Update business plan page for products
  - [x] Add products data handling
  - [x] Format products data for display
  - [x] Ensure proper refresh after saving
  - [x] Add logging for debugging

- [x] Testing and refinement for products
  - [x] Test the complete flow from questionnaire to display
  - [x] Fix bugs and issues
  - [x] Optimize performance 

## Upcoming Tasks
### Distribution Strategy Implementation

- [x] 1. Create `DistributionQuestionnaire` component
  - [x] 1.1. Define interface for distribution strategy data
  - [x] 1.2. Create questionnaire UI similar to existing questionnaires
  - [x] 1.3. Implement chat functionality
  - [x] 1.4. Add formatting for distribution strategy data display

- [x] 2. Create API endpoint for distribution strategy data
  - [x] 2.1. Implement POST handler for chat interactions
  - [x] 2.2. Add data extraction functionality
  - [x] 2.3. Ensure proper storage in business plan content
  - [x] 2.4. Add content cleaning for responses

- [x] 3. Update ExecutiveSummary component for distribution strategy
  - [x] 3.1. Add DistributionQuestionnaire to the distribution strategy section
  - [x] 3.2. Implement auto-expand functionality for distribution section
  - [x] 3.3. Ensure proper display of distribution strategy data

- [x] 4. Update business plan page for distribution strategy
  - [x] 4.1. Add distribution strategy data handling
  - [x] 4.2. Format distribution strategy data for display
  - [x] 4.3. Ensure proper refresh after saving

- [ ] 5. Testing and refinement for distribution strategy
  - [ ] 5.1. Test the complete flow from questionnaire to display
  - [ ] 5.2. Fix any bugs or issues
  - [ ] 5.3. Optimize performance if needed 

## Current Tasks

### 4. Update business plan page for distribution strategy ✅
- [x] 4.1 Add distribution interface to BusinessPlanContent type
- [x] 4.2 Implement extraction of distribution data from content
- [x] 4.3 Create formatting logic for distribution data

### 5. Fix data loading issues in Markets and Distribution sections ✅
- [x] 5.1 Add useEffect hook to MarketsQuestionnaire to fetch existing data
- [x] 5.2 Add useEffect hook to DistributionQuestionnaire to fetch existing data
- [x] 5.3 Ensure API endpoints return markets and distribution data

### 6. Implement sidebar navigation for business plan ✅
- [x] 6.1 Create BusinessPlanSidebar component with section links
- [x] 6.2 Create SectionNavigation component for Previous/Next buttons
- [x] 6.3 Create placeholder components for new sections (Business Description, Marketing Plan, Operations, Financial Plan)
- [x] 6.4 Update main business plan page to use the sidebar and section navigation

## Next Tasks

### 7. Testing and refinement
- [ ] 7.1 Test the complete flow from questionnaire to display
- [ ] 7.2 Fix any bugs or issues that arise
- [ ] 7.3 Optimize performance if needed

### 8. Implement content for new business plan sections
- [ ] 8.1 Add functionality to Business Description section
- [ ] 8.2 Add functionality to Marketing Plan section
- [ ] 8.3 Add functionality to Operations section
- [ ] 8.4 Add functionality to Financial Plan section 

## Current Tasks: Business Description Implementation

### 1. Company Overview Implementation
- [x] 1.1. Create `CompanyOverviewQuestionnaire` component
  - [x] 1.1.1. Define interface for company overview data
  - [x] 1.1.2. Create questionnaire UI similar to existing questionnaires
  - [x] 1.1.3. Implement chat functionality with OpenAI
  - [x] 1.1.4. Add formatting for company overview data display

- [x] 1.2. Create API endpoint for company overview data
  - [x] 1.2.1. Create route handler at `/api/business-plans/[id]/company-overview`
  - [x] 1.2.2. Implement POST handler for chat interactions
  - [x] 1.2.3. Add data extraction functionality
  - [x] 1.2.4. Ensure proper storage in business plan content
  - [x] 1.2.5. Add content cleaning for responses

- [x] 1.3. Update BusinessDescription component
  - [x] 1.3.1. Integrate CompanyOverviewQuestionnaire into the component
  - [x] 1.3.2. Add state management for company overview data
  - [x] 1.3.3. Implement auto-expand functionality similar to ExecutiveSummary
  - [x] 1.3.4. Ensure proper display of company overview data
  - [x] 1.3.5. Add edit/view toggle functionality

- [x] 1.4. Update business plan page for company overview
  - [x] 1.4.1. Add company overview data handling
  - [x] 1.4.2. Format company overview data for display
  - [x] 1.4.3. Ensure proper refresh after saving

- [x] 1.5. Testing and refinement for company overview
  - [x] 1.5.1. Test the complete flow from questionnaire to display
  - [x] 1.5.2. Fix any bugs or issues
  - [x] 1.5.3. Optimize performance if needed

### 2. Legal Structure Implementation
- [ ] 2.1. Create `LegalStructureQuestionnaire` component
  - [x] 2.1.1. Define interface for legal structure data
  - [x] 2.1.2. Create questionnaire UI similar to CompanyOverviewQuestionnaire
  - [x] 2.1.3. Define questions and prompts for legal structure
  - [x] 2.1.4. Implement chat functionality with OpenAI
  - [x] 2.1.5. Add formatting for legal structure data display

- [ ] 2.2. Create API endpoint for legal structure data
  - [ ] 2.2.1. Create route handler at `/api/business-plans/[id]/legal-structure`
  - [ ] 2.2.2. Implement POST handler for chat interactions
  - [ ] 2.2.3. Add data extraction functionality
  - [ ] 2.2.4. Ensure proper storage in business plan content
  - [ ] 2.2.5. Add content cleaning for responses

- [ ] 2.3. Update BusinessDescription component
  - [ ] 2.3.1. Integrate LegalStructureQuestionnaire into the component
  - [ ] 2.3.2. Replace the existing select dropdown with the questionnaire
  - [ ] 2.3.3. Add state management for legal structure data
  - [ ] 2.3.4. Ensure proper display of legal structure data

- [ ] 2.4. Update business plan page for legal structure
  - [ ] 2.4.1. Add legal structure data handling
  - [ ] 2.4.2. Format legal structure data for display
  - [ ] 2.4.3. Ensure proper refresh after saving

- [ ] 2.5. Testing and refinement for legal structure
  - [ ] 2.5.1. Test the complete flow from questionnaire to display
  - [ ] 2.5.2. Fix any bugs or issues
  - [ ] 2.5.3. Optimize performance if needed

### 3. Complete Business Description Section
- [ ] 3.1. Create interactive questionnaires for other sections
  - [ ] 3.1.1. Implement `LocationFacilitiesQuestionnaire` component
  - [ ] 3.1.2. Implement `MissionStatementQuestionnaire` component
- [ ] 3.2. Add functionality to save and load business description data
  - [ ] 3.2.1. Enhance API to handle all business description subsections
  - [ ] 3.2.2. Implement data loading on component mount
  - [ ] 3.2.3. Add validation before saving

### Later Tasks
- [ ] 4. Location & Facilities Implementation
- [ ] 5. Mission Statement Implementation 

# Business Description UI/UX Enhancement Checklist

## Overview
This checklist outlines the steps needed to update the Business Description component to match the UI/UX behavior of the Executive Summary component. The Executive Summary has collapsible sections, better organization, and a more intuitive user experience.

## Key Differences Identified
1. **Collapsible Sections**: Executive Summary has expandable/collapsible sections with chevron indicators
2. **Section Headers**: Executive Summary has more prominent section headers with descriptions
3. **Layout Structure**: Executive Summary has a cleaner layout with better spacing and organization
4. **Auto-Expansion Logic**: Executive Summary automatically expands sections based on content
5. **Visual Hierarchy**: Executive Summary has a clearer visual hierarchy with better use of colors and typography
6. **Scrolling Behavior**: Executive Summary prevents unwanted scrolling when interacting with sections

## Detailed Implementation Tasks

### 1. Component Structure Updates
- [x] Refactor BusinessDescription component to use a similar structure as ExecutiveSummary
- [x] Define section data structure with IDs, titles, and descriptions
- [x] Implement expandedSection state to track which section is currently open
- [x] Add auto-expansion logic based on content availability

### 2. UI Layout Changes
- [x] Update the main container layout to match ExecutiveSummary
- [x] Implement collapsible section headers with proper styling
- [x] Add chevron indicators (ChevronDown/ChevronRight) for section state
- [x] Improve spacing and padding between sections
- [x] Update typography styles to match ExecutiveSummary

### 3. Section Header Implementation
- [x] Create clickable section headers with proper styling
- [x] Add section descriptions under each header
- [x] Implement toggle functionality for expanding/collapsing sections
- [x] Add hover effects to indicate interactivity

### 4. Content Display Improvements
- [x] Update how questionnaire components are rendered within sections
- [x] Ensure questionnaire components only render when their section is expanded
- [x] Maintain state for all sections even when collapsed
- [x] Implement proper transitions for expanding/collapsing

### 5. Scrolling Behavior Fixes
- [x] Add onClick event handlers with stopPropagation to prevent unwanted scrolling
- [x] Ensure all form submissions prevent default behavior
- [x] Add proper event handling for all interactive elements
- [x] Test scrolling behavior across all sections

### 6. State Management Enhancements
- [x] Update state management to track content for all sections
- [x] Implement proper data fetching and saving for each section
- [x] Add loading states for async operations
- [x] Ensure state is preserved when switching between sections

### 7. Detailed Implementation Steps

#### Step 1: Update Component Structure ✅
```jsx
// Define sections data structure
const sections = [
  {
    id: 'companyOverview',
    title: 'Company Overview',
    description: 'Provide a clear description of your business, its history, and current status.',
  },
  {
    id: 'legalStructure',
    title: 'Legal Structure',
    description: 'Define the legal structure of your business and explain why you chose it.',
  },
  {
    id: 'locationFacilities',
    title: 'Location & Facilities',
    description: 'Describe your business location, facilities, and why they are suitable for your operations.',
  },
  {
    id: 'missionStatement',
    title: 'Mission Statement',
    description: 'Articulate your business mission, vision, and core values.',
  },
];

// Add state for tracking expanded section
const [expandedSection, setExpandedSection] = useState(null);
```

#### Step 2: Implement Section Headers ✅
```jsx
{sections.map((section) => (
  <div key={section.id} className="border rounded-lg shadow-sm bg-white overflow-hidden mb-4">
    <button
      onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
      className="w-full px-6 py-4 flex items-center justify-between text-left bg-gradient-to-r from-gray-50 to-white border-b transition-colors hover:bg-gray-50"
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
        <p className="text-sm text-gray-500">{section.description}</p>
      </div>
      {expandedSection === section.id ? (
        <ChevronDown className="h-5 w-5 text-blue-500" />
      ) : (
        <ChevronRight className="h-5 w-5 text-gray-400" />
      )}
    </button>
    
    {/* Section content will go here */}
  </div>
))}
```

#### Step 3: Implement Section Content ✅
```jsx
{expandedSection === 'companyOverview' && (
  <div className="px-6 py-5 bg-white">
    <CompanyOverviewQuestionnaire 
      businessPlanId={businessPlanId}
      onComplete={handleCompanyOverviewComplete}
    />
  </div>
)}

{/* Repeat for other sections */}
```

#### Step 4: Add Auto-Expansion Logic ✅
```jsx
// Auto-expand the first section with content
useEffect(() => {
  if (companyOverview && expandedSection === null) {
    setExpandedSection('companyOverview');
  } else if (!companyOverview && legalStructure && expandedSection === null) {
    setExpandedSection('legalStructure');
  } else if (!companyOverview && !legalStructure && locationFacilities && expandedSection === null) {
    setExpandedSection('locationFacilities');
  } else if (!companyOverview && !legalStructure && !locationFacilities && missionStatement && expandedSection === null) {
    setExpandedSection('missionStatement');
  }
}, [companyOverview, legalStructure, locationFacilities, missionStatement, expandedSection]);
```

#### Step 5: Fix Scrolling Behavior ✅
Ensure all interactive elements have proper event handling:
```jsx
onClick={(e) => {
  e.stopPropagation();
  setExpandedSection(expandedSection === section.id ? null : section.id);
}}
```

### 8. Testing Checklist
- [x] Verify all sections expand and collapse correctly
- [x] Confirm that clicking on section headers works as expected
- [x] Test auto-expansion logic with different content scenarios
- [x] Ensure scrolling behavior is fixed across all sections
- [x] Verify that all questionnaire components function properly
- [x] Test saving functionality for each section
- [x] Confirm that state is preserved when switching between sections
- [x] Test on different screen sizes to ensure responsive behavior

### 9. Final Verification
- [x] Compare side-by-side with Executive Summary to ensure visual consistency
- [x] Verify that all UI elements match in style and behavior
- [x] Test complete user flows to ensure seamless experience
- [x] Confirm that all scrolling issues are resolved

## Next Steps
1. ✅ Test the implementation thoroughly to ensure all scrolling issues are fixed
2. ✅ Verify that the UI/UX matches the Executive Summary component exactly
3. ✅ Make any necessary adjustments based on testing results 

# Marketing Plan UI/UX Enhancement Task List

## Overview
This task list provides a comprehensive guide for implementing the exact same UI/UX behavior from the ExecutiveSummary component into the MarketingPlan component. Every aspect of the UI/UX will be replicated, including collapsible sections, positioning of elements, button styles, event handling, and scrolling behavior.

## Component Analysis: Differences between Current Implementation and Target Design

### Current MarketingPlan Component Issues:
1. Uses an array of expanded sections instead of a single expanded section
2. Lacks proper section header styling with gradients and proper spacing
3. Missing blue accent and consistent visual hierarchy
4. Different chevron positioning and coloring
5. Different rendering approach for section content
6. Less sophisticated auto-expansion logic
7. Lacks proper event handling to prevent scrolling issues
8. Missing loading/saving states and indicators
9. Different container styling and spacing
10. Different layout for questionnaire components and preview panels

## Detailed Task List

### 1. Component Structure Updates

- [x] Update state management from `expandedSections` (array) to `expandedSection` (single string) to match ExecutiveSummary behavior
- [x] Add isSaving state to track async operations
- [x] Modify section data structure to match ExecutiveSummary format with proper IDs, titles, and descriptions
- [ ] Ensure all sections have consistent IDs that match backend data structure
- [ ] Update component props to match ExecutiveSummary interface
- [ ] Update component return structure to match ExecutiveSummary layout

### 2. Auto-Expansion Logic

- [x] Remove current auto-expansion logic that uses a single useEffect
- [x] Implement individual useEffect hooks for each section to match ExecutiveSummary
- [x] Add priority-based expansion (expand first section with content)
- [x] Add fallback to first section if no content exists
- [ ] Ensure expansion state persists correctly across renders

### 3. Section Header Styling

- [x] Update section headers to use proper button elements
- [x] Add gradient background styling (`bg-gradient-to-r from-gray-50 to-white`)
- [x] Update typography for section titles using proper font weights and sizes
- [x] Update section description styling to match ExecutiveSummary
- [x] Implement proper spacing and padding around headers
- [x] Add proper border styling to section containers

### 4. Chevron Indicator Implementation

- [x] Update chevron positioning to right side of header
- [x] Implement color change for expanded section chevrons (blue for expanded, gray for collapsed)
- [x] Use ChevronDown for expanded sections and ChevronRight for collapsed sections
- [x] Ensure proper sizing and spacing of chevron icons

### 5. Container Styling

- [x] Update main container styling to match ExecutiveSummary
- [x] Add blue accent border to top section (`border-b-2 border-blue-500`)
- [x] Update spacing between sections
- [x] Add proper shadow and border-radius to section containers
- [x] Update background colors to match ExecutiveSummary

### 6. Section Content Rendering

- [x] Replace the current `renderSectionContent` method with direct conditional rendering
- [x] Ensure each questionnaire component renders only when its section is expanded
- [x] Update content rendering to use ReactMarkdown for better formatting
- [x] Add proper padding and spacing around content areas
- [x] Ensure content containers have proper styling and background color

### 7. Event Handling

- [x] Update `toggleSection` function to handle single section expansion
- [x] Add proper event handling to prevent default behavior
- [x] Add stopPropagation to all click handlers to prevent unwanted scrolling
- [x] Ensure all form submissions prevent default behavior
- [x] Add proper click handling to the main container

### 8. Questionnaire Component Updates

- [x] Add stopPropagation to all questionnaire component form submissions
- [x] Update questionnaire component layouts to match ExecutiveSummary
- [x] Ensure consistent styling across all questionnaire components
- [x] Add proper loading states and indicators to questionnaire components
- [x] Update button styling to match ExecutiveSummary

### 9. Save Button Implementation

- [ ] Add a "Save All" button with proper styling when in editing mode
- [ ] Implement loading indicator for saving state
- [ ] Add proper error handling for save operations
- [ ] Position the save button at the bottom right of the component
- [ ] Match exact button styling with ExecutiveSummary

### 10. API Integration

- [x] Update API calls to match the ExecutiveSummary pattern
- [x] Ensure proper error handling for all API calls
- [x] Add loading states for data fetching
- [x] Update success/error toast messages
- [x] Implement proper data transformation for API requests and responses

### 11. CSS Styling Details

- [x] Match exact padding values from ExecutiveSummary
- [x] Match exact margin values from ExecutiveSummary
- [x] Match exact color values from ExecutiveSummary
- [x] Match exact border styling from ExecutiveSummary
- [x] Match exact typography styling from ExecutiveSummary
- [x] Match exact shadow styling from ExecutiveSummary
- [x] Match exact hover and focus states from ExecutiveSummary

### 12. Responsive Behavior

- [ ] Ensure component behaves correctly on different screen sizes
- [ ] Match exact responsive breakpoints from ExecutiveSummary
- [ ] Match exact responsive layout changes from ExecutiveSummary
- [ ] Test on mobile, tablet, and desktop viewports

### 13. Questionnaire Layout Implementation

- [ ] Ensure each questionnaire has the same dual-panel layout:
  - [ ] Left panel containing the interactive chat/form
  - [ ] Right panel containing the preview of entered content
- [ ] Match exact dimensions and spacing between panels
- [ ] Add consistent styling for chat messages and inputs
- [ ] Match exact styling for preview panels
- [ ] Ensure scroll behavior within panels matches ExecutiveSummary

### 14. Scrolling Behavior Fixes

- [x] Add onClick handlers with stopPropagation to all interactive elements
- [x] Prevent default behavior for all form submissions
- [x] Ensure expandable sections don't cause unwanted scrolling
- [x] Fix scroll behavior within chat containers
- [x] Add proper scroll behavior for long content sections

### 15. Animation and Transitions

- [ ] Add smooth transitions for expanding/collapsing sections
- [ ] Match exact animation timing from ExecutiveSummary
- [ ] Implement loading animations that match ExecutiveSummary
- [ ] Add hover transitions for interactive elements
- [ ] Ensure animations are consistent across all sections

### 16. Chat Interface Implementation

- [ ] Match exact message bubble styling from ExecutiveSummary
- [ ] Implement consistent input field styling
- [ ] Add proper send button styling and positioning
- [ ] Match exact spacing between messages
- [ ] Implement automatic scrolling behavior for new messages

### 17. Button Styling

- [ ] Match exact primary button styling (color, padding, border-radius)
- [ ] Match exact secondary button styling
- [ ] Implement consistent hover and focus states
- [ ] Add proper disabled states for buttons
- [ ] Match exact button text styling

### 18. Error Handling and Messaging

- [ ] Implement consistent error messaging across all sections
- [ ] Add proper error styling that matches ExecutiveSummary
- [ ] Ensure all error states are properly handled
- [ ] Match exact toast notification styling
- [ ] Add proper loading state indicators during async operations

### 19. Testing and Verification

- [ ] Test all section expansion/collapse behavior
- [ ] Verify auto-expansion logic works as expected
- [ ] Test all form submissions across all questionnaires
- [ ] Verify scrolling behavior across all sections
- [ ] Test on different screen sizes
- [ ] Verify all visual elements match ExecutiveSummary
- [ ] Test all API integrations
- [ ] Verify state management works correctly
- [ ] Test with actual data from the backend
- [ ] Verify accessibility of all interactive elements

### 20. Final Polishing

- [ ] Ensure consistent spacing throughout the component
- [ ] Verify all font sizes and weights match ExecutiveSummary
- [ ] Ensure all colors match the design system
- [ ] Verify all interactive elements have proper hover/focus states
- [ ] Conduct final comparison with ExecutiveSummary to ensure exact match

## Implementation Steps in Detail

### Step 1: Update MarketingPlan Component Structure

```jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ChevronDown, ChevronRight } from 'lucide-react';
import MarketPositioningQuestionnaire from './MarketPositioningQuestionnaire';
import PricingStrategyQuestionnaire from './PricingStrategyQuestionnaire';
import PromotionalActivitiesQuestionnaire from './PromotionalActivitiesQuestionnaire';
import SalesStrategyQuestionnaire from './SalesStrategyQuestionnaire';
import ReactMarkdown from 'react-markdown';

// Define Section interface
interface Section {
  id: string;
  title: string;
  description: string;
}

// Define sections data
const sections: Section[] = [
  {
    id: 'positioning',
    title: 'Market Positioning',
    description: 'Define your target audience and how your business stands out from competitors',
  },
  {
    id: 'pricing',
    title: 'Pricing Strategy',
    description: 'Outline your pricing approach and how it aligns with your business goals',
  },
  {
    id: 'promotional',
    title: 'Promotional Activities',
    description: 'Detail your advertising, PR, social media, and other promotional efforts',
  },
  {
    id: 'sales',
    title: 'Sales Strategy',
    description: 'Define your sales process, channels, and conversion metrics',
  },
];

// Update component props
interface MarketingPlanProps {
  businessPlanId: string;
  isEditing?: boolean;
  onSave?: (section: string, content: string) => Promise<void>;
}

// Update MarketingPlan component
export default function MarketingPlan({ 
  businessPlanId, 
  isEditing = false,
  onSave
}: MarketingPlanProps) {
  // Update state management
  const [marketingData, setMarketingData] = useState<MarketingPlanData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // ...rest of component implementation
}
```

### Step 2: Implement Auto-Expansion Logic

```jsx
// Auto-expand the first section with content
useEffect(() => {
  if (marketingData.positioning && expandedSection === null) {
    setExpandedSection('positioning');
  }
}, [marketingData.positioning, expandedSection]);

// Auto-expand the second section if first has no content
useEffect(() => {
  if (marketingData.pricing && expandedSection === null && !marketingData.positioning) {
    setExpandedSection('pricing');
  }
}, [marketingData.pricing, expandedSection, marketingData.positioning]);

// Auto-expand the third section if first two have no content
useEffect(() => {
  if (marketingData.promotional && expandedSection === null && 
      !marketingData.positioning && !marketingData.pricing) {
    setExpandedSection('promotional');
  }
}, [marketingData.promotional, expandedSection, marketingData.positioning, marketingData.pricing]);

// Auto-expand the fourth section if first three have no content
useEffect(() => {
  if (marketingData.sales && expandedSection === null && 
      !marketingData.positioning && !marketingData.pricing && !marketingData.promotional) {
    setExpandedSection('sales');
  }
}, [marketingData.sales, expandedSection, marketingData.positioning, marketingData.pricing, marketingData.promotional]);
```

### Step 3: Update Section Rendering

```jsx
return (
  <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
    {/* Header section with blue accent */}
    <div className="border-b-2 border-blue-500 pb-4 mb-6">
      <h2 className="text-2xl font-bold text-blue-700">Marketing Plan</h2>
      <p className="mt-2 text-gray-600">
        This section outlines your marketing strategy, including your target market, 
        positioning, promotional activities, and sales approach.
      </p>
    </div>
    
    {/* Sections */}
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.id} className="border rounded-lg shadow-sm bg-white overflow-hidden">
          <button
            onClick={(e) => toggleSection(section.id, e)}
            className="w-full px-6 py-4 flex items-center justify-between text-left bg-gradient-to-r from-gray-50 to-white border-b transition-colors hover:bg-gray-50"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              <p className="text-sm text-gray-500">{section.description}</p>
            </div>
            {expandedSection === section.id ? (
              <ChevronDown className="h-5 w-5 text-blue-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </button>
          
          {expandedSection === section.id && (
            <div className="px-6 py-5 bg-white">
              {/* Render section content based on section.id */}
            </div>
          )}
        </div>
      ))}
    </div>
    
    {/* Save All Button */}
    {isEditing && (
      <div className="mt-8 flex justify-end">
        <button 
          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
          onClick={handleSaveAll}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Saving...</span>
            </>
          ) : (
            'Save All Sections'
          )}
        </button>
      </div>
    )}
  </div>
);
```

## Notes
1. All UI elements must have exact same styling, positioning, and behavior as ExecutiveSummary
2. All interactive elements must have proper event handling to prevent scrolling issues
3. Component structure should follow the same pattern as BusinessDescription
4. API integration should follow the same pattern as ExecutiveSummary
5. Questionnaire components should have the same layout and styling as ExecutiveSummary