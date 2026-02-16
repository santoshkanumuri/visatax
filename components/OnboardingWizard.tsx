import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ONBOARDING_PRESETS } from '../constants';
import { OnboardingPersona, OnboardingPreset } from '../types';
import { Tooltip } from './Tooltip';

interface OnboardingWizardProps {
  onSelectPersona: (persona: OnboardingPersona) => void;
  onSkip: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onSelectPersona, onSkip }) => {
  const entries = Object.entries(ONBOARDING_PRESETS) as Array<[OnboardingPersona, OnboardingPreset]>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600" />
            Quick Start for Indian Students
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Pick your situation to prefill values. You can edit everything after this step.
          </p>
        </div>
        <Tooltip text="This setup is optional. If you already know your numbers, skip and fill directly." />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {entries.map(([persona, preset]) => (
          <button
            key={persona}
            onClick={() => onSelectPersona(persona)}
            className="text-left border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{preset.title}</p>
                <p className="text-sm text-slate-600 mt-0.5">{preset.subtitle}</p>
              </div>
              <ArrowRight size={16} className="text-slate-400 shrink-0" />
            </div>

            <div className="mt-3 text-xs text-slate-500 space-y-1">
              {preset.steps.map((step) => (
                <p key={step}>- {step}</p>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={onSkip}
          className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          Skip quick start and enter manually
        </button>
      </div>
    </div>
  );
};
