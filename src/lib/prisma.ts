/**
 * Prisma Client Singleton
 * 
 * Creates and exports a singleton instance of the Prisma client
 * to prevent multiple client instances during hot reloading
 */

import { PrismaClient } from '@prisma/client'

// Prevent multiple instances during development hot reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Create or use existing Prisma client instance
export const prisma = globalForPrisma.prisma || new PrismaClient()

// Save in global object during development to prevent duplicate instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 