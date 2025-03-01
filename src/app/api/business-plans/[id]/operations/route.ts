import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Interface for operations data structure
 */
interface OperationsData {
  production?: string;
  productionData?: any;
  qualityControl?: string;
  qualityControlData?: any;
  inventory?: string;
  kpis?: string;
  technology?: string;
}

/**
 * Handle POST requests to save operations data
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlanId = params.id;
    const operationsData: OperationsData = await request.json();
    
    // Get the business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId },
      select: { content: true },
    });
    
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      );
    }
    
    const content = businessPlan.content as any;
    
    // Update the business plan with the operations data
    await prisma.businessPlan.update({
      where: { id: businessPlanId },
      data: {
        content: {
          ...content,
          operations: {
            ...content.operations,
            ...operationsData,
          },
        },
      },
    });
    
    return NextResponse.json({
      message: 'Operations data saved successfully',
      operations: operationsData,
    });
  } catch (error) {
    console.error('Error saving operations data:', error);
    return NextResponse.json(
      { error: 'Failed to save operations data' },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests to retrieve operations data
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessPlanId = params.id;
    
    // Get the business plan
    const businessPlan = await prisma.businessPlan.findUnique({
      where: { id: businessPlanId },
      select: { content: true },
    });
    
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      );
    }
    
    const content = businessPlan.content as any;
    const operations = content.operations || {};
    
    // Return the operations data in a format compatible with GenericQuestionnaire
    return NextResponse.json({
      operations: operations,
      // Add each section directly to the response for GenericQuestionnaire compatibility
      production: operations.production ? {
        content: operations.production,
        data: operations.productionData || {}
      } : null,
      qualityControl: operations.qualityControl ? {
        content: operations.qualityControl,
        data: operations.qualityControlData || {}
      } : null,
      inventory: operations.inventory ? {
        content: operations.inventory,
        data: operations.inventoryData || {}
      } : null,
      kpis: operations.kpis ? {
        content: operations.kpis,
        data: operations.kpisData || {}
      } : null,
      technology: operations.technology ? {
        content: operations.technology,
        data: operations.technologyData || {}
      } : null
    });
  } catch (error) {
    console.error('Error retrieving operations data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve operations data' },
      { status: 500 }
    );
  }
} 