import type { ReactNode } from 'react';

type HeroProps = { switcher: ReactNode; property: ReactNode };

export function Hero({ switcher, property }: HeroProps) {
  return (
    <header className="relative overflow-hidden bg-ink text-on-ink">
      <div className="hero-lines absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-page grid-cols-12 items-end gap-x-6 gap-y-10 px-6 py-14">
        <div className="col-span-12 lg:col-span-6">
          <p className="text-eyebrow text-on-ink-muted uppercase">Rental property analysis</p>
          <h1 className="mt-3 font-display text-hero">Hold, sell, or exchange</h1>
          <p className="mt-4 max-w-md text-base text-on-ink-muted">
            What a rental property is worth after tax under each choice, month by month, and which
            inputs nobody has confirmed yet.
          </p>
          <div className="mt-8">{switcher}</div>
        </div>
        <div className="col-span-12 lg:col-span-6">{property}</div>
      </div>
    </header>
  );
}
