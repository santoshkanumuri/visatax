import { buildShareUrl, parseShareState, serializeShareState } from './shareState';
import { Country, FilingStatus, PayFrequency, UserInput, VisaStatus, F1WorkType } from '../types';

const sampleInput: UserInput = {
  visaStatus: VisaStatus.F1,
  f1WorkType: F1WorkType.OPT,
  country: Country.INDIA,
  yearsInUS: 3,
  state: 'California',
  hasMultiStateIncome: true,
  secondState: 'Texas',
  primaryStateIncome: 1800,
  secondStateIncome: 1200,
  payFrequency: PayFrequency.BIWEEKLY,
  grossPay: 3000,
  preTaxDeductions: 100,
  federalTaxPaid: 250,
  ficaWithheld: 0,
  stateTaxWithheld: 40,
  filingStatus: FilingStatus.SINGLE,
  taxYear: 2025,
  standardDeductionOverride: undefined,
  hasStockIncome: false,
  stockProceeds: 0,
  stockCostBasis: 0,
};

describe('share state serialization', () => {
  test('roundtrip keeps core fields', () => {
    const search = serializeShareState(sampleInput);
    const parsed = parseShareState(`?${search}`);

    expect(parsed.visaStatus).toBe(sampleInput.visaStatus);
    expect(parsed.f1WorkType).toBe(sampleInput.f1WorkType);
    expect(parsed.payFrequency).toBe(sampleInput.payFrequency);
    expect(parsed.hasMultiStateIncome).toBe(true);
    expect(parsed.secondState).toBe('Texas');
    expect(parsed.primaryStateIncome).toBe(1800);
    expect(parsed.secondStateIncome).toBe(1200);
  });

  test('legacy percentage links are migrated to explicit state incomes', () => {
    const parsed = parseShareState(
      '?grossPay=3000&secondStateIncomeShare=40&hasMultiStateIncome=1&state=California&secondState=Texas'
    );

    expect(parsed.primaryStateIncome).toBe(1800);
    expect(parsed.secondStateIncome).toBe(1200);
  });

  test('buildShareUrl returns empty string in non-browser runtime', () => {
    expect(buildShareUrl(sampleInput)).toBe('');
  });
});
