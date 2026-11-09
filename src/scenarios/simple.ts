import { fromDollars } from '../engine/money';
import { confirmed, unconfirmed } from './sourced';
import type { Scenario } from './types';

export const simple: Scenario = {
  id: 'simple',
  name: 'Simple duplex',
  address: '1418 Alder Street',
  propertyType: 'Duplex',
  summary: 'A plain 30-year fixed loan with a decision ten years in.',
  inputs: {
    purchasePrice: confirmed(fromDollars(400_000), 'closing_statement'),
    purchaseDate: confirmed({ year: 2021, month: 3 }, 'closing_statement'),
    landValue: unconfirmed(
      fromDollars(80_000),
      'appraisal',
      'County assessor ratio, not a lender appraisal',
    ),
    closingCosts: confirmed(fromDollars(8_000), 'closing_statement'),
    improvements: confirmed([], 'tax_return'),

    monthlyRent: confirmed(fromDollars(3_400), 'tax_return', 'Schedule E, both units'),
    rentGrowth: unconfirmed(0.03, 'assumed_default'),
    vacancyRate: unconfirmed(0.05, 'owner_estimate'),
    monthlyOpex: unconfirmed(fromDollars(1_000), 'owner_estimate', 'Taxes, insurance, repairs'),
    opexGrowth: unconfirmed(0.03, 'assumed_default'),
    appreciation: unconfirmed(0.03, 'assumed_default'),
    sellingCostRate: confirmed(0.06, 'assumed_default'),

    loanAmount: confirmed(fromDollars(300_000), 'lender_statement'),
    loanRate: confirmed(0.065, 'lender_statement'),
    loanTermYears: confirmed(30, 'lender_statement'),
    interestOnlyYears: confirmed(0, 'lender_statement'),
    rateReset: confirmed(null, 'lender_statement'),

    ordinaryRate: confirmed(0.32, 'tax_return'),
    ltcgRate: confirmed(0.15, 'tax_return'),
    recaptureCap: confirmed(0.25, 'assumed_default', 'Statutory cap'),
    niit: confirmed(true, 'tax_return'),
    stateRate: confirmed(0.05, 'tax_return'),

    reinvestmentRate: unconfirmed(0.045, 'assumed_default', 'After-tax return on cash'),
    horizonYears: confirmed(20, 'assumed_default'),
    decisionYear: confirmed(10, 'assumed_default'),

    replacementPrice: unconfirmed(fromDollars(760_000), 'owner_estimate', 'Target fourplex'),
    replacementLandShare: unconfirmed(0.2, 'assumed_default'),
    replacementLoanToValue: confirmed(0.65, 'assumed_default'),
    replacementLoanRate: unconfirmed(0.065, 'assumed_default'),
    replacementLoanTermYears: confirmed(30, 'assumed_default'),
    replacementMonthlyRent: unconfirmed(fromDollars(6_500), 'owner_estimate'),
    replacementMonthlyOpex: unconfirmed(fromDollars(1_900), 'owner_estimate'),
    replacementAppreciation: unconfirmed(0.035, 'assumed_default'),
  },
};
