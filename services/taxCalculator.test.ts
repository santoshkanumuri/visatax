import { calculateTax } from './taxCalculator';
import { Country, FilingStatus, PayFrequency, UserInput, VisaStatus } from '../types';
import { FICA_CONSTANTS } from '../constants';
import { getTaxYearData } from './taxRulesLoader';

const createBaseInput = (): UserInput => ({
  visaStatus: VisaStatus.F1,
  country: Country.INDIA,
  yearsInUS: 1,
  state: 'Texas',
  hasMultiStateIncome: false,
  secondState: 'California',
  primaryStateIncome: 45000,
  secondStateIncome: 45000,
  payFrequency: PayFrequency.YEARLY,
  grossPay: 90000,
  preTaxDeductions: 3000,
  federalTaxPaid: 10000,
  ficaWithheld: 0,
  stateTaxWithheld: 0,
  filingStatus: FilingStatus.SINGLE,
  taxYear: 2025,
  hasStockIncome: false,
  stockProceeds: 0,
  stockCostBasis: 0,
});

describe('calculateTax edge cases', () => {
  test('F-1 year 5 is FICA exempt but year 6 is not', () => {
    const year5 = calculateTax({ ...createBaseInput(), yearsInUS: 5 });
    const year6 = calculateTax({ ...createBaseInput(), yearsInUS: 6 });

    expect(year5.ficaTax).toBe(0);
    expect(year5.ficaBreakdown.isExempt).toBe(true);
    expect(year6.ficaTax).toBeGreaterThan(0);
    expect(year6.ficaBreakdown.isExempt).toBe(false);
  });

  test('Additional Medicare tax applies above threshold', () => {
    const input = createBaseInput();
    input.visaStatus = VisaStatus.H1B;
    input.yearsInUS = 6;
    input.grossPay = 250000;
    input.preTaxDeductions = 0;

    const result = calculateTax(input);
    const ssBase = getTaxYearData(2025).SS_WAGE_BASE;
    const expectedFica =
      Math.min(input.grossPay, ssBase) * FICA_CONSTANTS.SS_EMPLOYEE_RATE +
      input.grossPay * FICA_CONSTANTS.MEDICARE_EMPLOYEE_RATE +
      (input.grossPay - 200000) * FICA_CONSTANTS.ADDITIONAL_MEDICARE_RATE;

    expect(result.ficaTax).toBeCloseTo(expectedFica, 2);
    expect(result.ficaBreakdown.additionalMedicareTax).toBeCloseTo(450, 2);
  });

  test('Capital loss should not add capital gains tax', () => {
    const result = calculateTax({
      ...createBaseInput(),
      hasStockIncome: true,
      stockProceeds: 1000,
      stockCostBasis: 2000,
    });

    expect(result.capitalGains).toBe(-1000);
    expect(result.capitalGainsTax).toBe(0);
  });

  test('No-income-tax state should return zero state tax', () => {
    const result = calculateTax({ ...createBaseInput(), state: 'Texas' });
    expect(result.stateTax).toBe(0);
    expect(result.stateRateUsed).toBe(0);
  });

  test('Intermediate and final totals remain internally consistent', () => {
    const input = createBaseInput();
    input.visaStatus = VisaStatus.H1B;
    input.yearsInUS = 6;
    input.state = 'California';
    input.hasStockIncome = true;
    input.stockProceeds = 7000;
    input.stockCostBasis = 5000;

    const result = calculateTax(input);
    const expectedTotalTax =
      result.federalTaxLiability + result.stateTax + result.ficaTax + (result.capitalGainsTax || 0);
    const expectedTotalRefundOrOwe =
      result.refundOrOwe +
      result.ficaRefundOrOwe +
      result.stateRefundOrOwe +
      (result.capitalGainsRefundOrOwe || 0);

    expect(result.totalTaxLiability).toBeCloseTo(expectedTotalTax, 2);
    expect(result.totalRefundOrOwe).toBeCloseTo(expectedTotalRefundOrOwe, 2);
  });

  test('Biweekly and yearly equivalent pay produce matching annualized results', () => {
    const yearly = calculateTax({
      ...createBaseInput(),
      payFrequency: PayFrequency.YEARLY,
      grossPay: 78000,
      preTaxDeductions: 2600,
      federalTaxPaid: 8200,
      ficaWithheld: 0,
      stateTaxWithheld: 0,
    });

    const biweekly = calculateTax({
      ...createBaseInput(),
      payFrequency: PayFrequency.BIWEEKLY,
      grossPay: 3000,
      preTaxDeductions: 100,
      federalTaxPaid: 315.384615, // 8200/26
      ficaWithheld: 0,
      stateTaxWithheld: 0,
    });

    expect(biweekly.grossPay).toBeCloseTo(yearly.grossPay, 0);
    expect(biweekly.adjustedGrossIncome).toBeCloseTo(yearly.adjustedGrossIncome, 0);
    expect(biweekly.totalTaxLiability).toBeCloseTo(yearly.totalTaxLiability, 0);
  });

  test('Multi-state uses explicit state incomes and sums both state taxes', () => {
    const multiState = calculateTax({
      ...createBaseInput(),
      state: 'California',
      secondState: 'Texas',
      hasMultiStateIncome: true,
      grossPay: 90000,
      preTaxDeductions: 9000,
      primaryStateIncome: 60000,
      secondStateIncome: 30000,
    });

    const californiaOnly = calculateTax({
      ...createBaseInput(),
      hasMultiStateIncome: false,
      state: 'California',
      grossPay: 54000,
      preTaxDeductions: 0,
    });

    const texasOnly = calculateTax({
      ...createBaseInput(),
      hasMultiStateIncome: false,
      state: 'Texas',
      grossPay: 27000,
      preTaxDeductions: 0,
    });

    expect(multiState.stateTax).toBeCloseTo(californiaOnly.stateTax + texasOnly.stateTax, 2);
  });
});
