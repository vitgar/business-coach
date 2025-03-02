/**
 * Business Plan Types
 * 
 * This file defines the TypeScript interfaces for the business plan structure.
 * It follows the comprehensive business plan outline with all sections.
 */

// Legacy types maintained for backward compatibility
export interface ExecutiveSummaryData {
  id?: string
  visionAndGoals: string
  productsOrServices: string
  targetMarket: string
  distributionStrategy: string
  businessPlanId?: string
}

export interface BusinessPlanData {
  id: string
  title: string
  status: 'draft' | 'completed'
  content?: BusinessPlanContent
  createdAt: string
  updatedAt: string
  userId: string
}

// Legacy section types maintained for backward compatibility
export type BusinessPlanSection = 
  | 'visionAndGoals'
  | 'productsOrServices'
  | 'targetMarket'
  | 'distributionStrategy'

/**
 * New comprehensive business plan structure
 */

// 1. Cover Page
export interface CoverPage {
  businessName: string
  tagline?: string
  businessAddress: string
  contactInfo: string
  date: string
  confidentialityStatement?: string
  logo?: string
}

// 2. Table of Contents
export interface TableOfContents {
  sections: string[]
}

// 3. Executive Summary
export interface ComprehensiveExecutiveSummary {
  businessConcept: string
  missionStatement: string
  productsOverview: string
  marketOpportunity?: string
  financialHighlights?: string
  managementTeam?: string
  milestones?: string
}

// 4. Company Description
export interface MissionVisionValues {
  mission: string
  vision: string
  values: string[]
}

export interface CompanyDescription {
  businessStructure: string
  legalStructure: string
  ownershipDetails: string
  companyHistory: string
  missionVisionValues: MissionVisionValues
  locations: string[]
  keyMilestones: string[]
}

// 5. Products and Services
export interface ProductDescription {
  name: string
  description: string
  features?: string[]
  benefits?: string[]
  stage?: string
  pricing?: string
}

export interface ProductsAndServices {
  overview: string
  detailedDescriptions: ProductDescription[]
  valueProposition: string
  intellectualProperty?: string
  futureProducts?: string
}

// 6. Market Analysis
export interface MarketSegment {
  segment: string
  size: string
  characteristics: string
}

export interface Competitor {
  name: string
  strengths: string
  weaknesses: string
}

export interface CompetitiveAnalysis {
  directCompetitors: Competitor[]
  indirectCompetitors: string[]
}

export interface SwotAnalysis {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

export interface MarketAnalysis {
  industryOverview: string
  marketSize: string
  targetMarket: string
  marketSegmentation: MarketSegment[]
  competitiveAnalysis: CompetitiveAnalysis
  swotAnalysis: SwotAnalysis
  regulatoryFactors?: string
}

// 7. Marketing and Sales Strategy
export interface MarketingStrategy {
  branding: string
  pricing: string
  promotion: string
  salesStrategy: string
  channels: string[]
  customerRetention: string
  partnerships?: string
}

// 8. Operations Plan
export interface OperationsPlan {
  businessModel: string
  facilities: string
  technology: string
  productionProcess: string
  qualityControl: string
  logistics: string
  suppliers?: string[]
  inventory?: string
}

// 9. Organization and Management
export interface TeamMember {
  name: string
  position: string
  background: string
}

export interface Advisor {
  name: string
  expertise: string
}

export interface OrganizationAndManagement {
  structure: string
  managementTeam: TeamMember[]
  advisors?: Advisor[]
  hrPlan: string
  governance?: string
}

// 10. Financial Plan
export interface FinancialProjection {
  revenue: string
  expenses: string
  netProfit: string
}

export interface FinancialPlan {
  projections: {
    yearOne: FinancialProjection
    yearTwo: FinancialProjection
    yearThree: FinancialProjection
  }
  fundingNeeds: string
  useOfFunds: string[]
  exitStrategy?: string
  breakEvenAnalysis?: string
}

// 11. Risk Analysis
export interface Risk {
  risk: string
  impact: 'Low' | 'Medium' | 'High'
  probability: 'Low' | 'Medium' | 'High'
  mitigation: string
}

export interface RiskAnalysis {
  keyRisks: Risk[]
  contingencyPlans: string
  insurance?: string
}

// 12. Implementation Timeline
export interface QuarterlyMilestone {
  quarter: string
  milestones: string[]
}

export interface ImplementationTimeline {
  quarters: QuarterlyMilestone[]
  keyPerformanceIndicators: string[]
}

// 13. Appendices
export interface Appendices {
  documents: string[]
}

// 14. Document Control
export interface DocumentControl {
  version: string
  lastUpdated: string
  approvedBy: string
}

// Complete Business Plan Content Structure
export interface BusinessPlanContent {
  coverPage: CoverPage
  tableOfContents?: TableOfContents
  executiveSummary: ComprehensiveExecutiveSummary
  companyDescription?: CompanyDescription
  productsAndServices?: ProductsAndServices
  marketAnalysis?: MarketAnalysis
  marketingStrategy?: MarketingStrategy
  operationsPlan?: OperationsPlan
  organizationAndManagement?: OrganizationAndManagement
  financialPlan?: FinancialPlan
  riskAnalysis?: RiskAnalysis
  implementationTimeline?: ImplementationTimeline
  appendices?: Appendices
  documentControl?: DocumentControl
}

// Section identifiers for the new structure
export type BusinessPlanContentSection = keyof BusinessPlanContent 