'use client'

import { useState, useEffect, useRef } from 'react'
import { HelpCircle, ChevronDown, ChevronRight, Save, Printer, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { Document, Packer, Paragraph, HeadingLevel, TextRun, BorderStyle, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

/**
 * Business Plan Editor Component Props
 */
interface BusinessPlanEditorProps {
  businessPlan: any
  currentSection: string
  onSave: (sectionData: any) => void
}

/**
 * Field definition for form fields
 */
interface FieldDefinition {
  id: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select'
  placeholder: string
  help?: string
  options?: { value: string, label: string }[] // For select fields
}

/**
 * Helper function to prepare AI context from other business plan sections
 * This consolidates relevant information from other sections to help the AI
 * generate better executive summary content
 */
const prepareAIContext = (businessPlan: any, currentField: string) => {
  if (!businessPlan?.content) return '';
  
  const content = businessPlan.content;
  let contextData = '';
  
  // For the Business Concept field, include information from Company Description,
  // Products/Services, and Market Analysis
  if (currentField === 'businessConcept') {
    // Add Company Description context
    if (content.companyDescription) {
      const cd = content.companyDescription;
      if (cd.businessStructure) {
        contextData += `Business Structure: ${cd.businessStructure}\n\n`;
      }
      if (cd.legalStructureDetails) {
        contextData += `Legal Structure: ${cd.legalStructureDetails}\n\n`;
      }
      if (cd.ownershipDetails) {
        contextData += `Ownership: ${cd.ownershipDetails}\n\n`;
      }
    }
    
    // Add Products and Services context
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Products/Services: ${ps.overview}\n\n`;
      }
      if (ps.valueProposition) {
        contextData += `Value Proposition: ${ps.valueProposition}\n\n`;
      }
    }
    
    // Add Market Analysis context
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.industryOverview) {
        contextData += `Industry: ${ma.industryOverview}\n\n`;
      }
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
    }
  }
  
  // For the Products Overview field, include relevant product information
  else if (currentField === 'productsOverview') {
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Products/Services: ${ps.overview}\n\n`;
      }
      if (ps.valueProposition) {
        contextData += `Value Proposition: ${ps.valueProposition}\n\n`;
      }
      if (ps.intellectualProperty) {
        contextData += `IP: ${ps.intellectualProperty}\n\n`;
      }
    }
  }
  
  // For the Market Opportunity field, include market analysis information
  else if (currentField === 'marketOpportunity') {
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.industryOverview) {
        contextData += `Industry: ${ma.industryOverview}\n\n`;
      }
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
      if (ma.marketSegmentation) {
        contextData += `Market Segments: ${ma.marketSegmentation}\n\n`;
      }
      if (ma.competitiveAnalysis) {
        contextData += `Competition: ${ma.competitiveAnalysis}\n\n`;
      }
    }
  }
  
  // For Financial Highlights, include info from the financial plan
  else if (currentField === 'financialHighlights') {
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.projections) {
        contextData += `Financial Projections: ${fp.projections}\n\n`;
      }
      if (fp.fundingNeeds) {
        contextData += `Funding Needs: ${fp.fundingNeeds}\n\n`;
      }
      if (fp.breakEvenAnalysis) {
        contextData += `Break-Even: ${fp.breakEvenAnalysis}\n\n`;
      }
    }
  }
  
  // PRODUCTS AND SERVICES SECTION FIELDS
  // For Product/Service Overview field, include market analysis and company info
  else if (currentField === 'overview') {
    // Add Market Analysis context for better product targeting
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
      if (ma.industryOverview) {
        contextData += `Industry Context: ${ma.industryOverview}\n\n`;
      }
    }
    
    // Add Company Description context for alignment
    if (content.companyDescription) {
      const cd = content.companyDescription;
      if (cd.companyHistory) {
        contextData += `Company History: ${cd.companyHistory}\n\n`;
      }
    }
    
    // Add Executive Summary info if available
    if (content.executiveSummary) {
      const es = content.executiveSummary;
      if (es.businessConcept) {
        contextData += `Business Concept: ${es.businessConcept}\n\n`;
      }
    }
  }
  
  // For Value Proposition field, include competitive analysis and target market info
  else if (currentField === 'valueProposition') {
    // Add Market Analysis for competitive positioning
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.competitiveAnalysis) {
        contextData += `Competitive Analysis: ${ma.competitiveAnalysis}\n\n`;
      }
      if (ma.swotAnalysis) {
        contextData += `SWOT Analysis: ${ma.swotAnalysis}\n\n`;
      }
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
    }
    
    // Add Marketing Strategy for alignment with positioning
    if (content.marketingStrategy) {
      const ms = content.marketingStrategy;
      if (ms.branding) {
        contextData += `Branding Strategy: ${ms.branding}\n\n`;
      }
      if (ms.pricing) {
        contextData += `Pricing Strategy: ${ms.pricing}\n\n`;
      }
    }
    
    // Add Product/Service Overview for consistency
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Product/Service Overview: ${ps.overview}\n\n`;
      }
    }
  }
  
  // For Future Products/Services field, include strategic and financial context
  else if (currentField === 'futureProducts') {
    // Add Financial Plan context for growth planning
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.projections) {
        contextData += `Financial Projections: ${fp.projections}\n\n`;
      }
    }
    
    // Add Market Trends for future direction
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.industryOverview) {
        contextData += `Industry Trends: ${ma.industryOverview}\n\n`;
      }
    }
    
    // Add Operations Plan for implementation feasibility
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.technology) {
        contextData += `Technology Capabilities: ${op.technology}\n\n`;
      }
      if (op.businessModel) {
        contextData += `Business Model: ${op.businessModel}\n\n`;
      }
    }
  }
  
  // MARKET ANALYSIS SECTION FIELDS
  // For Industry Overview field, include product and financial information
  else if (currentField === 'industryOverview') {
    // Add Products and Services context for alignment
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Products/Services: ${ps.overview}\n\n`;
      }
    }
    
    // Add Financial Plan context for market size perspective
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.projections) {
        contextData += `Financial Projections: ${fp.projections}\n\n`;
      }
    }
    
    // Add Executive Summary for business context
    if (content.executiveSummary) {
      const es = content.executiveSummary;
      if (es.businessConcept) {
        contextData += `Business Concept: ${es.businessConcept}\n\n`;
      }
    }
  }
  
  // For Target Market field, include product and marketing information
  else if (currentField === 'targetMarket') {
    // Add Products and Services context to align customer needs with product features
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Products/Services: ${ps.overview}\n\n`;
      }
      if (ps.valueProposition) {
        contextData += `Value Proposition: ${ps.valueProposition}\n\n`;
      }
    }
    
    // Add Marketing Strategy for targeting alignment
    if (content.marketingStrategy) {
      const ms = content.marketingStrategy;
      if (ms.branding) {
        contextData += `Branding Strategy: ${ms.branding}\n\n`;
      }
      if (ms.promotion) {
        contextData += `Promotion Plan: ${ms.promotion}\n\n`;
      }
    }
    
    // Add Executive Summary market opportunity
    if (content.executiveSummary) {
      const es = content.executiveSummary;
      if (es.marketOpportunity) {
        contextData += `Market Opportunity: ${es.marketOpportunity}\n\n`;
      }
    }
  }
  
  // For Market Segmentation field, include target market and marketing strategy
  else if (currentField === 'marketSegmentation') {
    // Add Target Market information as segments are subsets of overall market
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
      // Add Competitive Analysis to understand competitors' market segments
      if (ma.competitiveAnalysis) {
        contextData += `Competitive Analysis: ${ma.competitiveAnalysis}\n\n`;
      }
    }
    
    // Add Marketing Strategy information for channel alignment
    if (content.marketingStrategy) {
      const ms = content.marketingStrategy;
      if (ms.channels) {
        contextData += `Distribution Channels: ${ms.channels}\n\n`;
      }
      if (ms.customerRetention) {
        contextData += `Customer Retention: ${ms.customerRetention}\n\n`;
      }
    }
    
    // Add Value Proposition for segment-specific value
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.valueProposition) {
        contextData += `Value Proposition: ${ps.valueProposition}\n\n`;
      }
    }
  }
  
  // For Competitive Analysis field, include product and marketing information
  else if (currentField === 'competitiveAnalysis') {
    // Add Products and Services for comparison
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Products/Services: ${ps.overview}\n\n`;
      }
      if (ps.valueProposition) {
        contextData += `Value Proposition: ${ps.valueProposition}\n\n`;
      }
      if (ps.intellectualProperty) {
        contextData += `Intellectual Property: ${ps.intellectualProperty}\n\n`;
      }
    }
    
    // Add Marketing Strategy for competitive positioning
    if (content.marketingStrategy) {
      const ms = content.marketingStrategy;
      if (ms.pricing) {
        contextData += `Pricing Strategy: ${ms.pricing}\n\n`;
      }
      if (ms.branding) {
        contextData += `Branding Strategy: ${ms.branding}\n\n`;
      }
    }
  }
  
  // For Legal Structure Details field, include Business Structure and Ownership information
  else if (currentField === 'legalStructure') {
    // Add Business Structure for legal context
    if (content.companyDescription) {
      const cd = content.companyDescription;
      if (cd.businessStructure) {
        contextData += `Business Structure: ${cd.businessStructure}\n\n`;
      }
      if (cd.ownershipDetails) {
        contextData += `Ownership Details: ${cd.ownershipDetails}\n\n`;
      }
    }
  }
  
  // For Ownership Details field, include Business Structure and Funding Requirements information
  else if (currentField === 'ownershipDetails') {
    // Add Business Structure for ownership context
    if (content.companyDescription) {
      const cd = content.companyDescription;
      if (cd.businessStructure) {
        contextData += `Business Structure: ${cd.businessStructure}\n\n`;
      }
    }
    
    // Add Funding Requirements for investment/ownership context
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.fundingNeeds) {
        contextData += `Funding Requirements: ${fp.fundingNeeds}\n\n`;
      }
    }
  }
  
  // For Intellectual Property field, include Legal Structure and Product/Service Overview information
  else if (currentField === 'intellectualProperty') {
    // Add Legal Structure Details for IP context
    if (content.companyDescription) {
      const cd = content.companyDescription;
      if (cd.legalStructure) {
        contextData += `Legal Structure Details: ${cd.legalStructure}\n\n`;
      }
      if (cd.businessStructure) {
        contextData += `Business Structure: ${cd.businessStructure}\n\n`;
      }
    }
    
    // Add Product/Service Overview for IP protection context
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Product/Service Overview: ${ps.overview}\n\n`;
      }
    }
  }
  
  // For SWOT Analysis field, include information from various sections
  else if (currentField === 'swotAnalysis') {
    // Add Financial information for strengths/weaknesses
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.projections) {
        contextData += `Financial Projections: ${fp.projections}\n\n`;
      }
    }
    
    // Add Operations information for strengths/weaknesses
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.businessModel) {
        contextData += `Business Model: ${op.businessModel}\n\n`;
      }
      if (op.technology) {
        contextData += `Technology: ${op.technology}\n\n`;
      }
    }
    
    // Add Product information for strengths/weaknesses
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.valueProposition) {
        contextData += `Value Proposition: ${ps.valueProposition}\n\n`;
      }
    }
    
    // Add Competitive Analysis for threats and opportunities
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.competitiveAnalysis) {
        contextData += `Competitive Analysis: ${ma.competitiveAnalysis}\n\n`;
      }
      if (ma.industryOverview) {
        contextData += `Industry Overview: ${ma.industryOverview}\n\n`;
      }
    }
  }
  
  // MARKETING STRATEGY SECTION FIELDS
  // For Branding Strategy field, include value proposition and target market information
  else if (currentField === 'branding') {
    // Add Value Proposition to ensure branding reinforces what makes you unique
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.valueProposition) {
        contextData += `Value Proposition: ${ps.valueProposition}\n\n`;
      }
    }
    
    // Add Target Market information to ensure branding speaks to customer needs
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
      if (ma.marketSegmentation) {
        contextData += `Market Segmentation: ${ma.marketSegmentation}\n\n`;
      }
    }
  }
  
  // For Pricing Strategy field, include financial projections and competitive analysis
  else if (currentField === 'pricing') {
    // Add Financial Projections to ensure pricing is profitable
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.projections) {
        contextData += `Financial Projections: ${fp.projections}\n\n`;
      }
    }
    
    // Add Competitive Analysis to ensure pricing is competitive
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.competitiveAnalysis) {
        contextData += `Competitive Analysis: ${ma.competitiveAnalysis}\n\n`;
      }
    }
    
    // Add Value Proposition to align pricing with value delivered
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.valueProposition) {
        contextData += `Value Proposition: ${ps.valueProposition}\n\n`;
      }
    }
  }
  
  // For Promotion Plan field, include target market, market segmentation and sales strategy
  else if (currentField === 'promotion') {
    // Add Target Market and Market Segmentation to dictate where and how to advertise
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
      if (ma.marketSegmentation) {
        contextData += `Market Segmentation: ${ma.marketSegmentation}\n\n`;
      }
    }
    
    // Add Sales Strategy to ensure marketing aligns with sales goals
    if (content.marketingStrategy) {
      const ms = content.marketingStrategy;
      if (ms.salesStrategy) {
        contextData += `Sales Strategy: ${ms.salesStrategy}\n\n`;
      }
    }
    
    // Add Branding Strategy for promotional consistency
    if (content.marketingStrategy) {
      const ms = content.marketingStrategy;
      if (ms.branding) {
        contextData += `Branding Strategy: ${ms.branding}\n\n`;
      }
    }
  }
  
  // For Sales Strategy field, include product overview and pricing information
  else if (currentField === 'salesStrategy') {
    // Add Product/Service Overview to know what you're selling
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Product/Service Overview: ${ps.overview}\n\n`;
      }
    }
    
    // Add Pricing Strategy to impact how sales are structured
    if (content.marketingStrategy) {
      const ms = content.marketingStrategy;
      if (ms.pricing) {
        contextData += `Pricing Strategy: ${ms.pricing}\n\n`;
      }
    }
    
    // Add Target Market information to understand customer buying behavior
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
    }
  }
  
  // For Distribution Channels field, include logistics and competitive analysis
  else if (currentField === 'channels') {
    // Add Logistics & Supply Chain to define how products are delivered
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.logistics) {
        contextData += `Logistics & Supply Chain: ${op.logistics}\n\n`;
      }
    }
    
    // Add Competitive Analysis to understand how competitors distribute products
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.competitiveAnalysis) {
        contextData += `Competitive Analysis: ${ma.competitiveAnalysis}\n\n`;
      }
    }
    
    // Add Target Market information to align distribution channels with customer preferences
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
    }
    
    // Add Product/Service information for context on what's being distributed
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Product/Service Overview: ${ps.overview}\n\n`;
      }
    }
  }
  
  // For Customer Retention field, include sales strategy and use of funds
  else if (currentField === 'customerRetention') {
    // Add Sales Strategy to understand how customers interact with your business
    if (content.marketingStrategy) {
      const ms = content.marketingStrategy;
      if (ms.salesStrategy) {
        contextData += `Sales Strategy: ${ms.salesStrategy}\n\n`;
      }
    }
    
    // Add Use of Funds to understand budget for customer retention strategies
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.useOfFunds) {
        contextData += `Use of Funds: ${fp.useOfFunds}\n\n`;
      }
    }
    
    // Add Target Market information to customize retention strategies
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
    }
    
    // Add Value Proposition to align retention strategies with your value
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.valueProposition) {
        contextData += `Value Proposition: ${ps.valueProposition}\n\n`;
      }
    }
  }
  
  // OPERATIONS PLAN SECTION FIELDS
  // For Business Model field, include business concept and financial projections
  else if (currentField === 'businessModel') {
    // Add Business Concept to define how the business operates
    if (content.executiveSummary) {
      const es = content.executiveSummary;
      if (es.businessConcept) {
        contextData += `Business Concept: ${es.businessConcept}\n\n`;
      }
    }
    
    // Add Financial Projections to ensure the business model is viable
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.projections) {
        contextData += `Financial Projections: ${fp.projections}\n\n`;
      }
    }
    
    // Add Value Proposition to align business model with value delivery
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.valueProposition) {
        contextData += `Value Proposition: ${ps.valueProposition}\n\n`;
      }
    }
    
    // Add Target Market information to tailor business model to customer needs
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
    }
  }
  
  // For Facilities & Location field, include target market and use of funds
  else if (currentField === 'facilities') {
    // Add Target Market to ensure location is near customers if applicable
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
    }
    
    // Add Use of Funds to ensure budget for facilities is accounted for
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.useOfFunds) {
        contextData += `Use of Funds: ${fp.useOfFunds}\n\n`;
      }
    }
    
    // Add Business Model to align facilities with operational needs
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.businessModel) {
        contextData += `Business Model: ${op.businessModel}\n\n`;
      }
    }
    
    // Add Production Process for space and facility requirements
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.productionProcess) {
        contextData += `Production Process: ${op.productionProcess}\n\n`;
      }
    }
  }
  
  // For Technology Requirements field, include product overview and production process
  else if (currentField === 'technology') {
    // Add Product/Service Overview to understand if product/service requires special tech
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Product/Service Overview: ${ps.overview}\n\n`;
      }
    }
    
    // Add Production Process to understand tech needs for production methods
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.productionProcess) {
        contextData += `Production Process: ${op.productionProcess}\n\n`;
      }
    }
    
    // Add Business Model to align technology with business operations
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.businessModel) {
        contextData += `Business Model: ${op.businessModel}\n\n`;
      }
    }
    
    // Add Financial Plan to understand technology budget constraints
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.useOfFunds) {
        contextData += `Use of Funds: ${fp.useOfFunds}\n\n`;
      }
    }
  }
  
  // For Production Process field, include product overview and logistics & supply chain
  else if (currentField === 'productionProcess') {
    // Add Product/Service Overview to understand what's being produced
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Product/Service Overview: ${ps.overview}\n\n`;
      }
    }
    
    // Add Logistics & Supply Chain to ensure efficient production and delivery
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.logistics) {
        contextData += `Logistics & Supply Chain: ${op.logistics}\n\n`;
      }
    }
    
    // Add Technology Requirements for production technology context
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.technology) {
        contextData += `Technology Requirements: ${op.technology}\n\n`;
      }
    }
    
    // Add Facilities & Location for production space context
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.facilities) {
        contextData += `Facilities & Location: ${op.facilities}\n\n`;
      }
    }
  }
  
  // For Quality Control field, include production process and SWOT analysis
  else if (currentField === 'qualityControl') {
    // Add Production Process to understand QC as part of production steps
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.productionProcess) {
        contextData += `Production Process: ${op.productionProcess}\n\n`;
      }
    }
    
    // Add SWOT Analysis to identify quality risks from weaknesses
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.swotAnalysis) {
        contextData += `SWOT Analysis: ${ma.swotAnalysis}\n\n`;
      }
    }
    
    // Add Product/Service Overview to understand quality requirements
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Product/Service Overview: ${ps.overview}\n\n`;
      }
    }
    
    // Add Technology Requirements for quality control technology
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.technology) {
        contextData += `Technology Requirements: ${op.technology}\n\n`;
      }
    }
  }
  
  // For Logistics & Supply Chain field, include distribution channels and competitive analysis
  else if (currentField === 'logistics') {
    // Add Distribution Channels to ensure logistics support smooth distribution
    if (content.marketingStrategy) {
      const ms = content.marketingStrategy;
      if (ms.channels) {
        contextData += `Distribution Channels: ${ms.channels}\n\n`;
      }
    }
    
    // Add Competitive Analysis as supply chain can be a competitive advantage
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.competitiveAnalysis) {
        contextData += `Competitive Analysis: ${ma.competitiveAnalysis}\n\n`;
      }
    }
    
    // Add Product/Service Overview to understand logistical requirements
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Product/Service Overview: ${ps.overview}\n\n`;
      }
    }
    
    // Add Facilities & Location for logistics hub information
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.facilities) {
        contextData += `Facilities & Location: ${op.facilities}\n\n`;
      }
    }
  }
  
  // ORGANIZATION AND MANAGEMENT SECTION FIELDS
  // For Organizational Structure field, include business structure and business model
  else if (currentField === 'structure') {
    // Add Business Structure to understand how legal structure impacts org chart
    if (content.companyDescription) {
      const cd = content.companyDescription;
      if (cd.businessStructure) {
        contextData += `Business Structure: ${cd.businessStructure}\n\n`;
      }
    }
    
    // Add Business Model to understand necessary roles
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.businessModel) {
        contextData += `Business Model: ${op.businessModel}\n\n`;
      }
    }
    
    // Add Company Size/Growth Plans for staffing requirements
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.projections) {
        contextData += `Financial Projections: ${fp.projections}\n\n`;
      }
    }
    
    // Add Management Team information if available
    if (content.organizationAndManagement) {
      const om = content.organizationAndManagement;
      if (om.managementTeam) {
        contextData += `Management Team: ${om.managementTeam}\n\n`;
      }
    }
  }
  
  // For Management Team field, include organizational structure and use of funds
  else if (currentField === 'managementTeam') {
    // Add Organizational Structure to understand hierarchy
    if (content.organizationAndManagement) {
      const om = content.organizationAndManagement;
      if (om.structure) {
        contextData += `Organizational Structure: ${om.structure}\n\n`;
      }
    }
    
    // Add Use of Funds to understand budget for hiring key personnel
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.useOfFunds) {
        contextData += `Use of Funds: ${fp.useOfFunds}\n\n`;
      }
    }
    
    // Add Business Model information to understand roles needed
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.businessModel) {
        contextData += `Business Model: ${op.businessModel}\n\n`;
      }
    }
    
    // Add Company Description for background context
    if (content.companyDescription) {
      const cd = content.companyDescription;
      if (cd.companyHistory) {
        contextData += `Company History: ${cd.companyHistory}\n\n`;
      }
    }
  }
  
  // For Advisors & Board field, include funding requirements, business concept, and competitive analysis
  else if (currentField === 'advisors') {
    // Add Funding Requirements as investors often want a strong advisory board
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.fundingNeeds) {
        contextData += `Funding Requirements: ${fp.fundingNeeds}\n\n`;
      }
    }
    
    // Add Business Concept to help identify expertise gaps that advisors can fill
    if (content.executiveSummary) {
      const es = content.executiveSummary;
      if (es.businessConcept) {
        contextData += `Business Concept: ${es.businessConcept}\n\n`;
      }
    }
    
    // Add Competitive Analysis to understand strategic expertise needed
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.competitiveAnalysis) {
        contextData += `Competitive Analysis: ${ma.competitiveAnalysis}\n\n`;
      }
    }
    
    // Add Management Team information to complement with advisors
    if (content.organizationAndManagement) {
      const om = content.organizationAndManagement;
      if (om.managementTeam) {
        contextData += `Management Team: ${om.managementTeam}\n\n`;
      }
    }
  }
  
  // For HR Plan field, include operations plan and financial projections
  else if (currentField === 'hrPlan') {
    // Add Production Process to understand personnel needs for operations
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.productionProcess) {
        contextData += `Production Process: ${op.productionProcess}\n\n`;
      }
    }
    
    // Add Financial Projections to understand budget constraints for staffing
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.projections) {
        contextData += `Financial Projections: ${fp.projections}\n\n`;
      }
    }
    
    // Add Business Model to understand personnel needs for the business
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.businessModel) {
        contextData += `Business Model: ${op.businessModel}\n\n`;
      }
    }
    
    // Add Organizational Structure to understand how HR fits in
    if (content.organizationAndManagement) {
      const om = content.organizationAndManagement;
      if (om.structure) {
        contextData += `Organizational Structure: ${om.structure}\n\n`;
      }
    }
  }
  
  // FINANCIAL PLAN SECTION FIELDS
  // For Financial Projections field, include product, market, and operations information
  else if (currentField === 'projections') {
    // Add Products and Services context for revenue projections
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.overview) {
        contextData += `Products/Services: ${ps.overview}\n\n`;
      }
    }
    
    // Add Market Analysis for market size and growth potential
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
      if (ma.industryOverview) {
        contextData += `Industry Overview: ${ma.industryOverview}\n\n`;
      }
    }
    
    // Add Marketing Strategy for sales approach and pricing
    if (content.marketingStrategy) {
      const ms = content.marketingStrategy;
      if (ms.pricing) {
        contextData += `Pricing Strategy: ${ms.pricing}\n\n`;
      }
      if (ms.salesStrategy) {
        contextData += `Revenue Model & Sales Strategy: ${ms.salesStrategy}\n\n`;
      }
    }
    
    // Add Operations Plan information for cost projections
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.productionProcess) {
        contextData += `Production Process: ${op.productionProcess}\n\n`;
      }
      if (op.logistics) {
        contextData += `Logistics & Supply Chain: ${op.logistics}\n\n`;
      }
    }
  }
  
  // For Funding Requirements field, include projections and growth plans
  else if (currentField === 'fundingNeeds') {
    // Add Financial Projections if available
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.projections) {
        contextData += `Financial Projections: ${fp.projections}\n\n`;
      }
      if (fp.useOfFunds) {
        contextData += `Use of Funds: ${fp.useOfFunds}\n\n`;
      }
    }
    
    // Add Business Structure & Ownership Details for investment structure context
    if (content.companyDescription) {
      const cd = content.companyDescription;
      if (cd.businessStructure) {
        contextData += `Business Structure: ${cd.businessStructure}\n\n`;
      }
      if (cd.ownershipDetails) {
        contextData += `Ownership Details: ${cd.ownershipDetails}\n\n`;
      }
    }
    
    // Add Products and Services future plans
    if (content.productsAndServices) {
      const ps = content.productsAndServices;
      if (ps.futureProducts) {
        contextData += `Future Products: ${ps.futureProducts}\n\n`;
      }
    }
    
    // Add Marketing Strategy for growth plans
    if (content.marketingStrategy) {
      const ms = content.marketingStrategy;
      if (ms.promotion) {
        contextData += `Promotion Plans: ${ms.promotion}\n\n`;
      }
    }
    
    // Add Operations Plan for expansion needs
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.facilities) {
        contextData += `Facilities & Location: ${op.facilities}\n\n`;
      }
      if (op.technology) {
        contextData += `Technology Requirements: ${op.technology}\n\n`;
      }
    }
  }
  
  // For Use of Funds field, include specific operational and growth requirements
  else if (currentField === 'useOfFunds') {
    // Add Funding Needs if available
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.fundingNeeds) {
        contextData += `Funding Requirements: ${fp.fundingNeeds}\n\n`;
      }
    }
    
    // Add Operations Plan for cost allocations
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.facilities) {
        contextData += `Facilities & Location: ${op.facilities}\n\n`;
      }
      if (op.technology) {
        contextData += `Technology Requirements: ${op.technology}\n\n`;
      }
      if (op.productionProcess) {
        contextData += `Production Process: ${op.productionProcess}\n\n`;
      }
    }
    
    // Add Organization & Management for staffing plans
    if (content.organizationAndManagement) {
      const om = content.organizationAndManagement;
      if (om.hrPlan) {
        contextData += `HR Plan: ${om.hrPlan}\n\n`;
      }
    }
    
    // Add Marketing Strategy for marketing costs
    if (content.marketingStrategy) {
      const ms = content.marketingStrategy;
      if (ms.promotion) {
        contextData += `Promotion Plans: ${ms.promotion}\n\n`;
      }
    }
  }
  
  // For Break-Even Analysis field, include pricing, costs, and sales projections
  else if (currentField === 'breakEvenAnalysis') {
    // Add Financial information
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.projections) {
        contextData += `Financial Projections: ${fp.projections}\n\n`;
      }
    }
    
    // Add Marketing Strategy for pricing structure and sales approach
    if (content.marketingStrategy) {
      const ms = content.marketingStrategy;
      if (ms.pricing) {
        contextData += `Pricing Strategy: ${ms.pricing}\n\n`;
      }
      if (ms.salesStrategy) {
        contextData += `Sales Strategy: ${ms.salesStrategy}\n\n`;
      }
      if (ms.channels) {
        contextData += `Distribution Channels: ${ms.channels}\n\n`;
      }
    }
    
    // Add Operations Plan for cost structure
    if (content.operationsPlan) {
      const op = content.operationsPlan;
      if (op.productionProcess) {
        contextData += `Production Process: ${op.productionProcess}\n\n`;
      }
      if (op.logistics) {
        contextData += `Logistics & Supply Chain: ${op.logistics}\n\n`;
      }
      if (op.facilities) {
        contextData += `Facilities & Location: ${op.facilities}\n\n`;
      }
    }
    
    // Add Target Market information for sales volume estimates
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.targetMarket) {
        contextData += `Target Market: ${ma.targetMarket}\n\n`;
      }
    }
  }
  
  // For Exit Strategy field, include ownership details and market trends
  else if (currentField === 'exitStrategy') {
    // Add Ownership Details to understand current ownership structure
    if (content.companyDescription) {
      const cd = content.companyDescription;
      if (cd.ownershipDetails) {
        contextData += `Ownership Details: ${cd.ownershipDetails}\n\n`;
      }
      if (cd.businessStructure) {
        contextData += `Business Structure: ${cd.businessStructure}\n\n`;
      }
    }
    
    // Add Funding Requirements for investment context
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.fundingNeeds) {
        contextData += `Funding Requirements: ${fp.fundingNeeds}\n\n`;
      }
    }
    
    // Add Competitive Analysis to identify potential acquirers
    if (content.marketAnalysis) {
      const ma = content.marketAnalysis;
      if (ma.competitiveAnalysis) {
        contextData += `Competitive Analysis: ${ma.competitiveAnalysis}\n\n`;
      }
      if (ma.industryOverview) {
        contextData += `Market Trends: ${ma.industryOverview}\n\n`;
      }
    }
    
    // Add Financial Projections for valuation context
    if (content.financialPlan) {
      const fp = content.financialPlan;
      if (fp.projections) {
        contextData += `Financial Projections: ${fp.projections}\n\n`;
      }
    }
  }
  
  return contextData;
};

/**
 * Reference Panel Component
 * Displays information from other sections to help with creating the executive summary
 */
function ReferencePanel({ data, isOpen, onToggle }: { 
  data: any, 
  isOpen: boolean,
  onToggle: () => void
}) {
  if (!data) return null;
  
  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-md shadow-sm">
      <button 
        onClick={onToggle}
        className="flex justify-between items-center w-full px-4 py-3 bg-gray-50 text-left border-b border-gray-200"
      >
        <h3 className="text-sm font-medium text-gray-700">Reference Information from Other Sections</h3>
        {isOpen ? 
          <ChevronDown className="h-4 w-4 text-gray-500" /> : 
          <ChevronRight className="h-4 w-4 text-gray-500" />
        }
      </button>
      
      {isOpen && (
        <div className="p-4 text-sm space-y-4">
          {/* Company Description Section */}
          {(data.companyDescription.businessStructure || 
            data.companyDescription.legalStructureDetails || 
            data.companyDescription.ownershipDetails) && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Company Description</h4>
              
              {data.companyDescription.businessStructure && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500">Business Structure:</p>
                  <p className="text-gray-700 bg-gray-50 p-2 rounded-md text-xs">
                    {data.companyDescription.businessStructure}
                  </p>
                </div>
              )}
              
              {data.companyDescription.legalStructureDetails && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500">Legal Structure Details:</p>
                  <p className="text-gray-700 bg-gray-50 p-2 rounded-md text-xs">
                    {data.companyDescription.legalStructureDetails.length > 150 
                      ? `${data.companyDescription.legalStructureDetails.substring(0, 150)}...` 
                      : data.companyDescription.legalStructureDetails}
                  </p>
                </div>
              )}
              
              {data.companyDescription.ownershipDetails && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500">Ownership Details:</p>
                  <p className="text-gray-700 bg-gray-50 p-2 rounded-md text-xs">
                    {data.companyDescription.ownershipDetails.length > 150 
                      ? `${data.companyDescription.ownershipDetails.substring(0, 150)}...` 
                      : data.companyDescription.ownershipDetails}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Products and Services Section */}
          {(data.productsAndServices.overview || data.productsAndServices.valueProposition) && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Products and Services</h4>
              
              {data.productsAndServices.overview && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500">Overview:</p>
                  <p className="text-gray-700 bg-gray-50 p-2 rounded-md text-xs">
                    {data.productsAndServices.overview.length > 150 
                      ? `${data.productsAndServices.overview.substring(0, 150)}...` 
                      : data.productsAndServices.overview}
                  </p>
                </div>
              )}
              
              {data.productsAndServices.valueProposition && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500">Value Proposition:</p>
                  <p className="text-gray-700 bg-gray-50 p-2 rounded-md text-xs">
                    {data.productsAndServices.valueProposition.length > 150 
                      ? `${data.productsAndServices.valueProposition.substring(0, 150)}...` 
                      : data.productsAndServices.valueProposition}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Market Analysis Section */}
          {(data.marketAnalysis.industryOverview || data.marketAnalysis.targetMarket) && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Market Analysis</h4>
              
              {data.marketAnalysis.industryOverview && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500">Industry Overview:</p>
                  <p className="text-gray-700 bg-gray-50 p-2 rounded-md text-xs">
                    {data.marketAnalysis.industryOverview.length > 150 
                      ? `${data.marketAnalysis.industryOverview.substring(0, 150)}...` 
                      : data.marketAnalysis.industryOverview}
                  </p>
                </div>
              )}
              
              {data.marketAnalysis.targetMarket && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-500">Target Market:</p>
                  <p className="text-gray-700 bg-gray-50 p-2 rounded-md text-xs">
                    {data.marketAnalysis.targetMarket.length > 150 
                      ? `${data.marketAnalysis.targetMarket.substring(0, 150)}...` 
                      : data.marketAnalysis.targetMarket}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * BusinessPlanEditor Component
 * 
 * Handles editing different sections of the business plan
 * Dynamically renders appropriate form fields based on the section
 * Provides guidance and help text for each field
 */
export default function BusinessPlanEditor({ 
  businessPlan, 
  currentSection,
  onSave
}: BusinessPlanEditorProps) {
  // Manage form state
  const [formData, setFormData] = useState<any>({})
  const [isDirty, setIsDirty] = useState(false)
  const [highlightedField, setHighlightedField] = useState<string | null>(null)
  // Track the field that should be focused
  const [fieldToFocus, setFieldToFocus] = useState<string | null>(null)
  
  // Create a map of textarea refs
  const textareaRefs = useRef<{[key: string]: HTMLTextAreaElement | null}>({})
  // Create a ref for the form element to use for scrolling
  const formRef = useRef<HTMLFormElement>(null)
  
  // Initialize form data from business plan content when section changes
  useEffect(() => {
    if (businessPlan?.content?.[currentSection]) {
      setFormData(businessPlan.content[currentSection])
    } else {
      // Initialize with empty object if section doesn't exist
      setFormData({})
    }
    
    // Reset dirty state when section changes
    setIsDirty(false)
    
    // Reset any highlighted fields
    setHighlightedField(null)
    
    // When section changes, set the first field to be focused
    const fields = getFieldDefinitions()
    if (fields.length > 0) {
      setFieldToFocus(fields[0].id)
    }
  }, [businessPlan, currentSection])
  
  // Effect to focus on a field when fieldToFocus changes
  useEffect(() => {
    if (fieldToFocus) {
      // Wait for the DOM to be fully updated
      setTimeout(() => {
        // Get the textarea element for the field to focus
        const textareaElement = textareaRefs.current[fieldToFocus]
        if (textareaElement) {
          // Focus the element
          textareaElement.focus()
          
          // Scroll the field into view with some padding
          if (formRef.current) {
            const fieldElement = document.getElementById(fieldToFocus)
            if (fieldElement) {
              // Calculate position to scroll to (field position minus some padding)
              const yOffset = -20
              const y = fieldElement.getBoundingClientRect().top + window.pageYOffset + yOffset
              
              // Scroll the form container
              formRef.current.scrollTo({
                top: y - formRef.current.offsetTop,
                behavior: 'smooth'
              })
            }
          }
        }
        
        // Clear the field to focus after focusing
        setFieldToFocus(null)
      }, 100)
    }
  }, [fieldToFocus])
  
  /**
   * Focus on a specific field in the form
   * @param fieldId The ID of the field to focus, or null for the first field
   */
  const focusField = (fieldId: string | null = null) => {
    const fields = getFieldDefinitions()
    if (fields.length === 0) return
    
    // If fieldId is provided and exists in the current section, focus it
    if (fieldId && fields.some(field => field.id === fieldId)) {
      setFieldToFocus(fieldId)
    } else {
      // Otherwise, focus the first field
      setFieldToFocus(fields[0].id)
    }
  }

  // Make the focusField function available to the parent component
  useEffect(() => {
    // Attach the focusField function to the window object
    // so the parent component can access it
    // @ts-ignore - Adding custom property to window
    window.businessPlanEditor = window.businessPlanEditor || {}
    // @ts-ignore
    window.businessPlanEditor[currentSection] = {
      focusField
    }
    
    return () => {
      // Clean up when component unmounts
      // @ts-ignore
      if (window.businessPlanEditor && window.businessPlanEditor[currentSection]) {
        // @ts-ignore
        delete window.businessPlanEditor[currentSection]
      }
    }
  }, [currentSection])

  // Get field definitions based on current section
  const getFieldDefinitions = (): FieldDefinition[] => {
    switch (currentSection) {
      case 'executiveSummary':
        return [
          {
            id: 'businessConcept',
            label: 'Business Concept',
            type: 'textarea',
            placeholder: 'Describe your business concept...',
            help: 'Explain what your business does and the problem it solves'
          },
          {
            id: 'missionStatement',
            label: 'Mission Statement',
            type: 'textarea',
            placeholder: 'Enter your mission statement...',
            help: 'What drives your business and what you aim to achieve'
          },
          {
            id: 'productsOverview',
            label: 'Products/Services Overview',
            type: 'textarea',
            placeholder: 'Provide an overview of your products or services...',
            help: 'Brief description of what you offer to customers'
          },
          {
            id: 'marketOpportunity',
            label: 'Market Opportunity',
            type: 'textarea',
            placeholder: 'Describe your market opportunity...',
            help: 'Size of the market and your potential share'
          },
          {
            id: 'financialHighlights',
            label: 'Financial Highlights',
            type: 'textarea',
            placeholder: 'Summarize key financial projections...',
            help: 'Brief overview of expected revenue, costs, and profitability'
          }
        ];
        
      case 'companyDescription':
        return [
          {
            id: 'businessStructure',
            label: 'Business Structure',
            type: 'select',
            placeholder: 'Select your business structure',
            options: [
              { value: 'Sole Proprietorship', label: 'Sole Proprietorship' },
              { value: 'Partnership', label: 'Partnership' },
              { value: 'LLC', label: 'Limited Liability Company (LLC)' },
              { value: 'Corporation', label: 'Corporation' },
              { value: 'Nonprofit', label: 'Nonprofit Organization' }
            ]
          },
          {
            id: 'legalStructure',
            label: 'Legal Structure Details',
            type: 'textarea',
            placeholder: 'Provide additional details about your legal structure...'
          },
          {
            id: 'ownershipDetails',
            label: 'Ownership Details',
            type: 'textarea',
            placeholder: 'Describe the ownership structure of your company...',
            help: 'Include information about owners, partners, shareholders, or investors and their ownership percentages'
          },
          {
            id: 'companyHistory',
            label: 'Company History',
            type: 'textarea',
            placeholder: 'Describe the history and founding of your company...'
          }
        ];
        
      case 'productsAndServices':
        return [
          {
            id: 'overview',
            label: 'Product/Service Overview',
            type: 'textarea',
            placeholder: 'Provide a detailed overview of your products or services...',
            help: 'Comprehensive description of what you offer to customers'
          },
          {
            id: 'valueProposition',
            label: 'Value Proposition',
            type: 'textarea',
            placeholder: 'Describe your unique value proposition...',
            help: 'What makes your products/services valuable to customers and different from competitors'
          },
          {
            id: 'intellectualProperty',
            label: 'Intellectual Property',
            type: 'textarea',
            placeholder: 'Describe any patents, trademarks, copyrights, or other IP...',
            help: 'Detail your intellectual property assets and protection strategy'
          },
          {
            id: 'futureProducts',
            label: 'Future Products/Services',
            type: 'textarea',
            placeholder: 'Outline your future product/service development plans...',
            help: 'Your product roadmap and development timeline'
          }
        ];
        
      case 'marketAnalysis':
        return [
          {
            id: 'industryOverview',
            label: 'Industry Overview',
            type: 'textarea',
            placeholder: 'Provide an overview of your industry...',
            help: 'Size, trends, and growth projections for your industry'
          },
          {
            id: 'targetMarket',
            label: 'Target Market',
            type: 'textarea',
            placeholder: 'Describe your target market in detail...',
            help: 'Demographics, needs, and behaviors of your ideal customers'
          },
          {
            id: 'marketSegmentation',
            label: 'Market Segmentation',
            type: 'textarea',
            placeholder: 'Detail how you segment your market...',
            help: 'How you divide the market into distinct customer groups'
          },
          {
            id: 'competitiveAnalysis',
            label: 'Competitive Analysis',
            type: 'textarea',
            placeholder: 'Analyze your competitors...',
            help: 'Identify main competitors and their strengths/weaknesses'
          },
          {
            id: 'swotAnalysis',
            label: 'SWOT Analysis',
            type: 'textarea',
            placeholder: 'Provide a SWOT analysis for your business...',
            help: 'Strengths, Weaknesses, Opportunities, and Threats'
          }
        ];
        
      case 'marketingStrategy':
        return [
          {
            id: 'branding',
            label: 'Branding Strategy',
            type: 'textarea',
            placeholder: 'Describe your branding strategy...',
            help: 'Your brand identity, voice, and positioning'
          },
          {
            id: 'pricing',
            label: 'Pricing Strategy',
            type: 'textarea',
            placeholder: 'Explain your pricing strategy...',
            help: 'How you price your products/services and why'
          },
          {
            id: 'promotion',
            label: 'Promotion Plan',
            type: 'textarea',
            placeholder: 'Detail your promotion and advertising strategies...',
            help: 'How you\'ll create awareness and attract customers'
          },
          {
            id: 'salesStrategy',
            label: 'Sales Strategy',
            type: 'textarea',
            placeholder: 'Outline your sales process and strategy...',
            help: 'Your approach to converting leads into customers'
          },
          {
            id: 'channels',
            label: 'Distribution Channels',
            type: 'textarea',
            placeholder: 'Describe your distribution channels...',
            help: 'How your products/services reach customers'
          },
          {
            id: 'customerRetention',
            label: 'Customer Retention',
            type: 'textarea',
            placeholder: 'Explain your customer retention strategies...',
            help: 'How you\'ll keep customers coming back'
          }
        ];
        
      case 'operationsPlan':
        return [
          {
            id: 'businessModel',
            label: 'Business Model',
            type: 'textarea',
            placeholder: 'Describe your business model in detail...',
            help: 'How your business creates, delivers, and captures value'
          },
          {
            id: 'facilities',
            label: 'Facilities & Location',
            type: 'textarea',
            placeholder: 'Describe your business facilities and location...',
            help: 'Information about your physical locations and requirements'
          },
          {
            id: 'technology',
            label: 'Technology Requirements',
            type: 'textarea',
            placeholder: 'Detail your technology infrastructure and requirements...',
            help: 'Software, hardware, and other tech needs'
          },
          {
            id: 'productionProcess',
            label: 'Production Process',
            type: 'textarea',
            placeholder: 'Outline your production or service delivery process...',
            help: 'How you create and deliver your products/services'
          },
          {
            id: 'qualityControl',
            label: 'Quality Control',
            type: 'textarea',
            placeholder: 'Describe your quality control procedures...',
            help: 'How you ensure consistent quality'
          },
          {
            id: 'logistics',
            label: 'Logistics & Supply Chain',
            type: 'textarea',
            placeholder: 'Detail your logistics and supply chain management...',
            help: 'How you manage inventory, shipping, and suppliers'
          }
        ];
        
      case 'organizationAndManagement':
        return [
          {
            id: 'structure',
            label: 'Organizational Structure',
            type: 'textarea',
            placeholder: 'Describe your organizational structure...',
            help: 'Your business hierarchy and reporting relationships'
          },
          {
            id: 'managementTeam',
            label: 'Management Team',
            type: 'textarea',
            placeholder: 'Describe your management team and their experience...',
            help: 'Background and qualifications of key team members'
          },
          {
            id: 'advisors',
            label: 'Advisors & Board',
            type: 'textarea',
            placeholder: 'List any advisors, mentors, or board members...',
            help: 'External expertise that supports your business'
          },
          {
            id: 'hrPlan',
            label: 'HR Plan',
            type: 'textarea',
            placeholder: 'Outline your human resources plan...',
            help: 'Hiring plans, staffing requirements, and compensation strategy'
          }
        ];
        
      case 'financialPlan':
        return [
          {
            id: 'projections',
            label: 'Financial Projections',
            type: 'textarea',
            placeholder: 'Provide your financial projections...',
            help: 'Revenue, expenses, and profit forecasts for the next few years'
          },
          {
            id: 'fundingNeeds',
            label: 'Funding Requirements',
            type: 'textarea',
            placeholder: 'Describe your funding requirements...',
            help: 'How much funding you need and what it will be used for'
          },
          {
            id: 'useOfFunds',
            label: 'Use of Funds',
            type: 'textarea',
            placeholder: 'Detail how you will use the funds...',
            help: 'Specific allocation of investment or funding'
          },
          {
            id: 'breakEvenAnalysis',
            label: 'Break-Even Analysis',
            type: 'textarea',
            placeholder: 'Provide a break-even analysis...',
            help: 'When you expect to start covering costs and making a profit'
          },
          {
            id: 'exitStrategy',
            label: 'Exit Strategy',
            type: 'textarea',
            placeholder: 'Describe your exit strategy...',
            help: 'Your long-term plan for the business (acquisition, IPO, etc.)'
          }
        ];
        
      // Default case for any other sections
      default:
        return [
          {
            id: 'content',
            label: `${currentSection} Content`,
            type: 'textarea',
            placeholder: `Enter content for ${currentSection}...`,
            help: 'This section will have more detailed fields in future updates'
          }
        ];
    }
  }

  /**
   * Handle input changes and update form data
   * @param fieldId - The field identifier
   * @param value - The new value
   */
  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Mark form as dirty (has unsaved changes)
    setIsDirty(true)
    
    // For textareas, auto-adjust height
    if (textareaRefs.current[fieldId]) {
      const textarea = textareaRefs.current[fieldId];
      
      // Reset height to calculate correct scrollHeight
      textarea!.style.height = 'auto';
      
      // Set the new height based on content, with min and max constraints
      const newHeight = Math.min(Math.max(80, textarea!.scrollHeight + 2), 500);
      textarea!.style.height = `${newHeight}px`;
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    setIsDirty(false)
  }

  // Get section title for display
  const getSectionTitle = (): string => {
    switch (currentSection) {
      case 'executiveSummary': return 'Executive Summary'
      case 'companyDescription': return 'Company Description'
      case 'productsAndServices': return 'Products & Services'
      case 'marketAnalysis': return 'Market Analysis'
      case 'marketingStrategy': return 'Marketing Strategy'
      case 'operationsPlan': return 'Operations Plan'
      case 'organizationAndManagement': return 'Organization & Management'
      case 'financialPlan': return 'Financial Plan'
      default: return currentSection.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }
  }

  /**
   * Handle applying an AI suggestion to a field
   */
  const handleApplySuggestion = (fieldId: string, content: string) => {
    // Update the form data with the suggested content
    handleInputChange(fieldId, content)
    
    // Briefly highlight the field that was updated
    setHighlightedField(fieldId)
    setTimeout(() => {
      setHighlightedField(null)
    }, 3000)
  }

  /**
   * Handle AI assistance request for a specific field
   * @param fieldId - The field to get assistance for
   */
  const handleGetAIAssistance = async (fieldId: string) => {
    // Get context from other relevant sections
    const context = prepareAIContext(businessPlan, fieldId);
    
    try {
      // Call the AI assistance API with the context to get suggestions
      const response = await fetch(`/api/ai/suggest-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessPlanId: businessPlan.id,
          field: fieldId,
          section: currentSection,
          existingContent: formData[fieldId] || '',
          context: context // Pass the context from other sections
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI suggestions');
      }
      
      const data = await response.json();
      
      // Apply the suggestion
      if (data.suggestion) {
        handleApplySuggestion(fieldId, data.suggestion);
      }
    } catch (error) {
      console.error('Error getting AI assistance:', error);
      // You could show an error message to the user here
    }
  };

  // Handle print business plan
  /**
   * Handles printing the business plan with only populated fields
   * Creates a new window with formatted content and triggers print dialog
   */
  const handlePrintBusinessPlan = () => {
    if (!businessPlan?.content) {
      console.error('No business plan data available to print');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print your business plan');
      return;
    }

    // Helper function to check if a section has any values
    const sectionHasValues = (section: any) => {
      if (!section) return false;
      return Object.values(section).some(value => 
        value && typeof value === 'string' && value.trim() !== ''
      );
    };

    // Build the HTML content for printing
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${businessPlan.title || 'Business Plan'}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { font-size: 24px; color: #2563eb; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
          h2 { font-size: 18px; color: #4b5563; margin-top: 25px; }
          p { margin-bottom: 16px; }
          .section { margin-bottom: 30px; }
          @media print {
            body { padding: 0; }
            h1 { break-after: avoid; }
            h2 { break-after: avoid; }
            .section { break-inside: avoid-page; }
          }
        </style>
      </head>
      <body>
        <h1 style="font-size: 28px; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 30px;">
          ${businessPlan.content.coverPage?.businessName || businessPlan.title || 'Business Plan'}
        </h1>
    `;

    // Define all sections in display order
    const sections = [
      { id: 'executiveSummary', title: 'Executive Summary' },
      { id: 'companyDescription', title: 'Company Description' },
      { id: 'productsAndServices', title: 'Products & Services' },
      { id: 'marketAnalysis', title: 'Market Analysis' },
      { id: 'marketingStrategy', title: 'Marketing Strategy' },
      { id: 'operationsPlan', title: 'Operations Plan' },
      { id: 'organizationAndManagement', title: 'Organization & Management' },
      { id: 'financialPlan', title: 'Financial Plan' }
    ];

    // Add each section that has content
    sections.forEach(section => {
      const sectionData = businessPlan.content[section.id];
      
      if (sectionHasValues(sectionData)) {
        htmlContent += `<div class="section"><h1>${section.title}</h1>`;
        
        // Add each field that has content
        Object.entries(sectionData).forEach(([fieldId, value]) => {
          if (value && typeof value === 'string' && value.trim() !== '') {
            // Convert field ID to a readable title
            const fieldTitle = fieldId
              .replace(/([A-Z])/g, ' $1') // Add space before capital letters
              .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
            
            htmlContent += `<h2>${fieldTitle}</h2><p>${value.replace(/\n/g, '<br>')}</p>`;
          }
        });
        
        htmlContent += `</div>`;
      }
    });

    // Close the HTML document
    htmlContent += `
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    // Write to the new window and trigger print
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Render form fields based on definitions
  const renderFields = () => {
    const fields = getFieldDefinitions()
    
    return fields.map(field => (
      <div key={field.id} className="mb-5 pb-4 border-b border-gray-100">
        <div className="flex items-center mb-1">
          <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          {field.help && (
            <div className="ml-2 relative group">
              <HelpCircle className="h-4 w-4 text-gray-400" />
              <div className="absolute left-full ml-2 top-0 w-64 bg-white p-2 rounded shadow-lg text-xs border border-gray-200 hidden group-hover:block z-10">
                {field.help}
              </div>
            </div>
          )}
        </div>
        
        {field.type === 'textarea' && (
          <div>
            <textarea
              id={field.id}
              ref={el => textareaRefs.current[field.id] = el}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 border ${
                highlightedField === field.id 
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-300' 
                  : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none transition-all duration-200`}
            />
          </div>
        )}
        
        {field.type === 'text' && (
          <input
            type="text"
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border ${
              highlightedField === field.id 
                ? 'border-green-500 bg-green-50 ring-2 ring-green-300' 
                : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        )}
        
        {field.type === 'select' && field.options && (
          <select
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 border ${
              highlightedField === field.id 
                ? 'border-green-500 bg-green-50 ring-2 ring-green-300' 
                : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">{field.placeholder}</option>
            {field.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    ))
  }

  // Add useEffect to adjust textarea heights when form data changes 
  // (handles initial load and external changes like AI suggestions)
  useEffect(() => {
    setTimeout(() => {
      // For each field in the form data
      Object.keys(formData).forEach(fieldId => {
        const textarea = textareaRefs.current[fieldId];
        if (textarea) {
          // Reset height
          textarea.style.height = 'auto';
          
          // Set height based on content
          const newHeight = Math.min(Math.max(80, textarea.scrollHeight + 2), 500);
          textarea.style.height = `${newHeight}px`;
        }
      });
    }, 0);
  }, [formData]);

  // State for controlling download options dropdown
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const downloadOptionsRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadOptionsRef.current && !downloadOptionsRef.current.contains(event.target as Node)) {
        setShowDownloadOptions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle export to PDF
  /**
   * Exports the business plan as a PDF document
   * Generates a formatted PDF with only populated fields and downloads it
   */
  const handleExportPDF = async () => {
    if (!businessPlan?.content) {
      console.error('No business plan data available to export');
      return;
    }
    
    // Close dropdown
    setShowDownloadOptions(false);
    
    try {
      // Helper function to check if a section has any values
      const sectionHasValues = (section: any) => {
        if (!section) return false;
        return Object.values(section).some(value => 
          value && typeof value === 'string' && value.trim() !== ''
        );
      };
      
      // Create a temporary container for HTML content - using same approach as print function
      const tempDiv = document.createElement('div');
      tempDiv.className = 'pdf-export-container';
      tempDiv.style.width = '800px';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      // Build HTML content similar to print function for consistent results
      let htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="font-size: 28px; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 30px; color: #2563eb;">
            ${businessPlan.content.coverPage?.businessName || businessPlan.title || 'Business Plan'}
          </h1>
      `;
      
      // Define all sections in display order
      const sections = [
        { id: 'executiveSummary', title: 'Executive Summary' },
        { id: 'companyDescription', title: 'Company Description' },
        { id: 'productsAndServices', title: 'Products & Services' },
        { id: 'marketAnalysis', title: 'Market Analysis' },
        { id: 'marketingStrategy', title: 'Marketing Strategy' },
        { id: 'operationsPlan', title: 'Operations Plan' },
        { id: 'organizationAndManagement', title: 'Organization & Management' },
        { id: 'financialPlan', title: 'Financial Plan' }
      ];
      
      // Add each section that has content
      sections.forEach(section => {
        const sectionData = businessPlan.content[section.id];
        
        if (sectionHasValues(sectionData)) {
          htmlContent += `<div style="margin-bottom: 30px;">
            <h1 style="font-size: 24px; color: #2563eb; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
              ${section.title}
            </h1>`;
          
          // Add each field that has content
          Object.entries(sectionData).forEach(([fieldId, value]) => {
            if (value && typeof value === 'string' && value.trim() !== '') {
              // Convert field ID to a readable title
              const fieldTitle = fieldId
                .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
              
              htmlContent += `
                <h2 style="font-size: 18px; color: #4b5563; margin-top: 25px;">${fieldTitle}</h2>
                <p style="margin-bottom: 16px;">${value.replace(/\n/g, '<br>')}</p>
              `;
            }
          });
          
          htmlContent += `</div>`;
        }
      });
      
      // Close the HTML content
      htmlContent += `</div>`;
      
      // Set the HTML content in the temporary div
      tempDiv.innerHTML = htmlContent;
      
      // Create PDF document with a better page size and higher resolution
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        compress: true
      });
      
      // Set PDF properties
      pdf.setProperties({
        title: businessPlan.title || 'Business Plan',
        subject: 'Business Plan',
        creator: 'Business Coach App',
        author: businessPlan.content.coverPage?.businessName || 'Business Plan Owner'
      });
      
      // PDF document dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 40; // Slightly larger margins for better readability
      const contentWidth = pdfWidth - (margin * 2);
      
      // Use html2canvas with better settings for quality
      const canvas = await html2canvas(tempDiv, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Calculate the number of pages needed
      const totalHeight = canvas.height;
      const pageHeight = pdfHeight - (margin * 2);
      const pageCount = Math.ceil(totalHeight / pageHeight);
      
      // Add each canvas section to a new PDF page
      for (let i = 0; i < pageCount; i++) {
        // Add a new page after the first page
        if (i > 0) {
          pdf.addPage();
        }
        
        // Calculate the portion of the canvas to use for this page
        const sourceY = i * pageHeight * (canvas.width / contentWidth);
        const sourceHeight = Math.min(pageHeight * (canvas.width / contentWidth), totalHeight - sourceY);
        
        // Add the canvas image to the PDF with better positioning
        pdf.addImage(
          canvas,
          'PNG',
          margin,
          margin,
          contentWidth,
          sourceHeight * (contentWidth / canvas.width)
        );
      }
      
      // Download the PDF with a better filename
      const sanitizedTitle = (businessPlan.title || 'Business_Plan').replace(/[^a-z0-9]/gi, '_');
      pdf.save(`${sanitizedTitle}.pdf`);
      
      // Clean up - remove the temporary div
      document.body.removeChild(tempDiv);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    }
  };
  
  // Handle export to Word
  /**
   * Exports the business plan as a Word document (.docx)
   * Generates a formatted document with only populated fields and downloads it
   */
  const handleExportWord = () => {
    if (!businessPlan?.content) {
      console.error('No business plan data available to export');
      return;
    }
    
    // Close dropdown
    setShowDownloadOptions(false);
    
    try {
      // Helper function to check if a section has any values
      const sectionHasValues = (section: any) => {
        if (!section) return false;
        return Object.values(section).some(value => 
          value && typeof value === 'string' && value.trim() !== ''
        );
      };
      
      // Prepare document content
      const children: Paragraph[] = [];
      
      // Add title
      children.push(
        new Paragraph({
          text: businessPlan.content.coverPage?.businessName || businessPlan.title || 'Business Plan',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
          },
          border: {
            bottom: {
              color: '2563EB',
              space: 8,
              style: BorderStyle.SINGLE,
              size: 8,
            },
          },
        })
      );
      
      // Define all sections in display order
      const sections = [
        { id: 'executiveSummary', title: 'Executive Summary' },
        { id: 'companyDescription', title: 'Company Description' },
        { id: 'productsAndServices', title: 'Products & Services' },
        { id: 'marketAnalysis', title: 'Market Analysis' },
        { id: 'marketingStrategy', title: 'Marketing Strategy' },
        { id: 'operationsPlan', title: 'Operations Plan' },
        { id: 'organizationAndManagement', title: 'Organization & Management' },
        { id: 'financialPlan', title: 'Financial Plan' }
      ];
      
      // Add each section with content
      sections.forEach(section => {
        const sectionData = businessPlan.content[section.id];
        
        if (sectionHasValues(sectionData)) {
          // Add section header
          children.push(
            new Paragraph({
              text: section.title,
              heading: HeadingLevel.HEADING_1,
              spacing: {
                before: 360,
                after: 120,
              },
              border: {
                bottom: {
                  color: 'E5E7EB',
                  space: 4,
                  style: BorderStyle.SINGLE,
                  size: 4,
                },
              },
            })
          );
          
          // Add each field that has content
          Object.entries(sectionData).forEach(([fieldId, value]) => {
            if (value && typeof value === 'string' && value.trim() !== '') {
              // Convert field ID to a readable title
              const fieldTitle = fieldId
                .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
              
              // Add field title
              children.push(
                new Paragraph({
                  text: fieldTitle,
                  heading: HeadingLevel.HEADING_3,
                  spacing: {
                    before: 200,
                    after: 80,
                  },
                })
              );
              
              // Add field content - handle paragraphs
              const paragraphs = value.split('\n').filter(p => p.trim() !== '');
              
              paragraphs.forEach(paragraph => {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: paragraph,
                        size: 22, // 11pt
                      }),
                    ],
                    spacing: {
                      after: 160,
                    },
                  })
                );
              });
            }
          });
        }
      });
      
      // Create document with a single section containing all content
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440, // 1 inch in twips
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            children: children,
          },
        ],
      });
      
      // Generate and save the Word document
      Packer.toBlob(doc).then((blob: Blob) => {
        // Create a more clean filename
        const sanitizedTitle = (businessPlan.title || 'Business_Plan').replace(/[^a-z0-9]/gi, '_');
        saveAs(blob, `${sanitizedTitle}.docx`);
      });
      
    } catch (error) {
      console.error('Error generating Word document:', error);
      alert('There was an error generating the Word document. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800">{getSectionTitle()}</h2>
        <div className="flex items-center space-x-2">
          {/* Download button with dropdown */}
          <div className="relative group" ref={downloadOptionsRef}>
            <button
              type="button"
              onClick={() => setShowDownloadOptions(!showDownloadOptions)}
              aria-label="Download Business Plan"
              className="p-2 rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <Download className="h-5 w-5" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-white p-2 rounded shadow-lg text-xs border border-gray-200 hidden group-hover:block z-10 text-center">
              Download
            </div>
            
            {/* Dropdown menu for download options */}
            {showDownloadOptions && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded shadow-lg border border-gray-200 z-20">
                <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </button>
                <button
                  onClick={handleExportWord}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Word
                </button>
              </div>
            )}
          </div>
          
          {/* Print button */}
          <div className="relative group">
            <button
              type="button"
              onClick={handlePrintBusinessPlan}
              aria-label="Print Business Plan"
              className="p-2 rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <Printer className="h-5 w-5" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-white p-2 rounded shadow-lg text-xs border border-gray-200 hidden group-hover:block z-10 text-center">
              Print Business Plan
            </div>
          </div>
          
          {/* Save button */}
          <div className="relative group">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isDirty}
              aria-label="Save Changes"
              className={`p-2 rounded-md ${
                isDirty
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="h-5 w-5" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-28 bg-white p-2 rounded shadow-lg text-xs border border-gray-200 hidden group-hover:block z-10 text-center">
              Save Changes
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-grow overflow-auto p-4">
        {currentSection === 'executiveSummary' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-blue-800 font-medium mb-2">Recommendation</h3>
            <p className="text-blue-700 text-sm">
              For a comprehensive Executive Summary, we recommend completing the other sections of your business plan first. 
              The information you provide in sections like Company Description, Products & Services, and Financial Plan will help you build a more complete and accurate Executive Summary.
            </p>
          </div>
        )}
        <form ref={formRef} onSubmit={handleSubmit}>
          {renderFields()}
        </form>
      </div>
    </div>
  )
} 