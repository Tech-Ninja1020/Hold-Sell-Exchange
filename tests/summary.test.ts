import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { fromDollars } from '../src/engine/money';
import { simulate } from '../src/engine/simulate';
import { rankAt, saleWaterfall } from '../src/engine/summary';
import { taxableSale } from '../src/engine/tax';
import { duplex, rates } from './fixtures';

const result = simulate(duplex);

describe('ranking', () => {
  it('orders strategies by after-tax value and names the best', () => {
    const { ranked, best } = rankAt(result, 240);
    expect(ranked.map((r) => r.strategy)).toEqual(['holdStepUp', 'hold', 'exchange', 'sell']);
    expect(best).toBe('holdStepUp');
  });

  it('reports the gap between first and second place', () => {
    const { ranked, lead } = rankAt(result, 240);
    expect(lead).toBe(ranked[0]!.value - ranked[1]!.value);
    expect(lead).toBe(result.holdStepUp.finalValue - result.hold.finalValue);
  });

  it('always lists values in descending order', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 240 }), (month) => {
        const values = rankAt(result, month).ranked.map((r) => r.value);
        expect(values).toEqual([...values].sort((a, b) => b - a));
      }),
    );
  });
});

describe('sale waterfall', () => {
  const sale = taxableSale(
    {
      salePrice: fromDollars(600_000),
      sellingCostRate: 0.06,
      adjustedBasis: fromDollars(300_000),
      depreciationTaken: fromDollars(100_000),
      loanBalance: fromDollars(200_000),
      monthsHeld: 120,
    },
    rates,
  );
  const steps = saleWaterfall(sale);

  it('starts at the sale price and ends at net cash', () => {
    expect(steps[0]).toEqual({
      key: 'salePrice',
      amount: fromDollars(600_000),
      from: 0,
      to: fromDollars(600_000),
    });
    expect(steps.at(-1)).toEqual({
      key: 'netCash',
      amount: sale.netCash,
      from: 0,
      to: sale.netCash,
    });
  });

  it('steps down through each deduction in order', () => {
    expect(steps.slice(1, -1).map((s) => [s.key, s.to])).toEqual([
      ['sellingCosts', fromDollars(564_000)],
      ['loanPayoff', fromDollars(364_000)],
      ['recaptureTax', fromDollars(339_000)],
      ['capitalGainsTax', fromDollars(314_400)],
      ['niit', fromDollars(304_368)],
      ['stateTax', fromDollars(291_168)],
    ]);
  });

  it('chains every step to the one before it', () => {
    const deductions = steps.slice(1, -1);
    deductions.forEach((step, i) => {
      expect(step.from).toBe(i === 0 ? sale.salePrice : deductions[i - 1]!.to);
      expect(step.from - step.amount).toBe(step.to);
    });
    expect(deductions.at(-1)!.to).toBe(sale.netCash);
  });
});
