/**
 * Development configuration
 * 
 * This file contains configuration values used during development.
 * These values should be replaced with real authentication in production.
 */

export const DEV_CONFIG = {
  // Fixed user ID for development
  userId: 'dev-user-12345',
  
  // Detect if we're in development mode
  isDevMode: process.env.NODE_ENV === 'development',
  
  // Flag to enable/disable development features
  useDevAuth: process.env.NODE_ENV === 'development'
} 