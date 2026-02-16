import { buildFormsChecklist } from './formsEngine';
import { Country, FilingStatus, PayFrequency, UserInput, VisaStatus } from '../types';
import { calculateTax } from './taxCalculator';

const baseInput: UserInput = {
  visaStatus: VisaStatus.F1,
  country: Country.INDIA,
  yearsInUS: 2,
  state: 'Texas',
  hasMultiStateIncome: false,
  secondState: 'California',
  primaryStateIncome: 30000,
  secondStateIncome: 30000,
  payFrequency: PayFrequency.YEARLY,
  grossPay: 60000,
  preTaxDeductions: 2000,
  federalTaxPaid: 5000,
  ficaWithheld: 0,
  stateTaxWithheld: 0,
  filingStatus: FilingStatus.SINGLE,
  taxYear: 2025,
  hasStockIncome: false,
  stockProceeds: 0,
  stockCostBasis: 0,
};

describe('buildFormsChecklist', () => {
  test('includes likely F-1 forms with deadlines', () => {
    const result = calculateTax(baseInput);
    const checklist = buildFormsChecklist(baseInput, result);
    const names = checklist.map((item) => item.formName);

    expect(names.some((name) => name.includes('Form 8843'))).toBe(true);
    expect(names.some((name) => name.includes('1040-NR'))).toBe(true);
    expect(checklist.every((item) => item.deadline.length > 0)).toBe(true);
  });
});
