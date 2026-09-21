import React from 'react';
import { Badge, Card, CardHead } from './CommonUI';

// Bivariate stage output: correlation strength between each candidate driver and stock, per material.
// Sequential ramp (--q1…--q5) in |r| steps of 0.2, values printed in every cell (design bible §4 Stage 2, style guide "Sequential").
const MATERIALS = ['MAT-1082 Hydraulic Pump', 'MAT-4120 Microcontroller', 'MAT-3390 Steel Housing', 'MAT-1177 Seal Kit'];
const DRIVERS = [
  { name: 'Supplier lead time', values: [0.82, 0.35, 0.12, 0.58], note: 'Longer transit goes with more stock-outs and more safety stock.' },
  { name: 'Production output', values: [0.64, 0.71, 0.28, 0.44], note: 'Stock follows production plans closely for this material.' },
  { name: 'FG demand', values: [0.91, 0.66, 0.53, 0.21], note: 'Finished-goods demand is the upstream driver of consumption.' },
  { name: 'Price', values: [0.18, 0.42, 0.77, 0.09], note: 'Only steel housing reacts to price; the others are must-buy.' },
  { name: 'Order quantity', values: [0.47, 0.15, 0.38, 0.86], note: 'Batch size drives seal-kit stock more than demand does.' },
];

const step = (r) => Math.min(5, Math.max(1, Math.ceil(r / 0.2)));
const THRESHOLD = 0.5;

export default function DriverHeatmap({ materialIndex = 0 }) {
  const ranked = DRIVERS.map((d) => ({ ...d, r: d.values[materialIndex] }))
    .sort((a, b) => b.r - a.r);

  return (
    <div className="grid-2">
      <Card className="mb-0">
        <CardHead
          title="Which drivers move stock?"
          sub="Correlation strength |r| between each driver and stock, by material. Values are printed in every cell."
          right={<Badge tone="neutral" shape={false}>Example data</Badge>}
        />
        <div className="table-wrap">
          <table className="heatmap">
            <thead>
              <tr>
                <th>Driver</th>
                {MATERIALS.map((m) => <th key={m} className="num">{m.split(' ')[0]}</th>)}
              </tr>
            </thead>
            <tbody>
              {DRIVERS.map((d) => (
                <tr key={d.name}>
                  <th scope="row" className="heatmap__row">{d.name}</th>
                  {d.values.map((v, i) => {
                    const n = step(v);
                    return (
                      <td
                        key={i}
                        className="num heatmap__cell"
                        style={{ background: `var(--q${n})`, color: `var(--qt${n})` }}
                      >
                        {v.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="heatmap__scale" aria-hidden="true">
          <span>weaker</span>
          {[1, 2, 3, 4, 5].map((n) => <i key={n} style={{ background: `var(--q${n})` }} />)}
          <span>stronger · |r| in steps of 0.2</span>
        </div>
      </Card>

      <Card className="mb-0">
        <CardHead
          title={`Shortlist for the Multivariate model · ${MATERIALS[materialIndex].split(' ')[0]}`}
          sub={`Drivers with |r| ≥ ${THRESHOLD.toFixed(2)} are carried forward as candidates.`}
        />
        <ol className="shortlist">
          {ranked.map((d, i) => {
            const keep = d.r >= THRESHOLD;
            return (
              <li key={d.name}>
                <span className="shortlist__rank">{i + 1}</span>
                <span className="shortlist__body">
                  <strong>{d.name}</strong>
                  <span>{d.note}</span>
                </span>
                <span className="num shortlist__r">{d.r.toFixed(2)}</span>
                <Badge tone={keep ? 'success' : 'neutral'} shape={keep ? 'circle' : false}>{keep ? 'Include' : 'Skip'}</Badge>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
