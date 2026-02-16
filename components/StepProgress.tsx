import React from 'react';

interface StepProgressProps {
  activeStep: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
}

const STEP_CONFIG: Array<{ id: 1 | 2 | 3; label: string; helper: string }> = [
  { id: 1, label: 'Profile', helper: 'Visa, state, years in US' },
  { id: 2, label: 'Income', helper: 'Pay, deductions, withholding' },
  { id: 3, label: 'Review', helper: 'Estimate, breakdown, action tips' },
];

export const StepProgress: React.FC<StepProgressProps> = ({ activeStep, onStepChange }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {STEP_CONFIG.map((step) => {
          const isActive = step.id === activeStep;
          const isCompleted = step.id < activeStep;

          return (
            <button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={`text-left rounded-xl px-3 py-3 border transition-colors ${
                isActive
                  ? 'bg-blue-50 border-blue-200'
                  : isCompleted
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {step.id}
                </span>
                <span className="font-semibold text-slate-900 text-sm">{step.label}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{step.helper}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
