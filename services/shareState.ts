import { Country, F1WorkType, FilingStatus, PayFrequency, UserInput, VisaStatus } from '../types';

const toNumber = (value: string | null): number | undefined => {
  if (value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toBoolean = (value: string | null): boolean | undefined => {
  if (value === null) return undefined;
  return value === '1';
};

export const serializeShareState = (input: UserInput): string => {
  const params = new URLSearchParams();

  params.set('visaStatus', input.visaStatus);
  if (input.f1WorkType) params.set('f1WorkType', input.f1WorkType);
  params.set('country', input.country);
  params.set('yearsInUS', String(input.yearsInUS));
  params.set('state', input.state);
  params.set('hasMultiStateIncome', input.hasMultiStateIncome ? '1' : '0');
  if (input.secondState) params.set('secondState', input.secondState);
  if (input.secondStateIncomeShare !== undefined) params.set('secondStateIncomeShare', String(input.secondStateIncomeShare));
  params.set('payFrequency', input.payFrequency);
  params.set('grossPay', String(input.grossPay));
  params.set('preTaxDeductions', String(input.preTaxDeductions));
  params.set('federalTaxPaid', String(input.federalTaxPaid));
  params.set('ficaWithheld', String(input.ficaWithheld));
  params.set('stateTaxWithheld', String(input.stateTaxWithheld));
  params.set('filingStatus', input.filingStatus);
  params.set('taxYear', String(input.taxYear));
  if (input.standardDeductionOverride !== undefined) params.set('standardDeductionOverride', String(input.standardDeductionOverride));
  params.set('hasStockIncome', input.hasStockIncome ? '1' : '0');
  if (input.stockProceeds !== undefined) params.set('stockProceeds', String(input.stockProceeds));
  if (input.stockCostBasis !== undefined) params.set('stockCostBasis', String(input.stockCostBasis));

  return params.toString();
};

export const buildShareUrl = (input: UserInput): string => {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.search = serializeShareState(input);
  return url.toString();
};

export const parseShareState = (search: string): Partial<UserInput> => {
  const params = new URLSearchParams(search);
  if ([...params.keys()].length === 0) return {};

  const parsed: Partial<UserInput> = {};

  const visaStatus = params.get('visaStatus');
  if (visaStatus && Object.values(VisaStatus).includes(visaStatus as VisaStatus)) parsed.visaStatus = visaStatus as VisaStatus;

  const f1WorkType = params.get('f1WorkType');
  if (f1WorkType && Object.values(F1WorkType).includes(f1WorkType as F1WorkType)) parsed.f1WorkType = f1WorkType as F1WorkType;

  const country = params.get('country');
  if (country && Object.values(Country).includes(country as Country)) parsed.country = country as Country;

  const state = params.get('state');
  if (state) parsed.state = state;

  const secondState = params.get('secondState');
  if (secondState) parsed.secondState = secondState;

  const payFrequency = params.get('payFrequency');
  if (payFrequency && Object.values(PayFrequency).includes(payFrequency as PayFrequency)) parsed.payFrequency = payFrequency as PayFrequency;

  const filingStatus = params.get('filingStatus');
  if (filingStatus && Object.values(FilingStatus).includes(filingStatus as FilingStatus)) parsed.filingStatus = filingStatus as FilingStatus;

  const yearsInUS = toNumber(params.get('yearsInUS'));
  if (yearsInUS !== undefined) parsed.yearsInUS = yearsInUS;

  const secondStateIncomeShare = toNumber(params.get('secondStateIncomeShare'));
  if (secondStateIncomeShare !== undefined) parsed.secondStateIncomeShare = secondStateIncomeShare;

  const grossPay = toNumber(params.get('grossPay'));
  if (grossPay !== undefined) parsed.grossPay = grossPay;

  const preTaxDeductions = toNumber(params.get('preTaxDeductions'));
  if (preTaxDeductions !== undefined) parsed.preTaxDeductions = preTaxDeductions;

  const federalTaxPaid = toNumber(params.get('federalTaxPaid'));
  if (federalTaxPaid !== undefined) parsed.federalTaxPaid = federalTaxPaid;

  const ficaWithheld = toNumber(params.get('ficaWithheld'));
  if (ficaWithheld !== undefined) parsed.ficaWithheld = ficaWithheld;

  const stateTaxWithheld = toNumber(params.get('stateTaxWithheld'));
  if (stateTaxWithheld !== undefined) parsed.stateTaxWithheld = stateTaxWithheld;

  const taxYear = toNumber(params.get('taxYear'));
  if (taxYear !== undefined) parsed.taxYear = taxYear;

  const standardDeductionOverride = toNumber(params.get('standardDeductionOverride'));
  if (standardDeductionOverride !== undefined) parsed.standardDeductionOverride = standardDeductionOverride;

  const hasMultiStateIncome = toBoolean(params.get('hasMultiStateIncome'));
  if (hasMultiStateIncome !== undefined) parsed.hasMultiStateIncome = hasMultiStateIncome;

  const hasStockIncome = toBoolean(params.get('hasStockIncome'));
  if (hasStockIncome !== undefined) parsed.hasStockIncome = hasStockIncome;

  const stockProceeds = toNumber(params.get('stockProceeds'));
  if (stockProceeds !== undefined) parsed.stockProceeds = stockProceeds;

  const stockCostBasis = toNumber(params.get('stockCostBasis'));
  if (stockCostBasis !== undefined) parsed.stockCostBasis = stockCostBasis;

  return parsed;
};
