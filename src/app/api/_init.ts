/**
 * API Initialization
 * 
 * This file is imported by API routes to ensure development data is seeded.
 * It runs once when the first API route is accessed.
 */

import { seedDevUser } from '@/lib/seed-dev-data'

// Flag to track if initialization has been done
let initialized = false

/**
 * Initialize API dependencies
 * 
 * Seeds development user if needed, but not sample business plans
 */
export async function initializeApi() {
  if (initialized) return
  
  try {
    // Seed development user only, not business plans
    if (process.env.NODE_ENV === 'development') {
      await seedDevUser()
    }
    
    initialized = true
  } catch (error) {
    console.error('Error initializing API:', error)
  }
}

// Run initialization immediately
initializeApi().catch(console.error) 