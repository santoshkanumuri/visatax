import React from 'react';
import { CalendarClock } from 'lucide-react';
import { TimelineSection } from '../services/deadlineEngine';
import { Tooltip } from './Tooltip';

interface TaxTimelineProps {
  sections: TimelineSection[];
}

const urgencyClass = {
  high: 'text-rose-700 bg-rose-100',
  medium: 'text-amber-700 bg-amber-100',
  low: 'text-slate-700 bg-slate-100',
};

export const TaxTimeline: React.FC<TaxTimelineProps> = ({ sections }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <CalendarClock size={16} className="text-indigo-600" />
          Tax Timeline
        </h3>
        <Tooltip text='Simple action plan for "this month", "next month", and filing window.' />
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{section.title}</p>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div key={item.id} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${urgencyClass[item.urgency]}`}>
                      {item.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
