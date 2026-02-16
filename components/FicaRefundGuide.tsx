import React, { useState } from 'react';
import { ClipboardCopy, CheckCircle2, FileText, Mail } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface FicaRefundGuideProps {
  annualFicaWithheld: number;
  yearsInUS: number;
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export const FicaRefundGuide: React.FC<FicaRefundGuideProps> = ({ annualFicaWithheld, yearsInUS }) => {
  const [copied, setCopied] = useState(false);

  const payrollEmailTemplate = `Subject: Request to Correct FICA Withholding (F-1 Student Exemption)

Hi Payroll Team,

I am writing to request a correction for FICA withholding on my wages.

Details:
- Employee Name: [Your Name]
- Employee ID: [Your ID]
- Visa Status: F-1
- Calendar Years in US: ${yearsInUS}
- Estimated FICA Withheld: ${formatCurrency(annualFicaWithheld)}
- Pay Period(s) Impacted: [Date Range]

As an F-1 student within the exemption period, I understand Social Security and Medicare taxes may not apply to my wages during this period.

Could you please review and process the correction/refund, or share next steps if additional documents are needed?

Thank you,
[Your Name]
[Phone/Email]`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payrollEmailTemplate);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Could not copy FICA template text.', error);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-2">
          <CheckCircle2 size={16} />
          FICA Refund Helper
        </h3>
        <Tooltip text="For F-1 profiles within exemption window where FICA was withheld. Start with payroll correction before IRS filing." />
      </div>

      <p className="text-sm text-slate-700 leading-relaxed">
        Estimated potentially refundable FICA: <span className="font-semibold text-emerald-700">{formatCurrency(annualFicaWithheld)}</span>
      </p>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Step 1 (Recommended)</p>
          <p className="text-sm text-slate-700">Ask payroll to correct and refund FICA first.</p>
          <button
            onClick={handleCopy}
            className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ClipboardCopy size={13} />
            {copied ? 'Copied' : 'Copy Payroll Email Template'}
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Step 2 (If payroll cannot refund)</p>
          <p className="text-sm text-slate-700">File IRS refund path using Form 843 and Form 8316.</p>
        </div>

        <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Document Checklist</p>
          <div className="space-y-1 text-sm text-slate-700">
            <p className="flex items-center gap-2"><FileText size={13} /> Form 843</p>
            <p className="flex items-center gap-2"><FileText size={13} /> Form 8316</p>
            <p className="flex items-center gap-2"><FileText size={13} /> W-2 copies for affected year</p>
            <p className="flex items-center gap-2"><FileText size={13} /> Passport, visa, I-94, I-20/OPT-CPT support docs</p>
            <p className="flex items-center gap-2"><Mail size={13} /> Payroll response (if available)</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-4">
        Educational guidance only. Verify your facts with payroll/CPA before filing.
      </p>
    </div>
  );
};
