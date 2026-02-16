import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ExplainDrawerProps {
  title: string;
  summary: string;
  children: React.ReactNode;
}

export const ExplainDrawer: React.FC<ExplainDrawerProps> = ({ title, summary, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{summary}</p>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 py-3 text-sm text-slate-700 bg-white border-t border-slate-200">{children}</div>}
    </div>
  );
};
