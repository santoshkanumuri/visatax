import { UserInput, TaxResult, VisaStatus } from '../types';
import { FormsChecklistItem } from './formsEngine';

export interface TimelineItem {
  id: string;
  title: string;
  detail: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface TimelineSection {
  id: 'this_month' | 'next_month' | 'filing_window';
  title: string;
  items: TimelineItem[];
}

const monthYear = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

export const buildTaxTimeline = (
  input: UserInput,
  result: TaxResult,
  formsChecklist: FormsChecklistItem[]
): TimelineSection[] => {
  const today = new Date();
  const filingYear = input.taxYear + 1;
  const filingDeadline = new Date(filingYear, 3, 15);
  const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const thisMonthItems: TimelineItem[] = [
    {
      id: 'verify_inputs',
      title: 'Verify your latest paystub numbers',
      detail: 'Update federal, FICA, and state withheld values before filing.',
      urgency: 'high',
    },
  ];

  if (input.visaStatus === VisaStatus.F1 && input.yearsInUS <= 5 && input.ficaWithheld > 0) {
    thisMonthItems.push({
      id: 'fica_payroll_request',
      title: 'Ask payroll for FICA correction',
      detail: 'Send refund request now so IRS filing is only backup.',
      urgency: 'high',
    });
  }

  const nextMonthItems: TimelineItem[] = [
    {
      id: 'forms_ready',
      title: 'Prepare your filing packet',
      detail: `Draft forms: ${formsChecklist.map((item) => item.formName).join(', ')}.`,
      urgency: 'medium',
    },
  ];

  if (result.totalRefundOrOwe < 0) {
    nextMonthItems.push({
      id: 'save_tax_due',
      title: 'Set aside tax due amount',
      detail: `Plan cash for estimated amount owed before deadline.`,
      urgency: 'medium',
    });
  }

  const filingWindowItems: TimelineItem[] = [
    {
      id: 'deadline',
      title: `File by ${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(filingDeadline)}`,
      detail: 'Submit federal and state returns before penalty windows begin.',
      urgency: today > filingDeadline ? 'high' : 'medium',
    },
  ];

  return [
    {
      id: 'this_month',
      title: `This Month (${monthYear(today)})`,
      items: thisMonthItems,
    },
    {
      id: 'next_month',
      title: `Next Month (${monthYear(nextMonthDate)})`,
      items: nextMonthItems,
    },
    {
      id: 'filing_window',
      title: 'Filing Window',
      items: filingWindowItems,
    },
  ];
};
