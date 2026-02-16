import { FilingStatus, TaxBracket, TaxRuleMeta, TaxRuleYearData } from '../types';
import rulesIndex from '../data/tax-rules/index.json';
import rules2024 from '../data/tax-rules/2024.json';
import rules2025 from '../data/tax-rules/2025.json';
import rules2026 from '../data/tax-rules/2026.json';

interface RawBracket {
  limit: number | 'Infinity';
  rate: number;
}

interface RawTaxYearData {
  standardDeduction: {
    single: number;
    married_joint: number;
  };
  ssWageBase: number;
  limits: {
    K401: number;
    HSA_SINGLE: number;
    HSA_FAMILY: number;
  };
  brackets: {
    single: RawBracket[];
    married_joint: RawBracket[];
  };
}

interface RawRulesIndex {
  defaultTaxYear: number;
  years: TaxRuleMeta[];
}

const RULES_INDEX = rulesIndex as RawRulesIndex;
const RAW_RULES_BY_YEAR: Record<number, RawTaxYearData> = {
  2024: rules2024 as RawTaxYearData,
  2025: rules2025 as RawTaxYearData,
  2026: rules2026 as RawTaxYearData,
};

const normalizeBrackets = (rawBrackets: RawBracket[]): TaxBracket[] =>
  rawBrackets.map((bracket) => ({
    limit: bracket.limit === 'Infinity' ? Infinity : bracket.limit,
    rate: bracket.rate,
  }));

const normalizeYearData = (raw: RawTaxYearData): TaxRuleYearData => ({
  STANDARD_DEDUCTION: {
    [FilingStatus.SINGLE]: raw.standardDeduction.single,
    [FilingStatus.MARRIED_JOINT]: raw.standardDeduction.married_joint,
  },
  SS_WAGE_BASE: raw.ssWageBase,
  LIMITS: {
    K401: raw.limits.K401,
    HSA_SINGLE: raw.limits.HSA_SINGLE,
    HSA_FAMILY: raw.limits.HSA_FAMILY,
  },
  BRACKETS: {
    [FilingStatus.SINGLE]: normalizeBrackets(raw.brackets.single),
    [FilingStatus.MARRIED_JOINT]: normalizeBrackets(raw.brackets.married_joint),
  },
});

const TAX_RULES_BY_YEAR: Record<number, TaxRuleYearData> = Object.fromEntries(
  Object.entries(RAW_RULES_BY_YEAR).map(([year, data]) => [Number(year), normalizeYearData(data)])
) as Record<number, TaxRuleYearData>;

export const AVAILABLE_TAX_YEARS = [...RULES_INDEX.years.map((entry) => entry.year)].sort((a, b) => a - b);
export const DEFAULT_TAX_YEAR =
  TAX_RULES_BY_YEAR[RULES_INDEX.defaultTaxYear] !== undefined
    ? RULES_INDEX.defaultTaxYear
    : AVAILABLE_TAX_YEARS[AVAILABLE_TAX_YEARS.length - 1];

export const getTaxYearData = (taxYear: number): TaxRuleYearData => {
  return TAX_RULES_BY_YEAR[taxYear] || TAX_RULES_BY_YEAR[DEFAULT_TAX_YEAR];
};

export const getTaxRuleMeta = (taxYear: number): TaxRuleMeta => {
  const found = RULES_INDEX.years.find((entry) => entry.year === taxYear);
  if (found) return found;
  const fallback = RULES_INDEX.years.find((entry) => entry.year === DEFAULT_TAX_YEAR);
  if (fallback) return fallback;
  return {
    year: DEFAULT_TAX_YEAR,
    version: 'unknown',
    lastUpdated: '',
    sourceLabel: 'Tax rule source',
    sourceUrl: '#',
  };
};
