import { type Holding, type HeldMonth, monthOf } from '../holding';
import { amortize } from '../loan';
import { ZERO, add, scale, sub } from '../money';
import type { Inputs, StrategyResult } from '../types';

export const originalHolding = (inputs: Inputs): Holding => {
  // Closing costs join basis, split between land and building in proportion to value.
  const landClosingCosts = scale(inputs.closingCosts, inputs.landValue / inputs.purchasePrice);
  const landBasis = add(inputs.landValue, landClosingCosts);
  const buildingBasis = sub(add(inputs.purchasePrice, inputs.closingCosts), landBasis);

  return {
    acquiredMonth: 1,
    heldSinceMonth: 1,
    price: inputs.purchasePrice,
    appreciation: inputs.appreciation,
    monthlyRent: inputs.monthlyRent,
    rentGrowth: inputs.rentGrowth,
    vacancyRate: inputs.vacancyRate,
    monthlyOpex: inputs.monthlyOpex,
    opexGrowth: inputs.opexGrowth,
    landBasis,
    building: { basis: buildingBasis, placedInService: 1 },
    improvements: inputs.improvements.map(({ date, cost }) => ({
      basis: cost,
      placedInService: monthOf(inputs.purchaseDate, date),
    })),
    loan: amortize({
      principal: inputs.loanAmount,
      annualRate: inputs.loanRate,
      termMonths: inputs.loanTermYears * 12,
      interestOnlyMonths: inputs.interestOnlyYears * 12,
      rateReset: inputs.rateReset && {
        afterMonth: inputs.rateReset.afterYear * 12,
        annualRate: inputs.rateReset.rate,
      },
    }),
    carriedDepreciation: ZERO,
  };
};

export const hold = (held: readonly HeldMonth[]): StrategyResult => {
  const months = held.map(({ snapshot }) => snapshot);
  return { months, finalValue: months.at(-1)!.liquidationValue };
};

export const holdWithStepUp = (held: readonly HeldMonth[]): StrategyResult => {
  const months = held.map(({ snapshot, steppedUp }) => ({
    ...snapshot,
    liquidation: steppedUp,
    liquidationValue: steppedUp.value,
  }));
  return { months, finalValue: months.at(-1)!.liquidationValue };
};
