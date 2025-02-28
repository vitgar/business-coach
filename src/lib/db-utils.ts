import { prisma } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'

/**
 * Helper functions to access Prisma models safely with consistent casing
 * 
 * This resolves inconsistencies in how Prisma models are accessed across the codebase.
 * The models in Prisma schema use PascalCase (TodoList), but the generated client 
 * uses camelCase (todoList) in its properties.
 * 
 * This wrapper ensures consistent access regardless of these differences.
 */

// Explicitly define types for the Prisma client with indexed access
interface PrismaClientWithIndexAccess extends PrismaClient {
  [key: string]: any
}

// Cast prisma client to allow indexed access
const prismaWithIndexAccess = prisma as PrismaClientWithIndexAccess

/**
 * A direct map to access Prisma models through a consistent interface
 * 
 * Use this instead of directly accessing prisma to ensure consistent
 * model access throughout the codebase.
 */
export const prismaDb = {
  // User model and related models
  user: prisma.user,
  businessPlan: prisma.businessPlan,
  conversation: prisma.conversation,
  message: prisma.message,
  
  // Strategic and marketing plan models
  strategicPlan: prisma.strategicPlan,
  marketingPlan: prisma.marketingPlan,
  
  // Resource and progress models
  resource: prisma.resource,
  progress: prisma.progress,
  
  // Smart Journal models - these should match what Prisma client generates
  // In Prisma schema these are defined as TodoList and TodoItem (PascalCase)
  // But Prisma client generates todoList and todoItem (camelCase)
  // We use indexed access with casting to prevent TypeScript errors
  todoList: prismaWithIndexAccess.todoList,
  todoItem: prismaWithIndexAccess.todoItem
}

/**
 * Helper function to generate CUID for new records
 */
function generateCuid() {
  return 'cuid_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Helper function to format SQL WHERE conditions
 */
function formatConditions(conditions: Record<string, any>): string {
  return Object.entries(conditions)
    .map(([key, value]) => `"${key}" = ${value}`)
    .join(' AND ');
}

/**
 * Helper function to format SQL SET updates
 */
function formatUpdates(updates: Record<string, any>): string {
  return Object.entries(updates)
    .map(([key, value]) => `"${key}" = ${value}`)
    .join(', ');
} 