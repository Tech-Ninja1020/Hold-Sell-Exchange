import { describe, expect, it } from 'vitest';
import { fromDollars } from '../src/engine/money';
import {
  DEPENDENCIES,
  type InputKey,
  type OutputKey,
  type SourcedInputs,
  analyze,
  confirm,
  unconfirmedInputs,
  unwrap,
} from '../src/engine/provenance';
import { simulate } from '../src/engine/simulate';
import type { Inputs, MonthSnapshot, SimulationResult } from '../src/engine/types';
import { duplex } from './fixtures';

// A roof in year four and a rate reset, so every input has something to act on.
const base: Inputs = {
  ...duplex,
  improvements: [{ date: { year: 2023, month: 6 }, cost: fromDollars(33_000) }],
  rateReset: { afterYear: 7, rate: 0.07 },
  ordinaryRate: 0.22,
};

const changed: { [K in InputKey]: Inputs[K] } = {
  purchasePrice: fromDollars(420_000),
  purchaseDate: { year: 2020, month: 5 },
  landValue: fromDollars(100_000),
  closingCosts: fromDollars(12_000),
  improvements: [],
  monthlyRent: fromDollars(3_600),
  rentGrowth: 0.04,
  vacancyRate: 0.08,
  monthlyOpex: fromDollars(1_200),
  opexGrowth: 0.04,
  appreciation: 0.05,
  sellingCostRate: 0.07,
  loanAmount: fromDollars(280_000),
  loanRate: 0.07,
  loanTermYears: 25,
  interestOnlyYears: 3,
  rateReset: null,
  ordinaryRate: 0.24,
  ltcgRate: 0.2,
  recaptureCap: 0.2,
  niit: false,
  stateRate: 0.08,
  reinvestmentRate: 0.06,
  horizonYears: 25,
  decisionYear: 12,
  replacementPrice: fromDollars(900_000),
  replacementLandShare: 0.3,
  replacementLoanToValue: 0.5,
  replacementLoanRate: 0.07,
  replacementLoanTermYears: 20,
  replacementMonthlyRent: fromDollars(6_500),
  replacementMonthlyOpex: fromDollars(2_000),
  replacementAppreciation: 0.04,
};

const held = (pick: (month: MonthSnapshot) => unknown) => (result: SimulationResult) =>
  result.hold.months.map(pick);

const outputs: Record<OutputKey, (result: SimulationResult) => unknown> = {
  propertyValue: held((m) => m.propertyValue),
  loanBalance: held((m) => m.loanBalance),
  depreciation: held((m) => m.depreciation),
  cashFlow: held((m) => m.cashFlow),
  operatingTax: held((m) => m.operatingTax),
  recaptureTax: held((m) => m.liquidation!.sale.recaptureTax),
  capitalGainsTax: held((m) => m.liquidation!.sale.capitalGainsTax),
  hold: (r) => r.hold,
  holdStepUp: (r) => r.holdStepUp,
  sell: (r) => r.sell,
  exchange: (r) => r.exchange,
};

// Listed conservatively: these matter only when the gain is below depreciation taken, or
// when there is a gain in the first year.
const dormant: Partial<Record<OutputKey, InputKey[]>> = {
  capitalGainsTax: ['landValue', 'ordinaryRate'],
};

const inputKeys = Object.keys(changed) as InputKey[];
const outputKeys = Object.keys(outputs) as OutputKey[];
const baseline = simulate(base);
const rerunWith = (key: InputKey) => simulate({ ...base, [key]: changed[key] });

const sourced = (inputs: Inputs, unconfirmedKeys: InputKey[]): SourcedInputs =>
  Object.fromEntries(
    Object.entries(inputs).map(([key, value]) => [
      key,
      {
        value,
        source: 'owner_estimate',
        confirmed: !unconfirmedKeys.includes(key as InputKey),
      },
    ]),
  ) as SourcedInputs;

describe('dependency map', () => {
  it.each(outputKeys)('%s changes with none of the inputs it does not list', (output) => {
    const unlisted = inputKeys.filter((key) => !DEPENDENCIES[output].includes(key));
    for (const key of unlisted) {
      expect(outputs[output](rerunWith(key)), key).toEqual(outputs[output](baseline));
    }
  });

  it.each(outputKeys)('%s changes with every input it lists', (output) => {
    const active = DEPENDENCIES[output].filter((key) => !dormant[output]?.includes(key));
    for (const key of active) {
      expect(outputs[output](rerunWith(key)), key).not.toEqual(outputs[output](baseline));
    }
  });

  it('leaves the step-up outcome independent of capital gains rates', () => {
    expect(DEPENDENCIES.holdStepUp).not.toContain('ltcgRate');
    expect(DEPENDENCIES.holdStepUp).not.toContain('recaptureCap');
    expect(DEPENDENCIES.holdStepUp).not.toContain('niit');
  });

  it('ties only the exchange to the replacement property', () => {
    const replacementKeys = inputKeys.filter((key) => key.startsWith('replacement'));
    expect(DEPENDENCIES.exchange).toEqual(expect.arrayContaining(replacementKeys));
    for (const output of outputKeys.filter((key) => key !== 'exchange')) {
      expect(DEPENDENCIES[output].filter((key) => replacementKeys.includes(key))).toEqual([]);
    }
  });
});

describe('unconfirmed inputs', () => {
  const inputs = sourced(base, ['landValue', 'ltcgRate', 'replacementPrice', 'decisionYear']);

  it('unwraps to the plain inputs the engine runs on', () => {
    expect(unwrap(inputs)).toEqual(base);
    expect(analyze(inputs).result).toEqual(baseline);
  });

  it('are listed per strategy, only where that strategy depends on them', () => {
    expect(analyze(inputs).unconfirmed).toEqual({
      holdStepUp: ['landValue'],
      hold: ['landValue', 'ltcgRate'],
      sell: ['landValue', 'ltcgRate', 'decisionYear'],
      exchange: ['landValue', 'ltcgRate', 'decisionYear', 'replacementPrice'],
    });
  });

  it('are listed for a single output', () => {
    expect(unconfirmedInputs('depreciation', inputs)).toEqual(['landValue']);
    expect(unconfirmedInputs('loanBalance', inputs)).toEqual([]);
  });

  it('drop off the list once confirmed, without changing any number', () => {
    const after = confirm(inputs, 'landValue');
    expect(analyze(after).unconfirmed.holdStepUp).toEqual([]);
    expect(analyze(after).result).toEqual(baseline);
    expect(inputs.landValue.confirmed).toBe(false);
  });

  it('are empty when everything is confirmed', () => {
    const { unconfirmed } = analyze(sourced(base, []));
    expect(Object.values(unconfirmed).flat()).toEqual([]);
  });
});
