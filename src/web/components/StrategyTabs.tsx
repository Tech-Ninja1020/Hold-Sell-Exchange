import { motion } from 'motion/react';
import { Tabs } from 'radix-ui';
import type { StrategyKey } from '../../engine/types';
import { SPRING } from '../motion';
import { STRATEGY_META, STRATEGY_ORDER } from '../strategies';

type StrategyTabsProps = { selected: StrategyKey; onSelect: (key: StrategyKey) => void };

export function StrategyTabs({ selected, onSelect }: StrategyTabsProps) {
  return (
    <Tabs.Root
      value={selected}
      onValueChange={(key) => onSelect(key as StrategyKey)}
      className="max-w-full overflow-x-auto"
    >
      <Tabs.List
        aria-label="Strategy"
        className="inline-flex rounded-full border border-line bg-surface-sunken p-0.5"
      >
        {STRATEGY_ORDER.map((key) => (
          <Tabs.Trigger
            key={key}
            value={key}
            className="relative rounded-full px-3 py-1 text-xs whitespace-nowrap text-text-muted transition-colors data-[state=active]:text-text"
          >
            {selected === key && (
              <motion.span
                layoutId="strategy-tab-indicator"
                transition={SPRING}
                className="absolute inset-0 rounded-full bg-surface shadow-sm"
              />
            )}
            <span className="relative">{STRATEGY_META[key].label}</span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
