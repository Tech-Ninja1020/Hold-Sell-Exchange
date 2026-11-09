import type { Transition, Variants } from 'motion/react';

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const SPRING: Transition = { type: 'spring', stiffness: 420, damping: 34 };

export const stagger: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.2, staggerChildren: 0.07 } },
};

export const rise: Variants = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};
