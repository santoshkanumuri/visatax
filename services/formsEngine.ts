import { UserInput, TaxResult, VisaStatus } from '../types';
import { STATES_LIST } from '../constants';

export type FilingConfidence = 'Likely Required' | 'Likely Not Required' | 'Needs Confirmation';

export interface FormsChecklistItem {
  id: string;
  formName: string;
  confidence: FilingConfidence;
  deadline: string;
  reason: string;
  action: string;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const buildFormsChecklist = (input: UserInput, result: TaxResult): FormsChecklistItem[] => {
  const filingYear = input.taxYear + 1;
  const april15 = new Date(filingYear, 3, 15);
  const june15 = new Date(filingYear, 5, 15);
  const hasIncome = result.grossPay > 0;

  const checklist: FormsChecklistItem[] = [];

  if (input.visaStatus === VisaStatus.F1) {
    checklist.push({
      id: '8843',
      formName: 'Form 8843',
      confidence: 'Likely Required',
      deadline: formatDate(hasIncome ? april15 : june15),
      reason: 'Most F-1 students file Form 8843 each year, even when income is low or zero.',
      action: 'Prepare passport/I-94 history and school immigration details before filing.',
    });
  }

  const shouldUse1040NR = input.visaStatus === VisaStatus.F1 && input.yearsInUS <= 5;
  checklist.push({
    id: shouldUse1040NR ? '1040nr' : '1040',
    formName: shouldUse1040NR ? 'Form 1040-NR (Federal Return)' : 'Form 1040 (Federal Return)',
    confidence: shouldUse1040NR ? 'Likely Required' : 'Needs Confirmation',
    deadline: formatDate(april15),
    reason: shouldUse1040NR
      ? 'F-1 students in first 5 calendar years are typically nonresident filers.'
      : 'Based on your profile you may be treated as resident filer, but confirm residency tests.',
    action: shouldUse1040NR
      ? 'Use nonresident filing path and keep treaty/visa records ready.'
      : 'Confirm resident vs nonresident status before filing.',
  });

  const stateInfo = STATES_LIST.find((state) => state.name === input.state);
  const likelyStateReturn = (result.stateTax > 0 || input.stateTaxWithheld > 0) && stateInfo?.category !== 'none';
  checklist.push({
    id: 'state_return',
    formName: `${input.state} State Return`,
    confidence: likelyStateReturn ? 'Likely Required' : 'Likely Not Required',
    deadline: formatDate(april15),
    reason: likelyStateReturn
      ? `${input.state} tax is estimated/withheld in your profile.`
      : `${input.state} appears to have no state filing requirement from current inputs.`,
    action: likelyStateReturn
      ? 'Collect state withholding details from W-2 and file state return.'
      : 'Keep paystub/W-2 records in case state filing becomes necessary.',
  });

  if (input.visaStatus === VisaStatus.F1 && input.yearsInUS <= 5 && input.ficaWithheld > 0) {
    checklist.push({
      id: '843',
      formName: 'Form 843 + Form 8316 (FICA Refund Path)',
      confidence: 'Likely Required',
      deadline: 'As soon as payroll refund is denied or delayed',
      reason: 'Your profile suggests FICA may have been withheld while exempt.',
      action: 'Request payroll refund first. If unresolved, prepare Form 843/8316 package.',
    });
  }

  return checklist;
};
