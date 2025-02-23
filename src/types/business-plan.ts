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
  executiveSummary?: ExecutiveSummaryData
  createdAt: string
  updatedAt: string
  userId: string
}

export type BusinessPlanSection = 
  | 'visionAndGoals'
  | 'productsOrServices'
  | 'targetMarket'
  | 'distributionStrategy' 