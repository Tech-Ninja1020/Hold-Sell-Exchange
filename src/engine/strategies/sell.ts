import { type HeldMonth, dateOf, withInterest } from '../holding';
import { type Cents, ZERO } from '../money';
import type { MonthSnapshot, StrategyResult, YearMonth } from '../types';

const cashOnly = (month: number, date: YearMonth, cash: Cents): MonthSnapshot => ({
  month,
  date,
  propertyValue: ZERO,
  loanBalance: ZERO,
  rentCollected: ZERO,
  operatingExpenses: ZERO,
  interestPaid: ZERO,
  principalPaid: ZERO,
  improvements: ZERO,
  depreciation: ZERO,
  operatingTax: ZERO,
  cashFlow: ZERO,
  cash,
  accumulatedDepreciation: ZERO,
  adjustedBasis: ZERO,
  suspendedLoss: ZERO,
  liquidation: null,
  liquidationValue: cash,
});

export const sell = (
  held: readonly HeldMonth[],
  decisionMonth: number,
  reinvestmentRate: number,
  purchaseDate: YearMonth,
): StrategyResult => {
  const months: MonthSnapshot[] = held.slice(0, decisionMonth).map(({ snapshot }) => snapshot);
  let cash = months.at(-1)!.liquidationValue;
  for (let month = decisionMonth + 1; month <= held.length; month++) {
    cash = withInterest(cash, reinvestmentRate);
    months.push(cashOnly(month, dateOf(purchaseDate, month), cash));
  }
  return { months, finalValue: cash };
};
