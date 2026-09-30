import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Badge, Card, CardHead, Insight } from './CommonUI';
import { ChartFrame } from './Charts';

// Stage 4: EOQ as a time series with the drivers of its change — never a single static number (design bible §4 Stage 4).
const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
// Each series is expressed relative to the current (2026) value so the chart follows the selected material.
const D_RATIO = [0.604, 0.635, 0.667, 0.688, 0.74, 0.792, 0.76, 0.833, 0.885, 0.927, 0.969, 1];
const S_RATIO = [0.913, 0.913, 0.935, 0.935, 0.957, 0.957, 0.978, 0.978, 1, 1, 1, 1];
const H_RATIO = [0.667, 0.694, 0.722, 0.722, 0.778, 0.833, 0.806, 0.861, 0.917, 0.944, 0.972, 1];

const fmt = (v, d = 0) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(1)}%`;

export default function EoqTimeSeries({ demand, orderingCost, holdingCostPerUnit, uom = 'EA', material, currencySymbol = '₹' }) {
  const series = YEARS.map((year, i) => {
    const D = demand * D_RATIO[i];
    const S = orderingCost * S_RATIO[i];
    const H = holdingCostPerUnit * H_RATIO[i];
    return { year, D, S, H, q: Math.sqrt((2 * D * S) / H) };
  });
  const first = series[0];
  const last = series[series.length - 1];

  // Q* = sqrt(2DS/H): each driver's effect is the square root of its own ratio, and the effects multiply.
  const fDemand = Math.sqrt(last.D / first.D) - 1;
  const fOrdering = Math.sqrt(last.S / first.S) - 1;
  const fHolding = Math.sqrt(first.H / last.H) - 1;
  const total = last.q / first.q - 1;

  const W = 900, H = 240, ML = 64, MR = 40, MT = 28, MB = 36;
  const qMin = Math.floor(Math.min(...series.map((s) => s.q)) * 0.9);
  const qMax = Math.ceil(Math.max(...series.map((s) => s.q)) * 1.08);
  const x = (i) => ML + (i / (series.length - 1)) * (W - ML - MR);
  const y = (v) => MT + (1 - (v - qMin) / (qMax - qMin)) * (H - MT - MB);
  const path = series.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(s.q).toFixed(1)}`).join(' ');
  const ticks = [0, 0.5, 1].map((f) => qMin + (qMax - qMin) * f);

  const drivers = [
    { label: 'Demand', value: fDemand, why: `Annual demand grew from ${fmt(first.D)} to ${fmt(last.D)} ${uom}, so larger orders now make sense.` },
    { label: 'Ordering cost', value: fOrdering, why: `Each order now costs ${currencySymbol}${fmt(last.S)} to place, up from ${currencySymbol}${fmt(first.S)}.` },
    { label: 'Carrying cost', value: fHolding, why: `Holding a unit costs ${currencySymbol}${fmt(last.H, 2)} a year, up from ${currencySymbol}${fmt(first.H, 2)}, which pushes towards smaller orders.` },
  ];

  return (
    <div className="space-y-4 mb-6">
      <Insight label="Economic order quantity">
        The economic order quantity for {material} has moved <span className="metric">{pct(total)}</span> since {first.year}, from{' '}
        <span className="metric">{fmt(first.q)} {uom}</span> to <span className="metric">{fmt(last.q)} {uom}</span>. Growing demand
        pushed it up; a higher carrying cost pulled it back down.
      </Insight>

      <Card className="mb-0">
        <CardHead
          title="EOQ over time"
          sub="Recomputed each year from that year's demand, ordering cost and carrying cost."
          right={<Badge tone="neutral" shape={false}>Example data</Badge>}
        />
        <ChartFrame
          label="EOQ over time"
          legend={[
            { label: `EOQ (${uom} per order)`, kind: 'line', color: 'var(--s1)' },
          ]}
          table={{
            columns: ['Year', `Demand (${uom}/yr)`, `Ordering cost (${currencySymbol})`, `Carrying cost (${currencySymbol}/unit/yr)`, `EOQ (${uom})`],
            rows: series.map((s) => [String(s.year), fmt(s.D), `${currencySymbol}${fmt(s.S)}`, `${currencySymbol}${fmt(s.H, 2)}`, fmt(s.q, 1)]),
          }}
        >
          <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="EOQ by year">
            {ticks.map((v) => (
              <g key={v}>
                <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="var(--border)" />
                <text x={8} y={y(v) + 4} fontSize={12} fill="var(--subtle)">{fmt(v)}</text>
              </g>
            ))}
            <path d={path} fill="none" stroke="var(--s1)" strokeWidth={2} />
            {series.map((s, i) => (
              <g key={s.year}>
                <circle cx={x(i)} cy={y(s.q)} r={3.5} fill="var(--s1)" stroke="var(--surface)" strokeWidth={1} />
                <text x={x(i)} y={H - MB + 16} fontSize={12} fill="var(--subtle)" textAnchor="middle">{s.year}</text>
              </g>
            ))}
            <text x={x(0)} y={y(first.q) - 10} fontSize={12} fill="var(--ink)" fontWeight={600} textAnchor="start">{fmt(first.q)} {uom}</text>
            <text x={x(series.length - 1)} y={y(last.q) - 10} fontSize={12} fill="var(--ink)" fontWeight={600} textAnchor="end">{fmt(last.q)} {uom}</text>
            <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="var(--border-strong)" />
          </svg>
        </ChartFrame>

        <div className="eoq-drivers" role="list" aria-label={`What changed between ${first.year} and ${last.year}`}>
          {drivers.map((d) => (
            <div key={d.label} className="eoq-driver" role="listitem">
              <span className="eyebrow">{d.label}</span>
              <span className="num eoq-driver__val">
                {d.value >= 0 ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />}
                {pct(d.value)}
              </span>
              <span className="eoq-driver__why">{d.why}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
