import { describe, expect, it } from 'vitest';
import { fromDollars } from '../src/engine/money';
import { analyze, unwrap } from '../src/engine/provenance';
import { scenarios } from '../src/scenarios';

const [simple, interestOnlyArm, longHold] = scenarios.map((scenario) => ({
  inputs: unwrap(scenario.inputs),
  ...analyze(scenario.inputs),
}));

describe('scenarios', () => {
  it.each(scenarios.map((s) => [s.name, s] as const))(
    '%s mixes confirmed and unconfirmed inputs',
    (_, scenario) => {
      const flags = Object.values(scenario.inputs).map((input) => input.confirmed);
      expect(flags).toContain(true);
      expect(flags).toContain(false);
    },
  );

  it.each(scenarios.map((s) => [s.name, s] as const))(
    '%s flags every strategy as resting on something unconfirmed',
    (_, scenario) => {
      const { unconfirmed } = analyze(scenario.inputs);
      for (const keys of Object.values(unconfirmed)) expect(keys.length).toBeGreaterThan(0);
    },
  );

  it('have unique ids', () => {
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(scenarios.length);
  });
});

describe('simple duplex', () => {
  it('is a $400,000 purchase with 25% down on a 30-year fixed loan at 6.5%', () => {
    expect(simple!.inputs).toMatchObject({
      purchasePrice: fromDollars(400_000),
      landValue: fromDollars(80_000),
      loanAmount: fromDollars(300_000),
      loanRate: 0.065,
      loanTermYears: 30,
      appreciation: 0.03,
      decisionYear: 10,
    });
  });

  it('pays $1,896.20 a month', () => {
    const { interestPaid, principalPaid } = simple!.result.hold.months[0]!;
    expect(interestPaid + principalPaid).toBe(fromDollars(1_896.2));
  });

  it('exchanges into the fourplex without boot', () => {
    expect(simple!.result.exchangeEvent).toMatchObject({ boot: 0, totalTax: 0 });
  });
});

describe('interest-only ARM', () => {
  const months = interestOnlyArm!.result.hold.months;
  const debtService = (i: number) => months[i]!.interestPaid + months[i]!.principalPaid;

  it('pays no principal for five years', () => {
    expect(months.slice(0, 60).every((m) => m.principalPaid === 0)).toBe(true);
    expect(months[59]!.loanBalance).toBe(fromDollars(487_500));
    expect(months[60]!.principalPaid).toBeGreaterThan(0);
  });

  it('steps the payment up when amortization starts and again at the reset', () => {
    expect(debtService(60)).toBeGreaterThan(debtService(59));
    expect(debtService(84)).toBeGreaterThan(debtService(83));
    expect(months[84]!.interestPaid).toBe(Math.round((months[83]!.loanBalance * 0.075) / 12));
  });
});

describe('long hold', () => {
  const { result, inputs } = longHold!;
  const atDecision = result.hold.months[result.decisionMonth - 1]!;

  it('has been owned 25 years at the decision', () => {
    expect(inputs.decisionYear).toBe(25);
    expect(atDecision.date).toEqual({ year: 2026, month: 5 });
  });

  it('has depreciated most of the original building', () => {
    const building = fromDollars(160_000 + 4_200 * (160 / 210));
    expect(atDecision.accumulatedDepreciation).toBeGreaterThan(building * 0.85);
  });

  it('would recapture all of that depreciation on a sale', () => {
    const { sale } = atDecision.liquidation!;
    expect(sale.unrecaptured1250Gain).toBe(sale.depreciationTaken);
    expect(sale.gain).toBeGreaterThan(sale.adjustedBasis * 4);
  });

  it('comes out best by holding to a step-up in basis', () => {
    const { hold, holdStepUp, sell, exchange } = result;
    expect(holdStepUp.finalValue).toBeGreaterThan(
      Math.max(hold.finalValue, sell.finalValue, exchange.finalValue),
    );
  });
});
