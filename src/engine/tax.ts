import { type Cents, ZERO, minCents, scale, sub } from './money';

export type TaxRates = {
  ordinaryRate: number;
  ltcgRate: number;
  recaptureCap: number;
  niit: boolean;
  stateRate: number;
};

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
