import { fromDollars } from '../engine/money';
import { confirmed, unconfirmed } from './sourced';
import type { Scenario } from './types';

export const longHold: Scenario = {
  id: 'long-hold',
  name: 'Long hold',
  address: '9 Larkspur Lane',
  propertyType: 'Single-family rental',
  summary: 'Owned 25 years, nearly fully depreciated, with a very low basis.',
  inputs: {
    purchasePrice: confirmed(fromDollars(210_000), 'closing_statement'),
    purchaseDate: confirmed({ year: 2001, month: 6 }, 'closing_statement'),
    landValue: confirmed(fromDollars(50_000), 'tax_return', 'From the depreciation schedule'),
    closingCosts: unconfirmed(fromDollars(4_200), 'owner_estimate', 'Closing statement missing'),
    improvements: confirmed(
      [
        { date: { year: 2012, month: 4 }, cost: fromDollars(18_000) },
        { date: { year: 2019, month: 10 }, cost: fromDollars(32_000) },
      ],
      'tax_return',
      'Form 4562 additions',
    ),

    monthlyRent: confirmed(fromDollars(1_550), 'tax_return', 'Rent in the first year'),
    rentGrowth: unconfirmed(0.034, 'owner_estimate', 'Fitted to current rent'),
    vacancyRate: confirmed(0.04, 'tax_return'),
    monthlyOpex: confirmed(fromDollars(520), 'tax_return', 'Expenses in the first year'),
    opexGrowth: unconfirmed(0.03, 'assumed_default'),
    appreciation: unconfirmed(0.048, 'appraisal', 'Fitted to a 2024 broker opinion'),
    sellingCostRate: confirmed(0.06, 'assumed_default'),

    loanAmount: confirmed(fromDollars(168_000), 'lender_statement'),
    loanRate: confirmed(0.069, 'lender_statement'),
    loanTermYears: confirmed(30, 'lender_statement'),
    interestOnlyYears: confirmed(0, 'lender_statement'),
    rateReset: confirmed(null, 'lender_statement'),

    ordinaryRate: confirmed(0.24, 'tax_return'),
    ltcgRate: confirmed(0.15, 'tax_return'),
    recaptureCap: confirmed(0.25, 'assumed_default', 'Statutory cap'),
    niit: unconfirmed(false, 'owner_estimate', 'Depends on income in the year of sale'),
    stateRate: confirmed(0.06, 'tax_return'),

    reinvestmentRate: unconfirmed(0.045, 'assumed_default', 'After-tax return on cash'),
    horizonYears: confirmed(30, 'assumed_default'),
    decisionYear: confirmed(25, 'assumed_default'),

    replacementPrice: unconfirmed(fromDollars(900_000), 'owner_estimate'),
    replacementLandShare: unconfirmed(0.25, 'assumed_default'),
    replacementLoanToValue: confirmed(0.3, 'assumed_default'),
    replacementLoanRate: unconfirmed(0.0675, 'assumed_default'),
    replacementLoanTermYears: confirmed(30, 'assumed_default'),
    replacementMonthlyRent: unconfirmed(fromDollars(5_600), 'owner_estimate'),
    replacementMonthlyOpex: unconfirmed(fromDollars(1_700), 'owner_estimate'),
    replacementAppreciation: unconfirmed(0.04, 'assumed_default'),
  },
};
