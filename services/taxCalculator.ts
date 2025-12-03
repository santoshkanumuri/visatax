
import { UserInput, TaxResult, VisaStatus, Country, PayFrequency, BracketDetail, FICABreakdown, FilingStatus } from '../types';
import { TAX_DATA, STATES_LIST, STATE_GRADUATED_BRACKETS, FICA_CONSTANTS, STATE_TAX_CONSTANTS, PAY_PERIOD_CONSTANTS } from '../constants';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Annualize an amount based on pay frequency
 */
export const getAnnualAmount = (amount: number, frequency: PayFrequency): number => {
  return frequency === PayFrequency.MONTHLY 
    ? amount * PAY_PERIOD_CONSTANTS.MONTHS_PER_YEAR 
    : amount;
};

/**
 * Get tax year data with fallback to 2025
 */
const getTaxYearData = (taxYear: number) => {
  return TAX_DATA[taxYear as keyof typeof TAX_DATA] || TAX_DATA[2025];
};

// ============================================
// FICA CALCULATION (Social Security + Medicare + Additional Medicare)
// ============================================

/**
 * Calculate FICA taxes with proper exemptions and Additional Medicare Tax
 */
const calculateFICA = (
  grossPay: number,
  visaStatus: VisaStatus,
  yearsInUS: number,
  filingStatus: FilingStatus,
  ssWageBase: number
): FICABreakdown => {
  // F-1 students are exempt for first 5 calendar years
  if (visaStatus === VisaStatus.F1 && yearsInUS <= FICA_CONSTANTS.F1_EXEMPTION_CALENDAR_YEARS) {
    return {
      socialSecurityTax: 0,
      medicareTax: 0,
      additionalMedicareTax: 0,
      totalFICA: 0,
      isExempt: true,
      exemptionReason: `F-1 students are exempt from Social Security & Medicare taxes for their first ${FICA_CONSTANTS.F1_EXEMPTION_CALENDAR_YEARS} calendar years of physical presence in the US.`
    };
  }

  // Social Security Tax (6.2%) - capped at wage base
  const ssTaxableWages = Math.min(grossPay, ssWageBase);
  const socialSecurityTax = ssTaxableWages * FICA_CONSTANTS.SS_EMPLOYEE_RATE;

  // Medicare Tax (1.45%) - no wage limit
  const medicareTax = grossPay * FICA_CONSTANTS.MEDICARE_EMPLOYEE_RATE;

  // Additional Medicare Tax (0.9%) - applies to wages OVER threshold
  const additionalMedicareThreshold = FICA_CONSTANTS.ADDITIONAL_MEDICARE_THRESHOLD[filingStatus];
  let additionalMedicareTax = 0;
  
  if (grossPay > additionalMedicareThreshold) {
    const wagesOverThreshold = grossPay - additionalMedicareThreshold;
    additionalMedicareTax = wagesOverThreshold * FICA_CONSTANTS.ADDITIONAL_MEDICARE_RATE;
  }

  const totalFICA = socialSecurityTax + medicareTax + additionalMedicareTax;

  return {
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    totalFICA,
    isExempt: false,
    exemptionReason: visaStatus === VisaStatus.F1 
      ? `You have exceeded the ${FICA_CONSTANTS.F1_EXEMPTION_CALENDAR_YEARS}-year FICA exemption period for F-1 students.`
      : undefined
  };
};

// ============================================
// MAIN TAX CALCULATION
// ============================================

export const calculateTax = (input: UserInput): TaxResult => {
  const messages: string[] = [];
  
  // Get Year Specific Data
  const taxYearData = getTaxYearData(input.taxYear);
  const standardDeductionAmount = taxYearData.STANDARD_DEDUCTION[input.filingStatus];
  const brackets = taxYearData.BRACKETS[input.filingStatus];

  // 1. Annualize Income
  const grossPay = getAnnualAmount(input.grossPay, input.payFrequency);
  const preTaxDeductions = getAnnualAmount(input.preTaxDeductions, input.payFrequency);
  
  // 2. FICA Calculation (with Additional Medicare Tax)
  const ficaBreakdown = calculateFICA(
    grossPay,
    input.visaStatus,
    input.yearsInUS,
    input.filingStatus,
    taxYearData.SS_WAGE_BASE
  );
  
  const ficaTax = ficaBreakdown.totalFICA;
  
  // Add FICA message
  if (ficaBreakdown.isExempt) {
    messages.push(`FICA Exempt: ${ficaBreakdown.exemptionReason}`);
  } else {
    let ficaMsg = `FICA Tax: SS ($${Math.round(ficaBreakdown.socialSecurityTax).toLocaleString()}) + Medicare ($${Math.round(ficaBreakdown.medicareTax).toLocaleString()})`;
    if (ficaBreakdown.additionalMedicareTax > 0) {
      ficaMsg += ` + Additional Medicare ($${Math.round(ficaBreakdown.additionalMedicareTax).toLocaleString()})`;
    }
    messages.push(ficaMsg);
    
    if (ficaBreakdown.exemptionReason) {
      messages.push(ficaBreakdown.exemptionReason);
    }
  }

  // 3. Adjusted Gross Income (AGI)
  const adjustedGrossIncome = Math.max(0, grossPay - preTaxDeductions);

  // 4. Standard Deduction
  let standardDeduction = 0;
  if (input.visaStatus === VisaStatus.H1B) {
    standardDeduction = standardDeductionAmount;
    messages.push(`Standard Deduction (${input.taxYear}): H-1B holders are typically Resident Aliens.`);
  } else if (input.visaStatus === VisaStatus.F1 && input.country === Country.INDIA) {
    standardDeduction = standardDeductionAmount;
    messages.push("Treaty Benefit: The US-India Tax Treaty (Article 21) allows Standard Deduction.");
  } else {
    standardDeduction = 0;
    messages.push("No Standard Deduction: Most Non-Resident Aliens (F-1) cannot claim this.");
  }

  // 5. Taxable Income
  const taxableIncome = Math.max(0, adjustedGrossIncome - standardDeduction);

  // 6. Federal Tax Liability (Progressive) & Breakdown
  let federalTaxLiability = 0;
  let remainingIncome = taxableIncome;
  let previousLimit = 0;
  let marginalTaxRate = 0;
  const federalBreakdown: BracketDetail[] = [];

  for (const bracket of brackets) {
    if (remainingIncome <= 0) {
      break;
    }

    const bracketWidth = bracket.limit - previousLimit;
    const taxableInThisBracket = Math.min(remainingIncome, bracketWidth);
    
    const taxForThisBracket = taxableInThisBracket * bracket.rate;
    federalTaxLiability += taxForThisBracket;
    
    federalBreakdown.push({
      rate: bracket.rate,
      min: previousLimit,
      max: bracket.limit,
      amountInBracket: taxableInThisBracket,
      taxAmount: taxForThisBracket
    });

    remainingIncome -= taxableInThisBracket;
    previousLimit = bracket.limit;
    
    if (taxableInThisBracket > 0) {
      marginalTaxRate = bracket.rate;
    }
  }

  // 7. State Tax (Logic based on CSV Categories)
  const stateInfo = STATES_LIST.find(s => s.name === input.state);
  let stateTax = 0;
  let stateRateUsed = 0;

  if (stateInfo) {
    if (stateInfo.category === 'none') {
      stateTax = 0;
      stateRateUsed = 0;
      messages.push(`${stateInfo.name} has no state income tax.`);
    } else if (stateInfo.category === 'flat') {
      // For flat tax states, apply the minRate (which equals maxRate)
      stateRateUsed = stateInfo.minRate;
      stateTax = adjustedGrossIncome * stateRateUsed;
      messages.push(`${stateInfo.name} has a flat income tax rate of ${(stateRateUsed * 100).toFixed(2)}%.`);
    } else {
      // Graduated (Progressive)
      // Check if we have explicit brackets defined
      const specificBrackets = STATE_GRADUATED_BRACKETS[stateInfo.name]?.[input.filingStatus];

      if (specificBrackets) {
        let remainingStateIncome = adjustedGrossIncome;
        let previousStateLimit = 0;
        stateTax = 0;

        for (const bracket of specificBrackets) {
          if (remainingStateIncome <= 0) break;

          const bracketWidth = bracket.limit - previousStateLimit;
          const taxableInThisBracket = Math.min(remainingStateIncome, bracketWidth);
          stateTax += taxableInThisBracket * bracket.rate;

          remainingStateIncome -= taxableInThisBracket;
          previousStateLimit = bracket.limit;
        }
        // Calculate effective rate for UI display
        stateRateUsed = adjustedGrossIncome > 0 ? stateTax / adjustedGrossIncome : 0;
        messages.push(`${stateInfo.name} tax calculated using graduated brackets.`);
      } else {
        // Fallback for graduated states where specific brackets aren't yet mapped
        const maxBracketEstimate = input.filingStatus === FilingStatus.MARRIED_JOINT 
          ? STATE_TAX_CONSTANTS.BRACKET_ESTIMATE_MFJ 
          : STATE_TAX_CONSTANTS.BRACKET_ESTIMATE_SINGLE;
        const incomeFactor = Math.min(adjustedGrossIncome / maxBracketEstimate, 1);
        
        stateRateUsed = stateInfo.minRate + ((stateInfo.maxRate - stateInfo.minRate) * incomeFactor);
        stateTax = adjustedGrossIncome * stateRateUsed;
        messages.push(`${stateInfo.name} tax estimated using effective rate interpolation.`);
      }
    }
  }

  // 8. Totals
  const totalTaxLiability = federalTaxLiability + stateTax + ficaTax;
  const takeHomePay = grossPay - totalTaxLiability - preTaxDeductions;
  
  // Refund / Owe (based on federal tax only - state withholding not tracked)
  const totalPaid = getAnnualAmount(input.federalTaxPaid, input.payFrequency);
  const refundOrOwe = totalPaid - federalTaxLiability;

  return {
    grossPay,
    adjustedGrossIncome,
    standardDeduction,
    taxableIncome,
    federalTaxLiability,
    federalBreakdown,
    ficaTax,
    ficaBreakdown,
    stateTax,
    totalTaxLiability,
    takeHomePay,
    refundOrOwe,
    effectiveTaxRate: grossPay > 0 ? totalTaxLiability / grossPay : 0,
    marginalTaxRate,
    messages,
    stateRateUsed
  };
};
