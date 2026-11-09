import { Accordion } from 'radix-ui';
import type { InputKey, SourcedInputs } from '../../engine/provenance';
import { FIELDS, GROUPS } from '../fields';
import { type EditInput, InputField } from './InputField';

type InputPanelProps = {
  inputs: SourcedInputs;
  onEdit: EditInput;
  onConfirm: (key: InputKey) => void;
};

export function InputPanel({ inputs, onEdit, onConfirm }: InputPanelProps) {
  return (
    <Accordion.Root type="multiple" defaultValue={['market']} className="space-y-3">
      {GROUPS.map(({ id, title }) => {
        const fields = FIELDS.filter((field) => field.group === id);
        const open = fields.filter((field) => !inputs[field.key].confirmed).length;
        return (
          <Accordion.Item
            key={id}
            value={id}
            className="rounded-card border border-line bg-surface shadow-card"
          >
            <Accordion.Header>
              <Accordion.Trigger className="group flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
                <span className="font-display text-lg text-text">{title}</span>
                <span className="flex items-center gap-3 text-xs text-text-muted">
                  {open > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-unconfirmed" aria-hidden />
                      {open} unconfirmed
                    </span>
                  )}
                  <svg
                    viewBox="0 0 12 12"
                    className="size-3 transition-transform group-data-[state=open]:rotate-180"
                    aria-hidden
                  >
                    <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="border-t border-line px-5">
              {fields.map((field) => (
                <InputField
                  key={field.key}
                  field={field}
                  inputs={inputs}
                  onEdit={onEdit}
                  onConfirm={onConfirm}
                />
              ))}
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
}
