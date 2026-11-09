import type { Cents } from './money';

export type YearMonth = { year: number; month: number };

export type Improvement = { date: YearMonth; cost: Cents };

export type RateResetInput = { afterYear: number; rate: number };

export type Inputs = {
  purchasePrice: Cents;
  purchaseDate: YearMonth;
  landValue: Cents;
  closingCosts: Cents;
  improvements: Improvement[];

  monthlyRent: Cents;
  rentGrowth: number;
  vacancyRate: number;
  monthlyOpex: Cents;
  opexGrowth: number;
  appreciation: number;
  sellingCostRate: number;

  loanAmount: Cents;
  loanRate: number;
  loanTermYears: number;
  interestOnlyYears: number;
  rateReset: RateResetInput | null;

  ordinaryRate: number;
  ltcgRate: number;
  recaptureCap: number;
  niit: boolean;
  stateRate: number;

  reinvestmentRate: number;
  horizonYears: number;
  decisionYear: number;

  replacementPrice: Cents;
  replacementLandShare: number;
  replacementLoanToValue: number;
  replacementLoanRate: number;
  replacementLoanTermYears: number;
  replacementMonthlyRent: Cents;
  replacementMonthlyOpex: Cents;
  replacementAppreciation: number;
};

export type TaxRates = Pick<
  Inputs,
  'ordinaryRate' | 'ltcgRate' | 'recaptureCap' | 'niit' | 'stateRate'
>;

export type GainTax = {
  unrecaptured1250Gain: Cents;
  capitalGain: Cents;
  recaptureTax: Cents;
  capitalGainsTax: Cents;
  niit: Cents;
  stateTax: Cents;
  totalTax: Cents;
};

export type SaleBreakdown = GainTax & {
  salePrice: Cents;
  sellingCosts: Cents;
  amountRealized: Cents;
  adjustedBasis: Cents;
  depreciationTaken: Cents;
  gain: Cents;
  loanPayoff: Cents;
  netCash: Cents;
};

export type Liquidation = {
  sale: SaleBreakdown;
  accruedOperatingTax: Cents;
  releasedLossBenefit: Cents;
  cash: Cents;
  value: Cents;
};

export type ExchangeBreakdown = GainTax & {
  amountRealized: Cents;
  realizedGain: Cents;
  loanPayoff: Cents;
  replacementPrice: Cents;
  replacementLoan: Cents;
  cashBoot: Cents;
  mortgageBoot: Cents;
  boot: Cents;
  cashAdded: Cents;
  recognizedGain: Cents;
  deferredGain: Cents;
  replacementBasis: Cents;
  carriedDepreciation: Cents;
};

export type MonthSnapshot = {
  month: number;
  date: YearMonth;
  propertyValue: Cents;
  loanBalance: Cents;
  rentCollected: Cents;
  operatingExpenses: Cents;
  interestPaid: Cents;
  principalPaid: Cents;
  improvements: Cents;
  depreciation: Cents;
  operatingTax: Cents;
  cashFlow: Cents;
  cash: Cents;
  accumulatedDepreciation: Cents;
  adjustedBasis: Cents;
  suspendedLoss: Cents;
  liquidation: Liquidation | null;
  liquidationValue: Cents;
};

export type StrategyKey = 'hold' | 'holdStepUp' | 'sell' | 'exchange';

export type StrategyResult = { months: MonthSnapshot[]; finalValue: Cents };

export type SimulationResult = Record<StrategyKey, StrategyResult> & {
  decisionMonth: number;
  exchangeEvent: ExchangeBreakdown | null;
};
