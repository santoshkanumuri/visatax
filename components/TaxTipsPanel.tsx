import React from 'react';
import { Lightbulb, CircleDollarSign, ShieldCheck, Landmark } from 'lucide-react';
import { UserInput, TaxResult, StateTaxInfo, VisaStatus } from '../types';
import { FICA_CONSTANTS } from '../constants';
import { Tooltip } from './Tooltip';
import { getAnnualAmount } from '../services/taxCalculator';

interface TaxTipsPanelProps {
  input: UserInput;
  result: TaxResult;
  taxYear401kLimit: number;
  stateInfo?: StateTaxInfo;
}

interface Tip {
  id: string;
  title: string;
  detail: string;
  tone: 'blue' | 'emerald' | 'amber';
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export const TaxTipsPanel: React.FC<TaxTipsPanelProps> = ({ input, result, taxYear401kLimit, stateInfo }) => {
  const annualPreTax = getAnnualAmount(input.preTaxDeductions, input.payFrequency);
  const annualFicaWithheld = getAnnualAmount(input.ficaWithheld, input.payFrequency);
  const tips: Tip[] = [];

  const remaining401kRoom = Math.max(0, taxYear401kLimit - annualPreTax);
  if (remaining401kRoom > 0) {
    tips.push({
      id: 'k401_room',
      title: 'You may still reduce taxable income',
      detail: `Estimated room left in pre-tax savings is ${formatCurrency(remaining401kRoom)} for this tax year.`,
      tone: 'blue',
    });
  }

  if (input.visaStatus === VisaStatus.F1 && input.yearsInUS <= FICA_CONSTANTS.F1_EXEMPTION_CALENDAR_YEARS && annualFicaWithheld > 0) {
    tips.push({
      id: 'fica_refund',
      title: 'FICA looks potentially refundable',
      detail: `${formatCurrency(annualFicaWithheld)} FICA withheld while your profile is within exemption years.`,
      tone: 'emerald',
    });
  }

  if (result.totalRefundOrOwe < -1000) {
    tips.push({
      id: 'owe_planning',
      title: 'You may owe a larger balance',
      detail: `Consider adjusting W-4 or making estimated payments for ${formatCurrency(Math.abs(result.totalRefundOrOwe))}.`,
      tone: 'amber',
    });
  }

  if (stateInfo?.category === 'none' && input.stateTaxWithheld > 0) {
    tips.push({
      id: 'state_withheld_none',
      title: 'State withholding may be unnecessary',
      detail: `${stateInfo.name} has no state income tax. Re-check why state tax is being withheld.`,
      tone: 'blue',
    });
  }

  if (tips.length === 0) {
    tips.push({
      id: 'all_good',
      title: 'No major optimization flags',
      detail: 'Your current inputs look reasonable. Recheck with final paystub before filing.',
      tone: 'emerald',
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />
          Smart Tips
        </h3>
        <Tooltip text="Rule-based suggestions using your current inputs. These are guidance tips, not legal or tax advice." />
      </div>

      <div className="space-y-3">
        {tips.map((tip) => {
          const toneClasses =
            tip.tone === 'emerald'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
              : tip.tone === 'amber'
              ? 'bg-amber-50 border-amber-100 text-amber-900'
              : 'bg-blue-50 border-blue-100 text-blue-900';
          const icon =
            tip.tone === 'emerald' ? <ShieldCheck size={14} /> : tip.tone === 'amber' ? <Landmark size={14} /> : <CircleDollarSign size={14} />;

          return (
            <div key={tip.id} className={`rounded-xl border p-3 ${toneClasses}`}>
              <p className="text-sm font-semibold flex items-center gap-2">
                {icon}
                {tip.title}
              </p>
              <p className="text-xs mt-1 leading-relaxed">{tip.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
