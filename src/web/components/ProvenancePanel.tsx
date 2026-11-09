import type { InputKey, SourcedInputs } from '../../engine/provenance';
import type { StrategyKey } from '../../engine/types';
import { INPUT_LABELS, formatInput } from '../fields';
import { STRATEGY_META, STRATEGY_ORDER } from '../strategies';
import { Panel } from './Panel';
import { SourceChip } from './SourceChip';

type ProvenancePanelProps = {
  inputs: SourcedInputs;
  unconfirmed: Record<StrategyKey, InputKey[]>;
  onConfirm: (key: InputKey) => void;
};

export function ProvenancePanel({ inputs, unconfirmed, onConfirm }: ProvenancePanelProps) {
  const keys = [...new Set(STRATEGY_ORDER.flatMap((strategy) => unconfirmed[strategy]))];

  return (
    <Panel
      title="Unconfirmed inputs"
      caption="Numbers above rest on these until someone confirms them."
      aside={
        <span
          className={`rounded-full px-2.5 py-0.5 text-sm font-medium money ${
            keys.length > 0 ? 'bg-accent-soft text-accent' : 'bg-surface-sunken text-text-muted'
          }`}
        >
          {keys.length}
        </span>
      }
    >
      {keys.length === 0 ? (
        <p className="text-sm text-text-muted">Every input behind these results is confirmed.</p>
      ) : (
        <ul className="divide-y divide-line">
          {keys.map((key) => {
            const { source, note } = inputs[key];
            const affected = STRATEGY_ORDER.filter((s) => unconfirmed[s].includes(key));
            return (
              <li key={key} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="min-w-40 flex-1">
                  <p className="text-sm text-text">
                    {INPUT_LABELS[key]}
                    <span className="ml-2 text-text-muted money">{formatInput(key, inputs)}</span>
                  </p>
                  {note && <p className="mt-0.5 text-xs text-text-faint">{note}</p>}
                </div>
                <span
                  className="flex items-center gap-1"
                  title={`Affects ${affected.map((s) => STRATEGY_META[s].label).join(', ')}`}
                >
                  {affected.map((s) => (
                    <span key={s} className={`size-2 rounded-full ${STRATEGY_META[s].swatch}`} />
                  ))}
                  <span className="sr-only">
                    Affects {affected.map((s) => STRATEGY_META[s].label).join(', ')}
                  </span>
                </span>
                <SourceChip source={source} confirmed={false} />
                <button
                  type="button"
                  onClick={() => onConfirm(key)}
                  className="rounded-control border border-line-strong px-3 py-1 text-xs font-medium text-text hover:bg-surface-sunken"
                >
                  Confirm
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
