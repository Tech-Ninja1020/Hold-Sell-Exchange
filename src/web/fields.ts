import { type Cents, fromDollars } from '../engine/money';
import type { InputKey, Source, SourcedInputs } from '../engine/provenance';
import type { Inputs } from '../engine/types';
import { formatMoney, formatMonth, formatRate, formatYears } from './format';

export type NumericKey = {
  [K in InputKey]: Inputs[K] extends number ? K : never;
}[InputKey];

export type Group = 'property' | 'loan' | 'market' | 'tax' | 'plan' | 'replacement';

export const GROUPS: { id: Group; title: string }[] = [
  { id: 'property', title: 'Property' },
  { id: 'loan', title: 'Loan' },
  { id: 'market', title: 'Market' },
  { id: 'tax', title: 'Tax' },
  { id: 'plan', title: 'Plan' },
  { id: 'replacement', title: 'Replacement property' },
];

// Slider units: whole dollars for money, basis points for rates, years as-is.
export type SliderField = {
  key: NumericKey;
  group: Group;
  kind: 'money' | 'rate' | 'years';
  min: number;
  max: number;
  step: number;
  maxKey?: NumericKey;
};

export type FixedField = { key: InputKey; group: Group; kind: 'toggle' | 'readonly' };

export type Field = SliderField | FixedField;

export const FIELDS: Field[] = [
  {
    key: 'purchasePrice',
    group: 'property',
    kind: 'money',
    min: 100_000,
    max: 2_000_000,
    step: 5_000,
  },
  { key: 'purchaseDate', group: 'property', kind: 'readonly' },
  {
    key: 'landValue',
    group: 'property',
    kind: 'money',
    min: 0,
    max: 2_000_000,
    step: 5_000,
    maxKey: 'purchasePrice',
  },
  { key: 'closingCosts', group: 'property', kind: 'money', min: 0, max: 50_000, step: 100 },
  { key: 'improvements', group: 'property', kind: 'readonly' },

  {
    key: 'loanAmount',
    group: 'loan',
    kind: 'money',
    min: 0,
    max: 2_000_000,
    step: 500,
    maxKey: 'purchasePrice',
  },
  { key: 'loanRate', group: 'loan', kind: 'rate', min: 0, max: 1_200, step: 5 },
  { key: 'loanTermYears', group: 'loan', kind: 'years', min: 5, max: 40, step: 1 },
  { key: 'interestOnlyYears', group: 'loan', kind: 'years', min: 0, max: 10, step: 1 },
  { key: 'rateReset', group: 'loan', kind: 'readonly' },

  { key: 'monthlyRent', group: 'market', kind: 'money', min: 500, max: 15_000, step: 50 },
  { key: 'rentGrowth', group: 'market', kind: 'rate', min: 0, max: 800, step: 10 },
  { key: 'vacancyRate', group: 'market', kind: 'rate', min: 0, max: 2_500, step: 50 },
  { key: 'monthlyOpex', group: 'market', kind: 'money', min: 0, max: 6_000, step: 10 },
  { key: 'opexGrowth', group: 'market', kind: 'rate', min: 0, max: 800, step: 10 },
  { key: 'appreciation', group: 'market', kind: 'rate', min: -200, max: 1_000, step: 10 },
  { key: 'sellingCostRate', group: 'market', kind: 'rate', min: 0, max: 1_000, step: 25 },

  { key: 'ordinaryRate', group: 'tax', kind: 'rate', min: 1_000, max: 3_700, step: 100 },
  { key: 'ltcgRate', group: 'tax', kind: 'rate', min: 0, max: 2_000, step: 100 },
  { key: 'recaptureCap', group: 'tax', kind: 'readonly' },
  { key: 'niit', group: 'tax', kind: 'toggle' },
  { key: 'stateRate', group: 'tax', kind: 'rate', min: 0, max: 1_330, step: 10 },

  { key: 'horizonYears', group: 'plan', kind: 'years', min: 10, max: 30, step: 1 },
  {
    key: 'decisionYear',
    group: 'plan',
    kind: 'years',
    min: 1,
    max: 30,
    step: 1,
    maxKey: 'horizonYears',
  },
  { key: 'reinvestmentRate', group: 'plan', kind: 'rate', min: 0, max: 1_000, step: 25 },

  {
    key: 'replacementPrice',
    group: 'replacement',
    kind: 'money',
    min: 200_000,
    max: 3_000_000,
    step: 10_000,
  },
  {
    key: 'replacementLandShare',
    group: 'replacement',
    kind: 'rate',
    min: 0,
    max: 5_000,
    step: 100,
  },
  {
    key: 'replacementLoanToValue',
    group: 'replacement',
    kind: 'rate',
    min: 0,
    max: 8_000,
    step: 500,
  },
  { key: 'replacementLoanRate', group: 'replacement', kind: 'rate', min: 0, max: 1_200, step: 5 },
  {
    key: 'replacementLoanTermYears',
    group: 'replacement',
    kind: 'years',
    min: 10,
    max: 30,
    step: 1,
  },
  {
    key: 'replacementMonthlyRent',
    group: 'replacement',
    kind: 'money',
    min: 500,
    max: 25_000,
    step: 50,
  },
  {
    key: 'replacementMonthlyOpex',
    group: 'replacement',
    kind: 'money',
    min: 0,
    max: 10_000,
    step: 50,
  },
  {
    key: 'replacementAppreciation',
    group: 'replacement',
    kind: 'rate',
    min: -200,
    max: 1_000,
    step: 10,
  },
];

export const INPUT_LABELS: Record<InputKey, string> = {
  purchasePrice: 'Purchase price',
  purchaseDate: 'Purchase date',
  landValue: 'Land value',
  closingCosts: 'Closing costs',
  improvements: 'Capital improvements',
  monthlyRent: 'Monthly rent',
  rentGrowth: 'Rent growth',
  vacancyRate: 'Vacancy',
  monthlyOpex: 'Monthly expenses',
  opexGrowth: 'Expense growth',
  appreciation: 'Appreciation',
  sellingCostRate: 'Selling costs',
  loanAmount: 'Loan amount',
  loanRate: 'Interest rate',
  loanTermYears: 'Term',
  interestOnlyYears: 'Interest-only period',
  rateReset: 'Rate reset',
  ordinaryRate: 'Ordinary income rate',
  ltcgRate: 'Long-term gains rate',
  recaptureCap: 'Section 1250 cap',
  niit: 'Net investment income tax',
  stateRate: 'State rate',
  reinvestmentRate: 'Reinvestment rate',
  horizonYears: 'Horizon',
  decisionYear: 'Decision year',
  replacementPrice: 'Replacement price',
  replacementLandShare: 'Replacement land share',
  replacementLoanToValue: 'Replacement loan-to-value',
  replacementLoanRate: 'Replacement loan rate',
  replacementLoanTermYears: 'Replacement loan term',
  replacementMonthlyRent: 'Replacement rent',
  replacementMonthlyOpex: 'Replacement expenses',
  replacementAppreciation: 'Replacement appreciation',
};

export const SOURCE_LABELS: Record<Source, string> = {
  tax_return: 'Tax return',
  closing_statement: 'Closing statement',
  lender_statement: 'Lender statement',
  appraisal: 'Appraisal',
  owner_estimate: 'Owner estimate',
  assumed_default: 'Assumed default',
};

const BASIS_POINTS = 10_000;

export const toSlider = (kind: SliderField['kind'], value: number): number => {
  if (kind === 'money') return value / 100;
  if (kind === 'rate') return Math.round(value * BASIS_POINTS);
  return value;
};

export const fromSlider = (kind: SliderField['kind'], position: number): number => {
  if (kind === 'money') return fromDollars(position);
  if (kind === 'rate') return position / BASIS_POINTS;
  return position;
};

const formatNumeric = (kind: SliderField['kind'], value: number): string => {
  if (kind === 'money') return formatMoney(value as Cents);
  if (kind === 'rate') return formatRate(value);
  return formatYears(value);
};

export const formatInput = (key: InputKey, inputs: SourcedInputs): string => {
  switch (key) {
    case 'purchaseDate':
      return formatMonth(inputs.purchaseDate.value);
    case 'improvements': {
      const list = inputs.improvements.value;
      if (list.length === 0) return 'None';
      return list.map((i) => `${formatMoney(i.cost)} in ${i.date.year}`).join(', ');
    }
    case 'rateReset': {
      const reset = inputs.rateReset.value;
      return reset ? `${formatRate(reset.rate)} after year ${reset.afterYear}` : 'None';
    }
    case 'niit':
      return inputs.niit.value ? 'Applies' : 'Does not apply';
    case 'recaptureCap':
      return formatRate(inputs.recaptureCap.value);
    default: {
      const field = FIELDS.find((f) => f.key === key) as SliderField;
      return formatNumeric(field.kind, inputs[field.key].value);
    }
  }
};
