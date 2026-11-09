import { Switch } from 'radix-ui';

type ConfirmToggleProps = { label: string; confirmed: boolean; onConfirm: () => void };

export function ConfirmToggle({ label, confirmed, onConfirm }: ConfirmToggleProps) {
  return (
    <label className="flex items-center gap-2 text-xs text-text-muted">
      {confirmed ? 'Confirmed' : 'Confirm'}
      <Switch.Root
        checked={confirmed}
        disabled={confirmed}
        onCheckedChange={onConfirm}
        aria-label={`Confirm ${label}`}
        className="relative h-4 w-7 rounded-full bg-line-strong transition-colors data-[state=checked]:bg-hold"
      >
        <Switch.Thumb className="block size-3 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] data-[state=checked]:translate-x-3.5" />
      </Switch.Root>
    </label>
  );
}
