import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { type LoanTerms, amortize, balanceAfter, monthlyPayment } from '../src/engine/loan';
import { cents, fromDollars, sum } from '../src/engine/money';

const fixed = (dollars: number, annualRate: number, years: number): LoanTerms => ({
  principal: fromDollars(dollars),
  annualRate,
  termMonths: years * 12,
  interestOnlyMonths: 0,
  rateReset: null,
});

const anyLoan: fc.Arbitrary<LoanTerms> = fc
  .record({
    principal: fc.integer({ min: 1_000_00, max: 5_000_000_00 }).map(cents),
    annualRate: fc.double({ min: 0, max: 0.15, noNaN: true }),
    termMonths: fc.integer({ min: 12, max: 480 }),
    interestOnlyShare: fc.double({ min: 0, max: 1, noNaN: true }),
    reset: fc.option(
      fc.record({
        share: fc.double({ min: 0, max: 1, noNaN: true }),
        annualRate: fc.double({ min: 0, max: 0.15, noNaN: true }),
      }),
    ),
  })
  .map(({ principal, annualRate, termMonths, interestOnlyShare, reset }) => ({
    principal,
    annualRate,
    termMonths,
    interestOnlyMonths: Math.floor(interestOnlyShare * termMonths),
    rateReset: reset && {
      afterMonth: Math.max(1, Math.floor(reset.share * (termMonths - 1))),
      annualRate: reset.annualRate,
    },
  }));

describe('fixed-rate loan', () => {
  const terms = fixed(300_000, 0.06, 30);
  const schedule = amortize(terms);

  it('pays $1,798.65 a month on $300,000 at 6% for 30 years', () => {
    expect(monthlyPayment(terms.principal, 0.06, 360)).toBe(179_865);
    expect(schedule[0]?.payment).toBe(179_865);
  });

  it('splits the first payment into $1,500.00 interest and $298.65 principal', () => {
    expect(schedule[0]).toMatchObject({
      interest: 150_000,
      principal: 29_865,
      balance: 29_970_135,
    });
  });

  it('repays exactly $300,000.00 of principal over 360 payments', () => {
    expect(schedule).toHaveLength(360);
    expect(sum(schedule.map((p) => p.principal))).toBe(30_000_000);
    expect(schedule.at(-1)?.balance).toBe(0);
  });

  it('adjusts only the final payment, and only by a few dollars', () => {
    const payments = schedule.map((p) => p.payment);
    expect(new Set(payments.slice(0, -1))).toEqual(new Set([179_865]));
    expect(Math.abs(payments[359]! - 179_865)).toBeLessThan(500);
  });

  it('divides principal evenly when the rate is zero', () => {
    const interestFree = amortize(fixed(120_000, 0, 10));
    expect(interestFree.every((p) => p.interest === 0 && p.payment === 100_000)).toBe(true);
    expect(interestFree.at(-1)?.balance).toBe(0);
  });

  it('has no payments on an all-cash purchase', () => {
    expect(amortize(fixed(0, 0.06, 30))).toEqual([]);
    expect(balanceAfter([], 12)).toBe(0);
  });
});

describe('interest-only period', () => {
  const schedule = amortize({ ...fixed(300_000, 0.06, 30), interestOnlyMonths: 60 });

  it('pays only interest and leaves the balance untouched', () => {
    const interestOnly = schedule.slice(0, 60);
    expect(interestOnly.every((p) => p.payment === 150_000 && p.principal === 0)).toBe(true);
    expect(schedule[59]?.balance).toBe(30_000_000);
  });

  it('then amortizes the full balance over the remaining 25 years', () => {
    expect(schedule[60]?.payment).toBe(monthlyPayment(cents(30_000_000), 0.06, 300));
    expect(schedule[60]?.payment).toBe(193_290);
    expect(schedule.at(-1)?.balance).toBe(0);
  });

  it('ends in a balloon when the whole term is interest-only', () => {
    const balloon = amortize({ ...fixed(300_000, 0.06, 10), interestOnlyMonths: 120 });
    expect(balloon[118]).toMatchObject({ payment: 150_000, balance: 30_000_000 });
    expect(balloon[119]).toMatchObject({ payment: 30_150_000, principal: 30_000_000, balance: 0 });
  });
});

describe('rate reset', () => {
  const reset = (annualRate: number) =>
    amortize({ ...fixed(300_000, 0.06, 30), rateReset: { afterMonth: 84, annualRate } });

  it('keeps the original payment through the reset month', () => {
    expect(reset(0.08)[83]).toMatchObject({ payment: 179_865, annualRate: 0.06 });
  });

  it('recalculates the payment on the remaining balance and term', () => {
    const schedule = reset(0.08);
    const balance = schedule[83]!.balance;
    expect(schedule[84]).toMatchObject({
      annualRate: 0.08,
      payment: monthlyPayment(balance, 0.08, 276),
      interest: Math.round((balance * 0.08) / 12),
    });
    expect(schedule.at(-1)?.balance).toBe(0);
  });

  it('lowers the payment when the rate resets downward', () => {
    const schedule = reset(0.04);
    expect(schedule[84]!.payment).toBeLessThan(179_865);
    expect(schedule.at(-1)?.balance).toBe(0);
  });

  it('applies a reset that lands inside the interest-only period', () => {
    const schedule = amortize({
      ...fixed(300_000, 0.06, 30),
      interestOnlyMonths: 60,
      rateReset: { afterMonth: 36, annualRate: 0.07 },
    });
    expect(schedule[35]?.payment).toBe(150_000);
    expect(schedule[36]).toMatchObject({ payment: 175_000, principal: 0 });
    expect(schedule[60]?.payment).toBe(monthlyPayment(cents(30_000_000), 0.07, 300));
  });
});

describe('any loan', () => {
  it('repays exactly the amount borrowed', () => {
    fc.assert(
      fc.property(anyLoan, (terms) => {
        expect(sum(amortize(terms).map((p) => p.principal))).toBe(terms.principal);
      }),
    );
  });

  it('never has a negative balance and ends at zero', () => {
    fc.assert(
      fc.property(anyLoan, (terms) => {
        const schedule = amortize(terms);
        expect(schedule.every((p) => p.balance >= 0 && p.principal >= 0)).toBe(true);
        expect(schedule.at(-1)?.balance).toBe(0);
      }),
    );
  });

  it('splits every payment into interest plus principal in whole cents', () => {
    fc.assert(
      fc.property(anyLoan, (terms) => {
        for (const p of amortize(terms)) {
          expect(p.payment).toBe(p.interest + p.principal);
          expect(Number.isInteger(p.interest) && Number.isInteger(p.principal)).toBe(true);
        }
      }),
    );
  });

  it('produces the same schedule every time', () => {
    fc.assert(
      fc.property(anyLoan, (terms) => {
        expect(amortize(terms)).toEqual(amortize(terms));
      }),
    );
  });
});
