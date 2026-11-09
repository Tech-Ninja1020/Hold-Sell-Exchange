import { type Cents, ZERO, maxCents, minCents, scale, sub, sum } from './money';
import type { GainTax, SaleBreakdown, TaxRates } from './types';

const NIIT_RATE = 0.038;
const LONG_TERM_AFTER_MONTHS = 12;

export type RentalSettlement = { tax: Cents; suspendedLoss: Cents };

/** Settles a period of rental income against the suspended passive loss carried so far. */
export const settleRentalIncome = (
  taxableIncome: Cents,
  suspendedLoss: Cents,
  rates: TaxRates,
): RentalSettlement => {
  if (taxableIncome <= 0) return { tax: ZERO, suspendedLoss: sub(suspendedLoss, taxableIncome) };
  const offset = minCents(taxableIncome, suspendedLoss);
  return {
    tax: scale(sub(taxableIncome, offset), rates.ordinaryRate + rates.stateRate),
    suspendedLoss: sub(suspendedLoss, offset),
  };
};

/** Tax saved when suspended losses are released against other income on a taxable sale. */
export const releasedLossBenefit = (suspendedLoss: Cents, rates: TaxRates): Cents =>
  scale(suspendedLoss, rates.ordinaryRate + rates.stateRate);

export const taxOnGain = (
  gain: Cents,
  depreciationTaken: Cents,
  monthsHeld: number,
  rates: TaxRates,
): GainTax => {
  const taxableGain = maxCents(gain, ZERO);
  // §1250: unrecaptured gain is capped at depreciation taken
  const unrecaptured1250Gain = minCents(depreciationTaken, taxableGain);
  const capitalGain = sub(taxableGain, unrecaptured1250Gain);

  // Held a year or less, the whole gain is short-term and taxed as ordinary income.
  const longTerm = monthsHeld > LONG_TERM_AFTER_MONTHS;
  const recaptureRate = longTerm
    ? Math.min(rates.ordinaryRate, rates.recaptureCap)
    : rates.ordinaryRate;
  const capitalGainRate = longTerm ? rates.ltcgRate : rates.ordinaryRate;

  const recaptureTax = scale(unrecaptured1250Gain, recaptureRate);
  const capitalGainsTax = scale(capitalGain, capitalGainRate);
  const niit = rates.niit ? scale(taxableGain, NIIT_RATE) : ZERO;
  const stateTax = scale(taxableGain, rates.stateRate);

  return {
    unrecaptured1250Gain,
    capitalGain,
    recaptureTax,
    capitalGainsTax,
    niit,
    stateTax,
    totalTax: sum([recaptureTax, capitalGainsTax, niit, stateTax]),
  };
};

export type Sale = {
  salePrice: Cents;
  sellingCostRate: number;
  adjustedBasis: Cents;
  depreciationTaken: Cents;
  loanBalance: Cents;
  monthsHeld: number;
};

export const taxableSale = (sale: Sale, rates: TaxRates): SaleBreakdown => {
  const sellingCosts = scale(sale.salePrice, sale.sellingCostRate);
  const amountRealized = sub(sale.salePrice, sellingCosts);
  const gain = sub(amountRealized, sale.adjustedBasis);
  const tax = taxOnGain(gain, sale.depreciationTaken, sale.monthsHeld, rates);
  return {
    ...tax,
    salePrice: sale.salePrice,
    sellingCosts,
    amountRealized,
    adjustedBasis: sale.adjustedBasis,
    depreciationTaken: sale.depreciationTaken,
    gain,
    loanPayoff: sale.loanBalance,
    netCash: sub(sub(amountRealized, sale.loanBalance), tax.totalTax),
  };
};

/** §1014: heirs take a basis equal to market value, so deferred gain and recapture disappear. */
export const steppedUpSale = (sale: Sale, rates: TaxRates): SaleBreakdown =>
  taxableSale({ ...sale, adjustedBasis: sale.salePrice, depreciationTaken: ZERO }, rates);
