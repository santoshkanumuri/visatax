
export enum VisaStatus {
  F1 = 'F-1 Student',
  H1B = 'H-1B Worker'
}

export enum F1WorkType {
  OPT = 'OPT',
  CPT = 'CPT',
  ON_CAMPUS = 'On-campus',
  OTHER = 'Other',
}

export enum Country {
  INDIA = 'India',
  CHINA = 'China',
  OTHER = 'Other'
}

export enum PayFrequency {
  YEARLY = 'Yearly',
  MONTHLY = 'Monthly',
  BIWEEKLY = 'Biweekly'
}

export enum FilingStatus {
  SINGLE = 'Single',
  MARRIED_JOINT = 'Married Filing Jointly'
}

export interface UserInput {
  visaStatus: VisaStatus;
  f1WorkType?: F1WorkType;
  country: Country;
  yearsInUS: number;
  state: string;
  hasMultiStateIncome: boolean;
  secondState?: string;
  secondStateIncomeShare?: number;
  payFrequency: PayFrequency;
  grossPay: number;
  preTaxDeductions: number;
  federalTaxPaid: number;
  ficaWithheld: number;
  stateTaxWithheld: number;
  filingStatus: FilingStatus;
  taxYear: number;
  standardDeductionOverride?: number;
  hasStockIncome: boolean;
  stockProceeds?: number;
  stockCostBasis?: number;
}

export type OnboardingPersona = 'new_f1' | 'f1_opt_cpt' | 'h1b_first_year';

export interface OnboardingPreset {
  title: string;
  subtitle: string;
  steps: string[];
  prefill: Partial<UserInput>;
}

export interface BracketDetail {
  rate: number;
  min: number;
  max: number;
  amountInBracket: number;
  taxAmount: number;
}

// FICA Tax Breakdown for detailed reporting
export interface FICABreakdown {
  socialSecurityTax: number;
  medicareTax: number;
  additionalMedicareTax: number;
  totalFICA: number;
  isExempt: boolean;
  exemptionReason?: string;
}

export interface TaxResult {
  grossPay: number;
  adjustedGrossIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  federalTaxLiability: number;
  federalBreakdown: BracketDetail[];
  ficaTax: number;
  ficaBreakdown: FICABreakdown;
  stateTax: number;
  capitalGains?: number;
  capitalGainsTax?: number;
  totalTaxLiability: number;
  takeHomePay: number;
  refundOrOwe: number;
  ficaRefundOrOwe: number;
  stateRefundOrOwe: number;
  capitalGainsRefundOrOwe?: number;
  totalRefundOrOwe: number;
  effectiveTaxRate: number;
  marginalTaxRate: number;
  messages: string[];
  stateRateUsed: number;
}

// Input Validation
export interface ValidationError {
  field: keyof UserInput;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export type StateTaxCategory = 'none' | 'flat' | 'graduated';

export interface StateTaxInfo {
  name: string;
  minRate: number;
  maxRate: number;
  category: StateTaxCategory;
}

export interface TaxBracket {
  limit: number;
  rate: number;
}

export interface StateTaxConfig {
  [key: string]: {
    [FilingStatus.SINGLE]: TaxBracket[];
    [FilingStatus.MARRIED_JOINT]: TaxBracket[];
  };
}

export interface SavedScenario {
  id: string;
  name: string;
  createdAt: string;
  input: UserInput;
}

export type ConfidenceLevel = 'Exact' | 'Estimated' | 'Needs confirmation';

export interface TaxRuleLimits {
  K401: number;
  HSA_SINGLE: number;
  HSA_FAMILY: number;
}

export interface TaxRuleYearData {
  STANDARD_DEDUCTION: {
    [FilingStatus.SINGLE]: number;
    [FilingStatus.MARRIED_JOINT]: number;
  };
  SS_WAGE_BASE: number;
  LIMITS: TaxRuleLimits;
  BRACKETS: {
    [FilingStatus.SINGLE]: TaxBracket[];
    [FilingStatus.MARRIED_JOINT]: TaxBracket[];
  };
}

export interface TaxRuleMeta {
  year: number;
  version: string;
  lastUpdated: string;
  sourceLabel: string;
  sourceUrl: string;
}
