import React from 'react';
import { Check } from 'lucide-react';
import { Badge, Card, CardHead, Insight, DrillDown } from './CommonUI';
import { ChartFrame } from './Charts';

// Stage 6: the headline is a business answer; validation (residuals, error metrics, diagnostics) is drill-down detail.
// A model is only "done" when residuals are near-zero-mean, roughly normal, and free of unresolved multicollinearity.
const DRIVERS = [
  { name: 'Finished-goods demand', share: 41, beta: 0.41 },
  { name: 'Supplier lead time', share: 24, beta: 0.24 },
  { name: 'Production volume', share: 17, beta: 0.17 },
  { name: 'Price', share: 6, beta: 0.06 },
  { name: 'All other drivers', share: 12, beta: 0.12 },
];

const fmt = (v, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

// Each plant persona watches different drivers; the others are dimmed so the same ranking reads differently.
const PERSONA_DRIVERS = {
  supervisor: {
    own: ['Supplier lead time', 'Production volume'],
    title: 'Which drivers could leave the line short?',
    sub: 'Highlighted: the drivers that decide whether material arrives and is used on time.',
    read: (m, o) => <>For {m}, supplier lead time and production volume together explain <span className="metric">{o}%</span> of stock movement. Those are the two to watch for a line stoppage; finished-goods demand sets how fast stock is used.</>,
  },
  warehouse: {
    own: ['Finished-goods demand', 'Supplier lead time'],
    title: 'Which drivers fill or empty the shelves?',
    sub: 'Highlighted: the drivers behind how much stock arrives and leaves your stores.',
    read: (m, o) => <>For {m}, finished-goods demand and supplier lead time explain <span className="metric">{o}%</span> of stock movement: demand drains the shelves and long lead times make deliveries land in bunches.</>,
  },
  planner: {
    own: ['Finished-goods demand', 'Production volume'],
    title: 'Which drivers should the plan track?',
    sub: 'Highlighted: the drivers that come from the production plan and the order book.',
    read: (m, o) => <>For {m}, finished-goods demand and production volume explain <span className="metric">{o}%</span> of stock movement. Recheck the forecast whenever either changes in the plan.</>,
  },
  procurement: {
    own: ['Supplier lead time', 'Price'],
    title: 'Which drivers set order timing and cost?',
    sub: 'Highlighted: the drivers you can negotiate or time around.',
    read: (m, o) => <>For {m}, supplier lead time is <span className="metric">24%</span> of stock movement and price only <span className="metric">6%</span> ({o}% together): order timing matters far more than price for this must-buy material.</>,
  },
  finance: {
    own: ['Finished-goods demand', 'Price'],
    title: 'Which drivers move the cash tied up?',
    sub: 'Highlighted: the drivers that change what stock costs and how quickly it turns into cash.',
    read: (m, o) => <>For {m}, finished-goods demand and price explain <span className="metric">{o}%</span> of stock movement. Demand is the main lever on capital; price has little effect on this must-buy material.</>,
  },
};

export function MultivariateHeadline({ material, persona }) {
  const lens = PERSONA_DRIVERS[persona];
  const ownShare = lens ? DRIVERS.filter((d) => lens.own.includes(d.name)).reduce((a, d) => a + d.share, 0) : 0;
  return (
    <div className="space-y-4 mb-6">
      <Insight key={persona} label={lens ? 'What Moves Stock · Your Drivers' : 'Expected stock'}>
        {lens ? lens.read(material, ownShare) : (
          <>
            Stock for {material} is expected to keep rising over the next quarter unless something changes. Most of the movement
            comes from finished-goods demand (<span className="metric">41%</span>) and supplier lead time (<span className="metric">24%</span>);
            price has little effect on this must-buy material. This is the <strong>expected</strong> position, not the best one;
            the Optimization stage works out what it <em>should</em> be.
          </>
        )}
      </Insight>
      <Card className="mb-0">
        <CardHead
          title={lens ? lens.title : 'What drives stock the most?'}
          sub={lens ? lens.sub : 'Share of the movement in stock explained by each driver.'}
          right={<Badge tone="neutral" shape={false}>Example data</Badge>}
        />
        <div className="influence" role="list">
          {DRIVERS.map((d) => {
            const dim = lens && !lens.own.includes(d.name);
            return (
              <div key={d.name} className="influence__row" role="listitem" style={{ opacity: dim ? 0.4 : 1 }}>
                <span className="influence__label">{d.name}</span>
                <span className="influence__track"><span className="influence__bar" style={{ width: `${d.share}%` }} /></span>
                <span className="num influence__val">{d.share}%</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function ResidualChart() {
  // Residual distribution against the bell curve, in standard deviations (X̄ ± nσ bands).
  const bins = [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3];
  const counts = [0.3, 1.1, 3.6, 8.2, 14.6, 19.8, 21.2, 19.4, 14.1, 8.4, 3.4, 1.2, 0.4];
  const W = 900, H = 220, ML = 56, MR = 24, MT = 16, MB = 36;
  const bw = (W - ML - MR) / bins.length;
  const max = 24;
  const y = (v) => MT + (1 - v / max) * (H - MT - MB);
  const x = (i) => ML + i * bw;
  const normal = bins.map((b, i) => [x(i) + bw / 2, y(max * 0.885 * Math.exp(-(b * b) / 2))]);
  const line = normal.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  return (
    <ChartFrame
      label="Residual distribution"
      legend={[
        { label: 'Share of residuals (%)', kind: 'box', color: 'var(--s1)' },
        { label: 'Ideal bell curve', kind: 'line', color: 'var(--s2)' },
      ]}
      table={{ columns: ['Residual (σ from mean)', 'Share of residuals (%)'], rows: bins.map((b, i) => [`${b > 0 ? '+' : ''}${b}σ`, counts[i].toFixed(1)]) }}
    >
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Residual distribution against a normal curve">
        {[0, 10, 20].map((v) => (
          <g key={v}>
            <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="var(--border)" />
            <text x={8} y={y(v) + 4} fontSize={12} fill="var(--subtle)">{v}%</text>
          </g>
        ))}
        {counts.map((c, i) => (
          <g key={i}>
            <rect x={x(i) + 1} y={y(c)} width={bw - 2} height={H - MB - y(c)} fill="var(--s1)" rx={2} />
            <text x={x(i) + bw / 2} y={H - MB + 16} fontSize={12} fill="var(--subtle)" textAnchor="middle">{bins[i] > 0 ? '+' : ''}{bins[i]}σ</text>
          </g>
        ))}
        <path d={line} fill="none" stroke="var(--s2)" strokeWidth={2} />
        <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="var(--border-strong)" />
      </svg>
    </ChartFrame>
  );
}

const TRUST_NOTE = {
  supervisor: (r2, rmse) => `Typical weekly miss is about ±${fmt(rmse, 1)} units. Keep the line's lead-time buffer at least that large and the forecast is safe to plan against.`,
  warehouse: (r2, rmse) => `Typical weekly miss is about ±${fmt(rmse, 1)} units, so expect inbound and outbound volumes to differ from the forecast by about that much week to week.`,
  planner: (r2) => `The model explains ${fmt(r2 * 100, 0)}% of weekly variation. Rerun the forecast, and this check, whenever the production plan or a driver changes.`,
  procurement: (r2, rmse) => `A ±${fmt(rmse, 1)}-unit weekly error is small next to a lead-time window of several weeks; size orders on the forecast, then add the safety stock for the error.`,
  finance: (r2, rmse, avg) => `Forecast error is about ${fmt((rmse / avg) * 100, 1)}% of weekly demand, which bounds how far the 12-week spend and capital figures can drift.`,
};

export default function ModelValidation({ modelR2 = 0.91, rmse = 9, avgWeekly = 100, persona }) {
  const mae = rmse * 0.78;
  const mse = rmse * rmse;
  const mape = (mae / avgWeekly) * 100;
  const checks = [
    { label: 'Residuals average close to zero', detail: 'Mean error is −0.4% of weekly demand', ok: true },
    { label: 'Residuals are roughly normal', detail: '91% of residuals fall within ±3σ of the mean', ok: true },
    { label: 'No unresolved multicollinearity', detail: '2 overlapping drivers removed; every VIF is now below 5', ok: true },
    { label: 'Accuracy above the 90% bar', detail: 'Improved 60% → 80% → 92% → 95% over four refinements', ok: true },
  ];
  const vif = [
    { name: 'Finished-goods demand', vif: 3.8, note: 'Acceptable' },
    { name: 'Supplier lead time', vif: 2.1, note: 'Acceptable' },
    { name: 'Production volume', vif: 4.4, note: 'Acceptable after removing overlap' },
    { name: 'Price', vif: 1.4, note: 'Acceptable' },
  ];

  return (
    <DrillDown title="Model validation" hint="Residuals, error metrics and diagnostics" className="mb-6">
      <div className="space-y-5">
        {TRUST_NOTE[persona] && (
          <Insight key={persona} label="How far to trust this forecast" defaultOpen>
            {TRUST_NOTE[persona](modelR2, rmse, avgWeekly)}
          </Insight>
        )}
        <div>
          <div className="section-title" style={{ marginTop: 0 }}>Is the model done?</div>
          <ul className="checklist">
            {checks.map((c) => (
              <li key={c.label}>
                <span><strong>{c.label}</strong><span>{c.detail}</span></span>
                <Badge tone="success" shape={false}><Check size={12} aria-hidden="true" /> Met</Badge>
              </li>
            ))}
          </ul>
          <p className="footnote">Re-run this check whenever a driver is added or removed.</p>
        </div>

        <div>
          <div className="section-title" style={{ marginTop: 0 }}>Residuals</div>
          <ResidualChart />
        </div>

        <div className="grid-2 mb-0">
          <div>
            <div className="section-title" style={{ marginTop: 0 }}>Error metrics</div>
            <div className="table-wrap">
              <table>
                <tbody>
                  <tr><td>R² (variance explained)</td><td className="num">{fmt(modelR2)}</td></tr>
                  <tr><td>MAE (mean absolute error)</td><td className="num">{fmt(mae)}</td></tr>
                  <tr><td>MAPE (mean absolute % error)</td><td className="num">{fmt(mape)}%</td></tr>
                  <tr><td>MSE (mean squared error)</td><td className="num">{fmt(mse)}</td></tr>
                  <tr><td>RMSE (root mean squared error)</td><td className="num">{fmt(rmse)}</td></tr>
                  <tr><td>Bias</td><td className="num">−0.40</td></tr>
                  <tr><td>Noise (residual σ)</td><td className="num">{fmt(rmse * 0.97)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div className="section-title" style={{ marginTop: 0 }}>Diagnostic tests</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Driver</th><th className="num">VIF</th><th>Multicollinearity</th></tr></thead>
                <tbody>
                  {vif.map((v) => (
                    <tr key={v.name}><td>{v.name}</td><td className="num">{v.vif.toFixed(1)}</td><td>{v.note}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="checklist" style={{ marginTop: 8 }}>
              <li><span><strong>Heteroskedasticity</strong><span>Breusch–Pagan p = 0.31; error spread is stable</span></span><Badge tone="success">Passed</Badge></li>
              <li><span><strong>ANOVA</strong><span>F = 212, p &lt; 0.001; 2 drivers removed as not significant</span></span><Badge tone="success">Passed</Badge></li>
            </ul>
          </div>
        </div>
      </div>
    </DrillDown>
  );
}
