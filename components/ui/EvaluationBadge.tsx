
import React from 'react';
import { EvaluationStatus } from '../../types';

interface EvaluationBadgeProps {
  status: EvaluationStatus;
}

const EvaluationBadge: React.FC<EvaluationBadgeProps> = ({ status }) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const statusStyles: Record<EvaluationStatus, string> = {
    [EvaluationStatus.Successful]: 'bg-green-500/20 text-green-400',
    [EvaluationStatus.NoAnswer]: 'bg-orange-500/20 text-orange-400',
    [EvaluationStatus.Failed]: 'bg-red-500/20 text-red-400',
  };

  const statusDot: Record<EvaluationStatus, string> = {
    [EvaluationStatus.Successful]: 'bg-green-500',
    [EvaluationStatus.NoAnswer]: 'bg-orange-500',
    [EvaluationStatus.Failed]: 'bg-red-500',
  }

  return (
    <span className={`${baseClasses} ${statusStyles[status]}`}>
        <span className={`w-2 h-2 mr-1.5 rounded-full ${statusDot[status]}`}></span>
        {status}
    </span>
  );
};

export default EvaluationBadge;
   