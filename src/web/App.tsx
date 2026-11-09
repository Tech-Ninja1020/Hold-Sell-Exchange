const strategies = [
  { name: 'Hold', swatch: 'bg-hold' },
  { name: 'Hold, step-up', swatch: 'bg-hold-stepup' },
  { name: 'Sell', swatch: 'bg-sell' },
  { name: 'Exchange', swatch: 'bg-exchange' },
];

export function App() {
  return (
    <div className="min-h-screen">
      <header className="bg-ink text-on-ink">
        <div className="mx-auto max-w-page px-6 py-16">
          <p className="text-eyebrow text-on-ink-muted uppercase">Rental property analysis</p>
          <h1 className="mt-3 font-display text-hero">Hold, sell, or exchange</h1>
        </div>
      </header>
      <main className="mx-auto grid max-w-page grid-cols-12 gap-6 px-6 py-12">
        {strategies.map(({ name, swatch }) => (
          <div
            key={name}
            className="col-span-12 rounded-card border border-line bg-surface p-6 shadow-card sm:col-span-6 lg:col-span-3"
          >
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${swatch}`} />
              <span className="text-sm text-text-muted">{name}</span>
            </div>
            <p className="mt-4 font-display text-figure money">$0</p>
          </div>
        ))}
      </main>
    </div>
  );
}
