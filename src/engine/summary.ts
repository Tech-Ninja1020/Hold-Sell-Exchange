import { type Cents, ZERO, sub } from './money';
import type { SaleBreakdown, SimulationResult, StrategyKey } from './types';

const STRATEGIES: StrategyKey[] = ['hold', 'holdStepUp', 'sell', 'exchange'];

export type Ranking = {
  ranked: { strategy: StrategyKey; value: Cents }[];
  best: StrategyKey;
  lead: Cents;
};

/** Orders the strategies by after-tax liquidation value in a given month. */
export const rankAt = (result: SimulationResult, month: number): Ranking => {
  const ranked = STRATEGIES.map((strategy) => ({
    strategy,
    value: result[strategy].months[month - 1]!.liquidationValue,
  })).sort((a, b) => b.value - a.value);
  const first = ranked[0]!;
  return { ranked, best: first.strategy, lead: sub(first.value, ranked[1]!.value) };
};

export type WaterfallKey =
  | 'salePrice'
  | 'sellingCosts'
  | 'loanPayoff'
  | 'recaptureTax'
  | 'capitalGainsTax'
  | 'niit'
  | 'stateTax'
  | 'netCash';

export type WaterfallStep = { key: WaterfallKey; amount: Cents; from: Cents; to: Cents };

const DEDUCTIONS = [
  'sellingCosts',
  'loanPayoff',
  'recaptureTax',
  'capitalGainsTax',
  'niit',
  'stateTax',
] as const;

/** Sale price down to net cash, each step carrying its running total. */
export const saleWaterfall = (sale: SaleBreakdown): WaterfallStep[] => {
  const steps: WaterfallStep[] = [
    { key: 'salePrice', amount: sale.salePrice, from: ZERO, to: sale.salePrice },
  ];
  let running = sale.salePrice;
  for (const key of DEDUCTIONS) {
    const next = sub(running, sale[key]);
    steps.push({ key, amount: sale[key], from: running, to: next });
    running = next;
  }
  steps.push({ key: 'netCash', amount: running, from: ZERO, to: running });
  return steps;
};
