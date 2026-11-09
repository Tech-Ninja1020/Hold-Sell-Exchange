import { ToggleGroup } from 'radix-ui';
import type { Scenario } from '../../scenarios';

type ScenarioSwitcherProps = {
  scenarios: readonly Scenario[];
  selected: string;
  onSelect: (id: string) => void;
};

export function ScenarioSwitcher({ scenarios, selected, onSelect }: ScenarioSwitcherProps) {
  return (
    <ToggleGroup.Root
      type="single"
      value={selected}
      onValueChange={(id) => id && onSelect(id)}
      aria-label="Scenario"
      className="inline-flex max-w-full rounded-full border border-ink-line bg-ink-raised p-1"
    >
      {scenarios.map(({ id, name }) => (
        <ToggleGroup.Item
          key={id}
          value={id}
          className="rounded-full px-4 py-1.5 text-sm whitespace-nowrap text-on-ink-muted transition-colors data-[state=on]:bg-on-ink data-[state=on]:text-ink"
        >
          {name}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
