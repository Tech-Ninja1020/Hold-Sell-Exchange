import type { SourcedInputs } from '../../engine/provenance';
import type { Scenario } from '../../scenarios';
import { formatMoney, formatMonth, formatRate } from '../format';

type PropertyCardProps = { scenario: Scenario; inputs: SourcedInputs };

export function PropertyCard({ scenario, inputs }: PropertyCardProps) {
  const stats = [
    { label: 'Purchased', value: formatMonth(inputs.purchaseDate.value) },
    { label: 'Loan', value: formatMoney(inputs.loanAmount.value) },
    { label: 'Rate', value: formatRate(inputs.loanRate.value) },
    { label: 'Rent', value: `${formatMoney(inputs.monthlyRent.value)}/mo` },
  ];

  return (
    <div className="rounded-card border border-ink-line bg-ink-raised p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-eyebrow text-on-ink-muted uppercase">{scenario.propertyType}</p>
          <p className="mt-1 font-display text-2xl text-on-ink">{scenario.address}</p>
        </div>
        <p className="font-display text-2xl text-on-ink money">
          {formatMoney(inputs.purchasePrice.value)}
        </p>
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
    </div>
  );
}
