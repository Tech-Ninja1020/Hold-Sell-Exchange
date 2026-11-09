import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney, formatMoneyCompact } from '../format';
import { STRATEGY_META, STRATEGY_ORDER } from '../strategies';
import type { ChartPoint } from './chartData';

type ValueChartProps = { points: ChartPoint[]; decisionYear: number; selectedYear: number };

const axisTick = { fill: 'var(--text-faint)', fontSize: 12 };

function PointCard({ point }: { point: ChartPoint }) {
  const ranked = [...STRATEGY_ORDER].sort((a, b) => point[b] - point[a]);
  return (
    <div className="min-w-52 rounded-control border border-line bg-surface px-3 py-2.5 shadow-lift">
      <p className="text-xs text-text-muted">
        Year {point.year} <span className="text-text-faint">· {point.calendarYear}</span>
      </p>
      <ul className="mt-2 space-y-1.5">
        {ranked.map((key) => (
          <li key={key} className="flex items-center justify-between gap-6 text-sm">
            <span className="flex items-center gap-2 text-text-muted">
              <span className={`size-2 rounded-full ${STRATEGY_META[key].swatch}`} aria-hidden />
              {STRATEGY_META[key].label}
            </span>
            <span className="font-medium text-text money">{formatMoney(point[key])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartLegend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-muted">
      {STRATEGY_ORDER.map((key) => (
        <li key={key} className="flex items-center gap-2">
          <svg width="18" height="6" aria-hidden>
            <line
              x1="0"
              y1="3"
              x2="18"
              y2="3"
              stroke={STRATEGY_META[key].color}
              strokeWidth="2"
              strokeDasharray={STRATEGY_META[key].dashed ? '5 3' : undefined}
            />
          </svg>
          {STRATEGY_META[key].label}
        </li>
      ))}
    </ul>
  );
}

export function ValueChart({ points, decisionYear, selectedYear }: ValueChartProps) {
  const lastYear = points.length;
  const ticks = points.map((p) => p.year).filter((year) => year === 1 || year % 5 === 0);

  return (
    <div className="h-80 sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 24, right: 12, bottom: 0, left: 0 }}>
          <defs>
            {STRATEGY_ORDER.map((key) => (
              <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={STRATEGY_META[key].color} stopOpacity={0.16} />
                <stop offset="100%" stopColor={STRATEGY_META[key].color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis
            dataKey="year"
            type="number"
            domain={[1, lastYear]}
            ticks={ticks}
            tick={axisTick}
            tickLine={false}
            axisLine={{ stroke: 'var(--line-strong)' }}
            tickFormatter={(year: number) => `Yr ${year}`}
          />
          <YAxis
            width={60}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatMoneyCompact}
          />
          <Tooltip
            cursor={{ stroke: 'var(--line-strong)' }}
            isAnimationActive={false}
            content={({ active, label }) => {
              const point = active ? points[Number(label) - 1] : undefined;
              return point ? <PointCard point={point} /> : null;
            }}
          />
          <ReferenceLine
            x={decisionYear}
            stroke="var(--accent)"
            strokeDasharray="4 4"
            label={{ value: 'Decision', position: 'top', fill: 'var(--accent)', fontSize: 11 }}
          />
          <ReferenceLine x={selectedYear} stroke="var(--text)" strokeWidth={1} />
          {STRATEGY_ORDER.map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={STRATEGY_META[key].label}
              stroke={STRATEGY_META[key].color}
              strokeWidth={2}
              strokeDasharray={STRATEGY_META[key].dashed ? '6 4' : undefined}
              fill={`url(#fill-${key})`}
              dot={false}
              activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
