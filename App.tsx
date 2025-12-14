
import React, { useState, useMemo, useCallback } from 'react';
import { Calculator, MapPin, Calendar, Globe, ChevronRight, ChevronDown, AlertCircle, CheckCircle2, Info, ArrowRight, Sparkles, Loader2, Bot, Users, Printer, ShieldCheck, AlertTriangle, X, Key } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { VisaStatus, Country, PayFrequency, UserInput, FilingStatus, ValidationError } from './types';
import { STATES_LIST, TAX_DATA, DEFAULT_FORM_VALUES, INPUT_LIMITS, PAY_PERIOD_CONSTANTS, FICA_CONSTANTS, WITHHOLDING_DEFAULTS } from './constants';
import { calculateTax, getAnnualAmount } from './services/taxCalculator';
import { InputGroup } from './components/InputGroup';
import { ResultChart } from './components/ResultChart';
import { Tooltip } from './components/Tooltip';
import { TaxAgentLoader } from './components/TaxAgentLoader';

// Interface for the structured Gemini response
interface AiVerificationResponse {
  gemini_calculations: {
    federal_tax: number;
    state_tax: number;
    fica_tax: number;
  };
  comparison_status: "Match" | "Minor Difference" | "Discrepancy";
  analysis: {
    fica_check: string;
    standard_deduction_check: string;
    state_tax_check: string;
    refund_check: string;
  };
  summary: string;
}

function App() {
  const [formData, setFormData] = useState<UserInput>({
    visaStatus: VisaStatus.F1,
    country: Country.INDIA,
    yearsInUS: DEFAULT_FORM_VALUES.YEARS_IN_US,
    state: DEFAULT_FORM_VALUES.STATE,
    payFrequency: PayFrequency.YEARLY,
    grossPay: DEFAULT_FORM_VALUES.GROSS_PAY,
    preTaxDeductions: DEFAULT_FORM_VALUES.PRE_TAX_DEDUCTIONS,
    federalTaxPaid: DEFAULT_FORM_VALUES.FEDERAL_TAX_PAID,
    ficaWithheld: DEFAULT_FORM_VALUES.FICA_WITHHELD,
    stateTaxWithheld: DEFAULT_FORM_VALUES.STATE_TAX_WITHHELD,
    filingStatus: FilingStatus.SINGLE,
    taxYear: DEFAULT_FORM_VALUES.TAX_YEAR
  });

  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiVerificationResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [takeHomePeriod, setTakeHomePeriod] = useState<'yearly' | 'monthly' | 'biweekly'>('yearly');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [tempApiKeyInput, setTempApiKeyInput] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');

  const handleInputChange = (field: keyof UserInput, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setAiAnalysis(null); // Clear previous analysis on change
    
    // Run validation
    const errors = validateInput(field, value, newFormData);
    setValidationErrors(prev => {
      // Remove old errors for this field, add new ones
      const filtered = prev.filter(e => e.field !== field);
      return [...filtered, ...errors];
    });
  };

  // Helper to get validation errors for a specific field
  const getFieldErrors = (field: keyof UserInput) => validationErrors.filter(e => e.field === field);
  const hasFieldError = (field: keyof UserInput) => getFieldErrors(field).some(e => e.severity === 'error');
  const hasFieldWarning = (field: keyof UserInput) => getFieldErrors(field).some(e => e.severity === 'warning');

  // Calculate results with explicit dependencies to ensure recalculation on any change
  const results = useMemo(() => calculateTax(formData), [
    formData.visaStatus,
    formData.country,
    formData.yearsInUS,
    formData.state,
    formData.payFrequency,
    formData.grossPay,
    formData.preTaxDeductions,
    formData.federalTaxPaid,
    formData.ficaWithheld,
    formData.stateTaxWithheld,
    formData.filingStatus,
    formData.taxYear
  ]);

  const currentStateInfo = useMemo(() => 
    STATES_LIST.find(s => s.name === formData.state), 
  [formData.state]);

  // Calculate suggested FICA withholding based on visa status and years in US
  const suggestedFicaWithholding = useMemo(() => {
    const annualGross = getAnnualAmount(formData.grossPay, formData.payFrequency);
    // F-1 students under 5 years are FICA exempt
    if (formData.visaStatus === VisaStatus.F1 && formData.yearsInUS <= FICA_CONSTANTS.F1_EXEMPTION_CALENDAR_YEARS) {
      return 0;
    }
    // Otherwise, calculate standard FICA (SS 6.2% + Medicare 1.45% = 7.65%)
    return Math.round(annualGross * WITHHOLDING_DEFAULTS.FICA_RATE);
  }, [formData.grossPay, formData.payFrequency, formData.visaStatus, formData.yearsInUS]);

  // Calculate suggested state tax withholding based on state rate
  const suggestedStateWithholding = useMemo(() => {
    const annualGross = getAnnualAmount(formData.grossPay, formData.payFrequency);
    const stateInfo = STATES_LIST.find(s => s.name === formData.state);
    if (!stateInfo || stateInfo.category === 'none') {
      return 0; // No state income tax
    }
    // Use average of min and max rate as a reasonable estimate
    const estimatedRate = (stateInfo.minRate + stateInfo.maxRate) / 2;
    return Math.round(annualGross * estimatedRate);
  }, [formData.grossPay, formData.payFrequency, formData.state]);

  const taxYearLimits = useMemo(() => 
    TAX_DATA[formData.taxYear as keyof typeof TAX_DATA]?.LIMITS || TAX_DATA[2025].LIMITS, 
  [formData.taxYear]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const formatPercent = (val: number) => 
    (val * 100).toFixed(2) + '%';

  const getDisplayedTakeHome = () => {
    switch(takeHomePeriod) {
      case 'monthly': return results.takeHomePay / PAY_PERIOD_CONSTANTS.MONTHS_PER_YEAR;
      case 'biweekly': return results.takeHomePay / PAY_PERIOD_CONSTANTS.BIWEEKLY_PERIODS_PER_YEAR;
      default: return results.takeHomePay;
    }
  };

  // Input validation function
  const validateInput = useCallback((field: keyof UserInput, value: any, currentFormData: UserInput): ValidationError[] => {
    const errors: ValidationError[] = [];
    const annualGross = getAnnualAmount(currentFormData.grossPay, currentFormData.payFrequency);
    
    switch(field) {
      case 'grossPay':
        if (value < INPUT_LIMITS.GROSS_PAY_MIN) {
          errors.push({ field, message: 'Gross pay cannot be negative', severity: 'error' });
        }
        if (value > INPUT_LIMITS.GROSS_PAY_MAX) {
          errors.push({ field, message: 'Please enter a realistic salary amount', severity: 'warning' });
        }
        break;
      
      case 'preTaxDeductions':
        if (value < INPUT_LIMITS.PRE_TAX_DEDUCTIONS_MIN) {
          errors.push({ field, message: 'Deductions cannot be negative', severity: 'error' });
        }
        const annualDeductions = getAnnualAmount(value, currentFormData.payFrequency);
        if (annualDeductions > annualGross && annualGross > 0) {
          errors.push({ field, message: 'Pre-tax deductions exceed gross pay', severity: 'error' });
        }
        break;
      
      case 'federalTaxPaid':
        if (value < INPUT_LIMITS.FEDERAL_TAX_WITHHELD_MIN) {
          errors.push({ field, message: 'Tax withheld cannot be negative', severity: 'error' });
        }
        const annualTaxPaid = getAnnualAmount(value, currentFormData.payFrequency);
        if (annualTaxPaid > annualGross * INPUT_LIMITS.TAX_WITHHELD_WARNING_PERCENT && annualGross > 0) {
          errors.push({ field, message: 'Tax withheld exceeds 50% of gross pay - please verify', severity: 'warning' });
        }
        break;
      
      case 'yearsInUS':
        if (value < INPUT_LIMITS.YEARS_IN_US_MIN) {
          errors.push({ field, message: 'Years in US cannot be negative', severity: 'error' });
        }
        if (value > INPUT_LIMITS.YEARS_IN_US_MAX) {
          errors.push({ field, message: 'Please enter a realistic number of years', severity: 'warning' });
        }
        if (value > INPUT_LIMITS.YEARS_IN_US_F1_WARNING && currentFormData.visaStatus === VisaStatus.F1) {
          errors.push({ field, message: 'After 20+ years, you may have different tax status', severity: 'warning' });
        }
        break;
    }
    return errors;
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const getActiveApiKey = (): string | null => {
    // First try user-provided key, then fall back to env key
    if (userApiKey) return userApiKey;
    if (process.env.API_KEY) return process.env.API_KEY;
    return null;
  };

  const handleApiKeySubmit = () => {
    if (tempApiKeyInput.trim()) {
      setUserApiKey(tempApiKeyInput.trim());
      setShowApiKeyModal(false);
      setApiKeyError('');
      // Automatically retry verification after setting the key
      setTimeout(() => handleVerifyWithGemini(), 100);
    }
  };

  const handleVerifyWithGemini = async () => {
    const apiKey = getActiveApiKey();
    
    if (!apiKey) {
      setShowApiKeyModal(true);
      setApiKeyError('No API key found. Please enter your Gemini API key to continue.');
      return;
    }

    setIsVerifying(true);
    setAiAnalysis(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const promptContext = `
        You are a highly accurate US Tax verification engine. 
        
        Task: 
        1. Independently calculate the taxes for the user profile below using ${formData.taxYear} IRS rules.
        2. Compare your calculations with the "App Calculated Results" provided.
        3. Verify the FICA exemption logic (F1 exempt for first 5 calendar years).
        4. Verify the State Tax estimate reasonableness for ${formData.state}.
        5. Verify the refund/owe calculations based on withholdings vs liability.
        
        User Profile:
        - Visa: ${formData.visaStatus}
        - Citizenship: ${formData.country}
        - Years in US: ${formData.yearsInUS}
        - State: ${formData.state}
        - Filing Status: ${formData.filingStatus}
        - Tax Year: ${formData.taxYear}
        - Gross Annual Pay: ${results.grossPay}
        - Pre-Tax Deductions: ${getAnnualAmount(formData.preTaxDeductions, formData.payFrequency)}
        
        Withholdings (YTD):
        - Federal Tax Withheld: ${getAnnualAmount(formData.federalTaxPaid, formData.payFrequency)}
        - FICA Tax Withheld: ${getAnnualAmount(formData.ficaWithheld, formData.payFrequency)}
        - State Tax Withheld: ${getAnnualAmount(formData.stateTaxWithheld, formData.payFrequency)}
        
        App Calculated Results (for comparison):
        - Federal Tax Liability: ${results.federalTaxLiability}
        - FICA Tax Liability: ${results.ficaTax}
        - State Tax Liability: ${results.stateTax}
        - Federal Refund/Owe: ${results.refundOrOwe} (positive = refund)
        - FICA Refund/Owe: ${results.ficaRefundOrOwe} (positive = refund)
        - State Refund/Owe: ${results.stateRefundOrOwe} (positive = refund)
        - Total Refund/Owe: ${results.totalRefundOrOwe} (positive = refund)
        
        Output Requirement:
        Return ONLY a raw JSON object matching the requested schema. No markdown formatting.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: promptContext,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              gemini_calculations: {
                type: Type.OBJECT,
                properties: {
                  federal_tax: { type: Type.NUMBER },
                  state_tax: { type: Type.NUMBER },
                  fica_tax: { type: Type.NUMBER }
                }
              },
              comparison_status: { 
                type: Type.STRING, 
                enum: ["Match", "Minor Difference", "Discrepancy"] 
              },
              analysis: {
                type: Type.OBJECT,
                properties: {
                  fica_check: { type: Type.STRING },
                  standard_deduction_check: { type: Type.STRING },
                  state_tax_check: { type: Type.STRING },
                  refund_check: { type: Type.STRING }
                }
              },
              summary: { type: Type.STRING }
            }
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text) as AiVerificationResponse;
        setAiAnalysis(parsed);
      }
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const errorMessage = error?.message || 'Unknown error';
      const isApiKeyError = errorMessage.toLowerCase().includes('api key') || 
                           errorMessage.toLowerCase().includes('invalid') ||
                           errorMessage.toLowerCase().includes('unauthorized') ||
                           errorMessage.toLowerCase().includes('authentication') ||
                           error?.status === 401 || 
                           error?.status === 403;
      
      if (isApiKeyError) {
        setUserApiKey(''); // Clear invalid key
        setApiKeyError('API key error: ' + errorMessage + '. Please enter a valid Gemini API key.');
        setShowApiKeyModal(true);
      } else {
        alert("Verification failed: " + errorMessage);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Key size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Gemini API Key Required</h3>
                    <p className="text-white/80 text-sm">Enter your API key to use AI verification</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowApiKeyModal(false);
                    setApiKeyError('');
                    setTempApiKeyInput('');
                  }}
                  className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {apiKeyError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{apiKeyError}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={tempApiKeyInput}
                  onChange={(e) => setTempApiKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApiKeySubmit()}
                  placeholder="Enter your Gemini API key..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 p-3 transition-all outline-none"
                  autoFocus
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">How to get a Gemini API Key:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Visit <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Google AI Studio</a></li>
                  <li>Sign in with your Google account</li>
                  <li>Click "Create API Key"</li>
                  <li>Copy and paste the key here</li>
                </ol>
                <p className="mt-2 text-xs text-blue-600">
                  <Info size={12} className="inline mr-1" />
                  Your key is stored temporarily in this session only and is never saved.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowApiKeyModal(false);
                  setApiKeyError('');
                  setTempApiKeyInput('');
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApiKeySubmit}
                disabled={!tempApiKeyInput.trim()}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Key size={16} />
                Use This Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 print:static print:border-none">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20 print:hidden">
              <Calculator className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">VisaTax</h1>
              <p className="text-slate-500 text-sm">International Student & Worker Tax Estimator</p>
            </div>
          </div>
          <button 
            onClick={handlePrint}
            className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-lg no-print"
          >
            <Printer size={18} />
            Print Report
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 space-y-6 print:hidden">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                  Your Profile
                </h2>
                
                <div className="space-y-5">
                   <div className="grid grid-cols-2 gap-5">
                      <InputGroup label="Tax Year" tooltip="Select the tax year for calculation. 2024 is for filing in April 2025.">
                        <div className="relative">
                          <select 
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 block p-3 pr-8 transition-all outline-none"
                            value={formData.taxYear}
                            onChange={(e) => handleInputChange('taxYear', parseInt(e.target.value))}
                          >
                            <option value={2024}>2024</option>
                            <option value={2025}>2025</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                            <ChevronDown size={14} />
                          </div>
                        </div>
                      </InputGroup>

                      <InputGroup label="Status" tooltip="Select how you will file your taxes.">
                         <div className="relative">
                          <select 
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 block p-3 pr-8 transition-all outline-none"
                            value={formData.filingStatus}
                            onChange={(e) => handleInputChange('filingStatus', e.target.value)}
                          >
                            <option value={FilingStatus.SINGLE}>Single</option>
                            <option value={FilingStatus.MARRIED_JOINT}>Married (Joint)</option>
                          </select>
                           <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                            <ChevronDown size={14} />
                          </div>
                        </div>
                      </InputGroup>
                   </div>

                  <InputGroup label="Visa Status" tooltip="F-1 students are often Non-Residents. H-1B workers are typically Residents for tax purposes.">
                    <div className="relative">
                      <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 block p-3 pr-8 transition-all outline-none"
                        value={formData.visaStatus}
                        onChange={(e) => handleInputChange('visaStatus', e.target.value)}
                      >
                        <option value={VisaStatus.F1}>F-1 Student</option>
                        <option value={VisaStatus.H1B}>H-1B Worker</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </InputGroup>

                  {/* F-1 Visual Timeline */}
                  {formData.visaStatus === VisaStatus.F1 && (
                    <div className={`rounded-xl p-4 border ${formData.yearsInUS <= FICA_CONSTANTS.F1_EXEMPTION_CALENDAR_YEARS ? 'bg-blue-50/50 border-blue-100' : 'bg-amber-50/50 border-amber-100'}`}>
                       <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          <span>FICA Exempt (NRA)</span>
                          <span>FICA Applies (RA)</span>
                       </div>
                       <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden flex">
                          <div className="w-5/6 h-full bg-blue-200"></div> {/* 5 years exempt */}
                          <div className="w-1/6 h-full bg-amber-200"></div>
                       </div>
                       <div className="relative h-4 mt-1">
                          {/* Markers */}
                          {[1, 2, 3, 4, 5, 6].map(year => (
                            <div 
                              key={year}
                              className={`absolute top-0 w-0.5 h-1.5 bg-slate-300 ${year === 6 ? 'left-[98%]' : ''}`}
                              style={{left: year < 6 ? `${(year/6)*100}%` : undefined}}
                            />
                          ))}
                          {/* Current Indicator */}
                          <div 
                            className={`absolute -top-1 w-3 h-3 rounded-full shadow border border-white transition-all duration-300 ${formData.yearsInUS <= FICA_CONSTANTS.F1_EXEMPTION_CALENDAR_YEARS ? 'bg-blue-600' : 'bg-amber-500'}`}
                            style={{ 
                              left: `${Math.min(((formData.yearsInUS)/6)*100, 100)}%`,
                              transform: 'translateX(-50%)'
                            }}
                          ></div>
                       </div>
                       <p className={`text-xs font-medium mt-1 text-center ${formData.yearsInUS <= FICA_CONSTANTS.F1_EXEMPTION_CALENDAR_YEARS ? 'text-blue-800' : 'text-amber-800'}`}>
                         {formData.yearsInUS <= FICA_CONSTANTS.F1_EXEMPTION_CALENDAR_YEARS 
                           ? `Calendar Year ${formData.yearsInUS}: FICA Exempt`
                           : `Calendar Year ${formData.yearsInUS}: FICA Applies (SS + Medicare)`}
                       </p>
                       <p className="text-[10px] text-slate-500 mt-1 text-center">
                         Any partial calendar year of physical presence counts as a full year
                       </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InputGroup label="Calendar Years in US" tooltip={`F-1 students are exempt from FICA taxes for their first ${FICA_CONSTANTS.F1_EXEMPTION_CALENDAR_YEARS} calendar years of physical presence in the US. A partial year counts as a full calendar year.`}>
                      <div className="relative">
                        <input 
                          type="number" 
                          min={INPUT_LIMITS.YEARS_IN_US_MIN}
                          max={INPUT_LIMITS.YEARS_IN_US_MAX}
                          className={`w-full bg-slate-50 border text-slate-900 text-sm font-medium rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 block p-3 transition-all outline-none ${hasFieldError('yearsInUS') ? 'border-red-300 bg-red-50' : hasFieldWarning('yearsInUS') ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}
                          value={formData.yearsInUS}
                          onChange={(e) => handleInputChange('yearsInUS', parseInt(e.target.value) || 0)}
                        />
                        <Calendar size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                      </div>
                      {getFieldErrors('yearsInUS').map((err, i) => (
                        <p key={i} className={`text-xs mt-1 ${err.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                          {err.message}
                        </p>
                      ))}
                    </InputGroup>

                    <InputGroup label="State" tooltip="State tax rates vary significantly.">
                      <div className="relative">
                        <select 
                          className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 block p-3 pr-8 transition-all outline-none"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                        >
                          <optgroup label="No Income Tax">
                            {STATES_LIST.filter(s => s.category === 'none').map(s => (
                              <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Flat Income Tax">
                            {STATES_LIST.filter(s => s.category === 'flat').map(s => (
                              <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Graduated Income Tax">
                            {STATES_LIST.filter(s => s.category === 'graduated').map(s => (
                              <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                          </optgroup>
                        </select>
                        <MapPin size={16} className="absolute right-8 top-3.5 text-slate-400 pointer-events-none" />
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                          <ChevronDown size={14} />
                        </div>
                      </div>
                    </InputGroup>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                    Income & Deductions
                  </h2>
                  <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
                    <button 
                      className={`px-3 py-1.5 rounded-md transition-all ${formData.payFrequency === PayFrequency.YEARLY ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => handleInputChange('payFrequency', PayFrequency.YEARLY)}
                    >
                      Yearly
                    </button>
                    <button 
                      className={`px-3 py-1.5 rounded-md transition-all ${formData.payFrequency === PayFrequency.MONTHLY ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => handleInputChange('payFrequency', PayFrequency.MONTHLY)}
                    >
                      Monthly
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <InputGroup label="Gross Pay" tooltip="Your total salary before taxes.">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-slate-400 font-bold">$</span>
                      </div>
                      <input 
                        type="number" 
                        min={INPUT_LIMITS.GROSS_PAY_MIN}
                        className={`w-full pl-7 bg-slate-50 border text-slate-900 text-sm font-medium rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 block p-3 transition-all outline-none ${hasFieldError('grossPay') ? 'border-red-300 bg-red-50' : hasFieldWarning('grossPay') ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}
                        value={formData.grossPay}
                        onChange={(e) => handleInputChange('grossPay', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    {getFieldErrors('grossPay').map((err, i) => (
                      <p key={i} className={`text-xs mt-1 ${err.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                        {err.message}
                      </p>
                    ))}
                  </InputGroup>

                  <InputGroup label="Pre-Tax Deductions (401k/HSA)" tooltip="Money taken out for retirement or health insurance before tax.">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-slate-400 font-bold">$</span>
                      </div>
                      <input 
                        type="number" 
                        min={INPUT_LIMITS.PRE_TAX_DEDUCTIONS_MIN}
                        className={`w-full pl-7 bg-slate-50 border text-slate-900 text-sm font-medium rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 block p-3 transition-all outline-none ${hasFieldError('preTaxDeductions') ? 'border-red-300 bg-red-50' : hasFieldWarning('preTaxDeductions') ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}
                        value={formData.preTaxDeductions}
                        onChange={(e) => handleInputChange('preTaxDeductions', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    {getFieldErrors('preTaxDeductions').map((err, i) => (
                      <p key={i} className={`text-xs mt-1 ${err.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                        {err.message}
                      </p>
                    ))}
                    {/* Quick Fill Helpers */}
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => handleInputChange('preTaxDeductions', taxYearLimits.K401)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
                      >
                        + Max 401k (${(taxYearLimits.K401/1000).toFixed(1)}k)
                      </button>
                      <button 
                        onClick={() => handleInputChange('preTaxDeductions', taxYearLimits.HSA_SINGLE)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
                      >
                         + Max HSA (${taxYearLimits.HSA_SINGLE})
                      </button>
                    </div>
                  </InputGroup>

                  <InputGroup label="Federal Tax Withheld (YTD)" tooltip="Total Federal Income Tax already paid/withheld from your paystubs.">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-slate-400 font-bold">$</span>
                      </div>
                      <input 
                        type="number" 
                        min={INPUT_LIMITS.FEDERAL_TAX_WITHHELD_MIN}
                        className={`w-full pl-7 bg-slate-50 border text-slate-900 text-sm font-medium rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 block p-3 transition-all outline-none ${hasFieldError('federalTaxPaid') ? 'border-red-300 bg-red-50' : hasFieldWarning('federalTaxPaid') ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}
                        value={formData.federalTaxPaid}
                        onChange={(e) => handleInputChange('federalTaxPaid', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    {getFieldErrors('federalTaxPaid').map((err, i) => (
                      <p key={i} className={`text-xs mt-1 ${err.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                        {err.message}
                      </p>
                    ))}
                  </InputGroup>

                  <InputGroup label="FICA Tax Withheld (YTD)" tooltip="Social Security + Medicare taxes withheld from your paystubs. F-1 students under 5 years are typically exempt.">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-slate-400 font-bold">$</span>
                      </div>
                      <input 
                        type="number" 
                        min={0}
                        className={`w-full pl-7 bg-slate-50 border text-slate-900 text-sm font-medium rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 block p-3 transition-all outline-none ${hasFieldError('ficaWithheld') ? 'border-red-300 bg-red-50' : hasFieldWarning('ficaWithheld') ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}
                        value={formData.ficaWithheld}
                        onChange={(e) => handleInputChange('ficaWithheld', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    {/* Quick Fill Helper */}
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => handleInputChange('ficaWithheld', suggestedFicaWithholding)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
                      >
                        {suggestedFicaWithholding === 0 ? '✓ FICA Exempt (F-1 < 5 yrs)' : `Est. ${formatCurrency(suggestedFicaWithholding)}`}
                      </button>
                    </div>
                  </InputGroup>

                  <InputGroup label="State Tax Withheld (YTD)" tooltip="State income tax withheld from your paystubs. Some states like Texas have no income tax.">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-slate-400 font-bold">$</span>
                      </div>
                      <input 
                        type="number" 
                        min={0}
                        className={`w-full pl-7 bg-slate-50 border text-slate-900 text-sm font-medium rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 block p-3 transition-all outline-none ${hasFieldError('stateTaxWithheld') ? 'border-red-300 bg-red-50' : hasFieldWarning('stateTaxWithheld') ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}
                        value={formData.stateTaxWithheld}
                        onChange={(e) => handleInputChange('stateTaxWithheld', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    {/* Quick Fill Helper */}
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => handleInputChange('stateTaxWithheld', suggestedStateWithholding)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
                      >
                        {suggestedStateWithholding === 0 ? '✓ No State Tax' : `Est. ${formatCurrency(suggestedStateWithholding)}`}
                      </button>
                    </div>
                  </InputGroup>
                </div>
              </div>
            </div>

            {/* Chart Card - Moved to Left Column */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Distribution</h3>
              <div className="flex-1 flex items-center justify-center">
                <ResultChart result={results} />
              </div>
            </div>
          </div>

          {/* Right Column: The Receipt */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Stat Card (Waterfall) */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 text-white relative rounded-t-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Projected Take Home Pay</p>
                      <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                        {formatCurrency(getDisplayedTakeHome())}
                      </h2>
                      <p className="text-slate-400 text-sm mt-1 capitalize">
                         {takeHomePeriod === 'biweekly' ? 'Every 2 Weeks' : takeHomePeriod}
                      </p>
                   </div>
                   
                   {/* Period Toggle */}
                   <div className="bg-slate-700/50 p-1 rounded-lg flex text-xs font-medium no-print">
                      <button 
                         onClick={() => setTakeHomePeriod('yearly')}
                         className={`px-3 py-1.5 rounded-md transition-all ${takeHomePeriod === 'yearly' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                      >
                        Annual
                      </button>
                      <button 
                         onClick={() => setTakeHomePeriod('monthly')}
                         className={`px-3 py-1.5 rounded-md transition-all ${takeHomePeriod === 'monthly' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                      >
                        Monthly
                      </button>
                      <button 
                         onClick={() => setTakeHomePeriod('biweekly')}
                         className={`px-3 py-1.5 rounded-md transition-all ${takeHomePeriod === 'biweekly' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                      >
                        Bi-Weekly
                      </button>
                   </div>
                </div>
              </div>

              {/* Waterfall Calculation */}
              <div className="p-6 md:p-8 bg-white rounded-b-2xl">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Taxable Income Calculation</h3>
                <div className="space-y-3 relative">
                  {/* Vertical Line */}
                  <div className="absolute left-[9px] top-2 bottom-6 w-0.5 bg-slate-100"></div>

                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-slate-500">1</span>
                      </div>
                      <span className="text-slate-600 text-sm">Gross Pay</span>
                    </div>
                    <span className="font-medium text-slate-900">{formatCurrency(results.grossPay)}</span>
                  </div>

                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                       <div className="w-5 h-5 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-rose-500">-</span>
                      </div>
                      <span className="text-slate-500 text-sm">Pre-Tax Deductions</span>
                    </div>
                    <span className="text-rose-600 text-sm">{formatCurrency(getAnnualAmount(formData.preTaxDeductions, formData.payFrequency))}</span>
                  </div>

                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                       <div className="w-5 h-5 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-rose-500">-</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-slate-500 text-sm">Standard Deduction</span>
                        <Tooltip text={results.messages.find(m => m.includes('Deduction') || m.includes('Treaty')) || 'Standard deduction'} />
                      </div>
                    </div>
                    <span className="text-rose-600 text-sm">{formatCurrency(results.standardDeduction)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2 relative z-10">
                    <div className="flex items-center gap-3 ml-8">
                      <span className="text-slate-900 font-semibold text-sm">Taxable Income</span>
                    </div>
                    <span className="text-slate-900 font-bold">{formatCurrency(results.taxableIncome)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Liability Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-6">Tax Liability</h3>
              
              <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-center group">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-slate-600 text-sm">Federal Tax</span>
                    </div>
                    <span className="text-slate-900 font-semibold">{formatCurrency(results.federalTaxLiability)}</span>
                  </div>

                  <div className="flex justify-between items-center group">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                      <div className="flex items-center">
                        <span className="text-slate-600 text-sm">State Tax</span>
                        <Tooltip text={`${currentStateInfo?.name} Tax Range: ${formatPercent(currentStateInfo?.minRate || 0)} - ${formatPercent(currentStateInfo?.maxRate || 0)}. Estimated effective rate: ${formatPercent(results.stateRateUsed)}`} />
                      </div>
                    </div>
                    <span className="text-slate-900 font-semibold">{formatCurrency(results.stateTax)}</span>
                  </div>

                  <div className="flex justify-between items-center group">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        <div className="flex items-center">
                        <span className="text-slate-600 text-sm">FICA</span>
                        <Tooltip text={results.messages.find(m => m.includes('FICA')) || 'Social Security & Medicare'} />
                      </div>
                    </div>
                    <span className="text-slate-900 font-semibold">{formatCurrency(results.ficaTax)}</span>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-900 font-bold text-sm">Total Tax</span>
                        <span className="text-slate-900 font-extrabold">{formatCurrency(results.totalTaxLiability)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-400 text-xs">Effective Rate</span>
                        <span className="text-slate-500 text-xs">{(results.effectiveTaxRate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
              </div>
            </div>

            {/* Federal Slab Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 ease-in-out">
               <div 
                 onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
                 className={`p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors group select-none rounded-t-2xl ${isBreakdownExpanded ? '' : 'rounded-b-2xl'}`}
                 role="button"
                 aria-expanded={isBreakdownExpanded}
               >
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                   Federal Tax Bracket Breakdown
                   {/* Stop propagation on tooltip to prevent toggling when user just wants to hover/tap info */}
                   <div onClick={(e) => e.stopPropagation()}>
                     <Tooltip text="The US has a progressive tax system. You only pay the higher rate on the money that falls into that specific bucket." />
                   </div>
                 </h3>
                 <div className={`text-slate-400 transition-transform duration-300 ${isBreakdownExpanded ? 'rotate-180' : ''}`}>
                   <ChevronDown size={20} />
                 </div>
               </div>
               
               {isBreakdownExpanded && (
                 <div className="p-0 animate-in fade-in slide-in-from-top-2 duration-200 rounded-b-2xl">
                   {results.federalBreakdown.length > 0 ? (
                     <div className="divide-y divide-slate-100 rounded-b-2xl overflow-hidden">
                        {results.federalBreakdown.map((bracket, index) => (
                          <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4 mb-2 sm:mb-0">
                              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex flex-col items-center justify-center shrink-0 border border-blue-100">
                                 <span className="text-sm font-bold">{Math.round(bracket.rate * 100)}%</span>
                              </div>
                              <div>
                                 <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Taxable Income Chunk</p>
                                 <p className="text-sm text-slate-700">
                                   {bracket.max === Infinity 
                                      ? `Over ${formatCurrency(bracket.min)}`
                                      : `${formatCurrency(bracket.min + 1)} – ${formatCurrency(bracket.max)}`
                                    }
                                 </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-6 pl-16 sm:pl-0">
                               <div className="text-right">
                                 <p className="text-xs text-slate-400 mb-0.5">Amount in Bracket</p>
                                 <p className="text-sm font-medium text-slate-700">{formatCurrency(bracket.amountInBracket)}</p>
                               </div>
                               <ArrowRight size={16} className="text-slate-300" />
                               <div className="text-right min-w-[80px]">
                                 <p className="text-xs text-slate-400 mb-0.5">Tax Paid</p>
                                 <p className="text-sm font-bold text-slate-900">{formatCurrency(bracket.taxAmount)}</p>
                               </div>
                            </div>
                          </div>
                        ))}
                        <div className="p-4 bg-slate-50 flex justify-end items-center gap-4">
                          <span className="text-sm text-slate-500 font-medium">Total Federal Tax</span>
                          <span className="text-lg font-bold text-slate-900">{formatCurrency(results.federalTaxLiability)}</span>
                        </div>
                     </div>
                   ) : (
                     <div className="p-8 text-center text-slate-400">
                       No taxable income.
                     </div>
                   )}
                 </div>
               )}
            </div>

            {/* Refund / Owe Banner */}
            <div className={`rounded-2xl shadow-lg border overflow-hidden ${results.totalRefundOrOwe >= 0 ? 'bg-emerald-600 border-emerald-500' : 'bg-white border-rose-200'}`}>
               <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full shrink-0 ${results.totalRefundOrOwe >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-100 text-rose-600'}`}>
                      {results.totalRefundOrOwe >= 0 ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${results.totalRefundOrOwe >= 0 ? 'text-emerald-100' : 'text-rose-600'}`}>
                        {results.totalRefundOrOwe >= 0 ? 'Total Estimated Refund' : 'Total Estimated Amount You Owe'}
                      </p>
                      <h2 className={`text-3xl font-bold ${results.totalRefundOrOwe >= 0 ? 'text-white' : 'text-slate-900'}`}>
                        {formatCurrency(Math.abs(results.totalRefundOrOwe))}
                      </h2>
                      <p className={`text-sm mt-2 max-w-md ${results.totalRefundOrOwe >= 0 ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {results.totalRefundOrOwe >= 0 
                          ? "Based on your inputs, you've withheld enough to cover your liability." 
                          : "You may need to save this amount to pay your tax bill in April."}
                      </p>
                    </div>
                 </div>
                 
                 {results.totalRefundOrOwe < 0 && (
                   <div className="bg-rose-50 px-4 py-3 rounded-lg border border-rose-100 text-rose-700 text-xs max-w-xs">
                     <strong>Tip:</strong> Consider adjusting your W-4 withholding or making estimated tax payments to avoid penalties.
                   </div>
                 )}
               </div>
               
               {/* Breakdown by tax type */}
               <div className={`px-6 pb-6 grid grid-cols-3 gap-4 ${results.totalRefundOrOwe >= 0 ? 'bg-emerald-600' : 'bg-white border-t border-slate-100'}`}>
                 <div className={`text-center p-3 rounded-lg ${results.totalRefundOrOwe >= 0 ? 'bg-emerald-500/50' : 'bg-slate-50'}`}>
                   <p className={`text-xs font-medium mb-1 ${results.totalRefundOrOwe >= 0 ? 'text-emerald-100' : 'text-slate-500'}`}>Federal</p>
                   <p className={`text-lg font-bold ${results.refundOrOwe >= 0 ? (results.totalRefundOrOwe >= 0 ? 'text-white' : 'text-emerald-600') : 'text-rose-600'}`}>
                     {formatCurrency(Math.abs(results.refundOrOwe))}
                   </p>
                   <p className={`text-[10px] font-medium mt-0.5 ${results.totalRefundOrOwe >= 0 ? 'text-emerald-200' : (results.refundOrOwe >= 0 ? 'text-emerald-500' : 'text-rose-500')}`}>
                     {results.refundOrOwe >= 0 ? '↑ Refund' : '↓ Owe'}
                   </p>
                 </div>
                 <div className={`text-center p-3 rounded-lg ${results.totalRefundOrOwe >= 0 ? 'bg-emerald-500/50' : 'bg-slate-50'}`}>
                   <p className={`text-xs font-medium mb-1 ${results.totalRefundOrOwe >= 0 ? 'text-emerald-100' : 'text-slate-500'}`}>FICA</p>
                   <p className={`text-lg font-bold ${results.ficaRefundOrOwe >= 0 ? (results.totalRefundOrOwe >= 0 ? 'text-white' : 'text-emerald-600') : 'text-rose-600'}`}>
                     {formatCurrency(Math.abs(results.ficaRefundOrOwe))}
                   </p>
                   <p className={`text-[10px] font-medium mt-0.5 ${results.totalRefundOrOwe >= 0 ? 'text-emerald-200' : (results.ficaRefundOrOwe >= 0 ? 'text-emerald-500' : 'text-rose-500')}`}>
                     {results.ficaRefundOrOwe >= 0 ? (results.ficaBreakdown.isExempt ? '✓ Exempt' : '↑ Refund') : '↓ Owe'}
                   </p>
                 </div>
                 <div className={`text-center p-3 rounded-lg ${results.totalRefundOrOwe >= 0 ? 'bg-emerald-500/50' : 'bg-slate-50'}`}>
                   <p className={`text-xs font-medium mb-1 ${results.totalRefundOrOwe >= 0 ? 'text-emerald-100' : 'text-slate-500'}`}>State</p>
                   <p className={`text-lg font-bold ${results.stateRefundOrOwe >= 0 ? (results.totalRefundOrOwe >= 0 ? 'text-white' : 'text-emerald-600') : 'text-rose-600'}`}>
                     {formatCurrency(Math.abs(results.stateRefundOrOwe))}
                   </p>
                   <p className={`text-[10px] font-medium mt-0.5 ${results.totalRefundOrOwe >= 0 ? 'text-emerald-200' : (results.stateRefundOrOwe >= 0 ? 'text-emerald-500' : 'text-rose-500')}`}>
                     {results.stateTax === 0 ? '✓ No State Tax' : (results.stateRefundOrOwe >= 0 ? '↑ Refund' : '↓ Owe')}
                   </p>
                 </div>
               </div>
            </div>
            
            {/* AI Verification Section */}
            <div className="mt-4 no-print">
               {isVerifying ? (
                 <TaxAgentLoader />
               ) : (
                 <>
                   <button 
                    onClick={handleVerifyWithGemini}
                    disabled={isVerifying}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium p-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                   >
                     <Sparkles className="group-hover:text-yellow-300 transition-colors" size={20} />
                     <span>Double Check with AI Agent</span>
                   </button>
                   {userApiKey && (
                     <div className="mt-2 flex items-center justify-center gap-2 text-xs text-indigo-600">
                       <Key size={12} />
                       <span>Using your API key</span>
                       <button 
                         onClick={() => {
                           setUserApiKey('');
                           setAiAnalysis(null);
                         }}
                         className="text-slate-400 hover:text-rose-500 ml-1"
                         title="Remove your API key"
                       >
                         <X size={12} />
                       </button>
                     </div>
                   )}
                 </>
               )}

               {aiAnalysis && (
                 <div className="mt-6 bg-white border border-indigo-100 rounded-2xl shadow-lg shadow-indigo-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                    {/* Header */}
                    <div className="bg-indigo-50/50 p-6 border-b border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Bot className="text-indigo-600" size={20} />
                         <span className="font-bold text-indigo-900 text-sm uppercase tracking-wide">AI Verification Report</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        aiAnalysis.comparison_status === 'Match' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                        aiAnalysis.comparison_status === 'Minor Difference' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                        'bg-rose-100 text-rose-700 border-rose-200'
                      }`}>
                        Status: {aiAnalysis.comparison_status}
                      </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="p-6">
                       <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Calculation Comparison</h4>
                       <div className="overflow-hidden rounded-xl border border-slate-200">
                         <table className="w-full text-sm">
                           <thead className="bg-slate-50 text-slate-500 font-medium text-left">
                             <tr>
                               <th className="px-4 py-3">Tax Category</th>
                               <th className="px-4 py-3">App Calculation</th>
                               <th className="px-4 py-3">AI Independent Calc</th>
                               <th className="px-4 py-3 text-right">Difference</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                             <tr>
                               <td className="px-4 py-3 font-medium text-slate-700">Federal Tax</td>
                               <td className="px-4 py-3">{formatCurrency(results.federalTaxLiability)}</td>
                               <td className="px-4 py-3 text-indigo-600 font-medium">{formatCurrency(aiAnalysis.gemini_calculations.federal_tax)}</td>
                               <td className="px-4 py-3 text-right text-slate-400">
                                 {Math.abs(results.federalTaxLiability - aiAnalysis.gemini_calculations.federal_tax) < 50 ? <CheckCircle2 size={16} className="ml-auto text-emerald-500" /> : formatCurrency(Math.abs(results.federalTaxLiability - aiAnalysis.gemini_calculations.federal_tax))}
                               </td>
                             </tr>
                             <tr>
                               <td className="px-4 py-3 font-medium text-slate-700">State Tax</td>
                               <td className="px-4 py-3">{formatCurrency(results.stateTax)}</td>
                               <td className="px-4 py-3 text-indigo-600 font-medium">{formatCurrency(aiAnalysis.gemini_calculations.state_tax)}</td>
                               <td className="px-4 py-3 text-right text-slate-400">
                                 {Math.abs(results.stateTax - aiAnalysis.gemini_calculations.state_tax) < 50 ? <CheckCircle2 size={16} className="ml-auto text-emerald-500" /> : formatCurrency(Math.abs(results.stateTax - aiAnalysis.gemini_calculations.state_tax))}
                               </td>
                             </tr>
                             <tr>
                               <td className="px-4 py-3 font-medium text-slate-700">FICA Tax</td>
                               <td className="px-4 py-3">{formatCurrency(results.ficaTax)}</td>
                               <td className="px-4 py-3 text-indigo-600 font-medium">{formatCurrency(aiAnalysis.gemini_calculations.fica_tax)}</td>
                               <td className="px-4 py-3 text-right text-slate-400">
                                 {Math.abs(results.ficaTax - aiAnalysis.gemini_calculations.fica_tax) < 10 ? <CheckCircle2 size={16} className="ml-auto text-emerald-500" /> : formatCurrency(Math.abs(results.ficaTax - aiAnalysis.gemini_calculations.fica_tax))}
                               </td>
                             </tr>
                           </tbody>
                         </table>
                       </div>
                    </div>

                    {/* Insights Grid */}
                    <div className="bg-slate-50 p-6 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Verification Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 text-emerald-600 font-semibold text-xs uppercase">
                              <ShieldCheck size={14} /> FICA Exemption Logic
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{aiAnalysis.analysis.fica_check}</p>
                         </div>
                         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-xs uppercase">
                              <Info size={14} /> Standard Deduction
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{aiAnalysis.analysis.standard_deduction_check}</p>
                         </div>
                         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 text-slate-600 font-semibold text-xs uppercase">
                              <MapPin size={14} /> State Tax Assessment
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{aiAnalysis.analysis.state_tax_check}</p>
                         </div>
                         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2 text-amber-600 font-semibold text-xs uppercase">
                              <Calculator size={14} /> Refund/Owe Verification
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{aiAnalysis.analysis.refund_check}</p>
                         </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200">
                         <p className="text-sm font-medium text-slate-900">Summary</p>
                         <p className="text-sm text-slate-600 mt-1">{aiAnalysis.summary}</p>
                      </div>
                    </div>
                 </div>
               )}
            </div>

            <p className="text-xs text-slate-400 text-center leading-relaxed mt-8 max-w-2xl mx-auto">
              * This tool is for educational purposes only and is not professional tax advice. 
              Estimates are based on {formData.taxYear} brackets. State taxes are approximated using effective rate estimation based on income. 
              Always consult a CPA or tax professional before filing.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
