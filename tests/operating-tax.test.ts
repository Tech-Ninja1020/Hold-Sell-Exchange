import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { cents, fromDollars } from '../src/engine/money';
import { type TaxRates, settleRentalIncome } from '../src/engine/tax';

const rates: TaxRates = {
  ordinaryRate: 0.32,
  ltcgRate: 0.15,
  recaptureCap: 0.25,
  niit: false,
  stateRate: 0.05,
};

const none = cents(0);

describe('rental income', () => {
  it('is taxed at the ordinary plus state rate when positive', () => {
    expect(settleRentalIncome(fromDollars(10_000), none, rates)).toEqual({
      tax: fromDollars(3_700),
      suspendedLoss: 0,
    });
  });

  it('owes nothing on a loss and suspends it', () => {
    expect(settleRentalIncome(fromDollars(-4_000), none, rates)).toEqual({
      tax: 0,
      suspendedLoss: fromDollars(4_000),
    });
  });

  it('adds a new loss to losses already suspended', () => {
    const settled = settleRentalIncome(fromDollars(-4_000), fromDollars(6_000), rates);
    expect(settled.suspendedLoss).toBe(fromDollars(10_000));
  });

  it('uses suspended losses against later income before taxing the rest', () => {
    expect(settleRentalIncome(fromDollars(10_000), fromDollars(4_000), rates)).toEqual({
      tax: fromDollars(2_220),
      suspendedLoss: 0,
    });
  });

  it('keeps the unused part of a suspended loss larger than the income', () => {
    expect(settleRentalIncome(fromDollars(3_000), fromDollars(10_000), rates)).toEqual({
      tax: 0,
      suspendedLoss: fromDollars(7_000),
    });
  });

  it('never taxes more than the income and never drives the suspended loss negative', () => {
    const amount = fc.integer({ min: -1e9, max: 1e9 }).map(cents);
    const loss = fc.integer({ min: 0, max: 1e9 }).map(cents);
    fc.assert(
      fc.property(amount, loss, (income, suspended) => {
        const settled = settleRentalIncome(income, suspended, rates);
        expect(settled.tax).toBeGreaterThanOrEqual(0);
        expect(settled.tax).toBeLessThanOrEqual(Math.max(income, 0));
        expect(settled.suspendedLoss).toBeGreaterThanOrEqual(0);
      }),
    );
  });
});
