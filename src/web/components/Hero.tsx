import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { rise, stagger } from '../motion';
import { ThemeToggle } from './ThemeToggle';

type HeroProps = { switcher: ReactNode; property: ReactNode };

export function Hero({ switcher, property }: HeroProps) {
  return (
    <header className="relative overflow-hidden bg-ink text-on-ink">
      <div className="hero-lines absolute inset-0" aria-hidden />
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="shown"
        className="relative mx-auto grid max-w-page grid-cols-12 items-end gap-x-6 gap-y-8 px-4 py-10 sm:px-6 sm:py-14"
      >
        <motion.div variants={rise} className="col-span-12 lg:col-span-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-eyebrow text-on-ink-muted uppercase">Rental property analysis</p>
            <ThemeToggle />
          </div>
          <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-hero">
            Hold, sell, or exchange
          </h1>
          <p className="mt-4 max-w-md text-base text-on-ink-muted">
            What a rental property is worth after tax under each choice, month by month, and which
            inputs nobody has confirmed yet.
          </p>
          <div className="mt-8">{switcher}</div>
        </motion.div>
        <motion.div variants={rise} className="col-span-12 lg:col-span-6">
          {property}
        </motion.div>
      </motion.div>
    </header>
  );
}
