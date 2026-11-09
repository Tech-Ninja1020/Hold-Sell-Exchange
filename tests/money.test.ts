import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  add,
  cents,
  fromDollars,
  maxCents,
  minCents,
  neg,
  roundCents,
  scale,
  sub,
  sum,
} from '../src/engine/money';

const anyCents = fc.integer({ min: -1e11, max: 1e11 }).map(cents);

describe('rounding', () => {
  it('rounds a half cent away from zero in both directions', () => {
    expect(roundCents(0.5)).toBe(1);
    expect(roundCents(-0.5)).toBe(-1);
    expect(roundCents(2.5)).toBe(3);
    expect(roundCents(-2.5)).toBe(-3);
  });

  it('rounds below a half toward zero', () => {
    expect(roundCents(1.49)).toBe(1);
    expect(roundCents(-1.49)).toBe(-1);
  });

  it('never returns negative zero', () => {
    expect(Object.is(roundCents(-0.2), -0)).toBe(false);
    expect(Object.is(roundCents(-0), -0)).toBe(false);
  });

  it('is symmetric around zero', () => {
    fc.assert(
      fc.property(fc.double({ min: -1e9, max: 1e9, noNaN: true }), (x) => {
        expect(roundCents(-x)).toBe(neg(roundCents(x)));
      }),
    );
  });

  it('always returns an integer within half a cent of the input', () => {
    fc.assert(
      fc.property(fc.double({ min: -1e9, max: 1e9, noNaN: true }), (x) => {
        const rounded = roundCents(x);
        expect(Number.isInteger(rounded)).toBe(true);
        expect(Math.abs(rounded - x)).toBeLessThanOrEqual(0.5);
      }),
    );
  });
});

describe('construction', () => {
  it('converts dollars to cents without float drift', () => {
    expect(fromDollars(0.29)).toBe(29);
    expect(fromDollars(1798.65)).toBe(179865);
    expect(fromDollars(300_000)).toBe(30_000_000);
    expect(fromDollars(-19.99)).toBe(-1999);
  });

  it('round-trips every two-decimal dollar amount', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1e10, max: 1e10 }), (n) => {
        expect(fromDollars(n / 100)).toBe(n);
      }),
    );
  });

  it('rejects fractional cents', () => {
    expect(() => cents(1.5)).toThrow(RangeError);
  });
});

describe('arithmetic', () => {
  it('adds and subtracts exactly', () => {
    expect(add(cents(10), cents(20))).toBe(30);
    expect(sub(cents(10), cents(20))).toBe(-10);
  });

  it('sums a list and treats an empty list as zero', () => {
    expect(sum([cents(1), cents(2), cents(3)])).toBe(6);
    expect(sum([])).toBe(0);
  });

  it('picks the smaller and larger amount', () => {
    expect(minCents(cents(5), cents(-5))).toBe(-5);
    expect(maxCents(cents(5), cents(-5))).toBe(5);
  });

  it('scales by a rate and rounds to whole cents', () => {
    expect(scale(cents(30_000_000), 0.06 / 12)).toBe(150_000);
    expect(scale(cents(333), 0.5)).toBe(167);
    expect(scale(cents(-333), 0.5)).toBe(-167);
  });

  it('subtraction undoes addition', () => {
    fc.assert(
      fc.property(anyCents, anyCents, (a, b) => {
        expect(sub(add(a, b), b)).toBe(a);
      }),
    );
  });

  it('scaling always yields whole cents', () => {
    fc.assert(
      fc.property(anyCents, fc.double({ min: -2, max: 2, noNaN: true }), (a, factor) => {
        expect(Number.isInteger(scale(a, factor))).toBe(true);
      }),
    );
  });
});
