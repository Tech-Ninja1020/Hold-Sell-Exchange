import { AnimatePresence, motion } from 'motion/react';
import type { SourcedInputs } from '../../engine/provenance';
import type { Scenario } from '../../scenarios';
import { formatMoney, formatMonth, formatRate } from '../format';
import { AnimatedMoney } from './AnimatedMoney';

type PropertyCardProps = { scenario: Scenario; inputs: SourcedInputs };

export function PropertyCard({ scenario, inputs }: PropertyCardProps) {
  const stats = [
    { label: 'Purchased', value: formatMonth(inputs.purchaseDate.value) },
    { label: 'Loan', value: formatMoney(inputs.loanAmount.value) },
    { label: 'Rate', value: formatRate(inputs.loanRate.value) },
    { label: 'Rent', value: `${formatMoney(inputs.monthlyRent.value)}/mo` },
  ];

  return (
    <div className="rounded-card border border-ink-line bg-ink-raised p-5 sm:p-6">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={scenario.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-eyebrow text-on-ink-muted uppercase">{scenario.propertyType}</p>
              <p className="mt-1 font-display text-2xl text-on-ink">{scenario.address}</p>
            </div>
            <AnimatedMoney
              value={inputs.purchasePrice.value}
              className="font-display text-2xl text-on-ink money"
            />
          </div>
          <p className="mt-3 text-sm text-on-ink-muted">{scenario.summary}</p>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-ink-line pt-5 sm:grid-cols-4">
            {stats.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-eyebrow text-on-ink-muted uppercase">{label}</dt>
                <dd className="mt-1 text-sm text-on-ink money">{value}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
