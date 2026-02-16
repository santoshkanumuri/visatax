# VisaTax Enhancement Plan (Indian Student Focus)

## Main Goal
Keep VisaTax a simple estimate tool while making it reliable, student-friendly, and actionable for Indian F-1/OPT/CPT and H-1B users.

## Progress Snapshot
1. Feature 1: Completed
2. Feature 2: Completed
3. Feature 3: Completed
4. Feature 4: Completed
5. Feature 5: Completed
6. Feature 6: Completed
7. Feature 7: Completed
8. Feature 8: Completed
9. Feature 9: Completed
10. Feature 10: Completed
11. Feature 11: Completed
12. Feature 12: Completed
13. Feature 13: Completed
14. Feature 14: Completed
15. Feature 15: Completed
16. Feature 16: Completed
17. Feature 17: Completed
18. Feature 18: Completed
19. Feature 19: Completed

## Product Guardrails (Must Keep)
1. No login wall.
2. No long questionnaire.
3. Progressive disclosure only: optional guidance, not mandatory extra fields.
4. Core journey stays fast: quick inputs -> estimate -> next actions.
5. Plain language first; tax/legal detail on demand.

## Execution Order
1. Error Boundary
2. LocalStorage Persistence
3. Biweekly Pay Frequency
4. India-First Onboarding Wizard
5. 3-Step Flow (Profile -> Income -> Review)
6. OPT/CPT Context Labels
7. Plain-Language Labels + Input Examples
8. Tax Optimization Tips Panel
9. FICA Refund Helper (Payroll Template + Docs Checklist)
10. "What Forms Should I File?" Engine + Deadlines
11. Deadline Reminders + Timeline View
12. Multi-State and Moving Support
13. Save and Compare Scenarios
14. Shareable URL
15. Sticky Mobile Summary Card
16. Confidence Badges (Exact/Estimated/Needs Confirmation)
17. Explain-This-Number Drawers
18. Versioned Tax Rules JSON + Source Citation + Last Updated Badge
19. Automated Unit Tests for Critical Edge Cases

---

## 1) Error Boundary
### Why
Prevents white-screen crashes and gives non-technical users a safe recovery path.

### Files to Change
1. `components/ErrorBoundary.tsx` (new)
2. `index.tsx`

### Planned Changes
1. Add React error boundary with fallback UI.
2. Include `Reload app` and `Reset saved data` actions.
3. Wrap `<App />` with `<ErrorBoundary>`.

### Done Criteria
1. Runtime render error shows fallback screen.
2. Reload/reset actions recover app state.

---

## 2) LocalStorage Persistence
### Why
Students revisit during tax season and should not re-enter everything.

### Files to Change
1. `App.tsx`
2. `constants.ts` (storage key/version)

### Planned Changes
1. Persist form state to localStorage with schema version key.
2. Hydrate safely on load with validation + fallback defaults.
3. Debounced save on input change.
4. Add reset action to clear form + storage.

### Done Criteria
1. Refresh keeps form data.
2. Bad stored data does not crash app.

---

## 3) Biweekly Pay Frequency
### Why
CPT/OPT payroll is commonly biweekly.

### Files to Change
1. `types.ts`
2. `services/taxCalculator.ts`
3. `App.tsx`
4. `constants.ts` (reuse 26 periods constant)

### Planned Changes
1. Add `BIWEEKLY` to pay frequency enum.
2. Update annualization logic for all monetary inputs.
3. Add biweekly option in UI.

### Done Criteria
1. Biweekly appears in UI.
2. Annualized outputs are correct across taxes/withholding.

---

## 4) India-First Onboarding Wizard
### Why
First-time users need a fast preset start with familiar student scenarios.

### Files to Change
1. `components/OnboardingWizard.tsx` (new)
2. `App.tsx`
3. `constants.ts` (preset values)
4. `types.ts` (persona type)

### Planned Changes
1. Add persona cards:
   - New F-1
   - F-1 on OPT/CPT
   - H-1B first year
2. Prefill defaults from persona.
3. Keep wizard optional and skippable.

### Done Criteria
1. Persona selection preloads relevant defaults.
2. Skip path goes directly to calculator.

---

## 5) 3-Step Flow (Profile -> Income -> Review)
### Why
Reduces cognitive load and keeps form simple.

### Files to Change
1. `App.tsx`
2. `components/StepProgress.tsx` (new)

### Planned Changes
1. Split form into 3 steps.
2. Keep calculations live in background.
3. Preserve current output quality in Review step.

### Done Criteria
1. User can complete estimate without scrolling through a single long form.
2. Mobile step flow is smooth.

---

## 6) OPT/CPT Context Labels
### Why
Students think in OPT/CPT terms, not generic tax labels.

### Files to Change
1. `types.ts`
2. `App.tsx`

### Planned Changes
1. Add optional `f1WorkType` field: OPT/CPT/On-campus/Other.
2. Show only for F-1 users.
3. Use for context copy and guidance, not tax logic initially.

### Done Criteria
1. F-1 users see contextual work-type options.
2. No additional required fields introduced.

---

## 7) Plain-Language Labels + Input Examples
### Why
Lower input mistakes and improve confidence.

### Files to Change
1. `App.tsx`
2. `components/InputGroup.tsx`

### Planned Changes
1. Rewrite labels in plain language.
2. Add small examples under key inputs (offer letter/paystub references).
3. Keep technical terms inside tooltip/help text.

### Done Criteria
1. Major fields include short examples.
2. UI remains compact and readable.

---

## 8) Tax Optimization Tips Panel
### Why
Users need actions, not just output numbers.

### Files to Change
1. `components/TaxTipsPanel.tsx` (new)
2. `App.tsx`
3. `constants.ts` (tips thresholds/messages)

### Planned Changes
1. Add deterministic tips from current results.
2. Initial tips:
   - Remaining 401(k) room
   - FICA exempt but withheld
   - High estimated amount owed
   - No-state-tax sanity check

### Done Criteria
1. Tips update as inputs change.
2. Works without AI/API dependency.

---

## 9) FICA Refund Helper (Payroll Template + Docs Checklist)
### Why
Wrong FICA withholding is a common pain for Indian F-1 students.

### Files to Change
1. `components/FicaRefundGuide.tsx` (new)
2. `App.tsx`
3. `constants.ts` (checklist copy)

### Planned Changes
1. Show helper when F-1 is exempt and FICA was withheld.
2. Step flow:
   - Ask payroll for refund first
   - If not resolved, IRS filing path
3. Add copyable payroll email template with placeholders.
4. Add required documents checklist (Form 843 path and supporting docs).

### Done Criteria
1. Helper appears only for relevant profiles.
2. User can copy template and checklist quickly.

---

## 10) "What Forms Should I File?" Engine + Deadlines
### Why
Students are often unsure about 8843/1040NR/1040/state filing path.

### Files to Change
1. `services/formsEngine.ts` (new)
2. `components/FormsChecklist.tsx` (new)
3. `types.ts` (forms recommendation model)
4. `data/formsRules.json` (new)

### Planned Changes
1. Build deterministic rule engine for likely forms.
2. Show likely path for 8843 and federal return type guidance.
3. Include likely state return requirement.
4. Show clear deadlines by form.

### Done Criteria
1. Checklist is generated from profile inputs.
2. Deadlines visible in plain language.

---

## 11) Deadline Reminders + Timeline View
### Why
Users need a simple "what to do this month" guide.

### Files to Change
1. `services/deadlineEngine.ts` (new)
2. `components/TaxTimeline.tsx` (new)
3. `App.tsx`

### Planned Changes
1. Add timeline sections: This month, Next month, Filing month.
2. Connect reminders with forms/FICA guidance context.
3. Keep text short and action-oriented.

### Done Criteria
1. Timeline updates based on month and user context.
2. Actions are clear and concise.

---

## 12) Multi-State and Moving Support
### Why
Internships and school often span different states in one year.

### Files to Change
1. `types.ts` (multi-state model)
2. `services/taxCalculator.ts`
3. `components/MultiStateSection.tsx` (new)
4. `App.tsx`

### Planned Changes
1. Add optional second-state entry.
2. Support income split or months-in-state input.
3. Show combined state estimate with assumptions note.

### Done Criteria
1. User can model two-state scenario.
2. State total updates correctly in review.

---

## 13) Save and Compare Scenarios
### Why
Students need quick comparison for common decisions.

### Files to Change
1. `services/scenarioStore.ts` (new)
2. `components/ScenarioCompare.tsx` (new)
3. `types.ts` (scenario types)
4. `App.tsx`

### Planned Changes
1. Save current form as named scenario.
2. Compare scenarios side-by-side:
   - With 401(k) vs without
   - TX job vs CA job
3. Persist scenarios locally.

### Done Criteria
1. Save/load/delete scenarios works.
2. Compare view shows tax and take-home differences.

---

## 14) Shareable URL
### Why
Users frequently share estimates with family/friends.

### Files to Change
1. `services/shareState.ts` (new)
2. `App.tsx`

### Planned Changes
1. Encode safe form fields in URL query params.
2. Add `Copy Share Link` action.
3. Hydrate app from URL params on load.
4. Exclude secrets/private values (API key, future personal fields).

### Done Criteria
1. Shared link reproduces scenario.
2. No sensitive values in URL.

---

## 15) Sticky Mobile Summary Card
### Why
Refund/owe signal should stay visible on mobile.

### Files to Change
1. `components/MobileSummaryBar.tsx` (new)
2. `App.tsx`

### Planned Changes
1. Add sticky bottom card on small screens with refund/owe and quick jump.
2. Keep desktop and print layouts unchanged.

### Done Criteria
1. Summary remains visible while scrolling on mobile.
2. No overlap with primary controls.

---

## 16) Confidence Badges (Exact/Estimated/Needs Confirmation)
### Why
Users should know confidence per tax section.

### Files to Change
1. `types.ts` (confidence enum/type)
2. `services/taxCalculator.ts`
3. `components/ConfidenceBadge.tsx` (new)
4. `App.tsx`

### Planned Changes
1. Add confidence metadata per section (Federal/State/FICA/Forms).
2. Rules:
   - Exact: deterministic mapped rules
   - Estimated: interpolation/assumptions
   - Needs confirmation: ambiguous edge cases

### Done Criteria
1. Badge shown on each major section.
2. Badge logic matches calculation path.

---

## 17) Explain-This-Number Drawers
### Why
Replace dense cards with compact explainers.

### Files to Change
1. `components/ExplainDrawer.tsx` (new)
2. `App.tsx`

### Planned Changes
1. Add expandable "Explain" drawers for major numbers.
2. Include formula, inputs used, and assumptions.
3. Keep default view compact.

### Done Criteria
1. Major output rows have expandable explanations.
2. Review screen is visually cleaner than current dense layout.

---

## 18) Versioned Tax Rules JSON + Source Citation + Last Updated Badge
### Why
Improves auditability, maintenance, and trust.

### Files to Change
1. `data/tax-rules/2024.json` (new)
2. `data/tax-rules/2025.json` (new)
3. `data/tax-rules/index.json` (new manifest)
4. `services/taxRulesLoader.ts` (new)
5. `services/taxCalculator.ts`
6. `App.tsx`

### Planned Changes
1. Move hardcoded tax rules to versioned JSON.
2. Include metadata: version, source citation, last updated date.
3. Show badge in review UI.
4. Add safe fallback if rules data fails to load.

### Done Criteria
1. Calculator reads rules from versioned JSON.
2. Last updated + source are visible in UI.

---

## 19) Automated Unit Tests for Critical Edge Cases
### Why
Protect core logic from regressions.

### Files to Change
1. `package.json` (test scripts)
2. `vite.config.ts` (test config)
3. `services/taxCalculator.test.ts` (new)
4. `services/formsEngine.test.ts` (new)
5. `services/shareState.test.ts` (new)

### Planned Changes
1. Add `vitest` test setup.
2. Add must-pass edge tests:
   - F-1 year 5 exempt vs year 6 taxable FICA
   - Additional Medicare threshold handling
   - Stock loss should not add tax
   - No-income-tax state => zero state tax
3. Add tests for forms engine and share-state roundtrip.

### Done Criteria
1. Tests run locally and in CI.
2. All critical edge cases are covered.

---

## Rollout Strategy
1. Phase 1 (Reliability Foundation): 1, 2, 3, 19
2. Phase 2 (Simple UX Upgrade): 4, 5, 6, 7, 15, 17
3. Phase 3 (Student Guidance): 8, 9, 10, 11, 16
4. Phase 4 (Planning/Collaboration): 12, 13, 14
5. Phase 5 (Rule Governance): 18

## Checkpoint Process (Check -> Alter -> Proceed)
After each feature:
1. Verify functionally with a quick manual scenario.
2. Check that UX remains simple and fast.
3. Adjust copy/logic if complexity increased.
4. Proceed only after done criteria are satisfied.
