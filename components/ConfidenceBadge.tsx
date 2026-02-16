import React from 'react';
import { ConfidenceLevel } from '../types';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
}

const levelClasses: Record<ConfidenceLevel, string> = {
  Exact: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Estimated: 'bg-blue-100 text-blue-700 border-blue-200',
  'Needs confirmation': 'bg-amber-100 text-amber-700 border-amber-200',
};

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ level }) => {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full border ${levelClasses[level]}`}>
      {level}
    </span>
  );
};
