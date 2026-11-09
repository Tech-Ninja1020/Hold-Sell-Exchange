import { fromDollars } from '../engine/money';
import { confirmed, unconfirmed } from './sourced';
import type { Scenario } from './types';

export const interestOnlyArm: Scenario = {
  id: 'interest-only-arm',
  name: 'Interest-only ARM',
  address: '77 Harbor Row, Unit 3',
  propertyType: 'Triplex',
  summary: 'Interest-only for five years, then the rate resets in year seven.',
  inputs: {
    purchasePrice: confirmed(fromDollars(650_000), 'closing_statement'),
    purchaseDate: confirmed({ year: 2022, month: 9 }, 'closing_statement'),
    landValue: confirmed(fromDollars(195_000), 'appraisal'),
    closingCosts: confirmed(fromDollars(13_500), 'closing_statement'),
    improvements: unconfirmed(
      [{ date: { year: 2024, month: 5 }, cost: fromDollars(28_000) }],
      'owner_estimate',
      'Roof replacement, invoice not on file',
    ),

    monthlyRent: unconfirmed(
      fromDollars(5_300),
      'owner_estimate',
      'Current leases, not yet on a return',
    ),
    rentGrowth: unconfirmed(0.035, 'assumed_default'),
    vacancyRate: unconfirmed(0.06, 'assumed_default'),
    monthlyOpex: confirmed(fromDollars(1_650), 'tax_return'),
    opexGrowth: unconfirmed(0.03, 'assumed_default'),
    appreciation: unconfirmed(0.035, 'assumed_default'),
    sellingCostRate: confirmed(0.06, 'assumed_default'),

    loanAmount: confirmed(fromDollars(487_500), 'lender_statement'),
    loanRate: confirmed(0.0525, 'lender_statement'),
    loanTermYears: confirmed(30, 'lender_statement'),
    interestOnlyYears: confirmed(5, 'lender_statement'),
    rateReset: unconfirmed(
      { afterYear: 7, rate: 0.075 },
      'owner_estimate',
      'Reset date is on the note; the new rate is a guess',
    ),

    ordinaryRate: confirmed(0.35, 'tax_return'),
    ltcgRate: confirmed(0.15, 'tax_return'),
    recaptureCap: confirmed(0.25, 'assumed_default', 'Statutory cap'),
    niit: confirmed(true, 'tax_return'),
    stateRate: unconfirmed(0.093, 'assumed_default', 'Top marginal bracket assumed'),

    reinvestmentRate: unconfirmed(0.045, 'assumed_default', 'After-tax return on cash'),
    horizonYears: confirmed(20, 'assumed_default'),
    decisionYear: confirmed(8, 'assumed_default'),

    replacementPrice: unconfirmed(fromDollars(1_050_000), 'owner_estimate'),
    replacementLandShare: unconfirmed(0.25, 'assumed_default'),
    replacementLoanToValue: confirmed(0.6, 'assumed_default'),
    replacementLoanRate: unconfirmed(0.0675, 'assumed_default'),
    replacementLoanTermYears: confirmed(30, 'assumed_default'),
    replacementMonthlyRent: unconfirmed(fromDollars(8_600), 'owner_estimate'),
    replacementMonthlyOpex: unconfirmed(fromDollars(2_500), 'owner_estimate'),
    replacementAppreciation: unconfirmed(0.035, 'assumed_default'),
  },
};
