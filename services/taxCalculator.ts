
import { UserInput, TaxResult, VisaStatus, Country, PayFrequency, BracketDetail, FICABreakdown, FilingStatus } from '../types';
import { STATES_LIST, STATE_GRADUATED_BRACKETS, FICA_CONSTANTS, STATE_TAX_CONSTANTS, PAY_PERIOD_CONSTANTS, CAPITAL_GAINS_CONSTANTS } from '../constants';
import { getTaxYearData } from './taxRulesLoader';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Annualize an amount based on pay frequency
 */
export const getAnnualAmount = (amount: number, frequency: PayFrequency): number => {
  switch (frequency) {
    case PayFrequency.MONTHLY:
      return amount * PAY_PERIOD_CONSTANTS.MONTHS_PER_YEAR;
    case PayFrequency.BIWEEKLY:
      return amount * PAY_PERIOD_CONSTANTS.BIWEEKLY_PERIODS_PER_YEAR;
    default:
      return amount;
  }
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

const calculateStateTaxForIncome = (
  stateName: string,
  adjustedGrossIncome: number,
  filingStatus: FilingStatus
): { tax: number; effectiveRate: number; message: string } => {
  const stateInfo = STATES_LIST.find((state) => state.name === stateName);

  if (!stateInfo) {
    return { tax: 0, effectiveRate: 0, message: `${stateName} state tax configuration is unavailable.` };
  }

  if (stateInfo.category === 'none') {
    return { tax: 0, effectiveRate: 0, message: `${stateInfo.name} has no state income tax.` };
  }

  if (stateInfo.category === 'flat') {
    const effectiveRate = stateInfo.minRate;
    return {
      tax: adjustedGrossIncome * effectiveRate,
      effectiveRate,
      message: `${stateInfo.name} has a flat income tax rate of ${(effectiveRate * 100).toFixed(2)}%.`,
    };
  }

  const specificBrackets = STATE_GRADUATED_BRACKETS[stateInfo.name]?.[filingStatus];
  if (specificBrackets) {
    let remainingIncome = adjustedGrossIncome;
    let previousLimit = 0;
    let tax = 0;

    for (const bracket of specificBrackets) {
      if (remainingIncome <= 0) break;
      const bracketWidth = bracket.limit - previousLimit;
      const taxableInThisBracket = Math.min(remainingIncome, bracketWidth);
      tax += taxableInThisBracket * bracket.rate;
      remainingIncome -= taxableInThisBracket;
      previousLimit = bracket.limit;
    }

    const effectiveRate = adjustedGrossIncome > 0 ? tax / adjustedGrossIncome : 0;
    return {
      tax,
      effectiveRate,
      message: `${stateInfo.name} tax calculated using graduated brackets.`,
    };
  }

  const maxBracketEstimate =
    filingStatus === FilingStatus.MARRIED_JOINT
      ? STATE_TAX_CONSTANTS.BRACKET_ESTIMATE_MFJ
      : STATE_TAX_CONSTANTS.BRACKET_ESTIMATE_SINGLE;
  const incomeFactor = Math.min(adjustedGrossIncome / maxBracketEstimate, 1);
  const effectiveRate = stateInfo.minRate + (stateInfo.maxRate - stateInfo.minRate) * incomeFactor;

  return {
    tax: adjustedGrossIncome * effectiveRate,
    effectiveRate,
    message: `${stateInfo.name} tax estimated using effective rate interpolation.`,
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
  
  // Check if user has overridden the standard deduction
  if (input.standardDeductionOverride !== undefined && input.standardDeductionOverride !== null) {
    standardDeduction = input.standardDeductionOverride;
    messages.push(`Custom Standard Deduction: $${standardDeduction.toLocaleString()}`);
  } else {
    // Use default logic
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

  // 7. State Tax
  let stateTax = 0;
  let stateRateUsed = 0;

  if (input.hasMultiStateIncome && input.secondState && input.secondState !== input.state) {
    const primaryStateIncome = Math.max(0, getAnnualAmount(input.primaryStateIncome || 0, input.payFrequency));
    const secondStateIncome = Math.max(0, getAnnualAmount(input.secondStateIncome || 0, input.payFrequency));
    const combinedStateIncome = primaryStateIncome + secondStateIncome;

    if (combinedStateIncome > 0) {
      // Allocate pre-tax deductions in proportion to each state's income.
      const primaryDeductionShare = preTaxDeductions * (primaryStateIncome / combinedStateIncome);
      const secondDeductionShare = preTaxDeductions - primaryDeductionShare;

      const primaryAdjustedIncome = Math.max(0, primaryStateIncome - primaryDeductionShare);
      const secondAdjustedIncome = Math.max(0, secondStateIncome - secondDeductionShare);

      const primaryStateCalc = calculateStateTaxForIncome(input.state, primaryAdjustedIncome, input.filingStatus);
      const secondStateCalc = calculateStateTaxForIncome(input.secondState, secondAdjustedIncome, input.filingStatus);

      stateTax = primaryStateCalc.tax + secondStateCalc.tax;
      stateRateUsed = adjustedGrossIncome > 0 ? stateTax / adjustedGrossIncome : 0;

      messages.push(
        `Multi-state estimate: ${input.state} income $${Math.round(primaryStateIncome).toLocaleString()}, ${input.secondState} income $${Math.round(secondStateIncome).toLocaleString()}.`
      );
      messages.push(primaryStateCalc.message);
      messages.push(secondStateCalc.message);

      if (Math.abs(combinedStateIncome - grossPay) > Math.max(1000, grossPay * 0.1)) {
        messages.push(
          'Multi-state note: Total of entered state incomes differs from gross pay by more than 10%, so state tax may be less precise.'
        );
      }
    } else {
      const fallbackStateCalc = calculateStateTaxForIncome(input.state, adjustedGrossIncome, input.filingStatus);
      stateTax = fallbackStateCalc.tax;
      stateRateUsed = fallbackStateCalc.effectiveRate;
      messages.push('Multi-state income was enabled, but state income amounts were not provided. Falling back to primary state estimate.');
      messages.push(fallbackStateCalc.message);
    }
  } else {
    const singleStateCalc = calculateStateTaxForIncome(input.state, adjustedGrossIncome, input.filingStatus);
    stateTax = singleStateCalc.tax;
    stateRateUsed = singleStateCalc.effectiveRate;
    messages.push(singleStateCalc.message);
  }

  // 8. Capital Gains Tax (for stock income)
  let capitalGains: number | undefined = undefined;
  let capitalGainsTax: number | undefined = undefined;
  
  if (input.hasStockIncome && input.stockProceeds && input.stockCostBasis !== undefined) {
    capitalGains = input.stockProceeds - input.stockCostBasis;
    
    // Only apply tax if there are gains (not on losses)
    if (capitalGains > 0) {
      capitalGainsTax = capitalGains * CAPITAL_GAINS_CONSTANTS.NRA_CAPITAL_GAINS_RATE;
      messages.push(`Capital Gains Tax: For F-1 students, U.S. source capital gains are typically taxed at 30% flat rate.`);
    } else {
      capitalGainsTax = 0;
      messages.push(`Capital Loss: $${Math.abs(capitalGains).toLocaleString()} - No tax on capital losses.`);
    }
  }

  // 9. Totals
  const totalTaxLiability = federalTaxLiability + stateTax + ficaTax + (capitalGainsTax || 0);
  const takeHomePay = grossPay - totalTaxLiability - preTaxDeductions;
  
  // Refund / Owe calculations for each tax type
  const federalPaid = getAnnualAmount(input.federalTaxPaid, input.payFrequency);
  const ficaPaid = getAnnualAmount(input.ficaWithheld, input.payFrequency);
  const statePaid = getAnnualAmount(input.stateTaxWithheld, input.payFrequency);
  
  const refundOrOwe = federalPaid - federalTaxLiability;
  const ficaRefundOrOwe = ficaPaid - ficaTax;
  const stateRefundOrOwe = statePaid - stateTax;
  
  // Capital gains tax is typically not withheld, so it's usually owed
  const capitalGainsRefundOrOwe = capitalGainsTax !== undefined ? (0 - capitalGainsTax) : undefined;
  
  // Total refund/owe includes capital gains tax owed
  const totalRefundOrOwe = refundOrOwe + ficaRefundOrOwe + stateRefundOrOwe + (capitalGainsRefundOrOwe || 0);

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
    capitalGains,
    capitalGainsTax,
    totalTaxLiability,
    takeHomePay,
    refundOrOwe,
    ficaRefundOrOwe,
    stateRefundOrOwe,
    capitalGainsRefundOrOwe,
    totalRefundOrOwe,
    effectiveTaxRate: grossPay > 0 ? totalTaxLiability / grossPay : 0,
    marginalTaxRate,
    messages,
    stateRateUsed
  };
};
