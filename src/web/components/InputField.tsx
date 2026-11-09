import { Slider, Switch } from 'radix-ui';
import type { InputKey, SourcedInputs } from '../../engine/provenance';
import type { Inputs } from '../../engine/types';
import { type Field, INPUT_LABELS, formatInput, fromSlider, toSlider } from '../fields';
import { ConfirmToggle } from './ConfirmToggle';
import { SourceChip } from './SourceChip';

export type EditInput = <K extends InputKey>(key: K, value: Inputs[K]) => void;

type InputFieldProps = {
  field: Field;
  inputs: SourcedInputs;
  onEdit: EditInput;
  onConfirm: (key: InputKey) => void;
};

export function InputField({ field, inputs, onEdit, onConfirm }: InputFieldProps) {
  const { source, confirmed, note } = inputs[field.key];
  const label = INPUT_LABELS[field.key];
  const display = formatInput(field.key, inputs);

  return (
    <div className="border-t border-line py-4 first:border-t-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-text">{label}</span>
        <span className="text-sm font-medium text-text money">{display}</span>
      </div>

      {field.kind === 'toggle' && (
        <Switch.Root
          checked={inputs.niit.value}
          onCheckedChange={(checked) => onEdit('niit', checked)}
          aria-label={label}
          className="relative mt-3 block h-5 w-9 rounded-full bg-line-strong transition-colors data-[state=checked]:bg-accent"
        >
          <Switch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform data-[state=checked]:translate-x-4.5" />
        </Switch.Root>
      )}

      {'min' in field && (
        <Slider.Root
          className="relative mt-3 flex h-5 touch-none items-center select-none"
          min={field.min}
          max={field.maxKey ? toSlider(field.kind, inputs[field.maxKey].value) : field.max}
          step={field.step}
          value={[toSlider(field.kind, inputs[field.key].value)]}
          onValueChange={([position]) => {
            if (position !== undefined) onEdit(field.key, fromSlider(field.kind, position));
          }}
        >
          <Slider.Track className="relative h-1 grow rounded-full bg-surface-sunken">
            <Slider.Range className="absolute h-full rounded-full bg-accent" />
          </Slider.Track>
          <Slider.Thumb
            aria-label={label}
            className="group relative block size-4 rounded-full border border-line-strong bg-surface shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-control bg-ink px-2 py-0.5 text-xs whitespace-nowrap text-on-ink money opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100">
              {display}
            </span>
          </Slider.Thumb>
        </Slider.Root>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <SourceChip source={source} confirmed={confirmed} note={note} />
        <ConfirmToggle label={label} confirmed={confirmed} onConfirm={() => onConfirm(field.key)} />
      </div>
    </div>
  );
}
