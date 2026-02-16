
import { StateTaxInfo, FilingStatus, StateTaxConfig, OnboardingPersona, OnboardingPreset, VisaStatus, Country, PayFrequency, F1WorkType } from './types';

// ============================================
// FICA TAX CONSTANTS
// ============================================
export const FICA_CONSTANTS = {
  // Social Security (OASDI) - Employee portion
  SS_EMPLOYEE_RATE: 0.062,
  
  // Medicare - Employee portion  
  MEDICARE_EMPLOYEE_RATE: 0.0145,
  
  // Additional Medicare Tax (applies to wages over threshold)
  ADDITIONAL_MEDICARE_RATE: 0.009,
  ADDITIONAL_MEDICARE_THRESHOLD: {
    [FilingStatus.SINGLE]: 200000,
    [FilingStatus.MARRIED_JOINT]: 250000,
  },
  
  // F-1 Student FICA Exemption
  F1_EXEMPTION_CALENDAR_YEARS: 5,
};

// ============================================
// CAPITAL GAINS TAX CONSTANTS
// ============================================
export const CAPITAL_GAINS_CONSTANTS = {
  // Flat tax rate for nonresident aliens on U.S. source capital gains
  // when present in the U.S. for 183 days or more during the taxable year
  NRA_CAPITAL_GAINS_RATE: 0.30,
};

// ============================================
// STATE TAX ESTIMATION CONSTANTS  
// ============================================
export const STATE_TAX_CONSTANTS = {
  // Max income for interpolation estimation (when explicit brackets unavailable)
  BRACKET_ESTIMATE_SINGLE: 200000,
  BRACKET_ESTIMATE_MFJ: 400000,
};

// ============================================
// PAY PERIOD CONSTANTS
// ============================================
export const PAY_PERIOD_CONSTANTS = {
  MONTHS_PER_YEAR: 12,
  BIWEEKLY_PERIODS_PER_YEAR: 26,
  WEEKLY_PERIODS_PER_YEAR: 52,
};

// ============================================
// INPUT VALIDATION LIMITS
// ============================================
export const INPUT_LIMITS = {
  GROSS_PAY_MIN: 0,
  GROSS_PAY_MAX: 10000000,
  PRE_TAX_DEDUCTIONS_MIN: 0,
  FEDERAL_TAX_WITHHELD_MIN: 0,
  YEARS_IN_US_MIN: 0,
  YEARS_IN_US_MAX: 50,
  // Warning thresholds
  YEARS_IN_US_F1_WARNING: 20,
  TAX_WITHHELD_WARNING_PERCENT: 0.5, // Warn if > 50% of gross
};

// ============================================
// DEFAULT FORM VALUES
// ============================================
export const DEFAULT_FORM_VALUES = {
  GROSS_PAY: 85000,
  PRE_TAX_DEDUCTIONS: 2000,
  FEDERAL_TAX_PAID: 10000,
  FICA_WITHHELD: 0,
  STATE_TAX_WITHHELD: 0,
  YEARS_IN_US: 1,
  TAX_YEAR: 2025,
  STATE: 'Texas',
  HAS_MULTI_STATE_INCOME: false,
  SECOND_STATE: 'California',
  SECOND_STATE_INCOME_SHARE: 50,
  HAS_STOCK_INCOME: false,
  STOCK_PROCEEDS: 0,
  STOCK_COST_BASIS: 0,
};

// ============================================
// ONBOARDING PRESETS
// ============================================
export const ONBOARDING_PRESETS: Record<OnboardingPersona, OnboardingPreset> = {
  new_f1: {
    title: 'New F-1',
    subtitle: 'First year student with a recent on-campus job or internship.',
    steps: [
      'Start with F-1 defaults and India treaty assumptions.',
      'Add your annual or monthly pay from offer letter/paystub.',
      'Confirm if any federal/state tax was already withheld.'
    ],
    prefill: {
      visaStatus: VisaStatus.F1,
      f1WorkType: F1WorkType.ON_CAMPUS,
      country: Country.INDIA,
      yearsInUS: 1,
      hasMultiStateIncome: false,
      secondState: DEFAULT_FORM_VALUES.SECOND_STATE,
      secondStateIncomeShare: DEFAULT_FORM_VALUES.SECOND_STATE_INCOME_SHARE,
      payFrequency: PayFrequency.YEARLY,
      grossPay: 45000,
      preTaxDeductions: 0,
      federalTaxPaid: 2500,
      ficaWithheld: 0,
      stateTaxWithheld: 0,
    },
  },
  f1_opt_cpt: {
    title: 'F-1 on OPT/CPT',
    subtitle: 'Working internship/full-time and usually paid every 2 weeks.',
    steps: [
      'Preset switches pay frequency to biweekly for easier paystub entry.',
      'FICA estimate assumes exemption in first 5 calendar years.',
      'You can update state and withholdings from latest paycheck.'
    ],
    prefill: {
      visaStatus: VisaStatus.F1,
      f1WorkType: F1WorkType.OPT,
      country: Country.INDIA,
      yearsInUS: 3,
      hasMultiStateIncome: false,
      secondState: DEFAULT_FORM_VALUES.SECOND_STATE,
      secondStateIncomeShare: DEFAULT_FORM_VALUES.SECOND_STATE_INCOME_SHARE,
      payFrequency: PayFrequency.BIWEEKLY,
      grossPay: 3000,
      preTaxDeductions: 100,
      federalTaxPaid: 250,
      ficaWithheld: 0,
      stateTaxWithheld: 0,
    },
  },
  h1b_first_year: {
    title: 'H-1B First Year',
    subtitle: 'New H-1B employee with regular payroll withholding.',
    steps: [
      'Preset applies H-1B status and common first-year assumptions.',
      'Standard deduction is enabled through current resident-style logic.',
      'Review FICA and state withholding against your year-to-date payslip.'
    ],
    prefill: {
      visaStatus: VisaStatus.H1B,
      f1WorkType: undefined,
      country: Country.INDIA,
      yearsInUS: 1,
      hasMultiStateIncome: false,
      secondState: DEFAULT_FORM_VALUES.SECOND_STATE,
      secondStateIncomeShare: DEFAULT_FORM_VALUES.SECOND_STATE_INCOME_SHARE,
      payFrequency: PayFrequency.YEARLY,
      grossPay: 110000,
      preTaxDeductions: 5000,
      federalTaxPaid: 14000,
      ficaWithheld: 8400,
      stateTaxWithheld: 3000,
    },
  },
};

// ============================================
// APP STORAGE KEYS
// ============================================
export const STORAGE_KEYS = {
  PREFIX: 'visatax:',
  FORM_DATA: 'visatax:v1:form',
  SCENARIOS: 'visatax:v1:scenarios',
};

// ============================================
// WITHHOLDING ESTIMATION DEFAULTS
// ============================================
export const WITHHOLDING_DEFAULTS = {
  // FICA rate for non-exempt (SS 6.2% + Medicare 1.45%)
  FICA_RATE: 0.0765,
  // Default state withholding estimate (will use actual state rate if available)
  DEFAULT_STATE_RATE: 0.05,
};

// ============================================
// DISPLAY CONSTANTS
// ============================================
export const DISPLAY_CONSTANTS = {
  THOUSAND: 1000,
  CURRENCY_DECIMALS: 0,
  PERCENT_DECIMALS: 2,
};

export const STATES_LIST: StateTaxInfo[] = [
  // --- States with No Income Tax ---
  { name: "Alaska", minRate: 0, maxRate: 0, category: 'none' },
  { name: "Florida", minRate: 0, maxRate: 0, category: 'none' },
  { name: "Nevada", minRate: 0, maxRate: 0, category: 'none' },
  { name: "New Hampshire", minRate: 0, maxRate: 0, category: 'none' },
  { name: "South Dakota", minRate: 0, maxRate: 0, category: 'none' },
  { name: "Tennessee", minRate: 0, maxRate: 0, category: 'none' },
  { name: "Texas", minRate: 0, maxRate: 0, category: 'none' },
  { name: "Wyoming", minRate: 0, maxRate: 0, category: 'none' },

  // --- States with a Flat Income Tax ---
  { name: "Arizona", minRate: 0.025, maxRate: 0.025, category: 'flat' },
  { name: "Colorado", minRate: 0.044, maxRate: 0.044, category: 'flat' },
  { name: "Georgia", minRate: 0.0519, maxRate: 0.0519, category: 'flat' },
  { name: "Idaho", minRate: 0.053, maxRate: 0.053, category: 'flat' },
  { name: "Illinois", minRate: 0.0495, maxRate: 0.0495, category: 'flat' },
  { name: "Indiana", minRate: 0.03, maxRate: 0.03, category: 'flat' },
  { name: "Iowa", minRate: 0.038, maxRate: 0.038, category: 'flat' },
  { name: "Kentucky", minRate: 0.04, maxRate: 0.04, category: 'flat' },
  { name: "Louisiana", minRate: 0.03, maxRate: 0.03, category: 'flat' },
  { name: "Michigan", minRate: 0.0425, maxRate: 0.0425, category: 'flat' },
  { name: "Mississippi", minRate: 0.044, maxRate: 0.044, category: 'flat' },
  { name: "North Carolina", minRate: 0.0425, maxRate: 0.0425, category: 'flat' },
  { name: "Pennsylvania", minRate: 0.0307, maxRate: 0.0307, category: 'flat' },
  { name: "Utah", minRate: 0.045, maxRate: 0.045, category: 'flat' },
  { name: "Washington", minRate: 0, maxRate: 0, category: 'flat' },

  // --- States with a Graduated-Rate Income Tax ---
  { name: "Alabama", minRate: 0.02, maxRate: 0.05, category: 'graduated' },
  { name: "Arkansas", minRate: 0, maxRate: 0.039, category: 'graduated' },
  { name: "California", minRate: 0.01, maxRate: 0.133, category: 'graduated' },
  { name: "Connecticut", minRate: 0.02, maxRate: 0.0699, category: 'graduated' },
  { name: "Delaware", minRate: 0, maxRate: 0.066, category: 'graduated' },
  { name: "District of Columbia", minRate: 0.04, maxRate: 0.1075, category: 'graduated' },
  { name: "Hawaii", minRate: 0.014, maxRate: 0.11, category: 'graduated' },
  { name: "Kansas", minRate: 0.052, maxRate: 0.0558, category: 'graduated' },
  { name: "Maine", minRate: 0.058, maxRate: 0.0715, category: 'graduated' },
  { name: "Maryland", minRate: 0.02, maxRate: 0.065, category: 'graduated' },
  { name: "Massachusetts", minRate: 0.05, maxRate: 0.09, category: 'graduated' },
  { name: "Minnesota", minRate: 0.0535, maxRate: 0.0985, category: 'graduated' },
  { name: "Missouri", minRate: 0.02, maxRate: 0.047, category: 'graduated' },
  { name: "Montana", minRate: 0.047, maxRate: 0.059, category: 'graduated' },
  { name: "Nebraska", minRate: 0.0246, maxRate: 0.052, category: 'graduated' },
  { name: "New Jersey", minRate: 0.014, maxRate: 0.1075, category: 'graduated' },
  { name: "New Mexico", minRate: 0.017, maxRate: 0.059, category: 'graduated' },
  { name: "New York", minRate: 0.04, maxRate: 0.109, category: 'graduated' },
  { name: "North Dakota", minRate: 0, maxRate: 0.025, category: 'graduated' },
  { name: "Ohio", minRate: 0, maxRate: 0.03125, category: 'graduated' },
  { name: "Oklahoma", minRate: 0.0025, maxRate: 0.0475, category: 'graduated' },
  { name: "Oregon", minRate: 0.0475, maxRate: 0.099, category: 'graduated' },
  { name: "Rhode Island", minRate: 0.0375, maxRate: 0.0599, category: 'graduated' },
  { name: "South Carolina", minRate: 0, maxRate: 0.06, category: 'graduated' },
  { name: "Vermont", minRate: 0.0335, maxRate: 0.0875, category: 'graduated' },
  { name: "Virginia", minRate: 0.02, maxRate: 0.0575, category: 'graduated' },
  { name: "West Virginia", minRate: 0.0222, maxRate: 0.0482, category: 'graduated' },
  { name: "Wisconsin", minRate: 0.035, maxRate: 0.0765, category: 'graduated' }
];

// Specific bracket data for states categorized as 'graduated'
// Approximations used for 2024/2025 where exact new legislation is pending
export const STATE_GRADUATED_BRACKETS: StateTaxConfig = {
  "California": {
    [FilingStatus.SINGLE]: [
      { limit: 10412, rate: 0.01 },
      { limit: 24684, rate: 0.02 },
      { limit: 38959, rate: 0.04 },
      { limit: 54081, rate: 0.06 },
      { limit: 68350, rate: 0.08 },
      { limit: 349137, rate: 0.093 },
      { limit: 418961, rate: 0.103 },
      { limit: 698271, rate: 0.113 },
      { limit: Infinity, rate: 0.123 }
    ],
    [FilingStatus.MARRIED_JOINT]: [
      { limit: 20824, rate: 0.01 },
      { limit: 49368, rate: 0.02 },
      { limit: 77918, rate: 0.04 },
      { limit: 108162, rate: 0.06 },
      { limit: 136700, rate: 0.08 },
      { limit: 698274, rate: 0.093 },
      { limit: 837922, rate: 0.103 },
      { limit: 1396542, rate: 0.113 },
      { limit: Infinity, rate: 0.123 }
    ]
  },
  "New York": {
    [FilingStatus.SINGLE]: [
      { limit: 8500, rate: 0.04 },
      { limit: 11700, rate: 0.045 },
      { limit: 13900, rate: 0.0525 },
      { limit: 80650, rate: 0.055 },
      { limit: 215400, rate: 0.06 },
      { limit: 1077550, rate: 0.0685 },
      { limit: 5000000, rate: 0.0965 },
      { limit: 25000000, rate: 0.103 },
      { limit: Infinity, rate: 0.109 }
    ],
    [FilingStatus.MARRIED_JOINT]: [
      { limit: 17150, rate: 0.04 },
      { limit: 23600, rate: 0.045 },
      { limit: 27900, rate: 0.0525 },
      { limit: 161550, rate: 0.055 },
      { limit: 323200, rate: 0.06 },
      { limit: 2155350, rate: 0.0685 },
      { limit: 5000000, rate: 0.0965 },
      { limit: 25000000, rate: 0.103 },
      { limit: Infinity, rate: 0.109 }
    ]
  },
  "New Jersey": {
    [FilingStatus.SINGLE]: [
      { limit: 20000, rate: 0.014 },
      { limit: 35000, rate: 0.0175 },
      { limit: 40000, rate: 0.035 },
      { limit: 75000, rate: 0.05525 },
      { limit: 500000, rate: 0.0637 },
      { limit: 1000000, rate: 0.0897 },
      { limit: Infinity, rate: 0.1075 }
    ],
    [FilingStatus.MARRIED_JOINT]: [
      { limit: 20000, rate: 0.014 },
      { limit: 50000, rate: 0.0175 },
      { limit: 70000, rate: 0.0245 },
      { limit: 80000, rate: 0.035 },
      { limit: 150000, rate: 0.05525 },
      { limit: 500000, rate: 0.0637 },
      { limit: 1000000, rate: 0.0897 },
      { limit: Infinity, rate: 0.1075 }
    ]
  },
  "Massachusetts": {
     [FilingStatus.SINGLE]: [{ limit: Infinity, rate: 0.05 }],
     [FilingStatus.MARRIED_JOINT]: [{ limit: Infinity, rate: 0.05 }]
  },
  "Virginia": {
    [FilingStatus.SINGLE]: [
      { limit: 3000, rate: 0.02 },
      { limit: 5000, rate: 0.03 },
      { limit: 17000, rate: 0.05 },
      { limit: Infinity, rate: 0.0575 }
    ],
    [FilingStatus.MARRIED_JOINT]: [
      { limit: 3000, rate: 0.02 },
      { limit: 5000, rate: 0.03 },
      { limit: 17000, rate: 0.05 },
      { limit: Infinity, rate: 0.0575 }
    ]
  },
  "Alabama": {
    [FilingStatus.SINGLE]: [{limit: 500, rate: 0.02}, {limit: 3000, rate: 0.04}, {limit: Infinity, rate: 0.05}],
    [FilingStatus.MARRIED_JOINT]: [{limit: 1000, rate: 0.02}, {limit: 6000, rate: 0.04}, {limit: Infinity, rate: 0.05}]
  },
  "Connecticut": {
    [FilingStatus.SINGLE]: [{limit: 10000, rate: 0.03}, {limit: 50000, rate: 0.05}, {limit: 100000, rate: 0.055}, {limit: 200000, rate: 0.06}, {limit: 250000, rate: 0.065}, {limit: 500000, rate: 0.069}, {limit: Infinity, rate: 0.0699}],
    [FilingStatus.MARRIED_JOINT]: [{limit: 20000, rate: 0.03}, {limit: 100000, rate: 0.05}, {limit: 200000, rate: 0.055}, {limit: 400000, rate: 0.06}, {limit: 500000, rate: 0.065}, {limit: 1000000, rate: 0.069}, {limit: Infinity, rate: 0.0699}]
  },
  "Maryland": {
    [FilingStatus.SINGLE]: [{limit: 1000, rate: 0.02}, {limit: 2000, rate: 0.03}, {limit: 3000, rate: 0.04}, {limit: 100000, rate: 0.0475}, {limit: 125000, rate: 0.05}, {limit: 150000, rate: 0.0525}, {limit: 250000, rate: 0.055}, {limit: Infinity, rate: 0.0575}],
    [FilingStatus.MARRIED_JOINT]: [{limit: 1000, rate: 0.02}, {limit: 2000, rate: 0.03}, {limit: 3000, rate: 0.04}, {limit: 150000, rate: 0.0475}, {limit: 175000, rate: 0.05}, {limit: 225000, rate: 0.0525}, {limit: 300000, rate: 0.055}, {limit: Infinity, rate: 0.0575}]
  },
  "Ohio": {
    [FilingStatus.SINGLE]: [{limit: 26050, rate: 0}, {limit: 100000, rate: 0.0275}, {limit: 115300, rate: 0.03688}, {limit: Infinity, rate: 0.0375}],
    [FilingStatus.MARRIED_JOINT]: [{limit: 26050, rate: 0}, {limit: 100000, rate: 0.0275}, {limit: 115300, rate: 0.03688}, {limit: Infinity, rate: 0.0375}]
  },
  "Wisconsin": {
    [FilingStatus.SINGLE]: [{limit: 14320, rate: 0.0350}, {limit: 28640, rate: 0.0440}, {limit: 315310, rate: 0.0530}, {limit: Infinity, rate: 0.0765}],
    [FilingStatus.MARRIED_JOINT]: [{limit: 19090, rate: 0.0350}, {limit: 38190, rate: 0.0440}, {limit: 420420, rate: 0.0530}, {limit: Infinity, rate: 0.0765}]
  }
};
