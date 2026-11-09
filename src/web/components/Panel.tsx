import type { ReactNode } from 'react';

type PanelProps = {
  title: string;
  caption?: string;
  aside?: ReactNode;
  children: ReactNode;
};

export function Panel({ title, caption, aside, children }: PanelProps) {
  return (
    <section className="rounded-card border border-line bg-surface shadow-card">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-6 pt-5">
        <div>
          <h2 className="font-display text-xl text-text">{title}</h2>
          {caption && <p className="mt-1 text-sm text-text-muted">{caption}</p>}
        </div>
        {aside}
      </header>
      <div className="px-6 pt-4 pb-6">{children}</div>
    </section>
  );
}
