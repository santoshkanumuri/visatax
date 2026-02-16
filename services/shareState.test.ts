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
  secondStateIncomeShare: 40,
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
    expect(parsed.secondStateIncomeShare).toBe(40);
  });

  test('buildShareUrl returns empty string in non-browser runtime', () => {
    expect(buildShareUrl(sampleInput)).toBe('');
  });
});
