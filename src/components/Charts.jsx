import React from 'react';

// ---- Univariate trend with statistical vs threshold outliers ----
export function UnivariateTrendChart() {
  const W = 900, H = 260, ML = 60, MR = 24, MT = 24, MB = 32;
  const data = [1180,1210,1260,1190,1240,1310,1290,1350,1280,1330,1400,1360,1420,1390,1450,1470,1430,1500,1460,1520,2410,1490,1510,1540,1500,1560,2050,1580,1600,1620];
  const cap = 2000, yMax = 2600, yMin = 900;
  const x = (i) => ML + (i / (data.length - 1)) * (W - ML - MR);
  const y = (v) => MT + (1 - (v - yMin) / (yMax - yMin)) * (H - MT - MB);
  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {[1000, 1500, 2000, 2500].map((v) => (
        <g key={v}>
          <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="#EEF2F7" />
          <text x={8} y={y(v) + 4} fontSize={10} fill="#8896A8" fontFamily="IBM Plex Mono">
            {v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </text>
        </g>
      ))}
      <line x1={ML} x2={W - MR} y1={y(cap)} y2={y(cap)} stroke="#B7791F" strokeDasharray="4 4" strokeWidth={1.5} />
      <text x={ML + 8} y={y(cap) - 6} fontSize={10} fill="#B7791F" textAnchor="start" fontFamily="IBM Plex Mono" fontWeight={600}>
        ■ Policy Cap: 2,000.00 EA
      </text>
      <path d={linePath} fill="none" stroke="#0EA5E9" strokeWidth={2} />
      {data.map((v, i) => {
        const isStat = v > 2200;
        const isThresh = !isStat && v > cap;
        const cx = x(i);
        const cy = y(v);

        if (isStat) {
          // Statistical outlier rendered as a Diamond (◆) with risk red fill
          const dSize = 6.5;
          const points = `${cx},${cy - dSize} ${cx + dSize},${cy} ${cx},${cy + dSize} ${cx - dSize},${cy}`;
          return (
            <g key={i}>
              <polygon points={points} fill="#C0362C" stroke="#fff" strokeWidth={1.5} />
              <text x={cx} y={cy - 12} fontSize={10} fill="#C0362C" textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight={600}>
                ◆ Wk {i + 1} · z=3.61 (&gt;3σ Anomaly)
              </text>
            </g>
          );
        }

        if (isThresh) {
          // Business threshold breach rendered as a Square (■) with warning amber fill
          const sSize = 9;
          return (
            <g key={i}>
              <rect x={cx - sSize / 2} y={cy - sSize / 2} width={sSize} height={sSize} rx={1.5} fill="#B7791F" stroke="#fff" strokeWidth={1.5} />
              <text x={cx} y={cy - 12} fontSize={10} fill="#B7791F" textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight={600}>
                ■ Wk {i + 1} · Cap Breach (2,050.00 EA)
              </text>
            </g>
          );
        }

        return (
          <circle key={i} cx={cx} cy={cy} r={2.5} fill="#0EA5E9" />
        );
      })}
      <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#CBD5E1" />
    </svg>
  );
}

// ---- Bivariate scatter: lead time vs stockout frequency ----
export function BivariateScatterChart() {
  const W = 500, H = 320, ML = 50, MR = 20, MT = 20, MB = 38;
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
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {[0, 20, 40, 60].map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={MT} y2={H - MB} stroke="#EEF2F7" />
          <text x={x(v)} y={H - MB + 16} fontSize={10} fill="#8896A8" textAnchor="middle" fontFamily="IBM Plex Mono">{v}d</text>
        </g>
      ))}
      {[0, 5, 10, 15].map((v) => (
        <g key={v}>
          <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="#EEF2F7" />
          <text x={8} y={y(v) + 4} fontSize={10} fill="#8896A8" fontFamily="IBM Plex Mono">
            {v.toFixed(2)}%
          </text>
        </g>
      ))}
      <line x1={x(10)} y1={y(0.4)} x2={x(65)} y2={y(12.2)} stroke="#0EA5E9" strokeWidth={2} strokeDasharray="5 4" />
      {points.map((p, i) => (
        <circle key={i} cx={x(p[0])} cy={y(p[1])} r={3.5} fill="#132038" fillOpacity={0.65} />
      ))}
      {/* Annotated critical threshold and correlation */}
      <text x={x(38)} y={y(8.2)} fontSize={10} fill="#0C7EBE" fontWeight={600} fontFamily="IBM Plex Mono" textAnchor="start">
        Trend line: r = 0.74
      </text>
      <line x1={x(45)} x2={x(45)} y1={MT} y2={H - MB} stroke="#C0362C" strokeWidth={1} strokeDasharray="3 3" />
      <text x={x(47)} y={MT + 12} fontSize={9.5} fill="#C0362C" fontWeight={600} fontFamily="IBM Plex Mono">
        Risk threshold (&gt;45d)
      </text>
      <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#CBD5E1" />
      <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="#CBD5E1" />
      <text x={(ML + W - MR) / 2} y={H - 4} fontSize={10.5} fill="#5B6B82" textAnchor="middle">Supplier lead time (days)</text>
    </svg>
  );
}

// ---- ABC Pareto: top materials + cumulative value line ----
export function ParetoChart() {
  const W = 900, H = 280, ML = 62, MR = 40, MT = 20, MB = 50;
  const names = ['MAT-2041','MAT-1082','MAT-4120','MAT-3390','MAT-1177','MAT-2205','MAT-4488','MAT-3012','MAT-1955','MAT-2687','MAT-3341','MAT-1420'];
  const values = [7.30,5.58,4.83,3.90,3.40,3.05,2.70,2.40,2.10,1.85,1.62,1.40];
  let running = 0;
  const cumArr = values.map((v) => { running += v; return (running / 44.0) * 100; });
  const x = (i) => ML + (i + 0.5) * ((W - ML - MR) / values.length);
  const yv = (v) => MT + (1 - v / 8) * (H - MT - MB);
  const yp = (p) => MT + (1 - p / 100) * (H - MT - MB);
  const bw = ((W - ML - MR) / values.length) * 0.6;
  const cumPath = cumArr.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${yp(p).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {[0, 2, 4, 6, 8].map((v) => (
        <g key={v}>
          <line x1={ML} x2={W - MR} y1={yv(v)} y2={yv(v)} stroke="#EEF2F7" />
          <text x={8} y={yv(v) + 4} fontSize={10} fill="#8896A8" fontFamily="IBM Plex Mono">
            ${v.toFixed(2)}M
          </text>
        </g>
      ))}
      {values.map((v, i) => (
        <g key={i}>
          <rect x={x(i) - bw / 2} y={yv(v)} width={bw} height={(H - MB) - yv(v)} fill={i < 3 ? '#0EA5E9' : i < 7 ? '#94A3B8' : '#CBD5E1'} rx={2} />
          <text x={x(i)} y={H - MB + 16} fontSize={9.5} fill="#5B6B82" textAnchor="middle" fontFamily="IBM Plex Mono">{names[i]}</text>
        </g>
      ))}
      <path d={cumPath} fill="none" stroke="#C0362C" strokeWidth={2} />
      {cumArr.map((p, i) => <circle key={i} cx={x(i)} cy={yp(p)} r={3} fill="#C0362C" />)}
      <line x1={ML} x2={W - MR} y1={yp(78.3)} y2={yp(78.3)} stroke="#B7791F" strokeWidth={1.5} strokeDasharray="4 4" />
      <text x={W - MR} y={yp(78.3) - 8} fontSize={10} fill="#B7791F" textAnchor="end" fontFamily="IBM Plex Mono" fontWeight={600}>
        Class A boundary · 78.30% cumulative ($34.28M)
      </text>
      <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#CBD5E1" />
    </svg>
  );
}

// ---- EOQ total-cost curve with the minimum marked ----
export function EoqCurveChart({
  demand = 4800,
  orderingCost = 230,
  holdingCostPerUnit = 36,
  uom = 'EA',
} = {}) {
  const W = 900, H = 280, ML = 65, MR = 30, MT = 20, MB = 36;
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
  const legend = [['Ordering cost', '#94A3B8'], ['Holding cost', '#38BDF8'], ['Total cost', '#0EA5E9']];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const v = maxCost * f;
        return (
          <g key={f}>
            <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="#EEF2F7" />
            <text x={8} y={y(v) + 4} fontSize={10} fill="#8896A8" fontFamily="IBM Plex Mono">
              ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </text>
          </g>
        );
      })}
      <path d={pathFor('ordering')} fill="none" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 4" />
      <path d={pathFor('holding')} fill="none" stroke="#38BDF8" strokeWidth={2} strokeDasharray="5 4" />
      <path d={pathFor('total')} fill="none" stroke="#0EA5E9" strokeWidth={2} />
      <line x1={x(qStar)} x2={x(qStar)} y1={y(cStar)} y2={H - MB} stroke="#0F9D6C" strokeWidth={1.5} strokeDasharray="3 3" />
      <circle cx={x(qStar)} cy={y(cStar)} r={5} fill="#0F9D6C" stroke="#fff" strokeWidth={1.5} />
      <text x={x(qStar) + 10} y={y(cStar) - 8} fontSize={11} fill="#0F9D6C" fontFamily="IBM Plex Mono" fontWeight={600}>
        Q* = {qStar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {uom} (Min Cost: ${cStar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/yr)
      </text>
      <text x={(ML + W - MR) / 2} y={H - 4} fontSize={10.5} fill="#5B6B82" textAnchor="middle">Order quantity ({uom})</text>
      <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#CBD5E1" />
      {legend.map(([label, color], i) => (
        <g key={label}>
          <rect x={W - MR - 150} y={MT + i * 16} width={10} height={10} fill={color} />
          <text x={W - MR - 135} y={MT + i * 16 + 9} fontSize={10.5} fill="#5B6B82">{label}</text>
        </g>
      ))}
    </svg>
  );
}

// ---- BOM cascade: finished good -> sub-assemblies -> raw materials ----
export function BomCascadeChart() {
  const W = 900, H = 220;
  const Box = ({ x, y, w, h, label, sub, fill, stroke }) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + (sub ? 18 : h / 2 + 4)} fontSize={10.5} fontWeight={600} fill="#101828" textAnchor="middle">{label}</text>
      {sub && <text x={x + w / 2} y={y + 32} fontSize={9.5} fill="#5B6B82" textAnchor="middle" fontFamily="IBM Plex Mono">{sub}</text>}
    </g>
  );
  const Arrow = ({ x1, y1, x2, y2, label }) => (
    <g>
      <line x1={x1} y1={y1} x2={x2 - 8} y2={y2} stroke="#94A3B8" strokeWidth={1.5} markerEnd="url(#bomArrow)" />
      <text x={(x1 + x2) / 2} y={y1 - 8} fontSize={10.5} fill="#0C7EBE" textAnchor="middle" fontFamily="IBM Plex Mono" fontWeight={600}>{label}</text>
    </g>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <marker id="bomArrow" markerWidth={8} markerHeight={8} refX={6} refY={3} orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#94A3B8" />
        </marker>
      </defs>
      <Box x={20} y={85} w={150} h={60} label="FG-2200" sub="1,700.00 units / period" fill="#E4F4FC" stroke="#BFE6F8" />
      <Arrow x1={170} y1={115} x2={290} y2={115} label="× 1.00" />
      <Box x={290} y={20} w={150} h={60} label="Pump Module" sub="1,700.00 units" fill="#F7F9FC" stroke="#E3E8F0" />
      <Box x={290} y={150} w={150} h={60} label="Housing Module" sub="1,700.00 units" fill="#F7F9FC" stroke="#E3E8F0" />
      <Arrow x1={440} y1={50} x2={580} y2={20} label="× 1.00" />
      <Arrow x1={440} y1={50} x2={580} y2={90} label="× 1.00" />
      <Arrow x1={440} y1={180} x2={580} y2={150} label="× 1.00" />
      <Arrow x1={440} y1={180} x2={580} y2={205} label="× 2.00" />
      <Box x={580} y={0} w={310} h={40} label="MAT-1082 · Hydraulic Pump" sub="1,700.00 EA ($1.02M)" fill="#FCEAE8" stroke="#F3B8B2" />
      <Box x={580} y={65} w={310} h={40} label="MAT-4120 · Microcontroller" sub="1,700.00 EA ($133.71K)" fill="#FCEAE8" stroke="#F3B8B2" />
      <Box x={580} y={125} w={310} h={40} label="MAT-3390 · Steel Housing" sub="1,700.00 EA ($187.00K)" fill="#FBF3E3" stroke="#EAC98A" />
      <Box x={580} y={178} w={310} h={38} label="MAT-1177 · Seal Kit" sub="3,400.00 EA ($68.00K)" fill="#E9F7F1" stroke="#A9DDC6" />
    </svg>
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

  const W = 900, H = 280, ML = 70, MR = 30, MT = 24, MB = 38;

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

  // Path generators
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
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {/* Y-axis gridlines and labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const v = yMax * f;
        return (
          <g key={f}>
            <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="#EEF2F7" />
            <text x={8} y={y(v) + 4} fontSize={10} fill="#8896A8" fontFamily="IBM Plex Mono">
              {v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </text>
          </g>
        );
      })}

      {/* X-axis tick lines and labels */}
      {xTicks.map((w) => (
        <g key={w}>
          <line x1={x(w)} x2={x(w)} y1={H - MB} y2={H - MB + 5} stroke="#CBD5E1" />
          <text x={x(w)} y={H - MB + 16} fontSize={9.5} fill="#5B6B82" textAnchor="middle" fontFamily="IBM Plex Mono">
            {w === 0 ? 'Today' : w > 0 ? `+${w}w` : `${w}w`}
          </text>
        </g>
      ))}

      {/* Shaded confidence band */}
      <path d={bandPath} fill="#E4F4FC" stroke="#BFE6F8" strokeWidth={1} />

      {/* Today vertical divider */}
      <line x1={x(0)} x2={x(0)} y1={MT} y2={H - MB} stroke="#64748B" strokeWidth={1.5} strokeDasharray="4 4" />
      <text x={x(0)} y={MT - 8} fontSize={10} fill="#475569" fontFamily="IBM Plex Mono" fontWeight={700} textAnchor="middle">
        Today (Wk 0)
      </text>

      {/* Replenishment lead-time arrival marker */}
      <line x1={xLeadTime} x2={xLeadTime} y1={MT} y2={H - MB} stroke="#B7791F" strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={xLeadTime + 6} y={MT + 12} fontSize={9.5} fill="#B7791F" fontFamily="IBM Plex Mono" fontWeight={600}>
        ▲ Order arrives ({leadTimeDays}d / +{leadTimeWeeks.toFixed(1)}w)
      </text>

      {/* Historical line and points */}
      <path d={histPath} fill="none" stroke="#0EA5E9" strokeWidth={2} />
      {histPoints.map((p, i) => (
        <circle key={`h-${i}`} cx={x(p.w)} cy={y(p.val)} r={2.5} fill="#0EA5E9" />
      ))}

      {/* Projected mean line and points */}
      <path d={projPath} fill="none" stroke="#0C7EBE" strokeWidth={2} strokeDasharray="5 4" />
      {projPoints.map((p, i) => (
        <circle key={`p-${i}`} cx={x(p.h)} cy={y(p.projectedMean)} r={2.5} fill="#0C7EBE" />
      ))}
      <circle cx={x(0)} cy={y(weeklyMean)} r={3.5} fill="#0C7EBE" stroke="#fff" strokeWidth={1.5} />

      {/* Axes base lines */}
      <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="#CBD5E1" />
      <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="#CBD5E1" />

      {/* X-axis title */}
      <text x={(ML + W - MR) / 2} y={H - 6} fontSize={10.5} fill="#5B6B82" textAnchor="middle">
        Historical Consumption (16 wks) vs Projected Horizon (12 wks) · Weekly Demand ({uom})
      </text>
    </svg>
  );
}

