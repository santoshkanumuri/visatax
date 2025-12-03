
export enum VisaStatus {
  F1 = 'F-1 Student',
  H1B = 'H-1B Worker'
}

export enum Country {
  INDIA = 'India',
  CHINA = 'China',
  OTHER = 'Other'
}

export enum PayFrequency {
  YEARLY = 'Yearly',
  MONTHLY = 'Monthly'
}

export enum FilingStatus {
  SINGLE = 'Single',
  MARRIED_JOINT = 'Married Filing Jointly'
}

export interface UserInput {
  visaStatus: VisaStatus;
  country: Country;
  yearsInUS: number;
  state: string;
  payFrequency: PayFrequency;
  grossPay: number;
  preTaxDeductions: number;
  federalTaxPaid: number;
  filingStatus: FilingStatus;
  taxYear: number;
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
  totalTaxLiability: number;
  takeHomePay: number;
  refundOrOwe: number;
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
