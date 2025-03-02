/**
 * Development Data Seeding
 * 
 * This file contains functions to seed development data into the database.
 * It ensures that mock business plans referenced in the UI actually exist in the database.
 */

import { prisma } from './prisma'
import { DEV_CONFIG } from '@/config/development'

/**
 * Seed development user only
 * 
 * Creates the development user if it doesn't already exist,
 * but does not create any sample business plans.
 * This allows users to create their own business plans from scratch.
 */
export async function seedDevUser() {
  if (!DEV_CONFIG.useDevAuth) {
    console.log('Development mode is disabled, skipping user seed')
    return
  }

  console.log('Seeding development user...')

  try {
    // Ensure the development user exists
    let devUser = await prisma.user.findUnique({
      where: { id: DEV_CONFIG.userId }
    })

    if (!devUser) {
      console.log('Creating development user...')
      devUser = await prisma.user.create({
        data: {
          id: DEV_CONFIG.userId,
          name: 'Development User',
          email: 'dev@example.com',
          password: 'dev-password', // In production, this would be hashed
          role: 'user'
        }
      })
    } else {
      console.log('Development user already exists')
    }

    console.log('Development user seeded successfully')
    return devUser
  } catch (error) {
    console.error('Error seeding development user:', error)
  }
}

/**
 * Seed development business plans
 * 
 * Creates the mock business plans that are referenced in the UI
 * if they don't already exist in the database.
 * Also ensures the development user exists before creating business plans.
 */
export async function seedDevBusinessPlans() {
  if (!DEV_CONFIG.useDevAuth) {
    console.log('Development mode is disabled, skipping seed data')
    return
  }

  console.log('Seeding development business plans...')

  try {
    // First, ensure the development user exists
    let devUser = await prisma.user.findUnique({
      where: { id: DEV_CONFIG.userId }
    })

    // If user doesn't exist by ID, try to find by email
    if (!devUser) {
      devUser = await prisma.user.findUnique({
        where: { email: 'dev@example.com' }
      })
    }

    // If user still doesn't exist, create it
    if (!devUser) {
      console.log('Creating development user...')
      devUser = await prisma.user.create({
        data: {
          id: DEV_CONFIG.userId,
          email: 'dev@example.com',
          name: 'Development User',
          password: 'dev-password', // In production, this should be hashed
          role: 'user'
        }
      })
      console.log('Development user created successfully')
    } else {
      console.log('Development user already exists')
    }

    // Use the actual user ID for business plans
    const userId = devUser.id

    // Define the mock business plans that should exist
    const mockBusinessPlans = [
      {
        id: DEV_CONFIG.businessId,
        title: 'My Main Business',
        status: 'draft' as const,
        userId: userId,
        content: {
          // 1. Cover Page
          coverPage: {
            businessName: 'My Main Business',
            tagline: 'Innovative Solutions for Tomorrow',
            businessAddress: '123 Main Street, Business City, BC 12345',
            contactInfo: 'info@mainbusiness.com | (555) 123-4567',
            date: new Date().toISOString().split('T')[0],
            confidentialityStatement: 'This document contains confidential information. Do not distribute without permission.'
          },
          
          // 2. Table of Contents
          tableOfContents: {
            sections: [
              'Executive Summary',
              'Company Description',
              'Products and Services',
              'Market Analysis',
              'Marketing and Sales Strategy',
              'Operations Plan',
              'Organization and Management',
              'Financial Plan',
              'Risk Analysis',
              'Implementation Timeline',
              'Appendices'
            ]
          },
          
          // 3. Executive Summary
          executiveSummary: {
            businessConcept: 'A comprehensive business solution that addresses market needs through innovative technology.',
            missionStatement: 'To provide exceptional value through innovative solutions that exceed customer expectations.',
            productsOverview: 'Our flagship product line includes software solutions for small to medium businesses.',
            marketOpportunity: 'The small business software market is growing at 12% annually with limited competition in our niche.',
            financialHighlights: 'Projected revenue of $1.2M in year one, with break-even expected in month 18.',
            managementTeam: 'Led by industry veterans with over 30 years of combined experience.',
            milestones: 'Product launch in Q1, market expansion in Q3, and international distribution by year 2.'
          },
          
          // 4. Company Description
          companyDescription: {
            businessStructure: 'Limited Liability Company (LLC)',
            legalStructure: 'Single-member LLC registered in Delaware',
            ownershipDetails: 'Fully owned by founder with 10% equity reserved for future employees',
            companyHistory: 'Founded in 2023 after identifying a gap in the market for integrated business solutions.',
            missionVisionValues: {
              mission: 'To simplify business operations through intuitive software solutions.',
              vision: 'To become the leading provider of business management software for SMBs by 2030.',
              values: ['Innovation', 'Integrity', 'Customer Focus', 'Excellence', 'Collaboration']
            },
            locations: ['Headquarters: Business City', 'Remote team: Nationwide'],
            keyMilestones: ['Concept development: Jan 2023', 'Company formation: Mar 2023', 'MVP development: Jun 2023']
          },
          
          // 5. Products and Services
          productsAndServices: {
            overview: 'Comprehensive business management software suite with modular components.',
            detailedDescriptions: [
              {
                name: 'Financial Manager',
                description: 'Complete financial management solution including invoicing, expense tracking, and reporting.'
              },
              {
                name: 'Inventory Control',
                description: 'Real-time inventory tracking and management with automated reordering.'
              },
              {
                name: 'Customer Relationship',
                description: 'CRM system with lead tracking, customer communication, and sales pipeline management.'
              }
            ],
            valueProposition: 'Our integrated approach saves businesses 15+ hours per week in administrative tasks.',
            intellectualProperty: 'Patent pending for our unique data synchronization method.',
            futureProducts: 'AI-powered business analytics platform scheduled for development in Q4.'
          },
          
          // 6. Market Analysis
          marketAnalysis: {
            industryOverview: 'The business software industry is valued at $400B globally with consistent growth.',
            marketSize: '$50B addressable market for SMB-focused solutions in North America.',
            targetMarket: 'Small to medium businesses with 10-100 employees in service and retail sectors.',
            marketSegmentation: [
              {
                segment: 'Small service businesses',
                size: '250,000 potential customers',
                characteristics: 'High need for efficiency, limited IT resources'
              },
              {
                segment: 'Medium retail businesses',
                size: '120,000 potential customers',
                characteristics: 'Complex inventory needs, customer management focus'
              }
            ],
            competitiveAnalysis: {
              directCompetitors: [
                {
                  name: 'BusinessSoft',
                  strengths: 'Established brand, large customer base',
                  weaknesses: 'Outdated interface, poor customer support'
                },
                {
                  name: 'EasyBiz',
                  strengths: 'Low price point, simple onboarding',
                  weaknesses: 'Limited features, no customization'
                }
              ],
              indirectCompetitors: ['Spreadsheet solutions', 'Manual processes']
            },
            swotAnalysis: {
              strengths: ['Integrated solution', 'Modern technology', 'Customer-centric design'],
              weaknesses: ['New market entrant', 'Limited brand recognition', 'Initial feature set'],
              opportunities: ['Growing market', 'Competitor dissatisfaction', 'Cloud adoption trends'],
              threats: ['Potential new entrants', 'Economic downturn', 'Changing regulations']
            }
          },
          
          // 7. Marketing and Sales Strategy
          marketingStrategy: {
            branding: 'Professional, reliable, and innovative business solution provider.',
            pricing: 'Subscription-based model starting at $49/month with tiered packages.',
            promotion: 'Content marketing, SEO, industry partnerships, and targeted digital advertising.',
            salesStrategy: 'Direct online sales with inside sales team for larger accounts.',
            channels: ['Website', 'Industry conferences', 'Partner referrals', 'Digital marketplaces'],
            customerRetention: 'Dedicated customer success team, regular training webinars, and loyalty program.'
          },
          
          // 8. Operations Plan
          operationsPlan: {
            businessModel: 'SaaS delivery with subscription billing and cloud-based infrastructure.',
            facilities: 'Main office in Business City with remote work capabilities for all staff.',
            technology: 'Cloud infrastructure on AWS, development tools include React, Node.js, and PostgreSQL.',
            productionProcess: 'Agile development methodology with bi-weekly releases and continuous integration.',
            qualityControl: 'Automated testing suite, manual QA process, and customer feedback loops.',
            logistics: 'Digital product delivery via secure cloud infrastructure.'
          },
          
          // 9. Organization and Management
          organizationAndManagement: {
            structure: 'Flat organizational structure with functional departments.',
            managementTeam: [
              {
                name: 'Jane Smith',
                position: 'CEO',
                background: '15 years in software development and business management'
              },
              {
                name: 'John Davis',
                position: 'CTO',
                background: '12 years in software architecture and cloud infrastructure'
              }
            ],
            advisors: [
              {
                name: 'Dr. Robert Johnson',
                expertise: 'Business scaling and venture capital'
              }
            ],
            hrPlan: 'Hiring plan includes 5 new positions in year one, focusing on development and customer success.'
          },
          
          // 10. Financial Plan
          financialPlan: {
            projections: {
              yearOne: {
                revenue: '$1.2M',
                expenses: '$1.5M',
                netProfit: '-$300K'
              },
              yearTwo: {
                revenue: '$3.5M',
                expenses: '$2.8M',
                netProfit: '$700K'
              },
              yearThree: {
                revenue: '$7.2M',
                expenses: '$5.1M',
                netProfit: '$2.1M'
              }
            },
            fundingNeeds: '$1.5M seed funding to cover development, marketing, and 18 months of operations.',
            useOfFunds: ['Product development: 40%', 'Marketing: 30%', 'Operations: 20%', 'Reserve: 10%'],
            exitStrategy: 'Potential acquisition by larger software provider or strategic industry partner.'
          },
          
          // 11. Risk Analysis
          riskAnalysis: {
            keyRisks: [
              {
                risk: 'Market adoption slower than projected',
                impact: 'High',
                probability: 'Medium',
                mitigation: 'Phased launch strategy with early adopter program'
              },
              {
                risk: 'Competitive response from established players',
                impact: 'Medium',
                probability: 'High',
                mitigation: 'Focus on underserved niches and superior customer experience'
              }
            ],
            contingencyPlans: 'Alternative revenue streams through consulting services if product adoption is delayed.'
          },
          
          // 12. Implementation Timeline
          implementationTimeline: {
            quarters: [
              {
                quarter: 'Q1 2023',
                milestones: ['Complete MVP', 'Beta testing program', 'Initial marketing campaign']
              },
              {
                quarter: 'Q2 2023',
                milestones: ['Official launch', 'First 100 customers', 'Feature expansion']
              },
              {
                quarter: 'Q3 2023',
                milestones: ['Market expansion', 'Strategic partnerships', 'Enhanced analytics module']
              }
            ],
            keyPerformanceIndicators: ['Customer acquisition cost', 'Monthly recurring revenue', 'Customer retention rate']
          },
          
          // 13. Appendices
          appendices: {
            documents: ['Detailed financial projections', 'Market research data', 'Product screenshots', 'Team resumes']
          },
          
          // 14. Document Control
          documentControl: {
            version: '1.0',
            lastUpdated: new Date().toISOString(),
            approvedBy: 'Jane Smith, CEO'
          }
        }
      },
      {
        id: 'dev-business-alt1',
        title: 'Coffee Shop Project',
        status: 'draft' as const,
        userId: userId,
        content: {
          // Basic structure with minimal content for the Coffee Shop
          coverPage: {
            businessName: 'Brew Haven Coffee',
            tagline: 'Your Neighborhood Coffee Experience',
            businessAddress: '456 Oak Street, Coffeeville, CV 54321',
            contactInfo: 'hello@brewhaven.com | (555) 987-6543',
            date: new Date().toISOString().split('T')[0]
          },
          executiveSummary: {
            businessConcept: 'A premium coffee shop offering specialty drinks and a comfortable workspace environment.',
            missionStatement: 'To create a welcoming community space while serving exceptional coffee.',
            productsOverview: 'Specialty coffee drinks, pastries, and light meals with locally sourced ingredients.'
          },
          // Other sections would be populated as the draft develops
        }
      },
      {
        id: 'dev-business-alt2',
        title: 'Tech Startup Plan',
        status: 'completed' as const,
        userId: userId,
        content: {
          // Comprehensive structure for the completed Tech Startup plan
          coverPage: {
            businessName: 'InnovateTech Solutions',
            tagline: 'Transforming Ideas into Reality',
            businessAddress: '789 Tech Blvd, Innovation City, IC 98765',
            contactInfo: 'contact@innovatetech.com | (555) 765-4321',
            date: '2023-01-15',
            confidentialityStatement: 'Confidential and proprietary information of InnovateTech Solutions.'
          },
          executiveSummary: {
            businessConcept: 'A technology startup focused on developing AI-powered solutions for healthcare providers.',
            missionStatement: 'To improve patient outcomes through innovative technology solutions.',
            productsOverview: 'AI diagnostic assistant, patient management platform, and telehealth integration services.',
            marketOpportunity: 'The healthcare IT market is projected to reach $390B by 2024 with 15% annual growth.',
            financialHighlights: 'Projected revenue of $2.5M in year one, with break-even expected in month 14.',
            managementTeam: 'Founded by healthcare professionals and AI specialists with proven track records.',
            milestones: 'FDA approval in Q2, hospital pilot programs in Q3, full market launch in Q4.'
          },
          // All other sections would be fully populated for this completed plan
        }
      }
    ]

    // Create or update each mock business plan
    for (const plan of mockBusinessPlans) {
      try {
        const existing = await prisma.businessPlan.findUnique({
          where: { id: plan.id }
        })

        if (existing) {
          console.log(`Business plan ${plan.id} already exists, updating content`)
          await prisma.businessPlan.update({
            where: { id: plan.id },
            data: {
              content: plan.content
            }
          })
        } else {
          await prisma.businessPlan.create({
            data: {
              id: plan.id,
              title: plan.title,
              status: plan.status,
              userId: plan.userId,
              content: plan.content
            }
          })
          console.log(`Created business plan: ${plan.id} - ${plan.title}`)
        }
      } catch (error) {
        console.error(`Error creating/updating business plan ${plan.id}:`, error)
      }
    }

    console.log('Development business plans seeded successfully')
  } catch (error) {
    console.error('Error seeding development data:', error)
  }
} 