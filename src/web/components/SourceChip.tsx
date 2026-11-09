import { Tooltip } from 'radix-ui';
import type { Source } from '../../engine/provenance';
import { SOURCE_LABELS } from '../fields';

type SourceChipProps = { source: Source; confirmed: boolean; note?: string };

export function SourceChip({ source, confirmed, note }: SourceChipProps) {
  const chip = (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-sunken px-2 py-0.5 text-xs text-text-muted">
      <span
        className={`size-1.5 rounded-full ${confirmed ? 'bg-hold' : 'bg-unconfirmed'}`}
        aria-hidden
      />
      {SOURCE_LABELS[source]}
      <span className="sr-only">{confirmed ? ', confirmed' : ', unconfirmed'}</span>
    </span>
  );
  if (!note) return chip;

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button type="button" className="rounded-full">
          {chip}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={6}
          className="max-w-60 rounded-control bg-ink px-2.5 py-1.5 text-xs text-on-ink shadow-lift"
        >
          {note}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
