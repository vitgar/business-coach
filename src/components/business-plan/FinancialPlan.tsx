/**
 * @deprecated This component is deprecated and has been replaced by FinancialPlanGeneric.tsx.
 * Please use the new component for all future development.
 * This file is kept for reference purposes only and should not be used in production.
 */

import React from 'react';

// Placeholder component to avoid import errors
const FinancialPlan: React.FC<{ businessPlanId: string; isEditing?: boolean }> = (props) => {
  console.warn('DEPRECATED: FinancialPlan component is deprecated. Please use FinancialPlanGeneric instead.');
  return null;
};

export default FinancialPlan; 