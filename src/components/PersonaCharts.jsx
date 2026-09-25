import React from 'react';
import { ChartFrame } from './Charts';

/*
 * Charts for the "Understand & Plan" section. Same method as Charts.jsx: thin marks, receding gridlines,
 * categorical colours in fixed order (--s1 today, --s2 projected), a legend and a "View as table" view.
 */

const INK = 'var(--ink)';
const SUBTLE = 'var(--subtle)';
const GRID = 'var(--border)';

// Today vs projected, one pair of thin bars per item, with an optional threshold tick per item
// (a lead time, a reorder point). Used where the question is "how far are we from the line that matters".
export function CompareBars({ label, rows, mode, fmt, unit, markerLabel, projectedLabel, tableColumns }) {
  const W = 900;
  const labelW = 190;
  const padR = 64;
  const rowH = 38;
  const top = 6;
  const H = top + rows.length * rowH + 22;
  const plotW = W - labelW - padR;
  const max = Math.max(...rows.flatMap((r) => [r.now, r.nothing, r.act, r.marker ?? 0])) * 1.08 || 1;
  const x = (v) => labelW + (Math.max(v, 0) / max) * plotW;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);

  const table = {
    columns: tableColumns,
    rows: rows.map((r) => [r.label, fmt(r.now), fmt(r.nothing), fmt(r.act), ...(markerLabel ? [r.marker == null ? '' : fmt(r.marker)] : [])]),
  };

  const legend = [
    { label: `Today (${unit})`, color: 'var(--s1)' },
    { label: projectedLabel[mode], color: 'var(--s2)' },
    ...(markerLabel ? [{ label: markerLabel, color: INK, kind: 'dash' }] : []),
  ];

  return (
    <ChartFrame label={label} legend={legend} table={table}>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${rows.map((r) => `${r.label} ${fmt(r.now)} today, ${fmt(mode === 'act' ? r.act : r.nothing)} projected`).join('; ')}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={top} y2={H - 22} stroke={GRID} strokeWidth="1" />
            <text x={x(t)} y={H - 6} textAnchor="middle" fontSize="11" fill={SUBTLE}>{fmt(t)}</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = top + i * rowH;
          const projected = mode === 'act' ? r.act : r.nothing;
          return (
            <g key={r.label}>
              <text x={labelW - 10} y={y + rowH / 2 + 4} textAnchor="end" fontSize="12" fill={INK}>{r.label}</text>
              <rect x={labelW} y={y + 6} width={Math.max(x(r.now) - labelW, 1)} height="9" rx="2" fill="var(--s1)" />
              <rect x={labelW} y={y + 18} width={Math.max(x(projected) - labelW, 1)} height="9" rx="2" fill="var(--s2)" />
              <text x={x(Math.max(r.now, projected)) + 6} y={y + rowH / 2 + 4} fontSize="11" fill={SUBTLE}>{fmt(projected)}</text>
              {r.marker != null && (
                <line x1={x(r.marker)} x2={x(r.marker)} y1={y + 2} y2={y + rowH - 4} stroke={INK} strokeWidth="1.5" strokeDasharray="3 2" />
              )}
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
}

// Stock over the coming weeks under one or more demand cases, against a safety-stock line.
export function RunwayLines({ label, weeks, series, threshold, unit, table }) {
  const W = 900;
  const H = 260;
  const l = 60;
  const r = 20;
  const t = 12;
  const b = 30;
  const max = Math.max(...series.flatMap((s) => s.values), threshold.value) * 1.08 || 1;
  const x = (i) => l + (i / (weeks.length - 1)) * (W - l - r);
  const y = (v) => t + (1 - Math.max(v, 0) / max) * (H - t - b);
  const path = (values) => values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const yTicks = [0, 0.5, 1].map((f) => f * max);

  const legend = [
    ...series.map((s) => ({ label: s.label, color: s.color, kind: s.dash ? 'dash' : 'line' })),
    { label: threshold.label, color: 'var(--subtle)', kind: 'dash' },
  ];

  return (
    <ChartFrame label={label} legend={legend} table={table}>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}, ${unit} over ${weeks.length - 1} weeks`}>
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={l} x2={W - r} y1={y(v)} y2={y(v)} stroke={GRID} strokeWidth="1" />
            <text x={l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill={SUBTLE}>{Math.round(v).toLocaleString()}</text>
          </g>
        ))}
        {weeks.map((w, i) => (
          <text key={w} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill={SUBTLE}>{w}</text>
        ))}
        <line x1={l} x2={W - r} y1={y(threshold.value)} y2={y(threshold.value)} stroke={SUBTLE} strokeWidth="1.25" strokeDasharray="4 3" />
        {series.map((s) => (
          <path key={s.label} d={path(s.values)} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash ? '5 4' : undefined} strokeLinejoin="round" />
        ))}
      </svg>
    </ChartFrame>
  );
}
