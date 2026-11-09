import { motion } from 'motion/react';
import { ToggleGroup } from 'radix-ui';
import type { Scenario } from '../../scenarios';
import { SPRING } from '../motion';

type ScenarioSwitcherProps = {
  scenarios: readonly Scenario[];
  selected: string;
  onSelect: (id: string) => void;
};

export function ScenarioSwitcher({ scenarios, selected, onSelect }: ScenarioSwitcherProps) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <ToggleGroup.Root
        type="single"
        value={selected}
        onValueChange={(id) => id && onSelect(id)}
        aria-label="Scenario"
        className="inline-flex rounded-full border border-ink-line bg-ink-raised p-1"
      >
        {scenarios.map(({ id, name }) => (
          <ToggleGroup.Item
            key={id}
            value={id}
            className="relative rounded-full px-4 py-1.5 text-sm whitespace-nowrap text-on-ink-muted transition-colors data-[state=on]:text-ink"
          >
            {selected === id && (
              <motion.span
                layoutId="scenario-indicator"
                transition={SPRING}
                className="absolute inset-0 rounded-full bg-on-ink"
              />
            )}
            <span className="relative">{name}</span>
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}
