import React from 'react';

/*
 * Chart method (AITEK Style Guide v1.2 — Data visualization):
 *  - colour is assigned by the job it does: categorical series use --s1…--s5 in fixed order,
 *    ABC tiers use the ordinal ramp (--ord-a/b/c), status colours are never reused as series colours;
 *  - one y-axis per chart, thin marks, gridlines recede;
 *  - every chart carries a legend (direct labels for four or fewer series) and a "View as table" view;
 *  - status keeps its shape and label: circle = success, triangle = warning, diamond = error, square = info.
 */

const fmt2 = (v) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---- Shared frame: legend + "View as table" toggle ----
function LegendMark({ kind = 'box', color }) {
  if (kind === 'line') return <span className="legend-line" style={{ background: color }} aria-hidden="true" />;
  if (kind === 'dash') return <span className="legend-line legend-line--dash" style={{ color }} aria-hidden="true" />;
  if (kind === 'diamond') return <span className="status-shape status-shape--diamond" style={{ color }} aria-hidden="true" />;
  if (kind === 'square') return <span className="status-shape status-shape--square" style={{ color }} aria-hidden="true" />;
  if (kind === 'circle') return <span className="status-shape status-shape--circle" style={{ color }} aria-hidden="true" />;
  if (kind === 'triangle') return <span className="status-shape status-shape--triangle" style={{ color }} aria-hidden="true" />;
  return <span className="legend-dot" style={{ background: color }} aria-hidden="true" />;
}

export function ChartFrame({ label, legend = [], table, children }) {
  const [asTable, setAsTable] = React.useState(false);
  return (
    <div className="chart-frame">
      {table && (
        <div className="chart-frame__bar">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-pressed={asTable}
            onClick={() => setAsTable((v) => !v)}
          >
            {asTable ? 'View as chart' : 'View as table'}
          </button>
        </div>
      )}
      {asTable && table ? (
        <div className="chart-table table-wrap" role="region" aria-label={`${label} — data table`} tabIndex={0}>
          <table>
            <thead>
              <tr>
                {table.columns.map((c, i) => (
                  <th key={c} className={i > 0 ? 'num' : undefined}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((cell, ci) => (
                    <td key={ci} className={ci > 0 && typeof cell === 'string' && /^[-+$\d(]/.test(cell) ? 'num' : undefined}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart-shell">{children}</div>
      )}
      {legend.length > 0 && (
        <div className="chart-legend">
          {legend.map((l) => (
            <span key={l.label}>
              <LegendMark kind={l.kind} color={l.color} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Univariate trend with statistical vs threshold outliers ----
const UNI_DATA = [1180,1210,1260,1190,1240,1310,1290,1350,1280,1330,1400,1360,1420,1390,1450,1470,1430,1500,1460,1520,2410,1490,1510,1540,1500,1560,2050,1580,1600,1620];

export function UnivariateTrendChart() {
  const W = 900, H = 260, ML = 64, MR = 24, MT = 28, MB = 32;
  const data = UNI_DATA;
  const cap = 2000, yMax = 2600, yMin = 900;
  const x = (i) => ML + (i / (data.length - 1)) * (W - ML - MR);
  const y = (v) => MT + (1 - (v - yMin) / (yMax - yMin)) * (H - MT - MB);
  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  const flag = (v) => (v > 2200 ? 'Statistical outlier (>3σ)' : v > cap ? 'Policy cap breach' : 'Within range');

  return (
    <ChartFrame
      label="Weekly closing stock"
      legend={[
        { label: 'Weekly closing stock (EA)', kind: 'line', color: 'var(--s1)' },
        { label: 'Policy cap', kind: 'dash', color: 'var(--warning)' },
        { label: 'Statistical outlier (>3σ)', kind: 'diamond', color: 'var(--error)' },
        { label: 'Cap breach', kind: 'square', color: 'var(--warning)' },
      ]}
      table={{
        columns: ['Week', 'Closing stock (EA)', 'Flag'],
        rows: data.map((v, i) => [`Wk ${i + 1}`, fmt2(v), flag(v)]),
      }}
    >
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Weekly closing stock trend with policy cap and outliers">
        {[1000, 1500, 2000, 2500].map((v) => (
          <g key={v}>
            <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="var(--border)" />
            <text x={8} y={y(v) + 4} fontSize={12} fill="var(--subtle)">{fmt2(v)}</text>
          </g>
        ))}
        <line x1={ML} x2={W - MR} y1={y(cap)} y2={y(cap)} stroke="var(--warning)" strokeDasharray="4 4" strokeWidth={1.5} />
        <text x={ML + 8} y={y(cap) - 6} fontSize={12} fill="var(--warning-tx)" textAnchor="start" fontWeight={600}>
          ■ Policy cap: 2,000.00 EA
        </text>
        <path d={linePath} fill="none" stroke="var(--s1)" strokeWidth={2} />
        {data.map((v, i) => {
          const isStat = v > 2200;
          const isThresh = !isStat && v > cap;
          const cx = x(i);
          const cy = y(v);

          if (isStat) {
            // Statistical outlier: diamond (error)
            const dSize = 6.5;
            const points = `${cx},${cy - dSize} ${cx + dSize},${cy} ${cx},${cy + dSize} ${cx - dSize},${cy}`;
            return (
              <g key={i}>
                <polygon points={points} fill="var(--error)" stroke="var(--surface)" strokeWidth={1.5} />
                <text x={cx} y={cy - 12} fontSize={12} fill="var(--error-tx)" textAnchor="middle" fontWeight={600}>
                  ◆ Wk {i + 1} · z=3.61 (&gt;3σ anomaly)
                </text>
              </g>
            );
          }

          if (isThresh) {
            // Business threshold breach: square (warning)
            const sSize = 9;
            return (
              <g key={i}>
                <rect x={cx - sSize / 2} y={cy - sSize / 2} width={sSize} height={sSize} rx={1.5} fill="var(--warning)" stroke="var(--surface)" strokeWidth={1.5} />
                <text x={cx} y={cy - 12} fontSize={12} fill="var(--warning-tx)" textAnchor="middle" fontWeight={600}>
                  ■ Wk {i + 1} · cap breach (2,050.00 EA)
                </text>
              </g>
            );
          }

          return <circle key={i} cx={cx} cy={cy} r={2.5} fill="var(--s1)" />;
        })}
        <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="var(--border-strong)" />
      </svg>
    </ChartFrame>
  );
}

// ---- Bivariate scatter: lead time vs stockout frequency ----
export function BivariateScatterChart() {
  const W = 500, H = 320, ML = 56, MR = 20, MT = 20, MB = 42;
  const x = (v) => ML + (v / 70) * (W - ML - MR);
  const y = (v) => MT + (1 - v / 15) * (H - MT - MB);
  const points = React.useMemo(() => {
    const pts = [];
    for (let i = 0; i < 34; i++) {
      const lt = 10 + (i / 33) * 55;
      const noise = ((i % 5) - 2) * 0.9;
      const risk = Math.max(0.4, ((lt - 10) / 60) * 12.8 + noise);
      pts.push([lt, risk]);
    }
    return pts;
  }, []);

  return (
    <ChartFrame
      label="Supplier lead time vs stock-out frequency"
      legend={[
        { label: 'Material observations', kind: 'circle', color: 'var(--s1)' },
        { label: 'Fitted trend (r = 0.74)', kind: 'dash', color: 'var(--s2)' },
        { label: 'Risk threshold (>45d)', kind: 'dash', color: 'var(--error)' },
      ]}
      table={{
        columns: ['Supplier lead time (days)', 'Stock-out frequency (%)'],
        rows: points.map((p) => [p[0].toFixed(1), `${p[1].toFixed(2)}%`]),
      }}
    >
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Scatter of supplier lead time against stock-out frequency">
        {[0, 20, 40, 60].map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={MT} y2={H - MB} stroke="var(--border)" />
            <text x={x(v)} y={H - MB + 16} fontSize={12} fill="var(--subtle)" textAnchor="middle">{v}d</text>
          </g>
        ))}
        {[0, 5, 10, 15].map((v) => (
          <g key={v}>
            <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="var(--border)" />
            <text x={8} y={y(v) + 4} fontSize={12} fill="var(--subtle)">{v.toFixed(2)}%</text>
          </g>
        ))}
        <line x1={x(10)} y1={y(0.4)} x2={x(65)} y2={y(12.2)} stroke="var(--s2)" strokeWidth={2} strokeDasharray="5 4" />
        {points.map((p, i) => (
          <circle key={i} cx={x(p[0])} cy={y(p[1])} r={3.5} fill="var(--s1)" fillOpacity={0.75} />
        ))}
        {/* Annotated critical threshold and correlation */}
        <text x={x(36)} y={y(8.6)} fontSize={12} fill="var(--ink)" fontWeight={600} textAnchor="start">
          Trend line: r = 0.74
        </text>
        <line x1={x(45)} x2={x(45)} y1={MT} y2={H - MB} stroke="var(--error)" strokeWidth={1} strokeDasharray="3 3" />
        <text x={x(47)} y={MT + 12} fontSize={12} fill="var(--error-tx)" fontWeight={600}>
          ◆ Risk threshold (&gt;45d)
        </text>
        <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="var(--border-strong)" />
        <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="var(--border-strong)" />
        <text x={(ML + W - MR) / 2} y={H - 4} fontSize={12} fill="var(--subtle)" textAnchor="middle">Supplier lead time (days)</text>
      </svg>
    </ChartFrame>
  );
}

// ---- ABC Pareto: top materials + cumulative value line ----
export function ParetoChart() {
  const W = 900, H = 290, ML = 66, MR = 40, MT = 24, MB = 50;
  const names = ['MAT-2041','MAT-1082','MAT-4120','MAT-3390','MAT-1177','MAT-2205','MAT-4488','MAT-3012','MAT-1955','MAT-2687','MAT-3341','MAT-1420'];
  const values = [7.30,5.58,4.83,3.90,3.40,3.05,2.70,2.40,2.10,1.85,1.62,1.40];
  let running = 0;
  const cumArr = values.map((v) => { running += v; return (running / 44.0) * 100; });
  const x = (i) => ML + (i + 0.5) * ((W - ML - MR) / values.length);
  const yv = (v) => MT + (1 - v / 8) * (H - MT - MB);
  const yp = (p) => MT + (1 - p / 100) * (H - MT - MB);
  const bw = ((W - ML - MR) / values.length) * 0.6;
  const cumPath = cumArr.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${yp(p).toFixed(1)}`).join(' ');
  const tier = (i) => (i < 3 ? 'A' : i < 7 ? 'B' : 'C');
  const tierFill = (i) => (i < 3 ? 'var(--ord-a)' : i < 7 ? 'var(--ord-b)' : 'var(--ord-c)');

  return (
    <ChartFrame
      label="ABC Pareto of inventory value"
      legend={[
        { label: 'Tier A', kind: 'box', color: 'var(--ord-a)' },
        { label: 'Tier B', kind: 'box', color: 'var(--ord-b)' },
        { label: 'Tier C', kind: 'box', color: 'var(--ord-c)' },
        { label: 'Cumulative share of value', kind: 'line', color: 'var(--s2)' },
        { label: 'Class A boundary', kind: 'dash', color: 'var(--warning)' },
      ]}
      table={{
        columns: ['Material', 'ABC tier', 'Value ($M)', 'Cumulative share'],
        rows: names.map((n, i) => [n, tier(i), `$${values[i].toFixed(2)}M`, `${cumArr[i].toFixed(1)}%`]),
      }}
    >
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Pareto chart of material value with cumulative share">
        {[0, 2, 4, 6, 8].map((v) => (
          <g key={v}>
            <line x1={ML} x2={W - MR} y1={yv(v)} y2={yv(v)} stroke="var(--border)" />
            <text x={8} y={yv(v) + 4} fontSize={12} fill="var(--subtle)">${v.toFixed(2)}M</text>
          </g>
        ))}
        {values.map((v, i) => (
          <g key={i}>
            <rect x={x(i) - bw / 2} y={yv(v)} width={bw} height={(H - MB) - yv(v)} fill={tierFill(i)} rx={2} />
            <text x={x(i)} y={H - MB + 16} fontSize={12} fill="var(--subtle)" textAnchor="middle">{names[i].replace('MAT-', '')}</text>
          </g>
        ))}
        <path d={cumPath} fill="none" stroke="var(--s2)" strokeWidth={2} />
        {cumArr.map((p, i) => <circle key={i} cx={x(i)} cy={yp(p)} r={3} fill="var(--s2)" stroke="var(--surface)" strokeWidth={1} />)}
        {/* direct labels on the cumulative series */}
        <text x={x(0) + bw / 2 + 6} y={yp(cumArr[0]) - 8} fontSize={12} fill="var(--ink)" fontWeight={600}>{cumArr[0].toFixed(1)}%</text>
        <text x={x(values.length - 1)} y={yp(cumArr[values.length - 1]) - 10} fontSize={12} fill="var(--ink)" fontWeight={600} textAnchor="end">{cumArr[values.length - 1].toFixed(1)}%</text>
        <line x1={ML} x2={W - MR} y1={yp(78.3)} y2={yp(78.3)} stroke="var(--warning)" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x={ML + 10} y={yp(78.3) - 8} fontSize={12} fill="var(--warning-tx)" textAnchor="start" fontWeight={600}>
          ▲ Class A boundary · 78.30% cumulative ($34.28M)
        </text>
        <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="var(--border-strong)" />
        <text x={(ML + W - MR) / 2} y={H - 6} fontSize={12} fill="var(--subtle)" textAnchor="middle">Material (MAT-…), ranked by inventory value</text>
      </svg>
    </ChartFrame>
  );
}

// ---- EOQ total-cost curve with the minimum marked ----
export function EoqCurveChart({
  demand = 4800,
  orderingCost = 230,
  holdingCostPerUnit = 36,
  uom = 'EA',
} = {}) {
  const W = 900, H = 290, ML = 72, MR = 30, MT = 24, MB = 40;
  const D = demand, S = orderingCost, Hc = holdingCostPerUnit;
  const qStar = Math.sqrt((2 * D * S) / Hc);
  const cStar = (D / qStar) * S + (qStar / 2) * Hc;
  const qMin = Math.max(1, qStar * 0.3);
  const qMax = qStar * 3.5;
  const n = 60;
  const pts = [];
  let maxCost = 0;
  for (let i = 0; i <= n; i++) {
    const q = qMin + ((qMax - qMin) * i) / n;
    const ordering = (D / q) * S;
    const holding = (q / 2) * Hc;
    const total = ordering + holding;
    pts.push({ q, ordering, holding, total });
    if (total > maxCost) maxCost = total;
  }
  const step = Math.pow(10, Math.floor(Math.log10(maxCost || 1))) / 2;
  maxCost = Math.ceil(maxCost / (step || 1000)) * (step || 1000);
  const x = (q) => ML + ((q - qMin) / (qMax - qMin)) * (W - ML - MR);
  const y = (c) => MT + (1 - c / maxCost) * (H - MT - MB);
  const pathFor = (key) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.q).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');

  return (
    <ChartFrame
      label="EOQ total cost curve"
      legend={[
        { label: 'Total cost', kind: 'line', color: 'var(--s1)' },
        { label: 'Ordering cost', kind: 'dash', color: 'var(--s2)' },
        { label: 'Holding cost', kind: 'dash', color: 'var(--s3)' },
        { label: 'Economic order quantity (Q*)', kind: 'diamond', color: 'var(--ink)' },
      ]}
      table={{
        columns: [`Order quantity (${uom})`, 'Ordering cost ($/yr)', 'Holding cost ($/yr)', 'Total cost ($/yr)'],
        rows: pts.filter((_, i) => i % 3 === 0).map((p) => [fmt2(p.q), `$${fmt2(p.ordering)}`, `$${fmt2(p.holding)}`, `$${fmt2(p.total)}`]),
      }}
    >
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="EOQ total cost curve with ordering and holding cost components">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const v = maxCost * f;
          return (
            <g key={f}>
              <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="var(--border)" />
              <text x={8} y={y(v) + 4} fontSize={12} fill="var(--subtle)">${fmt2(v)}</text>
            </g>
          );
        })}
        <path d={pathFor('ordering')} fill="none" stroke="var(--s2)" strokeWidth={2} strokeDasharray="5 4" />
        <path d={pathFor('holding')} fill="none" stroke="var(--s3)" strokeWidth={2} strokeDasharray="5 4" />
        <path d={pathFor('total')} fill="none" stroke="var(--s1)" strokeWidth={2} />
        <line x1={x(qStar)} x2={x(qStar)} y1={y(cStar)} y2={H - MB} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="3 3" />
        <polygon
          points={`${x(qStar)},${y(cStar) - 7} ${x(qStar) + 7},${y(cStar)} ${x(qStar)},${y(cStar) + 7} ${x(qStar) - 7},${y(cStar)}`}
          fill="var(--ink)"
          stroke="var(--surface)"
          strokeWidth={1.5}
        />
        <text x={x(qStar) + 12} y={y(cStar) - 10} fontSize={12} fill="var(--ink)" fontWeight={600}>
          Q* = {fmt2(qStar)} {uom} (min cost ${fmt2(cStar)}/yr)
        </text>
        <text x={(ML + W - MR) / 2} y={H - 4} fontSize={12} fill="var(--subtle)" textAnchor="middle">Order quantity ({uom})</text>
        <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="var(--border-strong)" />
      </svg>
    </ChartFrame>
  );
}

// ---- BOM cascade: finished good -> sub-assemblies -> raw materials ----
const BOM_NODES = [
  ['FG-2200', 'Finished good', '1,700.00 units / period', '—'],
  ['Pump Module', 'Sub-assembly', '1,700.00 units', '—'],
  ['Housing Module', 'Sub-assembly', '1,700.00 units', '—'],
  ['MAT-1082 · Hydraulic Pump', 'Raw material', '1,700.00 EA ($1.02M)', 'High risk'],
  ['MAT-4120 · Microcontroller', 'Raw material', '1,700.00 EA ($133.71K)', 'High risk'],
  ['MAT-3390 · Steel Housing', 'Raw material', '1,700.00 EA ($187.00K)', 'Watch'],
  ['MAT-1177 · Seal Kit', 'Raw material', '3,400.00 EA ($68.00K)', 'Healthy'],
];

export function BomCascadeChart() {
  const W = 900, H = 220;
  const Box = ({ x, y, w, h, label, sub, fill, stroke }) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + (sub ? 18 : h / 2 + 4)} fontSize={12} fontWeight={600} fill="var(--ink)" textAnchor="middle">{label}</text>
      {sub && <text x={x + w / 2} y={y + 33} fontSize={12} fill="var(--body-c)" textAnchor="middle">{sub}</text>}
    </g>
  );
  const Arrow = ({ x1, y1, x2, y2, label }) => (
    <g>
      <line x1={x1} y1={y1} x2={x2 - 8} y2={y2} stroke="var(--subtle)" strokeWidth={1.5} markerEnd="url(#bomArrow)" />
      <text x={(x1 + x2) / 2} y={y1 - 8} fontSize={12} fill="var(--info-tx)" textAnchor="middle" fontWeight={600}>{label}</text>
    </g>
  );

  return (
    <ChartFrame
      label="Bill-of-materials cascade"
      legend={[
        { label: 'High risk', kind: 'diamond', color: 'var(--error)' },
        { label: 'Watch', kind: 'triangle', color: 'var(--warning)' },
        { label: 'Healthy', kind: 'circle', color: 'var(--success)' },
      ]}
      table={{ columns: ['Item', 'Level', 'Requirement', 'Status'], rows: BOM_NODES }}
    >
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Bill of materials from finished good to raw materials">
        <defs>
          <marker id="bomArrow" markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--subtle)" />
          </marker>
        </defs>
        <Box x={20} y={85} w={150} h={60} label="FG-2200" sub="1,700.00 units / period" fill="var(--info-bg)" stroke="var(--border)" />
        <Arrow x1={170} y1={115} x2={290} y2={115} label="× 1.00" />
        <Box x={290} y={20} w={150} h={60} label="Pump Module" sub="1,700.00 units" fill="var(--bg)" stroke="var(--border)" />
        <Box x={290} y={150} w={150} h={60} label="Housing Module" sub="1,700.00 units" fill="var(--bg)" stroke="var(--border)" />
        <Arrow x1={440} y1={50} x2={580} y2={20} label="× 1.00" />
        <Arrow x1={440} y1={50} x2={580} y2={90} label="× 1.00" />
        <Arrow x1={440} y1={180} x2={580} y2={150} label="× 1.00" />
        <Arrow x1={440} y1={180} x2={580} y2={205} label="× 2.00" />
        <Box x={580} y={0} w={310} h={40} label="◆ MAT-1082 · Hydraulic Pump" sub="1,700.00 EA ($1.02M)" fill="var(--error-bg)" stroke="var(--error)" />
        <Box x={580} y={65} w={310} h={40} label="◆ MAT-4120 · Microcontroller" sub="1,700.00 EA ($133.71K)" fill="var(--error-bg)" stroke="var(--error)" />
        <Box x={580} y={125} w={310} h={40} label="▲ MAT-3390 · Steel Housing" sub="1,700.00 EA ($187.00K)" fill="var(--warning-bg)" stroke="var(--warning)" />
        <Box x={580} y={178} w={310} h={38} label="● MAT-1177 · Seal Kit" sub="3,400.00 EA ($68.00K)" fill="var(--success-bg)" stroke="var(--success)" />
      </svg>
    </ChartFrame>
  );
}

// ---- Multivariate demand forecast with historical trend, CI band & lead-time marker ----
export function ForecastChart({
  weeklyMean = 100,
  trendPerWeek = 0.002,
  cv = 0.12,
  leadTimeDays = 60,
  uom = 'EA',
}) {
  const historyWeeks = 16;
  const horizonWeeks = 12;
  const Z = 1.65;

  const W = 900, H = 290, ML = 76, MR = 30, MT = 28, MB = 42;

  // 1. Generate historical points (i: 0 to historyWeeks - 1)
  const histPoints = [];
  for (let i = 0; i < historyWeeks; i++) {
    const weeksFromNow = i - historyWeeks; // -16 to -1
    const val = weeklyMean * (1 + trendPerWeek * weeksFromNow) * (1 + 0.06 * Math.sin(i * 1.1));
    histPoints.push({ w: weeksFromNow, val });
  }

  // 2. Generate projected points (h: 1 to horizonWeeks)
  const projPoints = [];
  for (let h = 1; h <= horizonWeeks; h++) {
    const projectedMean = weeklyMean * (1 + trendPerWeek * h);
    const ciHalfWidth = Z * weeklyMean * cv * Math.sqrt(h);
    const upper = projectedMean + ciHalfWidth;
    const lower = Math.max(0, projectedMean - ciHalfWidth);
    projPoints.push({ h, projectedMean, upper, lower });
  }

  // 3. Compute relative y-axis scaling
  const allVals = [
    weeklyMean,
    ...histPoints.map((p) => p.val),
    ...projPoints.map((p) => p.upper),
    ...projPoints.map((p) => p.projectedMean),
  ];
  const maxVal = Math.max(...allVals);
  const rawMax = maxVal * 1.1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax || 1)));
  const step = magnitude / 2 || 1;
  const yMax = Math.ceil(rawMax / step) * step;

  // Coordinate mappers (x maps from -historyWeeks to +horizonWeeks)
  const totalWeeks = historyWeeks + horizonWeeks; // 28
  const x = (w) => ML + ((w + historyWeeks) / totalWeeks) * (W - ML - MR);
  const y = (v) => MT + (1 - Math.max(0, v) / yMax) * (H - MT - MB);

  // Historical path starts at week -16 and connects seamlessly to Today (week 0, weeklyMean)
  const histPath = [
    `M ${x(histPoints[0].w).toFixed(1)},${y(histPoints[0].val).toFixed(1)}`,
    ...histPoints.slice(1).map((p) => `L ${x(p.w).toFixed(1)},${y(p.val).toFixed(1)}`),
    `L ${x(0).toFixed(1)},${y(weeklyMean).toFixed(1)}`,
  ].join(' ');

  // Projected mean path starts at Today (week 0, weeklyMean) and extends to horizonWeeks
  const projPath = [
    `M ${x(0).toFixed(1)},${y(weeklyMean).toFixed(1)}`,
    ...projPoints.map((p) => `L ${x(p.h).toFixed(1)},${y(p.projectedMean).toFixed(1)}`),
  ].join(' ');

  // Confidence band polygon starts at Today (week 0, weeklyMean), follows upper band, then lower band back
  const bandPath = [
    `M ${x(0).toFixed(1)},${y(weeklyMean).toFixed(1)}`,
    ...projPoints.map((p) => `L ${x(p.h).toFixed(1)},${y(p.upper).toFixed(1)}`),
    ...projPoints.slice().reverse().map((p) => `L ${x(p.h).toFixed(1)},${y(p.lower).toFixed(1)}`),
    'Z',
  ].join(' ');

  // Replenishment lead time marker position (in weeks into projection)
  const leadTimeWeeks = leadTimeDays / 7;
  const xLeadTime = x(leadTimeWeeks);

  const xTicks = [-16, -12, -8, -4, 0, 4, 8, 12];

  return (
    <ChartFrame
      label="Weekly demand forecast"
      legend={[
        { label: 'Historical consumption', kind: 'line', color: 'var(--s1)' },
        { label: 'Projected mean', kind: 'dash', color: 'var(--s2)' },
        { label: '90% confidence band', kind: 'box', color: 'var(--s2)' },
        { label: 'Order arrival (lead time)', kind: 'triangle', color: 'var(--warning)' },
      ]}
      table={{
        columns: ['Week', `Historical (${uom})`, `Projected mean (${uom})`, 'Lower 90%', 'Upper 90%'],
        rows: [
          ...histPoints.map((p) => [`${p.w}w`, fmt2(p.val), '—', '—', '—']),
          ...projPoints.map((p) => [`+${p.h}w`, '—', fmt2(p.projectedMean), fmt2(p.lower), fmt2(p.upper)]),
        ],
      }}
    >
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Weekly demand history and projected forecast with confidence band">
        {/* Y-axis gridlines and labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const v = yMax * f;
          return (
            <g key={f}>
              <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="var(--border)" />
              <text x={8} y={y(v) + 4} fontSize={12} fill="var(--subtle)">{fmt2(v)}</text>
            </g>
          );
        })}

        {/* X-axis tick lines and labels */}
        {xTicks.map((w) => (
          <g key={w}>
            <line x1={x(w)} x2={x(w)} y1={H - MB} y2={H - MB + 5} stroke="var(--border-strong)" />
            <text x={x(w)} y={H - MB + 18} fontSize={12} fill="var(--subtle)" textAnchor="middle">
              {w === 0 ? 'Today' : w > 0 ? `+${w}w` : `${w}w`}
            </text>
          </g>
        ))}

        {/* Shaded confidence band (uncertainty, same hue as the projection) */}
        <path d={bandPath} fill="var(--s2)" fillOpacity={0.16} stroke="none" />

        {/* Today vertical divider */}
        <line x1={x(0)} x2={x(0)} y1={MT} y2={H - MB} stroke="var(--subtle)" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x={x(0)} y={MT - 10} fontSize={12} fill="var(--body-c)" fontWeight={700} textAnchor="middle">
          Today (Wk 0)
        </text>

        {/* Replenishment lead-time arrival marker */}
        <line x1={xLeadTime} x2={xLeadTime} y1={MT} y2={H - MB} stroke="var(--warning)" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={xLeadTime + 6} y={MT + 12} fontSize={12} fill="var(--warning-tx)" fontWeight={600}>
          ▲ Order arrives ({leadTimeDays}d / +{leadTimeWeeks.toFixed(1)}w)
        </text>

        {/* Historical line and points */}
        <path d={histPath} fill="none" stroke="var(--s1)" strokeWidth={2} />
        {histPoints.map((p, i) => (
          <circle key={`h-${i}`} cx={x(p.w)} cy={y(p.val)} r={2.5} fill="var(--s1)" />
        ))}

        {/* Projected mean line and points */}
        <path d={projPath} fill="none" stroke="var(--s2)" strokeWidth={2} strokeDasharray="5 4" />
        {projPoints.map((p, i) => (
          <circle key={`p-${i}`} cx={x(p.h)} cy={y(p.projectedMean)} r={2.5} fill="var(--s2)" />
        ))}
        <circle cx={x(0)} cy={y(weeklyMean)} r={3.5} fill="var(--s2)" stroke="var(--surface)" strokeWidth={1.5} />

        {/* Axes base lines */}
        <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="var(--border-strong)" />
        <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="var(--border-strong)" />

        {/* X-axis title */}
        <text x={(ML + W - MR) / 2} y={H - 6} fontSize={12} fill="var(--subtle)" textAnchor="middle">
          Historical consumption (16 wks) vs projected horizon (12 wks) · weekly demand ({uom})
        </text>
      </svg>
    </ChartFrame>
  );
}
