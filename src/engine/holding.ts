import {
  type Asset,
  basisInService,
  totalDepreciationAtDisposal,
  totalDepreciationThrough,
} from './depreciation';
import { type LoanPayment, balanceAfter } from './loan';
import { type Cents, ZERO, add, neg, roundCents, scale, sub, sum } from './money';
import { releasedLossBenefit, settleRentalIncome, steppedUpSale, taxableSale } from './tax';
import type { Liquidation, MonthSnapshot, TaxRates, YearMonth } from './types';

export type Holding = {
  acquiredMonth: number;
  heldSinceMonth: number;
  price: Cents;
  appreciation: number;
  monthlyRent: Cents;
  rentGrowth: number;
  vacancyRate: number;
  monthlyOpex: Cents;
  opexGrowth: number;
  landBasis: Cents;
  building: Asset;
  improvements: Asset[];
  loan: LoanPayment[];
  carriedDepreciation: Cents;
};

export type Account = { cash: Cents; ytdTaxableIncome: Cents; suspendedLoss: Cents };

export type Context = {
  purchaseDate: YearMonth;
  rates: TaxRates;
  sellingCostRate: number;
  reinvestmentRate: number;
};

export type HeldMonth = {
  snapshot: MonthSnapshot & { liquidation: Liquidation };
  steppedUp: Liquidation;
  account: Account;
};

export const OPENING_ACCOUNT: Account = { cash: ZERO, ytdTaxableIncome: ZERO, suspendedLoss: ZERO };

export const dateOf = (start: YearMonth, month: number): YearMonth => {
  const index = start.month - 1 + month - 1;
  return { year: start.year + Math.floor(index / 12), month: (index % 12) + 1 };
};

export const monthOf = (start: YearMonth, date: YearMonth): number =>
  (date.year - start.year) * 12 + (date.month - start.month) + 1;

export const withInterest = (cash: Cents, annualRate: number): Cents =>
  add(cash, scale(cash, annualRate / 12));

const grow = (amount: Cents, annualRate: number, years: number): Cents =>
  roundCents(amount * (1 + annualRate) ** years);

const operateMonth = (
  holding: Holding,
  month: number,
  opening: Account,
  ctx: Context,
): HeldMonth => {
  const age = month - holding.acquiredMonth + 1;
  const date = dateOf(ctx.purchaseDate, month);
  const assets = [holding.building, ...holding.improvements];

  // Rent and expenses step up once a year; value compounds monthly.
  const leaseYear = Math.floor((age - 1) / 12);
  const rentCollected = scale(
    grow(holding.monthlyRent, holding.rentGrowth, leaseYear),
    1 - holding.vacancyRate,
  );
  const operatingExpenses = grow(holding.monthlyOpex, holding.opexGrowth, leaseYear);
  const propertyValue = grow(holding.price, holding.appreciation, age / 12);

  const payment = holding.loan[age - 1];
  const interestPaid = payment?.interest ?? ZERO;
  const principalPaid = payment?.principal ?? ZERO;
  const loanBalance = balanceAfter(holding.loan, age);

  const improvements = sum(
    holding.improvements.filter((a) => a.placedInService === month).map((a) => a.basis),
  );
  const depreciatedThrough = totalDepreciationThrough(assets, month);
  const depreciation = sub(depreciatedThrough, totalDepreciationThrough(assets, month - 1));

  const taxableIncome = sum([
    rentCollected,
    neg(operatingExpenses),
    neg(interestPaid),
    neg(depreciation),
  ]);
  const ytdTaxableIncome = add(opening.ytdTaxableIncome, taxableIncome);
  const yearEnd = date.month === 12;
  const settled = yearEnd
    ? settleRentalIncome(ytdTaxableIncome, opening.suspendedLoss, ctx.rates)
    : { tax: ZERO, suspendedLoss: opening.suspendedLoss };

  const cashFlow = sum([
    rentCollected,
    neg(operatingExpenses),
    neg(interestPaid),
    neg(principalPaid),
    neg(improvements),
    neg(settled.tax),
  ]);
  const account: Account = {
    cash: add(withInterest(opening.cash, ctx.reinvestmentRate), cashFlow),
    ytdTaxableIncome: yearEnd ? ZERO : ytdTaxableIncome,
    suspendedLoss: settled.suspendedLoss,
  };

  // A sale this month takes only a half month of depreciation, so the difference is added back.
  const depreciatedAtSale = totalDepreciationAtDisposal(assets, month);
  const costBasis = add(holding.landBasis, basisInService(assets, month));
  const sale = {
    salePrice: propertyValue,
    sellingCostRate: ctx.sellingCostRate,
    adjustedBasis: sub(costBasis, depreciatedAtSale),
    depreciationTaken: add(holding.carriedDepreciation, depreciatedAtSale),
    loanBalance,
    monthsHeld: month - holding.heldSinceMonth + 1,
  };
  const finalYear = settleRentalIncome(
    add(account.ytdTaxableIncome, sub(depreciatedThrough, depreciatedAtSale)),
    account.suspendedLoss,
    ctx.rates,
  );
  const liquidation = liquidate(
    taxableSale(sale, ctx.rates),
    finalYear.tax,
    releasedLossBenefit(finalYear.suspendedLoss, ctx.rates),
    account.cash,
  );
  // Suspended losses mostly die with the owner, so the step-up case takes no benefit for them.
  const steppedUp = liquidate(steppedUpSale(sale, ctx.rates), finalYear.tax, ZERO, account.cash);

  return {
    snapshot: {
      month,
      date,
      propertyValue,
      loanBalance,
      rentCollected,
      operatingExpenses,
      interestPaid,
      principalPaid,
      improvements,
      depreciation,
      operatingTax: settled.tax,
      cashFlow,
      cash: account.cash,
      accumulatedDepreciation: add(holding.carriedDepreciation, depreciatedThrough),
      adjustedBasis: sub(costBasis, depreciatedThrough),
      suspendedLoss: account.suspendedLoss,
      liquidation,
      liquidationValue: liquidation.value,
    },
    steppedUp,
    account,
  };
};

const liquidate = (
  sale: Liquidation['sale'],
  accruedOperatingTax: Cents,
  lossBenefit: Cents,
  cash: Cents,
): Liquidation => ({
  sale,
  accruedOperatingTax,
  releasedLossBenefit: lossBenefit,
  cash,
  value: sum([cash, sale.netCash, neg(accruedOperatingTax), lossBenefit]),
});

export const operate = (
  holding: Holding,
  firstMonth: number,
  lastMonth: number,
  opening: Account,
  ctx: Context,
): HeldMonth[] => {
  const months: HeldMonth[] = [];
  let account = opening;
  for (let month = firstMonth; month <= lastMonth; month++) {
    const held = operateMonth(holding, month, account, ctx);
    months.push(held);
    account = held.account;
  }
  return months;
};
