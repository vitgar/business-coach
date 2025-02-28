/**
 * @deprecated This component is deprecated and has been replaced by BusinessDescriptionGeneric.tsx.
 * Please use the new component for all future development.
 * This file is kept for reference purposes only and should not be used in production.
 */

import React from 'react';

// Placeholder component to avoid import errors
const BusinessDescription: React.FC<{ businessPlanId: string; isEditing?: boolean }> = (props) => {
  console.warn('DEPRECATED: BusinessDescription component is deprecated. Please use BusinessDescriptionGeneric instead.');
  return null;
};

export default BusinessDescription; 