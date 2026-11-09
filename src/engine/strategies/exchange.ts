import { type Context, type HeldMonth, type Holding, operate } from '../holding';
import { amortize } from '../loan';
import { type Cents, ZERO, add, maxCents, minCents, scale, sub } from '../money';
import { taxOnGain } from '../tax';
import type { ExchangeBreakdown, Inputs, SaleBreakdown, StrategyResult, TaxRates } from '../types';

export type Exchange = {
  amountRealized: Cents;
  adjustedBasis: Cents;
  depreciationTaken: Cents;
  loanPayoff: Cents;
  monthsHeld: number;
  replacementPrice: Cents;
  replacementLoan: Cents;
};

export const exchangeProperty = (exchange: Exchange, rates: TaxRates): ExchangeBreakdown => {
  const { amountRealized, loanPayoff, replacementPrice, replacementLoan } = exchange;
  const realizedGain = sub(amountRealized, exchange.adjustedBasis);
  const equity = sub(amountRealized, loanPayoff);
  const cashNeeded = sub(replacementPrice, replacementLoan);

  const cashBoot = maxCents(sub(equity, cashNeeded), ZERO);
  const cashAdded = maxCents(sub(cashNeeded, equity), ZERO);
  // Debt relief counts as boot unless it is replaced by new debt or cash paid in.
  const mortgageBoot = maxCents(sub(sub(loanPayoff, replacementLoan), cashAdded), ZERO);
  const boot = add(cashBoot, mortgageBoot);

  const recognizedGain = minCents(boot, maxCents(realizedGain, ZERO));
  // Recognized gain is treated as recapture first, which taxOnGain already does.
  const tax = taxOnGain(recognizedGain, exchange.depreciationTaken, exchange.monthsHeld, rates);
  const deferredGain = sub(realizedGain, recognizedGain);

  return {
    ...tax,
    amountRealized,
    realizedGain,
    loanPayoff,
    replacementPrice,
    replacementLoan,
    cashBoot,
    mortgageBoot,
    boot,
    cashAdded,
    recognizedGain,
    deferredGain,
    replacementBasis: sub(replacementPrice, deferredGain),
    carriedDepreciation: sub(exchange.depreciationTaken, tax.unrecaptured1250Gain),
  };
};

const replacementHolding = (
  inputs: Inputs,
  acquiredMonth: number,
  terms: ExchangeBreakdown,
): Holding => {
  const landBasis = scale(terms.replacementBasis, inputs.replacementLandShare);
  return {
    acquiredMonth,
    // The holding period of the relinquished property tacks onto the replacement.
    heldSinceMonth: 1,
    price: inputs.replacementPrice,
    appreciation: inputs.replacementAppreciation,
    monthlyRent: inputs.replacementMonthlyRent,
    rentGrowth: inputs.rentGrowth,
    vacancyRate: inputs.vacancyRate,
    monthlyOpex: inputs.replacementMonthlyOpex,
    opexGrowth: inputs.opexGrowth,
    landBasis,
    // Simplification: the whole carryover basis restarts on a fresh 27.5-year schedule.
    building: { basis: sub(terms.replacementBasis, landBasis), placedInService: acquiredMonth },
    improvements: [],
    loan: amortize({
      principal: terms.replacementLoan,
      annualRate: inputs.replacementLoanRate,
      termMonths: inputs.replacementLoanTermYears * 12,
      interestOnlyMonths: 0,
      rateReset: null,
    }),
    carriedDepreciation: terms.carriedDepreciation,
  };
};

const termsAt = (sale: SaleBreakdown, monthsHeld: number, inputs: Inputs, rates: TaxRates) =>
  exchangeProperty(
    {
      amountRealized: sale.amountRealized,
      adjustedBasis: sale.adjustedBasis,
      depreciationTaken: sale.depreciationTaken,
      loanPayoff: sale.loanPayoff,
      monthsHeld,
      replacementPrice: inputs.replacementPrice,
      replacementLoan: scale(inputs.replacementPrice, inputs.replacementLoanToValue),
    },
    rates,
  );

export type ExchangeResult = { result: StrategyResult; event: ExchangeBreakdown | null };

export const exchange = (
  held: readonly HeldMonth[],
  decisionMonth: number,
  inputs: Inputs,
  ctx: Context,
): ExchangeResult => {
  const before = held.slice(0, decisionMonth);
  const last = before.at(-1)!;
  if (decisionMonth >= held.length) {
    const months = before.map(({ snapshot }) => snapshot);
    return { result: { months, finalValue: last.snapshot.liquidationValue }, event: null };
  }

  const { sale } = last.snapshot.liquidation;
  const event = termsAt(sale, decisionMonth, inputs, ctx.rates);
  const halfMonthAddBack = sub(last.snapshot.accumulatedDepreciation, sale.depreciationTaken);
  const opening = {
    cash: sub(sub(add(last.account.cash, event.cashBoot), event.cashAdded), event.totalTax),
    ytdTaxableIncome: add(last.account.ytdTaxableIncome, halfMonthAddBack),
    // Suspended passive losses carry over to the replacement.
    suspendedLoss: last.account.suspendedLoss,
  };
  const after = operate(
    replacementHolding(inputs, decisionMonth + 1, event),
    decisionMonth + 1,
    held.length,
    opening,
    ctx,
  );

  const months = [...before, ...after].map(({ snapshot }) => snapshot);
  return { result: { months, finalValue: months.at(-1)!.liquidationValue }, event };
};
