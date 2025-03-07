import { NextRequest, NextResponse } from 'next/server'

/**
 * GET handler for fetching a basic business plan
 * 
 * Retrieves the basic business plan content for a specific business ID
 * Returns 404 if no basic plan exists yet
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id
    
    // In a real implementation, you would retrieve the plan from a database
    // This is a mock implementation for demonstration purposes
    
    // Simulate database fetch with a timeout
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // For demo purposes, we'll return a mock plan for specific IDs
    // and a 404 for others to demonstrate the not-found flow
    if (businessId === 'demo' || businessId === '1') {
      return NextResponse.json({
        id: businessId,
        content: `<h1 class="ql-align-center">${businessId === 'demo' ? 'Demo' : 'Sample'} Business Plan</h1>

<h2 class="ql-align-left">1. Executive Summary</h2>
<p>An overview of your business and your plans. This section should highlight the key points from each section of your business plan.</p>

<h3>1.1 Business Concept</h3>
<p>Explain what business you're in, what you do, and what makes your business unique.</p>

<h3>1.2 Mission Statement</h3>
<p>Your company's purpose and core values.</p>

<h3>1.3 Vision</h3>
<p>What you aspire for your company to become.</p>

<h3>1.4 Financial Highlights</h3>
<p>Key financial projections and requirements.</p>

<h2>2. Company Description</h2>
<p>Detailed information about your company and the marketplace needs it addresses.</p>

<h3>2.1 Legal Structure</h3>
<p>Your business entity type (LLC, Corporation, etc.) and ownership details.</p>

<h3>2.2 Company History</h3>
<p>The story of your company's founding and development.</p>

<h3>2.3 Location & Facilities</h3>
<p>Information about where your business operates from.</p>

<h2>3. Products and Services</h2>
<p>Detailed descriptions of what you sell or provide to customers.</p>

<h3>3.1 Product/Service Overview</h3>
<p>Descriptions and specifications of your offerings.</p>

<h3>3.2 Value Proposition</h3>
<p>The unique value your products or services provide to customers.</p>

<h3>3.3 Intellectual Property</h3>
<p>Patents, trademarks, copyrights, or other IP you own or are pursuing.</p>

<h3>3.4 Future Products/Services</h3>
<p>Development plans for expanding your offerings.</p>

<h2>4. Market Analysis</h2>
<p>Research about your industry, target market, and competitors.</p>

<h3>4.1 Industry Overview</h3>
<p>Size, trends, growth rate, and other key metrics about your industry.</p>

<h3>4.2 Target Market</h3>
<p>Who your customers are, including demographics and psychographics.</p>

<h3>4.3 Market Segmentation</h3>
<p>How you divide your market into addressable groups.</p>

<h3>4.4 Competitive Analysis</h3>
<p>Information about who your competitors are and how you compare.</p>

<h3>4.5 SWOT Analysis</h3>
<p>Your business's Strengths, Weaknesses, Opportunities, and Threats.</p>

<h2>5. Marketing Strategy</h2>
<p>How you plan to reach and sell to your target customers.</p>

<h3>5.1 Branding</h3>
<p>Your brand identity and how you'll position yourself in the market.</p>

<h3>5.2 Pricing Strategy</h3>
<p>How you'll price your products or services.</p>

<h3>5.3 Promotion Strategy</h3>
<p>How you'll advertise and market your business.</p>

<h3>5.4 Sales Strategy</h3>
<p>Your approach to selling and the sales process.</p>

<h3>5.5 Distribution Channels</h3>
<p>How your products or services will reach customers.</p>

<h2>6. Operations Plan</h2>
<p>How your business will run on a day-to-day basis.</p>

<h3>6.1 Business Model</h3>
<p>How your business creates, delivers, and captures value.</p>

<h3>6.2 Production Process</h3>
<p>How you create or deliver your products or services.</p>

<h3>6.3 Technology Requirements</h3>
<p>Software, hardware, and other technology your business needs.</p>

<h3>6.4 Quality Control</h3>
<p>How you ensure consistent quality in your products or services.</p>

<h3>6.5 Supply Chain & Logistics</h3>
<p>Your suppliers, inventory management, and distribution systems.</p>

<h2>7. Organization & Management</h2>
<p>The structure of your company and who will run it.</p>

<h3>7.1 Organizational Structure</h3>
<p>Your company's hierarchy and departmental organization.</p>

<h3>7.2 Management Team</h3>
<p>Key team members and their qualifications.</p>

<h3>7.3 Board of Directors/Advisors</h3>
<p>External guidance and governance for your company.</p>

<h3>7.4 Human Resources Plan</h3>
<p>Your hiring plan and employee management approach.</p>

<h2>8. Financial Plan</h2>
<p>The numbers that drive your business.</p>

<h3>8.1 Income Statement Projections</h3>
<p>Projected revenue, expenses, and profit over time.</p>

<h3>8.2 Cash Flow Projections</h3>
<p>How money will move into and out of your business.</p>

<h3>8.3 Balance Sheet Projections</h3>
<p>Your projected assets, liabilities, and equity.</p>

<h3>8.4 Break-Even Analysis</h3>
<p>When your business will become profitable.</p>

<h3>8.5 Funding Requirements</h3>
<p>How much money you need and what you'll use it for.</p>

<h3>8.6 Exit Strategy</h3>
<p>Your long-term plan for the business (acquisition, IPO, etc.).</p>

<h2>9. Appendix</h2>
<p>Additional information that supports your business plan.</p>
<ul>
  <li>Detailed financial projections</li>
  <li>Market research data</li>
  <li>Legal documents</li>
  <li>Patents, trademarks, or other IP documentation</li>
  <li>Résumés of key team members</li>
  <li>Other supporting documents</li>
</ul>`,
        updatedAt: new Date().toISOString()
      })
    }
    
    // Check if a basic plan exists for this business ID
    // In a real implementation, you would query your database
    
    // For demo purposes, we'll return a 404 to demonstrate the not-found flow
    return NextResponse.json(
      { error: 'Basic business plan not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error fetching basic business plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business plan' },
      { status: 500 }
    )
  }
}

/**
 * PUT handler for updating a basic business plan
 * 
 * Saves the updated basic business plan content for a specific business ID
 * Creates a new plan if one doesn't exist yet
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id
    const data = await request.json()
    
    // Validate the request body
    if (!data.content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }
    
    // In a real implementation, you would save the plan to a database
    // This is a mock implementation for demonstration purposes
    
    // Simulate database save with a timeout
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // For demo purposes, we'll just pretend it was saved
    return NextResponse.json({
      id: businessId,
      content: data.content,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error saving basic business plan:', error)
    return NextResponse.json(
      { error: 'Failed to save business plan' },
      { status: 500 }
    )
  }
} 