import { Tabs, Tooltip } from 'radix-ui';
import { useMemo, useState } from 'react';
import { type InputKey, type SourcedInputs, analyze, confirm, revise } from '../engine/provenance';
import { rankAt, saleWaterfall } from '../engine/summary';
import type { StrategyKey } from '../engine/types';
import { scenarios } from '../scenarios';
import { liquidationAt, yearlyPoints } from './charts/chartData';
import { SaleWaterfall } from './charts/SaleWaterfall';
import { ChartLegend, ValueChart } from './charts/ValueChart';
import { YearScrubber } from './charts/YearScrubber';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import type { EditInput } from './components/InputField';
import { InputPanel } from './components/InputPanel';
import { Panel } from './components/Panel';
import { PropertyCard } from './components/PropertyCard';
import { ProvenancePanel } from './components/ProvenancePanel';
import { ScenarioSwitcher } from './components/ScenarioSwitcher';
import { StrategyCards } from './components/StrategyCards';
import { formatMoney } from './format';
import { STRATEGY_META, STRATEGY_ORDER } from './strategies';

const initialInputs = (): Record<string, SourcedInputs> =>
  Object.fromEntries(scenarios.map((scenario) => [scenario.id, scenario.inputs]));

export function App() {
  const [scenarioId, setScenarioId] = useState(scenarios[0]!.id);
  const [inputsById, setInputsById] = useState(initialInputs);
  const [scrubbedYear, setScrubbedYear] = useState<number | null>(null);
  const [waterfallStrategy, setWaterfallStrategy] = useState<StrategyKey>('hold');

  const scenario = scenarios.find((s) => s.id === scenarioId)!;
  const inputs = inputsById[scenarioId]!;
  const { result, unconfirmed } = useMemo(() => analyze(inputs), [inputs]);
  const points = useMemo(() => yearlyPoints(result), [result]);

  const lastYear = points.length;
  const year = Math.min(scrubbedYear ?? lastYear, lastYear);
  const point = points[year - 1]!;
  const month = year * 12;
  const decisionYear = result.decisionMonth / 12;

  const update = (next: SourcedInputs) => setInputsById((all) => ({ ...all, [scenarioId]: next }));
  const onEdit: EditInput = (key, value) => update(revise(inputs, key, value));
  const onConfirm = (key: InputKey) => update(confirm(inputs, key));

  const liquidation = liquidationAt(result, waterfallStrategy, month);
  const soldEarlier = waterfallStrategy === 'sell' && year > decisionYear;

  return (
    <Tooltip.Provider delayDuration={150}>
      <Hero
        switcher={
          <ScenarioSwitcher
            scenarios={scenarios}
            selected={scenarioId}
            onSelect={(id) => {
              setScenarioId(id);
              setScrubbedYear(null);
            }}
          />
        }
        property={<PropertyCard scenario={scenario} inputs={inputs} />}
      />

      <main className="mx-auto max-w-page space-y-6 px-6 py-10">
        <StrategyCards
          ranking={rankAt(result, month)}
          unconfirmed={unconfirmed}
          yearLabel={`year ${year} (${point.calendarYear})`}
        />

        <div className="grid grid-cols-12 gap-6">
          <aside className="order-last col-span-12 lg:order-first lg:col-span-4">
            <InputPanel inputs={inputs} onEdit={onEdit} onConfirm={onConfirm} />
          </aside>

          <div className="col-span-12 space-y-6 lg:col-span-8">
            <Panel
              title="After-tax liquidation value"
              caption="Cash in hand if everything were sold that year, after the loan and all taxes."
              aside={<ChartLegend />}
            >
              <ValueChart points={points} decisionYear={decisionYear} selectedYear={year} />
              <YearScrubber
                year={year}
                lastYear={lastYear}
                calendarYear={point.calendarYear}
                onChange={setScrubbedYear}
              />
            </Panel>

            <Panel
              title="Where the sale price goes"
              caption={
                soldEarlier
                  ? `Sold in year ${decisionYear}; the proceeds have been invested since.`
                  : `A sale in year ${year}, from price to cash.`
              }
              aside={
                <Tabs.Root
                  value={waterfallStrategy}
                  onValueChange={(key) => setWaterfallStrategy(key as StrategyKey)}
                >
                  <Tabs.List
                    aria-label="Strategy"
                    className="inline-flex rounded-full border border-line bg-surface-sunken p-0.5"
                  >
                    {STRATEGY_ORDER.map((key) => (
                      <Tabs.Trigger
                        key={key}
                        value={key}
                        className="rounded-full px-3 py-1 text-xs whitespace-nowrap text-text-muted data-[state=active]:bg-surface data-[state=active]:text-text data-[state=active]:shadow-sm"
                      >
                        {STRATEGY_META[key].label}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>
                </Tabs.Root>
              }
            >
              <SaleWaterfall steps={saleWaterfall(liquidation.sale)} />
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-xs text-text-muted sm:grid-cols-4">
                <div>
                  <dt>Cash account</dt>
                  <dd className="mt-1 text-sm text-text money">{formatMoney(liquidation.cash)}</dd>
                </div>
                <div>
                  <dt>Tax accrued on rent</dt>
                  <dd className="mt-1 text-sm text-text money">
                    {formatMoney(liquidation.accruedOperatingTax)}
                  </dd>
                </div>
                <div>
                  <dt>Released loss benefit</dt>
                  <dd className="mt-1 text-sm text-text money">
                    {formatMoney(liquidation.releasedLossBenefit)}
                  </dd>
                </div>
                <div>
                  <dt>Liquidation value</dt>
                  <dd className="mt-1 text-sm font-medium text-text money">
                    {formatMoney(liquidation.value)}
                  </dd>
                </div>
              </dl>
            </Panel>

            <ProvenancePanel inputs={inputs} unconfirmed={unconfirmed} onConfirm={onConfirm} />
          </div>
        </div>
      </main>
      <Footer />
    </Tooltip.Provider>
  );
}
