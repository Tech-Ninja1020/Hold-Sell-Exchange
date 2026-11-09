import type { InputKey } from '../../engine/provenance';
import type { Ranking } from '../../engine/summary';
import type { StrategyKey } from '../../engine/types';
import { STRATEGY_META, STRATEGY_ORDER } from '../strategies';
import { AnimatedMoney } from './AnimatedMoney';

type StrategyCardsProps = {
  ranking: Ranking;
  unconfirmed: Record<StrategyKey, InputKey[]>;
  yearLabel: string;
};

export function StrategyCards({ ranking, unconfirmed, yearLabel }: StrategyCardsProps) {
  const runnerUp = STRATEGY_META[ranking.ranked[1]!.strategy].label;

  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-6">
      {STRATEGY_ORDER.map((key) => {
        const { label, blurb, swatch } = STRATEGY_META[key];
        const value = ranking.ranked.find((r) => r.strategy === key)!.value;
        const best = ranking.best === key;
        const open = unconfirmed[key].length;

        return (
          <article
            key={key}
            className={`col-span-12 flex flex-col rounded-card border bg-surface p-5 shadow-card transition-[translate,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:col-span-6 lg:col-span-3 ${
              best ? 'border-accent' : 'border-line'
            }`}
          >
            <div className="flex min-h-5 items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${swatch}`} aria-hidden />
                <h3 className="text-sm font-medium text-text">{label}</h3>
              </div>
              {best && (
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-eyebrow text-accent uppercase">
                  Best outcome
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-text-muted lg:min-h-8">{blurb}</p>

            <p className="mt-5 font-display text-[2.25rem] leading-none tracking-tight text-text">
              <AnimatedMoney value={value} className="money" />
            </p>
            <p className="mt-2 text-xs text-text-faint">After tax, {yearLabel}</p>

            <div className="mt-5 flex flex-1 flex-col justify-end gap-1.5 border-t border-line pt-3 text-xs text-text-muted">
              {best && (
                <p className="text-text">
                  <AnimatedMoney value={ranking.lead} className="money" /> ahead of {runnerUp}
                </p>
              )}
              <p className="flex items-center gap-1.5">
                <span
                  className={`size-1.5 rounded-full ${open > 0 ? 'bg-unconfirmed' : 'bg-hold'}`}
                  aria-hidden
                />
                {open > 0
                  ? `Rests on ${open} unconfirmed ${open === 1 ? 'input' : 'inputs'}`
                  : 'All inputs confirmed'}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
