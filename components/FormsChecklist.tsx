import React from 'react';
import { ClipboardList } from 'lucide-react';
import { FormsChecklistItem } from '../services/formsEngine';
import { Tooltip } from './Tooltip';
import { ConfidenceLevel } from '../types';
import { ConfidenceBadge } from './ConfidenceBadge';

interface FormsChecklistProps {
  items: FormsChecklistItem[];
  confidence?: ConfidenceLevel;
}

const confidenceClasses: Record<FormsChecklistItem['confidence'], string> = {
  'Likely Required': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Likely Not Required': 'bg-slate-100 text-slate-600 border-slate-200',
  'Needs Confirmation': 'bg-amber-100 text-amber-700 border-amber-200',
};

export const FormsChecklist: React.FC<FormsChecklistProps> = ({ items, confidence }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <ClipboardList size={16} className="text-blue-600" />
          What Forms Should I File?
        </h3>
        <div className="flex items-center gap-2">
          {confidence && <ConfidenceBadge level={confidence} />}
          <Tooltip text="This is a likely checklist from your current profile, not official filing advice." />
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">{item.formName}</p>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${confidenceClasses[item.confidence]}`}>
                {item.confidence}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Deadline: {item.deadline}</p>
            <p className="text-sm text-slate-700 mt-2">{item.reason}</p>
            <p className="text-xs text-slate-600 mt-1">{item.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
