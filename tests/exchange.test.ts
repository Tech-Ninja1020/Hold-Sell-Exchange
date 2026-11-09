import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { cents, fromDollars } from '../src/engine/money';
import { type Exchange, exchangeProperty } from '../src/engine/strategies/exchange';
import { rates } from './fixtures';

const relinquished = {
  amountRealized: fromDollars(564_000),
  adjustedBasis: fromDollars(300_000),
  depreciationTaken: fromDollars(100_000),
  loanPayoff: fromDollars(200_000),
  monthsHeld: 120,
};

const into = (price: number, loan: number): Exchange => ({
  ...relinquished,
  replacementPrice: fromDollars(price),
  replacementLoan: fromDollars(loan),
});

describe('exchange with no boot', () => {
  const terms = exchangeProperty(into(800_000, 400_000), rates);

  it('owes no tax and defers the whole gain', () => {
    expect(terms).toMatchObject({
      realizedGain: fromDollars(264_000),
      boot: 0,
      recognizedGain: 0,
      totalTax: 0,
      deferredGain: fromDollars(264_000),
    });
  });

  it('reduces the replacement basis by the deferred gain', () => {
    expect(terms.replacementBasis).toBe(fromDollars(536_000));
  });

  it('carries the full depreciation history forward', () => {
    expect(terms.carriedDepreciation).toBe(fromDollars(100_000));
  });

  it('adds cash when equity falls short of the down payment', () => {
    expect(terms.cashAdded).toBe(fromDollars(36_000));
  });
});

describe('boot', () => {
  it('arises when cash is taken out, and is taxed as recapture first', () => {
    const terms = exchangeProperty(into(800_000, 500_000), rates);
    expect(terms).toMatchObject({
      cashBoot: fromDollars(64_000),
      mortgageBoot: 0,
      recognizedGain: fromDollars(64_000),
      unrecaptured1250Gain: fromDollars(64_000),
      capitalGain: 0,
      recaptureTax: fromDollars(16_000),
      stateTax: fromDollars(3_200),
      niit: fromDollars(2_432),
      deferredGain: fromDollars(200_000),
      replacementBasis: fromDollars(600_000),
      carriedDepreciation: fromDollars(36_000),
    });
  });

  it('arises when debt is paid down and not replaced', () => {
    const terms = exchangeProperty(into(500_000, 136_000), rates);
    expect(terms).toMatchObject({
      cashBoot: 0,
      mortgageBoot: fromDollars(64_000),
      recognizedGain: fromDollars(64_000),
    });
  });

  it('is avoided when cash paid in replaces the debt relief', () => {
    const terms = exchangeProperty(into(564_000, 100_000), rates);
    expect(terms).toMatchObject({ cashAdded: fromDollars(100_000), boot: 0, totalTax: 0 });
  });

  it('equals the trade-down amount when buying a cheaper property', () => {
    const terms = exchangeProperty(into(400_000, 0), rates);
    expect(terms.boot).toBe(fromDollars(164_000));
    expect(terms.capitalGain).toBe(fromDollars(64_000));
  });

  it('recognizes no more than the realized gain', () => {
    const terms = exchangeProperty(into(200_000, 0), rates);
    expect(terms.boot).toBe(fromDollars(364_000));
    expect(terms.recognizedGain).toBe(fromDollars(264_000));
    expect(terms.deferredGain).toBe(0);
    expect(terms.replacementBasis).toBe(fromDollars(200_000));
  });

  it('recognizes nothing on a loss and carries the loss into the new basis', () => {
    const terms = exchangeProperty(
      { ...into(400_000, 0), adjustedBasis: fromDollars(600_000) },
      rates,
    );
    expect(terms).toMatchObject({
      realizedGain: fromDollars(-36_000),
      recognizedGain: 0,
      totalTax: 0,
      replacementBasis: fromDollars(436_000),
    });
  });
});

describe('any exchange', () => {
  const amount = (max: number) => fc.integer({ min: 0, max }).map(cents);
  const anyRelinquished = fc.record({
    amountRealized: fc.integer({ min: 100_000_00, max: 3_000_000_00 }).map(cents),
    adjustedBasis: amount(3_000_000_00),
    depreciationTaken: amount(1_000_000_00),
    loanShare: fc.double({ min: 0, max: 1, noNaN: true }),
    monthsHeld: fc.integer({ min: 13, max: 480 }),
  });

  it('owes nothing when trading up and reinvesting all the equity', () => {
    fc.assert(
      fc.property(
        anyRelinquished,
        amount(2_000_000_00),
        fc.double({ min: 0, max: 1, noNaN: true }),
        ({ loanShare, ...old }, tradeUp, newLoanShare) => {
          const loanPayoff = cents(Math.floor(old.amountRealized * loanShare));
          const replacementPrice = cents(old.amountRealized + tradeUp);
          const replacementLoan = cents(Math.floor((loanPayoff + tradeUp) * newLoanShare));
          const terms = exchangeProperty(
            { ...old, loanPayoff, replacementPrice, replacementLoan },
            rates,
          );
          expect(terms.boot).toBe(0);
          expect(terms.totalTax).toBe(0);
          expect(terms.deferredGain).toBe(terms.realizedGain);
          expect(terms.carriedDepreciation).toBe(old.depreciationTaken);
        },
      ),
    );
  });

  it('keeps basis consistent: old basis, plus the trade-up, plus gain recognized', () => {
    fc.assert(
      fc.property(
        anyRelinquished,
        amount(4_000_000_00),
        amount(4_000_000_00),
        ({ loanShare, ...old }, replacementPrice, replacementLoan) => {
          const loanPayoff = cents(Math.floor(old.amountRealized * loanShare));
          const terms = exchangeProperty(
            { ...old, loanPayoff, replacementPrice, replacementLoan },
            rates,
          );
          expect(terms.replacementBasis).toBe(
            old.adjustedBasis + (replacementPrice - old.amountRealized) + terms.recognizedGain,
          );
          expect(terms.recognizedGain).toBeLessThanOrEqual(terms.boot);
          expect(terms.recognizedGain).toBeLessThanOrEqual(Math.max(terms.realizedGain, 0));
        },
      ),
    );
  });
});
