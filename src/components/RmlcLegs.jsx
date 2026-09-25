import React from 'react';
import { Badge, Card, CardHead, Insight, DrillDown } from './CommonUI';

// Stage 5: how long money stays tied up, and WHICH leg of the cycle causes the delay (design bible §4 Stage 5).
// Fixed event sequence: Supplier PO → Material Arrival → Supplier Payment → Production Issue → FG Production → FG Sale → Customer Payment.
export const RMLC_EVENTS = ['Supplier PO', 'Material arrival', 'Supplier payment', 'Production issue', 'FG production', 'FG sale', 'Customer payment'];
export const RMLC_LEGS = [
  { key: 'lead', short: 'Supplier lead time', from: 0, to: 1 },
  { key: 'credit', short: 'Supplier credit period', from: 1, to: 2 },
  { key: 'store', short: 'Wait in stores', from: 2, to: 3 },
  { key: 'make', short: 'Production time', from: 3, to: 4 },
  { key: 'fg', short: 'Finished goods unsold', from: 4, to: 5 },
  { key: 'cust', short: 'Customer payment terms', from: 5, to: 6 },
];

// Days per leg, example data.
const MATERIALS = [
  { id: 'MAT-4120', name: 'Microcontroller', days: [6, 4, 5, 4, 10, 6], bottleneck: 'fg', why: 'Cycle is healthy; nothing stands out.' },
  { id: 'MAT-1082', name: 'Hydraulic Pump', days: [12, 10, 8, 6, 14, 20], bottleneck: 'cust', why: 'Customer payment terms lengthened from 30 to 45 days last quarter.' },
  { id: 'MAT-2041', name: 'Lithium Cell', days: [15, 9, 12, 8, 66, 30], bottleneck: 'fg', why: 'Finished goods are sitting unsold in the warehouse for 66 days.' },
];

// Shared with the Finance view of "Understand & Plan".
export const RMLC_CYCLE_MATERIALS = MATERIALS;

const sum = (a) => a.reduce((x, y) => x + y, 0);

export default function RmlcLegs({ selectedId }) {
  const rows = MATERIALS.map((m) => {
    const total = sum(m.days);
    const maxDays = Math.max(...m.days);
    const idx = m.days.indexOf(maxDays);
    return { ...m, total, bottleneckIdx: idx };
  });
  const scale = Math.max(...rows.map((r) => r.total));
  const focus = rows.find((r) => r.id === selectedId) || rows[rows.length - 1];
  const worst = rows[rows.length - 1];

  return (
    <div className="space-y-4 mb-6">
      <Insight label="Cash cycle">
        <span className="metric">{worst.id} · {worst.name}</span> takes <span className="metric">{worst.total} days</span> to turn
        a purchase into cash, {(worst.total / rows[0].total).toFixed(0)}× longer than {rows[0].id}.{' '}
        {worst.days[worst.bottleneckIdx]} of those days ({Math.round((worst.days[worst.bottleneckIdx] / worst.total) * 100)}%) are
        spent in one place: <strong>{RMLC_LEGS[worst.bottleneckIdx].short.toLowerCase()}</strong>. Supplier and production
        timings are normal.
      </Insight>

      <Card className="mb-0">
        <CardHead
          title="Days from purchase order to customer payment"
          sub="Each bar is one material. Segments follow the fixed sequence of events; the longest leg is highlighted."
          right={<Badge tone="neutral" shape={false}>Example data</Badge>}
        />

        <ol className="rmlc-events" aria-label="Event sequence">
          {RMLC_EVENTS.map((e, i) => (
            <li key={e}><span>{i + 1}</span>{e}</li>
          ))}
        </ol>

        <div className="rmlc-bars">
          {rows.map((r) => (
            <div key={r.id} className={`rmlc-row ${r.id === focus.id ? 'rmlc-row--focus' : ''}`}>
              <div className="rmlc-row__label">
                <strong>{r.id}</strong>
                <span>{r.name}</span>
              </div>
              <div className="rmlc-row__bar" style={{ width: `${(r.total / scale) * 100}%` }} role="img"
                aria-label={`${r.id}: ${r.total} days in total`}>
                {r.days.map((d, i) => (
                  <span
                    key={RMLC_LEGS[i].key}
                    className={`rmlc-seg ${i === r.bottleneckIdx ? 'rmlc-seg--hot' : ''}`}
                    style={{ flexGrow: d }}
                    title={`${RMLC_LEGS[i].short}: ${d} days`}
                  >
                    {d >= 8 ? d : ''}
                  </span>
                ))}
              </div>
              <div className="rmlc-row__total num">{r.total} days</div>
            </div>
          ))}
        </div>

        <div className="chart-legend">
          <span><span className="legend-dot" style={{ background: 'var(--s1)' }} /> Each leg (days)</span>
          <span><span className="legend-dot" style={{ background: 'var(--s2)' }} /> Longest leg, the bottleneck</span>
        </div>

        <div className="rmlc-why">
          <Badge tone="watch">Bottleneck · {focus.id}</Badge>
          <span>
            <strong>{RMLC_LEGS[focus.bottleneckIdx].short}</strong> ({focus.days[focus.bottleneckIdx]} days). {focus.why}
          </span>
        </div>
      </Card>

      <DrillDown title="Leg-by-leg durations" hint="Days between events">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Material</th>
                {RMLC_LEGS.map((l) => <th key={l.key} className="num">{l.short}</th>)}
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong className="text-ink">{r.id}</strong> · {r.name}</td>
                  {r.days.map((d, i) => <td key={i} className="num">{d}</td>)}
                  <td className="num"><strong>{r.total}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="footnote">Computed directly from transaction timestamps; no model is fitted at this stage.</p>
      </DrillDown>
    </div>
  );
}
