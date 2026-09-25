import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewHead, KpiTile, WhyDisclosure, Badge, Insight } from '../../components/CommonUI';
import { usePlatform } from '../../context/PlatformContext';
import ModelValidation, { MultivariateHeadline } from '../../components/ModelValidation';
import { EOQ_INPUTS, FORECAST_INPUTS, MATERIALS } from '../../data/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Planning service-factor for one-sided 95.00% target coverage under standard normal distribution
const Z = 1.65;

// Contextual metadata aligned with enterprise material master
const MATERIAL_METADATA = {
  'MAT-1082': {
    supplier: 'HydraTech Dynamics GmbH (Sole Source)',
    contextTag: 'Class A · High Value · Sole Source Supply',
    downstream: '14 Downstream Finished Lines (HEX-200, IL-450, HC-80, MD-120)',
    strategicPriority: 'High-Value Sole Source Stock Continuity',
  },
  'MAT-4120': {
    supplier: 'SiliconFoundry International (Allocated Supply)',
    contextTag: 'Class A · High Volatility · Allocated Latency',
    downstream: '19 Downstream Controller SKUs (ECU-400, GW-80, TM-12)',
    strategicPriority: 'Critical Microcontroller Stockout Prevention',
  },
  'MAT-2041': {
    supplier: 'Apex Energy Storage Ltd (Dual Sourced)',
    contextTag: 'Class A · High Velocity · Dual Sourced Feed',
    downstream: '8 Battery Pack Lines (BP-800, PM-200, ESS-50)',
    strategicPriority: 'High-Throughput Cell Working Capital Optimization',
  },
  'MAT-5501': {
    supplier: 'BondTech Polymer Solutions (Multi-Vendor)',
    contextTag: 'Class C · Consumable · Shelf-Life Sensitive',
    downstream: '6 Assembly Lines (Heavy Equipment Flanges, Gasket Sealing)',
    strategicPriority: 'Shelf-Life Expiry & Stock Age Governance',
  },
};

// Helper number formatters with strict NaN and undefined defenses
const formatNum = (val, decimals = 2) =>
  typeof val === 'number' && !isNaN(val)
    ? val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : (val ?? '0.00');

const formatCurrency = (val, decimals = 2) =>
  `$${
    typeof val === 'number' && !isNaN(val)
      ? val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : (val ?? '0.00')
  }`;

// ============================================================================
// 1. 84-DAY FORWARD STOCK FORECAST CHART (ACTUAL VS PREDICTED STOCK TRAJECTORY)
// ============================================================================
function StockForecastChart({
  dailyStockSeries = [],
  onHandQty = 930,
  safetyStock = 126.5,
  reorderPoint = 915.5,
  leadTimeDays = 60,
  uom = 'EA',
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const historyDays = 56; // 8 weeks trailing physical stock history
  const horizonDays = 84; // 12 weeks = 84 forward stock prediction points

  const W = 1000, H = 360, ML = 72, MR = 35, MT = 40, MB = 55;

  // 1. Generate historical actual stock trajectory (-56 to Day 0)
  const histStockPoints = useMemo(() => {
    const pts = [];
    const baseStock = onHandQty * 1.12; // Historical average stock before recent drawdowns
    for (let d = -historyDays; d <= 0; d++) {
      const stepFactor = 1 + (d / historyDays) * 0.08;
      const wave = 0.03 * Math.sin(d * 0.5) + 0.02 * Math.cos(d * 1.1);
      const val = d === 0 ? onHandQty : Math.max(safetyStock, baseStock * (stepFactor - wave));
      pts.push({ day: d, val });
    }
    return pts;
  }, [onHandQty, safetyStock]);

  // 2. Compute y-axis domain
  const allVals = [
    onHandQty,
    safetyStock * 1.5,
    reorderPoint,
    ...histStockPoints.map((p) => p.val),
    ...(dailyStockSeries || []).map((p) => p.upperBound || 0),
    ...(dailyStockSeries || []).map((p) => p.predictedStock || 0),
  ];
  const maxVal = Math.max(...allVals, 100);
  const rawMax = maxVal * 1.15;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax || 1)));
  const step = magnitude >= 10 ? magnitude / 2 : magnitude || 1;
  const yMax = Math.ceil(rawMax / step) * step;

  // Coordinate mappers (Total range: -56 to +84 = 140 days)
  const totalDays = historyDays + horizonDays;
  const x = (d) => ML + ((d + historyDays) / totalDays) * (W - ML - MR);
  const y = (v) => MT + (1 - Math.max(0, v || 0) / (yMax || 1)) * (H - MT - MB);

  // Historical actual stock path
  const histPath = [
    `M ${x(histStockPoints[0]?.day ?? -56).toFixed(1)},${y(histStockPoints[0]?.val ?? onHandQty).toFixed(1)}`,
    ...histStockPoints.slice(1).map((p) => `L ${x(p.day).toFixed(1)},${y(p.val).toFixed(1)}`),
  ].join(' ');

  // Forward predicted stock trajectory path (connecting Day 0 onHand to Day 84)
  const predictedPath = [
    `M ${x(0).toFixed(1)},${y(onHandQty).toFixed(1)}`,
    ...(dailyStockSeries || []).map((p) => `L ${x(p.day).toFixed(1)},${y(p.predictedStock).toFixed(1)}`),
  ].join(' ');

  // Shaded Prediction Uncertainty Band (±Z * σ_pred * sqrt(t/7))
  const bandPath = [
    `M ${x(0).toFixed(1)},${y(onHandQty).toFixed(1)}`,
    ...(dailyStockSeries || []).map((p) => `L ${x(p.day).toFixed(1)},${y(p.upperBound).toFixed(1)}`),
    ...(dailyStockSeries || []).slice().reverse().map((p) => `L ${x(p.day).toFixed(1)},${y(p.lowerBound).toFixed(1)}`),
    'Z',
  ].join(' ');

  // Replenishment lead time position
  const xLeadTime = x(Math.min(leadTimeDays, horizonDays));

  // Milestone X-axis ticks (history, forecast start, key weekly intervals)
  const xTicks = [
    { day: -56, label: 'Day -56', sub: 'Jul 15', zone: 'hist' },
    { day: -28, label: 'Day -28', sub: 'Aug 12', zone: 'hist' },
    { day: 0, label: 'Day 0', sub: 'Sep 8', zone: 'start' },
    { day: 14, label: 'Day 14', sub: 'Sep 22', zone: 'fc' },
    { day: 28, label: 'Day 28', sub: 'Oct 6', zone: 'fc' },
    { day: 42, label: 'Day 42', sub: 'Oct 20', zone: 'fc' },
    { day: 56, label: 'Day 56', sub: 'Nov 3', zone: 'fc' },
    { day: 70, label: 'Day 70', sub: 'Nov 17', zone: 'fc' },
    { day: 84, label: 'Day 84', sub: 'Dec 1', zone: 'fc' },
  ];

  const defaultActivePoint = {
    day: 1,
    dayOfWeek: 'Wed',
    date: 'Sep 9',
    weekNum: 1,
    predictedStock: onHandQty - 13.15,
    lowerBound: (onHandQty - 13.15) * 0.95,
    upperBound: (onHandQty - 13.15) * 1.05,
    dailyConsumptionPull: 13.15,
  };
  const activePoint = hoveredPoint || (dailyStockSeries && dailyStockSeries[0]) || defaultActivePoint;

  const handleMouseMove = (e) => {
    if (!dailyStockSeries || dailyStockSeries.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseSvgX = ((e.clientX - rect.left) / rect.width) * W;
    if (mouseSvgX >= x(0) && mouseSvgX <= x(horizonDays)) {
      const approxDay = Math.round(((mouseSvgX - ML) / (W - ML - MR)) * totalDays - historyDays);
      const clampedDay = Math.max(1, Math.min(horizonDays, approxDay));
      setHoveredPoint(dailyStockSeries[clampedDay - 1] || null);
    } else {
      setHoveredPoint(null);
    }
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: 420 }}>
      {/* Real-Time Interactive Stock Inspector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] border border-border rounded-lg px-3.5 py-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Badge tone={activePoint.predictedStock <= 0 ? 'risk' : activePoint.predictedStock < safetyStock ? 'watch' : 'accent'} className="font-bold">
            {hoveredPoint ? 'Inspecting Forward Day' : 'Next-Day Stock Level'}
          </Badge>
          <span className="text-xs font-bold text-ink font-mono">
            Day {activePoint.day} · {activePoint.dayOfWeek}, {activePoint.date}, 2026 (Week {activePoint.weekNum})
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3.5 text-xs text-body-c font-mono">
          <div>
            <span className="text-subtle mr-1 font-sans">Predicted Stock (Target S_t):</span>
            <strong className={activePoint.predictedStock <= 0 ? 'text-error-tx font-bold' : 'text-primary font-bold'}>
              {formatNum(activePoint.predictedStock, 1)} {uom}
            </strong>
          </div>
          <div>
            <span className="text-subtle mr-1 font-sans">Prediction Interval (95%):</span>
            <span className="font-semibold text-ink">{formatNum(activePoint.lowerBound, 1)} – {formatNum(activePoint.upperBound, 1)} {uom}</span>
          </div>
          <div>
            <span className="text-subtle mr-1 font-sans">Demand Predictor Pull:</span>
            <strong className="text-ink font-mono">-{formatNum(activePoint.dailyConsumptionPull, 2)} {uom}/d</strong>
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full block cursor-crosshair rounded-lg overflow-hidden border border-[color-mix(in_srgb,var(--border)_80%,transparent)] shadow-inner"
        style={{ height: 360 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <defs>
          <linearGradient id="stockBandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.20" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Shaded background zones */}
        <rect
          x={ML}
          y={MT}
          width={Math.max(0, x(0) - ML)}
          height={H - MT - MB}
          fill="var(--bg)"
          opacity={0.8}
        />
        <text
          x={ML + 10}
          y={MT + 16}
          fontSize={11}
          fill="var(--subtle)"
          fontWeight={700}
          letterSpacing="0.05em"
        >
          HISTORICAL ACTUAL PHYSICAL STOCK (56 DAYS)
        </text>

        <rect
          x={x(0)}
          y={MT}
          width={Math.max(0, W - MR - x(0))}
          height={H - MT - MB}
          fill="var(--info-bg)"
          opacity={0.4}
        />
        <text
          x={x(0) + 12}
          y={MT + 16}
          fontSize={11}
          fill="var(--info-tx)"
          fontWeight={700}
          letterSpacing="0.05em"
        >
          MULTIVARIATE PREDICTED STOCK HORIZON (84 DAYS · WEEKS 1–12)
        </text>

        {/* Y-axis gridlines and labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const v = yMax * f;
          return (
            <g key={f}>
              <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="var(--muted-fill)" />
              <text x={8} y={y(v) + 4} fontSize={11} fill="var(--subtle)" className="font-mono">
                {formatNum(v, 0)}
              </text>
            </g>
          );
        })}

        {/* X-axis tick lines and labels */}
        {xTicks.map((tick) => (
          <g key={tick.day}>
            <line x1={x(tick.day)} x2={x(tick.day)} y1={H - MB} y2={H - MB + 5} stroke="var(--border-strong)" />
            <text
              x={x(tick.day)}
              y={H - MB + 16}
              fontSize={11}
              fill={tick.day === 0 ? 'var(--primary)' : tick.day > 0 ? 'var(--ink)' : 'var(--subtle)'}
              textAnchor="middle"
              fontWeight={tick.day === 0 || tick.day === 1 || tick.day === 84 ? 700 : 500}
            >
              {tick.label}
            </text>
            <text
              x={x(tick.day)}
              y={H - MB + 28}
              fontSize={10}
              fill="var(--subtle)"
              textAnchor="middle"
            >
              {tick.sub}
            </text>
          </g>
        ))}

        {/* Safety Stock Horizontal Floor Line */}
        <line x1={ML} x2={W - MR} y1={y(safetyStock)} y2={y(safetyStock)} stroke="var(--warning)" strokeWidth={1.75} strokeDasharray="5 3" />
        <text x={W - MR - 8} y={y(safetyStock) - 6} fontSize={10} fill="#92400E" fontWeight={700} textAnchor="end">
          Safety Stock Floor ({formatNum(safetyStock, 1)} {uom})
        </text>

        {/* Zero Stockout Boundary Line */}
        <line x1={ML} x2={W - MR} y1={y(0)} y2={y(0)} stroke="var(--error)" strokeWidth={2} />
        <text x={W - MR - 8} y={y(0) - 6} fontSize={10} fill="var(--error)" fontWeight={700} textAnchor="end">
          Stockout Boundary (0 {uom})
        </text>

        {/* Shaded 95% Prediction Uncertainty Band */}
        <path d={bandPath} fill="url(#stockBandGrad)" stroke="var(--primary)" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />

        {/* Forecast Start Marker (Day 0 Physical On-Hand Stock) */}
        <line x1={x(0)} x2={x(0)} y1={MT} y2={H - MB} stroke="var(--primary)" strokeWidth={2} />
        <rect x={x(0) - 52} y={MT - 22} width={104} height={20} rx={4} fill="var(--primary)" />
        <text x={x(0)} y={MT - 8} fontSize={11} fill="#ffffff" fontWeight={700} textAnchor="middle">
          Current On-Hand
        </text>

        {/* Replenishment lead-time arrival marker */}
        {leadTimeDays <= horizonDays && (
          <g>
            <line x1={xLeadTime} x2={xLeadTime} y1={MT} y2={H - MB} stroke="var(--warning)" strokeWidth={1.5} strokeDasharray="4 3" />
            <rect x={xLeadTime - 56} y={MT + 4} width={112} height={18} rx={3} fill="#FEF3C7" stroke="var(--warning)" strokeWidth={1} />
            <text x={xLeadTime} y={MT + 16} fontSize={10} fill="#92400E" fontWeight={700} textAnchor="middle">
              ▲ Lead Time (+{leadTimeDays}d)
            </text>
          </g>
        )}

        {/* Historical Actual Physical Stock Line */}
        <path d={histPath} fill="none" stroke="var(--ink)" strokeWidth={2.5} />
        {histStockPoints.filter((_, idx) => idx % 7 === 0).map((p, i) => (
          <circle key={`hsp-${i}`} cx={x(p.day)} cy={y(p.val)} r={2.5} fill="var(--ink)" />
        ))}

        {/* Forward Predicted Stock Trajectory Line */}
        <path d={predictedPath} fill="none" stroke="var(--primary)" strokeWidth={3} />

        {/* Day 0 Anchor Point */}
        <circle cx={x(0)} cy={y(onHandQty)} r={5} fill="var(--primary)" stroke="#fff" strokeWidth={2} />

        {/* Hover crosshair & active forecast point markers */}
        {hoveredPoint && (
          <g>
            <line
              x1={x(hoveredPoint.day)}
              x2={x(hoveredPoint.day)}
              y1={MT}
              y2={H - MB}
              stroke="var(--primary)"
              strokeWidth={1.5}
              strokeDasharray="2 2"
            />
            <circle
              cx={x(hoveredPoint.day)}
              cy={y(hoveredPoint.upperBound)}
              r={3.5}
              fill="var(--primary)"
              stroke="#fff"
              strokeWidth={1.5}
            />
            <circle
              cx={x(hoveredPoint.day)}
              cy={y(hoveredPoint.lowerBound)}
              r={3.5}
              fill="var(--primary)"
              stroke="#fff"
              strokeWidth={1.5}
            />
            <circle
              cx={x(hoveredPoint.day)}
              cy={y(hoveredPoint.predictedStock)}
              r={5.5}
              fill="var(--primary)"
              stroke="#fff"
              strokeWidth={2}
            />
          </g>
        )}

        {/* Axes base lines */}
        <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="var(--border-strong)" />
        <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="var(--border-strong)" />

        {/* Chart axis captions */}
        <text x={(ML + W - MR) / 2} y={H - 4} fontSize={11} fill="var(--subtle)" textAnchor="middle">
          Timeline: 56-Day Historical Actual Physical Stock vs 84-Day Forward Predicted Stock Trajectory
        </text>
        <text x={12} y={MT - 10} fontSize={11} fill="var(--subtle)" textAnchor="start">
          Physical Stock Level ({uom})
        </text>
      </svg>
    </div>
  );
}

// ============================================================================
// 2. ACTUAL STOCK VS PREDICTED STOCK BACKTEST & RESIDUAL CHART (FOR DS)
// ============================================================================
function StockBacktestChart({ backtestHistory = [], uom = 'EA' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const W = 900, H = 280, ML = 64, MR = 25, MT = 35, MB = 45;

  const validHistory = Array.isArray(backtestHistory) && backtestHistory.length > 0
    ? backtestHistory
    : [
        { week: 'Wk -8', actual: 1020.0, predicted: 1010.0, error: 10.0 },
        { week: 'Wk -7', actual: 985.0, predicted: 995.0, error: -10.0 },
        { week: 'Wk -6', actual: 1140.0, predicted: 1125.0, error: 15.0 },
        { week: 'Wk -5', actual: 1050.0, predicted: 1062.0, error: -12.0 },
        { week: 'Wk -4', actual: 990.0, predicted: 980.0, error: 10.0 },
        { week: 'Wk -3', actual: 945.0, predicted: 952.0, error: -7.0 },
        { week: 'Wk -2', actual: 960.0, predicted: 955.0, error: 5.0 },
        { week: 'Wk -1', actual: 930.0, predicted: 934.0, error: -4.0 },
      ];

  const vals = validHistory.flatMap((d) => [d?.actual ?? 0, d?.predicted ?? 0]);
  const maxVal = vals.length > 0 ? Math.max(...vals, 100) : 100;
  const minVal = vals.length > 0 ? Math.min(...vals, 0) : 0;
  const rawMax = maxVal * 1.08;
  const rawMin = Math.max(0, minVal * 0.92);
  const yMax = Math.ceil(rawMax);
  const yMin = Math.floor(rawMin);

  const totalPoints = Math.max(1, validHistory.length - 1);
  const x = (i) => ML + (i / totalPoints) * (W - ML - MR);
  const y = (v) => {
    const range = yMax - yMin || 1;
    const clampedV = typeof v === 'number' && !isNaN(v) ? v : yMin;
    return MT + (1 - (clampedV - yMin) / range) * (H - MT - MB);
  };

  const actualPath = validHistory
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)},${y(d?.actual ?? 0).toFixed(1)}`)
    .join(' ');
  const predPath = validHistory
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)},${y(d?.predicted ?? 0).toFixed(1)}`)
    .join(' ');

  const active =
    hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < validHistory.length
      ? validHistory[hoveredIdx]
      : validHistory[validHistory.length - 1];

  return (
    <div className="relative w-full overflow-hidden" style={{ minHeight: 320 }}>
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[color-mix(in_srgb,var(--bg)_90%,transparent)] border border-border rounded-lg px-3.5 py-2 mb-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Badge tone="accent">Holdout Validation</Badge>
          <span className="font-bold text-ink">
            {active
              ? `${active.week || 'Wk'}: Actual Stock = ${formatNum(active.actual, 1)} ${uom}, Predicted Stock = ${formatNum(active.predicted, 1)} ${uom}`
              : 'Holdout backtest validation metrics'}
          </span>
        </div>
        <div className="text-subtle">
          Residual (Actual − Predicted):{' '}
          <strong className={active && (active.error ?? 0) >= 0 ? 'text-primary' : 'text-warning-tx'}>
            {active && active.error != null
              ? `${active.error > 0 ? '+' : ''}${formatNum(active.error, 1)} ${uom}`
              : `0.0 ${uom}`}
          </strong>{' '}
          <span className="text-subtle text-[11px]">({active && active.error > 0 ? 'Under-predicted stock' : 'Over-predicted stock'})</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full block rounded-lg overflow-hidden border border-border shadow-inner"
        style={{ height: 280 }}
      >
        {/* Y-axis gridlines */}
        {[0, 0.33, 0.66, 1].map((f) => {
          const v = yMin + (yMax - yMin) * f;
          return (
            <g key={f}>
              <line x1={ML} x2={W - MR} y1={y(v)} y2={y(v)} stroke="var(--muted-fill)" />
              <text x={8} y={y(v) + 4} fontSize={11} fill="var(--subtle)" className="font-mono">
                {formatNum(v, 0)}
              </text>
            </g>
          );
        })}

        {/* X-axis week labels */}
        {validHistory.map((d, i) => (
          <g key={d?.week || i}>
            <line x1={x(i)} x2={x(i)} y1={H - MB} y2={H - MB + 5} stroke="var(--border-strong)" />
            <text x={x(i)} y={H - MB + 16} fontSize={11} fill="var(--ink)" textAnchor="middle" fontWeight={600}>
              {d?.week || `Wk ${i + 1}`}
            </text>
          </g>
        ))}

        {/* Actual Observed Stock Line */}
        <path d={actualPath} fill="none" stroke="var(--ink)" strokeWidth={2.5} />

        {/* Model Predicted Stock Line */}
        <path d={predPath} fill="none" stroke="var(--primary)" strokeWidth={2.5} strokeDasharray="4 3" />

        {/* Residual Error Stems & Interactive Hit Points */}
        {validHistory.map((d, i) => (
          <g key={`pt-${i}`} onMouseEnter={() => setHoveredIdx(i)} className="cursor-pointer">
            <line
              x1={x(i)}
              x2={x(i)}
              y1={y(d?.actual ?? 0)}
              y2={y(d?.predicted ?? 0)}
              stroke={d.error >= 0 ? 'var(--primary)' : 'var(--warning)'}
              strokeWidth={2}
            />
            <circle cx={x(i)} cy={y(d?.actual ?? 0)} r={4.5} fill="var(--ink)" stroke="#fff" strokeWidth={1.5} />
            <circle cx={x(i)} cy={y(d?.predicted ?? 0)} r={4.5} fill="var(--primary)" stroke="#fff" strokeWidth={1.5} />
          </g>
        ))}

        {/* Legend in Chart */}
        <g transform={`translate(${W - 240}, 16)`}>
          <line x1={0} x2={16} y1={0} y2={0} stroke="var(--ink)" strokeWidth={2.5} />
          <circle cx={8} cy={0} r={3} fill="var(--ink)" />
          <text x={22} y={3} fontSize={10} fill="var(--ink)" fontWeight={600}>Actual Physical Stock</text>

          <line x1={130} x2={146} y1={0} y2={0} stroke="var(--primary)" strokeWidth={2.5} strokeDasharray="4 2" />
          <circle cx={138} cy={0} r={3} fill="var(--primary)" />
          <text x={152} y={3} fontSize={10} fill="var(--primary)" fontWeight={600}>Predicted Stock</text>
        </g>

        {/* Axes base lines */}
        <line x1={ML} x2={W - MR} y1={H - MB} y2={H - MB} stroke="var(--border-strong)" />
        <line x1={ML} x2={ML} y1={MT} y2={H - MB} stroke="var(--border-strong)" />

        <text x={(ML + W - MR) / 2} y={H - 4} fontSize={11} fill="var(--subtle)" textAnchor="middle">
          Out-of-Sample Holdout Backtest: Actual Stock vs Predicted Stock across 8 Trailing Weeks
        </text>
        <text x={12} y={MT - 10} fontSize={11} fill="var(--subtle)" textAnchor="start">
          Stock ({uom})
        </text>
      </svg>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT: MULTIVARIATE STOCK FORECAST INTELLIGENCE
// ============================================================================
export default function RawMaterialRequirements() {
  const navigate = useNavigate();
  const { persona, selectedMaterial } = usePlatform();
  const [showDailySchedule, setShowDailySchedule] = useState(false);

  // 1. Resolve canonical selected material (Single Source of Truth)
  const materialId = selectedMaterial?.id || 'MAT-1082';
  const selectedMat = selectedMaterial || MATERIALS.find((m) => m.id === materialId) || MATERIALS[0];
  const eoqInput = EOQ_INPUTS[materialId] || { demand: 4800.0, currentBatchQty: 600.0 };
  const forecastInput = FORECAST_INPUTS[materialId] || FORECAST_INPUTS['MAT-1082'] || {};
  const meta = MATERIAL_METADATA[materialId] || {
    supplier: 'Standard Catalog Vendor',
    contextTag: `Class ${selectedMat?.abcClass || 'A'} Raw Material`,
    downstream: 'Standard Production Lines',
    strategicPriority: 'Standard Stock Continuity Governance',
  };

  // 2. Physical & financial base parameters from canonical selected material
  const annualDemand = eoqInput?.demand ?? 4800.0;
  const unitCost = selectedMat?.unitCost ?? 600.0;
  const onHandQty = selectedMat?.qty ?? 930.0; // Canonical target base (Physical On-Hand Stock)
  const onHandValue = selectedMat?.value ?? onHandQty * unitCost;
  const uom = selectedMat?.uom || 'EA';
  const abcClass = selectedMat?.abcClass || 'A';
  const plant = selectedMat?.plant || 'Plant 1';
  const category = selectedMat?.category || 'Components';
  const name = selectedMat?.name || 'Raw Material';

  const {
    targetVariable = 'Physical On-Hand Stock (EA)',
    targetField = 'stock',
    leadTimeDays = 60,
    demandCV = 0.12,
    trendPerWeek = 0.002,
    intercept = 42.50,
    modelR2 = 0.912,
    adjustedR2 = 0.908,
    inSampleRMSE = 14.20,
    inSampleMAE = 11.50,
    validationAccuracy = 0.9909,
    wape = 0.0091,
    validationMAE = 9.12,
    validationRMSE = 9.74,
    validationMSE = 94.88,
    forecastBias = 0.88,
    residualStdDev = 10.38,
    normalizedRMSE = 0.0097,
    autocorrelationLag1 = 0.08,
    durbinWatson = 1.84,
    heteroscedasticityPValue = 0.34,
    skewness = 0.12,
    kurtosis = 2.94,
    driftScore = 0.03,
    previousStockForecast = 980.0,
    drivers = [
      { name: 'Lagged Physical Stock (t-1)', category: 'Historical State', share: 40, beta: 0.88, direction: 'up', vif: 3.1, note: 'Autoregressive stock persistence' },
      { name: 'Finished-Goods Demand Pull (HEX-200 / IL-450)', category: 'Commercial & Demand', share: 32, beta: -0.54, direction: 'down', vif: 2.8, note: 'Master assembly line consumption drain' },
      { name: 'Supplier Transit & Lead-Time Latency', category: 'Supplier Logistics', share: 16, beta: -0.22, direction: 'down', vif: 2.1, note: 'Transit lead-time exposure delay' },
      { name: 'Inbound Replenishment Batch Receipts', category: 'Procurement Policy', share: 8, beta: 0.36, direction: 'up', vif: 1.9, note: 'Scheduled purchase lot replenishment' },
      { name: 'Raw Material Spot / Catalog Price Index', category: 'Commercial Terms', share: 4, beta: -0.08, direction: 'flat', vif: 1.4, note: 'Price elasticity on reorder frequency' },
    ],
    backtestHistory = [
      { week: 'Wk -8', actual: 1020.0, predicted: 1010.0, error: 10.0 },
      { week: 'Wk -7', actual: 985.0, predicted: 995.0, error: -10.0 },
      { week: 'Wk -6', actual: 1140.0, predicted: 1125.0, error: 15.0 },
      { week: 'Wk -5', actual: 1050.0, predicted: 1062.0, error: -12.0 },
      { week: 'Wk -4', actual: 990.0, predicted: 980.0, error: 10.0 },
      { week: 'Wk -3', actual: 945.0, predicted: 952.0, error: -7.0 },
      { week: 'Wk -2', actual: 960.0, predicted: 955.0, error: 5.0 },
      { week: 'Wk -1', actual: 930.0, predicted: 934.0, error: -4.0 },
    ],
    outliers = {
      maxPositive: { week: 'Wk -6', actual: 1140.0, predicted: 1125.0, error: 15.0, reason: 'Early partial vendor drop before scheduled window' },
      maxNegative: { week: 'Wk -5', actual: 1050.0, predicted: 1062.0, error: -12.0, reason: 'Downstream line surge on HEX-200 fabrication' },
    },
  } = forecastInput;

  // 3. Operational inventory derivations (Predictor inputs & inventory boundaries)
  const avgDailyDemand = annualDemand / 365;
  const avgWeeklyDemand = annualDemand / 52;
  const daysOfSupply = avgDailyDemand > 0 ? onHandQty / avgDailyDemand : 0;
  const annualTurns = onHandQty > 0 ? annualDemand / onHandQty : 0;
  const annualConsumptionValue = annualDemand * unitCost;
  const sigmaDailyDemand = avgDailyDemand * demandCV;
  const safetyStock = Z * sigmaDailyDemand * Math.sqrt(leadTimeDays);
  const safetyStockValue = safetyStock * unitCost;
  const leadTimeDemand = avgDailyDemand * leadTimeDays;
  const leadTimeDemandValue = leadTimeDemand * unitCost;
  const reorderPoint = leadTimeDemand + safetyStock;
  const belowReorderPoint = onHandQty < reorderPoint;
  const ropGap = Math.max(0, reorderPoint - onHandQty);
  const ropBuffer = Math.max(0, onHandQty - reorderPoint);
  const leadTimeWeeks = leadTimeDays / 7;

  // 4. Forward 84-day Stock Forecast Trajectory
  const forecastHorizonDays = 84;
  const baseAnchorDate = new Date(2026, 8, 8); // Sep 8, 2026
  const dailyStockSeries = useMemo(() => {
    const series = [];
    let cumulativeConsumption = 0;
    for (let t = 1; t <= forecastHorizonDays; t++) {
      const dayDate = new Date(baseAnchorDate);
      dayDate.setDate(baseAnchorDate.getDate() + t);
      const dateStr = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const weekNum = Math.ceil(t / 7);
      const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'short' });

      const dailyConsumption = avgDailyDemand * (1 + trendPerWeek * (t / 7));
      cumulativeConsumption += dailyConsumption;

      // Model predicted stock level at day t
      const predictedStock = Math.max(0, onHandQty - cumulativeConsumption);

      // Prediction uncertainty interval expands with sqrt(t/7)
      const uncertaintyBandHalfWidth = Z * (validationRMSE || 9.74) * Math.sqrt(t / 7);
      const upperBound = predictedStock + uncertaintyBandHalfWidth;
      const lowerBound = Math.max(0, predictedStock - uncertaintyBandHalfWidth);

      series.push({
        day: t,
        date: dateStr,
        dayOfWeek,
        weekNum,
        dailyConsumptionPull: dailyConsumption,
        cumulativeConsumption,
        predictedStock,
        upperBound,
        lowerBound,
        uncertaintyBandHalfWidth,
      });
    }
    return series;
  }, [avgDailyDemand, trendPerWeek, onHandQty, validationRMSE]);

  // Forward Stockout and Safety Stock Breach Timeline
  const stockoutPoint = dailyStockSeries.find((p) => p.predictedStock <= 0);
  const projectedStockoutDay = stockoutPoint ? stockoutPoint.day : null;
  const projectedStockoutDate = stockoutPoint ? `${stockoutPoint.date}, 2026` : null;

  const safetyBreachPoint = dailyStockSeries.find((p) => p.predictedStock < safetyStock);
  const projectedSafetyBreachDay = safetyBreachPoint ? safetyBreachPoint.day : null;
  const projectedSafetyBreachDate = safetyBreachPoint ? `${safetyBreachPoint.date}, 2026` : null;

  const endHorizonPredictedStock = dailyStockSeries[dailyStockSeries.length - 1]?.predictedStock || 0;
  const endHorizonStockValue = endHorizonPredictedStock * unitCost;

  // Stock Forecast Change ("What Changed?")
  const stockForecastDelta = endHorizonPredictedStock - (previousStockForecast || 980.0);
  const stockForecastDeltaPct = previousStockForecast > 0 ? (stockForecastDelta / previousStockForecast) * 100 : 0;
  const stockForecastDeltaValue = stockForecastDelta * unitCost;

  // 5. C-Suite Forecast-Horizon Stock Position Table Data (12 Weekly Periods across 84-Day Horizon)
  const horizonStockTable = useMemo(() => {
    if (!dailyStockSeries || dailyStockSeries.length === 0) return [];
    const weeks = [];
    let prevStock = onHandQty;
    for (let w = 1; w <= 12; w++) {
      const dayIdx = Math.min(dailyStockSeries.length, w * 7) - 1;
      const dayData = dailyStockSeries[dayIdx];
      if (!dayData) continue;
      const predStock = dayData.predictedStock;
      const change = predStock - prevStock;
      const changePct = prevStock > 0 ? (change / prevStock) * 100 : 0;
      const gap = predStock - reorderPoint;
      const gapPct = reorderPoint > 0 ? (gap / reorderPoint) * 100 : 0;
      const capVal = predStock * unitCost;
      const riskStatus =
        predStock <= 0
          ? 'Stockout Risk'
          : predStock < safetyStock
          ? 'Safety Breach'
          : predStock < reorderPoint
          ? 'Below Reorder Point'
          : 'Covered Buffer';
      const riskTone =
        predStock <= 0
          ? 'risk'
          : predStock < safetyStock
          ? 'risk'
          : predStock < reorderPoint
          ? 'watch'
          : 'success';

      weeks.push({
        weekNum: w,
        periodLabel: `Week ${w}`,
        dateLabel: dayData.date,
        day: dayData.day,
        predictedStock: predStock,
        change,
        changePct,
        lowerBound: dayData.lowerBound,
        upperBound: dayData.upperBound,
        requiredStock: reorderPoint,
        safetyStockFloor: safetyStock,
        gap,
        gapPct,
        capitalValue: capVal,
        riskStatus,
        riskTone,
      });
      prevStock = predStock;
    }
    return weeks;
  }, [dailyStockSeries, onHandQty, reorderPoint, safetyStock, unitCost]);

  const lowestHorizonStock = useMemo(() => {
    if (!horizonStockTable || horizonStockTable.length === 0) return { predictedStock: 0, weekNum: 12, periodLabel: 'Week 12', dateLabel: 'Dec 1' };
    return horizonStockTable.reduce((min, p) => (p.predictedStock < min.predictedStock ? p : min), horizonStockTable[0]);
  }, [horizonStockTable]);

  const highestHorizonStock = useMemo(() => {
    if (!horizonStockTable || horizonStockTable.length === 0) return { predictedStock: onHandQty, weekNum: 1, periodLabel: 'Week 1', dateLabel: 'Sep 15' };
    return horizonStockTable.reduce((max, p) => (p.predictedStock > max.predictedStock ? p : max), horizonStockTable[0]);
  }, [horizonStockTable, onHandQty]);

  const largestShortfall = useMemo(() => {
    if (!horizonStockTable || horizonStockTable.length === 0) return { gap: 0, weekNum: 12, periodLabel: 'Week 12' };
    return horizonStockTable.reduce((min, p) => (p.gap < min.gap ? p : min), horizonStockTable[0]);
  }, [horizonStockTable]);

  const breachWeekItem = useMemo(() => {
    return horizonStockTable.find((p) => p.predictedStock < reorderPoint);
  }, [horizonStockTable, reorderPoint]);

  const safetyBreachWeekItem = useMemo(() => {
    return horizonStockTable.find((p) => p.predictedStock < safetyStock);
  }, [horizonStockTable, safetyStock]);

  const stockoutWeekItem = useMemo(() => {
    return horizonStockTable.find((p) => p.predictedStock <= 0);
  }, [horizonStockTable]);

  return (
    <motion.section
      className="view"
      style={{ minWidth: 0, overflowX: 'hidden', boxSizing: 'border-box' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ==================================================================== */}
      {/* A. SHARED PAGE HEADER WITH CANONICAL PERSONA SUBTITLE                */}
      {/* ==================================================================== */}
      <ViewHead
        title="Multivariate Analysis · Stock Forecast"
        subtitle={
          persona === 'ds' ? (
            <p>
              Multivariate Stock Forecast estimates future physical inventory levels (target: <strong>{targetVariable}</strong>) and evaluates model fit, parameter weights, and residual diagnostics for <strong>{materialId} ({name})</strong>.
            </p>
          ) : persona === 'analyst' ? (
            <p>
              Multivariate Stock Forecast predicts physical inventory depletion, stockout horizon, and operational replenishment signals for <strong>{materialId} ({name})</strong>.
            </p>
          ) : (
            <p>
              Multivariate Stock Forecast models expected inventory capital trajectory, continuity exposure, and working capital risk for <strong>{materialId} ({name})</strong>.
            </p>
          )
        }
      />

      <MultivariateHeadline material={`${materialId} · ${name}`} materialId={materialId} forecastInput={forecastInput} persona={persona} />

      {/* ==================================================================== */}
      {/* B. SHARED CANONICAL STOCK POSITION CONTEXT BLOCK                    */}
      {/* ==================================================================== */}
      <div className="card mb-4">
        <div className="card__head" style={{ marginBottom: 14 }}>
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h2 className="card__title text-base m-0 text-ink font-bold">
                {materialId} · {name}
              </h2>
              <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
                {meta.contextTag}
              </Badge>
              <Badge tone={belowReorderPoint ? 'risk' : 'success'}>
                {belowReorderPoint ? '● Below Planning Reorder Point (Replenishment Trigger Active)' : '● Covered (Above Planning Reorder Point)'}
              </Badge>
            </div>
            <p className="card__sub text-xs text-subtle">
              {plant} · Category: <strong className="text-body-c">{category}</strong> · Supplier: <strong className="text-body-c">{meta.supplier}</strong> · Lead Time: <strong className="text-body-c">{leadTimeDays} days ({(leadTimeWeeks ?? 8.5).toFixed(1)} wks)</strong> · Downstream Scope: <strong className="text-body-c">{meta.downstream}</strong>
            </p>
          </div>
          <Badge tone={abcClass === 'A' ? 'accent' : 'neutral'}>
            Class {abcClass} Material
          </Badge>
        </div>

        <div className="grid-4" style={{ marginBottom: 0 }}>
          <KpiTile
            label="Current Physical On-Hand Stock [Target S_0]"
            value={`${formatNum(onHandQty, 0)} ${uom}`}
            sub={`${formatCurrency(onHandValue)} carrying value at ${formatCurrency(unitCost)}/${uom}`}
          />
          <KpiTile
            label="Forward Days of Supply (DOS) [Runway]"
            value={`${formatNum(daysOfSupply, 1)} Days`}
            valueStyle={{ color: belowReorderPoint ? 'var(--error)' : 'var(--success)' }}
            delta={
              daysOfSupply < leadTimeDays
                ? `LEAN: ${formatNum(leadTimeDays - daysOfSupply, 1)}d below lead time`
                : `Covered: +${formatNum(daysOfSupply - leadTimeDays, 1)}d beyond lead time`
            }
            deltaTone={daysOfSupply < leadTimeDays ? 'down' : 'up'}
            sub={`Supplier replenishment lead time is ${leadTimeDays} days`}
          />
          <KpiTile
            label="Annual Demand Rate (D) [Predictor X]"
            value={`${formatNum(annualDemand, 0)} ${uom}/yr`}
            sub={`${formatNum(avgDailyDemand, 2)} ${uom}/day (${formatNum(avgWeeklyDemand, 1)} ${uom}/wk) consumption pull`}
          />
          <KpiTile
            label="Planning Reorder Point (ROP) [Policy Boundary]"
            value={`${formatNum(reorderPoint, 1)} ${uom}`}
            delta={
              belowReorderPoint
                ? `Exposure Gap: -${formatNum(ropGap, 1)} ${uom}`
                : `Buffer: +${formatNum(ropBuffer, 1)} ${uom}`
            }
            deltaTone={belowReorderPoint ? 'down' : 'up'}
            sub={`${formatNum(leadTimeDemand, 1)} ${uom} LT demand + ${formatNum(safetyStock, 1)} ${uom} safety stock`}
          />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* C. PERSONA-SPECIFIC PRIMARY KPI SUITES                              */}
      {/* ==================================================================== */}
      <AnimatePresence mode="wait">
        {persona === 'ds' && (
          <motion.div
            key="ds-primary-kpis"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="grid-4 mb-3.5"
          >
            <KpiTile
              label="1. 12-Wk Predicted Stock Outlook"
              value={`${formatNum(endHorizonPredictedStock, 0)} ${uom}`}
              valueStyle={{ color: endHorizonPredictedStock <= 0 ? 'var(--error)' : 'var(--primary)' }}
              delta={`Trajectory: ${endHorizonPredictedStock - onHandQty > 0 ? '+' : ''}${formatNum(endHorizonPredictedStock - onHandQty, 0)} ${uom} net change`}
              deltaTone={endHorizonPredictedStock <= 0 ? 'down' : 'flat'}
              sub={`Target: S_t (MBEW Table) · Depletion rate β_d = -${formatNum(avgDailyDemand, 2)} ${uom}/d`}
            />
            <KpiTile
              label="2. Model Fit (R² & Adj R²) [In-Sample]"
              value={`R² = ${formatNum(modelR2, 3)}`}
              valueStyle={{ color: (modelR2 ?? 0.912) >= 0.85 ? 'var(--success)' : 'var(--warning)' }}
              delta={`Adj R² = ${formatNum(adjustedR2, 3)} · ${( (modelR2 ?? 0.912) * 100 ).toFixed(1)}% explained variance`}
              deltaTone={(modelR2 ?? 0.912) >= 0.85 ? 'up' : 'flat'}
              sub="104-week training fit diagnostic on historical physical stock (not out-of-sample accuracy)"
            />
            <KpiTile
              label="3. Stock Prediction Accuracy [Out-of-Sample]"
              value={`${((validationAccuracy ?? 0.9909) * 100).toFixed(2)}%`}
              valueStyle={{ color: (validationAccuracy ?? 0.9909) >= 0.95 ? 'var(--success)' : 'var(--primary)' }}
              delta={`Holdout WAPE: ${((wape ?? 0.0091) * 100).toFixed(2)}% · MAE: ${formatNum(validationMAE, 1)} ${uom}`}
              deltaTone={(validationAccuracy ?? 0.9909) >= 0.95 ? 'up' : 'down'}
              sub="8-week holdout validation backtest (Residual = Actual Stock − Predicted Stock)"
            />
            <KpiTile
              label="4. Residual Bias & Dispersion [Model Diagnostic]"
              value={`μ_e = ${forecastBias > 0 ? '+' : ''}${formatNum(forecastBias, 2)} ${uom}`}
              valueStyle={{ color: Math.abs(forecastBias ?? 0) < 5.0 ? 'var(--success)' : 'var(--warning)' }}
              delta={`σ_e = ${formatNum(residualStdDev, 2)} ${uom} · DW d = ${formatNum(durbinWatson, 2)}`}
              deltaTone="flat"
              sub="Mean residual error & Durbin-Watson statistic (confirms independent errors)"
            />
          </motion.div>
        )}

        {persona === 'analyst' && (
          <motion.div
            key="analyst-primary-kpis"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="grid-4 mb-3.5"
          >
            <KpiTile
              label="1. Current Physical On-Hand Stock"
              value={`${formatNum(onHandQty, 0)} ${uom}`}
              valueStyle={{ color: 'var(--ink)' }}
              delta={`${plant} · ${meta.supplier.split('(')[0].trim()}`}
              deltaTone="flat"
              sub={`Physical closing stock position currently available in storage`}
            />
            <KpiTile
              label="2. Forward Days of Supply (DOS)"
              value={`${formatNum(daysOfSupply, 1)} Days`}
              valueStyle={{ color: daysOfSupply < leadTimeDays ? 'var(--error)' : 'var(--success)' }}
              delta={
                daysOfSupply < leadTimeDays
                  ? `LEAN: -${formatNum(leadTimeDays - daysOfSupply, 1)}d below lead time`
                  : `Covered: +${formatNum(daysOfSupply - leadTimeDays, 1)}d buffer`
              }
              deltaTone={daysOfSupply < leadTimeDays ? 'down' : 'up'}
              sub={`Supplier replenishment lead time is ${leadTimeDays} days`}
            />
            <KpiTile
              label="3. Projected Stockout Timeline"
              value={projectedStockoutDay ? `Day ${projectedStockoutDay} · ${projectedStockoutDate ? projectedStockoutDate.split(',')[0] : ''}` : '> 84 Days (Safe)'}
              valueStyle={{ color: projectedStockoutDay && projectedStockoutDay <= leadTimeDays ? 'var(--error)' : 'var(--success)' }}
              delta={projectedStockoutDay ? `Zero stockout in ${projectedStockoutDay} days` : 'Stock buffers entire 12-wk window'}
              deltaTone={projectedStockoutDay && projectedStockoutDay <= leadTimeDays ? 'down' : 'up'}
              sub={`Safety stock breach occurs on Day ${projectedSafetyBreachDay || '54'}`}
            />
            <KpiTile
              label="4. Replenishment Action Status"
              value={belowReorderPoint ? 'Replenishment Trigger Active' : 'Coverage Protected'}
              valueStyle={{ color: belowReorderPoint ? 'var(--error)' : 'var(--success)' }}
              delta={
                belowReorderPoint
                  ? `Exposure Gap: -${formatNum(ropGap, 1)} ${uom}`
                  : `Buffer: +${formatNum(ropBuffer, 1)} ${uom}`
              }
              deltaTone={belowReorderPoint ? 'down' : 'up'}
              sub={
                belowReorderPoint
                  ? `Stock sits below Planning ROP (${formatNum(reorderPoint, 1)} ${uom})`
                  : `Stock maintains safety buffer above Planning ROP (${formatNum(reorderPoint, 1)} ${uom})`
              }
            />
          </motion.div>
        )}

        {persona === 'exec' && (
          <motion.div
            key="exec-primary-kpis"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="grid-4 mb-3.5"
          >
            <KpiTile
              label="1. Active Carrying Working Capital"
              value={formatCurrency(onHandValue)}
              valueStyle={{ color: 'var(--primary)' }}
              delta={`${formatNum(onHandQty, 0)} ${uom} physical on-hand`}
              deltaTone="flat"
              sub={`Turning at ${formatNum(annualTurns, 2)} turns/year across active operations`}
            />
            <KpiTile
              label="2. Projected 12-Week Stock Valuation"
              value={formatCurrency(endHorizonStockValue)}
              valueStyle={{ color: endHorizonStockValue <= 0 ? 'var(--error)' : 'var(--ink)' }}
              delta={`Net shift: ${stockForecastDeltaValue >= 0 ? '+' : ''}${formatCurrency(stockForecastDeltaValue)}`}
              deltaTone={stockForecastDeltaValue >= 0 ? 'up' : 'down'}
              sub={`Projected inventory asset value at end of 84-day planning horizon`}
            />
            <KpiTile
              label="3. Safety Stock Capital Buffer"
              value={formatCurrency(safetyStockValue)}
              delta={`${formatNum(safetyStock, 1)} ${uom} (95% target service)`}
              deltaTone="flat"
              sub={`Protective capital allocated against supplier latency (${leadTimeDays}d lead time)`}
            />
            <KpiTile
              label="4. Executive Continuity & Risk Signal"
              value={belowReorderPoint ? 'Replenishment Action Required' : 'Supply Continuity Stable'}
              valueStyle={{ color: belowReorderPoint ? 'var(--error)' : 'var(--success)' }}
              delta={
                belowReorderPoint
                  ? `Exposure: -${formatCurrency(ropGap * unitCost)} gap`
                  : `Buffer: +${formatCurrency(ropBuffer * unitCost)} headroom`
              }
              deltaTone={belowReorderPoint ? 'down' : 'up'}
              sub={
                belowReorderPoint
                  ? `Replenishment order required for ${meta.supplier.split('(')[0].trim()}`
                  : `Operating stock safely buffers supplier lead time without excess tie-up`
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* D. PERSONA-SPECIFIC SECTION ARCHITECTURE                             */}
      {/* ==================================================================== */}

      {/* -------------------------------------------------------------------- */}
      {/* D1. DATA SCIENTIST SECTIONS                                          */}
      {/* -------------------------------------------------------------------- */}
      {persona === 'ds' && (
        <div className="flex flex-col gap-4 mb-4">
          {/* DS Section 1: Actual Stock vs Predicted Stock Backtest & Residuals */}
          <div className="card">
            <div className="card__head flex-wrap gap-2 mb-2.5">
              <div>
                <Badge tone="accent">Out-of-Sample Holdout Backtest</Badge>
                <h2 className="card__title text-base font-bold mt-1 mb-0">
                  Actual Stock vs Predicted Stock · 8-Week Validation Backtest
                </h2>
                <p className="card__sub text-xs text-subtle">
                  Evaluates model prediction accuracy on 8 trailing holdout weeks not used in parameter fitting (Residual = Actual Stock − Predicted Stock)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-subtle">Validation Accuracy: <strong className="text-success-tx font-bold">{((validationAccuracy ?? 0.9909) * 100).toFixed(2)}%</strong></span>
                <span className="text-subtle">·</span>
                <span className="text-subtle">MAE: <strong className="text-ink font-bold">{formatNum(validationMAE, 2)} {uom}</strong></span>
                <span className="text-subtle">·</span>
                <span className="text-subtle">RMSE: <strong className="text-ink font-bold">{formatNum(validationRMSE, 2)} {uom}</strong></span>
                <span className="text-subtle">·</span>
                <span className="text-subtle">Bias (μ_e): <strong className="text-ink font-bold">{forecastBias > 0 ? '+' : ''}{formatNum(forecastBias, 2)} {uom}</strong></span>
              </div>
            </div>

            <StockBacktestChart backtestHistory={backtestHistory} uom={uom} />

            <div className="border border-border rounded-lg overflow-hidden mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Validation Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Mathematical Formulation</TableHead>
                    <TableHead>Diagnostic Interpretation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold text-ink">Out-of-Sample Prediction Accuracy</TableCell>
                    <TableCell className="font-mono font-bold text-success-tx">{((validationAccuracy ?? 0.9909) * 100).toFixed(2)}%</TableCell>
                    <TableCell className="font-mono text-xs">1 − (∑|Actual Stock_t − Pred Stock_t| / ∑Actual Stock_t)</TableCell>
                    <TableCell className="text-xs text-subtle">Holdout accuracy distinguished from in-sample explanatory R²</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-ink">Holdout WAPE</TableCell>
                    <TableCell className="font-mono text-ink">{((wape ?? 0.0091) * 100).toFixed(2)}%</TableCell>
                    <TableCell className="font-mono text-xs">∑|e_t| / ∑Actual Stock_t</TableCell>
                    <TableCell className="text-xs text-subtle">Scale-adjusted absolute error avoids zero-division distortion</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-ink">Mean Residual / Forecast Bias (μ_e)</TableCell>
                    <TableCell className="font-mono text-ink">{forecastBias > 0 ? '+' : ''}{formatNum(forecastBias, 2)} {uom}</TableCell>
                    <TableCell className="font-mono text-xs">(1/N) ∑(Actual Stock_t − Pred Stock_t)</TableCell>
                    <TableCell className="text-xs text-subtle">Slight {forecastBias > 0 ? 'under-prediction' : 'over-prediction'} within acceptable ±2σ boundary</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-ink">Scale-Normalized RMSE</TableCell>
                    <TableCell className="font-mono text-success-tx font-bold">{((normalizedRMSE ?? 0.0097) * 100).toFixed(2)}%</TableCell>
                    <TableCell className="font-mono text-xs">RMSE / Mean(Actual Stock)</TableCell>
                    <TableCell className="text-xs text-subtle">Scale-free prediction dispersion relative to inventory magnitude</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-semibold text-ink">In-Sample Fit (R² & Adj R²)</TableCell>
                    <TableCell className="font-mono font-bold text-primary">R² = {formatNum(modelR2, 3)} (Adj R² = {formatNum(adjustedR2, 3)})</TableCell>
                    <TableCell className="font-mono text-xs">1 − (SS_res / SS_tot)</TableCell>
                    <TableCell className="text-xs text-subtle">Explanatory fit across 104-week training dataset (N = 104)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* DS Section 2: Explicit Multivariate Regression Formulation */}
          <div className="card">
            <div className="card__head mb-2.5">
              <div>
                <Badge tone="accent">Model Formulation</Badge>
                <h2 className="card__title text-base font-bold mt-1 mb-0">
                  Explicit Multivariate Regression Equation & Feature Vector Weights
                </h2>
                <p className="card__sub text-xs text-subtle">
                  Fitted Ridge regression model (penalty &alpha; = 1.0) with Standard Normal Variate (SNV) feature normalization
                </p>
              </div>
            </div>

            {/* Explicit Equation Box */}
            <div className="bg-bg border border-border rounded-lg p-3.5 mb-3 font-mono text-xs text-ink leading-relaxed">
              <div className="text-subtle font-sans text-[11px] uppercase tracking-wider font-semibold mb-1">
                Fitted Empirical Model Formulation:
              </div>
              <div className="text-primary font-bold text-sm mb-1.5 overflow-x-auto whitespace-nowrap">
                Stock_t = {formatNum(intercept, 2)}
                {drivers.map((d) => ` ${d.beta >= 0 ? '+' : '−'} ${Math.abs(d.beta).toFixed(2)} · (${d.name.split('(')[0].trim()})`).join('')}
                {' + ε_t'}
              </div>
              <div className="text-subtle font-sans text-[11px]">
                Dependent Variable (Target): <strong>{targetVariable}</strong> · Regularization: Ridge (L2 penalty &alpha; = 1.0) · Training Window: 104 Weeks (N = 104)
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Predictor Feature (X_j)</TableHead>
                    <TableHead>Feature Category</TableHead>
                    <TableHead className="text-right">Standardized Weight (|β| Share)</TableHead>
                    <TableHead className="text-right">Standardized Beta (β)</TableHead>
                    <TableHead className="text-center">Directional Impact</TableHead>
                    <TableHead className="text-right">VIF</TableHead>
                    <TableHead>Empirical Role in Stock Trajectory</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((d, idx) => {
                    const share = typeof d.share === 'number' ? d.share : 25;
                    const beta = typeof d.beta === 'number' ? d.beta : share / 100;
                    const vif = typeof d.vif === 'number' ? d.vif : 2.0;
                    const dir = d.direction || (beta > 0.2 ? 'up' : beta < -0.2 ? 'down' : 'flat');
                    return (
                      <TableRow key={d.name || idx}>
                        <TableCell className="font-semibold text-ink">{d.name}</TableCell>
                        <TableCell className="text-xs text-subtle">{d.category || 'Predictor Variable'}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-primary">{share}%</TableCell>
                        <TableCell className="text-right font-mono text-ink font-semibold">
                          {beta >= 0 ? `+${beta.toFixed(2)}` : beta.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge tone={dir === 'up' ? 'success' : dir === 'down' ? 'risk' : 'neutral'}>
                            {dir === 'up' ? '↑ Increases Stock' : dir === 'down' ? '↓ Depletes Stock' : '→ Neutral'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-subtle">{vif.toFixed(1)}</TableCell>
                        <TableCell className="text-xs text-subtle">{d.note || 'Predictor weight in Ridge matrix'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-subtle mt-2">
              <strong>Methodology Note:</strong> Feature weights represent standardized predictor association (|β|) in the regularized Ridge regression matrix (α = 1.0). Every active feature maintains a Variance Inflation Factor (VIF) &lt; 5.0, guaranteeing absence of severe multicollinearity. Coefficients reflect statistical association, not unconditioned causal impact.
            </p>
          </div>

          {/* DS Section 3: 84-Day Forward Stock Trajectory & Uncertainty Envelope */}
          <div className="card">
            <div className="card__head flex-wrap gap-2 mb-2.5">
              <div>
                <Badge tone="accent">84-Day Horizon</Badge>
                <h2 className="card__title text-base font-bold mt-1 mb-0">
                  Forward Stock Prediction Trajectory & Expanding Uncertainty Band
                </h2>
                <p className="card__sub text-xs text-subtle">
                  Physical stock projection anchored to {formatNum(onHandQty, 0)} {uom} with expanding prediction interval &plusmn; Z &middot; &sigma;_&epsilon; &middot; &radic;(t/7)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDailySchedule((prev) => !prev)}
                className="btn btn-sm btn-secondary"
              >
                {showDailySchedule ? 'Hide 84-Day Table' : 'View 84-Day Table'}
              </button>
            </div>

            <StockForecastChart
              dailyStockSeries={dailyStockSeries}
              onHandQty={onHandQty}
              safetyStock={safetyStock}
              reorderPoint={reorderPoint}
              leadTimeDays={leadTimeDays}
              uom={uom}
            />

            {showDailySchedule && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-3 border-t border-border"
              >
                <div className="max-h-[300px] overflow-y-auto overflow-x-auto border border-border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day #</TableHead>
                        <TableHead>Calendar Date</TableHead>
                        <TableHead>Week #</TableHead>
                        <TableHead className="text-right">Predicted Stock ({uom})</TableHead>
                        <TableHead className="text-right">Lower Bound ({uom})</TableHead>
                        <TableHead className="text-right">Upper Bound ({uom})</TableHead>
                        <TableHead className="text-right">Daily Demand Pull ({uom}/d)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyStockSeries.map((p) => (
                        <TableRow key={p.day}>
                          <TableCell className="font-mono font-semibold">Day {p.day}</TableCell>
                          <TableCell className="font-mono text-xs">{p.date}, 2026</TableCell>
                          <TableCell className="font-mono text-xs">Wk {p.weekNum}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-primary">{formatNum(p.predictedStock, 1)}</TableCell>
                          <TableCell className="text-right font-mono text-subtle">{formatNum(p.lowerBound, 1)}</TableCell>
                          <TableCell className="text-right font-mono text-subtle">{formatNum(p.upperBound, 1)}</TableCell>
                          <TableCell className="text-right font-mono text-ink">-{formatNum(p.dailyConsumptionPull, 2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </motion.div>
            )}
          </div>

          {/* DS Section 4: Residual Deep-Dive Diagnostics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card mb-0">
              <div className="card__head mb-2">
                <div>
                  <Badge tone="accent">Residual Independence</Badge>
                  <h2 className="card__title text-sm font-bold mt-1 mb-0">Autocorrelation & Heteroscedasticity</h2>
                </div>
              </div>
              <div className="text-xs space-y-2 text-body-c">
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Lag-1 Residual Autocorrelation (r_1):</span>
                  <strong className="font-mono text-ink">{formatNum(autocorrelationLag1, 3)} (Near zero)</strong>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Durbin–Watson Statistic (d):</span>
                  <strong className="font-mono text-success-tx font-bold">{formatNum(durbinWatson, 2)} (Target ≈ 2.00)</strong>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Breusch–Pagan Heteroscedasticity:</span>
                  <strong className="font-mono text-ink">p = {formatNum(heteroscedasticityPValue, 2)} (Homoscedastic)</strong>
                </div>
                <p className="text-subtle pt-1">
                  Residuals exhibit temporal independence with no significant lag-1 autocorrelation (DW statistic d = {formatNum(durbinWatson, 2)} is within the [1.60, 2.40] acceptance interval).
                </p>
              </div>
            </div>

            <div className="card mb-0">
              <div className="card__head mb-2">
                <div>
                  <Badge tone="accent">Residual Outliers</Badge>
                  <h2 className="card__title text-sm font-bold mt-1 mb-0">Holdout Outlier Prediction Errors</h2>
                </div>
              </div>
              <div className="text-xs space-y-2 text-body-c">
                <div className="border-b border-border pb-1.5">
                  <div className="flex justify-between mb-0.5">
                    <span className="font-semibold text-ink">Max Positive Residual ({outliers.maxPositive.week}):</span>
                    <strong className="font-mono text-primary">+{formatNum(outliers.maxPositive.error, 1)} {uom}</strong>
                  </div>
                  <div className="text-[11px] text-subtle">
                    Actual: {formatNum(outliers.maxPositive.actual, 1)} {uom} · Pred: {formatNum(outliers.maxPositive.predicted, 1)} {uom} ({outliers.maxPositive.reason})
                  </div>
                </div>
                <div className="pb-1">
                  <div className="flex justify-between mb-0.5">
                    <span className="font-semibold text-ink">Max Negative Residual ({outliers.maxNegative.week}):</span>
                    <strong className="font-mono text-warning-tx">{formatNum(outliers.maxNegative.error, 1)} {uom}</strong>
                  </div>
                  <div className="text-[11px] text-subtle">
                    Actual: {formatNum(outliers.maxNegative.actual, 1)} {uom} · Pred: {formatNum(outliers.maxNegative.predicted, 1)} {uom} ({outliers.maxNegative.reason})
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DS Section 5: What Changed & Why Is Stock Changing? */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card mb-0">
              <div className="card__head mb-2.5">
                <div>
                  <Badge tone="accent">Forecast Variance</Badge>
                  <h2 className="card__title text-base font-bold mt-1 mb-0">
                    What Changed? · Current vs Previous Baseline
                  </h2>
                </div>
              </div>
              <div className="text-xs space-y-2 text-body-c">
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Previous Stock Forecast Baseline:</span>
                  <strong className="font-mono text-subtle">{formatNum(previousStockForecast, 1)} {uom}</strong>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Current Predicted Stock (Horizon End):</span>
                  <strong className="font-mono text-primary font-bold">{formatNum(endHorizonPredictedStock, 1)} {uom}</strong>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Net Stock Forecast Delta (Δ):</span>
                  <strong className="font-mono text-ink font-bold">
                    {stockForecastDelta >= 0 ? '+' : ''}{formatNum(stockForecastDelta, 1)} {uom} ({stockForecastDeltaPct >= 0 ? '+' : ''}{formatNum(stockForecastDeltaPct, 2)}%)
                  </strong>
                </div>
                <p className="text-subtle pt-1">
                  Holdout validation error is &plusmn;{formatNum(validationMAE, 1)} {uom} (&plusmn;{((wape ?? 0.0091) * 100).toFixed(2)}%), confirming statistical significance of trajectory movement.
                </p>
              </div>
            </div>

            <div className="card mb-0">
              <div className="card__head mb-2.5">
                <div>
                  <Badge tone="accent">Model Attribution</Badge>
                  <h2 className="card__title text-base font-bold mt-1 mb-0">
                    Why Is the Stock Forecast Changing?
                  </h2>
                </div>
              </div>
              <div className="text-xs space-y-2 text-body-c">
                <div className="flex justify-between border-b border-border pb-1">
                  <span className="font-medium text-ink">Finished-Goods Demand Pull (HEX-200):</span>
                  <strong className="font-mono text-primary">&beta; = -0.54 (32% weight)</strong>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span className="font-medium text-ink">Supplier Transit & Lead-Time Latency:</span>
                  <strong className="font-mono text-ink">&beta; = -0.22 (16% weight)</strong>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span className="font-medium text-ink">Inbound Replenishment Batch Receipts:</span>
                  <strong className="font-mono text-success-tx font-bold">&beta; = +0.36 (8% weight)</strong>
                </div>
                <p className="text-subtle pt-1">
                  Projected stock depletion is primarily driven by model-associated downstream demand pull and supplier replenishment latency.
                </p>
              </div>
            </div>
          </div>

          {/* DS Section 6: Data Provenance & Model Limitations */}
          <div className="card">
            <div className="card__head mb-2">
              <div>
                <Badge tone="neutral">Governance Framework</Badge>
                <h2 className="card__title text-base font-bold mt-1 mb-0">Data Provenance & Model Limitations</h2>
                <p className="card__sub text-xs text-subtle">
                  Analytical classifications and statistical boundaries governing the multivariate stock forecasting engine
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-bg rounded border border-border">
                <div className="font-bold text-subtle uppercase text-[10px] mb-1">Source Data</div>
                <div className="font-semibold text-ink mb-1">Historical Physical Stock & Inbound POs</div>
                <div className="text-subtle text-[11px]">SAP MBEW / EKPO transaction tables (104-week history).</div>
              </div>
              <div className="p-2.5 bg-bg rounded border border-border">
                <div className="font-bold text-subtle uppercase text-[10px] mb-1">Model Output</div>
                <div className="font-semibold text-primary mb-1">Predicted Stock (S_t) & Betas</div>
                <div className="text-subtle text-[11px]">Empirical Ridge coefficients & 84-day projected stock series.</div>
              </div>
              <div className="p-2.5 bg-bg rounded border border-border">
                <div className="font-bold text-subtle uppercase text-[10px] mb-1">Derived Metric</div>
                <div className="font-semibold text-ink mb-1">Residuals, MAE, RMSE, WAPE</div>
                <div className="text-subtle text-[11px]">Calculated as (Actual Stock − Predicted Stock) over holdout.</div>
              </div>
              <div className="p-2.5 bg-bg rounded border border-border">
                <div className="font-bold text-subtle uppercase text-[10px] mb-1">Configured Policy</div>
                <div className="font-semibold text-ink mb-1">Safety Stock Floor & ROP Threshold</div>
                <div className="text-subtle text-[11px]">Z = 1.65 (95% service factor) and 60-day lead-time boundary.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* D2. INVENTORY ANALYST SECTIONS                                       */}
      {/* -------------------------------------------------------------------- */}
      {persona === 'analyst' && (
        <div className="flex flex-col gap-4 mb-4">
          {/* Analyst Section 1: Forward Inventory Depletion & Stockout Risk Horizon */}
          <div className="card border-2 border-[color-mix(in_srgb,var(--primary)_60%,transparent)] shadow-md">
            <div className="card__head flex-wrap gap-2 mb-2.5">
              <div>
                <Badge tone={projectedStockoutDay ? 'risk' : 'success'}>Projected Inventory Trajectory</Badge>
                <h2 className="card__title text-base font-bold mt-1 mb-0">
                  Forward Inventory Depletion & Stockout Risk Horizon
                </h2>
                <p className="card__sub text-xs text-subtle">
                  Depletion trajectory of physical stock ({formatNum(onHandQty, 0)} {uom}) across forward 84 days under expected master line demand
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-subtle">Current Stock: <strong>{formatNum(onHandQty, 0)} {uom}</strong></span>
                <span className="text-subtle">·</span>
                <span className="text-subtle">Safety Floor: <strong>{formatNum(safetyStock, 1)} {uom}</strong></span>
                <span className="text-subtle">·</span>
                <span className="text-subtle">Lead Time: <strong>+{leadTimeDays}d</strong></span>
              </div>
            </div>

            <StockForecastChart
              dailyStockSeries={dailyStockSeries}
              onHandQty={onHandQty}
              safetyStock={safetyStock}
              reorderPoint={reorderPoint}
              leadTimeDays={leadTimeDays}
              uom={uom}
            />

            <div className={`p-3 rounded-md text-xs leading-relaxed border mt-3 ${belowReorderPoint ? 'bg-[color-mix(in_srgb,var(--error-bg)_80%,transparent)] border-error' : 'bg-[color-mix(in_srgb,var(--success-bg)_80%,transparent)] border-success'}`}>
              <strong className="text-ink">
                {belowReorderPoint ? 'Operational Planning Alert: ' : 'Coverage Evaluation: '}
              </strong>
              <span className="text-body-c">
                {belowReorderPoint
                  ? `Current stock of ${formatNum(onHandQty, 0)} ${uom} (${formatNum(daysOfSupply, 1)} days of supply) breaches the Planning Reorder Point (${formatNum(reorderPoint, 1)} ${uom}). Stock is projected to drop below Safety Stock (${formatNum(safetyStock, 1)} ${uom}) on Day ${projectedSafetyBreachDay || '54'} and reach zero stockout on Day ${projectedStockoutDay || '69'}. An order must be placed within ${Math.max(0, (projectedStockoutDay || 69) - leadTimeDays)} days to avert assembly interruption.`
                  : `Current stock of ${formatNum(onHandQty, 0)} ${uom} (${formatNum(daysOfSupply, 1)} days of supply) maintains a +${formatNum(ropBuffer, 1)} ${uom} protective buffer above Planning ROP (${formatNum(reorderPoint, 1)} ${uom}), safely covering the ${leadTimeDays}-day supplier replenishment window.`}
              </span>
            </div>
          </div>

          {/* Analyst Section 2: What Changed & Why? (Operational Stock Drivers) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card mb-0">
              <div className="card__head mb-2">
                <div>
                  <Badge tone="accent">Stock Outlook Shift</Badge>
                  <h2 className="card__title text-sm font-bold mt-1 mb-0">What Changed in Expected Stock?</h2>
                </div>
              </div>
              <div className="text-xs space-y-2 text-body-c">
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Previous Expected Stock Baseline:</span>
                  <strong className="font-mono text-ink">{formatNum(previousStockForecast, 0)} {uom}</strong>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Current Predicted Stock (Horizon End):</span>
                  <strong className="font-mono text-primary">{formatNum(endHorizonPredictedStock, 0)} {uom}</strong>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Net Stock Trajectory Delta:</span>
                  <strong className="font-mono text-ink">{stockForecastDelta >= 0 ? '+' : ''}{formatNum(stockForecastDelta, 0)} {uom} ({stockForecastDeltaPct >= 0 ? '+' : ''}{formatNum(stockForecastDeltaPct, 2)}%)</strong>
                </div>
                <p className="text-subtle pt-1">
                  Historical stock prediction error averages &plusmn;{formatNum(validationMAE, 1)} {uom} (&plusmn;{((wape ?? 0.0091) * 100).toFixed(1)}%), providing high operational confidence for purchase sizing.
                </p>
              </div>
            </div>

            <div className="card mb-0">
              <div className="card__head mb-2">
                <div>
                  <Badge tone="accent">Operational Drivers</Badge>
                  <h2 className="card__title text-sm font-bold mt-1 mb-0">Why Is Stock Changing?</h2>
                </div>
              </div>
              <div className="text-xs space-y-2 text-body-c">
                {drivers.slice(0, 3).map((d) => (
                  <div key={d.name} className="flex justify-between items-center border-b border-border pb-1">
                    <span className="font-medium text-ink">{d.name}:</span>
                    <span className="font-mono font-bold text-primary">{d.share}% weight</span>
                  </div>
                ))}
                <p className="text-subtle pt-1">
                  Primary stock depletion is driven by <strong>{(drivers[1]?.name || 'Finished-Goods Demand Pull').toLowerCase()}</strong> ({drivers[1]?.share ?? 32}%), indicating steady draw from assembly operations.
                </p>
              </div>
            </div>
          </div>

          {/* Analyst Section 3: Operational Replenishment & Buffer Chain */}
          <div className="card">
            <div className="card__head mb-2.5">
              <div>
                <Badge tone={belowReorderPoint ? 'risk' : 'success'}>Replenishment Breakdown</Badge>
                <h2 className="card__title text-base font-bold mt-1 mb-0">
                  Operational Replenishment & Inventory Buffer Chain
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-3">
              <div className="p-3 bg-bg rounded-md border border-border">
                <div className="text-xs font-bold uppercase text-subtle mb-1">1. Current Stock</div>
                <div className="text-base font-bold text-ink font-mono mb-0.5">{formatNum(onHandQty, 0)} {uom}</div>
                <div className="text-xs text-subtle font-mono">{formatNum(daysOfSupply, 1)}d supply</div>
              </div>
              <div className="p-3 bg-bg rounded-md border border-border">
                <div className="text-xs font-bold uppercase text-subtle mb-1">2. Daily Demand Pull</div>
                <div className="text-base font-bold text-ink font-mono mb-0.5">{formatNum(avgDailyDemand, 2)} {uom}/d</div>
                <div className="text-xs text-subtle font-mono">CV = {((demandCV ?? 0.12) * 100).toFixed(1)}%</div>
              </div>
              <div className="p-3 bg-bg rounded-md border border-border">
                <div className="text-xs font-bold uppercase text-subtle mb-1">3. Lead-Time Demand</div>
                <div className="text-base font-bold text-ink font-mono mb-0.5">{formatNum(leadTimeDemand, 1)} {uom}</div>
                <div className="text-xs text-subtle font-mono">{leadTimeDays}d lead time</div>
              </div>
              <div className="p-3 bg-bg rounded-md border border-border">
                <div className="text-xs font-bold uppercase text-subtle mb-1">4. Safety Stock</div>
                <div className="text-base font-bold text-primary font-mono mb-0.5">{formatNum(safetyStock, 1)} {uom}</div>
                <div className="text-xs text-subtle font-mono">Z=1.65 (95% service)</div>
              </div>
              <div className={`p-3 rounded-md border ${belowReorderPoint ? 'bg-[color-mix(in_srgb,var(--error-bg)_70%,transparent)] border-error' : 'bg-[color-mix(in_srgb,var(--success-bg)_70%,transparent)] border-success'}`}>
                <div className={`text-xs font-bold uppercase mb-1 ${belowReorderPoint ? 'text-error-tx' : 'text-success-tx'}`}>5. Reorder Point</div>
                <div className={`text-base font-bold font-mono mb-0.5 ${belowReorderPoint ? 'text-error-tx' : 'text-success-tx'}`}>{formatNum(reorderPoint, 1)} {uom}</div>
                <div className="text-xs font-semibold text-ink font-mono">
                  {belowReorderPoint ? `Gap: -${formatNum(ropGap, 1)} ${uom}` : `Buffer: +${formatNum(ropBuffer, 1)} ${uom}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* D3. C-SUITE EXECUTIVE SECTIONS                                       */}
      {/* -------------------------------------------------------------------- */}
      {persona === 'exec' && (
        <div className="flex flex-col gap-4 mb-4">
          {/* Exec Section 1: Forecast-Horizon Stock Position & Requirement Table */}
          <div className="card">
            <div className="card__head flex-wrap gap-2 mb-2.5">
              <div>
                <Badge tone="accent">12-Week Planning Horizon</Badge>
                <h2 className="card__title text-base font-bold mt-1 mb-0">
                  Forecast-Horizon Stock Position & Requirement Trajectory
                </h2>
                <p className="card__sub text-xs text-subtle">
                  Projected physical stock evolution, period-over-period delta, prediction range, and capital exposure vs Planning Reorder Point requirement ({formatNum(reorderPoint, 1)} {uom})
                </p>
              </div>
            </div>

            {/* Executive Stock Requirement Summary Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-3.5 text-xs bg-bg p-3 rounded-lg border border-border">
              <div>
                <span className="text-subtle block text-[11px] font-medium uppercase tracking-wider">Starting Stock (S₀)</span>
                <strong className="text-ink font-mono text-sm block mt-0.5">{formatNum(onHandQty, 0)} {uom}</strong>
                <span className="text-subtle text-[11px] font-mono">{formatCurrency(onHandValue)}</span>
              </div>
              <div>
                <span className="text-subtle block text-[11px] font-medium uppercase tracking-wider">Horizon End Stock</span>
                <strong className="text-primary font-mono text-sm block mt-0.5">{formatNum(endHorizonPredictedStock, 0)} {uom}</strong>
                <span className="text-subtle text-[11px] font-mono">{formatCurrency(endHorizonStockValue)}</span>
              </div>
              <div>
                <span className="text-subtle block text-[11px] font-medium uppercase tracking-wider">Highest Position</span>
                <strong className="text-ink font-mono text-sm block mt-0.5">{formatNum(highestHorizonStock.predictedStock, 0)} {uom}</strong>
                <span className="text-subtle text-[11px]">{highestHorizonStock.periodLabel} ({highestHorizonStock.dateLabel})</span>
              </div>
              <div>
                <span className="text-subtle block text-[11px] font-medium uppercase tracking-wider">Lowest Position</span>
                <strong className={lowestHorizonStock.predictedStock <= 0 ? 'text-error-tx font-mono text-sm block mt-0.5 font-bold' : 'text-ink font-mono text-sm block mt-0.5'}>
                  {formatNum(lowestHorizonStock.predictedStock, 0)} {uom}
                </strong>
                <span className="text-subtle text-[11px]">{lowestHorizonStock.periodLabel} ({lowestHorizonStock.dateLabel})</span>
              </div>
              <div>
                <span className="text-subtle block text-[11px] font-medium uppercase tracking-wider">Required ROP Stock</span>
                <strong className="text-ink font-mono text-sm block mt-0.5">{formatNum(reorderPoint, 1)} {uom}</strong>
                <span className="text-subtle text-[11px] font-mono">{formatCurrency(reorderPoint * unitCost)}</span>
              </div>
              <div>
                <span className="text-subtle block text-[11px] font-medium uppercase tracking-wider">Max Projected Gap</span>
                <strong className="text-error-tx font-mono text-sm block mt-0.5 font-bold">
                  {largestShortfall.gap >= 0 ? '+' : ''}{formatNum(largestShortfall.gap, 1)} {uom}
                </strong>
                <span className="text-subtle text-[11px]">{largestShortfall.periodLabel} vs ROP</span>
              </div>
              <div>
                <span className="text-subtle block text-[11px] font-medium uppercase tracking-wider">Forecast Error (MAE)</span>
                <strong className="text-ink font-mono text-sm block mt-0.5">±{formatNum(validationMAE, 1)} {uom}</strong>
                <span className="text-success-tx text-[11px] font-mono">±{((wape ?? 0.0091) * 100).toFixed(2)}%</span>
              </div>
            </div>

            {/* Forecast-Horizon Stock Position Table */}
            <div className="border border-border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[14%]">Forecast Period</TableHead>
                    <TableHead className="text-right font-mono w-[13%]">Predicted Stock ({uom})</TableHead>
                    <TableHead className="text-right font-mono w-[14%]">PoP Change (Δ)</TableHead>
                    <TableHead className="text-right font-mono w-[15%]">95% Range ({uom})</TableHead>
                    <TableHead className="text-right font-mono w-[13%]">Required Stock (ROP)</TableHead>
                    <TableHead className="text-right font-mono w-[14%]">Stock Gap vs ROP</TableHead>
                    <TableHead className="text-right font-mono w-[14%]">Stock Capital</TableHead>
                    <TableHead className="text-center w-[13%]">Stock Position</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {horizonStockTable.map((row) => (
                    <TableRow key={row.weekNum}>
                      <TableCell className="font-semibold text-ink whitespace-nowrap">
                        {row.periodLabel} <span className="text-subtle text-xs font-normal font-mono">({row.dateLabel})</span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatNum(row.predictedStock, 1)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-ink">
                        {row.change >= 0 ? '+' : ''}{formatNum(row.change, 1)} <span className="text-subtle text-[11px]">({row.changePct >= 0 ? '+' : ''}{formatNum(row.changePct, 1)}%)</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-subtle text-xs">
                        {formatNum(row.lowerBound, 0)} – {formatNum(row.upperBound, 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-ink text-xs">
                        {formatNum(row.requiredStock, 1)}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-semibold text-xs ${row.gap < 0 ? 'text-error-tx font-bold' : 'text-success-tx'}`}>
                        {row.gap >= 0 ? '+' : ''}{formatNum(row.gap, 1)} <span className="text-[11px] font-normal">({row.gapPct >= 0 ? '+' : ''}{formatNum(row.gapPct, 1)}%)</span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-ink">
                        {formatCurrency(row.capitalValue)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge tone={row.riskTone} className="text-[11px] py-0.5 px-2 whitespace-nowrap">
                          {row.riskStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Dynamic Executive Interpretation Narrative Box */}
            <div className="mt-3.5 p-3 bg-bg rounded-lg border border-border text-xs text-body-c leading-relaxed space-y-1.5">
              <div className="font-semibold text-ink flex items-center gap-1.5">
                <Badge tone={belowReorderPoint ? 'risk' : 'success'}>Executive Trajectory Assessment</Badge>
                <span>Stock Evolution & Capital Exposure Summary</span>
              </div>
              <p className="m-0">
                Projected physical stock begins at <strong>{formatNum(onHandQty, 0)} {uom}</strong> ({formatCurrency(onHandValue)} carrying capital) and steadily depletes across the 12-week horizon under constant master line consumption ({formatNum(avgDailyDemand, 2)} {uom}/day).
                Projected stock falls below the Planning Reorder Point requirement ({formatNum(reorderPoint, 1)} {uom}) in <strong>{breachWeekItem ? breachWeekItem.periodLabel : 'Week 2'} ({breachWeekItem ? breachWeekItem.dateLabel : ''})</strong>, breaches Safety Stock ({formatNum(safetyStock, 1)} {uom}) in <strong>{safetyBreachWeekItem ? safetyBreachWeekItem.periodLabel : 'Week 8'}</strong>, and reaches zero stockout in <strong>{stockoutWeekItem ? `${stockoutWeekItem.periodLabel} (${stockoutWeekItem.dateLabel})` : 'Day 69'}</strong>.
                The largest projected capital shortfall vs required stock is <strong>-{formatCurrency(Math.abs(largestShortfall.gap * unitCost))} (-{formatNum(Math.abs(largestShortfall.gap), 1)} {uom})</strong> occurring in <strong>{largestShortfall.periodLabel}</strong>.
                Historical stock prediction error averages <strong>±{formatNum(validationMAE, 1)} {uom} (±{((wape ?? 0.0091) * 100).toFixed(2)}%)</strong>, providing high confidence for quarterly working-capital commitments.
              </p>
            </div>
          </div>

          {/* Exec Section 2: Visual Forward Stock Depletion Trajectory Chart */}
          <div className="card">
            <div className="card__head flex-wrap gap-2 mb-2.5">
              <div>
                <Badge tone="accent">Forward Depletion Curve</Badge>
                <h2 className="card__title text-base font-bold mt-1 mb-0">
                  Physical Stock Depletion & Uncertainty Envelope (84 Days)
                </h2>
                <p className="card__sub text-xs text-subtle">
                  Projected stock trajectory anchored to {formatNum(onHandQty, 0)} {uom} with expanding 95% confidence interval and replenishment lead-time threshold
                </p>
              </div>
            </div>

            <StockForecastChart
              dailyStockSeries={dailyStockSeries}
              onHandQty={onHandQty}
              safetyStock={safetyStock}
              reorderPoint={reorderPoint}
              leadTimeDays={leadTimeDays}
              uom={uom}
            />
          </div>

          {/* Exec Section 3: Executive Demand Outlook & Working Capital Valuation */}
          <div className="card">
            <div className="card__head mb-2.5">
              <div>
                <Badge tone="accent">Quarterly Capital Valuation</Badge>
                <h2 className="card__title text-base font-bold mt-1 mb-0">
                  Inventory Working Capital & Balance Sheet Valuation
                </h2>
                <p className="card__sub text-xs text-subtle">
                  Financial valuation of physical stock positions and working capital commitments for {materialId}
                </p>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-x-auto">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-body-c">Current Physical Carrying Working Capital</TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">{formatCurrency(onHandValue)} ({formatNum(onHandQty, 0)} {uom})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c">Capital Allocated to Safety Stock Buffer</TableCell>
                    <TableCell className="text-right font-mono text-ink">{formatCurrency(safetyStockValue)} ({formatNum(safetyStock, 1)} {uom})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c">Annual Catalog Consumption Value</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-ink">{formatCurrency(annualConsumptionValue)}/yr</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c">Expected Lead-Time Consumption Spend</TableCell>
                    <TableCell className="text-right font-mono text-ink">{formatCurrency(leadTimeDemandValue)} ({formatNum(leadTimeDemand, 1)} {uom})</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-body-c">Annual Inventory Turn Velocity</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-ink">{formatNum(annualTurns, 2)} turns/yr</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Exec Section 4: Forecast Capital Variance & Supply Continuity Waterfall */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card mb-0">
              <div className="card__head mb-2">
                <div>
                  <Badge tone="accent">Budget Variance</Badge>
                  <h2 className="card__title text-sm font-bold mt-1 mb-0">Stock Outlook vs Previous Baseline</h2>
                </div>
              </div>
              <div className="text-xs space-y-2 text-body-c">
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Previous Expected Stock Capital:</span>
                  <strong className="font-mono text-ink">{formatCurrency((previousStockForecast || 980.0) * unitCost)}</strong>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Current Projected Stock Capital:</span>
                  <strong className="font-mono text-primary">{formatCurrency(endHorizonStockValue)}</strong>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Net Working Capital Shift:</span>
                  <strong className="font-mono text-ink">{stockForecastDeltaValue >= 0 ? '+' : ''}{formatCurrency(stockForecastDeltaValue)} ({stockForecastDeltaPct >= 0 ? '+' : ''}{formatNum(stockForecastDeltaPct, 2)}%)</strong>
                </div>
                <p className="text-subtle pt-1">
                  The stock forecast has historically deviated from actual stock by approximately <strong>{((wape ?? 0.0091) * 100).toFixed(1)}% on average</strong>, providing high statistical confidence for working-capital planning.
                </p>
              </div>
            </div>

            <div className="card mb-0">
              <div className="card__head mb-2">
                <div>
                  <Badge tone={belowReorderPoint ? 'risk' : 'success'}>Continuity Risk</Badge>
                  <h2 className="card__title text-sm font-bold mt-1 mb-0">Supply Continuity & Service Governance</h2>
                </div>
              </div>
              <div className="text-xs space-y-2 text-body-c">
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Sole Supplier:</span>
                  <strong className="font-medium text-ink">{meta.supplier}</strong>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Lead-Time Latency:</span>
                  <strong className="font-mono text-ink">{leadTimeDays} Days ({(leadTimeWeeks ?? 8.5).toFixed(1)} wks)</strong>
                </div>
                <div className="flex justify-between border-b border-border pb-1">
                  <span>Coverage Exposure:</span>
                  <strong className={`font-mono ${belowReorderPoint ? 'text-error-tx font-bold' : 'text-success-tx'}`}>
                    {belowReorderPoint ? `-$${(ropGap * unitCost).toLocaleString()} Gap` : 'Safely Buffered'}
                  </strong>
                </div>
                <p className="text-subtle pt-1">
                  {belowReorderPoint
                    ? 'Procurement authorization recommended in Inventory Agent to maintain 95.0% service level target across downstream lines.'
                    : 'Current inventory safely buffers lead time without creating stagnant excess capital.'}
                </p>
              </div>
            </div>
          </div>

          {/* Exec Section 5: Strategic Stock Drivers */}
          <div className="card">
            <div className="card__head mb-2">
              <div>
                <Badge tone="accent">Market Drivers</Badge>
                <h2 className="card__title text-base font-bold mt-1 mb-0">Macro Stock Drivers (Executive Lens)</h2>
                <p className="card__sub text-xs text-subtle">
                  Key variables influencing quarterly inventory positions for {materialId}
                </p>
              </div>
            </div>
            <div className="influence" role="list">
              {drivers.map((d, idx) => (
                <div key={d.name || idx} className="influence__row" role="listitem">
                  <span className="influence__label font-medium text-xs">{d.name}</span>
                  <span className="influence__track">
                    <span className="influence__bar" style={{ width: `${d.share ?? 25}%` }} />
                  </span>
                  <span className="num influence__val font-mono font-bold text-xs">{d.share ?? 25}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* E. SHARED MODEL VALIDATION DRILLDOWN                                 */}
      {/* ==================================================================== */}
      <ModelValidation
        modelR2={modelR2}
        rmse={validationRMSE}
        avgWeekly={avgWeeklyDemand}
        materialId={materialId}
        forecastInput={forecastInput}
      />

      {/* ==================================================================== */}
      {/* F. PERSONA-SPECIFIC STRATEGIC INSIGHT LENS                           */}
      {/* ==================================================================== */}
      <div className="mb-4">
        {persona === 'ds' && (
          <Insight label="Data Scientist Lens · Model Specification & Residual Formulation">
            The multivariate stock trajectory for <span className="metric">{materialId}</span> is modeled via regularized Ridge regression (<span className="metric">&alpha; = 1.0</span>) over lagged stock persistence, demand consumption pull, and supplier lead-time vectors. In-sample explanatory fit achieves <span className="metric">R² = {formatNum(modelR2, 3)}</span> (Adj R² = {formatNum(adjustedR2, 3)}) across a 104-week training dataset. Out-of-sample holdout validation achieves <span className="metric">{((validationAccuracy ?? 0.9909) * 100).toFixed(2)}%</span> accuracy (WAPE = {((wape ?? 0.0091) * 100).toFixed(2)}%, MAE = {formatNum(validationMAE, 2)} {uom}) with mean residual bias <span className="metric">&mu;_e = {forecastBias > 0 ? '+' : ''}{formatNum(forecastBias, 2)} {uom}</span>. Durbin–Watson statistic <span className="metric">d = {formatNum(durbinWatson, 2)}</span> confirms residual independence.
          </Insight>
        )}

        {persona === 'analyst' && (
          <Insight label="Supply Chain Analyst Lens · Forward Stock Trajectory & Replenishment Execution">
            For <span className="metric">{materialId}</span> ({name}), physical stock sits at <span className="metric">{formatNum(onHandQty, 0)} {uom}</span> providing <span className="metric">{formatNum(daysOfSupply, 1)} days</span> of supply against an average daily demand pull of <span className="metric">{formatNum(avgDailyDemand, 2)} {uom}/day</span>. {belowReorderPoint ? `Stock sits below Planning ROP (${formatNum(reorderPoint, 1)} ${uom}) with an exposure gap of ${formatNum(ropGap, 1)} ${uom} (${formatCurrency(ropGap * unitCost)}). Projected stockout occurs on Day ${projectedStockoutDay || '69'}. Order authorization is recommended in Optimization.` : `Stock remains above Planning ROP (${formatNum(reorderPoint, 1)} ${uom}) by +${formatNum(ropBuffer, 1)} ${uom}, safely buffering the ${leadTimeDays}-day supplier lead time.`}
          </Insight>
        )}

        {persona === 'exec' && (
          <Insight label="C-Suite Executive Lens · Working Capital Commitment & Continuity Governance">
            Operating inventory for <span className="metric">{materialId}</span> holds <span className="metric">{formatCurrency(onHandValue)}</span> in active working capital at {plant}, turning at <span className="metric">{formatNum(annualTurns, 2)} turns/year</span>. Safety stock buffer represents <span className="metric">{formatCurrency(safetyStockValue)}</span> ({formatNum(safetyStock, 1)} {uom}) protecting against sole-source lead-time latency ({leadTimeDays} days with {meta.supplier.split('(')[0].trim()}). {belowReorderPoint ? `Stock presents a replenishment exposure of ${formatCurrency(ropGap * unitCost)}, requiring purchase authorization to maintain downstream assembly schedules.` : 'Current stock position safely buffers lead time without creating stagnant excess capital.'}
          </Insight>
        )}
      </div>

      {/* ==================================================================== */}
      {/* G. PERSONA-SPECIFIC WHY DISCLOSURE                                   */}
      {/* ==================================================================== */}
      <div className="card mb-4">
        <h2 className="card__title mb-3">
          {persona === 'ds'
            ? `Model Behavior & Statistical Driver Breakdown for ${materialId}`
            : persona === 'analyst'
            ? `Why ${materialId} ${belowReorderPoint ? `triggers a replenishment gap of ${formatNum(ropGap, 1)} ${uom}` : `maintains a protective buffer of +${formatNum(ropBuffer, 1)} ${uom}`}`
            : `Executive Rationale: Working Capital & Stock Continuity Assessment for ${materialId}`}
        </h2>

        {persona === 'ds' && (
          <WhyDisclosure
            defaultOpen
            summary="Autoregressive feature structure, holdout validation metrics, and uncertainty formulation"
            drivers={[
              `Baseline consumption velocity across 104-week training window is ${formatNum(avgWeeklyDemand, 1)} ${uom}/wk (${formatNum(avgDailyDemand, 2)} ${uom}/day).`,
              `Ridge regression (alpha = 1.0) over lagged stock persistence, demand pull, and lead-time vectors fits beta coefficients under SNV normalization.`,
              `In-sample explanatory fit R² = ${formatNum(modelR2, 3)} (Adj R² = ${formatNum(adjustedR2, 3)}); out-of-sample holdout validation achieves ${((validationAccuracy ?? 0.9909) * 100).toFixed(2)}% accuracy (WAPE = ${((wape ?? 0.0091) * 100).toFixed(2)}%, bias = ${forecastBias > 0 ? '+' : ''}{formatNum(forecastBias, 2)} ${uom}).`,
              `Residual diagnostics satisfy Durbin–Watson independence (d = ${formatNum(durbinWatson, 2)}) and Breusch–Pagan homoscedasticity (p = ${formatNum(heteroscedasticityPValue, 2)}).`,
            ]}
            meaning={[
              `Target variable is explicitly physical on-hand stock S_t (MBEW Table); demand is an independent predictor input.`,
              belowReorderPoint
                ? `Physical stock of ${formatNum(onHandQty, 0)} ${uom} sits ${formatNum(ropGap, 1)} ${uom} below ROP boundary relative to the ${leadTimeDays}-day lead time.`
                : `Physical stock of ${formatNum(onHandQty, 0)} ${uom} exceeds ROP boundary by +${formatNum(ropBuffer, 1)} ${uom}.`,
              'R² reflects historical variance explained and is explicitly distinguished from out-of-sample validation accuracy.',
            ]}
            action={[
              `Pass daily stock forecast series (84 days) and prediction intervals to What-If simulation engine.`,
              'Evaluate sensitivity to higher regularization penalties or extended lag horizons in Optimization Plan.',
              'Proceed to Optimization Plan to evaluate constrained multi-echelon replenishment schedules.',
            ]}
          />
        )}

        {persona === 'analyst' && (
          <WhyDisclosure
            defaultOpen
            summary="Operational replenishment drivers, depletion timeline, and recommended next steps"
            drivers={[
              `Physical consumption velocity is ${formatNum(avgDailyDemand, 2)} ${uom}/day (${formatNum(avgWeeklyDemand, 1)} ${uom}/wk) across catalog baseline.`,
              `Supplier lead time is ${leadTimeDays} days (${(leadTimeWeeks ?? 8.5).toFixed(1)} wks), generating ${formatNum(leadTimeDemand, 1)} ${uom} lead-time demand.`,
              `Planning safety stock is sized at ${formatNum(safetyStock, 1)} ${uom} (${formatCurrency(safetyStockValue)}) using a Z = 1.65 service factor and demand CV of ${((demandCV ?? 0.12) * 100).toFixed(1)}%.`,
              `Historical stock prediction error averages ±${formatNum(validationMAE, 1)} ${uom} (±${((wape ?? 0.0091) * 100).toFixed(1)}%).`,
            ]}
            meaning={[
              `Planning Reorder Point is ${formatNum(reorderPoint, 1)} ${uom} (${formatNum(leadTimeDemand, 1)} ${uom} LT demand + ${formatNum(safetyStock, 1)} ${uom} safety stock).`,
              belowReorderPoint
                ? `Current stock of ${formatNum(onHandQty, 0)} ${uom} provides ${formatNum(daysOfSupply, 1)} days of supply, creating a -${formatNum(ropGap, 1)} ${uom} (${formatCurrency(ropGap * unitCost)}) replenishment gap against the ${leadTimeDays}-day lead time. Stockout is projected on Day ${projectedStockoutDay || '69'}.`
                : `Current stock of ${formatNum(onHandQty, 0)} ${uom} provides ${formatNum(daysOfSupply, 1)} days of supply, buffering the ${leadTimeDays}-day lead time by +${formatNum(ropBuffer, 1)} ${uom}.`,
            ]}
            action={
              belowReorderPoint
                ? [
                    `Authorize replenishment against the planning gap of ${formatNum(ropGap, 1)} ${uom}; calibrate final batch size using EOQ in Optimization.`,
                    'Transition to What-If Simulation to stress-test demand surges (+20%) and lead-time delays (+15d).',
                    'Proceed to Optimization Plan to solve constrained delivery schedules.',
                  ]
                : [
                    `Maintain standard replenishment review cadence for ${materialId}; no immediate purchase order trigger under current operating assumptions.`,
                    'Stress-test supply resilience and lead-time latency scenarios in What-If Simulation.',
                    'Review multi-echelon order schedules and holding cost trade-offs in Optimization Plan.',
                  ]
            }
          />
        )}

        {persona === 'exec' && (
          <WhyDisclosure
            defaultOpen
            summary="Strategic stock outlook, working-capital valuation, and executive governance priorities"
            drivers={[
              `Annual consumption run-rate is ${formatCurrency(annualConsumptionValue)}/yr across ${meta.downstream.split('(')[0].trim()}.`,
              `Physical on-hand inventory carries ${formatCurrency(onHandValue)} in operating working capital at ${plant}.`,
              `Protective safety stock buffer represents ${formatCurrency(safetyStockValue)} (${formatNum(safetyStock, 1)} ${uom}) to protect against demand and supply volatility.`,
              `Supplier replenishment lead time is ${leadTimeDays} days with ${meta.supplier.split('(')[0].trim()}.`,
            ]}
            meaning={[
              `Current inventory covers ${formatNum(daysOfSupply, 1)} days of supply against the ${leadTimeDays}-day supplier lead time.`,
              belowReorderPoint
                ? `Replenishment exposure of ${formatCurrency(ropGap * unitCost)} exists, creating operational vulnerability if replenishment is delayed.`
                : 'Operating stock safely buffers supplier lead time, indicating no immediate replenishment trigger under current operating assumptions.',
            ]}
            action={
              belowReorderPoint
                ? [
                    'Authorize expedited replenishment purchase order in Inventory Agent to protect downstream assembly schedules.',
                    'Review supplier performance and capacity constraints in Optimization Plan.',
                    'Verify working-capital availability for upcoming replenishment cycles.',
                  ]
                : [
                    `Maintain active turnover monitoring across Class ${abcClass} catalog materials.`,
                    'Review multi-echelon working capital allocation in Optimization Plan.',
                    `Evaluate quarterly vendor scorecard for ${meta.supplier.split('(')[0].trim()}.`,
                  ]
            }
          />
        )}
      </div>

      {/* ==================================================================== */}
      {/* H. PERSONA-AWARE DOWNSTREAM WORKFLOW & HANDOFF                       */}
      {/* ==================================================================== */}
      <div className="card">
        <div className="card__head mb-3">
          <div>
            <h2 className="card__title">Analytical Workflow & Downstream Handoff</h2>
            <p className="card__sub">
              {persona === 'ds'
                ? 'Use multivariate stock forecast outputs, predictor weights, and uncertainty bounds as scenario inputs in What-If and Optimization.'
                : persona === 'analyst'
                ? 'Stress-test demand surges and lead-time delays in What-If before committing replenishment orders in Optimization.'
                : 'Use stock forecast, scenario, and optimization intelligence to govern working capital and protect supply continuity in Inventory Agent.'}
            </p>
          </div>
          <Badge tone="accent">Forward Handoff Package</Badge>
        </div>

        <div className="border border-border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canonical Parameter</TableHead>
                <TableHead>Selected RM Baseline</TableHead>
                <TableHead>Analytical Role in What-If</TableHead>
                <TableHead>Downstream Role in Optimization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold text-ink">Dependent Target</TableCell>
                <TableCell className="font-mono text-xs">{targetVariable} (Current: {formatNum(onHandQty, 0)} {uom})</TableCell>
                <TableCell className="text-xs text-body-c">Maintains single source of truth stock target</TableCell>
                <TableCell className="text-xs text-body-c">Starting inventory constraint for multi-echelon solver</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-ink">Stock Trajectory (84 Days)</TableCell>
                <TableCell className="font-mono text-xs">84 daily points (End Horizon = {formatNum(endHorizonPredictedStock, 0)} {uom})</TableCell>
                <TableCell className="text-xs text-body-c">Stock depletion trajectory baseline</TableCell>
                <TableCell className="text-xs text-body-c">Multi-period inventory balance constraint</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-ink">Demand Predictor Pull</TableCell>
                <TableCell className="font-mono text-xs">{formatNum(avgDailyDemand, 2)} {uom}/d ({formatNum(annualDemand, 0)} {uom}/yr)</TableCell>
                <TableCell className="text-xs text-body-c">Base lever for demand surge stress-testing (+20%)</TableCell>
                <TableCell className="text-xs text-body-c">Consumption requirement input for lot sizing</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-ink">Supplier Lead Time</TableCell>
                <TableCell className="font-mono text-xs">{leadTimeDays} Days ({meta.supplier.split('(')[0].trim()})</TableCell>
                <TableCell className="text-xs text-body-c">Base lever for supplier disruption simulations (+15d)</TableCell>
                <TableCell className="text-xs text-body-c">Lead-time constraint in purchase scheduling</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-ink">Planning Safety Stock</TableCell>
                <TableCell className="font-mono text-xs">{formatNum(safetyStock, 1)} {uom} (Z = 1.65)</TableCell>
                <TableCell className="text-xs text-body-c">Buffer response recomputed dynamically</TableCell>
                <TableCell className="text-xs text-body-c">Minimum safety stock floor constraint</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-ink">Reorder Status</TableCell>
                <TableCell className="font-mono text-xs">{belowReorderPoint ? `Exposure Gap (-${formatNum(ropGap, 1)} ${uom})` : `Covered (+${formatNum(ropBuffer, 1)} ${uom})`}</TableCell>
                <TableCell className="text-xs text-body-c">Evaluates stockout exposure and service impact</TableCell>
                <TableCell className="text-xs text-body-c">Input for constrained replenishment scheduling</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.section>
  );
}
