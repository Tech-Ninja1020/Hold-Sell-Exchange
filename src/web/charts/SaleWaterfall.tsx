import type { WaterfallKey, WaterfallStep } from '../../engine/summary';
import { formatMoney } from '../format';

type SaleWaterfallProps = { steps: WaterfallStep[] };

const STEP_META: Record<WaterfallKey, { label: string; bar: string }> = {
  salePrice: { label: 'Sale price', bar: 'bg-text' },
  sellingCosts: { label: 'Selling costs', bar: 'bg-line-strong' },
  loanPayoff: { label: 'Loan payoff', bar: 'bg-text-faint' },
  recaptureTax: { label: 'Recapture tax', bar: 'bg-negative' },
  capitalGainsTax: { label: 'Capital gains tax', bar: 'bg-negative' },
  niit: { label: 'Net investment income tax', bar: 'bg-negative' },
  stateTax: { label: 'State tax', bar: 'bg-negative' },
  netCash: { label: 'Net cash', bar: 'bg-accent' },
};

const TOTALS: WaterfallKey[] = ['salePrice', 'netCash'];

export function SaleWaterfall({ steps }: SaleWaterfallProps) {
  const scale = steps[0]!.amount;
  const position = (amount: number) => `${Math.min(Math.max(amount / scale, 0), 1) * 100}%`;

  return (
    <ol className="space-y-2.5">
      {steps.map(({ key, amount, from, to }) => {
        const total = TOTALS.includes(key);
        const low = Math.min(from, to);
        const high = Math.max(from, to);
        return (
          <li
            key={key}
            className="grid grid-cols-[minmax(0,9rem)_1fr_minmax(0,6.5rem)] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_7rem]"
          >
            <span className={total ? 'font-medium text-text' : 'text-text-muted'}>
              {STEP_META[key].label}
            </span>
            <span className="relative h-5 rounded-[3px] bg-surface-sunken">
              <span
                className={`absolute inset-y-0 rounded-[3px] ${STEP_META[key].bar}`}
                style={{ left: position(low), right: `calc(100% - ${position(high)})` }}
              />
            </span>
            <span
              className={`text-right money ${total ? 'font-medium text-text' : 'text-text-muted'}`}
            >
              {total || amount === 0 ? formatMoney(amount) : `-${formatMoney(amount)}`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
