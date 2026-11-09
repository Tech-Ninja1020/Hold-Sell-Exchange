import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { type Cents, roundCents } from '../../engine/money';
import { formatMoney } from '../format';
import { EASE_OUT } from '../motion';

type AnimatedMoneyProps = { value: Cents; className?: string };

export function AnimatedMoney({ value, className }: AnimatedMoneyProps) {
  const reduced = useReducedMotion();
  const shown = useMotionValue<number>(value);
  const text = useTransform(shown, (amount) => formatMoney(roundCents(amount)));

  useEffect(() => {
    if (reduced) {
      shown.set(value);
      return;
    }
    const controls = animate(shown, value, { duration: 0.6, ease: EASE_OUT });
    return () => controls.stop();
  }, [value, reduced, shown]);

  return <motion.span className={className}>{text}</motion.span>;
}
