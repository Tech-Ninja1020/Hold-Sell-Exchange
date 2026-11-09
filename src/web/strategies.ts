import type { StrategyKey } from '../engine/types';

export type StrategyMeta = {
  label: string;
  blurb: string;
  color: string;
  swatch: string;
  dashed: boolean;
};

export const STRATEGY_ORDER: StrategyKey[] = ['hold', 'holdStepUp', 'sell', 'exchange'];

export const STRATEGY_META: Record<StrategyKey, StrategyMeta> = {
  hold: {
    label: 'Hold',
    blurb: 'Keep renting, then a taxable sale',
    color: 'var(--hold)',
    swatch: 'bg-hold',
    dashed: false,
  },
  holdStepUp: {
    label: 'Hold, step-up',
    blurb: 'Keep renting, heirs take a stepped-up basis',
    color: 'var(--hold-stepup)',
    swatch: 'bg-hold-stepup',
    dashed: true,
  },
  sell: {
    label: 'Sell',
    blurb: 'Sell at the decision year and invest the cash',
    color: 'var(--sell)',
    swatch: 'bg-sell',
    dashed: false,
  },
  exchange: {
    label: '1031 exchange',
    blurb: 'Trade into the replacement, sell it at the horizon',
    color: 'var(--exchange)',
    swatch: 'bg-exchange',
    dashed: false,
  },
};
