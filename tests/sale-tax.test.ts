import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { cents, fromDollars } from '../src/engine/money';
import { type Sale, steppedUpSale, taxableSale } from '../src/engine/tax';
import { rates } from './fixtures';

const sale: Sale = {
  salePrice: fromDollars(600_000),
  sellingCostRate: 0.06,
  adjustedBasis: fromDollars(300_000),
  depreciationTaken: fromDollars(100_000),
  loanBalance: fromDollars(200_000),
  monthsHeld: 120,
};

const anySale: fc.Arbitrary<Sale> = fc.record({
  salePrice: fc.integer({ min: 1, max: 5_000_000_00 }).map(cents),
  sellingCostRate: fc.double({ min: 0, max: 0.1, noNaN: true }),
  adjustedBasis: fc.integer({ min: 0, max: 5_000_000_00 }).map(cents),
  depreciationTaken: fc.integer({ min: 0, max: 2_000_000_00 }).map(cents),
  loanBalance: fc.integer({ min: 0, max: 4_000_000_00 }).map(cents),
  monthsHeld: fc.integer({ min: 1, max: 480 }),
});

describe('taxable sale', () => {
  it('works through a $600,000 sale with $100,000 of depreciation by hand', () => {
    expect(taxableSale(sale, rates)).toEqual({
      salePrice: fromDollars(600_000),
      sellingCosts: fromDollars(36_000),
      amountRealized: fromDollars(564_000),
      adjustedBasis: fromDollars(300_000),
      depreciationTaken: fromDollars(100_000),
      gain: fromDollars(264_000),
      unrecaptured1250Gain: fromDollars(100_000),
      capitalGain: fromDollars(164_000),
      recaptureTax: fromDollars(25_000),
      capitalGainsTax: fromDollars(24_600),
      niit: fromDollars(10_032),
      stateTax: fromDollars(13_200),
      totalTax: fromDollars(72_832),
      loanPayoff: fromDollars(200_000),
      netCash: fromDollars(291_168),
    });
  });

  it('taxes recapture at the ordinary rate when that is below the 25% cap', () => {
    const breakdown = taxableSale(sale, { ...rates, ordinaryRate: 0.12 });
    expect(breakdown.recaptureTax).toBe(fromDollars(12_000));
  });

  it('skips the net investment income tax when it is turned off', () => {
    const breakdown = taxableSale(sale, { ...rates, niit: false });
    expect(breakdown.niit).toBe(0);
    expect(breakdown.totalTax).toBe(fromDollars(62_800));
  });

  it('treats the whole gain as recapture when depreciation exceeds it', () => {
    const breakdown = taxableSale({ ...sale, adjustedBasis: fromDollars(500_000) }, rates);
    expect(breakdown).toMatchObject({
      gain: fromDollars(64_000),
      unrecaptured1250Gain: fromDollars(64_000),
      capitalGain: 0,
      capitalGainsTax: 0,
    });
  });

  it('owes no tax on a sale at a loss', () => {
    const breakdown = taxableSale({ ...sale, salePrice: fromDollars(300_000) }, rates);
    expect(breakdown).toMatchObject({
      gain: fromDollars(-18_000),
      unrecaptured1250Gain: 0,
      totalTax: 0,
      netCash: fromDollars(82_000),
    });
  });

  it('can leave the seller owing money when the loan exceeds the proceeds', () => {
    const breakdown = taxableSale({ ...sale, loanBalance: fromDollars(560_000) }, rates);
    expect(breakdown.netCash).toBe(fromDollars(-68_832));
  });

  it('taxes the whole gain at the ordinary rate when held a year or less', () => {
    const breakdown = taxableSale({ ...sale, monthsHeld: 12 }, rates);
    expect(breakdown.recaptureTax).toBe(fromDollars(32_000));
    expect(breakdown.capitalGainsTax).toBe(fromDollars(52_480));
  });

  it('uses long-term rates from the thirteenth month', () => {
    expect(taxableSale({ ...sale, monthsHeld: 13 }, rates)).toEqual(taxableSale(sale, rates));
  });
});

describe('sale after a step-up in basis', () => {
  it('owes no tax and keeps the proceeds after selling costs and the loan', () => {
    expect(steppedUpSale(sale, rates)).toMatchObject({
      adjustedBasis: fromDollars(600_000),
      totalTax: 0,
      netCash: fromDollars(364_000),
    });
  });
});

describe('any sale', () => {
  it('never recaptures more than the depreciation taken or the gain', () => {
    fc.assert(
      fc.property(anySale, (s) => {
        const { unrecaptured1250Gain, gain } = taxableSale(s, rates);
        expect(unrecaptured1250Gain).toBeLessThanOrEqual(
          Math.min(s.depreciationTaken, Math.max(gain, 0)),
        );
        expect(unrecaptured1250Gain).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  it('splits a gain into recapture plus capital gain with nothing left over', () => {
    fc.assert(
      fc.property(anySale, (s) => {
        const b = taxableSale(s, rates);
        expect(b.unrecaptured1250Gain + b.capitalGain).toBe(Math.max(b.gain, 0));
      }),
    );
  });

  it('reconciles sale price to net cash through every deduction', () => {
    fc.assert(
      fc.property(anySale, (s) => {
        const b = taxableSale(s, rates);
        const deductions =
          b.sellingCosts + b.loanPayoff + b.recaptureTax + b.capitalGainsTax + b.niit + b.stateTax;
        expect(b.salePrice - deductions).toBe(b.netCash);
      }),
    );
  });

  it('never nets less with a step-up than with a taxable sale', () => {
    fc.assert(
      fc.property(anySale, (s) => {
        expect(steppedUpSale(s, rates).netCash).toBeGreaterThanOrEqual(
          taxableSale(s, rates).netCash,
        );
      }),
    );
  });
});
