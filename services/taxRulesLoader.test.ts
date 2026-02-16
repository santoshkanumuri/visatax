import { AVAILABLE_TAX_YEARS, DEFAULT_TAX_YEAR, getTaxRuleMeta, getTaxYearData } from './taxRulesLoader';
import { FilingStatus } from '../types';

describe('taxRulesLoader', () => {
  test('exposes available years and default year', () => {
    expect(AVAILABLE_TAX_YEARS.length).toBeGreaterThan(0);
    expect(AVAILABLE_TAX_YEARS.includes(DEFAULT_TAX_YEAR)).toBe(true);
  });

  test('returns normalized tax year data with filing status keys', () => {
    const data = getTaxYearData(DEFAULT_TAX_YEAR);
    expect(data.SS_WAGE_BASE).toBeGreaterThan(0);
    expect(data.STANDARD_DEDUCTION[FilingStatus.SINGLE]).toBeGreaterThan(0);
    expect(data.BRACKETS[FilingStatus.SINGLE].length).toBeGreaterThan(0);
  });

  test('returns metadata for selected year', () => {
    const meta = getTaxRuleMeta(DEFAULT_TAX_YEAR);
    expect(meta.year).toBe(DEFAULT_TAX_YEAR);
    expect(meta.version.length).toBeGreaterThan(0);
    expect(meta.sourceUrl.startsWith('http')).toBe(true);
  });
});
