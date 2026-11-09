import { fromDollars } from '../src/engine/money';
import type { Inputs, TaxRates } from '../src/engine/types';

export const rates: TaxRates = {
  ordinaryRate: 0.32,
  ltcgRate: 0.15,
  recaptureCap: 0.25,
  niit: true,
  stateRate: 0.05,
};

export const duplex: Inputs = {
  purchasePrice: fromDollars(400_000),
  purchaseDate: { year: 2020, month: 1 },
  landValue: fromDollars(80_000),
  closingCosts: fromDollars(8_000),
  improvements: [],

  monthlyRent: fromDollars(3_400),
  rentGrowth: 0.03,
  vacancyRate: 0.05,
  monthlyOpex: fromDollars(1_000),
  opexGrowth: 0.03,
  appreciation: 0.03,
  sellingCostRate: 0.06,

  loanAmount: fromDollars(300_000),
  loanRate: 0.065,
  loanTermYears: 30,
  interestOnlyYears: 0,
  rateReset: null,

  ...rates,

  reinvestmentRate: 0.04,
  horizonYears: 20,
  decisionYear: 10,

  replacementPrice: fromDollars(750_000),
  replacementLandShare: 0.2,
  replacementLoanToValue: 0.65,
  replacementLoanRate: 0.065,
  replacementLoanTermYears: 30,
  replacementMonthlyRent: fromDollars(5_800),
  replacementMonthlyOpex: fromDollars(1_700),
  replacementAppreciation: 0.03,
};
