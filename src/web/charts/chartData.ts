import type { Cents } from '../../engine/money';
import type { Liquidation, SimulationResult, StrategyKey } from '../../engine/types';
import { STRATEGY_ORDER } from '../strategies';

export type ChartPoint = { year: number; calendarYear: number } & Record<StrategyKey, Cents>;

/** One point per ownership year, read at the last month of that year. */
export const yearlyPoints = (result: SimulationResult): ChartPoint[] =>
  result.hold.months
    .filter((snapshot) => snapshot.month % 12 === 0)
    .map((snapshot) => {
      const values = Object.fromEntries(
        STRATEGY_ORDER.map((key) => [
          key,
          result[key].months[snapshot.month - 1]!.liquidationValue,
        ]),
      ) as Record<StrategyKey, Cents>;
      return { year: snapshot.month / 12, calendarYear: snapshot.date.year, ...values };
    });

/** The sale behind a strategy's value in a month; after selling, that is the decision-year sale. */
export const liquidationAt = (
  result: SimulationResult,
  strategy: StrategyKey,
  month: number,
): Liquidation =>
  result[strategy].months[month - 1]!.liquidation ??
  result.hold.months[result.decisionMonth - 1]!.liquidation!;
