import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { withInterest } from '../src/engine/holding';
import { fromDollars, sub } from '../src/engine/money';
import { simulate } from '../src/engine/simulate';
import type { Inputs, SimulationResult, StrategyKey } from '../src/engine/types';
import { duplex } from './fixtures';

const strategies: StrategyKey[] = ['hold', 'holdStepUp', 'sell', 'exchange'];

const anyInputs: fc.Arbitrary<Inputs> = fc
  .record({
    appreciation: fc.double({ min: -0.05, max: 0.1, noNaN: true }),
    rentGrowth: fc.double({ min: 0, max: 0.06, noNaN: true }),
    vacancyRate: fc.double({ min: 0, max: 0.3, noNaN: true }),
    loanRate: fc.double({ min: 0, max: 0.12, noNaN: true }),
    loanShare: fc.double({ min: 0, max: 0.95, noNaN: true }),
    interestOnlyYears: fc.integer({ min: 0, max: 10 }),
    reinvestmentRate: fc.double({ min: 0, max: 0.1, noNaN: true }),
    horizonYears: fc.integer({ min: 10, max: 30 }),
    decisionYear: fc.integer({ min: 1, max: 30 }),
    purchaseMonth: fc.integer({ min: 1, max: 12 }),
    replacementPrice: fc.integer({ min: 200_000, max: 2_000_000 }).map(fromDollars),
    replacementLoanToValue: fc.double({ min: 0, max: 0.9, noNaN: true }),
    niit: fc.boolean(),
  })
  .map(({ loanShare, purchaseMonth, ...overrides }) => ({
    ...duplex,
    ...overrides,
    loanAmount: fromDollars(Math.round(400_000 * loanShare)),
    purchaseDate: { year: 2020, month: purchaseMonth },
  }));

const everyNumber = (value: unknown): number[] => {
  if (typeof value === 'number') return [value];
  if (value === null || typeof value !== 'object') return [];
  return Object.values(value).flatMap(everyNumber);
};

const taxableIncome = (result: SimulationResult, [from, to]: [number, number]) =>
  result.hold.months
    .slice(from - 1, to)
    .reduce(
      (total, m) => total + m.rentCollected - m.operatingExpenses - m.interestPaid - m.depreciation,
      0,
    );

describe('the simple duplex', () => {
  const result = simulate(duplex);
  const first = result.hold.months[0]!;

  it('collects rent net of vacancy and pays expenses and the loan in month one', () => {
    expect(first).toMatchObject({
      rentCollected: fromDollars(3_230),
      operatingExpenses: fromDollars(1_000),
      interestPaid: fromDollars(1_625),
      principalPaid: fromDollars(271.2),
      cashFlow: fromDollars(333.8),
    });
  });

  it('depreciates the building plus its share of closing costs, not the land', () => {
    // building 320,000 + 80% of 8,000 closing = 326,400; half a month of 330
    expect(first.depreciation).toBe(fromDollars(494.55));
    expect(first.adjustedBasis).toBe(fromDollars(408_000 - 494.55));
  });

  it('raises rent and expenses once a year', () => {
    expect(result.hold.months[11]!.rentCollected).toBe(fromDollars(3_230));
    expect(result.hold.months[12]!.rentCollected).toBe(fromDollars(3_326.9));
    expect(result.hold.months[12]!.operatingExpenses).toBe(fromDollars(1_030));
  });

  it('settles operating tax only in December', () => {
    for (const m of result.hold.months) {
      if (m.date.month !== 12) expect(m.operatingTax).toBe(0);
    }
  });

  it('suspends the first-year loss instead of taxing it', () => {
    const december = result.hold.months[11]!;
    const loss = taxableIncome(result, [1, 12]);
    expect(loss).toBeLessThan(0);
    expect(december.operatingTax).toBe(0);
    expect(december.suspendedLoss).toBe(-loss);
  });

  it('uses up suspended losses before paying tax on later income', () => {
    const firstTaxed = result.hold.months.find((m) => m.operatingTax > 0)!;
    const yearBefore = result.hold.months[firstTaxed.month - 13]!;
    const income = taxableIncome(result, [firstTaxed.month - 11, firstTaxed.month]);
    expect(firstTaxed.suspendedLoss).toBe(0);
    expect(firstTaxed.operatingTax).toBe(Math.round((income - yearBefore.suspendedLoss) * 0.37));
  });

  it('grows the cash account by interest plus each month of cash flow', () => {
    result.hold.months.slice(1).forEach((m, i) => {
      const previous = result.hold.months[i]!;
      expect(m.cash).toBe(withInterest(previous.cash, duplex.reinvestmentRate) + m.cashFlow);
    });
  });

  it('follows the same path in every strategy until the decision month', () => {
    const until = (key: StrategyKey) => result[key].months.slice(0, result.decisionMonth);
    expect(until('sell')).toEqual(until('hold'));
    expect(until('exchange')).toEqual(until('hold'));
  });

  it('values a liquidation as cash plus sale proceeds less accrued tax', () => {
    for (const { liquidation } of result.hold.months) {
      const { sale, cash, accruedOperatingTax, releasedLossBenefit, value } = liquidation!;
      expect(value).toBe(cash + sale.netCash - accruedOperatingTax + releasedLossBenefit);
    }
  });

  it('is worth more with a step-up by exactly the tax on the sale', () => {
    const taxable = result.hold.months.at(-1)!.liquidation!;
    expect(result.holdStepUp.finalValue - result.hold.finalValue).toBe(taxable.sale.totalTax);
  });

  it('holds only cash after selling, growing at the reinvestment rate', () => {
    const afterSale = result.sell.months.slice(result.decisionMonth);
    afterSale.forEach((m, i) => {
      const previous = result.sell.months[result.decisionMonth + i - 1]!;
      expect(m.liquidation).toBeNull();
      expect(m.propertyValue).toBe(0);
      expect(m.liquidationValue).toBe(withInterest(previous.liquidationValue, 0.04));
    });
    expect(result.sell.finalValue).toBe(afterSale.at(-1)!.liquidationValue);
  });

  it('exchanges with no boot, no tax, and the depreciation history intact', () => {
    const sold = result.hold.months[result.decisionMonth - 1]!.liquidation!.sale;
    expect(result.exchangeEvent).toMatchObject({
      boot: 0,
      totalTax: 0,
      deferredGain: sold.gain,
      carriedDepreciation: sold.depreciationTaken,
    });
  });

  it('starts the replacement on a reduced basis and a fresh schedule', () => {
    const event = result.exchangeEvent!;
    const month = result.exchange.months[result.decisionMonth]!;
    // 80% of the carryover basis is building; half a month of 330
    expect(month.depreciation).toBe(Math.round((event.replacementBasis * 0.8) / 660));
    expect(month.accumulatedDepreciation).toBe(event.carriedDepreciation + month.depreciation);
    expect(month.loanBalance).toBeLessThan(event.replacementLoan);
  });

  it('pays the deferred gain when the replacement is finally sold', () => {
    const event = result.exchangeEvent!;
    const sale = result.exchange.months.at(-1)!.liquidation!.sale;
    expect(sale.adjustedBasis).toBeLessThan(event.replacementBasis);
    expect(sale.unrecaptured1250Gain).toBeGreaterThan(event.carriedDepreciation);
  });
});

describe('edge cases', () => {
  it('builds equity only through principal when appreciation is zero', () => {
    const result = simulate({ ...duplex, appreciation: 0 });
    expect(result.hold.months.every((m) => m.propertyValue === duplex.purchasePrice)).toBe(true);
    const sale = result.hold.months.at(-1)!.liquidation!.sale;
    expect(sale.gain).toBeLessThanOrEqual(sale.depreciationTaken);
    expect(sale.capitalGain).toBe(0);
  });

  it('taxes a sale in year one at ordinary rates', () => {
    const result = simulate({ ...duplex, appreciation: 0.2, decisionYear: 1 });
    const sale = result.hold.months[11]!.liquidation!.sale;
    expect(result.decisionMonth).toBe(12);
    expect(sale.gain).toBeGreaterThan(0);
    expect(sale.capitalGainsTax).toBe(Math.round(sale.capitalGain * 0.32));
    expect(result.sell.months[12]!.liquidation).toBeNull();
  });

  it('owes no sale tax when the property sells at a loss', () => {
    const result = simulate({ ...duplex, appreciation: -0.04 });
    const decision = result.hold.months[result.decisionMonth - 1]!.liquidation!;
    expect(decision.sale.gain).toBeLessThan(0);
    expect(decision.sale.totalTax).toBe(0);
    expect(result.holdStepUp.finalValue).toBeLessThanOrEqual(result.hold.finalValue);
  });

  it('has nothing to pay off when the loan ends before the sale', () => {
    const result = simulate({ ...duplex, loanTermYears: 8 });
    expect(result.hold.months[95]!.loanBalance).toBe(0);
    expect(result.hold.months[96]).toMatchObject({ interestPaid: 0, principalPaid: 0 });
    expect(result.hold.months[119]!.liquidation!.sale.loanPayoff).toBe(0);
  });

  it('runs an all-cash purchase with no debt service', () => {
    const result = simulate({ ...duplex, loanAmount: fromDollars(0) });
    expect(result.hold.months.every((m) => m.loanBalance === 0 && m.interestPaid === 0)).toBe(true);
    expect(result.hold.months[0]!.cashFlow).toBe(fromDollars(2_230));
  });

  it('pays the balloon out of cash when the whole term is interest-only', () => {
    const result = simulate({ ...duplex, loanTermYears: 10, interestOnlyYears: 10 });
    expect(result.hold.months[118]!.loanBalance).toBe(duplex.loanAmount);
    expect(result.hold.months[119]).toMatchObject({
      principalPaid: duplex.loanAmount,
      loanBalance: 0,
    });
    expect(result.hold.months[119]!.cash).toBeLessThan(0);
  });

  it('lowers debt service when the rate resets downward', () => {
    const result = simulate({ ...duplex, rateReset: { afterYear: 7, rate: 0.045 } });
    const debtService = (i: number) =>
      result.hold.months[i]!.interestPaid + result.hold.months[i]!.principalPaid;
    expect(debtService(84)).toBeLessThan(debtService(83));
    expect(result.hold.months.at(-1)!.loanBalance).toBeGreaterThan(0);
  });

  it('counts an improvement as a cash outlay and depreciates it from that month', () => {
    const roof = { date: { year: 2023, month: 6 }, cost: fromDollars(33_000) };
    const result = simulate({ ...duplex, improvements: [roof] });
    const plain = simulate(duplex);
    expect(result.hold.months[41]).toMatchObject({ improvements: fromDollars(33_000) });
    expect(result.hold.months[41]!.depreciation - plain.hold.months[41]!.depreciation).toBe(5_000);
    expect(result.hold.months[42]!.adjustedBasis - plain.hold.months[42]!.adjustedBasis).toBe(
      fromDollars(33_000 - 150),
    );
  });

  it('settles tax in calendar December when the purchase is mid-year', () => {
    const result = simulate({ ...duplex, purchaseDate: { year: 2020, month: 7 } });
    const taxed = result.hold.months.filter((m) => m.operatingTax > 0);
    expect(taxed.length).toBeGreaterThan(0);
    expect(taxed.every((m) => m.date.month === 12 && m.month % 12 === 6)).toBe(true);
  });

  it('carries a suspended loss through an exchange', () => {
    const result = simulate({ ...duplex, monthlyRent: fromDollars(2_400), decisionYear: 3 });
    const before = result.hold.months[35]!;
    expect(before.suspendedLoss).toBeGreaterThan(0);
    expect(result.exchange.months[36]!.suspendedLoss).toBe(before.suspendedLoss);
  });

  it('releases a suspended loss on a taxable sale but not on a step-up', () => {
    const result = simulate({ ...duplex, monthlyRent: fromDollars(2_400), decisionYear: 3 });
    const taxable = result.hold.months[35]!.liquidation!;
    const steppedUp = result.holdStepUp.months[35]!.liquidation!;
    expect(taxable.releasedLossBenefit).toBeGreaterThan(0);
    expect(steppedUp.releasedLossBenefit).toBe(0);
  });

  it('treats a decision at the horizon as never exchanging', () => {
    const result = simulate({ ...duplex, decisionYear: 20 });
    expect(result.exchangeEvent).toBeNull();
    expect(result.exchange).toEqual(result.hold);
    expect(result.sell.finalValue).toBe(result.hold.finalValue);
  });
});

describe('any inputs', () => {
  it('give deep-equal output on every run', () => {
    fc.assert(
      fc.property(anyInputs, (inputs) => {
        expect(simulate(inputs)).toEqual(simulate(structuredClone(inputs)));
      }),
      { numRuns: 30 },
    );
  });

  it('produce only whole cents', () => {
    fc.assert(
      fc.property(anyInputs, (inputs) => {
        const result = simulate(inputs);
        for (const key of strategies) {
          for (const { date, ...money } of result[key].months) {
            expect(date.month).toBeGreaterThan(0);
            expect(everyNumber(money).every(Number.isInteger)).toBe(true);
          }
        }
      }),
      { numRuns: 30 },
    );
  });

  it('cover every month of the horizon for every strategy', () => {
    fc.assert(
      fc.property(anyInputs, (inputs) => {
        const result = simulate(inputs);
        for (const key of strategies) {
          expect(result[key].months.map((m) => m.month)).toEqual(
            Array.from({ length: inputs.horizonYears * 12 }, (_, i) => i + 1),
          );
          expect(result[key].finalValue).toBe(result[key].months.at(-1)!.liquidationValue);
        }
      }),
      { numRuns: 30 },
    );
  });

  it('never depreciate more than the depreciable basis', () => {
    fc.assert(
      fc.property(anyInputs, (inputs) => {
        const depreciable = fromDollars(326_400);
        for (const m of simulate(inputs).hold.months) {
          expect(m.accumulatedDepreciation).toBeLessThanOrEqual(depreciable);
        }
      }),
      { numRuns: 30 },
    );
  });

  it('owe no tax at the exchange whenever there is no boot', () => {
    fc.assert(
      fc.property(anyInputs, (inputs) => {
        const { exchangeEvent, exchange, hold, decisionMonth } = simulate(inputs);
        fc.pre(exchangeEvent !== null && exchangeEvent.boot === 0);
        expect(exchangeEvent!.totalTax).toBe(0);
        const before = hold.months[decisionMonth - 1]!;
        const after = exchange.months[decisionMonth]!;
        expect(after.cash).toBe(
          withInterest(sub(before.cash, exchangeEvent!.cashAdded), inputs.reinvestmentRate) +
            after.cashFlow,
        );
      }),
      { numRuns: 60 },
    );
  });
});
