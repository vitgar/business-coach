/**
 * Types and configurations for questionnaire components
 * This file contains shared type definitions and configurations used by the
 * generic questionnaire component and related utilities.
 */

/**
 * Message interface for chat messages
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Section configuration interface
 * Defines the configuration for a business plan section
 */
export interface SectionConfig {
  id: string;
  title: string;
  description: string;
  apiEndpoint: string;
  assistantId?: string;
  initialMessage: string;
  systemPrompt: string;
  dataFormatter: (data: any) => string;
  dataParser?: (content: string) => any;
  prompts: string[];
  helpMessage?: string;
}

/**
 * Vision data schema
 */
export interface VisionData {
  longTermVision?: string;
  yearOneGoals?: string[];
  yearThreeGoals?: string[];
  yearFiveGoals?: string[];
  alignmentExplanation?: string;
}

/**
 * Products/Services data schema
 */
export interface ProductsData {
  offerings?: string[];
  differentiation?: string;
  valueProposition?: string;
  competitiveAdvantage?: string;
  sustainabilityStrategy?: string;
}

/**
 * Market positioning data schema
 */
export interface MarketPositioningData {
  targetAudience?: string;
  customerSegments?: string[];
  competitiveAnalysis?: string;
  positioningStatement?: string;
  uniqueValueProposition?: string;
  marketDifferentiators?: string[];
}

/**
 * Business Model data schema
 */
export interface BusinessModelData {
  valueProposition?: string;
  customerSegments?: string | string[];
  revenueStreams?: string | string[];
  keyResources?: string | string[];
  keyActivities?: string | string[];
  keyPartners?: string | string[];
  costStructure?: string;
  channels?: string | string[];
}

/**
 * Pricing strategy data schema
 */
export interface PricingStrategyData {
  pricingModel?: string;
  pricingTiers?: {
    name: string;
    price: string;
    features: string[];
  }[];
  competitivePricing?: string;
  profitMargins?: string;
  discountStrategy?: string;
  pricingRationale?: string;
}

/**
 * Promotional activities data schema
 */
export interface PromotionalActivitiesData {
  advertisingChannels?: string[];
  socialMediaStrategy?: string;
  contentMarketing?: string;
  prActivities?: string[];
  partnershipOpportunities?: string[];
  campaignIdeas?: string[];
  marketingBudget?: string;
}

/**
 * Sales strategy data schema
 */
export interface SalesStrategyData {
  salesProcess?: string;
  salesChannels?: string[];
  salesTeamStructure?: string;
  conversionMetrics?: {
    metric: string;
    target: string;
  }[];
  salesForecast?: string;
  customerRetention?: string;
}

/**
 * Legal structure data schema
 */
export interface LegalStructureData {
  businessType?: string;
  ownershipStructure?: string;
  regulatoryRequirements?: string[];
  intellectualProperty?: string[];
  liabilityConsiderations?: string;
  taxImplications?: string;
}

/**
 * Production Process data schema
 */
export interface ProductionProcessData {
  processOverview?: string;
  processSteps?: string[];
  equipmentAndTechnology?: string;
  productionTimeline?: string;
  capacityManagement?: string;
  outsourcingStrategy?: string;
  productionCosts?: string;
}

/**
 * Quality Control data schema
 */
export interface QualityControlData {
  qualityStandards?: string;
  qualityProcesses?: string[];
  testingProcedures?: string;
  qualityMetrics?: string[];
  complianceRequirements?: string;
  qualityTeam?: string;
  improvementProcess?: string;
}

/**
 * Inventory Management data schema
 */
export interface InventoryManagementData {
  inventorySystem?: string;
  trackingMethods?: string;
  reorderProcess?: string;
  storageApproach?: string;
  supplierManagement?: string;
  wastageControls?: string;
  inventoryCosts?: string;
}

/**
 * KPI data schema
 */
export interface KPIData {
  financialKPIs?: string[];
  operationalKPIs?: string[];
  customerKPIs?: string[];
  employeeKPIs?: string[];
  trackingMethods?: string;
  reviewProcess?: string;
  improvementStrategy?: string;
}

/**
 * Technology Systems data schema
 */
export interface TechnologySystemsData {
  coreSystemsUsed?: string[];
  softwareApplications?: string[];
  dataManagement?: string;
  cybersecurity?: string;
  techInvestments?: string;
  maintenanceStrategy?: string;
  techIntegration?: string;
}

/**
 * Configuration factory function
 * Creates a GenericQuestionnaireProps object from a section ID and business plan ID
 */
export function createQuestionnaireProps(sectionId: string, businessPlanId: string, onComplete: (formattedText: string) => void) {
  const config = SECTION_CONFIGS[sectionId];
  
  if (!config) {
    throw new Error(`No configuration found for section: ${sectionId}`);
  }
  
  return {
    businessPlanId,
    sectionId: config.id,
    onComplete,
    apiEndpoint: config.apiEndpoint,
    assistantId: config.assistantId,
    initialMessage: config.initialMessage,
    systemPrompt: config.systemPrompt,
    title: config.title,
    description: config.description,
    prompts: config.prompts,
    helpMessage: config.helpMessage,
    dataFormatter: config.dataFormatter,
    dataParser: config.dataParser
  };
}

/**
 * Section configurations for all business plan sections
 */
export const SECTION_CONFIGS: Record<string, SectionConfig> = {
  'visionAndGoals': {
    id: 'visionAndGoals',
    title: 'Vision and Business Goals',
    description: 'Define the long-term vision and specific goals for your business.',
    apiEndpoint: '/vision',
    initialMessage: 'Let\'s focus on your business vision and goals. A clear vision will guide your business\'s direction, while specific goals will mark the path to achieve it. First, what is your core business vision - the fundamental change or impact you want your business to create?',
    systemPrompt: 'Do not respond with long multiple steps answers, guide the user step by step asking one question at a time and wait for the answer. If the user asks for help, expresses uncertainty, or requests examples, provide 2-3 concrete examples that are specific and measurable. After providing examples, always ask if they want to use one of the examples directly or modify their current vision/goals with ideas from the examples. Keep the conversation focused on vision and goals. If the user starts discussing implementation, marketing, or other topics, gently guide them back to defining their vision and specific, measurable goals for years 1, 3, and 5.',
    dataFormatter: formatVisionData,
    prompts: [
      'Guide me step by step to create a business vision',
      'How do I create a 5-year vision?',
      'Tips for setting achievable goals',
      'Mission vs. vision - what\'s the difference?',
      'How to align goals with my vision'
    ],
    helpMessage: 'Let me help you define your business vision and goals with some examples. A good vision statement articulates the purpose and impact of your business, while goals should be specific, measurable, achievable, relevant, and time-bound (SMART).'
  },
  'productsOrServices': {
    id: 'productsOrServices',
    title: 'Products/Services Offered',
    description: 'Describe your offerings and how they are differentiated from competitors.',
    apiEndpoint: '/products',
    initialMessage: 'Let\'s define the products or services your business will offer. What main products or services will your business provide to customers?',
    systemPrompt: 'Guide the user through defining their products or services step by step. Focus on what makes their offerings unique and valuable. Help them articulate their competitive advantage and how they will sustain it. Keep questions focused on specific aspects of their products or services, not their broader business operations.',
    dataFormatter: formatProductsData,
    prompts: [
      'Guide me step by step to define my product offering',
      'How to choose which products to focus on first',
      'Ways to differentiate from competitors',
      'How to describe my service\'s value',
      'What to include in my MVP'
    ]
  },
  'targetMarket': {
    id: 'targetMarket',
    title: 'Markets/Customers Served',
    description: 'Identify your target market and customer segments.',
    apiEndpoint: '/markets',
    initialMessage: 'Let\'s identify your target market and customer segments. Who will be the primary users or buyers of your products or services?',
    systemPrompt: 'Guide the user through defining their target markets and customer segments. Help them be specific about demographics, psychographics, and behaviors. Encourage quantification of market size and segmentation where possible. Focus on actionable customer insights rather than general market trends.',
    dataFormatter: formatMarketsData,
    prompts: [
      'Guide me step by step to identify my target market',
      'How to narrow my customer focus',
      'Low-cost market research methods',
      'Creating effective customer personas',
      'Optimal number of customer segments to target'
    ]
  },
  'distributionStrategy': {
    id: 'distributionStrategy',
    title: 'Distribution Strategy',
    description: 'Explain how your products or services will reach customers.',
    apiEndpoint: '/distribution',
    initialMessage: 'Let\'s outline your distribution strategy. How will your products or services reach your customers?',
    systemPrompt: 'Help the user define their distribution channels and logistics. Focus on the entire customer journey from production to delivery. Encourage consideration of costs, efficiency, and customer experience throughout the distribution process. Keep the discussion practical and specific to their business model.',
    dataFormatter: formatDistributionData,
    prompts: [
      'Guide me step by step to create a distribution strategy',
      'Best distribution options for my business type',
      'Direct sales vs. using distributors',
      'Online vs. physical distribution pros/cons',
      'Creating a scalable distribution model'
    ]
  },
  'positioning': {
    id: 'positioning',
    title: 'Market Positioning',
    description: 'Define your target audience and how your business stands out from competitors.',
    apiEndpoint: '/marketing-plan/positioning',
    initialMessage: 'Let\'s define your market positioning. Who is your target audience and how does your business differentiate itself from competitors?',
    systemPrompt: 'Guide the user through defining their market positioning. Focus on their unique value proposition and competitive differentiation. Help them articulate their target audience in specific terms. Keep the conversation focused on positioning rather than broader marketing tactics.',
    dataFormatter: formatMarketPositioningData,
    prompts: [
      'Guide me step by step to define my market position',
      'Finding my niche in a crowded market',
      'Creating an effective positioning statement',
      'Should I compete on price, quality, or service?',
      'Defending against competitors copying my position'
    ]
  },
  'pricing': {
    id: 'pricing',
    title: 'Pricing Strategy',
    description: 'Outline your pricing approach and how it aligns with your business goals.',
    apiEndpoint: '/marketing-plan/pricing',
    initialMessage: 'Let\'s develop your pricing strategy. What pricing model will you use for your products or services?',
    systemPrompt: 'Help the user develop a pricing strategy that aligns with their business goals and market positioning. Guide them to consider competitive pricing, value-based pricing, and profitability. Encourage specificity in pricing tiers and rationale.',
    dataFormatter: formatPricingStrategyData,
    prompts: [
      'Guide me step by step to develop a pricing strategy',
      'Finding the optimal price point',
      'How to structure pricing tiers',
      'Value-based pricing techniques',
      'Pricing psychology tactics that work'
    ]
  },
  'promotional': {
    id: 'promotional',
    title: 'Promotional Activities',
    description: 'Detail your advertising, PR, social media, and other promotional efforts.',
    apiEndpoint: '/marketing-plan/promotional',
    initialMessage: 'Let\'s plan your promotional activities. What marketing channels will you use to reach your target audience?',
    systemPrompt: 'Guide the user through planning their promotional activities. Help them identify appropriate marketing channels for their target audience. Encourage them to consider budget allocation, messaging strategy, and measurement of marketing effectiveness.',
    dataFormatter: formatPromotionalActivitiesData,
    prompts: [
      'Guide me step by step to create a promotional plan',
      'Most effective marketing channels for startups',
      'Creating a marketing budget that makes sense',
      'Content marketing strategies that drive sales',
      'Measuring marketing ROI effectively'
    ]
  },
  'sales': {
    id: 'sales',
    title: 'Sales Strategy',
    description: 'Define your sales process, channels, and conversion metrics.',
    apiEndpoint: '/marketing-plan/sales',
    initialMessage: 'Let\'s define your sales strategy. How will you convert prospects into customers?',
    systemPrompt: 'Help the user develop their sales strategy. Guide them through defining their sales process, channels, team structure, and metrics. Focus on practical, actionable approaches that align with their business model and target market.',
    dataFormatter: formatSalesStrategyData,
    prompts: [
      'Guide me step by step to develop a sales strategy',
      'Creating an effective sales process',
      'Best CRM tools for small businesses',
      'Setting realistic sales targets',
      'Hiring and compensating salespeople'
    ]
  },
  'legalStructure': {
    id: 'legalStructure',
    title: 'Legal Structure',
    description: 'Define the legal entity type and ownership structure of your business.',
    apiEndpoint: '/legal-structure',
    initialMessage: 'Let\'s determine the best legal structure for your business. What type of business entity are you considering (sole proprietorship, LLC, corporation, etc.)?',
    systemPrompt: 'Guide the user through selecting an appropriate legal structure for their business. Help them understand the implications of different entity types on liability, taxes, ownership, and regulatory requirements. Focus on practical considerations rather than detailed legal advice.',
    dataFormatter: formatLegalStructureData,
    prompts: [
      'Guide me step by step to choose a legal structure',
      'LLC vs. Corporation: which is right for me?',
      'Tax implications of different business structures',
      'Essential business licenses and permits',
      'Protecting intellectual property effectively'
    ]
  },
  'production': {
    id: 'production',
    title: 'Production Process',
    description: 'Define how your products are manufactured or how your services are delivered.',
    apiEndpoint: '/operations/production',
    initialMessage: "Let's discuss your production process or service delivery workflow. What are the key steps involved in creating your product or delivering your service?",
    systemPrompt: "Guide the user through defining their production or service delivery process. Focus on specific steps, equipment, timelines, capacity, outsourcing, and costs. Ask one question at a time and be specific. If they ask for examples, provide 2-3 concrete examples relevant to their industry.",
    dataFormatter: formatProductionData,
    prompts: [
      'Guide me step by step to design my production process',
      'Optimizing production efficiency',
      'In-house vs. outsourced production',
      'Managing production costs effectively',
      'Scaling production as demand grows'
    ]
  },
  'qualityControl': {
    id: 'qualityControl',
    title: 'Quality Control',
    description: 'Outline your approach to ensuring consistent quality in your products or services.',
    apiEndpoint: '/operations/quality-control',
    initialMessage: "Let's discuss your quality control processes. How do you ensure consistent quality in your products or services?",
    systemPrompt: "Guide the user through defining their quality control processes. Focus on standards, testing procedures, metrics, compliance requirements, and improvement processes. Ask one question at a time and be specific. If they ask for examples, provide 2-3 concrete examples relevant to their industry.",
    dataFormatter: formatQualityControlData,
    prompts: [
      'Guide me step by step to create a quality control system',
      'Setting measurable quality standards',
      'Cost-effective quality testing methods',
      'Handling customer complaints effectively',
      'Training staff for quality consistency'
    ]
  },
  'inventory': {
    id: 'inventory',
    title: 'Inventory Management',
    description: 'Describe your approach to managing inventory, supplies, and materials.',
    apiEndpoint: '/operations/inventory',
    initialMessage: "Let's discuss your inventory management system. How do you manage your inventory, supplies, and materials?",
    systemPrompt: "Guide the user through defining their inventory management system. Focus on tracking, reordering, storage, supplier relationships, and cost control. Ask one question at a time and be specific. If they ask for examples, provide 2-3 concrete examples relevant to their industry.",
    dataFormatter: formatInventoryData,
    prompts: [
      'Guide me step by step to set up inventory management',
      'Determining optimal inventory levels',
      'Affordable inventory tracking systems',
      'Reducing inventory holding costs',
      'Managing seasonal inventory fluctuations'
    ]
  },
  'kpis': {
    id: 'kpis',
    title: 'Key Performance Indicators',
    description: 'Define the metrics you will track to measure business performance.',
    apiEndpoint: '/operations/kpis',
    initialMessage: "Let's discuss your Key Performance Indicators (KPIs). What metrics will you track to measure the success of your business?",
    systemPrompt: "Guide the user through defining their KPIs across different areas of their business. Focus on financial, operational, customer, and employee metrics. Ask one question at a time and be specific. If they ask for examples, provide 2-3 concrete examples relevant to their industry.",
    dataFormatter: formatKPIData,
    prompts: [
      'Guide me step by step to establish business KPIs',
      'Most important metrics for my business type',
      'Setting realistic performance targets',
      'Simple KPI tracking systems',
      'Using metrics to make better decisions'
    ]
  },
  'technology': {
    id: 'technology',
    title: 'Technology & Systems',
    description: 'Outline the technology and systems you will use to run your business.',
    apiEndpoint: '/operations/technology',
    initialMessage: "Let's discuss the technology and systems you will use to run your business. What software, hardware, or other technology will you implement?",
    systemPrompt: "Guide the user through defining their technology stack and systems. Focus on software, hardware, integration, security, and future technology needs. Ask one question at a time and be specific. If they ask for examples, provide 2-3 concrete examples relevant to their industry.",
    dataFormatter: formatTechnologyData,
    prompts: [
      'Guide me step by step to select business technology',
      'Essential software for my business type',
      'Affordable tech stack for startups',
      'Integrating different business systems',
      'Future-proofing technology investments'
    ]
  },
  'startupCost': {
    id: 'startupCost',
    title: 'Startup Costs',
    description: 'Detail the initial investments required to launch your business',
    apiEndpoint: '/financial-plan/startup-costs',
    initialMessage: "Let's determine your startup costs. What one-time expenses will you need to invest in to launch your business?",
    systemPrompt: "Guide the user through identifying and estimating their startup costs. Focus on one-time expenses needed to launch the business, including equipment, legal fees, initial inventory, and other upfront investments. Ask one question at a time and be specific. If they ask for examples, provide 2-3 concrete examples relevant to their industry.",
    dataFormatter: (data) => {
      // Simple formatting function for startup costs data
      const parts = [];
      
      if (data.oneTimeCosts) {
        parts.push('### One-Time Startup Costs\n' + data.oneTimeCosts + '\n');
      }
      
      if (data.equipmentCosts) {
        parts.push('### Equipment and Assets\n' + data.equipmentCosts + '\n');
      }
      
      if (data.inventoryCosts) {
        parts.push('### Initial Inventory\n' + data.inventoryCosts + '\n');
      }
      
      if (data.legalFees) {
        parts.push('### Legal and Professional Fees\n' + data.legalFees + '\n');
      }
      
      if (data.facilityCosts) {
        parts.push('### Facility Setup Costs\n' + data.facilityCosts + '\n');
      }
      
      if (data.marketingCosts) {
        parts.push('### Initial Marketing and Branding\n' + data.marketingCosts + '\n');
      }
      
      if (data.totalStartupCosts) {
        parts.push('### Total Startup Investment\n' + data.totalStartupCosts + '\n');
      }
      
      if (data.fundingSources) {
        parts.push('### Funding Sources\n' + data.fundingSources + '\n');
      }
      
      return parts.join('\n');
    },
    prompts: [
      "I'm completely new to this - can you walk me through all the startup costs I should consider?",
      "What are the typical startup costs for a business in my industry?",
      "Help me create a detailed startup budget with realistic estimates",
      "I'm worried about overlooking important costs - what do most entrepreneurs miss?",
      "How can I minimize my initial investment while still launching effectively?"
    ]
  },
  'revenueProjections': {
    id: 'revenueProjections',
    title: 'Revenue Projections',
    description: 'Forecast your sales and revenue for the first 1-3 years',
    apiEndpoint: '/financial-plan/revenue-projections',
    initialMessage: "Let's develop your revenue projections. What are your primary revenue streams and how much do you expect to earn from each in your first year?",
    systemPrompt: "Guide the user through creating revenue projections. Focus on revenue streams, pricing, sales volume, and growth rates. Encourage them to be realistic and provide rationale for their estimates. Ask one question at a time and be specific. If they ask for examples, provide 2-3 concrete examples relevant to their industry.",
    dataFormatter: (data) => {
      // Simple formatting function for revenue projections data
      const parts = [];
      
      if (data.revenueStreams) {
        parts.push('### Revenue Streams\n' + data.revenueStreams + '\n');
      }
      
      if (data.yearOneProjections) {
        parts.push('### Year 1 Projections\n' + data.yearOneProjections + '\n');
      }
      
      if (data.yearTwoProjections) {
        parts.push('### Year 2 Projections\n' + data.yearTwoProjections + '\n');
      }
      
      if (data.yearThreeProjections) {
        parts.push('### Year 3 Projections\n' + data.yearThreeProjections + '\n');
      }
      
      if (data.growthAssumptions) {
        parts.push('### Growth Assumptions\n' + data.growthAssumptions + '\n');
      }
      
      if (data.seasonalityFactors) {
        parts.push('### Seasonality Factors\n' + data.seasonalityFactors + '\n');
      }
      
      return parts.join('\n');
    },
    prompts: [
      "I have no idea how to forecast revenue - can you guide me through the process?",
      "What's a realistic monthly revenue ramp-up for a new business like mine?",
      "Help me create revenue projections that won't scare off potential investors",
      "How do I account for multiple revenue streams in my projections?",
      "What are common mistakes entrepreneurs make when forecasting revenue?"
    ]
  },
  'expenseProjections': {
    id: 'expenseProjections',
    title: 'Expense Projections',
    description: 'Estimate your fixed and variable costs for the first 1-3 years',
    apiEndpoint: '/financial-plan/expense-projections',
    initialMessage: "Let's map out your expense projections. What are your main fixed and variable costs?",
    systemPrompt: "Guide the user through creating expense projections. Help them identify fixed costs (rent, salaries, insurance) and variable costs (materials, commissions, shipping). Encourage realistic estimates and categorization. Ask one question at a time and be specific. If they ask for examples, provide 2-3 concrete examples relevant to their industry.",
    dataFormatter: (data) => {
      // Simple formatting function for expense projections data
      const parts = [];
      
      if (data.fixedCosts) {
        parts.push('### Fixed Costs\n' + data.fixedCosts + '\n');
      }
      
      if (data.variableCosts) {
        parts.push('### Variable Costs\n' + data.variableCosts + '\n');
      }
      
      if (data.yearOneExpenses) {
        parts.push('### Year 1 Expense Projections\n' + data.yearOneExpenses + '\n');
      }
      
      if (data.yearTwoExpenses) {
        parts.push('### Year 2 Expense Projections\n' + data.yearTwoExpenses + '\n');
      }
      
      if (data.yearThreeExpenses) {
        parts.push('### Year 3 Expense Projections\n' + data.yearThreeExpenses + '\n');
      }
      
      if (data.costReductionStrategies) {
        parts.push('### Cost Reduction Strategies\n' + data.costReductionStrategies + '\n');
      }
      
      return parts.join('\n');
    },
    prompts: [
      "I'm overwhelmed by all the potential costs - help me identify what's really important",
      "What expenses am I likely forgetting in my business model?",
      "How should my expenses change as my business grows over 3 years?",
      "Help me create a month-by-month expense budget for my first year",
      "What are smart ways to reduce expenses without compromising quality?"
    ]
  },
  'breakEvenAnalysis': {
    id: 'breakEvenAnalysis',
    title: 'Break-Even Analysis',
    description: 'Calculate when your business will become profitable',
    apiEndpoint: '/financial-plan/break-even-analysis',
    initialMessage: "Let's perform a break-even analysis for your business. Based on your revenue and expense projections, when do you expect to break even?",
    systemPrompt: "Guide the user through calculating their break-even point. Help them understand the relationship between fixed costs, variable costs, and revenue. Focus on units sold or revenue needed to break even, and the estimated timeline. Ask one question at a time and be specific. If they ask for examples, provide 2-3 concrete examples relevant to their industry.",
    dataFormatter: (data) => {
      // Simple formatting function for break-even analysis data
      const parts = [];
      
      if (data.fixedCostsTotal) {
        parts.push('### Total Fixed Costs\n' + data.fixedCostsTotal + '\n');
      }
      
      if (data.variableCostPerUnit) {
        parts.push('### Variable Cost Per Unit\n' + data.variableCostPerUnit + '\n');
      }
      
      if (data.sellingPricePerUnit) {
        parts.push('### Selling Price Per Unit\n' + data.sellingPricePerUnit + '\n');
      }
      
      if (data.contributionMargin) {
        parts.push('### Contribution Margin\n' + data.contributionMargin + '\n');
      }
      
      if (data.breakEvenUnits) {
        parts.push('### Break-Even Point (Units)\n' + data.breakEvenUnits + '\n');
      }
      
      if (data.breakEvenRevenue) {
        parts.push('### Break-Even Point (Revenue)\n' + data.breakEvenRevenue + '\n');
      }
      
      if (data.breakEvenTimeline) {
        parts.push('### Estimated Break-Even Timeline\n' + data.breakEvenTimeline + '\n');
      }
      
      if (data.breakEvenAnalysis) {
        parts.push('### Break-Even Analysis\n' + data.breakEvenAnalysis + '\n');
      }
      
      return parts.join('\n');
    },
    prompts: [
      "I've never done a break-even analysis before - can you explain it simply?",
      "My business has multiple products/services - how do I calculate my break-even point?",
      "What factors most influence how quickly I'll reach profitability?",
      "Help me understand what happens to my break-even point if my costs increase",
      "Is my expected break-even timeline realistic for my industry?"
    ]
  },
  'fundingRequirements': {
    id: 'fundingRequirements',
    title: 'Funding Requirements',
    description: 'Outline how much funding you need and how it will be used',
    apiEndpoint: '/financial-plan/funding-requirements',
    initialMessage: "Let's outline your funding requirements. How much total funding do you need and for what purposes?",
    systemPrompt: "Guide the user through defining their funding requirements. Help them identify how much funding they need, what it will be used for, and potential funding sources. Focus on creating a realistic funding plan that aligns with their business goals. Ask one question at a time and be specific. If they ask for examples, provide 2-3 concrete examples relevant to their industry.",
    dataFormatter: (data) => {
      // Simple formatting function for funding requirements data
      const parts = [];
      
      if (data.totalFundingNeeded) {
        parts.push('### Total Funding Required\n' + data.totalFundingNeeded + '\n');
      }
      
      if (data.useOfFunds) {
        parts.push('### Use of Funds\n' + data.useOfFunds + '\n');
      }
      
      if (data.fundingSources) {
        parts.push('### Potential Funding Sources\n' + data.fundingSources + '\n');
      }
      
      if (data.equityVsDebt) {
        parts.push('### Equity vs. Debt Breakdown\n' + data.equityVsDebt + '\n');
      }
      
      if (data.fundingTimeline) {
        parts.push('### Funding Timeline\n' + data.fundingTimeline + '\n');
      }
      
      if (data.returnOnInvestment) {
        parts.push('### Expected Return on Investment\n' + data.returnOnInvestment + '\n');
      }
      
      return parts.join('\n');
    },
    prompts: [
      "I'm not sure how much funding I actually need - can you help me figure it out?",
      "What funding options are available for someone with limited personal resources?",
      "Help me create a compelling use-of-funds section for my business plan",
      "How do I approach potential investors with my funding requirements?",
      "What should I prepare before meeting with a bank about a business loan?"
    ]
  },
  'financialMetrics': {
    id: 'financialMetrics',
    title: 'Financial Metrics',
    description: 'Define key financial metrics and ratios to track',
    apiEndpoint: '/financial-plan/financial-metrics',
    initialMessage: "Let's identify the key financial metrics and ratios you'll track for your business. Which financial indicators will be most important for measuring your success?",
    systemPrompt: "Guide the user through identifying key financial metrics for their business. Focus on profitability ratios, liquidity ratios, efficiency ratios, and growth metrics. Help them understand which metrics are most relevant to their specific business model and industry. Ask one question at a time and be specific. If they ask for examples, provide 2-3 concrete examples relevant to their industry.",
    dataFormatter: (data) => {
      // Simple formatting function for financial metrics data
      const parts = [];
      
      if (data.profitabilityRatios) {
        parts.push('### Profitability Ratios\n' + data.profitabilityRatios + '\n');
      }
      
      if (data.liquidityRatios) {
        parts.push('### Liquidity Ratios\n' + data.liquidityRatios + '\n');
      }
      
      if (data.efficiencyRatios) {
        parts.push('### Efficiency Ratios\n' + data.efficiencyRatios + '\n');
      }
      
      if (data.growthMetrics) {
        parts.push('### Growth Metrics\n' + data.growthMetrics + '\n');
      }
      
      if (data.cashFlowMetrics) {
        parts.push('### Cash Flow Metrics\n' + data.cashFlowMetrics + '\n');
      }
      
      if (data.targetValues) {
        parts.push('### Target Values\n' + data.targetValues + '\n');
      }
      
      if (data.reviewFrequency) {
        parts.push('### Review Frequency\n' + data.reviewFrequency + '\n');
      }
      
      return parts.join('\n');
    },
    prompts: [
      "I find financial metrics confusing - can you explain which ones really matter for my business?",
      "What financial warning signs should I watch for in my first year?",
      "Help me set up a simple system to track my key financial metrics",
      "How often should I review different financial metrics?",
      "What metrics will investors or lenders focus on when evaluating my business?"
    ]
  },
  'missionStatement': {
    id: 'missionStatement',
    title: 'Mission Statement',
    description: 'Define the core purpose and focus of your business',
    apiEndpoint: '/business-description',
    initialMessage: 'Let\'s develop a clear mission statement for your business. A good mission statement explains what your company does, who it serves, and what makes it unique. What is the core purpose of your business?',
    systemPrompt: 'Guide the user in creating a concise, impactful mission statement. Help them articulate their business purpose, values, and vision in a way that resonates with customers and stakeholders. Ask questions to clarify their unique value proposition and core principles. If they ask for examples, provide 2-3 diverse examples from different industries that match their business type. Keep the conversation focused on defining their mission statement elements: purpose, values, vision, and stakeholders.',
    dataFormatter: (data) => {
      // Format mission statement data into readable text
      let formattedText = '';
      
      if (data.missionStatement) {
        formattedText += `## Mission Statement\n\n${data.missionStatement}\n\n`;
      }
      
      if (data.vision) {
        formattedText += `## Vision\n\n${data.vision}\n\n`;
      }
      
      if (data.coreValues && data.coreValues.length > 0) {
        formattedText += `## Core Values\n\n`;
        data.coreValues.forEach((value: string, index: number) => {
          formattedText += `${index + 1}. ${value}\n`;
        });
        formattedText += '\n';
      }
      
      if (data.purpose) {
        formattedText += `## Purpose\n\n${data.purpose}\n\n`;
      }
      
      return formattedText;
    },
    prompts: [
      "What is the core purpose of your business?",
      "Can you guide me step by step to create a compelling mission statement?",
      "I'm not sure about my core values, can you help me identify them?",
      "Show me some examples of good mission statements in my industry",
      "How do I make my mission statement stand out from competitors?"
    ]
  },
  'businessModel': {
    id: 'businessModel',
    title: 'Business Model',
    description: 'Explain how your business will create, deliver, and capture value',
    apiEndpoint: '/business-description',
    initialMessage: 'Let\'s outline your business model. A business model describes how your company creates, delivers, and captures value. What is your primary revenue model or how do you plan to make money?',
    systemPrompt: 'Guide the user through defining their business model using a structured framework. Help them articulate their value proposition, customer segments, channels, revenue streams, key resources, activities, partners, and cost structure. Ask focused questions about one element at a time. If they need examples, provide relevant ones from their industry. Keep responses brief and actionable.',
    dataFormatter: formatBusinessModelData,
    prompts: [
      "How will your business make money?",
      "I'm not sure which revenue model fits my business, can you explain the options?",
      "Guide me step by step through creating a business model canvas",
      "What are some successful business models in my industry?",
      "Help me identify my key resources and activities"
    ]
  },
  'businessStructure': {
    id: 'businessStructure',
    title: 'Business Structure',
    description: 'Define your business\'s legal structure, organization, and team',
    apiEndpoint: '/business-description',
    initialMessage: 'Let\'s define your business structure. This includes your legal structure (LLC, corporation, etc.), management team, ownership, and organizational hierarchy. What legal structure have you chosen or are considering for your business?',
    systemPrompt: 'Guide the user through defining their business structure, both legal and organizational. Help them understand the implications of different legal structures (sole proprietorship, LLC, corporation, etc.) and how to organize their management team. If they need guidance on a specific structure, provide concise explanations of pros and cons for their business size and industry. Keep the focus on practical decisions they need to make.',
    dataFormatter: (data) => {
      // Format business structure data into readable text
      let formattedText = '';
      
      if (data.legalStructure) {
        formattedText += `## Legal Structure\n\n${data.legalStructure}\n\n`;
      }
      
      if (data.ownershipStructure) {
        formattedText += `## Ownership Structure\n\n${data.ownershipStructure}\n\n`;
      }
      
      if (data.managementTeam) {
        formattedText += `## Management Team\n\n${data.managementTeam}\n\n`;
      }
      
      if (data.organizationalChart) {
        formattedText += `## Organizational Chart\n\n${data.organizationalChart}\n\n`;
      }
      
      if (data.advisorsBoard) {
        formattedText += `## Advisors and Board Members\n\n${data.advisorsBoard}\n\n`;
      }
      
      return formattedText;
    },
    prompts: [
      "I'm not sure which legal structure is best for my business, can you help me decide?",
      "Guide me step by step through setting up my management structure",
      "What roles should I consider for my initial team?",
      "How should I distribute ownership in my business?",
      "What advisors or board members would benefit my type of business?"
    ]
  },
  'industryBackground': {
    id: 'industryBackground',
    title: 'Industry Background',
    description: 'Provide context on your industry, market trends, and competition',
    apiEndpoint: '/business-description',
    initialMessage: 'Let\'s analyze your industry background. This helps establish context for your business plan by showing your understanding of the market landscape. What industry are you in, and what are the key trends shaping it?',
    systemPrompt: 'Guide the user through an industry analysis that demonstrates market insight. Help them identify key trends, market size, growth rate, major players, barriers to entry, and regulatory considerations. Ask focused questions to draw out information on the competitive landscape and where their business fits. If needed, suggest sources they might consult for industry data. Keep the conversation practical and focused on elements that will affect their business strategy.',
    dataFormatter: (data) => {
      // Format industry background data into readable text
      let formattedText = '';
      
      if (data.industryOverview) {
        formattedText += `## Industry Overview\n\n${data.industryOverview}\n\n`;
      }
      
      if (data.marketSize) {
        formattedText += `## Market Size and Growth\n\n${data.marketSize}\n\n`;
      }
      
      if (data.keyTrends) {
        formattedText += `## Key Industry Trends\n\n${data.keyTrends}\n\n`;
      }
      
      if (data.competitiveLandscape) {
        formattedText += `## Competitive Landscape\n\n${data.competitiveLandscape}\n\n`;
      }
      
      if (data.regulatoryEnvironment) {
        formattedText += `## Regulatory Environment\n\n${data.regulatoryEnvironment}\n\n`;
      }
      
      return formattedText;
    },
    prompts: [
      "Guide me step by step through analyzing my industry",
      "I'm not sure about the current trends in my industry, can you help?",
      "How do I identify my main competitors and their strengths?",
      "What information should I include about market size and growth?",
      "Help me understand the regulatory considerations for my industry"
    ]
  }
};

/**
 * Data formatting functions for each section type
 */

/**
 * Format vision data to markdown
 */
export function formatVisionData(data: VisionData): string {
  const parts = [];
  
  if (data.longTermVision) {
    parts.push('### Long-Term Vision\n' + data.longTermVision + '\n');
  }
  
  if (data.yearOneGoals?.length) {
    parts.push('### First Year Goals\n' + data.yearOneGoals.map(g => '- ' + g).join('\n') + '\n');
  }
  
  if (data.yearThreeGoals?.length) {
    parts.push('### Three-Year Goals\n' + data.yearThreeGoals.map(g => '- ' + g).join('\n') + '\n');
  }
  
  if (data.yearFiveGoals?.length) {
    parts.push('### Five-Year Goals\n' + data.yearFiveGoals.map(g => '- ' + g).join('\n') + '\n');
  }
  
  if (data.alignmentExplanation) {
    parts.push('### Goal Alignment\n' + data.alignmentExplanation);
  }
  
  return parts.join('\n');
}

/**
 * Format products data to markdown
 */
export function formatProductsData(data: ProductsData): string {
  const parts = [];
  
  if (data.offerings?.length) {
    parts.push('### Products/Services Offered\n' + data.offerings.map(o => '- ' + o).join('\n') + '\n');
  }
  
  if (data.differentiation) {
    parts.push('### Differentiation Factors\n' + data.differentiation + '\n');
  }
  
  if (data.valueProposition) {
    parts.push('### Value Proposition\n' + data.valueProposition + '\n');
  }
  
  if (data.competitiveAdvantage) {
    parts.push('### Competitive Advantage\n' + data.competitiveAdvantage + '\n');
  }
  
  if (data.sustainabilityStrategy) {
    parts.push('### Sustainability Strategy\n' + data.sustainabilityStrategy);
  }
  
  return parts.join('\n');
}

/**
 * Format markets data to markdown
 */
export function formatMarketsData(data: any): string {
  const parts = [];
  
  if (data.targetCustomers) {
    parts.push('### Target Customers\n' + data.targetCustomers + '\n');
  }
  
  if (data.marketSegments?.length) {
    parts.push('### Market Segments\n' + data.marketSegments.map((s: string) => '- ' + s).join('\n') + '\n');
  }
  
  if (data.marketSize) {
    parts.push('### Market Size\n' + data.marketSize + '\n');
  }
  
  if (data.customerDemographics) {
    parts.push('### Customer Demographics\n' + data.customerDemographics + '\n');
  }
  
  if (data.customerAcquisition) {
    parts.push('### Customer Acquisition Strategy\n' + data.customerAcquisition);
  }
  
  return parts.join('\n');
}

/**
 * Format distribution data to markdown
 */
export function formatDistributionData(data: any): string {
  const parts = [];
  
  if (data.distributionMethods) {
    parts.push('### Distribution Methods\n' + data.distributionMethods + '\n');
  }
  
  if (data.distributionChannels?.length) {
    parts.push('### Distribution Channels\n' + data.distributionChannels.map((c: string) => '- ' + c).join('\n') + '\n');
  }
  
  if (data.innovativeApproaches) {
    parts.push('### Innovative Distribution Approaches\n' + data.innovativeApproaches + '\n');
  }
  
  if (data.logisticsManagement) {
    parts.push('### Logistics Management\n' + data.logisticsManagement + '\n');
  }
  
  if (data.distributionCosts) {
    parts.push('### Distribution Costs\n' + data.distributionCosts);
  }
  
  return parts.join('\n');
}

/**
 * Format market positioning data to markdown
 */
export function formatMarketPositioningData(data: MarketPositioningData): string {
  const parts = [];
  
  if (data.targetAudience) {
    parts.push('### Target Audience\n' + data.targetAudience + '\n');
  }
  
  if (data.customerSegments?.length) {
    parts.push('### Customer Segments\n' + data.customerSegments.map(segment => '- ' + segment).join('\n') + '\n');
  }
  
  if (data.positioningStatement) {
    parts.push('### Positioning Statement\n' + data.positioningStatement + '\n');
  }
  
  if (data.uniqueValueProposition) {
    parts.push('### Unique Value Proposition\n' + data.uniqueValueProposition + '\n');
  }
  
  if (data.competitiveAnalysis) {
    parts.push('### Competitive Analysis\n' + data.competitiveAnalysis + '\n');
  }
  
  if (data.marketDifferentiators?.length) {
    parts.push('### Market Differentiators\n' + data.marketDifferentiators.map(diff => '- ' + diff).join('\n') + '\n');
  }
  
  return parts.join('\n');
}

/**
 * Format pricing strategy data to markdown
 */
export function formatPricingStrategyData(data: PricingStrategyData): string {
  const parts = [];
  
  if (data.pricingModel) {
    parts.push('### Pricing Model\n' + data.pricingModel + '\n');
  }
  
  if (data.pricingTiers?.length) {
    parts.push('### Pricing Tiers\n');
    data.pricingTiers.forEach(tier => {
      parts.push(`#### ${tier.name} - ${tier.price}\n`);
      tier.features.forEach(feature => {
        parts.push(`- ${feature}`);
      });
      parts.push('\n');
    });
  }
  
  if (data.competitivePricing) {
    parts.push('### Competitive Pricing Analysis\n' + data.competitivePricing + '\n');
  }
  
  if (data.profitMargins) {
    parts.push('### Profit Margins\n' + data.profitMargins + '\n');
  }
  
  if (data.discountStrategy) {
    parts.push('### Discount Strategy\n' + data.discountStrategy + '\n');
  }
  
  if (data.pricingRationale) {
    parts.push('### Pricing Rationale\n' + data.pricingRationale);
  }
  
  return parts.join('\n');
}

/**
 * Format promotional activities data to markdown
 */
export function formatPromotionalActivitiesData(data: PromotionalActivitiesData): string {
  const parts = [];
  
  if (data.advertisingChannels?.length) {
    parts.push('### Advertising Channels\n' + data.advertisingChannels.map(channel => '- ' + channel).join('\n') + '\n');
  }
  
  if (data.socialMediaStrategy) {
    parts.push('### Social Media Strategy\n' + data.socialMediaStrategy + '\n');
  }
  
  if (data.contentMarketing) {
    parts.push('### Content Marketing\n' + data.contentMarketing + '\n');
  }
  
  if (data.prActivities?.length) {
    parts.push('### PR Activities\n' + data.prActivities.map(activity => '- ' + activity).join('\n') + '\n');
  }
  
  if (data.partnershipOpportunities?.length) {
    parts.push('### Partnership Opportunities\n' + data.partnershipOpportunities.map(opportunity => '- ' + opportunity).join('\n') + '\n');
  }
  
  if (data.campaignIdeas?.length) {
    parts.push('### Campaign Ideas\n' + data.campaignIdeas.map(idea => '- ' + idea).join('\n') + '\n');
  }
  
  if (data.marketingBudget) {
    parts.push('### Marketing Budget\n' + data.marketingBudget);
  }
  
  return parts.join('\n');
}

/**
 * Format sales strategy data to markdown
 */
export function formatSalesStrategyData(data: SalesStrategyData): string {
  const parts = [];
  
  if (data.salesProcess) {
    parts.push('### Sales Process\n' + data.salesProcess + '\n');
  }
  
  if (data.salesChannels?.length) {
    parts.push('### Sales Channels\n' + data.salesChannels.map(channel => '- ' + channel).join('\n') + '\n');
  }
  
  if (data.salesTeamStructure) {
    parts.push('### Sales Team Structure\n' + data.salesTeamStructure + '\n');
  }
  
  if (data.conversionMetrics?.length) {
    parts.push('### Conversion Metrics\n');
    data.conversionMetrics.forEach(metric => {
      parts.push(`- **${metric.metric}**: Target - ${metric.target}`);
    });
    parts.push('\n');
  }
  
  if (data.salesForecast) {
    parts.push('### Sales Forecast\n' + data.salesForecast + '\n');
  }
  
  if (data.customerRetention) {
    parts.push('### Customer Retention Strategy\n' + data.customerRetention);
  }
  
  return parts.join('\n');
}

/**
 * Format legal structure data to markdown
 */
export function formatLegalStructureData(data: LegalStructureData): string {
  const parts = [];
  
  if (data.businessType) {
    parts.push('### Business Entity Type\n' + data.businessType + '\n');
  }
  
  if (data.ownershipStructure) {
    parts.push('### Ownership Structure\n' + data.ownershipStructure + '\n');
  }
  
  if (data.regulatoryRequirements?.length) {
    parts.push('### Regulatory Requirements\n' + data.regulatoryRequirements.map(req => '- ' + req).join('\n') + '\n');
  }
  
  if (data.intellectualProperty?.length) {
    parts.push('### Intellectual Property\n' + data.intellectualProperty.map(ip => '- ' + ip).join('\n') + '\n');
  }
  
  if (data.liabilityConsiderations) {
    parts.push('### Liability Considerations\n' + data.liabilityConsiderations + '\n');
  }
  
  if (data.taxImplications) {
    parts.push('### Tax Implications\n' + data.taxImplications);
  }
  
  return parts.join('\n');
}

/**
 * Format production process data to markdown
 */
export function formatProductionData(data: ProductionProcessData): string {
  let markdown = '## Production Process\n\n';
  
  if (data.processOverview) {
    markdown += '### Process Overview\n';
    markdown += data.processOverview + '\n\n';
  }
  
  if (data.processSteps && data.processSteps.length > 0) {
    markdown += '### Production Steps\n';
    data.processSteps.forEach((step, index) => {
      markdown += `${index + 1}. ${step}\n`;
    });
    markdown += '\n';
  }
  
  if (data.equipmentAndTechnology) {
    markdown += '### Equipment & Technology\n';
    markdown += data.equipmentAndTechnology + '\n\n';
  }
  
  if (data.productionTimeline) {
    markdown += '### Production Timeline\n';
    markdown += data.productionTimeline + '\n\n';
  }
  
  if (data.capacityManagement) {
    markdown += '### Capacity Management\n';
    markdown += data.capacityManagement + '\n\n';
  }
  
  if (data.outsourcingStrategy) {
    markdown += '### Outsourcing Strategy\n';
    markdown += data.outsourcingStrategy + '\n\n';
  }
  
  if (data.productionCosts) {
    markdown += '### Production Costs\n';
    markdown += data.productionCosts + '\n\n';
  }
  
  return markdown;
}

/**
 * Format quality control data to markdown
 */
export function formatQualityControlData(data: QualityControlData): string {
  let markdown = '## Quality Control\n\n';
  
  if (data.qualityStandards) {
    markdown += '### Quality Standards\n';
    markdown += data.qualityStandards + '\n\n';
  }
  
  if (data.qualityProcesses && data.qualityProcesses.length > 0) {
    markdown += '### Quality Control Processes\n';
    data.qualityProcesses.forEach((process, index) => {
      markdown += `${index + 1}. ${process}\n`;
    });
    markdown += '\n';
  }
  
  if (data.testingProcedures) {
    markdown += '### Testing Procedures\n';
    markdown += data.testingProcedures + '\n\n';
  }
  
  if (data.qualityMetrics && data.qualityMetrics.length > 0) {
    markdown += '### Quality Metrics\n';
    data.qualityMetrics.forEach((metric, index) => {
      markdown += `- ${metric}\n`;
    });
    markdown += '\n';
  }
  
  if (data.complianceRequirements) {
    markdown += '### Compliance Requirements\n';
    markdown += data.complianceRequirements + '\n\n';
  }
  
  if (data.qualityTeam) {
    markdown += '### Quality Team\n';
    markdown += data.qualityTeam + '\n\n';
  }
  
  if (data.improvementProcess) {
    markdown += '### Continuous Improvement\n';
    markdown += data.improvementProcess + '\n\n';
  }
  
  return markdown;
}

/**
 * Format inventory management data to markdown
 */
export function formatInventoryData(data: InventoryManagementData): string {
  let markdown = '## Inventory Management\n\n';
  
  if (data.inventorySystem) {
    markdown += '### Inventory System\n';
    markdown += data.inventorySystem + '\n\n';
  }
  
  if (data.trackingMethods) {
    markdown += '### Tracking Methods\n';
    markdown += data.trackingMethods + '\n\n';
  }
  
  if (data.reorderProcess) {
    markdown += '### Reorder Process\n';
    markdown += data.reorderProcess + '\n\n';
  }
  
  if (data.storageApproach) {
    markdown += '### Storage & Warehousing\n';
    markdown += data.storageApproach + '\n\n';
  }
  
  if (data.supplierManagement) {
    markdown += '### Supplier Management\n';
    markdown += data.supplierManagement + '\n\n';
  }
  
  if (data.wastageControls) {
    markdown += '### Wastage Controls\n';
    markdown += data.wastageControls + '\n\n';
  }
  
  if (data.inventoryCosts) {
    markdown += '### Inventory Costs\n';
    markdown += data.inventoryCosts + '\n\n';
  }
  
  return markdown;
}

/**
 * Format KPI data to markdown
 */
export function formatKPIData(data: KPIData): string {
  let markdown = '## Key Performance Indicators\n\n';
  
  if (data.financialKPIs && data.financialKPIs.length > 0) {
    markdown += '### Financial KPIs\n';
    data.financialKPIs.forEach((kpi) => {
      markdown += `- ${kpi}\n`;
    });
    markdown += '\n';
  }
  
  if (data.operationalKPIs && data.operationalKPIs.length > 0) {
    markdown += '### Operational KPIs\n';
    data.operationalKPIs.forEach((kpi) => {
      markdown += `- ${kpi}\n`;
    });
    markdown += '\n';
  }
  
  if (data.customerKPIs && data.customerKPIs.length > 0) {
    markdown += '### Customer KPIs\n';
    data.customerKPIs.forEach((kpi) => {
      markdown += `- ${kpi}\n`;
    });
    markdown += '\n';
  }
  
  if (data.employeeKPIs && data.employeeKPIs.length > 0) {
    markdown += '### Employee KPIs\n';
    data.employeeKPIs.forEach((kpi) => {
      markdown += `- ${kpi}\n`;
    });
    markdown += '\n';
  }
  
  if (data.trackingMethods) {
    markdown += '### Tracking Methods\n';
    markdown += data.trackingMethods + '\n\n';
  }
  
  if (data.reviewProcess) {
    markdown += '### Review Process\n';
    markdown += data.reviewProcess + '\n\n';
  }
  
  if (data.improvementStrategy) {
    markdown += '### Improvement Strategy\n';
    markdown += data.improvementStrategy + '\n\n';
  }
  
  return markdown;
}

/**
 * Format technology systems data to markdown
 */
export function formatTechnologyData(data: TechnologySystemsData): string {
  let markdown = '## Technology & Systems\n\n';
  
  if (data.coreSystemsUsed && data.coreSystemsUsed.length > 0) {
    markdown += '### Core Systems\n';
    data.coreSystemsUsed.forEach((system) => {
      markdown += `- ${system}\n`;
    });
    markdown += '\n';
  }
  
  if (data.softwareApplications && data.softwareApplications.length > 0) {
    markdown += '### Software Applications\n';
    data.softwareApplications.forEach((app) => {
      markdown += `- ${app}\n`;
    });
    markdown += '\n';
  }
  
  if (data.dataManagement) {
    markdown += '### Data Management\n';
    markdown += data.dataManagement + '\n\n';
  }
  
  if (data.cybersecurity) {
    markdown += '### Cybersecurity\n';
    markdown += data.cybersecurity + '\n\n';
  }
  
  if (data.techInvestments) {
    markdown += '### Technology Investments\n';
    markdown += data.techInvestments + '\n\n';
  }
  
  if (data.maintenanceStrategy) {
    markdown += '### Maintenance Strategy\n';
    markdown += data.maintenanceStrategy + '\n\n';
  }
  
  if (data.techIntegration) {
    markdown += '### System Integration\n';
    markdown += data.techIntegration + '\n\n';
  }
  
  return markdown;
}

/**
 * Format business model data to markdown
 */
export function formatBusinessModelData(data: BusinessModelData): string {
  const parts = [];
  
  if (data.valueProposition) {
    parts.push('### Value Proposition\n' + data.valueProposition + '\n');
  }
  
  if (data.customerSegments) {
    if (Array.isArray(data.customerSegments)) {
      parts.push('### Customer Segments\n' + data.customerSegments.map(segment => '- ' + segment).join('\n') + '\n');
    } else {
      parts.push('### Customer Segments\n' + data.customerSegments + '\n');
    }
  }
  
  if (data.revenueStreams) {
    if (Array.isArray(data.revenueStreams)) {
      parts.push('### Revenue Streams\n' + data.revenueStreams.map(stream => '- ' + stream).join('\n') + '\n');
    } else {
      parts.push('### Revenue Streams\n' + data.revenueStreams + '\n');
    }
  }
  
  if (data.keyResources) {
    if (Array.isArray(data.keyResources)) {
      parts.push('### Key Resources\n' + data.keyResources.map(resource => '- ' + resource).join('\n') + '\n');
    } else {
      parts.push('### Key Resources\n' + data.keyResources + '\n');
    }
  }
  
  if (data.keyActivities) {
    if (Array.isArray(data.keyActivities)) {
      parts.push('### Key Activities\n' + data.keyActivities.map(activity => '- ' + activity).join('\n') + '\n');
    } else {
      parts.push('### Key Activities\n' + data.keyActivities + '\n');
    }
  }
  
  if (data.keyPartners) {
    if (Array.isArray(data.keyPartners)) {
      parts.push('### Key Partners\n' + data.keyPartners.map(partner => '- ' + partner).join('\n') + '\n');
    } else {
      parts.push('### Key Partners\n' + data.keyPartners + '\n');
    }
  }
  
  if (data.costStructure) {
    parts.push('### Cost Structure\n' + data.costStructure + '\n');
  }
  
  if (data.channels) {
    if (Array.isArray(data.channels)) {
      parts.push('### Distribution Channels\n' + data.channels.map(channel => '- ' + channel).join('\n') + '\n');
    } else {
      parts.push('### Distribution Channels\n' + data.channels + '\n');
    }
  }
  
  return parts.join('\n');
} 