import { motion } from 'motion/react';
import { useState } from 'react';
import type { WaterfallKey, WaterfallStep } from '../../engine/summary';
import { AnimatedMoney } from '../components/AnimatedMoney';
import { EASE_OUT } from '../motion';

type SaleWaterfallProps = { steps: WaterfallStep[] };

const STEP_META: Record<WaterfallKey, { label: string; bar: string }> = {
  salePrice: { label: 'Sale price', bar: 'bg-text' },
  sellingCosts: { label: 'Selling costs', bar: 'bg-line-strong' },
  loanPayoff: { label: 'Loan payoff', bar: 'bg-text-faint' },
  recaptureTax: { label: 'Recapture tax', bar: 'bg-negative' },
  capitalGainsTax: { label: 'Capital gains tax', bar: 'bg-negative' },
  niit: { label: 'Net investment tax', bar: 'bg-negative' },
  stateTax: { label: 'State tax', bar: 'bg-negative' },
  netCash: { label: 'Net cash', bar: 'bg-accent' },
};

const TOTALS: WaterfallKey[] = ['salePrice', 'netCash'];

export function SaleWaterfall({ steps }: SaleWaterfallProps) {
  const [entered, setEntered] = useState(false);
  const scale = steps[0]!.amount;
  const percent = (amount: number) => Math.min(Math.max(amount / scale, 0), 1) * 100;

  return (
    <ol className="space-y-2.5">
      {steps.map(({ key, amount, from, to }, index) => {
        const total = TOTALS.includes(key);
        const left = percent(Math.min(from, to));
        const width = percent(Math.max(from, to)) - left;
        const last = index === steps.length - 1;
        return (
          <li
            key={key}
            className="grid grid-cols-[6.5rem_1fr_5.5rem] items-center gap-3 text-xs sm:grid-cols-[10rem_1fr_7rem] sm:text-sm"
          >
            <span className={total ? 'font-medium text-text' : 'text-text-muted'}>
              {STEP_META[key].label}
            </span>
            <span className="relative h-5 rounded-[3px] bg-surface-sunken">
              <motion.span
                className={`absolute inset-y-0 rounded-[3px] ${STEP_META[key].bar}`}
                initial={{ left: `${left}%`, width: '0%' }}
                animate={{ left: `${left}%`, width: `${width}%` }}
                transition={{ duration: 0.45, ease: EASE_OUT, delay: entered ? 0 : index * 0.05 }}
                onAnimationComplete={() => last && setEntered(true)}
              />
            </span>
            <span className={`text-right ${total ? 'font-medium text-text' : 'text-text-muted'}`}>
              {!total && amount !== 0 && '-'}
              <AnimatedMoney value={amount} className="money" />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
