import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Tooltip } from 'radix-ui';
import { useMemo, useState } from 'react';
import { type InputKey, type SourcedInputs, analyze, confirm, revise } from '../engine/provenance';
import { rankAt, saleWaterfall } from '../engine/summary';
import type { StrategyKey } from '../engine/types';
import { scenarios } from '../scenarios';
import { liquidationAt, yearlyPoints } from './charts/chartData';
import { SaleWaterfall } from './charts/SaleWaterfall';
import { ChartLegend, ValueChart } from './charts/ValueChart';
import { YearScrubber } from './charts/YearScrubber';
import { AnimatedMoney } from './components/AnimatedMoney';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import type { EditInput } from './components/InputField';
import { InputPanel } from './components/InputPanel';
import { Panel } from './components/Panel';
import { PropertyCard } from './components/PropertyCard';
import { ProvenancePanel } from './components/ProvenancePanel';
import { ScenarioSwitcher } from './components/ScenarioSwitcher';
import { StrategyTabs } from './components/StrategyTabs';
import { StrategyCards } from './components/StrategyCards';
import { rise, stagger } from './motion';

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
    <MotionConfig reducedMotion="user">
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

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={scenarioId}
            variants={stagger}
            initial="hidden"
            animate="shown"
            exit="hidden"
            className="mx-auto max-w-page space-y-6 px-4 py-8 sm:px-6 sm:py-10"
          >
            <motion.div variants={rise}>
              <StrategyCards
                ranking={rankAt(result, month)}
                unconfirmed={unconfirmed}
                yearLabel={`year ${year} (${point.calendarYear})`}
              />
            </motion.div>

            <div className="grid grid-cols-12 gap-6">
              <motion.aside
                variants={rise}
                className="order-last col-span-12 lg:order-first lg:col-span-4"
              >
                <InputPanel inputs={inputs} onEdit={onEdit} onConfirm={onConfirm} />
              </motion.aside>

              <div className="col-span-12 space-y-6 lg:col-span-8">
                <motion.div variants={rise}>
                  <Panel
                    title="After-tax liquidation value"
                    caption="Cash in hand if everything were sold that year, after the loan and all taxes."
                    aside={<ChartLegend />}
                  >
                    <ValueChart
                      points={points}
                      decisionYear={decisionYear}
                      selectedYear={year}
                      onSelectYear={setScrubbedYear}
                    />
                    <YearScrubber
                      year={year}
                      lastYear={lastYear}
                      calendarYear={point.calendarYear}
                      onChange={setScrubbedYear}
                    />
                  </Panel>
                </motion.div>

                <motion.div variants={rise}>
                  <Panel
                    title="Where the sale price goes"
                    caption={
                      soldEarlier
                        ? `Sold in year ${decisionYear}; the proceeds have been invested since.`
                        : `A sale in year ${year}, from price to cash.`
                    }
                    aside={
                      <StrategyTabs selected={waterfallStrategy} onSelect={setWaterfallStrategy} />
                    }
                  >
                    <SaleWaterfall steps={saleWaterfall(liquidation.sale)} />
                    <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-xs text-text-muted sm:grid-cols-4">
                      {[
                        { label: 'Cash account', value: liquidation.cash },
                        { label: 'Tax accrued on rent', value: liquidation.accruedOperatingTax },
                        { label: 'Released loss benefit', value: liquidation.releasedLossBenefit },
                        { label: 'Liquidation value', value: liquidation.value },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd className="mt-1 text-sm text-text">
                            <AnimatedMoney value={value} className="money" />
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </Panel>
                </motion.div>

                <motion.div variants={rise}>
                  <ProvenancePanel
                    inputs={inputs}
                    unconfirmed={unconfirmed}
                    onConfirm={onConfirm}
                  />
                </motion.div>
              </div>
            </div>
          </motion.main>
        </AnimatePresence>
        <Footer />
      </Tooltip.Provider>
    </MotionConfig>
  );
}
