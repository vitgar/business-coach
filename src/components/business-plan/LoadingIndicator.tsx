'use client';

import React from 'react';

/**
 * Props interface for the LoadingIndicator component
 */
interface LoadingIndicatorProps {
  /**
   * Type of loading indicator to display
   * - 'spinner' (default): Shows a spinning circle
   * - 'dots': Shows animated dots
   */
  type?: 'spinner' | 'dots';
  
  /**
   * Size of the loading indicator in pixels
   * Default: 24
   */
  size?: number;
  
  /**
   * Color of the loading indicator
   * Default: currentColor (inherits from parent)
   */
  color?: string;
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
}

/**
 * LoadingIndicator component
 * 
 * Renders a loading indicator with either spinner or dots animation
 */
export default function LoadingIndicator({
  type = 'spinner',
  size = 24,
  color = 'currentColor',
  className = '',
}: LoadingIndicatorProps) {
  // Common styles
  const commonStyles = {
    width: `${size}px`,
    height: `${size}px`,
    color,
  };
  
  // If type is spinner, render spinner animation
  if (type === 'spinner') {
    return (
      <div 
        className={`inline-block animate-spin text-center ${className}`} 
        style={commonStyles} 
        role="status" 
        aria-label="Loading"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }
  
  // If type is dots, render dots animation
  return (
    <div 
      className={`inline-flex items-center ${className}`} 
      role="status" 
      aria-label="Loading"
    >
      <span className="flex space-x-1">
        <span className="sr-only">Loading</span>
        <span 
          className="inline-block rounded-full animate-bounce" 
          style={{ 
            backgroundColor: color, 
            width: `${size / 4}px`, 
            height: `${size / 4}px`,
            animationDelay: '0s' 
          }}
        />
        <span 
          className="inline-block rounded-full animate-bounce" 
          style={{ 
            backgroundColor: color, 
            width: `${size / 4}px`, 
            height: `${size / 4}px`,
            animationDelay: '0.1s' 
          }}
        />
        <span 
          className="inline-block rounded-full animate-bounce" 
          style={{ 
            backgroundColor: color, 
            width: `${size / 4}px`, 
            height: `${size / 4}px`,
            animationDelay: '0.2s' 
          }}
        />
      </span>
    </div>
  );
} 