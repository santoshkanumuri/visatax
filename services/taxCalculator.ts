
import { UserInput, TaxResult, VisaStatus, Country, PayFrequency, BracketDetail } from '../types';
import { TAX_DATA, STATES_LIST, STATE_GRADUATED_BRACKETS } from '../constants';

export const calculateTax = (input: UserInput): TaxResult => {
  const messages: string[] = [];
  
  // Get Year Specific Data (fallback to 2025 if somehow undefined)
  const taxYearData = TAX_DATA[input.taxYear as keyof typeof TAX_DATA] || TAX_DATA[2025];
  const standardDeductionAmount = taxYearData.STANDARD_DEDUCTION[input.filingStatus];
  const brackets = taxYearData.BRACKETS[input.filingStatus];

  // 1. Annualize Income
  const multiplier = input.payFrequency === PayFrequency.MONTHLY ? 12 : 1;
  const grossPay = input.grossPay * multiplier;
  const preTaxDeductions = input.preTaxDeductions * multiplier;
  
  // 2. FICA Calculation
  // FICA limit (Social Security Wage Base) applies to the 6.2% portion. Medicare (1.45%) has no limit.
  let ficaTax = 0;
  if (input.visaStatus === VisaStatus.F1 && input.yearsInUS <= 5) {
    ficaTax = 0;
    messages.push("FICA Exempt: F-1 students are exempt from Social Security & Medicare taxes for their first 5 calendar years.");
  } else {
    // Social Security (6.2%) capped at wage base
    const ssTaxable = Math.min(grossPay, taxYearData.SS_WAGE_BASE);
    const ssTax = ssTaxable * 0.062;
    
    // Medicare (1.45%) unlimited
    const medicareTax = grossPay * 0.0145;
    
    ficaTax = ssTax + medicareTax;
    
    if (input.visaStatus === VisaStatus.F1) {
      messages.push("FICA Applied: You have exceeded the 5-year exemption period for F-1 students.");
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
         let remainingStateIncome = adjustedGrossIncome; // Using AGI as base for state tax approximation
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
        // Fallback for graduated states where specific brackets aren't yet mapped in constants
        // Interpolate between min and max
        const maxBracketEstimate = input.filingStatus === 'Married Filing Jointly' ? 400000 : 200000;
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
  
  // Refund / Owe
  const totalPaid = input.federalTaxPaid * multiplier; 
  const refundOrOwe = totalPaid - federalTaxLiability;

  return {
    grossPay,
    adjustedGrossIncome,
    standardDeduction,
    taxableIncome,
    federalTaxLiability,
    federalBreakdown,
    ficaTax,
    stateTax,
    totalTaxLiability,
    takeHomePay,
    refundOrOwe,
    effectiveTaxRate: totalTaxLiability / grossPay,
    marginalTaxRate,
    messages,
    stateRateUsed
  };
};
