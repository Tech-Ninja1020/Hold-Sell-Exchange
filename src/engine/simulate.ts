import { type Context, OPENING_ACCOUNT, operate } from './holding';
import { exchange } from './strategies/exchange';
import { hold, holdWithStepUp, originalHolding } from './strategies/hold';
import { sell } from './strategies/sell';
import type { Inputs, SimulationResult } from './types';

export const simulate = (inputs: Inputs): SimulationResult => {
  const ctx: Context = {
    purchaseDate: inputs.purchaseDate,
    rates: {
      ordinaryRate: inputs.ordinaryRate,
      ltcgRate: inputs.ltcgRate,
      recaptureCap: inputs.recaptureCap,
      niit: inputs.niit,
      stateRate: inputs.stateRate,
    },
    sellingCostRate: inputs.sellingCostRate,
    reinvestmentRate: inputs.reinvestmentRate,
  };
  const horizonMonths = inputs.horizonYears * 12;
  const decisionMonth = Math.min(inputs.decisionYear, inputs.horizonYears) * 12;

  const held = operate(originalHolding(inputs), 1, horizonMonths, OPENING_ACCOUNT, ctx);
  const exchanged = exchange(held, decisionMonth, inputs, ctx);

  return {
    decisionMonth,
    hold: hold(held),
    holdStepUp: holdWithStepUp(held),
    sell: sell(held, decisionMonth, inputs.reinvestmentRate, inputs.purchaseDate),
    exchange: exchanged.result,
    exchangeEvent: exchanged.event,
  };
};
