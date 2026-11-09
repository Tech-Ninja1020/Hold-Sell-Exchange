import { simulate } from './simulate';
import type { Inputs, SimulationResult, StrategyKey } from './types';

export type Source =
  | 'tax_return'
  | 'closing_statement'
  | 'lender_statement'
  | 'appraisal'
  | 'owner_estimate'
  | 'assumed_default';

export type Sourced<T> = {
  value: T;
  source: Source;
  confirmed: boolean;
  note?: string;
};

export type InputKey = keyof Inputs;

export type SourcedInputs = { [K in InputKey]: Sourced<Inputs[K]> };

export type OutputKey =
  | 'propertyValue'
  | 'loanBalance'
  | 'depreciation'
  | 'cashFlow'
  | 'operatingTax'
  | 'recaptureTax'
  | 'capitalGainsTax'
  | StrategyKey;

const union = (...groups: readonly InputKey[][]): InputKey[] => [...new Set(groups.flat())];

const value: InputKey[] = ['purchasePrice', 'appreciation', 'horizonYears'];
const loan: InputKey[] = [
  'loanAmount',
  'loanRate',
  'loanTermYears',
  'interestOnlyYears',
  'rateReset',
  'horizonYears',
];
const depreciation: InputKey[] = [
  'purchasePrice',
  'purchaseDate',
  'landValue',
  'closingCosts',
  'improvements',
  'horizonYears',
];
const cashFlow = union(loan, depreciation, [
  'monthlyRent',
  'rentGrowth',
  'vacancyRate',
  'monthlyOpex',
  'opexGrowth',
  'ordinaryRate',
  'stateRate',
]);
const gain = union(value, depreciation, ['sellingCostRate']);
const stepUp = union(cashFlow, gain, ['reinvestmentRate']);
const hold = union(stepUp, ['ltcgRate', 'recaptureCap', 'niit']);
const sell = union(hold, ['decisionYear']);
const exchange = union(sell, [
  'replacementPrice',
  'replacementLandShare',
  'replacementLoanToValue',
  'replacementLoanRate',
  'replacementLoanTermYears',
  'replacementMonthlyRent',
  'replacementMonthlyOpex',
  'replacementAppreciation',
]);

/** Which inputs each output is computed from. Sub-outputs describe the original property. */
export const DEPENDENCIES: Record<OutputKey, readonly InputKey[]> = {
  propertyValue: value,
  loanBalance: loan,
  depreciation,
  cashFlow,
  operatingTax: cashFlow,
  recaptureTax: union(gain, ['ordinaryRate', 'recaptureCap']),
  capitalGainsTax: union(gain, ['ordinaryRate', 'ltcgRate']),
  holdStepUp: stepUp,
  hold,
  sell,
  exchange,
};

export const unwrap = (inputs: SourcedInputs): Inputs =>
  Object.fromEntries(
    Object.entries(inputs).map(([key, sourced]) => [key, sourced.value]),
  ) as Inputs;

export const unconfirmedInputs = (output: OutputKey, inputs: SourcedInputs): InputKey[] =>
  DEPENDENCIES[output].filter((key) => !inputs[key].confirmed);

export const confirm = (inputs: SourcedInputs, key: InputKey): SourcedInputs => ({
  ...inputs,
  [key]: { ...inputs[key], confirmed: true },
});

/** An edited value is no longer what its source said, so it goes back to unconfirmed. */
export const revise = <K extends InputKey>(
  inputs: SourcedInputs,
  key: K,
  value: Inputs[K],
): SourcedInputs => ({
  ...inputs,
  [key]: { value, source: 'owner_estimate', confirmed: false },
});

export type Analysis = {
  result: SimulationResult;
  unconfirmed: Record<StrategyKey, InputKey[]>;
};

export const analyze = (inputs: SourcedInputs): Analysis => ({
  result: simulate(unwrap(inputs)),
  unconfirmed: {
    hold: unconfirmedInputs('hold', inputs),
    holdStepUp: unconfirmedInputs('holdStepUp', inputs),
    sell: unconfirmedInputs('sell', inputs),
    exchange: unconfirmedInputs('exchange', inputs),
  },
});
