import React from 'react';
import { Tooltip } from './Tooltip';

interface InputGroupProps {
  label: string;
  tooltip: string;
  children: React.ReactNode;
  className?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ label, tooltip, children, className = '' }) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 tracking-tight">{label}</label>
        {tooltip && <div className="mr-auto"><Tooltip text={tooltip} /></div>}
      </div>
      {children}
    </div>
  );
};